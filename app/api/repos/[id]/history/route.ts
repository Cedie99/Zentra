import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { getMembership } from '@/lib/team/get-membership'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceUserId } = await getMembership(session.user.id)
  const { id } = await params

  const repo = await prisma.repository.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!repo || repo.userId !== workspaceUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const reports = await prisma.analysisReport.findMany({
    where: { repositoryId: id, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      healthScore: true,
      criticalCount: true,
      warningCount: true,
      infoCount: true,
      filesAnalyzed: true,
      createdAt: true,
    },
  })

  return NextResponse.json(reports)
}
