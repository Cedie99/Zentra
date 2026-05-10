import { CheckCircle2, AlertTriangle, XCircle, Zap, ShieldCheck, TrendingUp } from 'lucide-react'

interface ProductionReadiness {
  verdict: 'READY' | 'NEEDS_WORK' | 'NOT_READY'
  confidence: number
  summary: string
  strengths: string[]
  risks: string[]
  recommendation: string
}

interface ProductionReadinessCardProps {
  data: ProductionReadiness
}

const VERDICT_CONFIG = {
  READY: {
    icon: CheckCircle2,
    label: 'Production Ready',
    color: 'text-green-400',
    border: 'border-green-500/25',
    bg: 'bg-green-500/5',
    badgeBg: 'bg-green-500/15 border-green-500/30 text-green-400',
    barColor: 'bg-green-500',
  },
  NEEDS_WORK: {
    icon: AlertTriangle,
    label: 'Needs Work',
    color: 'text-yellow-400',
    border: 'border-yellow-500/25',
    bg: 'bg-yellow-500/5',
    badgeBg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
    barColor: 'bg-yellow-500',
  },
  NOT_READY: {
    icon: XCircle,
    label: 'Not Ready',
    color: 'text-red-400',
    border: 'border-red-500/25',
    bg: 'bg-red-500/5',
    badgeBg: 'bg-red-500/15 border-red-500/30 text-red-400',
    barColor: 'bg-red-500',
  },
}

export function ProductionReadinessCard({ data }: ProductionReadinessCardProps) {
  const cfg = VERDICT_CONFIG[data.verdict]
  const Icon = cfg.icon

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-white/5 border ${cfg.border} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Production Readiness
            </p>
            <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
          </div>
        </div>

        {/* Confidence meter */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs text-muted-foreground">AI confidence</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${cfg.barColor} opacity-70`}
                style={{ width: `${data.confidence}%` }}
              />
            </div>
            <span className={`text-xs font-semibold ${cfg.color}`}>{data.confidence}%</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 border-b border-white/5">
        <p className="text-sm text-foreground/80 leading-relaxed">{data.summary}</p>
      </div>

      {/* Strengths + Risks */}
      <div className="grid grid-cols-2 divide-x divide-white/5">
        {/* Strengths */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" strokeWidth={1.5} />
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider">Strengths</h3>
          </div>
          {data.strengths.length === 0 ? (
            <p className="text-xs text-muted-foreground">None identified</p>
          ) : (
            <ul className="space-y-2">
              {data.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/75">
                  <span className="w-1 h-1 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Risks */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-red-400" strokeWidth={1.5} />
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Production Risks</h3>
          </div>
          {data.risks.length === 0 ? (
            <p className="text-xs text-muted-foreground">None identified</p>
          ) : (
            <ul className="space-y-2">
              {data.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/75">
                  <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recommendation */}
      <div className="px-6 py-3.5 border-t border-white/5 bg-white/3 flex items-start gap-2.5">
        <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-xs text-foreground/70 leading-relaxed">
          <span className="text-amber-400 font-semibold">Next step: </span>
          {data.recommendation}
        </p>
      </div>
    </div>
  )
}
