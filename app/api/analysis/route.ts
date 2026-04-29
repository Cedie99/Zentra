import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { createServerOctokit } from '@/lib/github/client'
import { fetchRepositoryFiles } from '@/lib/github/file-fetcher'
import { runAnalysis } from '@/lib/analysis/engine'
import { detectTechStack } from '@/lib/analysis/tech-detector'
import { calculateScore } from '@/lib/analysis/score-calculator'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    repoRecord = await prisma.repository.upsert({
      where: { githubId: ghRepo.id },
      update: { fullName: ghRepo.full_name, name: ghRepo.name, description: ghRepo.description, language: ghRepo.language, isPrivate: ghRepo.private, url: ghRepo.html_url, userId: session.user.id },
      create: { githubId: ghRepo.id, fullName: ghRepo.full_name, name: ghRepo.name, description: ghRepo.description, language: ghRepo.language, isPrivate: ghRepo.private, url: ghRepo.html_url, userId: session.user.id },
    })
  } catch {
    return NextResponse.json({ error: 'Repository not found or not accessible' }, { status: 404 })
  }

  const report = await prisma.analysisReport.create({
    data: { repositoryId: repoRecord.id, status: 'PENDING' },
  })

  try {
    await prisma.analysisReport.update({ where: { id: report.id }, data: { status: 'RUNNING' } })

    const files = await fetchRepositoryFiles(octokit, owner, repo)
    const techStack = detectTechStack(files)
    const sections = runAnalysis(files)
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
        })
      })
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
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ reportId: report.id })
  } catch (err) {
    console.error('Analysis failed:', err)
    await prisma.analysisReport.update({
      where: { id: report.id },
      data: { status: 'FAILED' },
    })
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
