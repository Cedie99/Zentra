import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const deploymentRules: AnalysisRule[] = [
  {
    id: 'DEPLOY_001',
    category: 'DEPLOYMENT',
    title: 'No Dockerfile',
    description: 'No Dockerfile found — app cannot be containerized.',
    severity: 'INFO',
    suggestion: 'Add a Dockerfile for reproducible builds and container deployments.',
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
    description: 'No .env.example — other developers won\'t know which environment variables are required.',
    severity: 'WARNING',
    suggestion: 'Add .env.example with all required variables (no values) to the repository.',
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
    description: 'No /health or /healthz route — load balancers can\'t verify app is running.',
    severity: 'WARNING',
    suggestion: 'Add GET /health that returns 200 { status: "ok" } for load balancer health checks.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const hasHealth = files.some(
        (f) =>
          /\.(ts|js)$/.test(f.path) &&
          /\/health[z]?\b|\/ready\b|\/ping\b/.test(f.content)
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
          suggestion: 'Add: app.get("/health", (req, res) => res.json({ status: "ok" }))',
          category: 'DEPLOYMENT',
        },
      ]
    },
  },

  {
    id: 'DEPLOY_004',
    category: 'DEPLOYMENT',
    title: 'Dev dependencies in production dependencies',
    description: 'Testing/development tools listed in dependencies instead of devDependencies.',
    severity: 'WARNING',
    suggestion: 'Move dev-only packages to devDependencies to reduce production bundle size.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const packageJson = files.find((f) => /package\.json$/.test(f.path))
      if (!packageJson) return []

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

      if (wrongPlace.length === 0) return []

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
    },
  },

  {
    id: 'DEPLOY_005',
    category: 'DEPLOYMENT',
    title: 'Hardcoded localhost in source files',
    description: 'localhost or 127.0.0.1 hardcoded in non-config source files.',
    severity: 'WARNING',
    suggestion: 'Use environment variables for all URLs: process.env.API_URL',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) =>
          /\.(ts|js|tsx|jsx)$/.test(f.path) &&
          !/next\.config|vite\.config|\.test\.|\.spec\./.test(f.path) &&
          f.category !== 'config'
      )

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/['"`]https?:\/\/(localhost|127\.0\.0\.1)/.test(line)) {
            matches.push({
              ruleId: 'DEPLOY_005',
              title: 'Hardcoded localhost URL',
              description: 'localhost URL hardcoded — will break in staging/production environments.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Replace with process.env.API_URL or similar environment variable.',
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
    description: 'No GitHub Actions, GitLab CI, or Jenkinsfile found.',
    severity: 'INFO',
    suggestion: 'Add CI/CD pipelines to automate testing and deployment.',
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
    description: 'App starts without validating required environment variables.',
    severity: 'WARNING',
    suggestion: 'Use zod or envalid to validate required env vars at startup — fail fast on misconfiguration.',
    codeExample: `import { z } from 'zod'\nconst env = z.object({\n  DATABASE_URL: z.string().url(),\n  NEXTAUTH_SECRET: z.string().min(32),\n}).parse(process.env)`,
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

      const hasValidation = ['zod', 'joi', 'envalid', 'env-var', 't3-env'].some((lib) => lib in deps)
      if (hasValidation) return []

      const usesEnv = files.some((f) => /process\.env\.\w+/.test(f.content))
      if (!usesEnv) return []

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
    },
  },
]
