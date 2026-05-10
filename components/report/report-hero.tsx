import { XCircle, AlertTriangle, Info, FileCode } from 'lucide-react'

interface ReportHeroProps {
  healthScore: number | null
  criticalCount: number
  warningCount: number
  infoCount: number
  filesAnalyzed: number
  techStack: Record<string, string[]>
}

function getScoreConfig(score: number) {
  if (score >= 85) return { stroke: '#22c55e', text: 'text-green-400', label: 'Excellent', bg: 'bg-green-500/10', border: 'border-green-500/20' }
  if (score >= 70) return { stroke: '#f59e0b', text: 'text-amber-400', label: 'Good', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  if (score >= 50) return { stroke: '#eab308', text: 'text-yellow-400', label: 'Fair', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
  if (score >= 30) return { stroke: '#f97316', text: 'text-orange-400', label: 'Poor', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
  return { stroke: '#ef4444', text: 'text-red-400', label: 'Critical', bg: 'bg-red-500/10', border: 'border-red-500/20' }
}

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

export function ReportHero({
  healthScore,
  criticalCount,
  warningCount,
  infoCount,
  filesAnalyzed,
  techStack,
}: ReportHeroProps) {
  const score = healthScore ?? 0
  const config = getScoreConfig(score)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const allTech: { label: string; type: string }[] = []
  for (const [type, items] of Object.entries(techStack)) {
    if (Array.isArray(items)) {
      items.forEach((item) => allTech.push({ label: item, type }))
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex gap-8 items-start">

        {/* Health score gauge */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={config.stroke}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold tracking-tight ${config.text}`}>
                {healthScore ?? '—'}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">/ 100</span>
            </div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-lg border ${config.text} ${config.bg} ${config.border}`}>
            {config.label}
          </span>
        </div>

        {/* Stats + tech stack */}
        <div className="flex-1 space-y-5">
          {/* Issue counts */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-2xl font-bold text-red-400 leading-none">{criticalCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Critical</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-2xl font-bold text-yellow-400 leading-none">{warningCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Warnings</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-2xl font-bold text-blue-400 leading-none">{infoCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Info</p>
              </div>
            </div>
          </div>

          {/* Files analyzed */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileCode className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{filesAnalyzed} files analyzed</span>
          </div>

          {/* Tech stack */}
          {allTech.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                Stack detected
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allTech.map(({ label, type }) => (
                  <span
                    key={`${type}-${label}`}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                      TECH_COLORS[type] ?? 'bg-secondary text-muted-foreground border-border'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
