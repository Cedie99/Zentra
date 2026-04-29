import { Sidebar } from '@/components/dashboard/sidebar'
import { RepoForm } from '@/components/repos/repo-form'
import { GitFork } from 'lucide-react'

export default function ReposPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <Sidebar />
      <main className="ml-64 p-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Repositories
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Connect and analyze your GitHub repositories</p>
        </div>

        {/* Repository Form */}
        <div className="bg-card border border-border rounded-2xl p-6 hover:border-amber-500/20 transition-colors duration-300 shadow-lg">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-amber-500 rounded-full" />
            Connect a Repository
          </h2>
          <RepoForm />
        </div>
      </main>
    </div>
  )
}
