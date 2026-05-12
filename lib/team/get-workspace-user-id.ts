import { prisma } from '@/lib/db/client'

export async function getWorkspaceUserId(userId: string): Promise<string> {
  const membership = await prisma.teamMember.findFirst({
    where: { memberId: userId },
    select: { ownerId: true },
  })
  return membership?.ownerId ?? userId
}
