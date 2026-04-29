import { SignupForm } from '@/components/auth/signup-form'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md p-8 relative z-10">
        {/* Back to home button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Home</span>
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/zentra-logo.svg" alt="Zentra" className="w-8 h-8" />
            <span className="text-foreground font-semibold text-xl tracking-tight">Zentra</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Sign up to start analyzing your repository architecture</p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
          <SignupForm />
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
