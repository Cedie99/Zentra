import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { getMembership } from '@/lib/team/get-membership'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceUserId } = await getMembership(session.user.id)
  const { id } = await params

  const report = await prisma.analysisReport.findUnique({
    where: { id },
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

  if (report.userId !== workspaceUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ report })
}
