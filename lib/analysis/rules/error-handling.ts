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
]
