import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import type { FetchedFile } from '@/lib/github/file-fetcher'
import type { RuleMatch, AnalysisSection } from './engine'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-haiku-4-5'

// How many chars of each file to send — keeps cost low
const MAX_FILE_CHARS = 1500

function buildFileExcerpts(files: FetchedFile[]): string {
  // Prioritise non-config files for AI context
  const priority = ['routes', 'services', 'middleware', 'source']
  const sorted = [...files].sort(
    (a, b) => priority.indexOf(a.category) - priority.indexOf(b.category)
  )

  // Take top 20 files and truncate each
  return sorted
    .slice(0, 20)
    .map((f) => {
      const excerpt = f.content.slice(0, MAX_FILE_CHARS)
      const truncated = f.content.length > MAX_FILE_CHARS ? '\n... (truncated)' : ''
      return `### ${f.path}\n\`\`\`\n${excerpt}${truncated}\n\`\`\``
    })
    .join('\n\n')
}

function buildIssuesSummary(sections: AnalysisSection[]): string {
  const issues: string[] = []
  for (const section of sections) {
    for (const issue of section.issues) {
      issues.push(
        `[${issue.severity}] ${issue.ruleId} — ${issue.title} | File: ${issue.filePath}${issue.lineNumber ? `:${issue.lineNumber}` : ''} | Evidence: ${issue.evidence.slice(0, 120)}`
      )
    }
  }
  return issues.slice(0, 60).join('\n')
}

export interface ProductionReadiness {
  verdict: 'READY' | 'NEEDS_WORK' | 'NOT_READY'
  confidence: number          // 0-100
  summary: string             // 2-3 sentences on overall production readiness
  strengths: string[]         // max 4 concrete strengths observed in the code
  risks: string[]             // max 4 concrete risks for production
  recommendation: string      // one actionable sentence
}

export interface AIEnhancement {
  falsePositives: string[]           // ruleIds the AI thinks are false positives
  additionalIssues: AIIssue[]        // issues the regex missed
  repoSummary: string                // 2-3 sentence overall assessment
  enhancedSuggestions: Record<string, string> // ruleId → better suggestion
  productionReadiness: ProductionReadiness
}

export interface AIIssue {
  category: string
  title: string
  description: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  filePath: string
  suggestion: string
}

export async function enhanceAnalysisWithAI(
  files: FetchedFile[],
  sections: AnalysisSection[]
): Promise<AIEnhancement | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — skipping AI enhancement')
    return null
  }

  const fileExcerpts = buildFileExcerpts(files)
  const issuesSummary = buildIssuesSummary(sections)

  const prompt = `You are a senior software architect reviewing a GitHub repository. You have been given:
1. Excerpts from the most important source files
2. Issues detected by automated regex rules

Your job is to make the analysis MORE ACCURATE and SPECIFIC to this codebase, and to assess its production readiness.

## Source File Excerpts
${fileExcerpts}

## Detected Issues (from regex rules)
${issuesSummary}

## Your Tasks

Respond in valid JSON with this exact structure:
{
  "falsePositives": ["RULE_ID", ...],
  "additionalIssues": [
    {
      "category": "SECURITY|DATABASE|CACHING|ERROR_HANDLING|SCALABILITY|ARCHITECTURE|DEPLOYMENT",
      "title": "short title",
      "description": "specific description referencing actual code from the files above",
      "severity": "CRITICAL|WARNING|INFO",
      "filePath": "path/to/file.ts",
      "suggestion": "concrete fix specific to this codebase"
    }
  ],
  "repoSummary": "2-3 sentences assessing the overall architecture quality, specific to what you see in the code",
  "enhancedSuggestions": {
    "RULE_ID": "more specific suggestion based on the actual code"
  },
  "productionReadiness": {
    "verdict": "READY|NEEDS_WORK|NOT_READY",
    "confidence": 0-100,
    "summary": "2-3 sentences specifically about how this codebase would perform if deployed to production today — reference actual code patterns you see",
    "strengths": ["up to 4 concrete strengths you observe in the actual code, e.g. proper auth middleware, parameterized queries, etc."],
    "risks": ["up to 4 concrete production risks based on what you see, e.g. missing rate limiting on /api/auth, no error boundary in React tree, etc."],
    "recommendation": "one specific, actionable sentence about the single most important thing to fix before deploying"
  }
}

Rules:
- falsePositives: list ruleIds where the regex fired but it's NOT actually a problem
- additionalIssues: real issues the regex missed. Only include issues you can confirm from the file excerpts. Max 5.
- repoSummary: be specific — mention actual frameworks, patterns, and real concerns you see
- enhancedSuggestions: only include ones you can improve meaningfully with codebase-specific context
- productionReadiness.verdict: READY = safe to deploy with minor issues, NEEDS_WORK = has significant gaps to address first, NOT_READY = critical blockers present
- productionReadiness.confidence: your confidence in this assessment (higher = more code context available)
- All production readiness fields must reference specific things you actually see in the code, not generic advice

Return ONLY the JSON, no markdown fences, no extra text.`

  try {
    const { text } = await generateText({
      model: anthropic(MODEL),
      prompt,
      maxOutputTokens: 2000,
    })

    // Strip markdown fences if the model wrapped the JSON anyway
    const cleaned = text.trim().replace(/^```(?:json)?[\r\n]*/i, '').replace(/[\r\n]*```\s*$/, '').trim()

    let parsed: AIEnhancement
    try {
      parsed = JSON.parse(cleaned) as AIEnhancement
    } catch (parseErr) {
      console.error('AI enhancement JSON parse failed. Raw response:', text.slice(0, 500))
      return null
    }

    if (!parsed.productionReadiness) {
      console.warn('AI enhancement missing productionReadiness field')
    }

    return parsed
  } catch (err) {
    console.error('AI enhancement API call failed:', err)
    return null
  }
}

export function applyAIEnhancements(
  sections: AnalysisSection[],
  enhancement: AIEnhancement | null
): AnalysisSection[] {
  if (!enhancement) return sections

  const { falsePositives, enhancedSuggestions } = enhancement

  return sections.map((section) => ({
    ...section,
    issues: section.issues
      // Remove false positives
      .filter((issue) => !falsePositives.includes(issue.ruleId))
      // Apply enhanced suggestions
      .map((issue) => ({
        ...issue,
        suggestion: enhancedSuggestions[issue.ruleId] ?? issue.suggestion,
      })),
  }))
}
