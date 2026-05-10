import { Sparkles } from 'lucide-react'

interface AISummaryBannerProps {
  summary: string
}

export function AISummaryBanner({ summary }: AISummaryBannerProps) {
  return (
    <div className="relative rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 overflow-hidden">
      {/* subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="flex gap-3 relative">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
            AI Assessment
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  )
}
