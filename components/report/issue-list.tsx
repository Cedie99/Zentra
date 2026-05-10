'use client'

import { XCircle, AlertTriangle, Info, ChevronRight, Sparkles, FileText, CheckCircle } from 'lucide-react'
import type { Section, Issue } from '@/app/(dashboard)/reports/[id]/page'

interface IssueListProps {
  sections: Section[]
  category: string
  onIssueClick: (issue: Issue) => void
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    icon: XCircle,
    rowBorder: 'border-l-2 border-l-red-500/60',
    iconColor: 'text-red-400',
    badge: 'bg-red-500/12 text-red-400 border border-red-500/25',
  },
  WARNING: {
    icon: AlertTriangle,
    rowBorder: 'border-l-2 border-l-yellow-500/50',
    iconColor: 'text-yellow-400',
    badge: 'bg-yellow-500/12 text-yellow-400 border border-yellow-500/25',
  },
  INFO: {
    icon: Info,
    rowBorder: 'border-l-2 border-l-blue-500/40',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/12 text-blue-400 border border-blue-500/25',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  SECURITY: 'Security',
  DATABASE: 'Database',
  CACHING: 'Caching',
  ERROR_HANDLING: 'Error Handling',
  SCALABILITY: 'Scalability',
  ARCHITECTURE: 'Architecture',
  DEPLOYMENT: 'Deployment',
}

export function IssueList({ sections, category, onIssueClick }: IssueListProps) {
  const categoryLabel = CATEGORY_LABELS[category] ?? category
  const totalIssues = sections.reduce((sum, s) => sum + s.issues.length, 0)

  if (sections.length === 0 || totalIssues === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center">
        <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" strokeWidth={1.5} />
        </div>
        <p className="text-base font-semibold text-foreground mb-1">No issues found</p>
        <p className="text-sm text-muted-foreground">{categoryLabel} looks clean</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        if (section.issues.length === 0) return null
        return (
          <div key={section.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Section header */}
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {section.issues.length} issue{section.issues.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Issues */}
            <div className="divide-y divide-border">
              {section.issues.map((issue) => {
                const sev = issue.severity as keyof typeof SEVERITY_CONFIG
                const cfg = SEVERITY_CONFIG[sev] ?? SEVERITY_CONFIG.INFO
                const Icon = cfg.icon

                return (
                  <button
                    key={issue.id}
                    onClick={() => onIssueClick(issue)}
                    className={`w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors group ${cfg.rowBorder}`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} strokeWidth={1.5} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{issue.title}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${cfg.badge}`}>
                          {issue.severity}
                        </span>
                        {issue.isAiAdded && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI
                          </span>
                        )}
                      </div>
                      {issue.filePath && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                          {issue.filePath}{issue.lineNumber ? `:${issue.lineNumber}` : ''}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {issue.description}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
