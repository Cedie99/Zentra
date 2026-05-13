import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { auth } from '@/auth'
import { getMembership } from '@/lib/team/get-membership'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceUserId } = await getMembership(session.user.id)

  try {
    const reports = await prisma.analysisReport.findMany({
      where: { userId: workspaceUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
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

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
