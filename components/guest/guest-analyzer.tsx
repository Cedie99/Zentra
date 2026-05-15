'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowRight, ShieldCheck, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { ProductionReadinessHero } from '@/components/report/production-readiness-hero'
import { ReportStats } from '@/components/report/report-stats'
import { GeneralAiPrompt } from '@/components/report/general-ai-prompt'
import { CategoryGrid } from '@/components/report/category-grid'
import { IssueList } from '@/components/report/issue-list'
import { IssueDetailPanel } from '@/components/report/issue-detail-panel'
import type { Report, Issue } from '@/app/(dashboard)/reports/[id]/page'

function parseRepoInput(input: string): string | null {
  const trimmed = input.trim()
  const urlMatch = trimmed.match(/github\.com\/([^/]+\/[^/]+)/)
  if (urlMatch) return urlMatch[1].replace(/\.git$/, '')
  if (/^[^/]+\/[^/]+$/.test(trimmed)) return trimmed
  return null
}

const CATEGORIES = [
  'SECURITY',
  'DATABASE',
  'CACHING',
  'ERROR_HANDLING',
  'SCALABILITY',
  'ARCHITECTURE',
  'DEPLOYMENT',
]

function SignUpCTA() {
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 text-center">
      <p className="text-sm font-semibold text-foreground mb-1">
        Want to save this report and analyze more repositories?
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        Free accounts get 3 analyses per month with full report history and export.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/signup"
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors text-sm"
        >
          Create free account
        </Link>
        <Link
          href="/login"
          className="px-6 py-2.5 border border-border hover:border-border/80 text-muted-foreground hover:text-foreground font-medium rounded-lg transition-colors text-sm"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}

export function GuestAnalyzer() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('SECURITY')
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [findingsOpen, setFindingsOpen] = useState(true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const repoFullName = parseRepoInput(input)
    if (!repoFullName) {
      setError('Enter a valid GitHub URL or owner/repo format.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/guest-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName }),
      })
      const data = await res.json()

      if (res.status === 403 && data.error === 'GUEST_LIMIT_REACHED') {
        setLimitReached(true)
        setLoading(false)
        return
      }
      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      // Pick first category that has issues as the default selection
      const firstWithIssues = CATEGORIES.find((cat) =>
        data.sections.some((s: Report['sections'][number]) => s.category === cat && s.issueCount > 0)
      )
      if (firstWithIssues) setSelectedCategory(firstWithIssues)

      setReport(data as Report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Guest used their try but we have no result to show (e.g. navigated back)
  if (limitReached && !report) {
    return (
      <div className="bg-card border border-amber-500/30 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-amber-500/70" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          You&apos;ve used your free analysis
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Create a free account to get 3 analyses per month and save your results.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors text-sm"
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 border border-border hover:border-border/80 text-muted-foreground hover:text-foreground font-medium rounded-lg transition-colors text-sm"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const totalIssues = report
    ? report.criticalCount + report.warningCount + report.infoCount
    : 0

  return (
    <>
      <div className="space-y-6">
        {/* Input form — always shown so users can see what they analyzed */}
        {!report && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-500 text-sm disabled:opacity-50"
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {loading ? 'Analyzing…' : 'Analyze'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm px-1">{error}</p>}
              <p className="text-xs text-muted-foreground px-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500/70" strokeWidth={1.5} />
                Public repos only · No code stored · One free analysis
              </p>
            </form>
          </div>
        )}

        {/* Full report — identical layout to the signed-in report page */}
        {report && (
          <>
            {/* Repo header */}
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
                  {report.repository.fullName}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Analyzed just now · {report.filesAnalyzed} files scanned
                </p>
              </div>
            </div>

            {/* Production readiness verdict */}
            <ProductionReadinessHero
              productionReadiness={report.productionReadiness ?? null}
              aiSummary={report.aiSummary ?? null}
              healthScore={report.healthScore}
            />

            {/* Stats row */}
            <ReportStats
              criticalCount={report.criticalCount}
              warningCount={report.warningCount}
              infoCount={report.infoCount}
              filesAnalyzed={report.filesAnalyzed}
              techStack={report.techStack}
            />

            {/* Hand off to AI — full report prompt */}
            {totalIssues > 0 && <GeneralAiPrompt report={report} />}

            {/* Detailed findings */}
            <div className="border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setFindingsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">Detailed Findings</span>
                  {totalIssues > 0 && (
                    <span className="text-xs text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-lg">
                      {totalIssues} issues across {CATEGORIES.length} categories
                    </span>
                  )}
                </div>
                {findingsOpen
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                }
              </button>

              {findingsOpen && (
                <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
                  <CategoryGrid
                    sections={report.sections}
                    categories={CATEGORIES}
                    selectedCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                  />
                  <IssueList
                    sections={report.sections.filter((s) => s.category === selectedCategory)}
                    category={selectedCategory}
                    onIssueClick={setSelectedIssue}
                  />
                </div>
              )}
            </div>

            {/* Sign-up CTA */}
            <SignUpCTA />
          </>
        )}
      </div>

      {/* Issue detail panel with full AI handoff — same as signed-in */}
      {selectedIssue && (
        <IssueDetailPanel
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </>
  )
}
