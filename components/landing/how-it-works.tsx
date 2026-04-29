import { Code2, FileText, Zap } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      icon: Code2,
      title: 'Connect Repository',
      description: 'Paste your GitHub repository URL or owner/repo to begin the analysis process.',
    },
    {
      icon: FileText,
      title: 'Analyze Code',
      description: 'Our AI-powered engine scans your codebase for architecture patterns, code quality, and best practices.',
    },
    {
      icon: Zap,
      title: 'Get Insights',
      description: 'Receive a comprehensive report with actionable recommendations to improve your code.',
    },
  ]

  return (
    <section id="how-it-works" className="py-32 px-4 bg-background relative">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            How It <span className="text-amber-500">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Get production-readiness insights in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group bg-card border border-border rounded-3xl p-8 hover:border-amber-500/30 hover:bg-secondary transition-colors duration-200 shadow-sm"
            >
              <div className="w-14 h-14 bg-amber-500/20 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-200">
                <step.icon className="w-7 h-7 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight flex items-center gap-3">
                <span className="w-6 h-6 bg-amber-500 border border-amber-500 rounded-full flex items-center justify-center text-background font-bold text-xs">
                  {index + 1}
                </span>
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
