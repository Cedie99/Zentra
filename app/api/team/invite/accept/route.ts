import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    return NextResponse.redirect(`${appUrl}/login?redirect=/api/team/invite/accept?token=${token}`)
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
  })

  if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
  }

  if (invite.ownerId === session.user.id) {
    return NextResponse.json({ error: 'Cannot join your own workspace' }, { status: 400 })
  }

  // Check if already a member
  const existing = await prisma.teamMember.findUnique({
    where: { ownerId_memberId: { ownerId: invite.ownerId, memberId: session.user.id } },
  })

  if (!existing) {
    // Enforce seat cap: PRO workspaces allow max 3 members
    const memberCount = await prisma.teamMember.count({
      where: { ownerId: invite.ownerId },
    })
    if (memberCount >= 3) {
      return NextResponse.json(
        { error: 'This workspace has reached its 3-member limit. Ask the owner to upgrade or remove a member.' },
        { status: 403 }
      )
    }

    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          ownerId: invite.ownerId,
          memberId: session.user.id,
          inviteId: invite.id,
        },
      }),
      prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      }),
    ])
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return NextResponse.redirect(`${appUrl}/dashboard?joined=true`)
}
