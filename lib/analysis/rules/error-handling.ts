import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const errorHandlingRules: AnalysisRule[] = [
  {
    id: 'ERR_001',
    category: 'ERROR_HANDLING',
    title: 'Async function without error handling',
    description: 'Your async functions (JS: async/await, Python: async def) make async calls but don\'t have error handling. When an error occurs, the exception/promise rejection is unhandled. This can crash your server process, taking down your app for all users.',
    severity: 'WARNING',
    suggestion: 'Wrap async code in error handling. JS: try { await riskyOp() } catch (error) { handle }. Python: try: await risky_op() except Exception as e: handle.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of sourceFiles) {
        const isPy = /\.py$/.test(file.path)
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          const isAsyncFn = isPy
            ? /^\s*async\s+def\s+/.test(line)
            : /\basync\s+(function|\()/.test(line) && !/\/\//.test(line.split('async')[0])

          if (isAsyncFn) {
            const lookahead = file.lines.slice(i + 1, Math.min(i + 20, file.lines.length)).join('\n')
            const hasTryCatch = isPy ? /try\s*:/.test(lookahead) : /try\s*\{/.test(lookahead)
            const hasAsyncCall = isPy ? /\bawait\s/.test(lookahead) : /await\s/.test(lookahead)

            if (!hasTryCatch && hasAsyncCall) {
              matches.push({
                ruleId: 'ERR_001',
                title: 'Async function without error handling',
                description: 'Async function with async calls but no error handling — unhandled exception possible.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: isPy
                  ? 'Wrap the function body with try: ... except Exception as e: logger.error(e)'
                  : 'Wrap the function body with try { ... } catch (error) { /* handle */ }',
                category: 'ERROR_HANDLING',
              })
              if (matches.length >= 5) return matches
            }
          }
        }
      }
      return matches
    },
  },

  {
    id: 'ERR_002',
    category: 'ERROR_HANDLING',
    title: 'Swallowed errors in catch blocks',
    description: 'Your code catches errors but does nothing with them (empty catch blocks, bare "except: pass", or just console.log). This silently hides bugs and makes debugging impossible in production.',
    severity: 'WARNING',
    suggestion: 'Never swallow errors silently. At minimum log them. JS: .catch(err => logger.error(err)). Python: except Exception as e: logger.error(e). Always log or re-raise.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path))

      for (const file of sourceFiles) {
        const isPy = /\.py$/.test(file.path)
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          const isSwallowed = isPy
            // Python: bare except: pass, except Exception: pass, except Exception as e: pass
            ? (/^\s*except(\s+\w+(\s+as\s+\w+)?)?\s*:/.test(line) &&
               /^\s*pass\s*$/.test(file.lines[i + 1] ?? ''))
            // JS: .catch(() => {}) or .catch(console.log)
            : (/\.catch\(\s*(e|err|error)?\s*=>\s*(\{\s*\}|\(\s*\))\s*\)/.test(line) ||
               /\.catch\(\s*console\.log\s*\)/.test(line))

          if (isSwallowed) {
            matches.push({
              ruleId: 'ERR_002',
              title: 'Swallowed error in catch block',
              description: 'Error silently discarded — bugs will be invisible in production.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: isPy
                ? 'At minimum: except Exception as e: logger.error(e) or raise'
                : 'At minimum: .catch(err => logger.error(err)) or rethrow with throw err',
              category: 'ERROR_HANDLING',
            })
            if (matches.length >= 5) return matches
          }
        }
      }
      return matches
    },
  },

  {
    id: 'ERR_003',
    category: 'ERROR_HANDLING',
    title: 'No global error handler',
    description: 'Your web framework app doesn\'t have a global error handling middleware or handler. Without this, unhandled errors send raw error responses or crash the server. Users see technical error messages instead of friendly error pages.',
    severity: 'WARNING',
    suggestion: 'Add a global error handler. Express: app.use((err, req, res, next) => {...}). Flask: @app.errorhandler(Exception). FastAPI: @app.exception_handler(Exception).',
    codeExample: `app.use((err: Error, req: Request, res: Response, next: NextFunction) => {\n  console.error(err)\n  res.status(500).json({ error: 'Internal server error' })\n})`,
    detect(files: FetchedFile[]): RuleMatch[] {
      // Check JS/TS Express apps
      const jsAppFiles = files.filter(
        (f) => /(app|server|index)\.(ts|js)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )
      for (const file of jsAppFiles) {
        const hasExpress = /express\(\)|require\('express'\)|from 'express'/.test(file.content)
        const hasGlobalHandler = /app\.use\(\s*\([^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*\)/.test(file.content) ||
                                 /err,\s*req,\s*res,\s*next/.test(file.content)
        if (hasExpress && !hasGlobalHandler) {
          return [
            {
              ruleId: 'ERR_003',
              title: 'No global Express error handler',
              description: 'Express app file does not define a global error handling middleware.',
              severity: 'WARNING',
              filePath: file.path,
              evidence: 'express() used without (err, req, res, next) middleware',
              suggestion: 'Add a global error handler as the last app.use() call.',
              category: 'ERROR_HANDLING',
            },
          ]
        }
      }

      // Check Python Flask apps
      const pyAppFiles = files.filter(
        (f) => /\.py$/.test(f.path) && /(app|main|server|__init__)\.py$/.test(f.path)
      )
      for (const file of pyAppFiles) {
        const hasFlask = /Flask\(__name__\)|from flask import/.test(file.content)
        const hasFastApi = /FastAPI\(\)|from fastapi import/.test(file.content)
        const hasErrorHandler = /@app\.(errorhandler|exception_handler)/.test(file.content)

        if ((hasFlask || hasFastApi) && !hasErrorHandler) {
          return [
            {
              ruleId: 'ERR_003',
              title: 'No global Flask/FastAPI error handler',
              description: 'Python web app does not define a global error handler.',
              severity: 'WARNING',
              filePath: file.path,
              evidence: 'Flask/FastAPI app without @app.errorhandler',
              suggestion: hasFlask
                ? 'Add @app.errorhandler(Exception) to catch all unhandled exceptions.'
                : 'Add @app.exception_handler(Exception) to handle unhandled errors globally.',
              category: 'ERROR_HANDLING',
            },
          ]
        }
      }

      return []
    },
  },

  {
    id: 'ERR_004',
    category: 'ERROR_HANDLING',
    title: 'External API calls without timeout',
    description: 'Your HTTP requests to external APIs have no timeout. If the external service is slow or unresponsive, your request hangs indefinitely, blocking resources and eventually causing your app to become unresponsive.',
    severity: 'WARNING',
    suggestion: 'Always add timeouts. JS/fetch: { signal: AbortSignal.timeout(5000) }. JS/axios: { timeout: 5000 }. Python/requests: requests.get(url, timeout=5). Python/httpx: httpx.get(url, timeout=5.0).',
    codeExample: `// fetch with timeout:\nconst res = await fetch(url, { signal: AbortSignal.timeout(5000) })\n\n// axios with timeout:\naxios.get(url, { timeout: 5000 })`,
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        const isPy = /\.py$/.test(file.path)
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          const hasHttpCall = isPy
            ? /requests\.(get|post|put|delete|patch|head)\(/.test(line) || /httpx\.(get|post|put|delete|patch|AsyncClient)\(/.test(line) || /urllib\.request\.urlopen\(/.test(line)
            : /\bfetch\(|axios\.(get|post|put|delete|patch)\(/.test(line)

          if (hasHttpCall) {
            const context = file.lines.slice(i, Math.min(i + 5, file.lines.length)).join('\n')
            const hasTimeout = isPy
              ? /timeout\s*=/.test(context)
              : /timeout|AbortSignal|AbortController/.test(context)

            if (!hasTimeout) {
              matches.push({
                ruleId: 'ERR_004',
                title: 'External API call without timeout',
                description: 'HTTP call to external service without timeout — can hang indefinitely.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: isPy
                  ? 'Add timeout parameter: requests.get(url, timeout=5) or httpx.get(url, timeout=5.0)'
                  : 'Add: { signal: AbortSignal.timeout(5000) } to fetch() calls.',
                category: 'ERROR_HANDLING',
              })
              if (matches.length >= 5) return matches
            }
          }
        }
      }
      return matches
    },
  },

  {
    id: 'ERR_005',
    category: 'ERROR_HANDLING',
    title: 'No retry logic for flaky external calls',
    description: 'Your code calls external services (APIs, databases, message queues) but has no retry mechanism. Transient failures (network blips, timeouts, 503s) crash your operation instead of gracefully retrying. This is especially critical for payment processing and webhook delivery.',
    severity: 'INFO',
    suggestion: 'Add retry logic with exponential backoff. Node.js: p-retry, async-retry, or axios-retry. Python: tenacity or urllib3.util.retry. Retry 2-3 times with increasing delays (1s, 2s, 4s) before failing.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      if (packageJson) {
        let deps: Record<string, string> = {}
        try {
          const parsed = JSON.parse(packageJson.content)
          deps = { ...parsed.dependencies, ...parsed.devDependencies }
        } catch { /* ignore */ }

        const retryLibs = ['p-retry', 'async-retry', 'axios-retry', 'retry', 'got']
        if (retryLibs.some((l) => l in deps)) return []

        const hasExternalCalls = files.some(
          (f) => /\.(ts|js|tsx|jsx)$/.test(f.path) &&
          /\/(api|routes|services|lib)\//.test(f.path) &&
          /fetch\(|axios\.(get|post)|\.sendMail|stripe\.|twilio|webhook/i.test(f.content)
        )
        if (!hasExternalCalls) return []

        return [
          {
            ruleId: 'ERR_005',
            title: 'No retry library for external calls',
            description: 'External API/service calls with no retry library — transient failures will crash operations.',
            severity: 'INFO',
            filePath: packageJson.path,
            evidence: 'External service calls found but no retry library (p-retry, async-retry, etc.)',
            suggestion: 'Add p-retry or async-retry for external calls that can transiently fail.',
            category: 'ERROR_HANDLING',
          },
        ]
      }

      const requirementsTxt = files.find((f) => /requirements.*\.txt$/.test(f.path) || f.path === 'requirements.txt')
      if (requirementsTxt) {
        const content = requirementsTxt.content.toLowerCase()
        const retryLibs = ['tenacity', 'retry', 'backoff', 'urllib3']
        if (retryLibs.some((l) => content.includes(l))) return []

        const hasExternalCalls = files.some(
          (f) => /\.py$/.test(f.path) && /requests\.(get|post)|httpx|aiohttp|webhook|stripe|twilio/i.test(f.content)
        )
        if (!hasExternalCalls) return []

        return [
          {
            ruleId: 'ERR_005',
            title: 'No retry library for external calls (Python)',
            description: 'External API calls without retry library — transient failures will crash operations.',
            severity: 'INFO',
            filePath: requirementsTxt.path,
            evidence: 'External service calls found but no tenacity/retry/backoff library',
            suggestion: 'Add tenacity for automatic retries: @retry(stop=stop_after_attempt(3), wait=wait_exponential())',
            category: 'ERROR_HANDLING',
          },
        ]
      }

      return []
    },
  },

  {
    id: 'ERR_006',
    category: 'ERROR_HANDLING',
    title: 'Overly broad exception catching',
    description: 'Your code catches the base Exception or Error class, which swallows ALL errors — including programming mistakes (TypeError, ReferenceError) and system errors (MemoryError). This masks bugs and makes debugging extremely difficult.',
    severity: 'WARNING',
    suggestion: 'Catch specific exception types. JS: catch only expected errors and rethrow others. Python: catch ValueError, KeyError, etc. separately. Always let unexpected errors propagate so they surface during development.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        const isPy = /\.py$/.test(file.path)
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (isPy) {
            // Python: bare except: or except Exception:
            if (/^\s*except\s*:/.test(line) && !/except\s+\w/.test(line)) {
              matches.push({
                ruleId: 'ERR_006',
                title: 'Bare except clause (catches everything)',
                description: 'Bare except: catches all exceptions including SystemExit and KeyboardInterrupt.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Use except Exception as e: at minimum, or catch specific types like ValueError, KeyError.',
                category: 'ERROR_HANDLING',
              })
              if (matches.length >= 5) return matches
            }
          } else {
            // JS: catch(e) { } where e is only used for console.log — not discriminating error types
            // This is harder to detect with regex, so we look for catch blocks that re-throw nothing
            if (/\}\s*catch\s*\(\s*\w*\s*\)\s*\{/.test(line)) {
              const catchBody = file.lines.slice(i + 1, Math.min(i + 10, file.lines.length)).join('\n')
              // If catch block doesn't re-throw and doesn't check error type, it's overly broad
              if (!/instanceof|\.code\s*===|\.name\s*===|throw\s/.test(catchBody) && /return\s/.test(catchBody)) {
                // Only flag if there's a generic return inside catch (common anti-pattern)
                if (/return\s+(null|undefined|false|\{\s*error)/.test(catchBody)) {
                  matches.push({
                    ruleId: 'ERR_006',
                    title: 'Generic catch returning null/error',
                    description: 'Catch block swallows all errors without checking type — masks bugs.',
                    severity: 'WARNING',
                    filePath: file.path,
                    lineNumber: i + 1,
                    evidence: line.trim().slice(0, 200),
                    suggestion: 'Check error type (instanceof) and only handle expected errors; rethrow the rest.',
                    category: 'ERROR_HANDLING',
                  })
                  if (matches.length >= 5) return matches
                }
              }
            }
          }
        }
      }
      return matches
    },
  },

  {
    id: 'ERR_007',
    category: 'ERROR_HANDLING',
    title: 'No graceful shutdown handler',
    description: 'Your server process has no graceful shutdown logic. When the process receives SIGTERM (from Docker, Kubernetes, or a deploy), it kills active requests mid-flight, causing errors for connected clients and potential data corruption for in-progress database operations.',
    severity: 'WARNING',
    suggestion: 'Handle SIGTERM/SIGINT to gracefully shut down. Node.js: process.on("SIGTERM", () => { server.close(); db.disconnect() }). Python: signal.signal(signal.SIGTERM, shutdown_handler). Close DB connections and finish in-progress requests before exiting.',
    detect(files: FetchedFile[]): RuleMatch[] {
      // Node.js check
      const jsAppFiles = files.filter(
        (f) => /(app|server|index|main)\.(ts|js)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )
      for (const file of jsAppFiles) {
        const hasServer = /\.listen\(|createServer/.test(file.content)
        const hasGraceful = /SIGTERM|SIGINT|graceful|shutdown/.test(file.content)
        if (hasServer && !hasGraceful) {
          return [
            {
              ruleId: 'ERR_007',
              title: 'No graceful shutdown handler',
              description: 'Server starts with .listen() but has no SIGTERM/SIGINT handler for graceful shutdown.',
              severity: 'WARNING',
              filePath: file.path,
              evidence: 'server.listen() without process.on("SIGTERM") handler',
              suggestion: 'Add: process.on("SIGTERM", () => { server.close(); prisma.$disconnect() })',
              category: 'ERROR_HANDLING',
            },
          ]
        }
      }

      // Python check
      const pyAppFiles = files.filter(
        (f) => /\.py$/.test(f.path) && /(app|main|server|wsgi|asgi)\.(py)$/.test(f.path)
      )
      for (const file of pyAppFiles) {
        const hasServer = /uvicorn\.run|app\.run|serve/.test(file.content)
        const hasGraceful = /signal\.signal|atexit|shutdown|SIGTERM/.test(file.content)
        if (hasServer && !hasGraceful) {
          return [
            {
              ruleId: 'ERR_007',
              title: 'No graceful shutdown handler (Python)',
              description: 'Server starts but has no signal handler for graceful shutdown.',
              severity: 'WARNING',
              filePath: file.path,
              evidence: 'Server .run() without signal.signal(SIGTERM) handler',
              suggestion: 'Add signal.signal(signal.SIGTERM, shutdown_handler) to close DB connections gracefully.',
              category: 'ERROR_HANDLING',
            },
          ]
        }
      }

      return []
    },
  },

  {
    id: 'ERR_008',
    category: 'ERROR_HANDLING',
    title: 'Throwing string instead of Error object',
    description: 'Your code throws raw strings (throw "error message") instead of Error objects. String throws have no stack trace, making it impossible to debug where the error originated. Error objects include the file name, line number, and call stack.',
    severity: 'INFO',
    suggestion: 'Always throw Error objects: throw new Error("message"). For custom errors, extend Error: class AppError extends Error { constructor(message, code) { super(message); this.code = code } }.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          // throw "string" or throw 'string' or throw `template`
          if (/\bthrow\s+['"`]/.test(line)) {
            matches.push({
              ruleId: 'ERR_008',
              title: 'Throwing string instead of Error',
              description: 'throw "string" has no stack trace — impossible to debug in production.',
              severity: 'INFO',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Use: throw new Error("message") to get a proper stack trace.',
              category: 'ERROR_HANDLING',
            })
            if (matches.length >= 5) return matches
          }
        }
      }
      return matches
    },
  },

  {
    id: 'ERR_009',
    category: 'ERROR_HANDLING',
    title: 'Promise.all without error isolation',
    description: 'Your code uses Promise.all() which fails fast — if any one promise rejects, ALL results are lost, even the successful ones. For independent operations, this means a single failure destroys all completed work.',
    severity: 'INFO',
    suggestion: 'Use Promise.allSettled() for independent operations — it waits for all to complete and gives you both fulfilled and rejected results. Use Promise.all() only when all promises are interdependent.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/Promise\.all\(/.test(line)) {
            // Check if it's wrapping independent operations (3+ items suggest independent)
            const context = file.lines.slice(i, Math.min(i + 5, file.lines.length)).join('\n')
            const commaCount = (context.match(/,/g) || []).length
            if (commaCount >= 2) {
              matches.push({
                ruleId: 'ERR_009',
                title: 'Promise.all with 3+ independent operations',
                description: 'Promise.all() fails fast — one rejection loses all results from other operations.',
                severity: 'INFO',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Use Promise.allSettled() if these operations are independent and partial success is acceptable.',
                category: 'ERROR_HANDLING',
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
    id: 'ERR_010',
    category: 'ERROR_HANDLING',
    title: 'Unhandled promise rejection risk',
    description: 'Your Node.js application does not handle unhandled promise rejections. Since Node.js v15, unhandled rejections crash the process by default. Without a handler, any missed .catch() or forgotten await brings down the entire server.',
    severity: 'WARNING',
    suggestion: 'Add a global handler: process.on("unhandledRejection", (reason) => { logger.error("Unhandled rejection:", reason); process.exit(1) }). This gives you a clean log before the process exits.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const jsAppFiles = files.filter(
        (f) => /(app|server|index|main)\.(ts|js)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of jsAppFiles) {
        const hasServer = /\.listen\(|createServer|express\(/.test(file.content)
        const hasHandler = /unhandledRejection|uncaughtException/.test(file.content)
        if (hasServer && !hasHandler) {
          return [
            {
              ruleId: 'ERR_010',
              title: 'No unhandledRejection handler',
              description: 'Server has no unhandledRejection handler — missed promises crash the process.',
              severity: 'WARNING',
              filePath: file.path,
              evidence: 'Server file without process.on("unhandledRejection")',
              suggestion: 'Add: process.on("unhandledRejection", (reason) => { logger.error(reason); process.exit(1) })',
              category: 'ERROR_HANDLING',
            },
          ]
        }
      }
      return []
    },
  },
]
