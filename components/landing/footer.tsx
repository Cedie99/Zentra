import { GitBranch } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border py-32 px-4 bg-background relative">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid md:grid-cols-4 gap-16 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <img src="/zentra-logo.svg" alt="Zentra" className="w-6 h-6" />
              <span className="text-foreground font-semibold text-base tracking-tight">Zentra</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md mb-6">
              Instant production-readiness analysis for your GitHub repositories. 
              Ensure your code meets industry standards before deployment.
            </p>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-5 text-sm tracking-tight">Product</h4>
            <ul className="space-y-4">
              <li>
                <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-5 text-sm tracking-tight">Company</h4>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  About
                </a>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-amber-500/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2026 Zentra. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
