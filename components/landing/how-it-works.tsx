import { GitBranch, Sparkles, BarChart3 } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      icon: GitBranch,
      title: 'Connect a Repository',
      description: 'Paste any GitHub owner/repo. No installation, CLI, or tokens needed for public repos. Private repos work with your GitHub account.',
    },
    {
      icon: Sparkles,
      title: 'AI Scans Your Code',
      description: 'We fetch up to 150 of your most important files and run 78 automated rules across 7 categories. Claude AI then filters false positives, finds issues the rules missed, and writes codebase-specific suggestions.',
    },
    {
      icon: BarChart3,
      title: 'Get Your Verdict',
      description: 'Receive a production readiness verdict — Ready, Needs Work, or Not Ready — with a 0–100 health score, an AI-written assessment, concrete strengths and risks, and one recommended next step.',
    },
  ]

  return (
    <section id="how-it-works" className="py-32 px-4 bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            How It <span className="text-amber-500">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            From repo URL to a full AI production readiness report in under a minute
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-card border border-border rounded-3xl p-8 hover:border-amber-500/30 transition-colors duration-200 shadow-sm"
            >
              <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/25 rounded-2xl flex items-center justify-center mb-6">
                <step.icon className="w-7 h-7 text-amber-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight flex items-center gap-3">
                <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
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
