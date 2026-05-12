import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { InviteLink } from '@/components/team/invite-link'
import { MemberList } from '@/components/team/member-list'
import { Users, UserCheck, Info } from 'lucide-react'

export default async function TeamSettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })

  if (user?.plan !== 'PRO') redirect('/settings')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

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

  const link = activeInvite
    ? `${appUrl}/invite/accept?token=${activeInvite.token}`
    : null

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-2xl space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Team Workspace</h1>
            <p className="text-muted-foreground text-sm mt-1">Invite teammates to view your repos and reports</p>
          </div>

          {/* Invite Link */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">Invite Link</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {members.length} / 3 seats used
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can sign in and join your workspace. New members join as <strong className="text-foreground">Editors</strong> by default.
            </p>
            <InviteLink initialLink={link} />
          </div>

          {/* Role legend */}
          <div className="flex items-start gap-3 px-4 py-3 bg-secondary/50 border border-border rounded-xl">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Editor</span> — can add repositories and run analyses against the shared pool.{' '}
              <span className="text-foreground font-medium">Viewer</span> — can browse repos and reports but cannot add repos or trigger analyses.
            </p>
          </div>

          {/* Active Members */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-400" />
              <h2 className="text-sm font-semibold text-foreground">Active Members</h2>
              <span className="text-xs text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-lg ml-auto">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
            </div>
            <MemberList initialMembers={members} />
          </div>
        </div>
      </main>
    </div>
  )
}
