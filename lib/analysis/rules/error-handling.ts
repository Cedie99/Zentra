import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const errorHandlingRules: AnalysisRule[] = [
  {
    id: 'ERR_001',
    category: 'ERROR_HANDLING',
    title: 'Async function without try/catch',
    description: 'Async functions that don\'t have error handling — unhandled rejections crash the process.',
    severity: 'WARNING',
    suggestion: 'Wrap async function bodies with try/catch or use a global error handling middleware.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/\basync\s+(function|\()/.test(line) && !/\/\//.test(line.split('async')[0])) {
            // Look ahead up to 20 lines for try {
            const lookahead = file.lines.slice(i + 1, Math.min(i + 20, file.lines.length)).join('\n')
            if (!/try\s*\{/.test(lookahead) && /await\s/.test(lookahead)) {
              matches.push({
                ruleId: 'ERR_001',
                title: 'Async function without try/catch',
                description: 'Async function with await calls but no try/catch — unhandled rejection possible.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Wrap the function body with try { ... } catch (error) { /* handle */ }',
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
    description: 'Promise .catch() that silently discards errors.',
    severity: 'WARNING',
    suggestion: 'Always log or rethrow caught errors. Empty catch blocks hide bugs.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx)$/.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/\.catch\(\s*(e|err|error)?\s*=>\s*(\{\s*\}|\(\s*\))\s*\)/.test(line) ||
              /\.catch\(\s*console\.log\s*\)/.test(line)) {
            matches.push({
              ruleId: 'ERR_002',
              title: 'Swallowed error in .catch()',
              description: 'Error silently discarded — bugs will be invisible in production.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'At minimum: .catch(err => logger.error(err)) or rethrow with throw err',
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
    title: 'No global Express error handler',
    description: 'Express app without a 4-argument error handling middleware.',
    severity: 'WARNING',
    suggestion: 'Add app.use((err, req, res, next) => { ... }) as the last middleware.',
    codeExample: `app.use((err: Error, req: Request, res: Response, next: NextFunction) => {\n  console.error(err)\n  res.status(500).json({ error: 'Internal server error' })\n})`,
    detect(files: FetchedFile[]): RuleMatch[] {
      const appFiles = files.filter(
        (f) => /(app|server|index)\.(ts|js)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of appFiles) {
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
      return []
    },
  },

  {
    id: 'ERR_004',
    category: 'ERROR_HANDLING',
    title: 'External API calls without timeout',
    description: 'fetch() or axios calls without timeout configuration — will hang indefinitely.',
    severity: 'WARNING',
    suggestion: 'Add timeout to all external HTTP calls using AbortSignal.timeout() or axios timeout option.',
    codeExample: `// fetch with timeout:\nconst res = await fetch(url, { signal: AbortSignal.timeout(5000) })\n\n// axios with timeout:\naxios.get(url, { timeout: 5000 })`,
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/\bfetch\(|axios\.(get|post|put|delete|patch)\(/.test(line)) {
            const context = file.lines.slice(i, Math.min(i + 5, file.lines.length)).join('\n')
            if (!/timeout|AbortSignal|AbortController/.test(context)) {
              matches.push({
                ruleId: 'ERR_004',
                title: 'External API call without timeout',
                description: 'HTTP call to external service without timeout — can hang indefinitely.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Add: { signal: AbortSignal.timeout(5000) } to fetch() calls.',
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
