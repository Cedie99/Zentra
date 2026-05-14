import { Globe, Sparkles, BarChart3 } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      icon: Globe,
      title: 'Paste a Public Repo',
      description: 'Enter any public GitHub repository in owner/repo format. No installation, no CLI, no tokens. Files are fetched via the public GitHub API — your account is never used to access code.',
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
    <section id="how-it-works" className="py-28 px-4 bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/4 to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            How It <span className="text-amber-500">Works</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
            From repo URL to a full AI production readiness report in under a minute
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-amber-500/20 via-amber-500/40 to-amber-500/20 pointer-events-none" />

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-card border border-border rounded-2xl p-7 hover:border-amber-500/25 transition-colors duration-200"
            >
              {/* Step number */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="w-9 h-9 bg-secondary border border-border rounded-xl flex items-center justify-center">
                  <step.icon className="w-4.5 h-4.5 text-amber-400" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2 tracking-tight">
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
