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

  const [user, memberCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: workspaceUserId }, select: { plan: true } }),
    prisma.teamMember.count({ where: { ownerId: workspaceUserId } }),
  ])

  const plan = user?.plan ?? 'FREE'
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const used = await prisma.analysisReport.count({
    where: { userId: workspaceUserId, createdAt: { gte: startOfMonth } },
  })

  // Solo PRO users: unlimited. PRO with members: 20/month pool. FREE: 3/month.
  const limit: number | null =
    plan === 'PRO' ? (memberCount > 0 ? 20 : null) : 3

  return NextResponse.json({ used, limit, plan })
}
