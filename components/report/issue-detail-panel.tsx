'use client'

import { X, ChevronLeft, ChevronRight, AlertTriangle, XCircle, Info, FileText, Lightbulb, Code } from 'lucide-react'
import { useEffect } from 'react'

interface Issue {
  id: string
  title: string
  description: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  filePath?: string | null
  lineNumber?: number | null
  evidence?: string | null
  suggestion: string
  codeExample?: string | null
}

interface IssueDetailPanelProps {
  issue: Issue | null
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    icon: XCircle,
    color: 'text-red-400',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/5',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/5',
  },
  INFO: {
    icon: Info,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/5',
  },
}

export function IssueDetailPanel({ issue, onClose, onPrevious, onNext, hasPrevious, hasNext }: IssueDetailPanelProps) {
  const config = issue ? SEVERITY_CONFIG[issue.severity] : SEVERITY_CONFIG.INFO
  const Icon = config.icon

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!issue) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l border-border z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border z-10">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${config.color}`} strokeWidth={1.5} />
              </div>
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>{issue.severity}</span>
                <h2 className="text-lg font-semibold text-foreground mt-0.5">{issue.title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-primary/5 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Navigation */}
          {(onPrevious || onNext) && (
            <div className="flex items-center justify-between px-6 pb-4">
              <button
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground hover:bg-primary/5"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                Previous
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground hover:bg-primary/5"
              >
                Next
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File path */}
          {issue.filePath && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 border border-border rounded-lg px-4 py-3">
              <FileText className="w-4 h-4" strokeWidth={1.5} />
              <code className="font-mono">
                {issue.filePath}{issue.lineNumber ? `:${issue.lineNumber}` : ''}
              </code>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h3>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{issue.description}</p>
          </div>

          {/* Evidence */}
          {issue.evidence && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Code className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Evidence</h3>
              </div>
              <pre className="text-sm bg-secondary text-foreground/80 p-4 rounded-xl font-mono overflow-x-auto border border-border">{issue.evidence}</pre>
            </div>
          )}

          {/* Suggestion */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-green-400" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider">Suggestion</h3>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{issue.suggestion}</p>
          </div>

          {/* Code Example */}
          {issue.codeExample && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Code className="w-4 h-4 text-green-400" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fix Example</h3>
              </div>
              <pre className="text-sm bg-secondary text-green-400 p-4 rounded-xl font-mono overflow-x-auto border border-green-500/20">{issue.codeExample}</pre>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
