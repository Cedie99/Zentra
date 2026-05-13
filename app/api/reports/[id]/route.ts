import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { auth } from '@/auth'
import { getMembership } from '@/lib/team/get-membership'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceUserId } = await getMembership(session.user.id)

  try {
    const { id } = await params
    
    const report = await prisma.analysisReport.findFirst({
      where: {
        repositoryId: id,
        userId: workspaceUserId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        repository: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            issues: {
              orderBy: [{ severity: 'asc' }],
            },
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Failed to fetch report:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}
