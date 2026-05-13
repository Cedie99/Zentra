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

  {
    id: 'SCALE_006',
    category: 'SCALABILITY',
    title: 'Global mutable state',
    description: 'Your code stores request-scoped or user-scoped data in global/module-level mutable variables. In multi-instance deployments, each instance has its own copy — data is inconsistent. Even in a single instance, concurrent requests can overwrite each other\'s state (race conditions).',
    severity: 'WARNING',
    suggestion: 'Move state to a shared store (Redis, database). For request-scoped data, use request context (Express: req.locals, Flask: g object, FastAPI: request.state). Never use global variables for user/session data.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx)$/.test(f.path) &&
        !/\.(test|spec|config)\./.test(f.path) &&
        !/node_modules/.test(f.path)
      )

      for (const file of sourceFiles) {
        // Detect global mutable objects that look like state stores
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          // Top-level: let users = {}, let cache = new Map(), let sessions = []
          if (/^(let|var)\s+\w*(users|sessions|cache|store|state|data|queue|connections|clients)\w*\s*[:=]\s*(new Map|new Set|\{|\[)/i.test(line.trim())) {
            matches.push({
              ruleId: 'SCALE_006',
              title: 'Global mutable state variable',
              description: 'Module-level mutable variable used as data store — breaks in multi-instance deployments.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Move to Redis or database. For request-scoped data, use req.locals or context objects.',
              category: 'SCALABILITY',
            })
            if (matches.length >= 3) return matches
          }
        }
      }

      // Python: module-level mutable dicts/lists used as stores
      const pyFiles = files.filter((f) => /\.py$/.test(f.path) && !/\.(test|spec)/.test(f.path))
      for (const file of pyFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/^(users|sessions|cache|store|data|connected_clients)\s*[:=]\s*(\{\}|\[\]|dict\(\)|set\(\))/i.test(line.trim())) {
            matches.push({
              ruleId: 'SCALE_006',
              title: 'Global mutable state (Python)',
              description: 'Module-level mutable variable used as data store — breaks in multi-process/instance deployments.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Move to Redis or database for state that must be shared across processes.',
              category: 'SCALABILITY',
            })
            if (matches.length >= 3) return matches
          }
        }
      }
      return matches
    },
  },

  {
    id: 'SCALE_007',
    category: 'SCALABILITY',
    title: 'CPU-intensive operation on main thread',
    description: 'Your route handler performs CPU-intensive work (JSON parsing of huge payloads, crypto operations, image processing, or large array sorting) on the main thread. In Node.js, this blocks the event loop for ALL requests. In Python asyncio, it blocks the async loop.',
    severity: 'WARNING',
    suggestion: 'Offload heavy computation to a worker. Node.js: use worker_threads or a job queue (BullMQ). Python: use asyncio.to_thread(), ProcessPoolExecutor, or Celery. This keeps the main thread responsive for other requests.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter(
        (f) => /\/(routes|api|controllers)\//.test(f.path) &&
        /\.(ts|js|tsx|jsx)$/.test(f.path) &&
        !/\.(test|spec)\./.test(f.path)
      )

      for (const file of routeFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          // Crypto operations in route handlers
          if (/crypto\.(pbkdf2Sync|scryptSync|randomBytes)\(/.test(line)) {
            matches.push({
              ruleId: 'SCALE_007',
              title: 'Sync crypto in route handler',
              description: 'Synchronous crypto operation blocks the event loop — use async version.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Use async: crypto.pbkdf2() (callback) or util.promisify(crypto.pbkdf2) instead of Sync.',
              category: 'SCALABILITY',
            })
            if (matches.length >= 3) return matches
          }
          // Large .sort() or .filter() on potentially large arrays in routes
          if (/\.sort\(/.test(line) && /\.map\(|\.filter\(/.test(file.lines.slice(Math.max(0, i - 3), i + 3).join('\n'))) {
            const context = file.lines.slice(Math.max(0, i - 5), i).join('\n')
            if (/findMany|\.all\(\)|SELECT/.test(context)) {
              matches.push({
                ruleId: 'SCALE_007',
                title: 'Sorting large dataset in-memory in route',
                description: 'Sorting/filtering large dataset from DB in JS — should use DB-level ORDER BY/WHERE.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Use DB-level sorting: prisma.findMany({ orderBy: ... }) instead of JS .sort().',
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
    id: 'SCALE_008',
    category: 'SCALABILITY',
    title: 'No request body size limit',
    description: 'Your Express/Fastify app does not configure a request body size limit. Attackers can send massive payloads (e.g. 1GB JSON) to exhaust server memory and crash the process. This is a denial-of-service vulnerability.',
    severity: 'WARNING',
    suggestion: 'Set a body size limit. Express: app.use(express.json({ limit: "1mb" })). Fastify: fastify({ bodyLimit: 1048576 }). Flask: MAX_CONTENT_LENGTH = 1 * 1024 * 1024. Choose a limit appropriate for your use case.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const sourceFiles = files.filter(
        (f) => /\.(ts|js)$/.test(f.path) && /(app|server|index|main)\.(ts|js)$/.test(f.path)
      )

      for (const file of sourceFiles) {
        // Express: express.json() without limit
        if (/express\.json\(\s*\)/.test(file.content) && !/limit/.test(file.content)) {
          const lineIdx = file.lines.findIndex((l) => /express\.json\(\s*\)/.test(l))
          return [
            {
              ruleId: 'SCALE_008',
              title: 'No request body size limit',
              description: 'express.json() without limit — attackers can send huge payloads to crash the server.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
              evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'express.json() without limit',
              suggestion: 'Add: express.json({ limit: "1mb" }) to prevent oversized request bodies.',
              category: 'SCALABILITY',
            },
          ]
        }
        // body-parser without limit
        if (/bodyParser\.json\(\s*\)/.test(file.content) && !/limit/.test(file.content)) {
          const lineIdx = file.lines.findIndex((l) => /bodyParser\.json\(\s*\)/.test(l))
          return [
            {
              ruleId: 'SCALE_008',
              title: 'No request body size limit (body-parser)',
              description: 'bodyParser.json() without limit — no protection against oversized payloads.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
              evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'bodyParser.json() without limit',
              suggestion: 'Add: bodyParser.json({ limit: "1mb" }) to prevent denial-of-service attacks.',
              category: 'SCALABILITY',
            },
          ]
        }
      }
      return []
    },
  },

  {
    id: 'SCALE_009',
    category: 'SCALABILITY',
    title: 'No database query timeout',
    description: 'Your database queries have no timeout configured. A slow or deadlocked query will hold a connection indefinitely, eventually exhausting the connection pool and making the entire application unresponsive.',
    severity: 'WARNING',
    suggestion: 'Set query timeouts. Prisma: add ?connect_timeout=10&statement_timeout=30000 to DATABASE_URL. pg: new Pool({ statement_timeout: 30000 }). SQLAlchemy: create_engine(url, pool_timeout=30). Django: set CONN_MAX_AGE and statement_timeout.',
    detect(files: FetchedFile[]): RuleMatch[] {
      // Check Prisma DATABASE_URL for timeout params
      const schemaFile = files.find((f) => /schema\.prisma$/.test(f.path))
      if (schemaFile) {
        const hasTimeout = /statement_timeout|connect_timeout|pool_timeout|idle_in_transaction_session_timeout/.test(schemaFile.content)
        if (!hasTimeout) {
          return [
            {
              ruleId: 'SCALE_009',
              title: 'No database query timeout configured',
              description: 'Prisma DATABASE_URL has no statement_timeout — slow queries block connections indefinitely.',
              severity: 'WARNING',
              filePath: schemaFile.path,
              evidence: 'DATABASE_URL without timeout parameters',
              suggestion: 'Add to DATABASE_URL: ?connect_timeout=10&statement_timeout=30000 (30 seconds).',
              category: 'SCALABILITY',
            },
          ]
        }
      }

      // Check raw pg Pool config
      const sourceFiles = files.filter((f) => /\.(ts|js)$/.test(f.path) && /new Pool/.test(f.content))
      for (const file of sourceFiles) {
        if (!/statement_timeout|query_timeout|connectionTimeoutMillis/.test(file.content)) {
          const lineIdx = file.lines.findIndex((l) => /new Pool/.test(l))
          return [
            {
              ruleId: 'SCALE_009',
              title: 'No query timeout on connection pool',
              description: 'pg Pool created without statement_timeout — slow queries hold connections forever.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
              evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'new Pool() without timeouts',
              suggestion: 'Add: new Pool({ statement_timeout: 30000, connectionTimeoutMillis: 10000 }).',
              category: 'SCALABILITY',
            },
          ]
        }
      }

      return []
    },
  },

  {
    id: 'SCALE_010',
    category: 'SCALABILITY',
    title: 'Large data processing without streaming',
    description: 'Your code reads entire large files or datasets into memory at once. For CSV imports, log processing, or bulk data operations, this can exhaust available RAM. Streaming processes data in chunks, using constant memory regardless of file size.',
    severity: 'INFO',
    suggestion: 'Use streaming for large data. Node.js: fs.createReadStream() + readline or csv-parse with stream. Python: iterate file objects line-by-line or use pandas with chunksize. Never load entire large files into memory.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          // JS: readFileSync/readFile for CSV/JSON bulk processing
          if (/readFileSync\(|readFile\(/.test(line) && /csv|json|log|data|import|bulk/i.test(file.path)) {
            matches.push({
              ruleId: 'SCALE_010',
              title: 'Reading large file entirely into memory',
              description: 'Bulk data file read into memory at once — will crash with large files.',
              severity: 'INFO',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Use fs.createReadStream() with readline or csv-parse stream for constant memory usage.',
              category: 'SCALABILITY',
            })
            if (matches.length >= 3) return matches
          }
          // Python: pd.read_csv without chunksize on large imports
          if (/pd\.read_csv\(/.test(line) && /import|bulk|process|etl/i.test(file.path)) {
            const context = file.lines.slice(i, Math.min(i + 3, file.lines.length)).join('\n')
            if (!/chunksize|iterator/.test(context)) {
              matches.push({
                ruleId: 'SCALE_010',
                title: 'pd.read_csv without chunksize',
                description: 'pandas reads entire CSV into memory — will crash with large files.',
                severity: 'INFO',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Add chunksize: pd.read_csv(file, chunksize=10000) to process in chunks.',
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
    id: 'SCALE_011',
    category: 'SCALABILITY',
    title: 'No API rate limiting',
    description: 'Your API has no rate limiting at all. Without rate limits, a single client can flood your server with requests, consuming all resources and making the app unavailable for other users. This is a basic denial-of-service vulnerability.',
    severity: 'WARNING',
    suggestion: 'Add rate limiting. Express: express-rate-limit with windowMs and max. FastAPI: slowapi. Flask: flask-limiter. A common starting point: 100 requests per 15 minutes per IP for APIs.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      if (packageJson) {
        let deps: Record<string, string> = {}
        try {
          const parsed = JSON.parse(packageJson.content)
          deps = { ...parsed.dependencies, ...parsed.devDependencies }
        } catch { /* ignore */ }

        // Next.js apps on Vercel get edge rate limiting
        if ('next' in deps) return []

        const rateLimitLibs = ['express-rate-limit', 'rate-limiter-flexible', 'bottleneck', 'express-slow-down']
        if (rateLimitLibs.some((l) => l in deps)) return []

        const hasRoutes = files.some(
          (f) => /\/(routes|api|controllers)\//.test(f.path) && /router\.(get|post)|app\.(get|post)/.test(f.content)
        )
        if (!hasRoutes) return []

        return [
          {
            ruleId: 'SCALE_011',
            title: 'No API rate limiting',
            description: 'Express API has no rate limiting — vulnerable to denial-of-service attacks.',
            severity: 'WARNING',
            filePath: packageJson.path,
            evidence: 'No express-rate-limit or similar found in dependencies',
            suggestion: 'Add express-rate-limit: rateLimit({ windowMs: 15*60*1000, max: 100 }).',
            category: 'SCALABILITY',
          },
        ]
      }

      const requirementsTxt = files.find((f) => /requirements.*\.txt$/.test(f.path) || f.path === 'requirements.txt')
      if (requirementsTxt) {
        const content = requirementsTxt.content.toLowerCase()
        const rateLimitLibs = ['flask-limiter', 'slowapi', 'django-ratelimit', 'django-axes']
        if (rateLimitLibs.some((l) => content.includes(l))) return []

        const hasRoutes = files.some(
          (f) => /\.py$/.test(f.path) && /@(app|router|bp)\.(route|get|post)/.test(f.content)
        )
        if (!hasRoutes) return []

        return [
          {
            ruleId: 'SCALE_011',
            title: 'No API rate limiting (Python)',
            description: 'Python API has no rate limiting library — vulnerable to denial-of-service.',
            severity: 'WARNING',
            filePath: requirementsTxt.path,
            evidence: 'No flask-limiter/slowapi/django-ratelimit found in requirements',
            suggestion: 'Add flask-limiter or slowapi to rate-limit API endpoints.',
            category: 'SCALABILITY',
          },
        ]
      }

      return []
    },
  },
]
