'use client'

import { Sidebar } from '@/components/dashboard/sidebar'
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus,
  CheckCircle2, AlertTriangle, XCircle, GitCompare,
  Shield, Database, Zap, AlertCircle, Box, Rocket, Clock,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, use, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: string
  healthScore: number | null
  criticalCount: number
  warningCount: number
  infoCount: number
  filesAnalyzed: number
  createdAt: string
}

interface CompareIssue {
  id: string
  title: string
  description: string
  severity: string
  filePath: string | null
  suggestion: string
  category: string
  isAiAdded: boolean
}

interface CompareResult {
  older: { id: string; createdAt: string; healthScore: number | null; criticalCount: number; warningCount: number; infoCount: number }
  newer: { id: string; createdAt: string; healthScore: number | null; criticalCount: number; warningCount: number; infoCount: number }
  repository: { fullName: string; id: string }
  diff: {
    healthScoreDelta: number
    criticalDelta: number
    warningDelta: number
    infoDelta: number
    resolvedCount: number
    introducedCount: number
    resolved: CompareIssue[]
    introduced: CompareIssue[]
    categorySummary: { category: string; olderCount: number; newerCount: number; delta: number }[]
  }
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; Icon: React.ElementType }> = {
  SECURITY:       { label: 'Security',       Icon: Shield },
  DATABASE:       { label: 'Database',       Icon: Database },
  CACHING:        { label: 'Caching',        Icon: Zap },
  ERROR_HANDLING: { label: 'Error Handling', Icon: AlertCircle },
  SCALABILITY:    { label: 'Scalability',    Icon: TrendingUp },
  ARCHITECTURE:   { label: 'Architecture',   Icon: Box },
  DEPLOYMENT:     { label: 'Deployment',     Icon: Rocket },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number | null) {
  if (score === null) return 'text-muted-foreground'
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function scoreRingColor(score: number | null) {
  if (score === null) return 'border-border'
  if (score >= 80) return 'border-emerald-500/50'
  if (score >= 60) return 'border-amber-500/50'
  return 'border-red-500/50'
}

function formatRelativeDate(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RunCard({
  run,
  role,
  index,
  isSelected,
  isOtherSelected,
  onClick,
}: {
  run: HistoryEntry
  role: 'before' | 'after'
  index: number
  isSelected: boolean
  isOtherSelected: boolean
  onClick: () => void
}) {
  const ringColor = isSelected
    ? role === 'before' ? 'border-blue-500/60 bg-blue-500/5' : 'border-amber-500/60 bg-amber-500/5'
    : isOtherSelected
      ? 'border-border/40 opacity-50'
      : 'border-border hover:border-border/80 bg-card'

  return (
    <button
      onClick={onClick}
      disabled={isOtherSelected}
      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 ${ringColor}`}
    >
      {/* Score ring */}
      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? (role === 'before' ? 'border-blue-500/70' : 'border-amber-500/70') : scoreRingColor(run.healthScore)}`}>
        <span className={`text-sm font-bold ${isSelected ? (role === 'before' ? 'text-blue-400' : 'text-amber-400') : scoreColor(run.healthScore)}`}>
          {run.healthScore ?? '?'}
        </span>
      </div>

      {/* Date + counts */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">
          {formatRelativeDate(run.createdAt)}
          <span className="text-xs text-muted-foreground font-normal ml-1.5">{formatTime(run.createdAt)}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {run.criticalCount > 0 && (
            <span className="text-xs text-red-400">{run.criticalCount} critical</span>
          )}
          {run.warningCount > 0 && (
            <span className="text-xs text-amber-400">{run.warningCount} warning{run.warningCount !== 1 ? 's' : ''}</span>
          )}
          {run.criticalCount === 0 && run.warningCount === 0 && (
            <span className="text-xs text-emerald-400">No critical issues</span>
          )}
        </div>
      </div>

      {/* Selection badge */}
      {isSelected && (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${
          role === 'before'
            ? 'bg-blue-500/15 text-blue-400'
            : 'bg-amber-500/15 text-amber-400'
        }`}>
          {role === 'before' ? 'Before' : 'After'}
        </span>
      )}

      {/* Latest badge */}
      {index === 0 && !isSelected && (
        <span className="text-[10px] font-medium text-muted-foreground bg-secondary border border-border px-1.5 py-0.5 rounded flex-shrink-0">
          Latest
        </span>
      )}
    </button>
  )
}

function StatCard({
  label,
  older,
  newer,
  delta,
  colorClass,
}: {
  label: string
  older: number | null
  newer: number | null
  delta: number
  colorClass: string
}) {
  const isScore = label === 'Health Score'

  const deltaEl = () => {
    // For health score: higher = better. For issues: lower = better.
    const improved = isScore ? delta > 0 : delta < 0
    const regressed = isScore ? delta < 0 : delta > 0

    if (delta === 0) return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" /> Unchanged
      </span>
    )
    if (improved) return (
      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
        <TrendingUp className="w-3 h-3" />
        {isScore ? `+${delta} pts` : `${Math.abs(delta)} fewer`}
      </span>
    )
    return (
      <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
        <TrendingDown className="w-3 h-3" />
        {isScore ? `${delta} pts` : `${Math.abs(delta)} more`}
      </span>
    )
  }

  return (
    <div className="border border-border rounded-2xl px-4 py-3.5 space-y-1.5 min-w-[130px]">
      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-xl font-bold ${colorClass}`}>{newer ?? '—'}</span>
        <span className="text-xs text-muted-foreground">was {older ?? '—'}</span>
      </div>
      {deltaEl()}
    </div>
  )
}

function CategoryRow({ cat }: { cat: { category: string; olderCount: number; newerCount: number; delta: number } }) {
  const meta = CATEGORY_META[cat.category]
  const Icon = meta?.Icon ?? Box
  const improved = cat.delta < 0
  const regressed = cat.delta > 0
  const unchanged = cat.delta === 0

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
      <span className="text-sm text-foreground flex-1">{meta?.label ?? cat.category}</span>

      {/* Before → After */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">{cat.olderCount}</span>
        <span className="text-muted-foreground/40">→</span>
        <span className={regressed ? 'text-red-400 font-semibold' : improved ? 'text-emerald-400 font-semibold' : 'text-muted-foreground'}>
          {cat.newerCount}
        </span>
      </div>

      {/* Delta pill */}
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full min-w-[3rem] text-center ${
        unchanged
          ? 'bg-secondary text-muted-foreground'
          : improved
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-red-500/15 text-red-400'
      }`}>
        {unchanged ? '—' : improved ? `−${Math.abs(cat.delta)}` : `+${cat.delta}`}
      </span>
    </div>
  )
}

function IssueRow({ issue, type }: { issue: CompareIssue; type: 'resolved' | 'introduced' }) {
  const [expanded, setExpanded] = useState(false)

  const severityIcon = {
    CRITICAL: <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />,
    WARNING:  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />,
    INFO:     <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />,
  }[issue.severity] ?? <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />

  const meta = CATEGORY_META[issue.category]

  return (
    <div
      className={`rounded-xl border transition-colors ${
        type === 'resolved'
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-red-500/20 bg-red-500/5'
      }`}
    >
      <button
        className="w-full flex items-start gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {severityIcon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{issue.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {meta && (
              <span className="text-xs text-muted-foreground bg-secondary border border-border px-1.5 py-0.5 rounded">
                {meta.label}
              </span>
            )}
            {issue.filePath && (
              <span className="text-xs text-muted-foreground font-mono truncate max-w-[240px]">
                {issue.filePath}
              </span>
            )}
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
          type === 'resolved'
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-red-500/15 text-red-400'
        }`}>
          {type === 'resolved' ? 'Fixed' : 'New'}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-inherit pt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{issue.description}</p>
          {issue.suggestion && (
            <div className="bg-secondary/60 border border-border rounded-lg px-3 py-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Suggestion</p>
              <p className="text-xs text-foreground leading-relaxed">{issue.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ComparePage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params)

  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [selectedBefore, setSelectedBefore] = useState<string>('')
  const [selectedAfter, setSelectedAfter] = useState<string>('')
  const [result, setResult] = useState<CompareResult | null>(null)
  const [comparing, setComparing] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [repoName, setRepoName] = useState<string>('')

  const runCompare = useCallback(async (beforeId: string, afterId: string) => {
    if (!beforeId || !afterId || beforeId === afterId) return
    setComparing(true)
    setCompareError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/compare?a=${beforeId}&b=${afterId}`)
      if (!res.ok) {
        const err = await res.json()
        setCompareError(err.error ?? 'Comparison failed')
        return
      }
      const data: CompareResult = await res.json()
      setResult(data)
      if (data.repository?.fullName) setRepoName(data.repository.fullName)
    } catch {
      setCompareError('Failed to load comparison')
    } finally {
      setComparing(false)
    }
  }, [])

  useEffect(() => {
    fetch(`/api/repos/${repoId}/history`)
      .then((r) => r.json())
      .then((data: HistoryEntry[]) => {
        setHistory(data)
        if (data.length >= 2) {
          const before = data[1].id  // second-most-recent
          const after  = data[0].id  // most recent
          setSelectedBefore(before)
          setSelectedAfter(after)
          // Auto-run comparison with defaults
          runCompare(before, after)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [repoId, runCompare])

  const beforeRun = history.find((r) => r.id === selectedBefore)
  const afterRun  = history.find((r) => r.id === selectedAfter)

  const overallImproved = result && result.diff.healthScoreDelta > 0
  const overallRegressed = result && result.diff.healthScoreDelta < 0

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 min-w-0">
        <div className="px-8 py-8 space-y-6">

          {/* ── Header ── */}
          <div className="flex items-center gap-4">
            <Link
              href={`/reports/${repoId}`}
              className="w-9 h-9 bg-secondary border border-border rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-amber-500/30 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
                Compare Analyses
                {repoName && <span className="text-muted-foreground font-normal text-base">— {repoName}</span>}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pick two analysis runs below to see what improved and what regressed
              </p>
            </div>
          </div>

          {/* ── Run picker ── */}
          {loadingHistory ? (
            <div className="border border-border rounded-2xl p-8 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <div className="w-4 h-4 border border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              Loading analysis history…
            </div>
          ) : history.length < 2 ? (
            <div className="border border-border rounded-2xl p-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">Not enough history yet</p>
              <p className="text-xs text-muted-foreground">
                You need at least 2 completed analyses to compare. Run another analysis first.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-2xl overflow-hidden">
              {/* Picker header */}
              <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Select runs to compare</p>
                <button
                  onClick={() => runCompare(selectedBefore, selectedAfter)}
                  disabled={comparing || !selectedBefore || !selectedAfter || selectedBefore === selectedAfter}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-semibold rounded-lg transition-colors"
                >
                  {comparing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                      Comparing…
                    </span>
                  ) : 'Compare'}
                </button>
              </div>

              {/* Two-column picker */}
              <div className="grid grid-cols-2 divide-x divide-border">
                {/* Before column */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Before</p>
                    <span className="text-xs text-muted-foreground">(older run)</span>
                  </div>
                  {history.map((run, i) => (
                    <RunCard
                      key={run.id}
                      run={run}
                      role="before"
                      index={i}
                      isSelected={run.id === selectedBefore}
                      isOtherSelected={run.id === selectedAfter}
                      onClick={() => setSelectedBefore(run.id)}
                    />
                  ))}
                </div>

                {/* After column */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">After</p>
                    <span className="text-xs text-muted-foreground">(newer run)</span>
                  </div>
                  {history.map((run, i) => (
                    <RunCard
                      key={run.id}
                      run={run}
                      role="after"
                      index={i}
                      isSelected={run.id === selectedAfter}
                      isOtherSelected={run.id === selectedBefore}
                      onClick={() => setSelectedAfter(run.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {compareError && (
            <div className="border border-red-500/20 bg-red-500/5 rounded-xl px-4 py-3">
              <p className="text-sm text-red-400">{compareError}</p>
            </div>
          )}

          {/* ── Comparing state ── */}
          {comparing && (
            <div className="border border-border rounded-2xl p-8 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <div className="w-4 h-4 border border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              Running comparison…
            </div>
          )}

          {/* ── Results ── */}
          {result && !comparing && (
            <div className="space-y-5">

              {/* Top row: verdict banner + stat cards */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-stretch">
                {/* Overall verdict */}
                <div className={`rounded-2xl border px-5 py-4 flex items-center gap-4 ${
                  overallImproved
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : overallRegressed
                      ? 'border-red-500/30 bg-red-500/5'
                      : 'border-border bg-secondary/30'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    overallImproved ? 'bg-emerald-500/15' : overallRegressed ? 'bg-red-500/15' : 'bg-secondary'
                  }`}>
                    {overallImproved
                      ? <TrendingUp className="w-5 h-5 text-emerald-400" strokeWidth={2} />
                      : overallRegressed
                        ? <TrendingDown className="w-5 h-5 text-red-400" strokeWidth={2} />
                        : <Minus className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
                    }
                  </div>
                  <div>
                    <p className={`text-base font-bold ${
                      overallImproved ? 'text-emerald-400' : overallRegressed ? 'text-red-400' : 'text-foreground'
                    }`}>
                      {overallImproved
                        ? `Improved by ${result.diff.healthScoreDelta} point${result.diff.healthScoreDelta !== 1 ? 's' : ''}`
                        : overallRegressed
                          ? `Regressed by ${Math.abs(result.diff.healthScoreDelta)} point${Math.abs(result.diff.healthScoreDelta) !== 1 ? 's' : ''}`
                          : 'Health score unchanged'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Score {result.older.healthScore ?? '—'} → {result.newer.healthScore ?? '—'}
                      {result.diff.resolvedCount > 0 && ` · ${result.diff.resolvedCount} fixed`}
                      {result.diff.introducedCount > 0 && ` · ${result.diff.introducedCount} new`}
                      {result.diff.resolvedCount === 0 && result.diff.introducedCount === 0 && ' · no issue changes'}
                    </p>
                  </div>
                </div>

                {/* Stat cards inline */}
                <StatCard label="Health Score" older={result.older.healthScore} newer={result.newer.healthScore} delta={result.diff.healthScoreDelta} colorClass={scoreColor(result.newer.healthScore)} />
                <StatCard label="Critical" older={result.older.criticalCount} newer={result.newer.criticalCount} delta={result.diff.criticalDelta} colorClass="text-red-400" />
                <StatCard label="Warnings" older={result.older.warningCount} newer={result.newer.warningCount} delta={result.diff.warningDelta} colorClass="text-amber-400" />
                <StatCard label="Info" older={result.older.infoCount} newer={result.newer.infoCount} delta={result.diff.infoDelta} colorClass="text-blue-400" />
              </div>

              {/* Main content: category breakdown left, issues right */}
              <div className="grid grid-cols-[320px_1fr] gap-5 items-start">

                {/* Left: category breakdown */}
                <div className="border border-border rounded-2xl overflow-hidden sticky top-6">
                  <div className="px-4 py-3.5 border-b border-border bg-secondary/30 flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">By Category</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400/70" />Before</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />After</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {result.diff.categorySummary
                      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                      .map((cat) => <CategoryRow key={cat.category} cat={cat} />)
                    }
                  </div>
                </div>

                {/* Right: issue lists */}
                <div className="space-y-4">
                  {/* Resolved */}
                  {result.diff.resolved.length > 0 && (
                    <div className="border border-emerald-500/20 rounded-2xl overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" strokeWidth={2} />
                        <p className="text-sm font-semibold text-emerald-400">
                          {result.diff.resolvedCount} Issue{result.diff.resolvedCount !== 1 ? 's' : ''} Fixed
                        </p>
                        <span className="text-xs text-emerald-400/60 ml-1">— present before, gone now</span>
                      </div>
                      <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-2">
                        {result.diff.resolved.map((issue) => (
                          <IssueRow key={issue.id} issue={issue} type="resolved" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Introduced */}
                  {result.diff.introduced.length > 0 && (
                    <div className="border border-red-500/20 rounded-2xl overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-red-500/20 bg-red-500/5 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" strokeWidth={2} />
                        <p className="text-sm font-semibold text-red-400">
                          {result.diff.introducedCount} New Issue{result.diff.introducedCount !== 1 ? 's' : ''} Introduced
                        </p>
                        <span className="text-xs text-red-400/60 ml-1">— appeared in the newer run</span>
                      </div>
                      <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-2">
                        {result.diff.introduced.map((issue) => (
                          <IssueRow key={issue.id} issue={issue} type="introduced" />
                        ))}
                      </div>
                    </div>
                  )}

                  {result.diff.resolvedCount === 0 && result.diff.introducedCount === 0 && (
                    <div className="border border-border rounded-2xl p-8 text-center space-y-1">
                      <p className="text-sm font-medium text-foreground">No issue changes between these runs</p>
                      <p className="text-xs text-muted-foreground">The same issues were found in both analyses.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
