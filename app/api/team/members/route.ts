import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })

  if (user?.plan !== 'PRO') {
    return NextResponse.json({ error: 'Pro plan required' }, { status: 403 })
  }

  const [members, activeInvite] = await Promise.all([
    prisma.teamMember.findMany({
      where: { ownerId: session.user.id },
      include: { member: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { joinedAt: 'desc' },
    }),
    prisma.teamInvite.findFirst({
      where: { ownerId: session.user.id, status: 'PENDING', expiresAt: { gt: new Date() } },
    }),
  ])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const link = activeInvite
    ? `${appUrl}/api/team/invite/accept?token=${activeInvite.token}`
    : null

  return NextResponse.json({ members, link })
}
