import type { FetchedFile } from '@/lib/github/file-fetcher'

export type DeploymentTarget =
  | 'vercel'
  | 'netlify'
  | 'cloudflare'
  | 'railway'
  | 'fly'
  | 'render'
  | 'heroku'
  | 'docker'
  | 'kubernetes'
  | 'unknown'

export type ProjectScale = 'personal' | 'startup' | 'production'

export type ProjectType = 'fullstack' | 'api-only' | 'web-app' | 'library' | 'cli'

export interface RepoContext {
  deploymentTarget: DeploymentTarget
  /** True for platforms that manage infra (Vercel, Netlify, Cloudflare Workers) */
  isServerless: boolean
  projectType: ProjectType
  scale: ProjectScale
  hasDatabase: boolean
  hasApiRoutes: boolean
  /** First 2000 chars of README, used for AI context */
  readme: string
}

export function detectRepoContext(files: FetchedFile[]): RepoContext {
  const paths = files.map((f) => f.path)

  // ── Deployment target ──────────────────────────────────────────────────────

  let deploymentTarget: DeploymentTarget = 'unknown'

  if (paths.some((p) => /vercel\.json$/.test(p) || /\.vercel\//.test(p))) {
    deploymentTarget = 'vercel'
  } else if (paths.some((p) => /netlify\.toml$|\.netlify\//.test(p))) {
    deploymentTarget = 'netlify'
  } else if (paths.some((p) => /wrangler\.(toml|json|jsonc)$/.test(p))) {
    deploymentTarget = 'cloudflare'
  } else if (paths.some((p) => /railway\.(json|toml)$/.test(p))) {
    deploymentTarget = 'railway'
  } else if (paths.some((p) => /fly\.toml$/.test(p))) {
    deploymentTarget = 'fly'
  } else if (paths.some((p) => /render\.ya?ml$/.test(p))) {
    deploymentTarget = 'render'
  } else if (paths.some((p) => /Procfile$/.test(p))) {
    deploymentTarget = 'heroku'
  } else if (paths.some((p) => /\.k8s\/|\/k8s\/|\/kubernetes\/|\/helm\//.test(p))) {
    deploymentTarget = 'kubernetes'
  } else if (paths.some((p) => /Dockerfile$|docker-compose\.ya?ml$/.test(p))) {
    deploymentTarget = 'docker'
  }

  // Fallback: check package.json scripts for vercel CLI
  if (deploymentTarget === 'unknown') {
    const pkgJson = files.find((f) => /package\.json$/.test(f.path))
    if (pkgJson) {
      try {
        const parsed = JSON.parse(pkgJson.content)
        const scripts = JSON.stringify(parsed.scripts ?? {})
        if (/vercel/.test(scripts)) deploymentTarget = 'vercel'
      } catch { /* ignore */ }
    }
  }

  // Next.js apps without explicit config are most likely deployed on Vercel
  if (deploymentTarget === 'unknown') {
    const hasNextConfig = paths.some((p) => /next\.config\.(js|ts|mjs)$/.test(p))
    if (hasNextConfig) deploymentTarget = 'vercel'
  }

  const isServerless = ['vercel', 'netlify', 'cloudflare'].includes(deploymentTarget)

  // ── Database presence ──────────────────────────────────────────────────────

  const hasDatabase = files.some((f) => {
    if (/schema\.prisma$/.test(f.path)) return true
    if (/package\.json$/.test(f.path)) {
      try {
        const p = JSON.parse(f.content)
        const deps = { ...p.dependencies, ...p.devDependencies }
        return ['pg', 'mysql2', 'mongoose', 'mongodb', 'sqlite3', 'better-sqlite3', '@prisma/client', 'drizzle-orm', 'typeorm', 'sequelize'].some((d) => d in deps)
      } catch { return false }
    }
    if (/requirements.*\.txt$/.test(f.path)) {
      return /(psycopg2|pymongo|mysql-connector|sqlalchemy|tortoise-orm)/.test(f.content)
    }
    return false
  })

  // ── API routes ─────────────────────────────────────────────────────────────

  const hasApiRoutes = files.some((f) =>
    /\/(api|routes|controllers|views|routers)\//.test(f.path) ||
    /app\/api\//.test(f.path) ||
    /pages\/api\//.test(f.path)
  )

  // ── Project type ───────────────────────────────────────────────────────────

  let projectType: ProjectType = 'web-app'
  const hasFrontend = paths.some((p) => /\.(tsx|jsx|vue|svelte)$/.test(p))
  const hasFrameworkConfig = paths.some((p) => /next\.config|nuxt\.config|svelte\.config|vite\.config/.test(p))
  const hasBinField = files.some((f) => {
    if (!/package\.json$/.test(f.path)) return false
    try { return !!JSON.parse(f.content).bin } catch { return false }
  })

  if (hasBinField) {
    projectType = 'cli'
  } else if (!hasFrontend && hasApiRoutes) {
    projectType = 'api-only'
  } else if ((hasFrontend || hasFrameworkConfig) && hasApiRoutes) {
    projectType = 'fullstack'
  } else if (hasFrontend || hasFrameworkConfig) {
    projectType = 'web-app'
  }

  // ── Project scale ──────────────────────────────────────────────────────────

  let scale: ProjectScale = 'startup'
  const readme = files.find((f) => /^readme\.md$/i.test(f.path.split('/').pop() ?? ''))
  const readmeContent = readme?.content.slice(0, 2000) ?? ''

  if (/personal|portfolio|hobby|side.?project|learning|tutorial|demo/i.test(readmeContent)) {
    scale = 'personal'
  } else if (/enterprise|million users|billion|large.?scale|high.?traffic|k8s|kubernetes/i.test(readmeContent)) {
    scale = 'production'
  }

  return {
    deploymentTarget,
    isServerless,
    projectType,
    scale,
    hasDatabase,
    hasApiRoutes,
    readme: readmeContent,
  }
}
