'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Settings } from 'lucide-react'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { useSession } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
]

const quickActions = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <aside className="w-64 h-screen bg-background border-r border-border flex flex-col fixed left-0 top-0 overflow-y-auto z-20">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <img src="/zentra-logo.svg" alt="Zentra" className="w-8 h-8" />
          <span className="text-foreground font-semibold text-sm tracking-tight">Zentra</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold px-4 mb-2">Main</p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-foreground border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold px-4 mb-2">Quick Actions</p>
        <div className="space-y-1">
          {quickActions.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* User section */}
      <div className="mt-auto p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          {user?.image ? (
            <img src={user.image} alt={user.name ?? ''} className="w-8 h-8 rounded-full object-cover border border-border" />
          ) : (
            <div className="w-8 h-8 bg-primary/5 border border-border rounded-full flex items-center justify-center">
              <span className="text-muted-foreground text-xs font-bold">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium truncate">{user?.name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
          </div>
        </div>
        <div className="px-4 mt-2">
          <SignOutButton />
        </div>
      </div>
    </aside>
  )
}
