import type { AnalysisRule, RuleMatch } from '../engine'
import type { FetchedFile } from '@/lib/github/file-fetcher'

export const databaseRules: AnalysisRule[] = [
  {
    id: 'DB_001',
    category: 'DATABASE',
    title: 'Potential N+1 query pattern',
    description: 'Database queries are being executed inside loops (for, forEach, etc.). This causes the N+1 problem: if you have 100 users, your code makes 1 query to get users + 100 queries to get each user\'s posts = 101 total queries. This will make your app extremely slow as data grows.',
    severity: 'CRITICAL',
    suggestion: 'Use eager loading to fetch related data in one query. Prisma: include: { posts: true }. SQLAlchemy: joinedload() or selectinload(). Django ORM: select_related() / prefetch_related(). This turns 101 queries into just 1.',
    codeExample: `// Bad: N+1
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { userId: user.id } })
}

// Good: single query
const users = await prisma.user.findMany({ include: { posts: true } })`,
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py|go|rb)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        let inLoop = false
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/\b(for|forEach|\.map\(|\.filter\(|\.reduce\()/.test(line)) inLoop = true
          // Python loop detection
          if (/^\s*for\s+\w+\s+in\s+/.test(line)) inLoop = true

          const isDbCallJs = /await.+(prisma\.|Model\.|db\.query|\.find\(|\.findOne\(|\.findMany)/.test(line)
          const isDbCallPy = /\.(query|filter|get|all|execute)\(/.test(line) && /(session\.|db\.|models?\.|cursor\.)/.test(line)

          if (inLoop && (isDbCallJs || isDbCallPy)) {
            matches.push({
              ruleId: 'DB_001',
              title: 'Potential N+1 query pattern',
              description: 'ORM call inside a loop detected — this causes N+1 database queries.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: /\.py$/.test(file.path)
                ? 'Use joinedload()/selectinload() (SQLAlchemy) or select_related()/prefetch_related() (Django) instead of querying in loops.'
                : 'Use include/eager loading or batch queries instead of querying inside loops.',
              codeExample: `// Instead of looping, use:\nawait prisma.model.findMany({ include: { relation: true } })`,
              category: 'DATABASE',
            })
            if (matches.length >= 5) return matches
            inLoop = false
          }
          if (/^[}\]]/.test(line.trim())) inLoop = false
        }
      }
      return matches
    },
  },

  {
    id: 'DB_002',
    category: 'DATABASE',
    title: 'Missing pagination on queries',
    description: 'Your database queries fetch ALL records without any limit. If you have 10,000 users, this loads all 10,000 at once. This will crash your server with out-of-memory errors and make responses extremely slow as your data grows.',
    severity: 'WARNING',
    suggestion: 'Always add pagination. Prisma: take(50), skip(page * 50). SQLAlchemy: .limit(50).offset(page * 50). Django: [offset:offset+50]. Raw SQL: LIMIT 50 OFFSET n.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py|go|rb)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          const isUnpaginatedJs = /\.findMany\(\s*\{/.test(line) || /\.findMany\(\s*$/.test(line) || /SELECT \*/.test(line)
          // Python: session.query(Model).all() or Model.objects.all()
          const isUnpaginatedPy = /\.query\([^)]+\)\s*\.all\(\)/.test(line) || /\.objects\.all\(\)/.test(line)

          if (isUnpaginatedJs || isUnpaginatedPy) {
            const context = file.lines.slice(i, Math.min(i + 8, file.lines.length)).join('\n')
            if (!/take:|limit:|LIMIT|skip:|offset:|\.limit\(|\.offset\(|\[:\d|\[:page/.test(context)) {
              matches.push({
                ruleId: 'DB_002',
                title: 'Missing pagination on query',
                description: 'Query fetches all records without a limit — will fail as data grows.',
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: /\.py$/.test(file.path)
                  ? 'Add .limit(page_size).offset(page * page_size) or slice with [offset:offset+limit].'
                  : 'Add take: pageSize, skip: page * pageSize to prevent fetching unlimited rows.',
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
    description: 'Your database model has relations but no indexes defined. Without indexes, the database must scan through every row to find matching data. This becomes extremely slow as your data grows to thousands of records.',
    severity: 'WARNING',
    suggestion: 'Add indexes on foreign key columns and frequently-filtered fields. Prisma: @@index([foreignKeyField]). SQLAlchemy: Index("ix_name", Model.column). Django: db_index=True on the field.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const schemaFile = files.find((f) => /schema\.prisma$/.test(f.path))
      const matches: RuleMatch[] = []

      if (schemaFile) {
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
      }

      // Python SQLAlchemy: model with ForeignKey but no Index
      const pyModelFiles = files.filter((f) => /\.py$/.test(f.path) && /ForeignKey/.test(f.content))
      for (const file of pyModelFiles) {
        const hasIndex = /Index\(|db_index=True|index=True/.test(file.content)
        if (!hasIndex) {
          matches.push({
            ruleId: 'DB_003',
            title: 'Missing database index on foreign key',
            description: 'SQLAlchemy/Django model has ForeignKey columns but no Index defined.',
            severity: 'WARNING',
            filePath: file.path,
            evidence: 'ForeignKey used without Index()',
            suggestion: 'Add Index("ix_name", Model.column) or db_index=True on ForeignKey fields.',
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
    description: 'Your queries fetch ALL columns from large database tables without selecting specific fields. This wastes bandwidth and memory by loading data you never use. It also slows down queries as the database reads unnecessary data.',
    severity: 'INFO',
    suggestion: 'Select only the fields you need. Prisma: select: { name: true, email: true }. SQLAlchemy: session.query(Model.name, Model.email). Django: .values("name", "email") or .only("name", "email").',
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
    description: 'Raw SQL queries are built using string interpolation with variables. This allows attackers to inject malicious SQL code that can steal, delete, or corrupt your entire database.',
    severity: 'CRITICAL',
    suggestion: 'Use parameterized queries. Prisma: $queryRaw`SELECT * FROM users WHERE id = ${userId}`. Python: cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,)). Go: db.QueryRow("SELECT ... WHERE id = $1", id).',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py|go|rb|java)$/.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          const isJsInjection = /\$queryRawUnsafe|query\(`[^`]*\$\{|execute\(`[^`]*\$\{/.test(line)
          // Python: cursor.execute with f-string or % formatting
          const isPyInjection = /cursor\.execute\(\s*f["']/.test(line) || /cursor\.execute\([^,)]+%\s*[({]/.test(line)
          // Python: raw SQL string concat
          const isPySqlConcat = /["']\s*SELECT.+["']\s*\+/.test(line) || /["']\s*INSERT.+["']\s*\+/.test(line)

          if (isJsInjection || isPyInjection || isPySqlConcat) {
            matches.push({
              ruleId: 'DB_005',
              title: 'Possible SQL injection via string interpolation',
              description: 'Raw SQL query built with string interpolation — SQL injection risk.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: /\.py$/.test(file.path)
                ? 'Use parameterized queries: cursor.execute("SELECT ... WHERE id = %s", (user_id,))'
                : 'Use Prisma.sql`...` with $queryRaw or parameterized queries with $1, $2 placeholders.',
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
