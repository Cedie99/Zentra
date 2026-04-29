import Link from 'next/link'
import { Navbar } from '@/components/landing/navbar'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Features } from '@/components/landing/features'
import { AnalysisCategories } from '@/components/landing/analysis-categories'
import { UseCases } from '@/components/landing/use-cases'
import { CTASection } from '@/components/landing/cta-section'
import { Footer } from '@/components/landing/footer'
import { Code2, Zap, ArrowRight, Terminal, CheckCircle2, Globe } from 'lucide-react'

export default function RootPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 relative overflow-hidden pt-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-linear-to-r from-amber-500/5 via-transparent to-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* Floating code snippets */}
        <div className="absolute top-20 left-10 opacity-50 hidden lg:block animate-float" style={{ animationDuration: '6s' }}>
          <div className="bg-card border border-border rounded-lg p-4 shadow-xl">
            <div className="flex gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <code className="text-xs text-foreground">
              <span className="text-amber-500">const</span> <span className="text-blue-500">analyze</span> = <span className="text-amber-500">await</span> repo.<span className="text-blue-500">scan</span>()
            </code>
          </div>
        </div>
        <div className="absolute bottom-32 right-10 opacity-50 hidden lg:block animate-float" style={{ animationDuration: '8s', animationDelay: '2s' }}>
          <div className="bg-card border border-border rounded-lg p-4 shadow-xl">
            <div className="flex gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <code className="text-xs text-foreground">
              <span className="text-green-500">✓</span> Security: <span className="text-amber-500">92</span>%<br />
              <span className="text-green-500">✓</span> Architecture: <span className="text-amber-500">88</span>%
            </code>
          </div>
        </div>

        <main className="max-w-6xl mx-auto text-center relative z-10">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-4 hover:bg-amber-500/20 transition-colors cursor-default">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Automated Code Analysis
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight">
              Analyze Your
              <span className="block text-amber-500 relative">
                Code Architecture
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none">
                  <path d="M2 6C100 2 300 10 398 6" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" className="animate-dash" />
                </svg>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Instant analysis of your <span className="text-amber-500 font-semibold">GitHub repositories</span>. Architecture, security, performance, and code quality — all automated.
            </p>
          </div>

          {/* Feature highlights with icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-4 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 group cursor-default text-center">
              <Code2 className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground mb-1">34</div>
              <div className="text-xs text-muted-foreground">Analysis Rules</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 group cursor-default text-center">
              <Zap className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground mb-1">~30s</div>
              <div className="text-xs text-muted-foreground">Average Scan Time</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 group cursor-default text-center">
              <CheckCircle2 className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground mb-1">100%</div>
              <div className="text-xs text-muted-foreground">Automated</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 group cursor-default text-center">
              <Globe className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground mb-1">24/7</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link
              href="/dashboard"
              className="group px-8 py-3 bg-amber-500 hover:bg-amber-600 text-foreground font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-3 border border-border hover:border-amber-500/50 text-foreground font-semibold rounded-lg transition-all duration-300 hover:bg-secondary flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              See How It Works
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Free for open source projects
          </p>
        </main>
      </div>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Analysis Categories Section */}
      <AnalysisCategories />

      {/* Features Section */}
      <Features />

      {/* Use Cases Section */}
      <UseCases />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  )
}
