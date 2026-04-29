import { Sidebar } from '@/components/dashboard/sidebar'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { BarChart3, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-sm">—</span>
  const color =
    score >= 80 ? 'text-green-400 bg-green-400/10' :
    score >= 60 ? 'text-yellow-400 bg-yellow-400/10' :
    score >= 40 ? 'text-orange-400 bg-orange-400/10' :
                  'text-red-400 bg-red-400/10'
  return (
    <span className={`text-sm font-bold px-2 py-0.5 rounded ${color}`}>{score}</span>
  )
}

export default async function AnalysisPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const reports = await prisma.analysisReport.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      repository: true,
    },
  })

  return (
    <div className="min-h-screen bg-background relative">
      <Sidebar />
      <main className="ml-64 p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Analysis
            </h1>
            <p className="text-muted-foreground text-sm mt-1">View your repository analysis reports</p>
          </div>
        </div>

        {/* Analysis List */}
        {reports.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-20 h-20 bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-amber-500/60" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">No analyses yet</h3>
            <p className="text-muted-foreground">Connect and analyze your first repository to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/analysis/${report.id}`}
                className="group block bg-card border border-border hover:border-amber-500/30 rounded-2xl p-5 transition-colors duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary border border-border rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-amber-500/30 transition-colors duration-200">
                    <BarChart3 className="w-6 h-6 text-muted-foreground group-hover:text-amber-500/80 transition-colors duration-200" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground group-hover:text-amber-500/90 transition-colors duration-200 truncate tracking-tight text-base">
                          {report.repository.fullName}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" strokeWidth={1.5} />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {report.filesAnalyzed} files analyzed
                          </span>
                        </div>
                      </div>
                      <ScoreBadge score={report.healthScore} />
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-2.5">
                          {report.criticalCount > 0 && (
                            <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/15 transition-colors">
                              <XCircle className="w-3 h-3" strokeWidth={1.5} />
                              {report.criticalCount}
                            </span>
                          )}
                          {report.warningCount > 0 && (
                            <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 hover:bg-yellow-500/15 transition-colors">
                              <AlertTriangle className="w-3 h-3" strokeWidth={1.5} />
                              {report.warningCount}
                            </span>
                          )}
                          {report.infoCount > 0 && (
                            <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 hover:bg-blue-500/15 transition-colors">
                              <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                              {report.infoCount}
                            </span>
                          )}
                        </div>
                        <div className="ml-auto">
                          <span className={`text-xs px-2 py-1 rounded ${
                            report.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                            report.status === 'RUNNING' ? 'bg-yellow-500/10 text-yellow-400' :
                            report.status === 'FAILED' ? 'bg-red-500/10 text-red-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
