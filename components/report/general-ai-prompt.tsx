'use client'

import { Sparkles, Copy, Check, ChevronUp, Wand2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import type { Report } from '@/app/(dashboard)/reports/[id]/page'

interface GeneralAiPromptProps {
  report: Report
}

function buildGeneralPrompt(report: Report): string {
  const lines: string[] = []

  lines.push(`I need help fixing architectural and code quality issues in my repository.`)
  lines.push(``)
  lines.push(`## Repository`)
  lines.push(`**Name:** ${report.repository.fullName}`)
  if (report.repository.description) {
    lines.push(`**Description:** ${report.repository.description}`)
  }
  if (report.repository.language) {
    lines.push(`**Primary language:** ${report.repository.language}`)
  }

  const stackEntries = Object.entries(report.techStack ?? {})
  if (stackEntries.length > 0) {
    lines.push(`**Tech stack:**`)
    for (const [category, tools] of stackEntries) {
      if (tools.length > 0) {
        lines.push(`  - ${category}: ${tools.join(', ')}`)
      }
    }
  }

  lines.push(``)
  lines.push(`## Analysis Summary`)
  if (report.healthScore !== null) {
    lines.push(`**Health score:** ${report.healthScore}/100`)
  }
  lines.push(`**Critical issues:** ${report.criticalCount}`)
  lines.push(`**Warnings:** ${report.warningCount}`)
  lines.push(`**Info:** ${report.infoCount}`)
  if (report.filesAnalyzed) {
    lines.push(`**Files analyzed:** ${report.filesAnalyzed}`)
  }

  if (report.productionReadiness) {
    const pr = report.productionReadiness
    lines.push(``)
    lines.push(`## Production Readiness`)
    lines.push(`**Verdict:** ${pr.verdict.replace('_', ' ')}`)
    lines.push(`**Confidence:** ${pr.confidence}%`)
    lines.push(`**Summary:** ${pr.summary}`)
    if (pr.strengths.length > 0) {
      lines.push(`**Strengths:**`)
      for (const s of pr.strengths) lines.push(`  - ${s}`)
    }
    if (pr.risks.length > 0) {
      lines.push(`**Risks:**`)
      for (const r of pr.risks) lines.push(`  - ${r}`)
    }
    lines.push(`**Recommendation:** ${pr.recommendation}`)
  }

  if (report.aiSummary) {
    lines.push(``)
    lines.push(`## AI Overview`)
    lines.push(report.aiSummary)
  }

  const sectionsWithIssues = report.sections.filter((s) => s.issues.length > 0)
  if (sectionsWithIssues.length > 0) {
    lines.push(``)
    lines.push(`## Issues by Category`)
    for (const section of sectionsWithIssues) {
      lines.push(``)
      lines.push(`### ${section.title} (${section.category})`)
      for (const issue of section.issues) {
        lines.push(``)
        lines.push(`#### [${issue.severity}] ${issue.title}`)
        if (issue.filePath) {
          lines.push(`**File:** ${issue.filePath}${issue.lineNumber ? `:${issue.lineNumber}` : ''}`)
        }
        lines.push(`**Problem:** ${issue.description}`)
        if (issue.evidence) {
          lines.push(`**Evidence:**`)
          lines.push('```')
          lines.push(issue.evidence)
          lines.push('```')
        }
        lines.push(`**Suggested fix:** ${issue.suggestion}`)
        if (issue.codeExample) {
          lines.push(`**Fix example:**`)
          lines.push('```')
          lines.push(issue.codeExample)
          lines.push('```')
        }
      }
    }
  }

  lines.push(``)
  lines.push(`---`)
  lines.push(`Please review all of the issues above and help me understand:`)
  lines.push(`1. Which issues are the most urgent to fix and why`)
  lines.push(`2. How the issues relate to each other (e.g. fixing one might fix others)`)
  lines.push(`3. A recommended order to tackle them`)
  lines.push(`4. For each critical/warning issue, provide the corrected code or specific steps to fix it`)

  return lines.join('\n')
}

export function GeneralAiPrompt({ report }: GeneralAiPromptProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const prompt = buildGeneralPrompt(report)
  const totalIssues = report.criticalCount + report.warningCount + report.infoCount

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [prompt])

  return (
    <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Fix everything with AI</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get a full review and prioritized fix plan for all {totalIssues} issues from any AI assistant.
            </p>
          </div>
        </div>

        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all duration-200 flex-shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Hand off to AI
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <pre
            className="text-xs text-foreground/70 bg-background/60 border border-border rounded-xl px-4 py-3 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto"
            data-lenis-prevent
          >
            {prompt}
          </pre>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Copy and paste into ChatGPT, Claude, Gemini, or any AI assistant.
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              >
                <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                Hide
              </button>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  copied
                    ? 'bg-green-500/15 border-green-500/30 text-green-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={2} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
