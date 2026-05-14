import { SigninForm } from '@/components/auth/signin-form'
import { SignInButton } from '@/components/auth/sign-in-button'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Server } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/6 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md px-6 py-10 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-10 group text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-5">
            <img src="/zentra-logo.svg" alt="Zentra" className="w-7 h-7" />
            <span className="text-foreground font-semibold text-lg tracking-tight">Zentra</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to view your analysis history</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl mb-4">
          <SignInButton />

          {/* Trust copy — right below the GitHub button where eyes go */}
          <div className="mt-4 p-3.5 bg-green-500/5 border border-green-500/15 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-green-400 mb-2">What GitHub access we request</p>
            <div className="flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-mono text-foreground/70">read:user user:email</span> — your public profile and email only. Zero repository access.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Server className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Analysis uses our own server token against the public GitHub API — not your account.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <EyeOff className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your source code is never stored — only the report findings are saved.
              </p>
            </div>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <SigninForm />

          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
