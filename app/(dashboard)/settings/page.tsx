import { Sidebar } from '@/components/dashboard/sidebar'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { Key, GitFork, Bell, Shield, Globe, CreditCard } from 'lucide-react'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      githubId: true,
      githubToken: true,
      plan: true,
    },
  })

  if (!user) redirect('/login')

  const isGithubConnected = !!(user.githubId && user.githubToken)

  return (
    <div className="min-h-screen bg-background relative">
      <Sidebar />
      <main className="ml-64 p-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:border-amber-500/20 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-500 rounded-full" />
              Profile
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {user.image ? (
                  <img src={user.image} alt={user.name ?? ''} className="w-16 h-16 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-16 h-16 bg-secondary border border-border rounded-full flex items-center justify-center">
                    <span className="text-muted-foreground text-xl font-bold">
                      {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{user.name ?? 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Name</label>
                    <p className="text-foreground">{user.name ?? 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Email</label>
                    <p className="text-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:border-amber-500/20 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-500 rounded-full" />
              Connected Accounts
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <GitFork className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-foreground">GitHub</p>
                    <p className="text-xs text-muted-foreground">
                      {isGithubConnected ? 'Connected for repository access' : 'Not connected'}
                    </p>
                  </div>
                </div>
                {isGithubConnected ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-green-500 font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Not Connected</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:border-amber-500/20 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-500 rounded-full" />
              Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive analysis reports via email</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Coming soon</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-foreground">Language</p>
                    <p className="text-xs text-muted-foreground">Interface language preference</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">English</div>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:border-amber-500/20 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-500 rounded-full" />
              Subscription
            </h2>
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user.plan === 'PRO' ? 'Pro Plan' : 'Free Plan'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.plan === 'PRO' ? 'Unlimited analyses' : '3 analyses per month'}
                  </p>
                </div>
              </div>
              {user.plan === 'PRO' ? (
                <a
                  href="https://app.lemonsqueezy.com/my-orders"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors"
                >
                  Manage Subscription
                </a>
              ) : (
                <a
                  href="/pricing"
                  className="text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors"
                >
                  Upgrade to Pro
                </a>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:border-amber-500/20 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-500 rounded-full" />
              Security
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-foreground">Password</p>
                    <p className="text-xs text-muted-foreground">Change your password</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Coming soon</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Coming soon</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
