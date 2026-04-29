import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const cachingRules: AnalysisRule[] = [
  {
    id: 'CACHE_001',
    category: 'CACHING',
    title: 'No cache layer detected',
    description: 'No caching library found in dependencies.',
    severity: 'WARNING',
    suggestion: 'Add Redis (ioredis), node-cache, or a similar caching layer to reduce database load.',
    codeExample: `import Redis from 'ioredis'\nconst redis = new Redis(process.env.REDIS_URL)\n\n// Cache result for 60 seconds\nawait redis.set('key', JSON.stringify(data), 'EX', 60)`,
    detect(files: FetchedFile[]): RuleMatch[] {
      const packageJson = files.find((f) => f.path === 'package.json' || f.path.endsWith('/package.json'))
      if (!packageJson) return []

      let deps: Record<string, string> = {}
      try {
        const parsed = JSON.parse(packageJson.content)
        deps = { ...parsed.dependencies, ...parsed.devDependencies }
      } catch {
        return []
      }

      const cacheLibs = ['redis', 'ioredis', 'node-cache', 'memcached', 'lru-cache', 'cache-manager', 'keyv']
      const hasCache = cacheLibs.some((lib) => lib in deps)
      if (hasCache) return []

      return [
        {
          ruleId: 'CACHE_001',
          title: 'No cache layer detected',
          description: 'No caching library (redis, ioredis, node-cache, etc.) found in package.json.',
          severity: 'WARNING',
          filePath: packageJson.path,
          evidence: 'No cache dependency found',
          suggestion: 'Add Redis (ioredis) or node-cache to reduce database load and improve response times.',
          category: 'CACHING',
        },
      ]
    },
  },

  {
    id: 'CACHE_002',
    category: 'CACHING',
    title: 'DB queries in routes without cache check',
    description: 'Route files query the database without checking a cache first.',
    severity: 'WARNING',
    suggestion: 'Wrap frequent read queries with a cache check using Redis or an in-memory store.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter((f) => /\/(routes|api|controllers)\//.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of routeFiles) {
        const hasDbCall = /prisma\.|\.find\(|\.findMany|db\.query|\.findOne/.test(file.content)
        const hasCacheCheck = /redis\.get|cache\.get|\.get\(|cacheManager/.test(file.content)
        if (hasDbCall && !hasCacheCheck) {
          const lineIdx = file.lines.findIndex((l) => /prisma\.|\.find\(|\.findMany/.test(l))
          matches.push({
            ruleId: 'CACHE_002',
            title: 'DB queries in routes without cache check',
            description: 'This route queries the database directly without a cache layer.',
            severity: 'WARNING',
            filePath: file.path,
            lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
            evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'DB query detected',
            suggestion: 'Cache frequently-read data with Redis using a cache-aside pattern.',
            category: 'CACHING',
          })
          if (matches.length >= 5) break
        }
      }
      return matches
    },
  },

  {
    id: 'CACHE_003',
    category: 'CACHING',
    title: 'No HTTP cache headers on GET routes',
    description: 'Express GET route handlers respond without Cache-Control headers.',
    severity: 'INFO',
    suggestion: 'Add Cache-Control headers to GET responses: res.set("Cache-Control", "public, max-age=300")',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter((f) =>
        /\.(ts|js)$/.test(f.path) &&
        /\/(routes|api|controllers)\//.test(f.path) &&
        !/\.(test|spec)\./.test(f.path)
      )

      for (const file of routeFiles) {
        const hasGetRoute = /router\.(get|app\.get)\(|res\.json\(/.test(file.content)
        const hasCacheHeader = /Cache-Control|cache-control|res\.set\(/.test(file.content)
        if (hasGetRoute && !hasCacheHeader) {
          matches.push({
            ruleId: 'CACHE_003',
            title: 'No HTTP cache headers on GET routes',
            description: 'GET route responds without Cache-Control headers, missing browser/CDN caching.',
            severity: 'INFO',
            filePath: file.path,
            evidence: 'res.json() used without Cache-Control header',
            suggestion: 'Add: res.set("Cache-Control", "public, max-age=300") before res.json()',
            category: 'CACHING',
          })
          if (matches.length >= 3) break
        }
      }
      return matches
    },
  },

  {
    id: 'CACHE_004',
    category: 'CACHING',
    title: 'No CDN or static asset caching config',
    description: 'No CDN cache headers configured in next.config or server config.',
    severity: 'INFO',
    suggestion: 'Configure cache headers in next.config.js headers() or use a CDN like Cloudflare.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const nextConfig = files.find((f) => /next\.config\.(js|ts|mjs)$/.test(f.path))
      if (!nextConfig) return []
      const hasHeaders = /headers\(\)/.test(nextConfig.content) || /Cache-Control/.test(nextConfig.content)
      if (hasHeaders) return []
      return [
        {
          ruleId: 'CACHE_004',
          title: 'No CDN cache headers in next.config',
          description: 'next.config does not define Cache-Control headers for static assets.',
          severity: 'INFO',
          filePath: nextConfig.path,
          evidence: 'No headers() export found in next.config',
          suggestion: 'Add a headers() function in next.config to set Cache-Control for /_next/static/**',
          category: 'CACHING',
        },
      ]
    },
  },
]
