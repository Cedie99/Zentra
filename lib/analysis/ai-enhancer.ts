import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import type { FetchedFile } from '@/lib/github/file-fetcher'
import type { RuleMatch, AnalysisSection } from './engine'
import type { TechStack } from './tech-detector'
import type { RepoContext } from './repo-context'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-haiku-4-5'

// ── Context builders ──────────────────────────────────────────────────────────

function buildFileExcerpts(files: FetchedFile[], maxFiles = 20, maxChars = 2000): string {
  const priorityOrder = ['routes', 'services', 'middleware', 'source', 'database', 'config']
  const sorted = [...files].sort((a, b) => {
    const ai = priorityOrder.indexOf(a.category)
    const bi = priorityOrder.indexOf(b.category)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
  return sorted
    .slice(0, maxFiles)
    .map((f) => {
      const excerpt = f.content.slice(0, maxChars)
      const truncated = f.content.length > maxChars ? '\n... (truncated)' : ''
      return `### ${f.path}\n\`\`\`\n${excerpt}${truncated}\n\`\`\``
    })
    .join('\n\n')
}

function buildIssuesSummary(sections: AnalysisSection[]): string {
  const issues: string[] = []
  for (const section of sections) {
    for (const issue of section.issues) {
      issues.push(
        `[${issue.severity}] ${issue.ruleId} — ${issue.title} | ${issue.filePath}${issue.lineNumber ? `:${issue.lineNumber}` : ''} | ${issue.evidence.slice(0, 100)}`
      )
    }
  }
  return issues.slice(0, 60).join('\n')
}

function buildStackSummary(techStack: TechStack): string {
  const parts: string[] = []
  if (techStack.language.length) parts.push(`Languages: ${techStack.language.join(', ')}`)
  if (techStack.framework.length) parts.push(`Frameworks: ${techStack.framework.join(', ')}`)
  if (techStack.database.length) parts.push(`Databases: ${techStack.database.join(', ')}`)
  if (techStack.orm.length) parts.push(`ORM: ${techStack.orm.join(', ')}`)
  if (techStack.auth.length) parts.push(`Auth: ${techStack.auth.join(', ')}`)
  if (techStack.cache.length) parts.push(`Cache: ${techStack.cache.join(', ')}`)
  if (techStack.queue.length) parts.push(`Queue: ${techStack.queue.join(', ')}`)
  if (techStack.testing.length) parts.push(`Testing: ${techStack.testing.join(', ')}`)
  return parts.join(' | ')
}

function buildContextSummary(context?: RepoContext): string {
  if (!context) return ''
  const parts = [
    `Deployment: ${context.deploymentTarget}`,
    `Serverless: ${context.isServerless ? 'yes' : 'no'}`,
    `Type: ${context.projectType}`,
    `Scale: ${context.scale}`,
    `Has DB: ${context.hasDatabase ? 'yes' : 'no'}`,
  ]
  if (context.readme) parts.push(`README: ${context.readme.slice(0, 300)}`)
  return parts.join(' | ')
}

// ── JSON extraction (brace-balanced, survives partial truncation) ──────────────

function extractJson(raw: string): string {
  const text = raw.trim().replace(/^```(?:json)?[\r\n]*/i, '').replace(/[\r\n]*```\s*$/i, '').trim()
  const start = text.indexOf('{')
  if (start === -1) return text
  let depth = 0
  let end = -1
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  return end !== -1 ? text.slice(start, end + 1) : text.slice(start)
}

function safeParse<T>(raw: string, label: string): T | null {
  const cleaned = extractJson(raw)
  try {
    return JSON.parse(cleaned) as T
  } catch {
    console.error(`AI ${label} JSON parse failed. Raw (first 400 chars):`, raw.slice(0, 400))
    return null
  }
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface ProductionReadiness {
  verdict: 'READY' | 'NEEDS_WORK' | 'NOT_READY'
  confidence: number
  summary: string
  strengths: string[]
  risks: string[]
  recommendation: string
}

export interface EnhancedIssueOverride {
  title: string
  description: string
  suggestion: string
}

export interface AIIssue {
  category: string
  title: string
  description: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  filePath: string
  suggestion: string
}

export interface SeverityOverride {
  ruleId: string
  newSeverity: 'CRITICAL' | 'WARNING' | 'INFO'
  reason: string
}

export interface AIEnhancement {
  falsePositives: string[]
  additionalIssues: AIIssue[]
  repoSummary: string
  enhancedIssues: Record<string, EnhancedIssueOverride>
  productionReadiness: ProductionReadiness
  severityOverrides: SeverityOverride[]
}

// ── Call 3: cross-file architecture & business logic ─────────────────────────

interface ArchitectureDeepResult {
  crossFileSmells: AIIssue[]
  businessLogicIssues: AIIssue[]
  severityOverrides: SeverityOverride[]
}

async function runArchitectureDeepAnalysis(
  fileExcerpts: string,
  issuesSummary: string,
  stackSummary: string,
  contextSummary: string
): Promise<ArchitectureDeepResult | null> {
  const prompt = `You are a principal software architect performing DEEP analysis of a GitHub repository.
Your job is to find issues that REGEX CANNOT detect — things that require understanding relationships between files, business logic correctness, and project-specific context.

## Context
${contextSummary || 'Unknown project'}
Stack: ${stackSummary || 'Unknown'}

## Source Files
${fileExcerpts}

## Already-Detected Issues (from regex)
${issuesSummary || 'None'}

Analyze for THREE things:

1. **Cross-file architecture smells**: Issues that only become visible when examining how multiple files interact.
   Examples: service calling another service's internal method directly, shared state across modules, inconsistent error handling patterns between files, data flowing through too many layers, API contracts mismatch between frontend and backend.

2. **Business logic correctness**: Logical bugs or design flaws in the actual code logic.
   Examples: race conditions in concurrent operations, missing edge cases in validation, incorrect order of operations, data that could become inconsistent, authorization checks that can be bypassed by calling a different endpoint.

3. **Context-aware severity adjustments**: For already-detected issues, determine if the severity should be DIFFERENT given this specific project's context.
   Examples: "No rate limiting" is CRITICAL for a public-facing SaaS but INFO for an internal tool. "No caching" is WARNING for a high-traffic API but INFO for an admin dashboard. "No tests" is CRITICAL for a payment service but INFO for a prototype.

Respond with ONLY this JSON (no markdown, no extra text):
{
  "crossFileSmells": [
    {
      "category": "ARCHITECTURE|SECURITY|SCALABILITY",
      "title": "≤80 chars — name the files involved",
      "description": "≤150 chars — what the cross-file problem is",
      "severity": "CRITICAL|WARNING|INFO",
      "filePath": "primary/file.ts",
      "suggestion": "≤150 chars — how to decouple or fix the relationship"
    }
  ],
  "businessLogicIssues": [
    {
      "category": "SECURITY|DATABASE|ARCHITECTURE",
      "title": "≤80 chars — name the function/endpoint with the logic bug",
      "description": "≤150 chars — what the logical flaw is and what could go wrong",
      "severity": "CRITICAL|WARNING|INFO",
      "filePath": "exact/path.ts",
      "suggestion": "≤150 chars — how to fix the logic"
    }
  ],
  "severityOverrides": [
    {
      "ruleId": "RULE_ID from detected issues",
      "newSeverity": "CRITICAL|WARNING|INFO",
      "reason": "≤100 chars — why severity should change for THIS project"
    }
  ]
}

Rules:
- crossFileSmells: max 4; ONLY include issues visible across 2+ files; do NOT repeat regex-detected issues
- businessLogicIssues: max 4; ONLY include actual logic bugs you can confirm from code; no generic advice
- severityOverrides: max 5; ONLY override if the project context clearly changes the severity
- If you cannot confirm an issue from the code shown, DO NOT include it
- STRICT: every string value must be under 150 characters
Return ONLY the JSON object.`

  try {
    const { text } = await generateText({ model: anthropic(MODEL), prompt, maxOutputTokens: 1500 })
    return safeParse<ArchitectureDeepResult>(text, 'architecture-deep')
  } catch (err) {
    console.error('Architecture deep analysis AI call failed:', err)
    return null
  }
}

// ── Call 1: issue analysis ────────────────────────────────────────────────────

interface IssueAnalysisResult {
  falsePositives: string[]
  additionalIssues: AIIssue[]
  enhancedIssues: Record<string, EnhancedIssueOverride>
}

async function runIssueAnalysis(
  fileExcerpts: string,
  issuesSummary: string,
  stackSummary: string,
  contextSummary: string
): Promise<IssueAnalysisResult | null> {
  // Only flag CRITICAL and WARNING issues for enhancement to keep output small
  const prompt = `You are a senior software architect reviewing a GitHub repository.

## Context
${contextSummary || 'Unknown project'}
Stack: ${stackSummary || 'Unknown'}

## Source Files
${fileExcerpts}

## Detected Issues
${issuesSummary || 'None'}

Respond with ONLY this JSON (no markdown, no extra text):
{
  "falsePositives": ["RULE_ID"],
  "additionalIssues": [
    {
      "category": "SECURITY|DATABASE|CACHING|ERROR_HANDLING|SCALABILITY|ARCHITECTURE|DEPLOYMENT",
      "title": "≤80 chars — name the specific file or function",
      "description": "≤150 chars — what is wrong and where exactly in this codebase",
      "severity": "CRITICAL|WARNING|INFO",
      "filePath": "exact/path.ts",
      "suggestion": "≤150 chars — fix using exact libs this repo already uses"
    }
  ],
  "enhancedIssues": {
    "RULE_ID": {
      "title": "≤80 chars — specific to this file/function",
      "description": "≤150 chars — reference the actual code pattern and file",
      "suggestion": "≤150 chars — use exact library APIs from this stack"
    }
  }
}

Rules:
- falsePositives: ruleIds where the regex fired but the code shows no real problem
- additionalIssues: real issues the regex missed; max 6; only include what you can confirm from the files above
- enhancedIssues: only rewrite rules that actually fired; skip rules you cannot make more specific; keep ALL strings under 150 chars
- STRICT: every string value must be under 150 characters. Do not write long descriptions.
Return ONLY the JSON object.`

  try {
    const { text } = await generateText({ model: anthropic(MODEL), prompt, maxOutputTokens: 2000 })
    return safeParse<IssueAnalysisResult>(text, 'issue-analysis')
  } catch (err) {
    console.error('Issue analysis AI call failed:', err)
    return null
  }
}

// ── Call 2: production readiness ──────────────────────────────────────────────

interface ReadinessResult {
  repoSummary: string
  productionReadiness: ProductionReadiness
}

async function runReadinessAssessment(
  fileExcerpts: string,
  stackSummary: string,
  contextSummary: string,
  issuesSummary: string
): Promise<ReadinessResult | null> {
  const prompt = `You are a senior software architect assessing production readiness of a specific GitHub repository.

## Context
${contextSummary || 'Unknown project'}
Stack: ${stackSummary || 'Unknown'}

## Issues Found
${issuesSummary || 'None'}

## Key Source Files
${fileExcerpts}

Respond with ONLY this JSON (no markdown, no extra text):
{
  "repoSummary": "2 sentences max — name the actual framework and the most critical concern",
  "productionReadiness": {
    "verdict": "READY|NEEDS_WORK|NOT_READY",
    "confidence": 0-100,
    "summary": "2 sentences — how this specific codebase performs in production; name actual files/routes",
    "strengths": ["≤100 chars each — name actual files, patterns, or libs used correctly; max 4"],
    "risks": ["≤100 chars each — name specific file/endpoint/function at risk; max 4"],
    "recommendation": "≤120 chars — one specific action, name the file or pattern to fix first"
  }
}

- verdict: READY = minor issues only, NEEDS_WORK = significant gaps, NOT_READY = critical blockers
- confidence: higher when you have more code context
- Reference specific things from the files above, not generic advice
Return ONLY the JSON object.`

  try {
    const { text } = await generateText({ model: anthropic(MODEL), prompt, maxOutputTokens: 800 })
    return safeParse<ReadinessResult>(text, 'readiness-assessment')
  } catch (err) {
    console.error('Readiness assessment AI call failed:', err)
    return null
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function enhanceAnalysisWithAI(
  files: FetchedFile[],
  sections: AnalysisSection[],
  techStack: TechStack,
  context?: RepoContext
): Promise<AIEnhancement | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — skipping AI enhancement')
    return null
  }

  const fileExcerpts = buildFileExcerpts(files)
  const issuesSummary = buildIssuesSummary(sections)
  const stackSummary = buildStackSummary(techStack)
  const contextSummary = buildContextSummary(context)

  // Run all three calls in parallel — independent of each other
  const [issueResult, readinessResult, archResult] = await Promise.all([
    runIssueAnalysis(fileExcerpts, issuesSummary, stackSummary, contextSummary),
    runReadinessAssessment(fileExcerpts, stackSummary, contextSummary, issuesSummary),
    runArchitectureDeepAnalysis(fileExcerpts, issuesSummary, stackSummary, contextSummary),
  ])

  if (!issueResult && !readinessResult && !archResult) return null

  // Normalise enhancedIssues — accept legacy enhancedSuggestions shape too
  let enhancedIssues: Record<string, EnhancedIssueOverride> = issueResult?.enhancedIssues ?? {}
  if (!issueResult?.enhancedIssues && (issueResult as any)?.enhancedSuggestions) {
    const legacy = (issueResult as any).enhancedSuggestions as Record<string, string>
    enhancedIssues = Object.fromEntries(
      Object.entries(legacy).map(([id, suggestion]) => [id, { title: '', description: '', suggestion }])
    )
  }

  // Merge additional issues from architecture deep analysis
  const additionalIssues: AIIssue[] = [
    ...(issueResult?.additionalIssues ?? []),
    ...(archResult?.crossFileSmells ?? []),
    ...(archResult?.businessLogicIssues ?? []),
  ]

  return {
    falsePositives: issueResult?.falsePositives ?? [],
    additionalIssues,
    enhancedIssues,
    repoSummary: readinessResult?.repoSummary ?? '',
    productionReadiness: readinessResult?.productionReadiness ?? {
      verdict: 'NEEDS_WORK',
      confidence: 30,
      summary: 'Insufficient code context to fully assess production readiness.',
      strengths: [],
      risks: [],
      recommendation: 'Run a full analysis with more files for a complete assessment.',
    },
    severityOverrides: archResult?.severityOverrides ?? [],
  }
}

// ── Apply enhancements to sections ───────────────────────────────────────────

export function applyAIEnhancements(
  sections: AnalysisSection[],
  enhancement: AIEnhancement | null
): AnalysisSection[] {
  if (!enhancement) return sections

  const { falsePositives, enhancedIssues, severityOverrides } = enhancement

  // Build a map of severity overrides for fast lookup
  const severityMap = new Map<string, 'CRITICAL' | 'WARNING' | 'INFO'>()
  for (const override of severityOverrides) {
    if (override.ruleId && override.newSeverity) {
      severityMap.set(override.ruleId, override.newSeverity)
    }
  }

  return sections.map((section) => ({
    ...section,
    issues: section.issues
      .filter((issue) => !falsePositives.includes(issue.ruleId))
      .map((issue): RuleMatch => {
        const override = enhancedIssues[issue.ruleId]
        const newSeverity = severityMap.get(issue.ruleId)
        return {
          ...issue,
          title: override?.title?.trim() || issue.title,
          description: override?.description?.trim() || issue.description,
          suggestion: override?.suggestion?.trim() || issue.suggestion,
          severity: newSeverity || issue.severity,
        }
      }),
  }))
}
