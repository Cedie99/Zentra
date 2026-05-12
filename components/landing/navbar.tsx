import Link from 'next/link'
import { auth } from '@/auth'
import { UserNavDropdown } from '@/components/landing/user-nav-dropdown'

export async function Navbar() {
  const session = await auth()
  const user = session?.user

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/zentra-logo.svg" alt="Zentra" className="w-6 h-6" />
            <span className="text-foreground font-semibold text-base tracking-tight">Zentra</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              How it Works
            </Link>
            <Link href="/#analysis" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Analysis
            </Link>
            <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Features
            </Link>
            <Link href="/#use-cases" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Use Cases
            </Link>
            <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <UserNavDropdown name={user.name} email={user.email} image={user.image} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
