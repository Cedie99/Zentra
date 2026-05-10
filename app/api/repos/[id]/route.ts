import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const repo = await prisma.repository.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!repo) {
    return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
  }

  if (repo.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.repository.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
