import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
  const plan = user?.plan ?? 'FREE'

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const used = await prisma.analysisReport.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  })

  const limit = plan === 'PRO' ? null : 3

  return NextResponse.json({ used, limit, plan })
}
