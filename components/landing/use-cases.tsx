import { Users, Building2, Rocket, ShieldCheck, GitMerge, TrendingUp, Check } from 'lucide-react'

export function UseCases() {
  const useCases = [
    {
      icon: Rocket,
      title: 'Founders & Indie Hackers',
      description: 'Shipping fast but unsure if your codebase can handle real users? Get an honest production readiness verdict before launch day.',
      benefits: ['Pre-launch health check', 'Security blind spots', 'Scalability risks'],
      color: 'amber',
    },
    {
      icon: Users,
      title: 'Development Teams',
      description: 'Use AI-generated reports as a starting point for code reviews — so reviewers focus on logic, not checklists.',
      benefits: ['Faster PR reviews', 'Consistent standards', 'Reduced back-and-forth'],
      color: 'blue',
    },
    {
      icon: ShieldCheck,
      title: 'Security Engineers',
      description: 'Surface hardcoded secrets, open CORS, missing auth, and exposed error messages across the entire codebase automatically.',
      benefits: ['Secret detection', 'Auth middleware gaps', 'Error exposure analysis'],
      color: 'red',
    },
    {
      icon: GitMerge,
      title: 'Open Source Maintainers',
      description: 'Give contributors and users confidence that your project meets production quality standards with a shareable health report.',
      benefits: ['Public health score', 'Architecture overview', 'Contributor guidance'],
      color: 'green',
    },
    {
      icon: Building2,
      title: 'Tech Leads & Architects',
      description: 'Spot architectural drift — god files, missing service layers, and mixed async patterns — before they become expensive refactors.',
      benefits: ['Architecture review', 'Debt visibility', 'AI-specific suggestions'],
      color: 'purple',
    },
    {
      icon: TrendingUp,
      title: 'Hiring & Due Diligence',
      description: "Evaluate a codebase's quality quickly during technical due diligence or when assessing a new engineering hire's previous work.",
      benefits: ['Quick quality signal', 'Objective findings', 'No manual review needed'],
      color: 'cyan',
    },
  ]

  const colorMap: Record<string, string> = {
    amber: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    red: 'bg-red-500/20 border-red-500/30 text-red-400',
    green: 'bg-green-500/20 border-green-500/30 text-green-400',
    purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  }

  const hoverMap: Record<string, string> = {
    amber: 'hover:border-amber-500/50',
    blue: 'hover:border-blue-500/50',
    red: 'hover:border-red-500/50',
    green: 'hover:border-green-500/50',
    purple: 'hover:border-purple-500/50',
    cyan: 'hover:border-cyan-500/50',
  }

  return (
    <section id="use-cases" className="py-32 px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Who It's For
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Built for <span className="text-amber-500">Every Team</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Whether you're shipping your first product or managing a large codebase, get an AI assessment that fits your workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className={`group bg-card border border-border rounded-2xl p-6 ${hoverMap[useCase.color]} hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-200 cursor-default`}
            >
              <div className={`w-13 h-13 ${colorMap[useCase.color]} border rounded-2xl flex items-center justify-center mb-4 w-12 h-12 transition-transform duration-200 group-hover:scale-110`}>
                <useCase.icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight group-hover:text-amber-400 transition-colors">
                {useCase.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {useCase.description}
              </p>
              <div className="space-y-1.5">
                {useCase.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 bg-card border border-border rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '34', label: 'Automated rules' },
              { value: '7', label: 'Analysis categories' },
              { value: '150', label: 'Files scanned' },
              { value: 'AI', label: 'Powered by Claude' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-bold text-amber-400 mb-2">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
