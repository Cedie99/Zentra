import { Shield, Database, Zap, AlertCircle, TrendingUp, Box, Rocket, CheckCircle } from 'lucide-react'
import type { Section } from '@/app/(dashboard)/reports/[id]/page'

interface CategoryGridProps {
  sections: Section[]
  categories: string[]
  selectedCategory: string
  onSelect: (category: string) => void
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType }> = {
  SECURITY: { label: 'Security', icon: Shield },
  DATABASE: { label: 'Database', icon: Database },
  CACHING: { label: 'Caching', icon: Zap },
  ERROR_HANDLING: { label: 'Error Handling', icon: AlertCircle },
  SCALABILITY: { label: 'Scalability', icon: TrendingUp },
  ARCHITECTURE: { label: 'Architecture', icon: Box },
  DEPLOYMENT: { label: 'Deployment', icon: Rocket },
}

const SEVERITY_STYLES: Record<string, { border: string; iconColor: string; badge: string }> = {
  CRITICAL: {
    border: 'border-red-500/40 hover:border-red-500/60',
    iconColor: 'text-red-400',
    badge: 'bg-red-500/15 text-red-400 border-red-500/25',
  },
  WARNING: {
    border: 'border-yellow-500/30 hover:border-yellow-500/50',
    iconColor: 'text-yellow-400',
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  },
  INFO: {
    border: 'border-blue-500/25 hover:border-blue-500/45',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  },
}

export function CategoryGrid({ sections, categories, selectedCategory, onSelect }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-7 gap-3">
      {categories.map((cat) => {
        const meta = CATEGORY_META[cat] ?? { label: cat, icon: Box }
        const Icon = meta.icon
        const section = sections.find((s) => s.category === cat)
        const issueCount = section?.issueCount ?? 0
        const severity = section?.severity ?? 'INFO'
        const isSelected = selectedCategory === cat
        const hasIssues = issueCount > 0
        const style = hasIssues ? SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.INFO : null

        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`
              relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-150 text-center
              ${isSelected
                ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/10'
                : hasIssues
                  ? `bg-card ${style!.border}`
                  : 'bg-card border-border hover:border-border/80'
              }
            `}
          >
            <Icon
              className={`w-5 h-5 ${
                isSelected
                  ? 'text-amber-400'
                  : hasIssues
                    ? style!.iconColor
                    : 'text-green-400'
              }`}
              strokeWidth={1.5}
            />
            <span className={`text-[11px] font-medium leading-tight ${isSelected ? 'text-amber-400' : 'text-muted-foreground'}`}>
              {meta.label}
            </span>
            {hasIssues ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                isSelected ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : style!.badge
              }`}>
                {issueCount}
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[10px] text-green-400 font-medium">
                <CheckCircle className="w-2.5 h-2.5" />
                OK
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
