import { Layers, Shield, Database, Zap, AlertTriangle, Server, Cpu } from 'lucide-react'

export async function AnalysisCategories() {
  const categories = [
    {
      icon: Layers,
      title: 'Architecture',
      count: 12,
      description: 'Detect god files, circular dependencies, business logic in routes, TypeScript strict mode, and more.',
      items: ['God file detection', 'Circular dependency analysis', 'Service layer separation', 'TypeScript strict mode', 'Deep nesting detection', 'Hardcoded config values'],
      color: 'blue',
    },
    {
      icon: Shield,
      title: 'Security',
      count: 12,
      description: 'Find hardcoded secrets, open CORS, missing auth, CSRF protection, weak password hashing, and more.',
      items: ['Secret detection', 'CORS configuration', 'Auth middleware', 'Rate limiting', 'JWT expiration', 'Input validation', 'CSRF protection'],
      color: 'red',
    },
    {
      icon: Database,
      title: 'Database',
      count: 11,
      description: 'Analyze query patterns, indexing, pagination, SQL injection, connection pooling, and transactions.',
      items: ['N+1 query detection', 'Missing pagination', 'Index analysis', 'SQL injection', 'Connection pooling', 'Transaction safety'],
      color: 'purple',
    },
    {
      icon: Zap,
      title: 'Caching',
      count: 10,
      description: 'Detect missing cache layers, uncached DB queries, absent HTTP cache headers, and cache TTL issues.',
      items: ['Cache layer detection', 'Route query caching', 'HTTP cache headers', 'Cache TTL validation', 'Duplicate query detection', 'ETag support'],
      color: 'yellow',
    },
    {
      icon: AlertTriangle,
      title: 'Error Handling',
      count: 10,
      description: 'Review async error handling, swallowed exceptions, global handlers, retry logic, and graceful shutdown.',
      items: ['Async error handling', 'Swallowed errors', 'Global error handler', 'API call timeouts', 'Retry logic', 'Graceful shutdown'],
      color: 'orange',
    },
    {
      icon: Server,
      title: 'Deployment',
      count: 12,
      description: 'Check Dockerfile, CI/CD, health checks, env validation, hardcoded localhost, and more.',
      items: ['Dockerfile', '.env.example', 'Health check endpoint', 'CI/CD config', 'Env var validation', 'Hardcoded localhost', 'Dev deps in prod'],
      color: 'green',
    },
    {
      icon: Cpu,
      title: 'Scalability',
      count: 11,
      description: 'Assess session stores, rate limiter storage, file uploads, blocking I/O, and global state.',
      items: ['Session store analysis', 'Rate limiter storage', 'File upload storage', 'Distributed locks', 'Blocking I/O detection', 'Global state detection'],
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
            78 Analysis Rules
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            What We <span className="text-amber-500">Analyze</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Comprehensive code analysis across 7 critical categories with 78 automated rules
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className={`bg-card border border-border rounded-2xl p-6 ${bgColorMap[category.color as keyof typeof bgColorMap]} transition-colors duration-200`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${colorMap[category.color as keyof typeof colorMap]} border rounded-2xl flex items-center justify-center`}>
                  <category.icon className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <div className="text-3xl font-bold text-foreground/20">
                  {category.count}
                </div>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
                {category.title}
              </h3>

              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {category.description}
              </p>

              <div className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
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
