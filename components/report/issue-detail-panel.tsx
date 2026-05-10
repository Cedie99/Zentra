'use client'

import { X, AlertTriangle, XCircle, Info, MapPin, Lightbulb, Code, FileSearch, Sparkles, Copy, Check } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import type { Issue } from '@/app/(dashboard)/reports/[id]/page'

interface IssueDetailPanelProps {
  issue: Issue
  onClose: () => void
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    icon: XCircle,
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    pill: 'bg-red-500/15 text-red-400 border border-red-500/25',
    headerBg: 'bg-red-500/5',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
    pill: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
    headerBg: 'bg-yellow-500/5',
  },
  INFO: {
    icon: Info,
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    pill: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
    headerBg: 'bg-blue-500/5',
  },
}

function buildPrompt(issue: Issue): string {
  const lines: string[] = []
  lines.push(`I have a ${issue.severity.toLowerCase()} issue in my codebase that I need help fixing.`)
  lines.push('')
  lines.push(`**Issue:** ${issue.title}`)
  if (issue.filePath) {
    lines.push(`**File:** ${issue.filePath}${issue.lineNumber ? `:${issue.lineNumber}` : ''}`)
  }
  lines.push('')
  lines.push(`**Problem:**`)
  lines.push(issue.description)
  if (issue.evidence) {
    lines.push('')
    lines.push(`**Evidence found in code:**`)
    lines.push('```')
    lines.push(issue.evidence)
    lines.push('```')
  }
  lines.push('')
  lines.push(`**Suggested fix:**`)
  lines.push(issue.suggestion)
  if (issue.codeExample) {
    lines.push('')
    lines.push(`**Example fix:**`)
    lines.push('```')
    lines.push(issue.codeExample)
    lines.push('```')
  }
  lines.push('')
  lines.push(`Please help me fix this issue. Show me the corrected code and explain what you changed.`)
  return lines.join('\n')
}

export function IssueDetailPanel({ issue, onClose }: IssueDetailPanelProps) {
  const cfg = SEVERITY_CONFIG[issue.severity] ?? SEVERITY_CONFIG.INFO
  const Icon = cfg.icon
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildPrompt(issue)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [issue])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Centered modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto">

          {/* Header */}
          <div className={`${cfg.headerBg} border-b border-border rounded-t-2xl flex-shrink-0`}>
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${cfg.pill}`}>
                      {issue.severity}
                    </span>
                    {issue.isAiAdded && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg">
                        <Sparkles className="w-3 h-3" />
                        AI discovered
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-foreground leading-snug">{issue.title}</h2>
                  {issue.filePath && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                      <code className="text-xs font-mono text-muted-foreground">
                        {issue.filePath}{issue.lineNumber ? `:${issue.lineNumber}` : ''}
                      </code>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" data-lenis-prevent>

            {/* What's the problem */}
            <section>
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <FileSearch className="w-3.5 h-3.5" strokeWidth={1.5} />
                What's the problem
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{issue.description}</p>
            </section>

            {/* Evidence */}
            {issue.evidence && (
              <section>
                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  <Code className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Evidence found
                </h3>
                <pre className="text-xs bg-secondary text-foreground/75 px-4 py-3 rounded-xl font-mono overflow-x-auto border border-border leading-relaxed whitespace-pre-wrap break-all">
                  {issue.evidence}
                </pre>
              </section>
            )}

            {/* How to fix */}
            <section className="bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
                <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />
                How to fix it
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{issue.suggestion}</p>
            </section>

            {/* Code example */}
            {issue.codeExample && (
              <section>
                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
                  <Code className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Fix example
                </h3>
                <pre className="text-xs bg-secondary text-green-300 px-4 py-3 rounded-xl font-mono overflow-x-auto border border-green-500/20 leading-relaxed">
                  {issue.codeExample}
                </pre>
              </section>
            )}
            {/* AI Prompt */}
            <section className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Fix with AI
                </h3>
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
                      Copy prompt
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Paste this into ChatGPT, Claude, Gemini, or any AI to get a targeted fix for this issue.
              </p>
              <pre className="text-xs text-foreground/70 bg-background/60 border border-border rounded-lg px-3 py-3 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-words max-h-36 overflow-y-auto" data-lenis-prevent>
                {buildPrompt(issue)}
              </pre>
            </section>

          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-3 flex-shrink-0">
            <p className="text-xs text-muted-foreground text-center">Press Esc to close</p>
          </div>
        </div>
      </div>
    </>
  )
}
