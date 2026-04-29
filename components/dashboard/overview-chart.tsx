'use client'

interface OverviewChartProps {
  total: number
  analyzed: number
  pending: number
}

const COLORS = {
  analyzed: '#f59e0b',
  pending: '#64748b',
}

export function OverviewChart({ total, analyzed, pending }: OverviewChartProps) {
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-32 h-32 rounded-full border-4 border-border flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground">0</span>
        </div>
        <p className="text-sm text-muted-foreground mt-4">No repositories yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Total Card */}
      <div className="bg-secondary border border-border rounded-xl p-4 text-center">
        <span className="text-3xl font-bold text-foreground">{total}</span>
        <p className="text-xs text-muted-foreground mt-1">Total Repositories</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
          <span className="text-2xl font-bold text-amber-400">{analyzed}</span>
          <p className="text-xs text-muted-foreground mt-1">Analyzed</p>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 text-center">
          <span className="text-2xl font-bold text-gray-400">{pending}</span>
          <p className="text-xs text-muted-foreground mt-1">Pending</p>
        </div>
      </div>
    </div>
  )
}
