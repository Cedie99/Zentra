import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import crypto from 'crypto'

// DELETE — revoke current invite and generate a new one
export async function DELETE() {
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

  // Expire all pending invites
  await prisma.teamInvite.updateMany({
    where: { ownerId: session.user.id, status: 'PENDING' },
    data: { status: 'EXPIRED' },
  })

  // Create a fresh invite
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.teamInvite.create({
    data: { ownerId: session.user.id, token, expiresAt },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return NextResponse.json({ link: `${appUrl}/invite/accept?token=${token}` })
}
