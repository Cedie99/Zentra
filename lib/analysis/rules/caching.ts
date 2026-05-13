import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'
import type { RepoContext } from '../repo-context'

export const cachingRules: AnalysisRule[] = [
  {
    id: 'CACHE_001',
    category: 'CACHING',
    title: 'No cache layer detected',
    description: 'Your application has no caching library installed. Every request hits your database directly, which becomes slow and expensive as traffic grows. Caching stores frequently-accessed data in memory so you don\'t query the database repeatedly for the same data.',
    severity: 'WARNING',
    suggestion: 'Add a caching layer. Node.js: ioredis, node-cache, lru-cache. Python: redis-py, cachetools, django-redis, Flask-Caching. This can reduce database load by 50-90%.',
    codeExample: `import Redis from 'ioredis'\nconst redis = new Redis(process.env.REDIS_URL)\n\n// Cache result for 60 seconds\nawait redis.set('key', JSON.stringify(data), 'EX', 60)`,
    detect(files: FetchedFile[], context?: RepoContext): RuleMatch[] {
      // No database = caching a database is irrelevant
      if (context && !context.hasDatabase) return []
      // Personal/hobby projects don't need a cache layer
      if (context?.scale === 'personal') return []

      const packageJson = files.find((f) => f.path === 'package.json' || f.path.endsWith('/package.json'))
      const requirementsTxt = files.find((f) => /requirements.*\.txt$/.test(f.path) || f.path === 'requirements.txt')

      // Check Node.js project
      if (packageJson) {
        let deps: Record<string, string> = {}
        try {
          const parsed = JSON.parse(packageJson.content)
          deps = { ...parsed.dependencies, ...parsed.devDependencies }
        } catch {
          // ignore
        }

        const cacheLibs = ['redis', 'ioredis', 'node-cache', 'memcached', 'lru-cache', 'cache-manager', 'keyv']
        if (cacheLibs.some((lib) => lib in deps)) return []

        // Only flag if there are routes that actually query the DB
        const hasDbRoutes = files.some(
          (f) => /\/(api|routes|controllers)\//.test(f.path) && /prisma\.|\.find\(|\.findMany|db\.query/.test(f.content)
        )
        if (!hasDbRoutes) return []

        return [
          {
            ruleId: 'CACHE_001',
            title: 'No cache layer detected',
            description: 'No caching library (redis, ioredis, node-cache, etc.) found in package.json — API routes query the database on every request.',
            severity: 'WARNING',
            filePath: packageJson.path,
            evidence: 'No cache dependency found',
            suggestion: 'Add Redis (ioredis) or node-cache to reduce database load and improve response times.',
            category: 'CACHING',
          },
        ]
      }

      // Check Python project
      if (requirementsTxt) {
        const content = requirementsTxt.content.toLowerCase()
        const pythonCacheLibs = ['redis', 'django-redis', 'flask-caching', 'cachetools', 'dogpile.cache', 'beaker', 'diskcache', 'pymemcache']
        if (pythonCacheLibs.some((lib) => content.includes(lib))) return []

        const hasDbCalls = files.some((f) => /\.py$/.test(f.path) && /session\.query|Model\.objects|cursor\.execute/.test(f.content))
        if (!hasDbCalls) return []

        return [
          {
            ruleId: 'CACHE_001',
            title: 'No cache layer detected',
            description: 'No caching library (redis, cachetools, django-redis, etc.) found in requirements.txt.',
            severity: 'WARNING',
            filePath: requirementsTxt.path,
            evidence: 'No cache dependency found',
            suggestion: 'Add redis-py or cachetools to reduce database load and improve response times.',
            category: 'CACHING',
          },
        ]
      }

      return []
    },
  },

  {
    id: 'CACHE_002',
    category: 'CACHING',
    title: 'DB queries in routes without cache check',
    description: 'Your route handlers query the database directly without first checking if the data is cached. This means every request hits the database even for data that rarely changes. This wastes database resources and slows down responses.',
    severity: 'WARNING',
    suggestion: 'Implement cache-aside pattern: 1) Check cache first, 2) If cache miss, query database, 3) Store result in cache with expiration. Works for all languages with a Redis client.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter((f) =>
        /\/(routes|api|controllers|views|routers)\//.test(f.path) &&
        /\.(ts|js|py)$/.test(f.path) &&
        !/\.(test|spec)\./.test(f.path)
      )

      for (const file of routeFiles) {
        const isPy = /\.py$/.test(file.path)
        const hasDbCall = isPy
          ? /session\.query|\.objects\.(filter|get|all)\(|cursor\.execute/.test(file.content)
          : /prisma\.|\.find\(|\.findMany|db\.query|\.findOne/.test(file.content)
        const hasCacheCheck = isPy
          ? /redis\.get|cache\.get|r\.get\(|flask_caching|cache\.cached/.test(file.content)
          : /redis\.get|cache\.get|\.get\(|cacheManager/.test(file.content)

        if (hasDbCall && !hasCacheCheck) {
          const lineIdx = isPy
            ? file.lines.findIndex((l) => /session\.query|\.objects\.|cursor\.execute/.test(l))
            : file.lines.findIndex((l) => /prisma\.|\.find\(|\.findMany/.test(l))
          matches.push({
            ruleId: 'CACHE_002',
            title: 'DB queries in routes without cache check',
            description: 'This route queries the database directly without a cache layer.',
            severity: 'WARNING',
            filePath: file.path,
            lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
            evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'DB query detected',
            suggestion: isPy
              ? 'Check Redis cache before querying: cached = redis_client.get(key); if not cached: result = db_query(); redis_client.setex(key, 300, result)'
              : 'Cache frequently-read data with Redis using a cache-aside pattern.',
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
    description: 'Your GET endpoints don\'t set Cache-Control headers. This means browsers and CDNs can\'t cache your responses, so every page load makes a full server request. Adding cache headers allows browsers to store responses locally and CDNs to serve content from edge locations near users.',
    severity: 'INFO',
    suggestion: 'Add Cache-Control headers to GET routes. Node.js: res.set("Cache-Control", "public, max-age=300"). Python/Flask: response.headers["Cache-Control"] = "public, max-age=300". FastAPI: use Response headers.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter((f) =>
        /\.(ts|js|py)$/.test(f.path) &&
        /\/(routes|api|controllers|views|routers)\//.test(f.path) &&
        !/\.(test|spec)\./.test(f.path)
      )

      for (const file of routeFiles) {
        const isPy = /\.py$/.test(file.path)
        const hasGetRoute = isPy
          ? /@(app|router|bp|blueprint)\.(get|route)\(/.test(file.content)
          : /router\.(get|app\.get)\(|res\.json\(/.test(file.content)
        const hasCacheHeader = /Cache-Control|cache-control|max.age/.test(file.content) ||
          (!isPy && /res\.set\(/.test(file.content)) ||
          (isPy && /make_response|after_request/.test(file.content))

        if (hasGetRoute && !hasCacheHeader) {
          matches.push({
            ruleId: 'CACHE_003',
            title: 'No HTTP cache headers on GET routes',
            description: 'GET route responds without Cache-Control headers, missing browser/CDN caching.',
            severity: 'INFO',
            filePath: file.path,
            evidence: 'GET route without Cache-Control header',
            suggestion: isPy
              ? 'Add response.headers["Cache-Control"] = "public, max-age=300" to GET responses.'
              : 'Add: res.set("Cache-Control", "public, max-age=300") before res.json()',
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
    description: 'Your Next.js config doesn\'t define cache headers for static assets (CSS, JS, images). Without proper caching, users re-download these files on every visit, wasting bandwidth and slowing page loads.',
    severity: 'INFO',
    suggestion: 'Add a headers() function in next.config.js to set long cache times for static assets: headers: async () => [{ source: "/_next/static/(.*)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }]',
    detect(files: FetchedFile[], context?: RepoContext): RuleMatch[] {
      const nextConfig = files.find((f) => /next\.config\.(js|ts|mjs)$/.test(f.path))
      if (!nextConfig) return []
      // Vercel automatically sets immutable Cache-Control on /_next/static/** — no config needed
      if (context?.deploymentTarget === 'vercel') return []
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

  {
    id: 'CACHE_005',
    category: 'CACHING',
    title: 'Cache set without TTL/expiration',
    description: 'Your cache stores data without setting a Time-To-Live (TTL). Cached data stays forever, growing memory unboundedly and serving stale data indefinitely. When the underlying data changes, users see outdated information.',
    severity: 'WARNING',
    suggestion: 'Always set a TTL on cached data. Redis: SET key value EX 300 (5 minutes). node-cache: set(key, value, 300). Python redis: r.setex(key, 300, value). Choose TTL based on how often data changes.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          // JS: redis.set(key, value) without EX/PX/TTL
          if (/redis\.set\(|\.set\([^)]*,[^)]*\)/.test(line) && /redis|cache/i.test(file.content)) {
            const context = file.lines.slice(i, Math.min(i + 3, file.lines.length)).join('\n')
            if (!/EX|PX|ex:|px:|ttl|TTL|expire|EXPIRE|setex|SETEX|NX/.test(context) && /redis/i.test(file.content)) {
              matches.push({
                ruleId: 'CACHE_005',
                title: 'Redis SET without TTL',
                description: 'redis.set() called without EX/TTL — cached data never expires, risking stale data.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Add TTL: redis.set(key, value, "EX", 300) or use redis.setex(key, 300, value).',
                category: 'CACHING',
              })
              if (matches.length >= 3) return matches
            }
          }
          // Python: r.set() without ex/px
          if (/\.py$/.test(file.path) && /\.set\(/.test(line) && /redis/i.test(file.content)) {
            const context = file.lines.slice(i, Math.min(i + 3, file.lines.length)).join('\n')
            if (!/ex=|px=|expire|setex|ttl/i.test(context)) {
              matches.push({
                ruleId: 'CACHE_005',
                title: 'Redis set() without expiry (Python)',
                description: 'redis set() without ex= parameter — cached data never expires.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Add expiry: r.set(key, value, ex=300) or use r.setex(key, 300, value).',
                category: 'CACHING',
              })
              if (matches.length >= 3) return matches
            }
          }
        }
      }
      return matches
    },
  },

  {
    id: 'CACHE_006',
    category: 'CACHING',
    title: 'Duplicate database queries in same request',
    description: 'The same database query appears to be called multiple times in a single request handler. Each call hits the database unnecessarily when the result could be stored in a local variable and reused within the same request.',
    severity: 'INFO',
    suggestion: 'Store query results in a variable and reuse them within the same request. For complex cases, use a request-scoped cache (DataLoader pattern in GraphQL, or a simple Map per request).',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter(
        (f) =>
          /\.(ts|js|tsx|jsx)$/.test(f.path) &&
          /\/(routes|api|controllers)\//.test(f.path) &&
          !/\.(test|spec)\./.test(f.path)
      )

      for (const file of routeFiles) {
        // Find duplicate prisma/db calls in the same file
        const dbCalls: Record<string, number[]> = {}
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i].trim()
          const match = line.match(/prisma\.(\w+)\.(findUnique|findFirst|findMany)\(/)
          if (match) {
            const key = `${match[1]}.${match[2]}`
            if (!dbCalls[key]) dbCalls[key] = []
            dbCalls[key].push(i)
          }
        }

        for (const [call, lines] of Object.entries(dbCalls)) {
          if (lines.length >= 2) {
            matches.push({
              ruleId: 'CACHE_006',
              title: 'Duplicate database query in request',
              description: `prisma.${call}() called ${lines.length} times in the same file — redundant DB hits.`,
              severity: 'INFO',
              filePath: file.path,
              lineNumber: lines[0] + 1,
              evidence: `prisma.${call}() on lines ${lines.map((l) => l + 1).join(', ')}`,
              suggestion: 'Store the query result in a variable and reuse it instead of querying multiple times.',
              category: 'CACHING',
            })
            if (matches.length >= 3) return matches
          }
        }
      }
      return matches
    },
  },

  {
    id: 'CACHE_007',
    category: 'CACHING',
    title: 'No ETag/conditional response support',
    description: 'Your API responses don\'t use ETags or Last-Modified headers. Without conditional responses, clients always download the full response even when data hasn\'t changed. ETags let clients send If-None-Match and receive a 304 Not Modified — saving bandwidth and reducing load.',
    severity: 'INFO',
    suggestion: 'Add ETag support. Express: app.set("etag", "strong") or use the etag middleware. Flask: use make_response().headers["ETag"]. For APIs with heavy payloads, ETags can significantly reduce bandwidth.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      if (!packageJson) return []

      let deps: Record<string, string> = {}
      try {
        const parsed = JSON.parse(packageJson.content)
        deps = { ...parsed.dependencies, ...parsed.devDependencies }
      } catch { /* ignore */ }

      // Express has etag enabled by default, so only flag if explicitly disabled
      if ('express' in deps) {
        const appFile = files.find((f) => /(app|server|index)\.(ts|js)$/.test(f.path))
        if (appFile && /etag.*false|disable.*etag/i.test(appFile.content)) {
          return [
            {
              ruleId: 'CACHE_007',
              title: 'ETags explicitly disabled',
              description: 'Express ETags are disabled — clients cannot use conditional requests.',
              severity: 'INFO',
              filePath: appFile.path,
              evidence: 'app.set("etag", false) or equivalent found',
              suggestion: 'Re-enable ETags: app.set("etag", "strong") for bandwidth-efficient API responses.',
              category: 'CACHING',
            },
          ]
        }
      }

      return []
    },
  },

  {
    id: 'CACHE_008',
    category: 'CACHING',
    title: 'Expensive computation repeated on every request',
    description: 'Your code performs heavy computation (JSON.parse of large configs, regex compilation, file reading) on every incoming request instead of computing it once at startup. This wastes CPU cycles and slows response times.',
    severity: 'INFO',
    suggestion: 'Move expensive computations outside request handlers. Parse configs, compile regexes, and read static files at module load time (top-level const). For dynamic heavy computations, use memoization or a cache.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx)$/.test(f.path) &&
        /\/(routes|api|controllers)\//.test(f.path) &&
        !/\.(test|spec)\./.test(f.path)
      )

      for (const file of routeFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          // Reading files inside route handlers
          if (/fs\.readFileSync\(|fs\.promises\.readFile\(/.test(line)) {
            const isInsideHandler = file.lines.slice(Math.max(0, i - 10), i).some(
              (l) => /router\.(get|post|put)|app\.(get|post|put)|export.*function|async.*handler/.test(l)
            )
            if (isInsideHandler) {
              matches.push({
                ruleId: 'CACHE_008',
                title: 'File read inside request handler',
                description: 'File read on every request — should be read once at startup and cached.',
                severity: 'INFO',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Read the file once at module load and store in a top-level const.',
                category: 'CACHING',
              })
              if (matches.length >= 3) return matches
            }
          }
          // new RegExp() inside handler
          if (/new RegExp\(/.test(line)) {
            const isInsideHandler = file.lines.slice(Math.max(0, i - 10), i).some(
              (l) => /router\.(get|post|put)|app\.(get|post|put)|export.*function|async.*handler/.test(l)
            )
            if (isInsideHandler) {
              matches.push({
                ruleId: 'CACHE_008',
                title: 'RegExp compiled inside request handler',
                description: 'new RegExp() on every request — compile once at module level.',
                severity: 'INFO',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Move new RegExp() to a top-level const — regex compilation is expensive.',
                category: 'CACHING',
              })
              if (matches.length >= 3) return matches
            }
          }
        }
      }
      return matches
    },
  },

  {
    id: 'CACHE_009',
    category: 'CACHING',
    title: 'No stale-while-revalidate pattern',
    description: 'Your caching implementation uses a simple get-or-set pattern. When the cache expires, the first request blocks while data is refreshed, causing a "thundering herd" problem under high traffic. Stale-while-revalidate serves the stale value immediately while refreshing in the background.',
    severity: 'INFO',
    suggestion: 'Implement stale-while-revalidate: serve stale data immediately, refresh in background. Express: use Cache-Control: max-age=60, stale-while-revalidate=300. Next.js ISR does this automatically. For Redis, use dual TTL keys.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const routeFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx)$/.test(f.path) &&
        /\/(routes|api|controllers)\//.test(f.path) &&
        !/\.(test|spec)\./.test(f.path)
      )

      const hasCache = files.some((f) => /redis\.get|cache\.get|cacheManager/.test(f.content))
      if (!hasCache) return []

      const hasSwr = files.some(
        (f) => /stale.while.revalidate|swr|ISR|revalidate/i.test(f.content)
      )
      if (hasSwr) return []

      // Only flag if there are multiple route files hitting cache — indicates a real app
      const cachedRoutes = routeFiles.filter((f) => /redis\.get|cache\.get/.test(f.content))
      if (cachedRoutes.length < 2) return []

      return [
        {
          ruleId: 'CACHE_009',
          title: 'No stale-while-revalidate pattern',
          description: 'Cache uses get-or-set pattern without SWR — causes thundering herd on expiry.',
          severity: 'INFO',
          filePath: cachedRoutes[0].path,
          evidence: 'Cache used without stale-while-revalidate strategy',
          suggestion: 'Add stale-while-revalidate to Cache-Control headers or implement background refresh.',
          category: 'CACHING',
        },
      ]
    },
  },

  {
    id: 'CACHE_010',
    category: 'CACHING',
    title: 'No response compression',
    description: 'Your API responses are not compressed before sending to clients. JSON and HTML responses typically compress by 60-80% with gzip/brotli. Without compression, you\'re wasting bandwidth and increasing page load times.',
    severity: 'INFO',
    suggestion: 'Enable response compression. Express: app.use(compression()). Next.js: enable in next.config.js with compress: true (default). Flask: use flask-compress. Nginx/CDN: enable gzip and brotli at the proxy level.',
    detect(files: FetchedFile[], context?: RepoContext): RuleMatch[] {
      // Vercel/Netlify/Cloudflare handle compression at the edge
      if (context?.isServerless) return []

      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      if (!packageJson) return []

      let deps: Record<string, string> = {}
      try {
        const parsed = JSON.parse(packageJson.content)
        deps = { ...parsed.dependencies, ...parsed.devDependencies }
      } catch { /* ignore */ }

      // Only relevant for Express apps (Next.js has compression built-in)
      if (!('express' in deps)) return []
      if ('compression' in deps) return []

      const hasRoutes = files.some(
        (f) => /\/(routes|api|controllers)\//.test(f.path) && /res\.json|res\.send/.test(f.content)
      )
      if (!hasRoutes) return []

      return [
        {
          ruleId: 'CACHE_010',
          title: 'No response compression (Express)',
          description: 'Express app has no compression middleware — responses sent uncompressed.',
          severity: 'INFO',
          filePath: packageJson.path,
          evidence: 'Express installed but compression package missing',
          suggestion: 'Install compression: npm i compression, then app.use(compression()) for 60-80% smaller responses.',
          category: 'CACHING',
        },
      ]
    },
  },
]
