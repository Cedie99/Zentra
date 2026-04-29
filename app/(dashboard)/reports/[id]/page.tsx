'use client'

import { Sidebar } from '@/components/dashboard/sidebar'
import { SectionCard } from '@/components/report/section-card'
import { IssueDetailPanel } from '@/components/report/issue-detail-panel'
import { GitFork, ArrowLeft, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo, useEffect, use } from 'react'

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
  sectionId?: string
}

interface Section {
  id: string
  title: string
  category: string
  severity: string
  issueCount: number
  issues: Issue[]
}

interface Report {
  id: string
  repository: {
    fullName: string
  }
  healthScore: number | null
  criticalCount: number
  warningCount: number
  infoCount: number
  status: string
  createdAt: string
  techStack: Record<string, string[]>
  sections: Section[]
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<Report | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('SECURITY')
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${id}`)
        if (res.ok) {
          const data = await res.json()
          setReport(data)
        }
      } catch (error) {
        console.error('Failed to fetch report:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [id])

  const categories = ['SECURITY', 'DATABASE', 'CACHING', 'ERROR_HANDLING', 'SCALABILITY', 'ARCHITECTURE', 'DEPLOYMENT']
  const filteredSections = report?.sections.filter(s => s.category === selectedCategory) || []

  // Flatten all issues for navigation
  const allIssues = useMemo(() => {
    if (!report) return []
    return report.sections.flatMap(section => 
      section.issues.map(issue => ({ ...issue, sectionId: section.id }))
    )
  }, [report])

  const currentIndex = useMemo(() => {
    if (!selectedIssue) return -1
    return allIssues.findIndex(issue => issue.id === selectedIssue.id)
  }, [selectedIssue, allIssues])

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedIssue(allIssues[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (currentIndex < allIssues.length - 1) {
      setSelectedIssue(allIssues[currentIndex + 1])
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </main>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Report not found</p>
            <Link href="/dashboard" className="text-amber-400 hover:text-amber-300 mt-4 inline-block">
              Return to Dashboard
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">

      
      <Sidebar />
      <main className="flex-1 p-8 ml-64 relative z-10 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-10 h-10 bg-primary/5 border border-border rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors">
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {report.repository.fullName}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Analysis report</p>
            </div>
          </div>
        </div>

        {report.sections.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-20 h-20 bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <GitFork className="w-10 h-10 text-amber-500/60" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">No analysis available</h3>
            <p className="text-muted-foreground">This repository hasn't been analyzed yet</p>
          </div>
        ) : (
          <>
            {/* Report Summary */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-1 h-5 bg-amber-500 rounded-full" />
                <h2 className="text-lg font-semibold text-foreground">Analysis Summary</h2>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                  <span className="text-foreground">{report.criticalCount} Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" strokeWidth={1.5} />
                  <span className="text-foreground">{report.warningCount} Warnings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                  <span className="text-foreground">{report.infoCount} Info</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" strokeWidth={1.5} />
                  <span className="text-foreground">Health Score: {report.healthScore || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 bg-amber-500 rounded-full" />
                <h2 className="text-lg font-semibold text-foreground">Categories</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabbed Sections */}
            <div className="space-y-3 w-full">
              {filteredSections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No sections found for this category</p>
                </div>
              ) : (
                filteredSections.map((section) => (
                  <SectionCard
                    key={section.id}
                    id={section.id}
                    category={section.category}
                    title={section.title}
                    severity={section.severity as 'CRITICAL' | 'WARNING' | 'INFO'}
                    issueCount={section.issueCount}
                    issues={section.issues.map((i) => ({
                      id: i.id,
                      title: i.title,
                      description: i.description,
                      severity: i.severity as 'CRITICAL' | 'WARNING' | 'INFO',
                      filePath: i.filePath,
                      lineNumber: i.lineNumber,
                      evidence: i.evidence,
                      suggestion: i.suggestion,
                      codeExample: i.codeExample,
                    }))}
                    onIssueClick={(issue) => setSelectedIssue(issue)}
                  />
                ))
              )}
            </div>

            {/* Issue Detail Panel */}
            {selectedIssue && (
              <IssueDetailPanel
                issue={selectedIssue}
                onClose={() => setSelectedIssue(null)}
                onPrevious={handlePrevious}
                onNext={handleNext}
                hasPrevious={currentIndex > 0}
                hasNext={currentIndex < allIssues.length - 1}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
