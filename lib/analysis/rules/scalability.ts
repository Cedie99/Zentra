import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const scalabilityRules: AnalysisRule[] = [
  {
    id: 'SCALE_001',
    category: 'SCALABILITY',
    title: 'In-memory session store',
    description: 'Your session store keeps sessions in the server\'s RAM. This means: 1) Sessions are lost when the server restarts, 2) Multiple server instances can\'t share sessions, 3) Memory grows unbounded and can crash the server. This breaks horizontal scaling.',
    severity: 'CRITICAL',
    suggestion: 'Use Redis as your session store. Express: session({ store: new RedisStore({ client: redis }) }). Flask: SESSION_TYPE = "redis". Django: SESSION_ENGINE = "django.contrib.sessions.backends.cache".',
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

        // Python Flask: SESSION_TYPE not set to redis/filesystem
        if (/\.py$/.test(file.path) && /SESSION_TYPE/.test(file.content)) {
          if (/SESSION_TYPE\s*=\s*['"]filesystem['"]/.test(file.content)) {
            const lineIdx = file.lines.findIndex((l) => /SESSION_TYPE/.test(l))
            return [
              {
                ruleId: 'SCALE_001',
                title: 'Filesystem session store',
                description: 'Flask SESSION_TYPE=filesystem — sessions are not shared across multiple server instances.',
                severity: 'CRITICAL',
                filePath: file.path,
                lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
                evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'SESSION_TYPE=filesystem',
                suggestion: 'Use SESSION_TYPE = "redis" with flask-session and a shared Redis instance.',
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
    id: 'SCALE_002',
    category: 'SCALABILITY',
    title: 'In-memory rate limiter',
    description: 'Your rate limiter stores state in memory instead of a shared store. This means each server instance has its own rate limit counter. If you run 3 servers, a user can make 3x the allowed requests. Rate limiting only works correctly when state is shared across all instances.',
    severity: 'WARNING',
    suggestion: 'Use Redis-backed rate limiting. Express: rateLimit({ store: new RedisStore({ ... }) }). Python: slowapi with Redis storage, or flask-limiter with RATELIMIT_STORAGE_URI = "redis://...".',
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

        // Python: flask-limiter without redis storage
        if (/\.py$/.test(file.path) && /Limiter\(/.test(file.content)) {
          const hasRedisStorage = /storage_uri.*redis|RATELIMIT_STORAGE_URI.*redis/.test(file.content)
          if (!hasRedisStorage) {
            const lineIdx = file.lines.findIndex((l) => /Limiter\(/.test(l))
            return [
              {
                ruleId: 'SCALE_002',
                title: 'In-memory rate limiter (flask-limiter)',
                description: 'flask-limiter without Redis storage is per-process — ineffective in multi-instance deployments.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
                evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'Limiter() without Redis storage',
                suggestion: 'Set RATELIMIT_STORAGE_URI = "redis://localhost:6379" or storage_uri="redis://...".',
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
    id: 'SCALE_003',
    category: 'SCALABILITY',
    title: 'Local filesystem used for uploads',
    description: 'Your code saves uploaded files to the local disk. This breaks in: 1) Multi-instance deployments (file saved on server A, requested from server B), 2) Container/serverless environments (ephemeral storage), 3) Auto-scaling (new instances can\'t access old files).',
    severity: 'CRITICAL',
    suggestion: 'Store uploads in cloud object storage (AWS S3, Cloudflare R2, Supabase Storage, GCS). These services provide persistent, globally accessible storage that works across all deployment models.',
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

        // Python: writing uploaded files to disk
        if (/\.py$/.test(file.path)) {
          for (let i = 0; i < file.lines.length; i++) {
            const line = file.lines[i]
            if (
              /file\.save\(|\.save\(os\.path\.join\(|open\([^)]+,\s*['"]wb['"]/.test(line) &&
              !/s3|boto|gcs|cloudinary|upload_to/.test(file.content)
            ) {
              matches.push({
                ruleId: 'SCALE_003',
                title: 'Local filesystem upload storage (Python)',
                description: 'File uploads saved to local disk — will fail in containers or multi-instance deployments.',
                severity: 'CRITICAL',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Use boto3 (S3), google-cloud-storage, or cloudinary to store files in cloud object storage.',
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
    description: 'Your scheduled tasks (cron jobs) don\'t use distributed locks. If you run 5 server instances, the same job runs 5 times simultaneously. This causes duplicate work, race conditions, and potential data corruption.',
    severity: 'WARNING',
    suggestion: 'Use distributed locks to ensure only one instance runs the job. Node.js: Redlock. Python: redis-py with SETNX lock, or Celery beat with a single scheduler instance.',
    detect(files: FetchedFile[]): RuleMatch[] {
      for (const file of files) {
        // Node.js cron
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

        // Python: APScheduler, Celery beat, or schedule lib without Redis lock
        if (/\.py$/.test(file.path) && /APScheduler|scheduler\.add_job|@celery\.task|schedule\.every/.test(file.content)) {
          const hasLock = /redis.*lock|redlock|CELERY_BEAT_SCHEDULER.*redis|beat_schedule.*redis/.test(file.content)
          if (!hasLock) {
            const lineIdx = file.lines.findIndex((l) => /scheduler\.add_job|@celery\.task|schedule\.every/.test(l))
            return [
              {
                ruleId: 'SCALE_004',
                title: 'Python cron/task without distributed lock',
                description: 'Scheduled task may run on every instance in multi-instance deployments.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
                evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'Scheduled task without lock',
                suggestion: 'Use a Redis-backed lock (redis-py SETNX) or configure Celery beat with a single scheduler instance.',
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
    title: 'Synchronous blocking I/O in request handler',
    description: 'Your route handlers use synchronous/blocking file operations. These block the entire event loop or thread, meaning no other requests can be processed while the file is being read/written. This severely limits throughput under load.',
    severity: 'WARNING',
    suggestion: 'Use async I/O. Node.js: fs.promises.readFile(). Python: use aiofiles for async, or move sync I/O to a thread pool executor (asyncio.to_thread). This keeps your server responsive under load.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const jsRouteFiles = files.filter((f) => /\/(routes|api|controllers)\//.test(f.path) && /\.(ts|js)$/.test(f.path))
      for (const file of jsRouteFiles) {
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

      // Python: sync blocking calls inside async def routes
      const pyRouteFiles = files.filter((f) => /\.py$/.test(f.path) && /\/(routes|api|views|routers)\//.test(f.path))
      for (const file of pyRouteFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/\bopen\(|time\.sleep\(|requests\.(get|post)\(/.test(line) && /async\s+def/.test(
            file.lines.slice(Math.max(0, i - 10), i).join('\n')
          )) {
            matches.push({
              ruleId: 'SCALE_005',
              title: 'Blocking call inside async Python route',
              description: 'Synchronous blocking call inside an async route handler — blocks the event loop.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Use await asyncio.to_thread(sync_fn) or aiofiles/httpx async clients instead.',
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
