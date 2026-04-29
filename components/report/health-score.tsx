'use client'

interface HealthScoreProps {
  score: number
  label: string
}

const COLOR_MAP: Record<string, { stroke: string; text: string; bg: string; glow: string }> = {
  green: { stroke: '#22c55e', text: 'text-green-400', bg: 'bg-green-400/10', glow: 'shadow-green-500/20' },
  amber: { stroke: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-400/10', glow: 'shadow-amber-500/20' },
  yellow: { stroke: '#eab308', text: 'text-yellow-400', bg: 'bg-yellow-400/10', glow: 'shadow-yellow-500/20' },
  orange: { stroke: '#f97316', text: 'text-orange-400', bg: 'bg-orange-400/10', glow: 'shadow-orange-500/20' },
  red: { stroke: '#ef4444', text: 'text-red-400', bg: 'bg-red-400/10', glow: 'shadow-red-500/20' },
}

function getColor(score: number) {
  if (score >= 85) return COLOR_MAP.green
  if (score >= 70) return COLOR_MAP.amber
  if (score >= 50) return COLOR_MAP.yellow
  if (score >= 30) return COLOR_MAP.orange
  return COLOR_MAP.red
}

export function HealthScore({ score, label }: HealthScoreProps) {
  const color = getColor(score)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-44 h-44">
        {/* Outer glow effect */}
        <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 ${color.glow.replace('shadow-', 'bg-')}`} />
        
        <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            className={color.glow}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className={`text-5xl font-bold ${color.text} tracking-tight`}>{score}</span>
          <span className={`text-xs px-3 py-1.5 rounded-xl border font-medium ${color.text} ${color.bg}`}>/ 100</span>
        </div>
      </div>
      
      {/* Label badge */}
      <span className={`text-sm font-semibold px-5 py-2.5 rounded-xl border ${color.text} ${color.bg}`}>
        {label}
      </span>
    </div>
  )
}
