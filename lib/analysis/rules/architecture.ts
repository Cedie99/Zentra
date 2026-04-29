import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const architectureRules: AnalysisRule[] = [
  {
    id: 'ARCH_001',
    category: 'ARCHITECTURE',
    title: 'God file detected',
    description: 'Source file exceeding 500 lines — likely doing too many things.',
    severity: 'WARNING',
    suggestion: 'Split large files into smaller, single-responsibility modules.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx)$/.test(f.path) && !/\.(test|spec)\./.test(f.path) && !/node_modules/.test(f.path)
      )

      for (const file of sourceFiles) {
        if (file.lines.length > 500) {
          matches.push({
            ruleId: 'ARCH_001',
            title: `God file: ${file.path.split('/').pop()} (${file.lines.length} lines)`,
            description: `File has ${file.lines.length} lines — likely violates single responsibility principle.`,
            severity: 'WARNING',
            filePath: file.path,
            evidence: `${file.lines.length} lines of code`,
            suggestion: 'Extract logical sections into separate service, helper, or utility files.',
            category: 'ARCHITECTURE',
          })
          if (matches.length >= 5) return matches
        }
      }
      return matches
    },
  },

  {
    id: 'ARCH_002',
    category: 'ARCHITECTURE',
    title: 'Business logic directly in route handlers',
    description: 'Database queries directly in route callbacks with no service layer.',
    severity: 'WARNING',
    suggestion: 'Extract business logic into service files. Routes should only parse input and delegate.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter(
        (f) => /\/(routes|api)\//.test(f.path) && /\.(ts|js)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of routeFiles) {
        const hasDirectDbInRoute = /app\.(get|post|put|delete)\([^,]+,\s*async.*prisma\.|router\.(get|post|put|delete)\([^,]+,\s*async.*prisma\./.test(file.content)
        if (hasDirectDbInRoute || (/prisma\.|Model\.find/.test(file.content) && /router\.(get|post|put|delete)|app\.(get|post|put|delete)/.test(file.content))) {
          const lineIdx = file.lines.findIndex((l) => /prisma\.|Model\.find/.test(l))
          matches.push({
            ruleId: 'ARCH_002',
            title: 'Business logic in route handler',
            description: 'ORM queries found directly in route files — no service abstraction layer.',
            severity: 'WARNING',
            filePath: file.path,
            lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
            evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'ORM call in route',
            suggestion: 'Create a service layer (e.g. services/userService.ts) and call it from routes.',
            category: 'ARCHITECTURE',
          })
          if (matches.length >= 5) break
        }
      }
      return matches
    },
  },

  {
    id: 'ARCH_003',
    category: 'ARCHITECTURE',
    title: 'Only console.log for logging',
    description: 'console.log used for logging without a structured logging library.',
    severity: 'INFO',
    suggestion: 'Use a structured logging library like winston or pino for production-grade logging.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      if (!packageJson) return []

      let deps: Record<string, string> = {}
      try {
        const parsed = JSON.parse(packageJson.content)
        deps = { ...parsed.dependencies, ...parsed.devDependencies }
      } catch {
        return []
      }

      const hasLogger = ['winston', 'pino', 'bunyan', 'log4js', 'signale'].some((l) => l in deps)
      if (hasLogger) return []

      const hasConsoleLog = files.some(
        (f) => /\.(ts|js|tsx|jsx)$/.test(f.path) && !/\.(test|spec)\./.test(f.path) && /console\.log/.test(f.content)
      )

      if (!hasConsoleLog) return []

      return [
        {
          ruleId: 'ARCH_003',
          title: 'No structured logging library',
          description: 'Only console.log used — no structured logging (winston/pino) for production observability.',
          severity: 'INFO',
          filePath: packageJson.path,
          evidence: 'No winston/pino/bunyan in dependencies',
          suggestion: 'Install pino or winston for structured JSON logs with log levels and transports.',
          category: 'ARCHITECTURE',
        },
      ]
    },
  },

  {
    id: 'ARCH_004',
    category: 'ARCHITECTURE',
    title: 'Mixed async styles in same file',
    description: 'Both .then() chains and async/await used in the same file.',
    severity: 'INFO',
    suggestion: 'Pick one async style per file. Prefer async/await for readability.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of sourceFiles) {
        const hasThen = /\.then\(/.test(file.content)
        const hasAwait = /\bawait\s/.test(file.content)
        if (hasThen && hasAwait) {
          matches.push({
            ruleId: 'ARCH_004',
            title: 'Mixed async styles',
            description: 'File uses both .then() chains and async/await — inconsistent code style.',
            severity: 'INFO',
            filePath: file.path,
            evidence: 'Both .then() and await found in file',
            suggestion: 'Standardize on async/await for consistency and easier error handling.',
            category: 'ARCHITECTURE',
          })
          if (matches.length >= 5) return matches
        }
      }
      return matches
    },
  },
]
