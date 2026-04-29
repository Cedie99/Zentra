import { Octokit } from 'octokit'

export interface FetchedFile {
  path: string
  content: string
  lines: string[]
  category: string
}

const MAX_FILE_SIZE = 100 * 1024 // 100KB
const MAX_FILES = 50

const SKIP_PATTERNS = [
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.min\.(js|css)$/,
  /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|mp3|pdf|zip|tar|gz)$/i,
  /node_modules\//,
  /\.next\//,
  /dist\//,
  /build\//,
  /\.git\//,
  /coverage\//,
]

function getPriorityScore(path: string): number {
  const lower = path.toLowerCase()
  if (/package\.json$/.test(lower) || /requirements\.txt$/.test(lower) || /go\.mod$/.test(lower)) return 100
  if (/schema\.prisma$/.test(lower) || /\.sql$/.test(lower) || /migrations\//.test(lower)) return 95
  if (/docker-compose\.ya?ml$/.test(lower) || /dockerfile$/i.test(lower)) return 90
  if (/\.env\.example$/.test(lower)) return 88
  if (/next\.config/.test(lower) || /vite\.config/.test(lower)) return 82
  if (/\/(routes|controllers|api)\//.test(lower)) return 75
  if (/(index|main|app)\.(ts|js|tsx|jsx)$/.test(lower)) return 72
  if (/\/(services|repositories)\//.test(lower)) return 65
  if (/\/middleware\//.test(lower)) return 60
  if (/\.(test|spec)\.(ts|js|tsx|jsx)$/.test(lower)) return 15
  if (/\.(ts|tsx|js|jsx|py|go|rb|java|cs)$/.test(lower)) return 40
  return 10
}

function getCategory(path: string): string {
  const lower = path.toLowerCase()
  if (/\/(routes|controllers|api)\//.test(lower)) return 'routes'
  if (/\/services\//.test(lower)) return 'services'
  if (/\/middleware\//.test(lower)) return 'middleware'
  if (/schema\.prisma$/.test(lower) || /\.sql$/.test(lower)) return 'database'
  if (/package\.json$/.test(lower) || /requirements\.txt$/.test(lower)) return 'config'
  if (/dockerfile/i.test(lower) || /docker-compose/.test(lower)) return 'docker'
  if (/\.env/.test(lower)) return 'env'
  if (/\.(test|spec)\./.test(lower)) return 'test'
  return 'source'
}

interface TreeItem {
  path?: string
  type?: string
  size?: number
  sha?: string
  url?: string
}

export async function fetchRepositoryFiles(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<FetchedFile[]> {
  // Get default branch
  const { data: repoData } = await octokit.rest.repos.get({ owner, repo })
  const defaultBranch = repoData.default_branch

  // Get full file tree
  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: defaultBranch,
    recursive: '1',
  })

  const allFiles = (treeData.tree as TreeItem[]).filter(
    (item) =>
      item.type === 'blob' &&
      item.path &&
      !SKIP_PATTERNS.some((p) => p.test(item.path!)) &&
      (item.size ?? 0) <= MAX_FILE_SIZE
  )

  // Sort by priority score
  const sorted = allFiles
    .map((f) => ({ ...f, score: getPriorityScore(f.path!) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FILES)

  // Fetch file contents in batches of 50
  const fetched: FetchedFile[] = []
  const batchSize = 50

  for (let i = 0; i < sorted.length; i += batchSize) {
    const batch = sorted.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: item.path!,
        })
        if ('content' in data && data.encoding === 'base64') {
          const content = Buffer.from(data.content, 'base64').toString('utf-8')
          return {
            path: item.path!,
            content,
            lines: content.split('\n'),
            category: getCategory(item.path!),
          } as FetchedFile
        }
        return null
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        fetched.push(result.value)
      }
    }

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < sorted.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return fetched
}
