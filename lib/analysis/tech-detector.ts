import type { FetchedFile } from '@/lib/github/file-fetcher'

export interface TechStack {
  language: string[]
  framework: string[]
  database: string[]
  cache: string[]
  queue: string[]
  auth: string[]
  orm: string[]
  testing: string[]
}

const DEP_MAP: Record<keyof Omit<TechStack, 'language'>, Record<string, string>> = {
  framework: {
    next: 'Next.js',
    express: 'Express',
    fastify: 'Fastify',
    koa: 'Koa',
    hono: 'Hono',
    django: 'Django',
    flask: 'Flask',
    fastapi: 'FastAPI',
    'react-native': 'React Native',
    react: 'React',
    vue: 'Vue',
    svelte: 'Svelte',
    nuxt: 'Nuxt',
    remix: 'Remix',
  },
  database: {
    pg: 'PostgreSQL',
    postgres: 'PostgreSQL',
    mysql2: 'MySQL',
    mysql: 'MySQL',
    mongoose: 'MongoDB',
    mongodb: 'MongoDB',
    sqlite3: 'SQLite',
    'better-sqlite3': 'SQLite',
  },
  cache: {
    redis: 'Redis',
    ioredis: 'Redis',
    'node-cache': 'NodeCache',
    memcached: 'Memcached',
    'cache-manager': 'CacheManager',
    keyv: 'Keyv',
    'lru-cache': 'LRU Cache',
  },
  queue: {
    bull: 'Bull',
    bullmq: 'BullMQ',
    'bee-queue': 'Bee-Queue',
    agenda: 'Agenda',
    rabbitmq: 'RabbitMQ',
    kafka: 'Kafka',
    amqplib: 'RabbitMQ',
  },
  auth: {
    'next-auth': 'NextAuth',
    '@auth/core': 'Auth.js',
    passport: 'Passport',
    'passport-jwt': 'Passport JWT',
    'express-jwt': 'Express JWT',
    jsonwebtoken: 'JWT',
    clerk: 'Clerk',
    auth0: 'Auth0',
    '@supabase/auth-helpers-nextjs': 'Supabase Auth',
    lucia: 'Lucia',
  },
  orm: {
    prisma: 'Prisma',
    '@prisma/client': 'Prisma',
    sequelize: 'Sequelize',
    typeorm: 'TypeORM',
    drizzle: 'Drizzle',
    'drizzle-orm': 'Drizzle',
    knex: 'Knex',
    mikro: 'MikroORM',
  },
  testing: {
    jest: 'Jest',
    vitest: 'Vitest',
    mocha: 'Mocha',
    jasmine: 'Jasmine',
    '@testing-library/react': 'Testing Library',
    cypress: 'Cypress',
    playwright: 'Playwright',
    supertest: 'Supertest',
  },
}

function detectLanguages(files: FetchedFile[]): string[] {
  const langs = new Set<string>()
  const paths = files.map((f) => f.path)

  if (paths.some((p) => /\.(ts|tsx)$/.test(p))) langs.add('TypeScript')
  else if (paths.some((p) => /\.(js|jsx|mjs)$/.test(p))) langs.add('JavaScript')
  if (paths.some((p) => /\.py$/.test(p))) langs.add('Python')
  if (paths.some((p) => /\.go$/.test(p))) langs.add('Go')
  if (paths.some((p) => /\.rb$/.test(p))) langs.add('Ruby')
  if (paths.some((p) => /\.(java|kt)$/.test(p))) langs.add('Java/Kotlin')
  if (paths.some((p) => /\.rs$/.test(p))) langs.add('Rust')

  return Array.from(langs)
}

export function detectTechStack(files: FetchedFile[]): TechStack {
  const packageJson = files.find((f) => /package\.json$/.test(f.path))

  let allDeps: Record<string, string> = {}
  if (packageJson) {
    try {
      const parsed = JSON.parse(packageJson.content)
      allDeps = {
        ...parsed.dependencies,
        ...parsed.devDependencies,
        ...parsed.peerDependencies,
      }
    } catch {
      // ignore
    }
  }

  const result: TechStack = {
    language: detectLanguages(files),
    framework: [],
    database: [],
    cache: [],
    queue: [],
    auth: [],
    orm: [],
    testing: [],
  }

  const categories = Object.keys(DEP_MAP) as Array<keyof typeof DEP_MAP>
  for (const category of categories) {
    const matched = new Set<string>()
    for (const [dep, label] of Object.entries(DEP_MAP[category])) {
      if (dep in allDeps) {
        matched.add(label)
      }
    }
    result[category] = Array.from(matched)
  }

  return result
}
