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

  {
    id: 'DB_006',
    category: 'DATABASE',
    title: 'No database connection pooling',
    description: 'Your database client creates a new connection for every query instead of reusing connections from a pool. Creating connections is expensive (TCP handshake + auth). Under load, you\'ll exhaust available connections and your app will crash.',
    severity: 'WARNING',
    suggestion: 'Use connection pooling. Prisma handles this automatically. For raw pg: new Pool({ max: 20 }). SQLAlchemy: create_engine(url, pool_size=20). Django: set CONN_MAX_AGE in database settings.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        // JS: new Client() instead of new Pool() for pg
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          if (/new\s+Client\(/.test(line) && /pg|postgres/.test(file.content) && !/Pool/.test(file.content)) {
            matches.push({
              ruleId: 'DB_006',
              title: 'Using pg.Client instead of pg.Pool',
              description: 'pg.Client creates a single connection — use Pool for connection pooling under load.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Replace new Client() with new Pool({ max: 20 }) from pg for connection pooling.',
              category: 'DATABASE',
            })
            if (matches.length >= 3) return matches
          }
          // Python: psycopg2 connect() without pool
          if (/psycopg2\.connect\(/.test(line) && !/pool|Pool/.test(file.content)) {
            matches.push({
              ruleId: 'DB_006',
              title: 'No connection pooling (psycopg2)',
              description: 'psycopg2.connect() creates a single connection — no pooling for concurrent requests.',
              severity: 'WARNING',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Use psycopg2.pool.ThreadedConnectionPool or SQLAlchemy with pool_size for connection pooling.',
              category: 'DATABASE',
            })
            if (matches.length >= 3) return matches
          }
        }
      }
      return matches
    },
  },

  {
    id: 'DB_007',
    category: 'DATABASE',
    title: 'Multiple DB writes without transaction',
    description: 'Your code performs multiple database write operations (create/update/delete) in sequence without wrapping them in a transaction. If the second operation fails, the first is already committed — leaving your database in an inconsistent state.',
    severity: 'WARNING',
    suggestion: 'Wrap related writes in a transaction. Prisma: prisma.$transaction([...]). SQLAlchemy: with session.begin(). Django: with transaction.atomic(). Raw SQL: BEGIN; ...operations...; COMMIT;.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter(
        (f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path) && !/\.(test|spec)\./.test(f.path)
      )

      for (const file of sourceFiles) {
        const isPy = /\.py$/.test(file.path)
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          const isAsyncFn = isPy
            ? /^\s*(async\s+)?def\s+/.test(line)
            : /\basync\s+(function|\()/.test(line) || /=\s*async\s*\(/.test(line)

          if (isAsyncFn) {
            const fnBody = file.lines.slice(i + 1, Math.min(i + 30, file.lines.length)).join('\n')
            const writeOps = isPy
              ? (fnBody.match(/\.add\(|\.delete\(|\.update\(|\.create\(|\.save\(/g) || [])
              : (fnBody.match(/prisma\.\w+\.(create|update|delete|upsert)\(|\.insertOne\(|\.updateOne\(|\.deleteOne\(/g) || [])
            const hasTransaction = isPy
              ? /session\.begin|transaction\.atomic|\.commit\(\)/.test(fnBody)
              : /\$transaction|\btransaction\b|\.startSession/.test(fnBody)

            if (writeOps.length >= 2 && !hasTransaction) {
              matches.push({
                ruleId: 'DB_007',
                title: 'Multiple writes without transaction',
                description: `${writeOps.length} DB write operations in one function without a transaction — data inconsistency risk.`,
                severity: 'WARNING',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: isPy
                  ? 'Wrap in: with session.begin(): or transaction.atomic():'
                  : 'Wrap in: await prisma.$transaction([...]) or prisma.$transaction(async (tx) => {...})',
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
    id: 'DB_008',
    category: 'DATABASE',
    title: 'Dangerous mass delete without where clause',
    description: 'Your code calls deleteMany or a mass delete operation without a where condition. This deletes ALL records in the table — a catastrophic data loss if triggered accidentally or via a bug.',
    severity: 'CRITICAL',
    suggestion: 'Always add a where clause to delete operations. Prisma: deleteMany({ where: { ... } }). SQLAlchemy: session.query(Model).filter(...).delete(). Django: Model.objects.filter(...).delete(). Never delete without conditions.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const matches: RuleMatch[] = []
      const sourceFiles = files.filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f.path) && !/\.(test|spec)\./.test(f.path))

      for (const file of sourceFiles) {
        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]
          // Prisma: deleteMany() or deleteMany({}) with no where
          if (/\.deleteMany\(\s*(\{\s*\})?\s*\)/.test(line)) {
            matches.push({
              ruleId: 'DB_008',
              title: 'deleteMany() without where clause',
              description: 'deleteMany() with no where condition deletes ALL rows in the table.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Add a where clause: deleteMany({ where: { condition } }) to prevent mass data loss.',
              category: 'DATABASE',
            })
            if (matches.length >= 3) return matches
          }
          // Python: Model.objects.all().delete() or session.query(Model).delete()
          if (/\.objects\.all\(\)\.delete\(\)|\.query\(\w+\)\.delete\(\)/.test(line)) {
            matches.push({
              ruleId: 'DB_008',
              title: 'Mass delete without filter',
              description: 'delete() called on unfiltered queryset — deletes ALL rows in the table.',
              severity: 'CRITICAL',
              filePath: file.path,
              lineNumber: i + 1,
              evidence: line.trim().slice(0, 200),
              suggestion: 'Add .filter(...) before .delete() to prevent accidental mass data deletion.',
              category: 'DATABASE',
            })
            if (matches.length >= 3) return matches
          }
          // Raw SQL: DELETE FROM without WHERE
          if (/DELETE\s+FROM\s+\w+\s*[;"'`$]/.test(line) && !/WHERE/i.test(line)) {
            const context = file.lines.slice(i, Math.min(i + 3, file.lines.length)).join('\n')
            if (!/WHERE/i.test(context)) {
              matches.push({
                ruleId: 'DB_008',
                title: 'DELETE FROM without WHERE clause',
                description: 'Raw SQL DELETE without WHERE — deletes all rows in the table.',
                severity: 'CRITICAL',
                filePath: file.path,
                lineNumber: i + 1,
                evidence: line.trim().slice(0, 200),
                suggestion: 'Add a WHERE clause to limit which rows are deleted.',
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
    id: 'DB_009',
    category: 'DATABASE',
    title: 'No soft delete pattern',
    description: 'Your database models use hard deletes (permanently removing records). Once deleted, data is gone forever with no way to recover or audit. Soft deletes (marking records as deleted) allow recovery, audit trails, and prevent cascading data loss.',
    severity: 'INFO',
    suggestion: 'Add a deletedAt (DateTime?) or isDeleted (Boolean) field to models. Prisma: use middleware to filter soft-deleted records. Django: use django-safedelete. SQLAlchemy: add a query filter for active records.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const schemaFile = files.find((f) => /schema\.prisma$/.test(f.path))
      if (!schemaFile) return []

      const modelBlocks = schemaFile.content.split(/^model\s+/m).slice(1)
      const hasSoftDelete = modelBlocks.some((b) => /deletedAt|deleted_at|isDeleted|is_deleted/.test(b))
      if (hasSoftDelete) return []

      const hasDeleteOps = files.some(
        (f) => /\.(ts|js|tsx|jsx)$/.test(f.path) && /\.delete\(|\.deleteMany\(/.test(f.content)
      )
      if (!hasDeleteOps) return []

      return [
        {
          ruleId: 'DB_009',
          title: 'No soft delete pattern',
          description: 'Models use hard deletes with no deletedAt/isDeleted field — deleted data is unrecoverable.',
          severity: 'INFO',
          filePath: schemaFile.path,
          evidence: 'No deletedAt or isDeleted fields found in any model',
          suggestion: 'Add deletedAt DateTime? to models and use Prisma middleware to filter soft-deleted records.',
          category: 'DATABASE',
        },
      ]
    },
  },

  {
    id: 'DB_010',
    category: 'DATABASE',
    title: 'No database migration strategy',
    description: 'Your project uses a database but has no migration files or migration tool configured. Without migrations, schema changes must be applied manually — which is error-prone and impossible to track or roll back.',
    severity: 'WARNING',
    suggestion: 'Use a migration tool. Prisma: npx prisma migrate dev. Django: python manage.py makemigrations. SQLAlchemy: use Alembic. Knex: npx knex migrate:make. Migrations make schema changes reproducible and reversible.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const hasMigrations = files.some(
        (f) =>
          /\/migrations\//.test(f.path) ||
          /\/migrate\//.test(f.path) ||
          /alembic\.ini$/.test(f.path) ||
          /knexfile\.(js|ts)$/.test(f.path)
      )
      if (hasMigrations) return []

      // Check if there is a database at all
      const hasDb = files.some(
        (f) =>
          /schema\.prisma$/.test(f.path) ||
          (/package\.json$/.test(f.path) && /pg|mysql2|mongoose|sqlite3|sequelize|typeorm|drizzle/.test(f.content)) ||
          (/requirements.*\.txt$/.test(f.path) && /psycopg2|pymongo|sqlalchemy|django/.test(f.content))
      )
      if (!hasDb) return []

      // Prisma with schema but no migrations directory
      const hasPrismaSchema = files.some((f) => /schema\.prisma$/.test(f.path))
      if (hasPrismaSchema) {
        return [
          {
            ruleId: 'DB_010',
            title: 'No Prisma migration files',
            description: 'Prisma schema exists but no migration files found — schema changes are not tracked.',
            severity: 'WARNING',
            filePath: 'prisma/migrations',
            evidence: 'schema.prisma present but no prisma/migrations directory',
            suggestion: 'Run: npx prisma migrate dev --name init to create your first migration.',
            category: 'DATABASE',
          },
        ]
      }

      return [
        {
          ruleId: 'DB_010',
          title: 'No database migration strategy',
          description: 'Database is used but no migration files or tool found — schema changes are untracked.',
          severity: 'WARNING',
          filePath: 'package.json',
          evidence: 'Database dependency present but no migrations directory',
          suggestion: 'Add a migration tool (Prisma migrate, Alembic, Knex migrations) to track schema changes.',
          category: 'DATABASE',
        },
      ]
    },
  },

  {
    id: 'DB_011',
    category: 'DATABASE',
    title: 'Sensitive data stored as plain text',
    description: 'Your database schema stores fields like email, phone, SSN, or credit card numbers as plain String/Text types without any indication of encryption. If your database is breached, all sensitive data is immediately readable.',
    severity: 'WARNING',
    suggestion: 'Encrypt sensitive fields at the application level before storing. Node.js: use crypto.createCipheriv(). Python: use cryptography.fernet. For Prisma, use middleware to auto-encrypt/decrypt fields. Consider using a field-level encryption library.',
    detect(files: FetchedFile[]): RuleMatch[] {
      const schemaFile = files.find((f) => /schema\.prisma$/.test(f.path))
      if (!schemaFile) return []

      const sensitiveFields = /\b(ssn|socialSecurity|social_security|creditCard|credit_card|cardNumber|card_number|taxId|tax_id|bankAccount|bank_account)\s+String/i
      const matches: RuleMatch[] = []

      for (let i = 0; i < (schemaFile.lines?.length ?? 0); i++) {
        const line = schemaFile.lines[i]
        if (sensitiveFields.test(line)) {
          matches.push({
            ruleId: 'DB_011',
            title: 'Sensitive field stored as plain text',
            description: 'Highly sensitive field stored as plain String — should be encrypted at rest.',
            severity: 'WARNING',
            filePath: schemaFile.path,
            lineNumber: i + 1,
            evidence: line.trim().slice(0, 200),
            suggestion: 'Encrypt this field before storing using application-level encryption (e.g. AES-256).',
            category: 'DATABASE',
          })
          if (matches.length >= 3) return matches
        }
      }
      return matches
    },
  },
]
