import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const architectureRules: AnalysisRule[] = [
  {
    id: 'ARCH_001',
    category: 'ARCHITECTURE',
    title: 'God file detected',
    description: 'Your source file has over 500 lines of code. Large files are hard to understand, debug, and maintain. They typically indicate the file is doing too many things (violating single responsibility principle). Changes become risky because you might break unrelated functionality in the same file.',
    severity: 'WARNING',
    suggestion: 'Split large files into smaller modules based on functionality. Aim for files under 200-300 lines. Extract services, utilities, validators, and helpers into separate files.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) =>
          /\.(ts|js|tsx|jsx|py|go|rb|java|kt|rs)$/.test(f.path) &&
          !/\.(test|spec)\./.test(f.path) &&
          !/node_modules/.test(f.path)
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
    description: 'Your route files contain database queries and business logic directly. Routes should only handle HTTP (parse request, send response). Business logic in routes makes code hard to test, reuse, and maintain.',
    severity: 'WARNING',
    suggestion: 'Extract business logic into service files. Node.js: services/userService.ts. Python: services/user_service.py or a separate module. Routes should only call services, not query the database directly.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter(
        (f) => /\/(routes|api|views|routers)\//.test(f.path) && /\.(ts|js|py)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of routeFiles) {
        const isPy = /\.py$/.test(file.path)
        const hasDirectDbInRoute = isPy
          ? /session\.query|db\.query|cursor\.execute|Model\.objects\.(filter|get|create|update|delete)/.test(file.content) &&
            /@(app|router|bp|blueprint)\.(route|get|post|put|delete|patch)/.test(file.content)
          : (/app\.(get|post|put|delete)\([^,]+,\s*async.*prisma\.|router\.(get|post|put|delete)\([^,]+,\s*async.*prisma\./.test(file.content) ||
             (/prisma\.|Model\.find/.test(file.content) && /router\.(get|post|put|delete)|app\.(get|post|put|delete)/.test(file.content)))

        if (hasDirectDbInRoute) {
          const lineIdx = isPy
            ? file.lines.findIndex((l) => /session\.query|cursor\.execute|\.objects\./.test(l))
            : file.lines.findIndex((l) => /prisma\.|Model\.find/.test(l))
          matches.push({
            ruleId: 'ARCH_002',
            title: 'Business logic in route handler',
            description: 'ORM/DB queries found directly in route files — no service abstraction layer.',
            severity: 'WARNING',
            filePath: file.path,
            lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
            evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'ORM call in route',
            suggestion: isPy
              ? 'Create a service module (e.g. services/user_service.py) and call it from route handlers.'
              : 'Create a service layer (e.g. services/userService.ts) and call it from routes.',
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
    title: 'Only console.log / print for logging',
    description: 'Your code only uses console.log (JS) or print() (Python) for logging. In production these are inadequate: no log levels, no structured output, no log rotation, and logs can\'t be easily searched or filtered.',
    severity: 'INFO',
    suggestion: 'Use a structured logging library. Node.js: winston or pino. Python: Python\'s built-in logging module with structured handlers, or structlog/loguru. These provide log levels, JSON formatting, and production-grade log management.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      const requirementsTxt = files.find((f) => /requirements.*\.txt$/.test(f.path) || f.path === 'requirements.txt')

      // Node.js check
      if (packageJson) {
        let deps: Record<string, string> = {}
        try {
          const parsed = JSON.parse(packageJson.content)
          deps = { ...parsed.dependencies, ...parsed.devDependencies }
        } catch { /* ignore */ }

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
      }

      // Python check
      if (requirementsTxt) {
        const content = requirementsTxt.content.toLowerCase()
        const hasLogger = ['structlog', 'loguru', 'python-json-logger'].some((l) => content.includes(l))
        if (hasLogger) return []

        // Check if only print() is used instead of logging module
        const hasPrintOnly = files.some(
          (f) => /\.py$/.test(f.path) && /\bprint\(/.test(f.content) && !/\bimport\s+logging\b|\bfrom\s+logging/.test(f.content)
        )
        if (!hasPrintOnly) return []

        return [
          {
            ruleId: 'ARCH_003',
            title: 'Using print() instead of logging module',
            description: 'Python code uses print() for output instead of the logging module — no log levels or structured output.',
            severity: 'INFO',
            filePath: requirementsTxt.path,
            evidence: 'print() used; no logging library found',
            suggestion: 'Use Python\'s built-in logging module or install loguru/structlog for structured production logs.',
            category: 'ARCHITECTURE',
          },
        ]
      }

      return []
    },
  },

  {
    id: 'ARCH_004',
    category: 'ARCHITECTURE',
    title: 'Mixed async styles in same file',
    description: 'Your code mixes both .then() promise chains and async/await in the same file. This inconsistency makes code harder to read and maintain. Different parts of the file handle errors differently (.catch vs try/catch), which can lead to bugs and confusion.',
    severity: 'INFO',
    suggestion: 'Standardize on async/await throughout your codebase. It\'s more readable, handles errors consistently with try/catch, and is easier to debug. Refactor .then() chains to async/await for consistency.',
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
