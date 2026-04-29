import { XCircle, AlertTriangle, Info, FileCode } from 'lucide-react'

interface TechStack {
  language?: string[]
  framework?: string[]
  database?: string[]
  cache?: string[]
  queue?: string[]
  auth?: string[]
  orm?: string[]
  testing?: string[]
}

interface ExecutiveSummaryProps {
  criticalCount: number
  warningCount: number
  infoCount: number
  filesAnalyzed: number
  techStack: TechStack
}

const TECH_COLORS: Record<string, string> = {
  language: 'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:border-purple-500/50',
  framework: 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:border-blue-500/50',
  database: 'bg-green-500/15 text-green-400 border-green-500/30 hover:border-green-500/50',
  cache: 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:border-orange-500/50',
  orm: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:border-cyan-500/50',
  auth: 'bg-violet-500/15 text-violet-400 border-violet-500/30 hover:border-violet-500/50',
  queue: 'bg-pink-500/15 text-pink-400 border-pink-500/30 hover:border-pink-500/50',
  testing: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 hover:border-indigo-500/50',
}

export function ExecutiveSummary({ criticalCount, warningCount, infoCount, filesAnalyzed, techStack }: ExecutiveSummaryProps) {
  const allTech: { label: string; type: string }[] = []
  for (const [type, items] of Object.entries(techStack)) {
    if (Array.isArray(items)) {
      items.forEach((item) => allTech.push({ label: item, type }))
    }
  }

  return (
    <div className="space-y-5">
      {/* Issue counts */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-2.5 bg-red-500/12 border border-red-500/30 rounded-2xl p-5 hover:border-red-500/40 transition-colors duration-200">
          <div className="w-11 h-11 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-400" strokeWidth={1.5} />
          </div>
          <span className="text-3xl font-bold text-red-400 tracking-tight">{criticalCount}</span>
          <span className="text-xs text-muted-foreground font-medium">Critical</span>
        </div>
        <div className="flex flex-col items-center gap-2.5 bg-yellow-500/12 border border-yellow-500/30 rounded-2xl p-5 hover:border-yellow-500/40 transition-colors duration-200">
          <div className="w-11 h-11 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400" strokeWidth={1.5} />
          </div>
          <span className="text-3xl font-bold text-yellow-400 tracking-tight">{warningCount}</span>
          <span className="text-xs text-muted-foreground font-medium">Warnings</span>
        </div>
        <div className="flex flex-col items-center gap-2.5 bg-blue-500/12 border border-blue-500/30 rounded-2xl p-5 hover:border-blue-500/40 transition-colors duration-200">
          <div className="w-11 h-11 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
            <Info className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
          </div>
          <span className="text-3xl font-bold text-blue-400 tracking-tight">{infoCount}</span>
          <span className="text-xs text-muted-foreground font-medium">Info</span>
        </div>
      </div>

      {/* Files analyzed */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground bg-secondary border border-border rounded-xl px-4 py-3 hover:bg-secondary/80 hover:border-amber-500/20 transition-colors duration-200">
        <div className="w-9 h-9 bg-primary/5 border border-border rounded-lg flex items-center justify-center">
          <FileCode className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <span className="font-medium">{filesAnalyzed} files analyzed</span>
      </div>

      {/* Tech stack badges */}
      {allTech.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 bg-amber-500 rounded-full" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Stack Detected</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTech.map(({ label, type }) => (
              <span
                key={`${type}-${label}`}
                className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors duration-200 ${TECH_COLORS[type] || 'bg-gray-700/50 text-gray-300 border-gray-600 hover:border-gray-500'}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
