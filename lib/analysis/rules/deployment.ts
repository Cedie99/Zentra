import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const deploymentRules: AnalysisRule[] = [
  {
    id: 'DEPLOY_001',
    category: 'DEPLOYMENT',
    title: 'No Dockerfile',
    description: 'Your repository has no Dockerfile, which means you can\'t containerize your application. Containers ensure your app runs the same way in development, staging, and production by packaging all dependencies and configuration.',
    severity: 'INFO',
    suggestion: 'Add a Dockerfile to containerize your application. This ensures consistent behavior across environments and simplifies deployment to platforms like AWS ECS, Google Cloud Run, or Kubernetes.',
    detect(files: FetchedFile[]): RuleMatch[] {
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
    detect(files: FetchedFile[]): RuleMatch[] {
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
    detect(files: FetchedFile[]): RuleMatch[] {
      const hasHealth = files.some(
        (f) =>
          (/\.(ts|js|py)$/.test(f.path) &&
          /\/health[z]?\b|\/ready\b|\/ping\b/.test(f.content)) ||
          // Docker/k8s healthcheck
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
    detect(files: FetchedFile[]): RuleMatch[] {
      const hasCI = files.some(
        (f) =>
          /\.github\/workflows\//.test(f.path) ||
          /\.gitlab-ci\.yml$/.test(f.path) ||
          /^Jenkinsfile$/.test(f.path) ||
          /\.circleci\/config/.test(f.path)
      )
      if (hasCI) return []
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
]
