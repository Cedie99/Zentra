import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className="py-32 px-4 bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-card border border-border rounded-3xl p-8 md:p-16 text-center shadow-2xl shadow-amber-500/5 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-amber-500 to-transparent" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              Start analyzing in seconds
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
              Ready to Improve Your
              <span className="block text-amber-500 mt-2">Code Architecture?</span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of developers who are already using our AI-powered analyzer to build better, more secure, and scalable applications.
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Free for open source
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Instant results
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              <Link
                href="/dashboard"
                className="group px-8 py-4 bg-amber-500 hover:bg-amber-600 text-foreground font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 flex items-center gap-2 text-lg"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group px-8 py-4 border border-border hover:border-amber-500/50 text-foreground font-semibold rounded-lg transition-all duration-300 hover:bg-secondary flex items-center gap-2 text-lg"
              >
                View on GitHub
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-8">
              Analyze unlimited repositories • Detailed reports • Best practice recommendations
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-6">Trusted by developers from</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
            <div className="text-2xl font-bold text-foreground">Startups</div>
            <div className="w-px h-6 bg-border hidden md:block" />
            <div className="text-2xl font-bold text-foreground">Enterprise</div>
            <div className="w-px h-6 bg-border hidden md:block" />
            <div className="text-2xl font-bold text-foreground">Open Source</div>
            <div className="w-px h-6 bg-border hidden md:block" />
            <div className="text-2xl font-bold text-foreground">Agencies</div>
          </div>
        </div>
      </div>
    </section>
  )
}
