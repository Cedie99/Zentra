import { Sidebar } from '@/components/dashboard/sidebar'
import { OverviewChart } from '@/components/dashboard/overview-chart'
import { RepoForm } from '@/components/repos/repo-form'
import { prisma } from '@/lib/db/client'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GitFork, XCircle, AlertTriangle, Info, Clock, FileCode, ArrowRight, Zap, ShieldCheck, TrendingUp } from 'lucide-react'
import { DeleteRepoButton } from '@/components/repos/delete-repo-button'

type RepoWithReports = {
  id: string
  fullName: string
  name: string
  description: string | null
  language: string | null
  isPrivate: boolean
  url: string
  reports: {
    id: string
    healthScore: number | null
    criticalCount: number
    warningCount: number
    infoCount: number
    createdAt: Date
  }[]
}

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

  const userRecord = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyUsed = await prisma.analysisReport.count({
    where: { userId: session.user.id, createdAt: { gte: startOfMonth } },
  })
  const plan = userRecord?.plan ?? 'FREE'
  const monthlyLimit = plan === 'PRO' ? null : 3

  const repositories = await prisma.repository.findMany({
    where: { userId: session.user.id },
    orderBy: { id: 'desc' },
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
          {plan === 'FREE' && monthlyLimit !== null && (
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-full text-xs text-muted-foreground hover:border-amber-500/40 hover:text-foreground transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
              <span>
                <span className={monthlyUsed >= monthlyLimit ? 'text-red-400 font-semibold' : 'text-foreground font-medium'}>
                  {monthlyUsed} / {monthlyLimit}
                </span>
                {' '}analyses this month
              </span>
              <span className="text-amber-400 font-medium">· Upgrade</span>
            </Link>
          )}
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-5 bg-amber-500 rounded-full" />
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Repositories</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{repositories.length} repo{repositories.length !== 1 ? 's' : ''}</span>
                </div>
                <div
                  className={`space-y-3 ${repositories.length > 5 ? 'max-h-[520px] overflow-y-auto repo-scroll' : ''}`}
                  data-lenis-prevent
                >
                {repositories.map((repo: RepoWithReports) => {
                  const latestReport = repo.reports[0]
                  return (
                    <div key={repo.id} className="group relative bg-card border border-border hover:border-amber-500/30 rounded-2xl p-5 transition-colors duration-200">
                      {/* Delete button — top-right, appears on hover */}
                      <DeleteRepoButton repoId={repo.id} />

                      <Link href={`/reports/${repo.id}`} className="block">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-secondary border border-border rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-amber-500/30 transition-colors duration-200">
                            <GitFork className="w-6 h-6 text-muted-foreground group-hover:text-amber-500/80 transition-colors duration-200" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-start justify-between gap-3">
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
                              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-500/80 transition-colors duration-200 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                            </div>

                            {latestReport && (
                              <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5 text-xs">
                                    {latestReport.criticalCount > 0 && (
                                      <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                                        <XCircle className="w-3 h-3" strokeWidth={1.5} />
                                        {latestReport.criticalCount}
                                      </span>
                                    )}
                                    {latestReport.warningCount > 0 && (
                                      <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                                        <AlertTriangle className="w-3 h-3" strokeWidth={1.5} />
                                        {latestReport.warningCount}
                                      </span>
                                    )}
                                    {latestReport.infoCount > 0 && (
                                      <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                                        <Info className="w-3 h-3" strokeWidth={1.5} />
                                        {latestReport.infoCount}
                                      </span>
                                    )}
                                  </div>
                                  <ScoreBadge score={latestReport.healthScore} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })}
                </div>
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
                    <p className="text-sm text-foreground font-medium">Paste any GitHub repo</p>
                    <p className="text-xs text-muted-foreground mt-1">Enter owner/repo (e.g. vercel/next.js) to analyze any public repository</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileCode className="w-4 h-4 text-blue-500/80" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">Re-run for fresh results</p>
                    <p className="text-xs text-muted-foreground mt-1">Click a repo and run a new analysis to reflect recent code changes</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-green-500/80" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">Check the verdict first</p>
                    <p className="text-xs text-muted-foreground mt-1">The AI production readiness verdict tells you the most important thing to fix</p>
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
