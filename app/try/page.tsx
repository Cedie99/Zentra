import { Navbar } from '@/components/landing/navbar'
import { GuestAnalyzer } from '@/components/guest/guest-analyzer'

export const metadata = {
  title: 'Try Zentra — Free Repository Analysis',
  description: 'Analyze any public GitHub repository for free, no account required.',
}

export default function TryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-3">
            Try it — no account needed
          </h1>
          <p className="text-muted-foreground text-lg">
            Paste any public GitHub repository and get an instant AI-powered architecture report.
            <span className="block text-sm mt-1 text-muted-foreground/70">One free analysis. Sign up to get 3/month.</span>
          </p>
        </div>
        <GuestAnalyzer />
      </main>
    </div>
  )
}
