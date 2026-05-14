'use client'

import { Sidebar } from '@/components/dashboard/sidebar'
import { IssueDetailPanel } from '@/components/report/issue-detail-panel'
import { CategoryGrid } from '@/components/report/category-grid'
import { IssueList } from '@/components/report/issue-list'
import { ProductionReadinessHero } from '@/components/report/production-readiness-hero'
import { ReportStats } from '@/components/report/report-stats'
import { ArrowLeft, ChevronDown, ChevronUp, GitCompare } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { RerunAnalysisButton } from '@/components/report/rerun-analysis-button'
import { ExportButtons } from '@/components/report/export-buttons'
import { GeneralAiPrompt } from '@/components/report/general-ai-prompt'

export interface Issue {
  id: string
  title: string
  description: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  filePath?: string | null
  lineNumber?: number | null
  evidence?: string | null
  suggestion: string
  codeExample?: string | null
  isAiAdded?: boolean
  sectionId?: string
}

export interface Section {
  id: string
  title: string
  category: string
  severity: string
  issueCount: number
  issues: Issue[]
}

export interface Report {
  id: string
  repository: {
    fullName: string
    description?: string | null
    language?: string | null
    url?: string | null
  }
  healthScore: number | null
  criticalCount: number
  warningCount: number
  infoCount: number
  filesAnalyzed: number
  status: string
  createdAt: string
  completedAt?: string | null
  aiSummary?: string | null
  productionReadiness?: {
    verdict: 'READY' | 'NEEDS_WORK' | 'NOT_READY'
    confidence: number
    summary: string
    strengths: string[]
    risks: string[]
    recommendation: string
  } | null
  techStack: Record<string, string[]>
  sections: Section[]
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

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<Report | null>(null)
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO'>('FREE')
  const [selectedCategory, setSelectedCategory] = useState<string>('SECURITY')
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [findingsOpen, setFindingsOpen] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [reportRes, planRes] = await Promise.all([
          fetch(`/api/reports/${id}`),
          fetch('/api/user/plan'),
        ])
        if (reportRes.ok) {
          const data = await reportRes.json()
          setReport(data)
          const firstWithIssues = CATEGORIES.find((cat) =>
            data.sections.some((s: Section) => s.category === cat && s.issueCount > 0)
          )
          if (firstWithIssues) setSelectedCategory(firstWithIssues)
        }
        if (planRes.ok) {
          const planData = await planRes.json()
          setUserPlan(planData.plan ?? 'FREE')
        }
      } catch (error) {
        console.error('Failed to fetch report:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])


  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading report…</p>
          </div>
        </main>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Report not found</p>
            <Link href="/dashboard" className="text-amber-400 hover:text-amber-300 text-sm">
              Return to Dashboard
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const selectedSections = report.sections.filter((s) => s.category === selectedCategory)
  const totalIssues = report.criticalCount + report.warningCount + report.infoCount

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 min-w-0">
        <div className="px-8 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Link
                href="/dashboard"
                className="w-9 h-9 bg-secondary border border-border rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-amber-500/30 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
                  {report.repository.fullName}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Analyzed {new Date(report.createdAt).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                  {report.filesAnalyzed ? ` · ${report.filesAnalyzed} files scanned` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ExportButtons report={report} userPlan={userPlan} />
              <Link
                href={`/compare/${id}`}
                className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-amber-500/30 transition-colors"
              >
                <GitCompare className="w-4 h-4" strokeWidth={1.5} />
                Compare
              </Link>
              <RerunAnalysisButton repoFullName={report.repository.fullName} />
            </div>
          </div>

          {/* === MAIN RESULT: Production Readiness === */}
          <ProductionReadinessHero
            productionReadiness={report.productionReadiness ?? null}
            aiSummary={report.aiSummary ?? null}
            healthScore={report.healthScore}
          />

          {/* Supporting stats row */}
          <ReportStats
            criticalCount={report.criticalCount}
            warningCount={report.warningCount}
            infoCount={report.infoCount}
            filesAnalyzed={report.filesAnalyzed}
            techStack={report.techStack}
          />

          {/* General AI prompt — full codebase context */}
          {totalIssues > 0 && <GeneralAiPrompt report={report} />}

          {/* Detailed findings — collapsible */}
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
                  sections={selectedSections}
                  category={selectedCategory}
                  onIssueClick={setSelectedIssue}
                />
              </div>
            )}
          </div>

        </div>
      </main>

      {selectedIssue && (
        <IssueDetailPanel
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  )
}
