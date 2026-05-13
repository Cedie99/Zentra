import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { getMembership } from '@/lib/team/get-membership'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceUserId } = await getMembership(session.user.id)

  const { searchParams } = new URL(req.url)
  const aId = searchParams.get('a')
  const bId = searchParams.get('b')

  if (!aId || !bId) {
    return NextResponse.json({ error: 'Both report IDs (a and b) are required' }, { status: 400 })
  }

  const [reportA, reportB] = await Promise.all([
    prisma.analysisReport.findUnique({
      where: { id: aId },
      include: {
        repository: { select: { fullName: true, id: true } },
        sections: {
          orderBy: { order: 'asc' },
          include: { issues: { orderBy: [{ severity: 'asc' }] } },
        },
      },
    }),
    prisma.analysisReport.findUnique({
      where: { id: bId },
      include: {
        repository: { select: { fullName: true, id: true } },
        sections: {
          orderBy: { order: 'asc' },
          include: { issues: { orderBy: [{ severity: 'asc' }] } },
        },
      },
    }),
  ])

  if (!reportA || !reportB) {
    return NextResponse.json({ error: 'One or both reports not found' }, { status: 404 })
  }

  // Verify ownership of both reports
  if (reportA.userId !== workspaceUserId || reportB.userId !== workspaceUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Ensure both reports are for the same repository
  if (reportA.repositoryId !== reportB.repositoryId) {
    return NextResponse.json({ error: 'Reports must be for the same repository' }, { status: 400 })
  }

  // Compute diff — treat A as "older" and B as "newer" based on createdAt
  const [older, newer] =
    reportA.createdAt <= reportB.createdAt ? [reportA, reportB] : [reportB, reportA]

  // Build sets of issue titles per category for matching
  type IssueRow = { id: string; title: string; description: string; severity: string; filePath: string | null; suggestion: string; evidence: string | null; isAiAdded: boolean; sectionId: string; lineNumber: number | null; codeExample: string | null }
  type SectionRow = { id: string; category: string; title: string; severity: string; issueCount: number; issues: IssueRow[] }

  function buildIssueMap(sections: SectionRow[]): Map<string, IssueRow & { category: string }> {
    const map = new Map<string, IssueRow & { category: string }>()
    for (const section of sections) {
      for (const issue of section.issues) {
        // Key: category + title (normalised)
        const key = `${section.category}::${issue.title.trim().toLowerCase()}`
        map.set(key, { ...issue, category: section.category })
      }
    }
    return map
  }

  const olderMap = buildIssueMap(older.sections as SectionRow[])
  const newerMap = buildIssueMap(newer.sections as SectionRow[])

  const resolved: Array<IssueRow & { category: string }> = []
  const introduced: Array<IssueRow & { category: string }> = []

  for (const [key, issue] of olderMap) {
    if (!newerMap.has(key)) resolved.push(issue)
  }
  for (const [key, issue] of newerMap) {
    if (!olderMap.has(key)) introduced.push(issue)
  }

  // Per-category summary
  const categories = ['SECURITY', 'DATABASE', 'CACHING', 'ERROR_HANDLING', 'SCALABILITY', 'ARCHITECTURE', 'DEPLOYMENT']
  const categorySummary = categories.map((cat) => {
    const olderSection = (older.sections as SectionRow[]).find((s) => s.category === cat)
    const newerSection = (newer.sections as SectionRow[]).find((s) => s.category === cat)
    return {
      category: cat,
      olderCount: olderSection?.issueCount ?? 0,
      newerCount: newerSection?.issueCount ?? 0,
      delta: (newerSection?.issueCount ?? 0) - (olderSection?.issueCount ?? 0),
    }
  })

  return NextResponse.json({
    older: {
      id: older.id,
      createdAt: older.createdAt,
      healthScore: older.healthScore,
      criticalCount: older.criticalCount,
      warningCount: older.warningCount,
      infoCount: older.infoCount,
      filesAnalyzed: older.filesAnalyzed,
      productionReadiness: older.productionReadiness,
    },
    newer: {
      id: newer.id,
      createdAt: newer.createdAt,
      healthScore: newer.healthScore,
      criticalCount: newer.criticalCount,
      warningCount: newer.warningCount,
      infoCount: newer.infoCount,
      filesAnalyzed: newer.filesAnalyzed,
      productionReadiness: newer.productionReadiness,
    },
    repository: { fullName: older.repository.fullName, id: older.repositoryId },
    diff: {
      healthScoreDelta: (newer.healthScore ?? 0) - (older.healthScore ?? 0),
      criticalDelta: newer.criticalCount - older.criticalCount,
      warningDelta: newer.warningCount - older.warningCount,
      infoDelta: newer.infoCount - older.infoCount,
      resolvedCount: resolved.length,
      introducedCount: introduced.length,
      resolved,
      introduced,
      categorySummary,
    },
  })
}
