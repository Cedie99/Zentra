'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Shield, Database, Zap, AlertCircle, TrendingUp, Box, Rocket, CheckCircle } from 'lucide-react'
import { IssueItem } from './issue-item'

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

interface SectionCardProps {
  category: string
  title: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  issueCount: number
  issues: Issue[]
  id?: string
  onIssueClick?: (issue: Issue) => void
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  SECURITY: Shield,
  DATABASE: Database,
  CACHING: Zap,
  ERROR_HANDLING: AlertCircle,
  SCALABILITY: TrendingUp,
  ARCHITECTURE: Box,
  DEPLOYMENT: Rocket,
}

const SEVERITY_HEADER: Record<string, string> = {
  CRITICAL: 'border-red-500/20 bg-secondary hover:bg-secondary/80 hover:border-red-500/30',
  WARNING: 'border-yellow-500/20 bg-secondary hover:bg-secondary/80 hover:border-yellow-500/30',
  INFO: 'border-blue-500/20 bg-secondary hover:bg-secondary/80 hover:border-blue-500/30',
}

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'text-red-400',
  WARNING: 'text-yellow-400',
  INFO: 'text-blue-400',
}

export function SectionCard({ category, title, severity, issueCount, issues, id, onIssueClick }: SectionCardProps) {
  const [open, setOpen] = useState(true)
  const Icon = CATEGORY_ICONS[category] || Box
  const hasIssues = issueCount > 0

  return (
    <div id={id ? `section-${id}` : undefined} className={`rounded-lg border ${hasIssues ? SEVERITY_HEADER[severity] : 'border-border bg-card hover:bg-secondary'} overflow-hidden transition-colors duration-200 shadow-sm w-full`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left transition-colors"
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${hasIssues ? (severity === 'CRITICAL' ? 'text-red-400' : severity === 'WARNING' ? 'text-yellow-400' : 'text-blue-400') : 'text-green-400'}`} />
        <div className="flex-1">
          <span className="font-medium text-foreground text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasIssues ? (
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${SEVERITY_BADGE[severity]}`}>
              {issueCount} issue{issueCount !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-green-400 uppercase tracking-wider font-semibold">
              <CheckCircle className="w-3 h-3" />
              Clean
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && hasIssues && (
        <div className="px-4 pb-4 space-y-2 w-full">
          {issues.map((issue) => (
            <IssueItem 
              key={issue.id} 
              {...issue} 
              onClick={() => onIssueClick?.(issue)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
