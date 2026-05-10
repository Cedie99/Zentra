import { defineConfig } from '@prisma/config'
import * as fs from 'fs'
import * as path from 'path'

// Manually load .env files since Prisma config runs outside Next.js
function loadEnv() {
  const envFiles = ['.env.local', '.env']
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file)
    if (!fs.existsSync(filePath)) continue
    const content = fs.readFileSync(filePath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  }
}

loadEnv()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  } as any,
})
