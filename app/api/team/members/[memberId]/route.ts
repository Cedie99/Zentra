import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'

// DELETE — remove (kick) a member from the workspace
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { memberId } = await params

  const deleted = await prisma.teamMember.deleteMany({
    where: { ownerId: session.user.id, memberId },
  })

  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

// PATCH — update a member's role (EDITOR | VIEWER)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { memberId } = await params
  const body = await req.json()
  const { role } = body

  if (role !== 'EDITOR' && role !== 'VIEWER') {
    return NextResponse.json({ error: 'Invalid role. Must be EDITOR or VIEWER.' }, { status: 400 })
  }

  const updated = await prisma.teamMember.updateMany({
    where: { ownerId: session.user.id, memberId },
    data: { role },
  })

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
