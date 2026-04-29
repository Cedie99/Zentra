'use client'

import { AlertTriangle, XCircle, Info, ChevronRight } from 'lucide-react'

interface IssueItemProps {
  id: string
  title: string
  description: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  filePath?: string | null
  lineNumber?: number | null
  evidence?: string | null
  suggestion: string
  codeExample?: string | null
  onClick: () => void
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    icon: XCircle,
    badge: 'text-red-400',
    left: 'border-l-2 border-red-500/50',
    bg: 'bg-secondary hover:bg-secondary/80 border border-border hover:border-red-500/30',
  },
  WARNING: {
    icon: AlertTriangle,
    badge: 'text-yellow-400',
    left: 'border-l-2 border-yellow-500/50',
    bg: 'bg-secondary hover:bg-secondary/80 border border-border hover:border-yellow-500/30',
  },
  INFO: {
    icon: Info,
    badge: 'text-blue-400',
    left: 'border-l-2 border-blue-500/50',
    bg: 'bg-secondary hover:bg-secondary/80 border border-border hover:border-blue-500/30',
  },
}

export function IssueItem({ id, title, description, severity, filePath, lineNumber, evidence, suggestion, codeExample, onClick }: IssueItemProps) {
  const config = SEVERITY_CONFIG[severity]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={`${config.left} ${config.bg} rounded-lg overflow-hidden transition-colors duration-200 w-full text-left`}
    >
      <div className="flex items-start gap-4 p-4 min-w-0">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${severity === 'CRITICAL' ? 'text-red-400' : severity === 'WARNING' ? 'text-yellow-400' : 'text-blue-400'}`} strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground tracking-tight wrap-break-word">{title}</span>
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${config.badge} shrink-0`}>{severity}</span>
          </div>
          {filePath && (
            <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
              {filePath}{lineNumber ? `:${lineNumber}` : ''}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
      </div>
    </button>
  )
}
