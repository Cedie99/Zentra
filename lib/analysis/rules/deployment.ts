import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'
import type { RepoContext } from '../repo-context'

export const deploymentRules: AnalysisRule[] = [
  {
    id: 'DEPLOY_001',
    category: 'DEPLOYMENT',
    title: 'No Dockerfile',
    description: 'Your repository has no Dockerfile, which means you can\'t containerize your application. Containers ensure your app runs the same way in development, staging, and production by packaging all dependencies and configuration.',
    severity: 'INFO',
    suggestion: 'Add a Dockerfile to containerize your application. This ensures consistent behavior across environments and simplifies deployment to platforms like AWS ECS, Google Cloud Run, or Kubernetes.',
    detect(files: FetchedFile[], context?: RepoContext): RuleMatch[] {
      // Serverless platforms (Vercel, Netlify, Cloudflare) manage containers themselves
      if (context?.isServerless) return []
      const hasDocker = files.some((f) => /^Dockerfile$|\/Dockerfile$/.test(f.path))
      if (hasDocker) return []
      return [
        {
          ruleId: 'DEPLOY_001',
          title: 'No Dockerfile',
          description: 'Repository has no Dockerfile — containerized deployment is not configured.',
          severity: 'INFO',
          filePath: 'Dockerfile',
          evidence: 'Dockerfile absent from repository',
          suggestion: 'Add a multi-stage Dockerfile to enable container-based deployments.',
          category: 'DEPLOYMENT',
        },
      ]
    },
  },

  {
    id: 'DEPLOY_002',
    category: 'DEPLOYMENT',
    title: 'No .env.example file',
    description: 'Your repository lacks .env.example, which documents required environment variables. New developers can\'t set up the project without guessing which variables are needed. This causes onboarding friction and misconfigured deployments.',
    severity: 'WARNING',
    suggestion: 'Create .env.example listing all required environment variables with placeholder values (no actual secrets). This makes onboarding and deployment setup much easier.',
    detect(files: FetchedFile[], _context: RepoContext): RuleMatch[] {
      const hasEnvExample = files.some((f) => /\.env\.example$/.test(f.path))
      if (hasEnvExample) return []
      return [
        {
          ruleId: 'DEPLOY_002',
          title: 'No .env.example file',
          description: '.env.example is missing — required environment variables are not documented.',
          severity: 'WARNING',
          filePath: '.env.example',
          evidence: '.env.example absent from repository',
          suggestion: 'Create .env.example listing all required env vars with placeholder values.',
          category: 'DEPLOYMENT',
        },
      ]
    },
  },

  {
    id: 'DEPLOY_003',
    category: 'DEPLOYMENT',
    title: 'No health check endpoint',
    description: 'Your application has no /health or /healthz endpoint. Load balancers and orchestration systems (Kubernetes, AWS) need a health check to know if your app is running. Without it, unhealthy instances won\'t be detected and replaced, causing downtime.',
    severity: 'WARNING',
    suggestion: 'Add a health check endpoint. Node.js/Express: app.get("/health", (req, res) => res.json({ status: "ok" })). Python/Flask: @app.route("/health") def health(): return {"status": "ok"}. FastAPI: @app.get("/health").',
    detect(files: FetchedFile[], context?: RepoContext): RuleMatch[] {
      // Serverless platforms handle health checks at the platform level
      if (context?.isServerless) return []
      // Only relevant for apps that handle external traffic
      if (context && !context.hasApiRoutes) return []
      const hasHealth = files.some(
        (f) =>
          (/\.(ts|js|py)$/.test(f.path) &&
          /\/health[z]?\b|\/ready\b|\/ping\b/.test(f.content)) ||
          (/Dockerfile$/.test(f.path) && /HEALTHCHECK/.test(f.content))
      )
      if (hasHealth) return []
      return [
        {
          ruleId: 'DEPLOY_003',
          title: 'No health check endpoint',
          description: 'No /health, /healthz, /ready, or /ping route found.',
          severity: 'WARNING',
          filePath: 'app',
          evidence: 'Health check route absent',
          suggestion: 'Add a /health endpoint returning { status: "ok" } for load balancer and orchestration health checks.',
          category: 'DEPLOYMENT',
        },
      ]
    },
  },

  {
    id: 'DEPLOY_004',
    category: 'DEPLOYMENT',
    title: 'Dev dependencies in production dependencies',
    description: 'Development tools (test runners, linters, type checkers) are in your production dependencies. This increases your production build size, attack surface, and deployment time. Production builds should only include what\'s actually needed to run the app.',
    severity: 'WARNING',
    suggestion: 'Move dev-only packages to devDependencies (Node.js) or a separate requirements-dev.txt (Python). Keep production dependencies lean.',
    detect(files: FetchedFile[]): RuleMatch[] {
      // Node.js check
      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      if (packageJson) {
        let parsed: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } = {}
        try {
          parsed = JSON.parse(packageJson.content)
        } catch {
          return []
        }

        const devOnlyPackages = ['nodemon', 'ts-node', 'jest', 'mocha', 'vitest', 'eslint', 'prettier', '@types/']
        const deps = parsed.dependencies || {}
        const wrongPlace = Object.keys(deps).filter((dep) =>
          devOnlyPackages.some((d) => dep === d || dep.startsWith(d))
        )

        if (wrongPlace.length > 0) {
          return [
            {
              ruleId: 'DEPLOY_004',
              title: 'Dev dependencies in production dependencies',
              description: `These dev packages are in dependencies: ${wrongPlace.join(', ')}`,
              severity: 'WARNING',
              filePath: packageJson.path,
              evidence: `Found in dependencies: ${wrongPlace.join(', ')}`,
              suggestion: 'Move to devDependencies: these are not needed in production builds.',
              category: 'DEPLOYMENT',
            },
          ]
        }
      }

      // Python check: dev tools in main requirements.txt (not requirements-dev.txt)
      const mainReqs = files.find((f) => f.path === 'requirements.txt' || /^requirements\.txt$/.test(f.path.split('/').pop() ?? ''))
      if (mainReqs) {
        const devOnlyPythonPkgs = ['pytest', 'black', 'flake8', 'mypy', 'pylint', 'coverage', 'factory-boy', 'faker', 'hypothesis']
        const content = mainReqs.content.toLowerCase()
        const wrongPlace = devOnlyPythonPkgs.filter((p) => content.includes(p))

        if (wrongPlace.length > 0) {
          return [
            {
              ruleId: 'DEPLOY_004',
              title: 'Dev packages in requirements.txt',
              description: `Dev-only packages found in requirements.txt: ${wrongPlace.join(', ')}`,
              severity: 'WARNING',
              filePath: mainReqs.path,
              evidence: `Dev packages: ${wrongPlace.join(', ')}`,
              suggestion: 'Move test/lint/type-check tools to requirements-dev.txt to keep production installs lean.',
              category: 'DEPLOYMENT',
            },
          ]
        }
      }

      return []
    },
  },

  {
    id: 'DEPLOY_005',
    category: 'DEPLOYMENT',
    title: 'Hardcoded localhost in source files',
    description: 'Your code contains hardcoded localhost or 127.0.0.1 URLs. These work in development but break in staging and production where the API/database runs on different servers.',
    severity: 'WARNING',
    suggestion: 'Replace hardcoded URLs with environment variables. Node.js: process.env.API_URL. Python: os.environ["API_URL"]. Go: os.Getenv("API_URL"). Configure per environment for consistent deployments.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) =>
          /\.(ts|js|tsx|jsx|py|go|rb|java)$/.test(f.path) &&
          !/next\.config|vite\.config|\.test\.|\.spec\./.test(f.path) &&
          f.category !== 'config'
      )

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/['"`]https?:\/\/(localhost|127\.0\.0\.1)/.test(line) || /"https?:\/\/(localhost|127\.0\.0\.1)/.test(line)) {
            matches.push({
              ruleId: 'DEPLOY_005',
              title: 'Hardcoded localhost URL',
              description: 'localhost URL hardcoded — will break in staging/production environments.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: /\.py$/.test(file.path)
                ? 'Replace with os.environ.get("API_URL") or a config variable.'
                : 'Replace with process.env.API_URL or similar environment variable.',
              category: 'DEPLOYMENT',
            })
            if (matches.length >= 5) return matches
          }
        }
      }
      return matches
    },
  },

  {
    id: 'DEPLOY_006',
    category: 'DEPLOYMENT',
    title: 'No CI/CD configuration',
    description: 'Your repository has no CI/CD pipeline (GitHub Actions, GitLab CI, etc.). Deployments and testing must be done manually, which is error-prone, slow, and inconsistent. Automated CI/CD ensures every change is tested and deployed reliably.',
    severity: 'INFO',
    suggestion: 'Add a CI/CD pipeline using GitHub Actions (.github/workflows/ci.yml) or GitLab CI (.gitlab-ci.yml). Automate running tests, linting, and deployment on every push.',
    detect(files: FetchedFile[], context?: RepoContext): RuleMatch[] {
      const hasCI = files.some(
        (f) =>
          /\.github\/workflows\//.test(f.path) ||
          /\.gitlab-ci\.yml$/.test(f.path) ||
          /^Jenkinsfile$/.test(f.path) ||
          /\.circleci\/config/.test(f.path)
      )
      if (hasCI) return []

      // Vercel and Netlify have built-in git-push CI/CD — missing a workflow file is not a problem
      if (context?.deploymentTarget === 'vercel' || context?.deploymentTarget === 'netlify') {
        return [
          {
            ruleId: 'DEPLOY_006',
            title: 'No CI/CD workflow for automated tests',
            description: `Deployment is handled by ${context?.deploymentTarget === 'vercel' ? 'Vercel' : 'Netlify'} git integration, but there is no GitHub Actions workflow to run tests on pull requests. Broken code could be deployed without catching test failures first.`,
            severity: 'INFO',
            filePath: '.github/workflows',
            evidence: 'No CI/CD config files detected',
            suggestion: 'Add .github/workflows/ci.yml to run tests on every pull request, separate from the deployment pipeline.',
            category: 'DEPLOYMENT',
          },
        ]
      }

      return [
        {
          ruleId: 'DEPLOY_006',
          title: 'No CI/CD configuration',
          description: 'No CI/CD pipeline found — no automated testing or deployment.',
          severity: 'INFO',
          filePath: '.github/workflows',
          evidence: 'No CI/CD config files detected',
          suggestion: 'Add .github/workflows/ci.yml to run tests and deploy automatically.',
          category: 'DEPLOYMENT',
        },
      ]
    },
  },

  {
    id: 'DEPLOY_007',
    category: 'DEPLOYMENT',
    title: 'Missing environment variable validation',
    description: 'Your application uses environment variables but doesn\'t validate them at startup. If a required variable is missing or misconfigured, the app will crash later with confusing errors. Validation should fail fast with clear error messages.',
    severity: 'WARNING',
    suggestion: 'Validate env vars at startup. Node.js: use zod or envalid. Python: use pydantic-settings (BaseSettings) or python-decouple with required() — these catch missing config immediately with helpful error messages.',
    codeExample: `import { z } from 'zod'\nconst env = z.object({\n  DATABASE_URL: z.string().url(),\n  NEXTAUTH_SECRET: z.string().min(32),\n}).parse(process.env)`,
    detect(files: FetchedFile[]): RuleMatch[] {
      // Node.js check
      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      if (packageJson) {
        let deps: Record<string, string> = {}
        try {
          const parsed = JSON.parse(packageJson.content)
          deps = { ...parsed.dependencies, ...parsed.devDependencies }
        } catch { /* ignore */ }

        const hasValidation = ['zod', 'joi', 'envalid', 'env-var', 't3-env'].some((lib) => lib in deps)
        if (!hasValidation) {
          const usesEnv = files.some((f) => /process\.env\.\w+/.test(f.content))
          if (usesEnv) {
            return [
              {
                ruleId: 'DEPLOY_007',
                title: 'Missing environment variable validation',
                description: 'App uses process.env variables but does not validate them at startup.',
                severity: 'WARNING',
                filePath: packageJson.path,
                evidence: 'No zod/joi/envalid found; process.env usage detected',
                suggestion: 'Add env validation with zod at app startup to catch misconfiguration early.',
                category: 'DEPLOYMENT',
              },
            ]
          }
        }
      }

      // Python check
      const requirementsTxt = files.find((f) => /requirements.*\.txt$/.test(f.path) || f.path === 'requirements.txt')
      if (requirementsTxt) {
        const content = requirementsTxt.content.toLowerCase()
        const hasValidation = ['pydantic-settings', 'pydantic[dotenv]', 'python-decouple', 'dynaconf'].some((l) => content.includes(l))
        if (!hasValidation) {
          const usesEnv = files.some((f) => /\.py$/.test(f.path) && /os\.environ|os\.getenv/.test(f.content))
          if (usesEnv) {
            return [
              {
                ruleId: 'DEPLOY_007',
                title: 'Missing Python env variable validation',
                description: 'Python app uses os.environ/os.getenv but has no env validation library.',
                severity: 'WARNING',
                filePath: requirementsTxt.path,
                evidence: 'No pydantic-settings/python-decouple found; os.environ usage detected',
                suggestion: 'Use pydantic-settings (BaseSettings) to validate and type all environment variables at startup.',
                category: 'DEPLOYMENT',
              },
            ]
          }
        }
      }

      return []
    },
  },

  {
    id: 'DEPLOY_008',
    category: 'DEPLOYMENT',
    title: 'No .gitignore file',
    description: 'Your repository has no .gitignore file. Without it, build artifacts, node_modules, .env files, and other generated/sensitive files get committed to version control — bloating the repo and potentially leaking secrets.',
    severity: 'WARNING',
    suggestion: 'Add a .gitignore file. Use gitignore.io or GitHub templates for your tech stack. At minimum include: node_modules/, .env, .env.local, dist/, build/, __pycache__/, *.pyc, .DS_Store.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const hasGitignore = files.some((f) => /^\.gitignore$/.test(f.path) || /\/\.gitignore$/.test(f.path))
      if (hasGitignore) return []
      return [
        {
          ruleId: 'DEPLOY_008',
          title: 'No .gitignore file',
          description: 'Repository has no .gitignore — generated files and secrets may be committed.',
          severity: 'WARNING',
          filePath: '.gitignore',
          evidence: '.gitignore absent from repository',
          suggestion: 'Add .gitignore with node_modules/, .env, dist/, __pycache__/ at minimum.',
          category: 'DEPLOYMENT',
        },
      ]
    },
  },

  {
    id: 'DEPLOY_009',
    category: 'DEPLOYMENT',
    title: 'Node.js version not pinned',
    description: 'Your project does not specify a Node.js version (no .nvmrc, .node-version, or engines field in package.json). Different developers and CI/CD environments may use different Node versions, causing "works on my machine" bugs and subtle runtime differences.',
    severity: 'INFO',
    suggestion: 'Pin your Node.js version. Create .nvmrc with the version (e.g. 20). Or add to package.json: "engines": { "node": ">=20.0.0" }. This ensures everyone uses the same Node version.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const hasNodeVersion = files.some(
        (f) => /^\.nvmrc$/.test(f.path) || /^\.node-version$/.test(f.path) || /^\.tool-versions$/.test(f.path)
      )
      if (hasNodeVersion) return []

      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      if (!packageJson) return []

      try {
        const parsed = JSON.parse(packageJson.content)
        if (parsed.engines?.node) return []
      } catch { /* ignore */ }

      return [
        {
          ruleId: 'DEPLOY_009',
          title: 'Node.js version not pinned',
          description: 'No .nvmrc, .node-version, or engines.node field — Node version varies across environments.',
          severity: 'INFO',
          filePath: packageJson.path,
          evidence: 'No .nvmrc or engines.node found',
          suggestion: 'Add "engines": { "node": ">=20.0.0" } to package.json or create .nvmrc with "20".',
          category: 'DEPLOYMENT',
        },
      ]
    },
  },

  {
    id: 'DEPLOY_010',
    category: 'DEPLOYMENT',
    title: 'No lockfile committed',
    description: 'Your repository has no package-lock.json, yarn.lock, or pnpm-lock.yaml committed. Without a lockfile, npm install can resolve different dependency versions on different machines, causing "works locally but breaks in CI" issues.',
    severity: 'WARNING',
    suggestion: 'Commit your lockfile. npm: commit package-lock.json. yarn: commit yarn.lock. pnpm: commit pnpm-lock.yaml. The lockfile ensures everyone installs the exact same dependency versions.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const hasLockfile = files.some(
        (f) => /package-lock\.json$|yarn\.lock$|pnpm-lock\.yaml$/.test(f.path)
      )
      if (hasLockfile) return []

      const hasPackageJson = files.some((f) => /package\.json$/.test(f.path))
      if (!hasPackageJson) return []

      return [
        {
          ruleId: 'DEPLOY_010',
          title: 'No lockfile committed',
          description: 'No package-lock.json, yarn.lock, or pnpm-lock.yaml — dependency versions may vary.',
          severity: 'WARNING',
          filePath: 'package.json',
          evidence: 'No lockfile found in repository',
          suggestion: 'Run npm install and commit package-lock.json to lock dependency versions.',
          category: 'DEPLOYMENT',
        },
      ]
    },
  },

  {
    id: 'DEPLOY_011',
    category: 'DEPLOYMENT',
    title: 'Debug/development mode in production config',
    description: 'Your configuration files contain debug or development mode settings that should be disabled in production. Debug mode exposes detailed error messages, stack traces, and may enable development-only features that are insecure or slow.',
    severity: 'WARNING',
    suggestion: 'Use environment-specific configuration. Node.js: NODE_ENV=production. Flask: DEBUG=False in production. Django: DEBUG=False. Never hardcode DEBUG=True in committed config files — use environment variables.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const configFiles = files.filter(
        (f) => /\.(ts|js|py|json|yaml|yml)$/.test(f.path) &&
        /(config|settings|app)\.(ts|js|py|json|yaml|yml)$/.test(f.path) &&
        !/node_modules/.test(f.path)
      )

      for (const file of configFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          // Python: DEBUG = True in settings file
          if (/^\s*DEBUG\s*=\s*True\b/.test(line) && /settings|config/.test(file.path)) {
            matches.push({
              ruleId: 'DEPLOY_011',
              title: 'DEBUG=True in config file',
              description: 'Debug mode hardcoded to True — will expose internals in production.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Use: DEBUG = os.environ.get("DEBUG", "False").lower() == "true" for env-based config.',
              category: 'DEPLOYMENT',
            })
            if (matches.length >= 3) return matches
          }
          // JS: debug: true or DEBUG: true in config
          if (/['"]?debug['"]?\s*:\s*true\b/i.test(line) && !/\.(test|spec)\./.test(file.path)) {
            matches.push({
              ruleId: 'DEPLOY_011',
              title: 'debug: true in config file',
              description: 'Debug mode hardcoded to true — may expose internals in production.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Use: debug: process.env.NODE_ENV !== "production" for environment-based debug mode.',
              category: 'DEPLOYMENT',
            })
            if (matches.length >= 3) return matches
          }
        }
      }
      return matches
    },
  },

  {
    id: 'DEPLOY_012',
    category: 'DEPLOYMENT',
    title: 'No README file',
    description: 'Your repository has no README.md file. Without a README, new team members cannot understand what the project does, how to set it up, or how to contribute. It\'s the first thing people see on GitHub and is essential for onboarding.',
    severity: 'INFO',
    suggestion: 'Create a README.md with: project description, setup instructions, environment variables needed, how to run locally, how to run tests, and deployment instructions.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const hasReadme = files.some((f) => /readme\.md$/i.test(f.path))
      if (hasReadme) return []
      return [
        {
          ruleId: 'DEPLOY_012',
          title: 'No README.md file',
          description: 'Repository has no README — no documentation for setup, usage, or contributing.',
          severity: 'INFO',
          filePath: 'README.md',
          evidence: 'README.md absent from repository',
          suggestion: 'Create README.md with: description, setup steps, env vars, run/test/deploy instructions.',
          category: 'DEPLOYMENT',
        },
      ]
    },
  },
]
