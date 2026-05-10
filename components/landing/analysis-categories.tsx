import { Layers, Shield, Database, Zap, AlertTriangle, Server, Cpu, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/auth'

export async function AnalysisCategories() {
  const session = await auth()
  const user = session?.user
  const redirectPath = user ? '/dashboard' : '/signup'
  const categories = [
    {
      icon: Layers,
      title: 'Architecture',
      count: 4,
      description: 'Detect god files, business logic in routes, mixed async styles, and logging issues.',
      items: ['God file detection', 'Service layer analysis', 'Async consistency', 'Structured logging'],
      color: 'blue',
    },
    {
      icon: Shield,
      title: 'Security',
      count: 5,
      description: 'Find hardcoded secrets, open CORS, missing auth, exposed errors, and .env files.',
      items: ['Secret detection', 'CORS configuration', 'Auth middleware', 'Error exposure', '.env files'],
      color: 'red',
    },
    {
      icon: Database,
      title: 'Database',
      count: 5,
      description: 'Analyze query patterns, indexing, pagination, and SQL injection risks.',
      items: ['N+1 query detection', 'Missing pagination', 'Index analysis', 'Field selection', 'SQL injection'],
      color: 'purple',
    },
    {
      icon: Zap,
      title: 'Caching',
      count: 4,
      description: 'Detect missing cache layers, uncached DB queries in routes, and absent HTTP cache headers.',
      items: ['Cache layer detection', 'Route query caching', 'HTTP cache headers', 'CDN config'],
      color: 'yellow',
    },
    {
      icon: AlertTriangle,
      title: 'Error Handling',
      count: 4,
      description: 'Review async error handling, swallowed exceptions, global handlers, and API timeouts.',
      items: ['Async without try-catch', 'Swallowed errors', 'Global error handler', 'API call timeouts'],
      color: 'orange',
    },
    {
      icon: Server,
      title: 'Deployment',
      count: 7,
      description: 'Check Dockerfile, CI/CD, health checks, env validation, and hardcoded localhost.',
      items: ['Dockerfile', '.env.example', 'Health check endpoint', 'CI/CD config', 'Env var validation', 'Localhost in source', 'Dev deps in prod'],
      color: 'green',
    },
    {
      icon: Cpu,
      title: 'Scalability',
      count: 5,
      description: 'Assess code scalability, resource management, and load handling capabilities.',
      items: ['Load balancing', 'Resource limits', 'Async patterns', 'Queue systems'],
      color: 'cyan',
    },
  ]

  const colorMap = {
    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    red: 'bg-red-500/20 border-red-500/30 text-red-400',
    purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    orange: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
    green: 'bg-green-500/20 border-green-500/30 text-green-400',
    cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  }

  const bgColorMap = {
    blue: 'hover:border-blue-500/50',
    red: 'hover:border-red-500/50',
    purple: 'hover:border-purple-500/50',
    yellow: 'hover:border-yellow-500/50',
    orange: 'hover:border-orange-500/50',
    green: 'hover:border-green-500/50',
    cyan: 'hover:border-cyan-500/50',
  }

  return (
    <section id="analysis" className="py-32 px-4 bg-secondary/50 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            34 Analysis Rules
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            What We <span className="text-amber-500">Analyze</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Comprehensive code analysis across 7 critical categories with 34+ automated rules
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={redirectPath}
              className={`group bg-card border border-border rounded-2xl p-6 ${bgColorMap[category.color as keyof typeof bgColorMap]} hover:bg-card hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer block`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${colorMap[category.color as keyof typeof colorMap]} border rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
                  <category.icon className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <div className="text-3xl font-bold text-foreground/30 group-hover:text-amber-500/50 transition-colors">
                  {category.count}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight group-hover:text-amber-500 transition-colors">
                {category.title}
              </h3>
              
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {category.description}
              </p>
              
              <div className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 group-hover:bg-amber-500 transition-colors" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-amber-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                View details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-card border border-border rounded-full">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">Real-time analysis</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <span className="text-sm text-muted-foreground">Actionable insights</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '1s' }} />
              <span className="text-sm text-muted-foreground">Best practices</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
