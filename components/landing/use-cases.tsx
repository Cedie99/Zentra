import { Users, Building2, Rocket, ShieldCheck, Clock, TrendingUp, ArrowRight, Check } from 'lucide-react'

export function UseCases() {
  const useCases = [
    {
      icon: Users,
      title: 'Development Teams',
      description: 'Streamline code reviews and maintain consistency across your team with automated architecture analysis.',
      benefits: ['Faster code reviews', 'Consistent standards', 'Reduced technical debt'],
      color: 'blue',
    },
    {
      icon: Building2,
      title: 'Enterprise Companies',
      description: 'Ensure security and compliance across all repositories with enterprise-grade analysis tools.',
      benefits: ['Security compliance', 'Risk mitigation', 'Audit trails'],
      color: 'purple',
    },
    {
      icon: Rocket,
      title: 'Startups',
      description: 'Build scalable architecture from day one with proactive analysis and best practice recommendations.',
      benefits: ['Scalable foundation', 'Best practices', 'Quick iteration'],
      color: 'amber',
    },
    {
      icon: ShieldCheck,
      title: 'Security Teams',
      description: 'Identify vulnerabilities and security flaws before they reach production with automated scanning.',
      benefits: ['Vulnerability detection', 'Secret scanning', 'CORS analysis'],
      color: 'red',
    },
    {
      icon: Clock,
      title: 'DevOps Engineers',
      description: 'Integrate analysis into your CI/CD pipeline for continuous code quality monitoring.',
      benefits: ['CI/CD integration', 'Automated checks', 'Quality gates'],
      color: 'green',
    },
    {
      icon: TrendingUp,
      title: 'Tech Leads',
      description: 'Track code health metrics over time and make data-driven decisions for technical improvements.',
      benefits: ['Health metrics', 'Trend analysis', 'Data insights'],
      color: 'cyan',
    },
  ]

  const colorMap = {
    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    amber: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/20 border-red-500/30 text-red-400',
    green: 'bg-green-500/20 border-green-500/30 text-green-400',
    cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  }

  const bgColorMap = {
    blue: 'hover:border-blue-500/50',
    purple: 'hover:border-purple-500/50',
    amber: 'hover:border-amber-500/50',
    red: 'hover:border-red-500/50',
    green: 'hover:border-green-500/50',
    cyan: 'hover:border-cyan-500/50',
  }

  return (
    <section id="use-cases" className="py-32 px-4 bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Who It's For
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Built for <span className="text-amber-500">Every Team</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            From startups to enterprises, our architecture analyzer adapts to your workflow and scale
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className={`group bg-card border border-border rounded-2xl p-6 ${bgColorMap[useCase.color as keyof typeof bgColorMap]} hover:bg-card hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-default`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-14 h-14 ${colorMap[useCase.color as keyof typeof colorMap]} border rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110`}>
                <useCase.icon className="w-7 h-7" strokeWidth={1.5} />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight group-hover:text-amber-500 transition-colors">
                {useCase.title}
              </h3>
              
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {useCase.description}
              </p>
              
              <div className="space-y-2">
                {useCase.benefits.map((benefit, benefitIndex) => (
                  <div key={benefitIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-amber-500 shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-amber-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Stats banner */}
        <div className="mt-16 bg-card border border-border rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-foreground mb-2">34+</div>
              <div className="text-sm text-muted-foreground">Analysis Rules</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-foreground mb-2">7</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-foreground mb-2">~30s</div>
              <div className="text-sm text-muted-foreground">Scan Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-foreground mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Automated</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
