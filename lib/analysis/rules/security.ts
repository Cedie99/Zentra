import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const securityRules: AnalysisRule[] = [
  {
    id: 'SEC_001',
    category: 'SECURITY',
    title: 'Hardcoded secrets detected',
    description: 'API keys, passwords, or tokens hardcoded in source files.',
    severity: 'CRITICAL',
    suggestion: 'Move all secrets to environment variables. Never commit secrets to source control.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const secretPattern = /(apiKey|api_key|password|passwd|secret|token|accessToken|access_token|privateKey|private_key)\s*[:=]\s*["'][^"']{6,}["']/i
      const sourceFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx|py|go|rb|java)$/.test(f.path) && !/.env/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (secretPattern.test(line) && !/process\.env|os\.environ|getenv/.test(line)) {
            matches.push({
              ruleId: 'SEC_001',
              title: 'Hardcoded secret detected',
              description: 'A secret value appears to be hardcoded in source code.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().replace(/["'][^"']{4,}["']/g, '"[REDACTED]"').slice(0, 200),
              suggestion: 'Use process.env.SECRET_NAME and add the variable to .env.local (excluded from git).',
              category: 'SECURITY',
            })
            if (matches.length >= 5) return matches
          }
        }
      }
      return matches
    },
  },

  {
    id: 'SEC_002',
    category: 'SECURITY',
    title: 'Open CORS configuration',
    description: 'CORS configured to allow all origins (*).',
    severity: 'CRITICAL',
    suggestion: 'Restrict CORS to known origins. Use an allowlist of trusted domains.',
    codeExample: `cors({ origin: ['https://yourapp.com', 'https://staging.yourapp.com'] })`,
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      for (const file of files) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/cors\(\s*\{\s*origin:\s*['"]?\*['"]?/.test(line) || /Access-Control-Allow-Origin.*\*/.test(line)) {
            matches.push({
              ruleId: 'SEC_002',
              title: 'Open CORS — all origins allowed',
              description: 'cors({ origin: "*" }) allows any website to make requests to your API.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Specify allowed origins explicitly: cors({ origin: ["https://yourapp.com"] })',
              category: 'SECURITY',
            })
            if (matches.length >= 3) return matches
          }
        }
      }
      return matches
    },
  },

  {
    id: 'SEC_003',
    category: 'SECURITY',
    title: 'Route without authentication middleware',
    description: 'Route handler defined without any authentication/authorization check.',
    severity: 'WARNING',
    suggestion: 'Apply authentication middleware to all protected routes.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter((f) => /\/(routes|api|controllers)\//.test(f.path) && /\.(ts|js)$/.test(f.path))

      for (const file of routeFiles) {
        const hasRoutes = /router\.(get|post|put|delete|patch)\(|app\.(get|post|put|delete|patch)\(/.test(file.content)
        const hasAuth = /authenticate|requireAuth|isAuthenticated|session|verifyToken|checkAuth|protect|ensureAuth|auth\(/.test(file.content)
        if (hasRoutes && !hasAuth) {
          const lineIdx = file.lines.findIndex((l) => /router\.(get|post|put|delete|patch)\(|app\.(get|post|put|delete)/.test(l))
          matches.push({
            ruleId: 'SEC_003',
            title: 'Route file without authentication middleware',
            description: 'Route file defines HTTP handlers without any visible auth middleware.',
            severity: 'WARNING',
            filePath: file.path,
            lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
            evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'Route defined without auth',
            suggestion: 'Add authentication middleware: router.use(authenticate) or apply per-route.',
            category: 'SECURITY',
          })
          if (matches.length >= 5) break
        }
      }
      return matches
    },
  },

  {
    id: 'SEC_004',
    category: 'SECURITY',
    title: '.env file committed to repository',
    description: 'A .env file (not .env.example) was found in the repository.',
    severity: 'CRITICAL',
    suggestion: 'Remove .env from git history. Add .env to .gitignore immediately.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const envFile = files.find((f) => /^\.env$/.test(f.path) || /\/\.env$/.test(f.path))
      if (!envFile) return []
      return [
        {
          ruleId: 'SEC_004',
          title: '.env file committed to repository',
          description: 'A .env file containing secrets was found in the repository file tree.',
          severity: 'CRITICAL',
          filePath: envFile.path,
          evidence: '.env file detected in repository',
          suggestion: 'Run: git rm --cached .env && echo ".env" >> .gitignore && git commit -m "Remove .env"',
          category: 'SECURITY',
        },
      ]
    },
  },

  {
    id: 'SEC_005',
    category: 'SECURITY',
    title: 'Error stack traces exposed to client',
    description: 'Server error stack traces sent directly to HTTP response.',
    severity: 'CRITICAL',
    suggestion: 'Never send err.stack or full error objects to clients. Log server-side, return generic messages.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx)$/.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/res\.(json|send)\(\s*(err|error)\b/.test(line) || /res\.(json|send)\([^)]*err\.(stack|message)/.test(line)) {
            matches.push({
              ruleId: 'SEC_005',
              title: 'Error stack trace exposed to client',
              description: 'Raw error object or stack trace sent in HTTP response — leaks internals.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Return: res.status(500).json({ error: "Internal server error" }) instead.',
              category: 'SECURITY',
            })
            if (matches.length >= 5) return matches
          }
        }
      }
      return matches
    },
  },
]
