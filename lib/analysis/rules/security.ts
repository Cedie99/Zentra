import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const securityRules: AnalysisRule[] = [
  {
    id: 'SEC_001',
    category: 'SECURITY',
    title: 'Hardcoded secrets detected',
    description: 'API keys, passwords, or tokens are hardcoded directly in your source code. This is extremely dangerous because anyone who can see your code (including on GitHub) can steal your secrets and access your services.',
    severity: 'CRITICAL',
    suggestion: 'Move all secrets to environment variables. In Node.js: process.env.SECRET_NAME. In Python: os.environ["SECRET_NAME"]. In Go: os.Getenv("SECRET_NAME"). Add .env to .gitignore so secrets are never committed.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const secretPattern = /(apiKey|api_key|password|passwd|secret|token|accessToken|access_token|privateKey|private_key)\s*[:=]\s*["'][^"']{6,}["']/i
      const sourceFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx|py|go|rb|java|kt|rs)$/.test(f.path) && !/.env/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (secretPattern.test(line) && !/process\.env|os\.environ|os\.getenv|getenv|std::env|ENV\[/.test(line)) {
            matches.push({
              ruleId: 'SEC_001',
              title: 'Hardcoded secret detected',
              description: 'A secret value appears to be hardcoded in source code.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().replace(/["'][^"']{4,}["']/g, '"[REDACTED]"').slice(0, 200),
              suggestion: 'Use environment variables: process.env.SECRET (Node.js), os.environ["SECRET"] (Python), os.Getenv("SECRET") (Go).',
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
    description: 'Your API is configured to accept requests from ANY website (origin: "*"). This means malicious sites can make requests to your API on behalf of your users and steal their data or perform unwanted actions.',
    severity: 'CRITICAL',
    suggestion: 'Restrict CORS to only your trusted domains. Node.js: cors({ origin: ["https://yourapp.com"] }). Python/Flask: CORS(app, resources={r"/*": {"origins": ["https://yourapp.com"]}}). FastAPI: allow_origins=["https://yourapp.com"].',
    codeExample: `cors({ origin: ['https://yourapp.com', 'https://staging.yourapp.com'] })`,
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      for (const file of files) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (
            /cors\(\s*\{\s*origin:\s*['"]?\*['"]?/.test(line) ||
            /Access-Control-Allow-Origin.*\*/.test(line) ||
            // Python Flask-CORS wildcard
            /origins.*['"]\*['"]/.test(line) ||
            // FastAPI wildcard
            /allow_origins\s*=\s*\[['"]?\*['"]?\]/.test(line)
          ) {
            matches.push({
              ruleId: 'SEC_002',
              title: 'Open CORS — all origins allowed',
              description: 'CORS configured with wildcard "*" allows any website to make requests to your API.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Specify allowed origins explicitly instead of using "*".',
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
    description: 'This route file defines HTTP handlers but has no visible authentication check. This means anyone can access these endpoints without logging in, potentially exposing private data or allowing unauthorized actions.',
    severity: 'WARNING',
    suggestion: 'Add authentication middleware before route handlers. Node.js: router.use(authenticate). Python/Flask: @login_required decorator. FastAPI: Depends(get_current_user). Only public routes should skip auth.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const routeFiles = files.filter((f) =>
        /\/(routes|api|controllers|views|routers)\//.test(f.path) &&
        /\.(ts|js|py)$/.test(f.path)
      )

      for (const file of routeFiles) {
        const isJs = /\.(ts|js)$/.test(file.path)
        const isPy = /\.py$/.test(file.path)

        const hasRoutes = isJs
          ? /router\.(get|post|put|delete|patch)\(|app\.(get|post|put|delete|patch)\(/.test(file.content)
          : /(@app\.route|@router\.(get|post|put|delete|patch)|@bp\.route|@blueprint\.route)/.test(file.content)

        const hasAuth = isJs
          ? /authenticate|requireAuth|isAuthenticated|session|verifyToken|checkAuth|protect|ensureAuth|auth\(/.test(file.content)
          : /login_required|@jwt_required|current_user|Depends\(|get_current_user|verify_token|require_auth/.test(file.content)

        if (hasRoutes && !hasAuth) {
          const lineIdx = isJs
            ? file.lines.findIndex((l) => /router\.(get|post|put|delete|patch)\(|app\.(get|post|put|delete)/.test(l))
            : file.lines.findIndex((l) => /@(app|router|bp|blueprint)\.(route|get|post|put|delete|patch)/.test(l))

          matches.push({
            ruleId: 'SEC_003',
            title: 'Route file without authentication middleware',
            description: 'Route file defines HTTP handlers without any visible auth middleware.',
            severity: 'WARNING',
            filePath: file.path,
            lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
            evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'Route defined without auth',
            suggestion: isPy
              ? 'Add @login_required or Depends(get_current_user) to protected routes.'
              : 'Add authentication middleware: router.use(authenticate) or apply per-route.',
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
    description: 'A .env file containing secrets was found in your repository. This is a critical security issue because .env files typically contain database passwords, API keys, and other secrets. Once committed, these secrets are visible to anyone with repository access.',
    severity: 'CRITICAL',
    suggestion: 'IMMEDIATE ACTION: Run "git rm --cached .env && echo .env >> .gitignore && git commit -m Remove .env". Use .env.example to document required variables without actual values.',
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
    description: 'Your code sends raw error objects or stack traces to the browser/client. This exposes internal implementation details, file paths, and potentially sensitive information to attackers. Stack traces can reveal vulnerabilities in your code structure.',
    severity: 'CRITICAL',
    suggestion: 'Never send raw errors to clients. Log errors server-side and return generic messages. Node.js: res.status(500).json({ error: "Something went wrong" }). Python: return jsonify({"error": "Internal server error"}), 500.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (
            /res\.(json|send)\(\s*(err|error)\b/.test(line) ||
            /res\.(json|send)\([^)]*err\.(stack|message)/.test(line) ||
            // Python Flask: return jsonify(str(e)) or jsonify({"error": str(e)})
            /return\s+jsonify\(\s*str\(e(rr|rror)?\)/.test(line) ||
            /jsonify\(\s*\{[^}]*str\(\s*(e|err|error)\s*\)/.test(line) ||
            // FastAPI: raise HTTPException with exc detail
            /HTTPException\([^)]*detail\s*=\s*str\(/.test(line)
          ) {
            matches.push({
              ruleId: 'SEC_005',
              title: 'Error stack trace exposed to client',
              description: 'Raw error object or stack trace sent in HTTP response — leaks internals.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: /\.py$/.test(file.path)
                ? 'Return: jsonify({"error": "Internal server error"}), 500 instead of str(e).'
                : 'Return: res.status(500).json({ error: "Internal server error" }) instead.',
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
