import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const databaseRules: AnalysisRule[] = [
  {
    id: 'DB_001',
    category: 'DATABASE',
    title: 'Potential N+1 query pattern',
    description: 'Database calls detected inside loops — likely causing N+1 query problems.',
    severity: 'CRITICAL',
    suggestion: 'Use batch queries, include/eager loading, or DataLoader to fetch related data in one query.',
    codeExample: `// Bad: N+1\nfor (const user of users) {\n  const posts = await prisma.post.findMany({ where: { userId: user.id } })\n}\n\n// Good: single query\nconst users = await prisma.user.findMany({ include: { posts: true } })`,
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        let inLoop = false
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/\b(for|forEach|\.map\(|\.filter\(|\.reduce\()/.test(line)) inLoop = true
          if (inLoop && /await.+(prisma\.|Model\.|db\.query|\.find\(|\.findOne\(|\.findMany)/.test(line)) {
            matches.push({
              ruleId: 'DB_001',
              title: 'Potential N+1 query pattern',
              description: 'ORM call inside a loop detected — this causes N+1 database queries.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Use include/eager loading or batch queries instead of querying inside loops.',
              codeExample: `// Instead of looping, use:\nawait prisma.model.findMany({ include: { relation: true } })`,
              category: 'DATABASE',
            })
            if (matches.length >= 5) return matches
            inLoop = false
          }
          if (/^}/.test(line.trim())) inLoop = false
        }
      }
      return matches
    },
  },

  {
    id: 'DB_002',
    category: 'DATABASE',
    title: 'Missing pagination on queries',
    description: 'Queries fetch all records without LIMIT/take, risking memory issues on large datasets.',
    severity: 'WARNING',
    suggestion: 'Always paginate with take/skip (Prisma) or LIMIT/OFFSET (SQL).',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/\.findMany\(\s*\{/.test(line) || /\.findMany\(\s*$/.test(line) || /SELECT \*/.test(line)) {
            // Check nearby lines for take/limit
            const context = file.lines.slice(i, Math.min(i + 8, file.lines.length)).join('\n')
            if (!/take:|limit:|LIMIT|skip:|offset:/.test(context)) {
              matches.push({
                ruleId: 'DB_002',
                title: 'Missing pagination on query',
                description: 'findMany() or SELECT * used without pagination (take/limit).',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Add take: pageSize, skip: page * pageSize to prevent fetching unlimited rows.',
                category: 'DATABASE',
              })
              if (matches.length >= 5) return matches
            }
          }
        }
      }
      return matches
    },
  },

  {
    id: 'DB_003',
    category: 'DATABASE',
    title: 'Missing database index',
    description: 'Foreign key or commonly queried fields lack index hints in schema.',
    severity: 'WARNING',
    suggestion: 'Add @@index([fieldName]) in Prisma schema for frequently queried fields.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const schemaFile = files.find((f) => /schema\.prisma$/.test(f.path))
      if (!schemaFile) return []

      const matches: RuleMatch[] = []
      const modelBlocks = schemaFile.content.split(/^model\s+/m).slice(1)

      for (const block of modelBlocks) {
        const hasRelation = /\@relation/.test(block)
        const hasIndex = /@@index/.test(block)
        if (hasRelation && !hasIndex) {
          const modelName = block.split(/\s+/)[0]
          matches.push({
            ruleId: 'DB_003',
            title: `Missing index in model ${modelName}`,
            description: `Model ${modelName} has relations but no @@index defined.`,
            severity: 'WARNING',
            filePath: schemaFile.path,
            evidence: `model ${modelName} — has @relation but no @@index`,
            suggestion: 'Add @@index([foreignKeyField]) to improve join and filter performance.',
            codeExample: `model Post {\n  userId String\n  user   User   @relation(...)\n  @@index([userId])  // add this\n}`,
            category: 'DATABASE',
          })
        }
      }
      return matches.slice(0, 5)
    },
  },

  {
    id: 'DB_004',
    category: 'DATABASE',
    title: 'Fetching all fields on large model',
    description: 'findMany() used without select: on a model with many fields.',
    severity: 'INFO',
    suggestion: 'Use select: { field1: true, field2: true } to fetch only needed columns.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const schemaFile = files.find((f) => /schema\.prisma$/.test(f.path))
      if (!schemaFile) return []

      const largeModels: string[] = []
      const modelBlocks = schemaFile.content.split(/^model\s+/m).slice(1)
      for (const block of modelBlocks) {
        const name = block.split(/\s+/)[0]
        const fieldCount = (block.match(/^\s+\w+\s+\w+/gm) || []).length
        if (fieldCount > 10) largeModels.push(name.toLowerCase())
      }

      if (largeModels.length === 0) return []

      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/\.findMany\(\s*\{/.test(line)) {
            const context = file.lines.slice(i, Math.min(i + 6, file.lines.length)).join('\n')
            const hasSelect = /select:/.test(context)
            const mentionsLargeModel = largeModels.some((m) => file.path.toLowerCase().includes(m) || line.toLowerCase().includes(m))
            if (!hasSelect && mentionsLargeModel) {
              matches.push({
                ruleId: 'DB_004',
                title: 'Fetching all fields on large model',
                description: 'findMany() without select: fetches all columns, including large or sensitive fields.',
                severity: 'INFO',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Use select: {} to fetch only the columns your UI actually needs.',
                category: 'DATABASE',
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
    id: 'DB_005',
    category: 'DATABASE',
    title: 'Possible SQL injection via string concatenation',
    description: 'Template literals used directly inside raw SQL query calls.',
    severity: 'CRITICAL',
    suggestion: 'Use parameterized queries or Prisma\'s $queryRaw with Prisma.sql template tag.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx)$/.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/\$queryRawUnsafe|query\(`[^`]*\$\{|execute\(`[^`]*\$\{/.test(line)) {
            matches.push({
              ruleId: 'DB_005',
              title: 'Possible SQL injection via string concatenation',
              description: 'Raw SQL query built with template literal interpolation — SQL injection risk.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Use Prisma.sql`...` with $queryRaw or parameterized queries with $1, $2 placeholders.',
              category: 'DATABASE',
            })
            if (matches.length >= 5) return matches
          }
        }
      }
      return matches
    },
  },
]
