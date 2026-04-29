import { Shield, Zap, Layers, Code, Search, BarChart3, Lock, CheckCircle, ArrowRight } from 'lucide-react'

export function Features() {
  const features = [
    {
      icon: Shield,
      title: 'Security Analysis',
      description: 'Detect vulnerabilities, security flaws, and potential risks before they become problems.',
      color: 'red',
    },
    {
      icon: Zap,
      title: 'Performance Insights',
      description: 'Identify bottlenecks and optimization opportunities to ensure your code runs efficiently.',
      color: 'yellow',
    },
    {
      icon: Layers,
      title: 'Architecture Review',
      description: 'Analyze code structure, design patterns, and architectural best practices.',
      color: 'blue',
    },
    {
      icon: Code,
      title: 'Code Quality',
      description: 'Evaluate maintainability, readability, and adherence to coding standards.',
      color: 'green',
    },
    {
      icon: Search,
      title: 'Deep Code Search',
      description: 'Powerful search capabilities to find specific patterns across your entire codebase.',
      color: 'purple',
    },
    {
      icon: BarChart3,
      title: 'Metrics Dashboard',
      description: 'Visualize code health metrics with comprehensive charts and trend analysis.',
      color: 'cyan',
    },
    {
      icon: Lock,
      title: 'Private & Secure',
      description: 'Your code never leaves our secure environment. Enterprise-grade security included.',
      color: 'orange',
    },
    {
      icon: CheckCircle,
      title: 'Best Practices',
      description: 'Get recommendations based on industry standards and framework-specific guidelines.',
      color: 'emerald',
    },
  ]

  const colorMap = {
    red: 'bg-red-500/20 border-red-500/20 hover:bg-red-500/30',
    yellow: 'bg-yellow-500/20 border-yellow-500/20 hover:bg-yellow-500/30',
    blue: 'bg-blue-500/20 border-blue-500/20 hover:bg-blue-500/30',
    green: 'bg-green-500/20 border-green-500/20 hover:bg-green-500/30',
    purple: 'bg-purple-500/20 border-purple-500/20 hover:bg-purple-500/30',
    cyan: 'bg-cyan-500/20 border-cyan-500/20 hover:bg-cyan-500/30',
    orange: 'bg-orange-500/20 border-orange-500/20 hover:bg-orange-500/30',
    emerald: 'bg-emerald-500/20 border-emerald-500/20 hover:bg-emerald-500/30',
  }

  const iconColorMap = {
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
    orange: 'text-orange-400',
    emerald: 'text-emerald-400',
  }

  return (
    <section id="features" className="py-32 px-4 bg-background relative overflow-hidden">
      {/* Gradient accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Comprehensive Analysis
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Powerful <span className="text-amber-500">Features</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Everything you need to ensure your code is production-ready
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-card border border-border rounded-2xl p-6 hover:border-amber-500/50 hover:bg-secondary hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-default"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-12 h-12 ${colorMap[feature.color as keyof typeof colorMap]} border rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110`}>
                <feature.icon className={`w-6 h-6 ${iconColorMap[feature.color as keyof typeof iconColorMap]}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight group-hover:text-amber-500 transition-colors">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              <div className="mt-4 flex items-center gap-2 text-amber-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
