import {
  CheckCircle2, AlertTriangle, XCircle, Zap,
  ShieldCheck, TrendingUp, Sparkles, RefreshCw,
} from 'lucide-react'

interface ProductionReadiness {
  verdict: 'READY' | 'NEEDS_WORK' | 'NOT_READY'
  confidence: number
  summary: string
  strengths: string[]
  risks: string[]
  recommendation: string
}

interface ProductionReadinessHeroProps {
  productionReadiness: ProductionReadiness | null
  aiSummary: string | null
  healthScore: number | null
}

const VERDICT_CONFIG = {
  READY: {
    icon: CheckCircle2,
    label: 'Production Ready',
    sublabel: 'This codebase is ready to deploy',
    color: 'text-green-400',
    border: 'border-green-500/30',
    bg: 'bg-green-500/5',
    glow: 'shadow-green-500/10',
    barColor: 'bg-green-500',
    pill: 'bg-green-500/15 border-green-500/30 text-green-400',
    dotColor: 'bg-green-400',
  },
  NEEDS_WORK: {
    icon: AlertTriangle,
    label: 'Needs Work',
    sublabel: 'Address issues before deploying',
    color: 'text-yellow-400',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    glow: 'shadow-yellow-500/10',
    barColor: 'bg-yellow-500',
    pill: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
    dotColor: 'bg-yellow-400',
  },
  NOT_READY: {
    icon: XCircle,
    label: 'Not Ready',
    sublabel: 'Critical blockers must be resolved first',
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    glow: 'shadow-red-500/10',
    barColor: 'bg-red-500',
    pill: 'bg-red-500/15 border-red-500/30 text-red-400',
    dotColor: 'bg-red-400',
  },
}

function NoAIData() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
      <div className="w-12 h-12 bg-secondary border border-border rounded-2xl flex items-center justify-center mx-auto">
        <RefreshCw className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">No AI assessment yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Re-run the analysis to get an AI-powered production readiness assessment for this repository.
        </p>
      </div>
    </div>
  )
}

export function ProductionReadinessHero({
  productionReadiness,
  aiSummary,
  healthScore,
}: ProductionReadinessHeroProps) {
  if (!productionReadiness && !aiSummary) {
    return <NoAIData />
  }

  // If we only have aiSummary but no productionReadiness (old report)
  if (!productionReadiness && aiSummary) {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">AI Assessment</p>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{aiSummary}</p>
        <p className="text-xs text-muted-foreground">
          Re-run the analysis to get a full production readiness breakdown.
        </p>
      </div>
    )
  }

  const pr = productionReadiness!
  const cfg = VERDICT_CONFIG[pr.verdict]
  const Icon = cfg.icon

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} shadow-lg ${cfg.glow} overflow-hidden`}>

      {/* Top: verdict + score */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-white/5 border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${cfg.color}`} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
              Production Readiness
            </p>
            <h2 className={`text-2xl font-bold ${cfg.color}`}>{cfg.label}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{cfg.sublabel}</p>
          </div>
        </div>

        {/* Health score + confidence */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {healthScore !== null && (
            <div className={`text-3xl font-bold ${cfg.color}`}>
              {healthScore}<span className="text-sm text-muted-foreground font-normal"> / 100</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${cfg.barColor} opacity-60`}
                style={{ width: `${pr.confidence}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{pr.confidence}% confidence</span>
          </div>
        </div>
      </div>

      {/* AI summary */}
      {(aiSummary || pr.summary) && (
        <div className="px-6 py-4 border-t border-white/8">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-sm text-foreground/80 leading-relaxed">
              {aiSummary || pr.summary}
            </p>
          </div>
        </div>
      )}

      {/* Strengths + Risks */}
      <div className="grid grid-cols-2 border-t border-white/8">
        <div className="px-6 py-4 border-r border-white/8">
          <div className="flex items-center gap-1.5 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" strokeWidth={1.5} />
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider">Strengths</h3>
          </div>
          {pr.strengths.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">None identified</p>
          ) : (
            <ul className="space-y-2">
              {pr.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/75 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-red-400" strokeWidth={1.5} />
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Production Risks</h3>
          </div>
          {pr.risks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">None identified</p>
          ) : (
            <ul className="space-y-2">
              {pr.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/75 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recommendation */}
      <div className="px-6 py-3.5 border-t border-white/8 bg-white/3 flex items-start gap-2.5">
        <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-xs text-foreground/70 leading-relaxed">
          <span className="text-amber-400 font-semibold">Recommended next step: </span>
          {pr.recommendation}
        </p>
      </div>
    </div>
  )
}
