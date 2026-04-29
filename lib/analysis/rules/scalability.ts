import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const scalabilityRules: AnalysisRule[] = [
  {
    id: 'SCALE_001',
    category: 'SCALABILITY',
    title: 'In-memory session store',
    description: 'express-session uses default MemoryStore — sessions lost on restart, breaks multi-instance.',
    severity: 'CRITICAL',
    suggestion: 'Use Redis session store: connect-redis with express-session.',
    detect(files: FetchedFile[]): RuleMatch[] {
      for (const file of files) {
        if (/express-session/.test(file.content) && !/store\s*:/.test(file.content)) {
          const lineIdx = file.lines.findIndex((l) => /express-session|session\({/.test(l))
          return [
            {
              ruleId: 'SCALE_001',
              title: 'In-memory session store (MemoryStore)',
              description: 'express-session without a store: uses MemoryStore — leaks memory and loses sessions on restart.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
              evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'express-session without store',
              suggestion: 'Use connect-redis: session({ store: new RedisStore({ client }) })',
              category: 'SCALABILITY',
            },
          ]
        }
      }
      return []
    },
  },

  {
    id: 'SCALE_002',
    category: 'SCALABILITY',
    title: 'In-memory rate limiter',
    description: 'express-rate-limit without a Redis store — rate limits are per-instance, not global.',
    severity: 'WARNING',
    suggestion: 'Use rate-limit-redis to share rate limit state across all instances.',
    detect(files: FetchedFile[]): RuleMatch[] {
      for (const file of files) {
        if (/express-rate-limit|rateLimit\(/.test(file.content) && !/store\s*:/.test(file.content)) {
          const lineIdx = file.lines.findIndex((l) => /rateLimit\(|express-rate-limit/.test(l))
          return [
            {
              ruleId: 'SCALE_002',
              title: 'In-memory rate limiter',
              description: 'Rate limiting without a shared store is per-process — ineffective in multi-instance deployments.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
              evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'rateLimit() without store',
              suggestion: 'Add: store: new RedisStore({ ... }) from rate-limit-redis.',
              category: 'SCALABILITY',
            },
          ]
        }
      }
      return []
    },
  },

  {
    id: 'SCALE_003',
    category: 'SCALABILITY',
    title: 'Local filesystem used for uploads',
    description: 'Files written to local disk — breaks in multi-instance or serverless deployments.',
    severity: 'CRITICAL',
    suggestion: 'Use object storage (S3, Cloudflare R2, Supabase Storage) for user uploads.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      for (const file of files) {
        if (/\.(ts|js|tsx|jsx)$/.test(file.path)) {
          for (let i = 0; i < file.lines.length; i++) {
            const line = file.lines[i]
            if (/fs\.writeFile|multer.*disk|diskStorage/.test(line)) {
              matches.push({
                ruleId: 'SCALE_003',
                title: 'Local filesystem upload storage',
                description: 'Files saved to local disk won\'t persist in containers or multi-instance deployments.',
                severity: 'CRITICAL',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Store uploads in S3/R2/Supabase Storage using a cloud SDK.',
                category: 'SCALABILITY',
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
    id: 'SCALE_004',
    category: 'SCALABILITY',
    title: 'Cron job without distributed lock',
    description: 'Scheduled jobs run on every instance — will execute N times in a multi-instance setup.',
    severity: 'WARNING',
    suggestion: 'Use a distributed lock (Redlock, database advisory locks) to ensure single execution.',
    detect(files: FetchedFile[]): RuleMatch[] {
      for (const file of files) {
        if (/node-cron|cron\.schedule|setInterval/.test(file.content)) {
          const hasLock = /redlock|advisory|distributedLock|singleRun/.test(file.content)
          if (!hasLock) {
            const lineIdx = file.lines.findIndex((l) => /cron\.schedule|setInterval/.test(l))
            return [
              {
                ruleId: 'SCALE_004',
                title: 'Cron job without distributed lock',
                description: 'Scheduled job runs on every instance — duplicate execution in scaled deployments.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
                evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'Cron without lock',
                suggestion: 'Use Redlock or a database-level advisory lock to ensure only one instance runs the job.',
                category: 'SCALABILITY',
              },
            ]
          }
        }
      }
      return []
    },
  },

  {
    id: 'SCALE_005',
    category: 'SCALABILITY',
    title: 'Synchronous file I/O in request handler',
    description: 'Blocking fs.readFileSync/writeFileSync used inside route handlers.',
    severity: 'WARNING',
    suggestion: 'Use async fs.readFile/writeFile or fs/promises to avoid blocking the event loop.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter((f) => /\/(routes|api|controllers)\//.test(f.path) && /\.(ts|js)$/.test(f.path))

      for (const file of routeFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/fs\.(readFileSync|writeFileSync|existsSync|mkdirSync)/.test(line)) {
            matches.push({
              ruleId: 'SCALE_005',
              title: 'Synchronous file I/O in route handler',
              description: 'Blocking file I/O call in a request handler stalls the Node.js event loop.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Replace with fs.promises.readFile / writeFile (async versions).',
              category: 'SCALABILITY',
            })
            if (matches.length >= 5) return matches
          }
        }
      }
      return matches
    },
  },
]
