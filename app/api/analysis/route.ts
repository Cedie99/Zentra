import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import { createServerOctokit } from '@/lib/github/client'
import { fetchRepositoryFiles } from '@/lib/github/file-fetcher'
import { runAnalysis } from '@/lib/analysis/engine'
import { detectTechStack } from '@/lib/analysis/tech-detector'
import { calculateScore } from '@/lib/analysis/score-calculator'
import { enhanceAnalysisWithAI, applyAIEnhancements } from '@/lib/analysis/ai-enhancer'
import { auth } from '@/auth'
import { getMembership } from '@/lib/team/get-membership'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role, workspaceUserId } = await getMembership(session.user.id)

  if (role === 'VIEWER') {
    return NextResponse.json({ error: 'Viewers cannot run analyses. Ask the workspace owner to grant you Editor access.' }, { status: 403 })
  }

  // Enforce monthly analysis limit based on the workspace owner's plan
  // FREE: 3/month | PRO solo (no members): unlimited | PRO with members: 20/month shared pool
  const [user, memberCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: workspaceUserId }, select: { plan: true } }),
    prisma.teamMember.count({ where: { ownerId: workspaceUserId } }),
  ])
  const isProSolo = user?.plan === 'PRO' && memberCount === 0
  if (!isProSolo) {
    const monthlyLimit = user?.plan === 'PRO' ? 20 : 3
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyCount = await prisma.analysisReport.count({
      where: { userId: workspaceUserId, createdAt: { gte: startOfMonth } },
    })
    if (monthlyCount >= monthlyLimit) {
      return NextResponse.json({ error: 'LIMIT_REACHED', limit: monthlyLimit }, { status: 402 })
    }
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

  let repoRecord
  try {
    const { data: ghRepo } = await octokit.rest.repos.get({ owner, repo })
    if (ghRepo.private) {
      return NextResponse.json({ error: 'Private repositories are not supported. Only public repositories can be analyzed.' }, { status: 403 })
    }
    repoRecord = await prisma.repository.upsert({
      where: { githubId: ghRepo.id },
      update: { fullName: ghRepo.full_name, name: ghRepo.name, description: ghRepo.description, language: ghRepo.language, isPrivate: ghRepo.private, url: ghRepo.html_url, userId: workspaceUserId },
      create: { githubId: ghRepo.id, fullName: ghRepo.full_name, name: ghRepo.name, description: ghRepo.description, language: ghRepo.language, isPrivate: ghRepo.private, url: ghRepo.html_url, userId: workspaceUserId },
    })
  } catch {
    return NextResponse.json({ error: 'Repository not found or not accessible' }, { status: 404 })
  }

  const report = await prisma.analysisReport.create({
    data: { repositoryId: repoRecord.id, userId: workspaceUserId, status: 'PENDING' },
  })

  try {
    await prisma.analysisReport.update({ where: { id: report.id }, data: { status: 'RUNNING' } })

    const files = await fetchRepositoryFiles(octokit, owner, repo, user?.plan ?? 'FREE')
    const techStack = detectTechStack(files)
    const rawSections = runAnalysis(files)

    // AI enhancement: remove false positives, improve suggestions, find missed issues
    const { detectRepoContext } = await import('@/lib/analysis/repo-context')
    const repoContext = detectRepoContext(files)
    const aiEnhancement = await enhanceAnalysisWithAI(files, rawSections, techStack, repoContext)
    const sections = applyAIEnhancements(rawSections, aiEnhancement)

    const score = calculateScore(sections)

    // Create all sections first
    const sectionIds = await prisma.$transaction(
      sections.map((section) =>
        prisma.reportSection.create({
          data: {
            reportId: report.id,
            category: section.category,
            title: section.title,
            severity: section.severity,
            issueCount: section.issues.length,
            order: section.order,
          },
        })
      )
    )

    // Prepare all issues for bulk insert
    const allIssues: any[] = []
    sections.forEach((section, index) => {
      const sectionId = sectionIds[index].id
      section.issues.forEach((issue) => {
        allIssues.push({
          sectionId,
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          filePath: issue.filePath,
          lineNumber: issue.lineNumber,
          evidence: issue.evidence,
          suggestion: issue.suggestion,
          codeExample: issue.codeExample,
          isAiAdded: false,
        })
      })

      // Inject AI-discovered issues into the matching section
      if (aiEnhancement) {
        const aiIssues = aiEnhancement.additionalIssues.filter(
          (ai) => ai.category === section.category
        )
        for (const ai of aiIssues) {
          allIssues.push({
            sectionId,
            title: ai.title,
            description: ai.description,
            severity: ai.severity,
            filePath: ai.filePath,
            lineNumber: null,
            evidence: null,
            suggestion: ai.suggestion,
            codeExample: null,
            isAiAdded: true,
          })
        }
      }
    })

    // Bulk insert all issues at once
    if (allIssues.length > 0) {
      await prisma.reportIssue.createMany({
        data: allIssues,
      })
    }

    await prisma.analysisReport.update({
      where: { id: report.id },
      data: {
        status: 'COMPLETED',
        healthScore: score.total,
        techStack: techStack as object,
        criticalCount: score.criticalCount,
        warningCount: score.warningCount,
        infoCount: score.infoCount,
        filesAnalyzed: files.length,
        aiSummary: aiEnhancement?.repoSummary ?? null,
        productionReadiness: (aiEnhancement?.productionReadiness as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ reportId: report.id, repositoryId: repoRecord.id })
  } catch (err) {
    console.error('Analysis failed:', err)
    await prisma.analysisReport.update({
      where: { id: report.id },
      data: { status: 'FAILED' },
    })
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
