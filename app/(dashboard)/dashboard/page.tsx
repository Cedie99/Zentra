import { Sidebar } from '@/components/dashboard/sidebar'
import { OverviewChart } from '@/components/dashboard/overview-chart'
import { RepoForm } from '@/components/repos/repo-form'
import { prisma } from '@/lib/db/client'
import { Prisma } from '@prisma/client'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GitFork, XCircle, AlertTriangle, Info, Clock, FileCode, ArrowRight, MoreVertical, Zap } from 'lucide-react'

type RepoWithReports = Prisma.RepositoryGetPayload<{
  include: { reports: true }
}>

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

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const repositories = await prisma.repository.findMany({
    where: { userId: session.user.id },
    take: 50,
    include: {
      reports: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
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
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and analyze your repositories</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Add Repository Form */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-amber-500/20 transition-colors duration-300 shadow-lg">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-amber-500 rounded-full" />
                Connect a Repository
              </h2>
              <RepoForm />
            </div>

            {/* Repositories List */}
            {repositories.length === 0 ? (
              <div className="text-center py-32">
                <div className="w-20 h-20 bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <GitFork className="w-10 h-10 text-amber-500/60" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">No repositories connected</h3>
                <p className="text-muted-foreground">Connect your first GitHub repository to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1 h-5 bg-amber-500 rounded-full" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Repositories</h2>
                </div>
                {repositories.map((repo: RepoWithReports) => {
                  const latestReport = repo.reports[0]
                  return (
                    <Link
                      key={repo.id}
                      href={`/reports/${repo.id}`}
                      className="group block bg-card border border-border hover:border-amber-500/30 rounded-2xl p-5 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-secondary border border-border rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-amber-500/30 transition-colors duration-200">
                          <GitFork className="w-6 h-6 text-muted-foreground group-hover:text-amber-500/80 transition-colors duration-200" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground group-hover:text-amber-500/90 transition-colors duration-200 truncate tracking-tight text-base">
                                {repo.fullName}
                              </p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {repo.isPrivate && (
                                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">Private</span>
                                )}
                                {repo.language && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                                    {repo.language}
                                  </span>
                                )}
                                {latestReport && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" strokeWidth={1.5} />
                                    {new Date(latestReport.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-500/80 transition-colors duration-200 flex-shrink-0 mt-1" strokeWidth={1.5} />
                          </div>
                          
                          {latestReport && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="flex items-center gap-2.5">
                                    {latestReport.criticalCount > 0 && (
                                      <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/15 transition-colors">
                                        <XCircle className="w-3 h-3" strokeWidth={1.5} />
                                        {latestReport.criticalCount}
                                      </span>
                                    )}
                                    {latestReport.warningCount > 0 && (
                                      <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 hover:bg-yellow-500/15 transition-colors">
                                        <AlertTriangle className="w-3 h-3" strokeWidth={1.5} />
                                        {latestReport.warningCount}
                                      </span>
                                    )}
                                    {latestReport.infoCount > 0 && (
                                      <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 hover:bg-blue-500/15 transition-colors">
                                        <Info className="w-3 h-3" strokeWidth={1.5} />
                                        {latestReport.infoCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ScoreBadge score={latestReport.healthScore} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-amber-500/20 transition-colors duration-300 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Overview</h3>
              <OverviewChart
                total={repositories.length}
                analyzed={repositories.filter((r: RepoWithReports) => r.reports.length > 0).length}
                pending={repositories.filter((r: RepoWithReports) => r.reports.length === 0).length}
              />
            </div>

            {/* Quick Tips */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-amber-500/20 transition-colors duration-300 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Tips</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-amber-500/80" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">Connect More Repos</p>
                    <p className="text-xs text-muted-foreground mt-1">Add all your projects for comprehensive analysis</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileCode className="w-4 h-4 text-blue-500/80" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">Review Reports</p>
                    <p className="text-xs text-muted-foreground mt-1">Check detailed analysis to improve code quality</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-amber-500/20 transition-colors duration-300 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Activity</h3>
              {repositories.filter((r: RepoWithReports) => r.reports.length > 0).length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {repositories
                    .filter((r: RepoWithReports) => r.reports.length > 0)
                    .sort((a, b) => new Date(b.reports[0].createdAt).getTime() - new Date(a.reports[0].createdAt).getTime())
                    .slice(0, 3)
                    .map((repo) => (
                      <div key={repo.id} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500/60" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{repo.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            Analyzed {new Date(repo.reports[0].createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
