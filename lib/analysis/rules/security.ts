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

  {
    id: 'SEC_006',
    category: 'SECURITY',
    title: 'No rate limiting on authentication endpoints',
    description: 'Your login/signup routes have no rate limiting. Attackers can brute-force passwords by trying thousands of combinations per second. Without rate limiting, there is nothing stopping automated credential stuffing attacks.',
    severity: 'CRITICAL',
    suggestion: 'Add rate limiting to auth endpoints. Express: rateLimit({ windowMs: 15*60*1000, max: 10 }) on /login. Flask: @limiter.limit("10/15minutes"). FastAPI: use slowapi with limits on auth routes.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const authFiles = files.filter(
        (f) =>
          /\.(ts|js|py)$/.test(f.path) &&
          (/auth|login|signin|signup|register/i.test(f.path) || /\/(api|routes)\//.test(f.path))
      )

      for (const file of authFiles) {
        const hasAuthRoute =
          /login|signin|sign-in|signup|sign-up|register/i.test(file.content) &&
          (/router\.(post|get)|app\.(post|get)|@app\.route|@router\.post/.test(file.content) ||
           /POST|export\s+(async\s+)?function/.test(file.content))
        const hasRateLimit = /rateLimit|rate.?limit|limiter|throttle|slowapi|Limiter/.test(file.content)

        if (hasAuthRoute && !hasRateLimit) {
          const lineIdx = file.lines.findIndex((l) => /login|signin|signup|register/i.test(l) && /(post|route|function|def)\b/i.test(l))
          return [
            {
              ruleId: 'SEC_006',
              title: 'No rate limiting on auth endpoints',
              description: 'Login/signup routes have no rate limiting — vulnerable to brute-force attacks.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: lineIdx >= 0 ? lineIdx + 1 : undefined,
              evidence: lineIdx >= 0 ? file.lines[lineIdx].trim().slice(0, 200) : 'Auth route without rate limit',
              suggestion: 'Add rate limiting (e.g. 10 attempts per 15 minutes) to authentication routes.',
              category: 'SECURITY',
            },
          ]
        }
      }
      return []
    },
  },

  {
    id: 'SEC_007',
    category: 'SECURITY',
    title: 'JWT created without expiration',
    description: 'JSON Web Tokens are created without an expiration time (exp claim). If a token is stolen, the attacker has permanent access. Tokens should always expire to limit the damage window of a compromised credential.',
    severity: 'CRITICAL',
    suggestion: 'Always set an expiration. Node.js: jwt.sign(payload, secret, { expiresIn: "1h" }). Python: jwt.encode(payload, secret, algorithm="HS256") with "exp" in payload. Use short-lived access tokens (15m–1h) with refresh tokens.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/jwt\.sign\(/.test(line)) {
            const context = file.lines.slice(i, Math.min(i + 5, file.lines.length)).join('\n')
            if (!/expiresIn|exp/.test(context)) {
              matches.push({
                ruleId: 'SEC_007',
                title: 'JWT created without expiration',
                description: 'jwt.sign() called without expiresIn — tokens never expire.',
                severity: 'CRITICAL',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Add { expiresIn: "1h" } as the third argument to jwt.sign().',
                category: 'SECURITY',
              })
              if (matches.length >= 3) return matches
            }
          }
          // Python: jwt.encode without exp in payload
          if (/jwt\.encode\(/.test(line)) {
            const context = file.lines.slice(Math.max(0, i - 5), Math.min(i + 5, file.lines.length)).join('\n')
            if (!/["']exp["']|timedelta|datetime/.test(context)) {
              matches.push({
                ruleId: 'SEC_007',
                title: 'JWT created without expiration (Python)',
                description: 'jwt.encode() called without exp claim in payload — tokens never expire.',
                severity: 'CRITICAL',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Add "exp": datetime.utcnow() + timedelta(hours=1) to the JWT payload.',
                category: 'SECURITY',
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
    id: 'SEC_008',
    category: 'SECURITY',
    title: 'No input validation library',
    description: 'Your application receives user input but has no validation library installed. Without validation, malformed or malicious data flows directly into your business logic and database, causing crashes, data corruption, or security exploits.',
    severity: 'WARNING',
    suggestion: 'Add input validation. Node.js: zod, joi, or yup to validate request bodies. Python: pydantic (FastAPI uses it by default), marshmallow, or cerberus. Validate ALL user input before processing.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      if (packageJson) {
        let deps: Record<string, string> = {}
        try {
          const parsed = JSON.parse(packageJson.content)
          deps = { ...parsed.dependencies, ...parsed.devDependencies }
        } catch { /* ignore */ }

        const validationLibs = ['zod', 'joi', 'yup', 'class-validator', 'ajv', 'superstruct', 'valibot', 'io-ts']
        if (validationLibs.some((l) => l in deps)) return []

        const hasRoutes = files.some(
          (f) => /\/(api|routes|controllers)\//.test(f.path) && /req\.body|request\.body/.test(f.content)
        )
        if (!hasRoutes) return []

        return [
          {
            ruleId: 'SEC_008',
            title: 'No input validation library',
            description: 'Routes accept req.body but no validation library (zod/joi/yup) is installed.',
            severity: 'WARNING',
            filePath: packageJson.path,
            evidence: 'No zod/joi/yup in dependencies; req.body usage detected',
            suggestion: 'Add zod or joi to validate all incoming request bodies before processing.',
            category: 'SECURITY',
          },
        ]
      }

      const requirementsTxt = files.find((f) => /requirements.*\.txt$/.test(f.path) || f.path === 'requirements.txt')
      if (requirementsTxt) {
        const content = requirementsTxt.content.toLowerCase()
        const pyValidationLibs = ['pydantic', 'marshmallow', 'cerberus', 'colander', 'voluptuous', 'wtforms']
        if (pyValidationLibs.some((l) => content.includes(l))) return []

        const hasRoutes = files.some(
          (f) => /\.py$/.test(f.path) && /request\.(json|form|data|get_json)/.test(f.content)
        )
        if (!hasRoutes) return []

        return [
          {
            ruleId: 'SEC_008',
            title: 'No input validation library (Python)',
            description: 'Routes accept request data but no validation library (pydantic/marshmallow) is installed.',
            severity: 'WARNING',
            filePath: requirementsTxt.path,
            evidence: 'No pydantic/marshmallow found; request data usage detected',
            suggestion: 'Add pydantic or marshmallow to validate all incoming request data.',
            category: 'SECURITY',
          },
        ]
      }

      return []
    },
  },

  {
    id: 'SEC_009',
    category: 'SECURITY',
    title: 'Insecure cookie configuration',
    description: 'Cookies are set without security flags (httpOnly, secure, sameSite). Without httpOnly, JavaScript can steal cookies via XSS. Without secure, cookies are sent over HTTP in plain text. Without sameSite, cookies are vulnerable to CSRF attacks.',
    severity: 'WARNING',
    suggestion: 'Set all security flags on cookies. Express: { httpOnly: true, secure: true, sameSite: "strict" }. Flask: SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SECURE=True, SESSION_COOKIE_SAMESITE="Lax".',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          // JS: res.cookie() or cookie() without httpOnly
          if (/res\.cookie\(|\.setCookie\(|cookie\(/.test(line) && /\{/.test(line)) {
            const context = file.lines.slice(i, Math.min(i + 8, file.lines.length)).join('\n')
            if (!/httpOnly\s*:\s*true/.test(context) && !/httponly/i.test(context)) {
              matches.push({
                ruleId: 'SEC_009',
                title: 'Cookie set without httpOnly flag',
                description: 'Cookie created without httpOnly — vulnerable to XSS cookie theft.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Add httpOnly: true, secure: true, sameSite: "strict" to cookie options.',
                category: 'SECURITY',
              })
              if (matches.length >= 3) return matches
            }
          }
          // Python Flask: response.set_cookie without httponly
          if (/set_cookie\(/.test(line) && /\.py$/.test(file.path)) {
            const context = file.lines.slice(i, Math.min(i + 5, file.lines.length)).join('\n')
            if (!/httponly\s*=\s*True/i.test(context)) {
              matches.push({
                ruleId: 'SEC_009',
                title: 'Cookie set without httponly flag (Python)',
                description: 'set_cookie() without httponly=True — vulnerable to XSS cookie theft.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Add httponly=True, secure=True, samesite="Lax" to set_cookie().',
                category: 'SECURITY',
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
    id: 'SEC_010',
    category: 'SECURITY',
    title: 'No CSRF protection',
    description: 'Your web application handles form submissions or state-changing POST requests without CSRF protection. Attackers can craft malicious pages that submit forms to your app on behalf of authenticated users, performing unwanted actions.',
    severity: 'WARNING',
    suggestion: 'Add CSRF protection. Express: use csurf or csrf-csrf middleware. Flask: use Flask-WTF CSRFProtect. Django has built-in CSRF middleware (ensure it is enabled). For SPAs using JWTs in headers, CSRF is less of a concern.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      if (packageJson) {
        let deps: Record<string, string> = {}
        try {
          const parsed = JSON.parse(packageJson.content)
          deps = { ...parsed.dependencies, ...parsed.devDependencies }
        } catch { /* ignore */ }

        // If using JWT in headers (not cookies), CSRF is less relevant
        if ('jsonwebtoken' in deps || 'jose' in deps) return []
        // Next.js has CSRF by default in server actions
        if ('next' in deps) return []

        const csrfLibs = ['csurf', 'csrf-csrf', 'csrf', 'lusca']
        if (csrfLibs.some((l) => l in deps)) return []

        const hasSessionForms = 'express-session' in deps && files.some(
          (f) => /\.(ts|js)$/.test(f.path) && /router\.post|app\.post/.test(f.content)
        )
        if (!hasSessionForms) return []

        return [
          {
            ruleId: 'SEC_010',
            title: 'No CSRF protection',
            description: 'Express app with session-based auth has POST routes but no CSRF middleware.',
            severity: 'WARNING',
            filePath: packageJson.path,
            evidence: 'express-session + POST routes but no csurf/csrf-csrf',
            suggestion: 'Add csrf-csrf or lusca middleware to protect against cross-site request forgery.',
            category: 'SECURITY',
          },
        ]
      }

      // Python: Flask without CSRFProtect
      const pyAppFiles = files.filter((f) => /\.py$/.test(f.path) && /Flask\(__name__\)/.test(f.content))
      for (const file of pyAppFiles) {
        if (/CSRFProtect|csrf_token|WTF_CSRF/.test(file.content)) return []
        const hasForms = files.some((f) => /\.py$/.test(f.path) && /request\.(form|data)|methods.*POST/.test(f.content))
        if (!hasForms) return []

        return [
          {
            ruleId: 'SEC_010',
            title: 'No CSRF protection (Flask)',
            description: 'Flask app accepts form data but CSRFProtect is not configured.',
            severity: 'WARNING',
            filePath: file.path,
            evidence: 'Flask app with form submissions but no CSRFProtect',
            suggestion: 'Add Flask-WTF CSRFProtect(app) to protect against cross-site request forgery.',
            category: 'SECURITY',
          },
        ]
      }
      return []
    },
  },

  {
    id: 'SEC_011',
    category: 'SECURITY',
    title: 'Sensitive data in URL parameters',
    description: 'Sensitive information like tokens, passwords, or API keys is passed through URL query parameters. URLs are logged in server logs, browser history, and proxy logs, exposing secrets to anyone with access to these logs.',
    severity: 'WARNING',
    suggestion: 'Send sensitive data in request headers (Authorization header) or POST request bodies — never in URL query parameters. Tokens should use the Authorization: Bearer <token> header pattern.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          // Detect ?token=, ?password=, ?secret=, ?apiKey= in URL strings
          if (/[?&](token|password|passwd|secret|apiKey|api_key|access_token|auth)=/i.test(line) &&
              /['"`]https?:|fetch\(|axios|requests?\.(get|post)|url|href/i.test(line)) {
            matches.push({
              ruleId: 'SEC_011',
              title: 'Sensitive data in URL query parameter',
              description: 'Token/password passed via URL query string — exposed in logs and browser history.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().replace(/=["'][^"']+["']/g, '=[REDACTED]').slice(0, 200),
              suggestion: 'Use Authorization header or POST body for sensitive data — never URL params.',
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
    id: 'SEC_012',
    category: 'SECURITY',
    title: 'Weak password hashing algorithm',
    description: 'Your code uses MD5 or SHA1/SHA256 for password hashing. These are fast general-purpose hash functions, NOT password hashing algorithms. Attackers can try billions of MD5/SHA hashes per second on a GPU. Passwords must use slow, salt-and-stretch algorithms designed to resist brute force.',
    severity: 'CRITICAL',
    suggestion: 'Use bcrypt, scrypt, or argon2 for password hashing. Node.js: bcryptjs or argon2. Python: passlib with bcrypt, or werkzeug.security.generate_password_hash. Never use MD5/SHA for passwords.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          // JS: crypto.createHash('md5'|'sha1'|'sha256') near password context
          if (/createHash\(\s*['"](?:md5|sha1|sha256)['"]\)/.test(line)) {
            const context = file.lines.slice(Math.max(0, i - 3), Math.min(i + 3, file.lines.length)).join('\n')
            if (/password|passwd|pwd/i.test(context)) {
              matches.push({
                ruleId: 'SEC_012',
                title: 'MD5/SHA used for password hashing',
                description: 'Password hashed with MD5/SHA — easily cracked with GPU brute force.',
                severity: 'CRITICAL',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Use bcrypt: const hash = await bcrypt.hash(password, 12)',
                category: 'SECURITY',
              })
              if (matches.length >= 3) return matches
            }
          }
          // Python: hashlib.md5/sha1/sha256 near password context
          if (/hashlib\.(md5|sha1|sha256)\(/.test(line)) {
            const context = file.lines.slice(Math.max(0, i - 3), Math.min(i + 3, file.lines.length)).join('\n')
            if (/password|passwd|pwd/i.test(context)) {
              matches.push({
                ruleId: 'SEC_012',
                title: 'MD5/SHA used for password hashing (Python)',
                description: 'Password hashed with hashlib.md5/sha — easily cracked with GPU brute force.',
                severity: 'CRITICAL',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Use passlib: from passlib.hash import bcrypt; bcrypt.hash(password)',
                category: 'SECURITY',
              })
              if (matches.length >= 3) return matches
            }
          }
        }
      }
      return matches
    },
  },
]
