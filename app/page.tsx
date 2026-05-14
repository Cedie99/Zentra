import Link from 'next/link'
import { Navbar } from '@/components/landing/navbar'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Features } from '@/components/landing/features'
import { AnalysisCategories } from '@/components/landing/analysis-categories'
import { UseCases } from '@/components/landing/use-cases'
import { Pricing } from '@/components/landing/pricing'
import { CTASection } from '@/components/landing/cta-section'
import { TrustSecurity } from '@/components/landing/trust-security'
import { Footer } from '@/components/landing/footer'
import { Sparkles, ArrowRight, Terminal, ShieldCheck, Zap, CheckCircle2, Lock, EyeOff } from 'lucide-react'

export default function RootPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 relative overflow-hidden pt-32">
        {/* Background glow — single, subtle */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-amber-500/6 rounded-full blur-3xl" />
        </div>

        <main className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wide uppercase mb-8">
            <Sparkles className="w-3 h-3" />
            AI-Powered Code Analysis
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.08] tracking-tight mb-6">
            Know If Your Code Is
            <span className="block text-amber-500 mt-2">
              Production Ready
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Point it at any <span className="text-foreground font-medium">public GitHub repository</span> and get an AI-generated verdict — analyzing your <span className="text-foreground font-medium">architecture and system design</span>, health score, security findings, deployment risks, and prioritized fixes.
          </p>

          {/* Trust strip — addresses the Reddit concern directly, above the CTA */}
          <div className="inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 py-3 bg-green-500/5 border border-green-500/15 rounded-xl mb-8">
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
              No repo access requested
            </span>
            <span className="hidden sm:block w-px h-3 bg-border" />
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
              Your code is never stored
            </span>
            <span className="hidden sm:block w-px h-3 bg-border" />
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
              Public repos only
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mb-8">
            <Link
              href="/dashboard"
              className="group px-7 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center gap-2 text-sm"
            >
              Analyze a Repository
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-7 py-3 border border-border hover:border-border/80 text-muted-foreground hover:text-foreground font-medium rounded-lg transition-all duration-200 hover:bg-secondary flex items-center gap-2 text-sm"
            >
              <Terminal className="w-4 h-4" strokeWidth={1.5} />
              How It Works
            </Link>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: Sparkles, label: 'Claude AI' },
              { icon: ShieldCheck, label: '78 rules across 7 categories' },
              { icon: Zap, label: 'Up to 150 files' },
              { icon: CheckCircle2, label: 'Free to start' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-full text-xs text-muted-foreground">
                <Icon className="w-3 h-3 text-amber-400/80" strokeWidth={1.5} />
                {label}
              </div>
            ))}
          </div>
        </main>
      </div>

      <HowItWorks />
      <AnalysisCategories />
      <Features />
      <UseCases />
      <TrustSecurity />
      <Pricing />
      <CTASection />
      <Footer />
    </div>
  )
}
