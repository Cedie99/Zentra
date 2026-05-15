import { NextRequest, NextResponse } from 'next/server'
import { createServerOctokit } from '@/lib/github/client'
import { fetchRepositoryFiles } from '@/lib/github/file-fetcher'
import { runAnalysis } from '@/lib/analysis/engine'
import { detectTechStack } from '@/lib/analysis/tech-detector'
import { calculateScore } from '@/lib/analysis/score-calculator'
import { enhanceAnalysisWithAI, applyAIEnhancements } from '@/lib/analysis/ai-enhancer'

const GUEST_COOKIE = 'guest_analysis_used'

export async function POST(req: NextRequest) {
  const alreadyUsed = req.cookies.get(GUEST_COOKIE)?.value === '1'
  if (alreadyUsed) {
    return NextResponse.json({ error: 'GUEST_LIMIT_REACHED' }, { status: 403 })
  }

  const body = await req.json()
  const { repoFullName } = body

  if (!repoFullName || typeof repoFullName !== 'string') {
    return NextResponse.json({ error: 'repoFullName is required' }, { status: 400 })
  }

  const [owner, repo] = repoFullName.trim().split('/')
  if (!owner || !repo) {
    return NextResponse.json({ error: 'Invalid repository name. Use format: owner/repo' }, { status: 400 })
  }

  const octokit = createServerOctokit()

  let repoInfo: { fullName: string; description: string | null; language: string | null }
  try {
    const { data: ghRepo } = await octokit.rest.repos.get({ owner, repo })
    if (ghRepo.private) {
      return NextResponse.json({ error: 'Private repositories are not supported. Only public repositories can be analyzed.' }, { status: 403 })
    }
    repoInfo = { fullName: ghRepo.full_name, description: ghRepo.description ?? null, language: ghRepo.language ?? null }
  } catch {
    return NextResponse.json({ error: 'Repository not found or not accessible' }, { status: 404 })
  }

  try {
    const files = await fetchRepositoryFiles(octokit, owner, repo, 'FREE')
    const techStack = detectTechStack(files)
    const rawSections = runAnalysis(files)

    const { detectRepoContext } = await import('@/lib/analysis/repo-context')
    const repoContext = detectRepoContext(files)
    const aiEnhancement = await enhanceAnalysisWithAI(files, rawSections, techStack, repoContext)
    const sections = applyAIEnhancements(rawSections, aiEnhancement)

    const score = calculateScore(sections)

    // Build sections with synthetic IDs so existing report components work unchanged
    const builtSections = sections.map((s, si) => {
      const sectionId = `guest-section-${si}`
      const allIssues = [
        ...s.issues.map((i, ii) => ({
          id: `guest-issue-${si}-${ii}`,
          sectionId,
          title: i.title,
          description: i.description,
          severity: i.severity as 'CRITICAL' | 'WARNING' | 'INFO',
          filePath: i.filePath ?? null,
          lineNumber: i.lineNumber ?? null,
          evidence: i.evidence ?? null,
          suggestion: i.suggestion,
          codeExample: i.codeExample ?? null,
          isAiAdded: false,
        })),
        ...(aiEnhancement?.additionalIssues ?? [])
          .filter((ai) => ai.category === s.category)
          .map((ai, ai_i) => ({
            id: `guest-ai-issue-${si}-${ai_i}`,
            sectionId,
            title: ai.title,
            description: ai.description,
            severity: ai.severity as 'CRITICAL' | 'WARNING' | 'INFO',
            filePath: ai.filePath ?? null,
            lineNumber: null,
            evidence: null,
            suggestion: ai.suggestion,
            codeExample: null,
            isAiAdded: true,
          })),
      ]
      return {
        id: sectionId,
        category: s.category,
        title: s.title,
        severity: s.severity,
        issueCount: allIssues.length,
        issues: allIssues,
      }
    })

    const result = {
      id: 'guest-report',
      repository: {
        fullName: repoInfo.fullName,
        description: repoInfo.description,
        language: repoInfo.language,
        url: `https://github.com/${repoInfo.fullName}`,
      },
      healthScore: score.total,
      criticalCount: score.criticalCount,
      warningCount: score.warningCount,
      infoCount: score.infoCount,
      filesAnalyzed: files.length,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      techStack,
      aiSummary: aiEnhancement?.repoSummary ?? null,
      productionReadiness: aiEnhancement?.productionReadiness ?? null,
      sections: builtSections,
    }

    const response = NextResponse.json(result)
    response.cookies.set(GUEST_COOKIE, '1', {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    })
    return response
  } catch (err) {
    console.error('Guest analysis failed:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
