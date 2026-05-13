import Link from 'next/link'
import { Navbar } from '@/components/landing/navbar'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Features } from '@/components/landing/features'
import { AnalysisCategories } from '@/components/landing/analysis-categories'
import { UseCases } from '@/components/landing/use-cases'
import { Pricing } from '@/components/landing/pricing'
import { CTASection } from '@/components/landing/cta-section'
import { Footer } from '@/components/landing/footer'
import { Sparkles, ArrowRight, Terminal, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react'

export default function RootPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 relative overflow-hidden pt-32">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Floating cards */}
        <div className="absolute top-28 left-10 opacity-60 hidden lg:block animate-float" style={{ animationDuration: '6s' }}>
          <div className="bg-card border border-border rounded-xl p-4 shadow-xl">
            <div className="flex gap-1.5 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <code className="text-xs text-muted-foreground">
              <span className="text-amber-400">AI</span> scanning <span className="text-blue-400">150</span> files…
            </code>
          </div>
        </div>
        <div className="absolute bottom-36 right-10 opacity-60 hidden lg:block animate-float" style={{ animationDuration: '8s', animationDelay: '2s' }}>
          <div className="bg-card border border-green-500/30 rounded-xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-green-400">Production Ready</span>
            </div>
            <code className="text-xs text-muted-foreground">
              Health Score: <span className="text-amber-400 font-bold">87</span>/100
            </code>
          </div>
        </div>

        <main className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Code Analysis
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight mb-6">
            Know If Your Code Is
            <span className="block text-amber-500 relative mt-1">
              Production Ready
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 500 10" fill="none">
                <path d="M2 5C125 1.5 375 8.5 498 5" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Connect your <span className="text-amber-400 font-medium">GitHub repository</span> and get an AI-generated production readiness verdict — with a health score, security findings, deployment risks, and actionable fixes.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {[
              { icon: Sparkles, label: 'Claude AI analysis' },
              { icon: ShieldCheck, label: '78 rules · 7 categories' },
              { icon: Zap, label: 'Up to 150 files' },
              { icon: CheckCircle2, label: 'Production verdict' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-full text-xs text-muted-foreground">
                <Icon className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                {label}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link
              href="/dashboard"
              className="group px-8 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 flex items-center gap-2"
            >
              Analyze a Repository
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-3 border border-border hover:border-amber-500/40 text-foreground font-semibold rounded-lg transition-all duration-200 hover:bg-secondary flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              See How It Works
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-5">
            No credit card required · Works with any public GitHub repository
          </p>
        </main>
      </div>

      <HowItWorks />
      <AnalysisCategories />
      <Features />
      <Pricing />
      <UseCases />
      <CTASection />
      <Footer />
    </div>
  )
}
