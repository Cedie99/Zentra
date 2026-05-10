import { XCircle, AlertTriangle, Info, FileCode } from 'lucide-react'

const TECH_COLORS: Record<string, string> = {
  language: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
  framework: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  database: 'bg-green-500/15 text-green-300 border-green-500/25',
  cache: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  orm: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  auth: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  queue: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
  testing: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
}

interface ReportStatsProps {
  criticalCount: number
  warningCount: number
  infoCount: number
  filesAnalyzed: number
  techStack: Record<string, string[]>
}

export function ReportStats({ criticalCount, warningCount, infoCount, filesAnalyzed, techStack }: ReportStatsProps) {
  const allTech: { label: string; type: string }[] = []
  for (const [type, items] of Object.entries(techStack)) {
    if (Array.isArray(items)) items.forEach((item) => allTech.push({ label: item, type }))
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {/* Counts */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm">
          <XCircle className="w-4 h-4 text-red-400" strokeWidth={1.5} />
          <span className="font-bold text-red-400">{criticalCount}</span>
          <span className="text-muted-foreground">critical</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5 text-sm">
          <AlertTriangle className="w-4 h-4 text-yellow-400" strokeWidth={1.5} />
          <span className="font-bold text-yellow-400">{warningCount}</span>
          <span className="text-muted-foreground">warnings</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5 text-sm">
          <Info className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
          <span className="font-bold text-blue-400">{infoCount}</span>
          <span className="text-muted-foreground">info</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <FileCode className="w-4 h-4" strokeWidth={1.5} />
          {filesAnalyzed} files scanned
        </div>
      </div>

      {/* Tech stack */}
      {allTech.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Stack:</span>
          {allTech.map(({ label, type }) => (
            <span
              key={`${type}-${label}`}
              className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${
                TECH_COLORS[type] ?? 'bg-secondary text-muted-foreground border-border'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
