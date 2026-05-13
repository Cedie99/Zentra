import { Sparkles, CheckCircle2, ShieldCheck, TrendingUp, Zap, FileSearch, SlidersHorizontal, GitBranch } from 'lucide-react'

export function Features() {
  const features = [
    {
      icon: Sparkles,
      title: 'Claude AI Enhancement',
      description: 'After automated rules run, Claude AI reviews the findings — removing false positives, discovering missed issues, and rewriting suggestions to reference your actual code.',
      color: 'amber',
    },
    {
      icon: CheckCircle2,
      title: 'Production Readiness Verdict',
      description: 'Every report ends with a clear verdict: Ready, Needs Work, or Not Ready — with a confidence score and one recommended next step before you deploy.',
      color: 'green',
    },
    {
      icon: ShieldCheck,
      title: 'Security Analysis',
      description: 'Detect hardcoded secrets, open CORS, missing auth middleware, exposed error messages, and insecure configurations before they reach production.',
      color: 'red',
    },
    {
      icon: TrendingUp,
      title: 'Scalability & Architecture',
      description: 'Identify god files, missing service layers, N+1 queries, lack of caching, and patterns that will bottleneck you as your user base grows.',
      color: 'blue',
    },
    {
      icon: Zap,
      title: 'Health Score',
      description: 'A single 0–100 score calculated from issue severity and count across all 7 categories — giving you a quick read on overall code quality.',
      color: 'yellow',
    },
    {
      icon: FileSearch,
      title: 'Evidence-Based Issues',
      description: 'Every issue links to the exact file and line number with a code snippet as evidence, so you know precisely where to look and what to change.',
      color: 'purple',
    },
    {
      icon: SlidersHorizontal,
      title: '78 Automated Rules',
      description: 'Pattern-based rules cover security, database, caching, error handling, scalability, architecture, and deployment — all running in parallel.',
      color: 'cyan',
    },
    {
      icon: GitBranch,
      title: 'Up to 150 Files Scanned',
      description: 'Prioritised file selection fetches config files, schemas, routes, and services first — ensuring the most important code always gets analysed.',
      color: 'emerald',
    },
  ]

  const colorMap: Record<string, string> = {
    amber: 'bg-amber-500/20 border-amber-500/20',
    green: 'bg-green-500/20 border-green-500/20',
    red: 'bg-red-500/20 border-red-500/20',
    blue: 'bg-blue-500/20 border-blue-500/20',
    yellow: 'bg-yellow-500/20 border-yellow-500/20',
    purple: 'bg-purple-500/20 border-purple-500/20',
    cyan: 'bg-cyan-500/20 border-cyan-500/20',
    emerald: 'bg-emerald-500/20 border-emerald-500/20',
  }

  const iconColorMap: Record<string, string> = {
    amber: 'text-amber-400',
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
  }

  return (
    <section id="features" className="py-32 px-4 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            What You <span className="text-amber-500">Get</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            More than a linter — a full AI assessment of whether your code is ready to ship
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-card border border-border rounded-2xl p-6 hover:border-amber-500/40 hover:bg-secondary hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-200 cursor-default"
            >
              <div className={`w-11 h-11 ${colorMap[feature.color]} border rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110`}>
                <feature.icon className={`w-5 h-5 ${iconColorMap[feature.color]}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2 tracking-tight group-hover:text-amber-400 transition-colors">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
