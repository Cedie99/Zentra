import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className="py-32 px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-card border border-border rounded-3xl p-8 md:p-16 text-center shadow-2xl shadow-amber-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered · Free to try
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Is Your Code
              <span className="block text-amber-500 mt-1">Ready for Production?</span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Paste a GitHub repo and get a full AI assessment — health score, security findings, production risks, and a verdict — in under a minute.
            </p>

            <div className="flex flex-wrap justify-center gap-5 mb-10">
              {[
                'No credit card required',
                'Works with any public repo',
                'Powered by Claude AI',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 text-lg"
            >
              Analyze a Repository
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
