import { prisma } from '@/lib/db/client'

type MemberRole = 'OWNER' | 'EDITOR' | 'VIEWER'

interface Membership {
  workspaceUserId: string
  role: MemberRole
}

export async function getMembership(userId: string): Promise<Membership> {
  const member = await prisma.teamMember.findFirst({
    where: { memberId: userId },
    select: { ownerId: true, role: true },
  })

  if (!member) return { workspaceUserId: userId, role: 'OWNER' }
  return { workspaceUserId: member.ownerId, role: member.role as 'EDITOR' | 'VIEWER' }
}
