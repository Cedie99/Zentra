import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { SubscribeButton } from '@/components/pricing/subscribe-button'
import { Check, Zap, HelpCircle } from 'lucide-react'

const FREE_FEATURES = [
  '3 analyses per calendar month',
  '150 files analyzed per repository',
  'All 7 analysis categories',
  'AI production verdict',
  'Health score (0–100)',
  'Evidence-based issues with file + line',
  'Tech stack detection',
]

const PRO_FEATURES = [
  'Unlimited analyses',
  '250 files analyzed per repository',
  'All 7 analysis categories',
  'AI production verdict',
  'Health score (0–100)',
  'Evidence-based issues with file + line',
  'Tech stack detection',
  'Export reports as PDF',
  'Export reports as Markdown',
  'Team workspace — invite teammates',
  'Shared repo & report access',
]

const FAQ = [
  {
    q: 'When does my monthly limit reset?',
    a: 'The 3-analysis limit resets on the 1st of each calendar month, midnight UTC.',
  },
  {
    q: 'Does re-running an analysis count?',
    a: 'Yes. Every analysis run — whether a new repo or a re-run — counts toward the monthly total.',
  },
  {
    q: 'What happens if I hit the limit mid-analysis?',
    a: 'The request is blocked before any analysis starts and you see an upgrade prompt. No partial credit is consumed.',
  },
  {
    q: 'When will Pro be available?',
    a: "We're working on it! Click \"Subscribe\" to be notified as soon as payments go live.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-40 pb-24">
        {/* Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Simple Pricing
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4 tracking-tight">
            Start Free, <span className="text-amber-500">Scale Up</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Full access to every analysis category from day one. Upgrade when you need more runs.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-24">
          {/* Free */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">Free</h2>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-5xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground mb-1.5">/month</span>
              </div>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" strokeWidth={2} />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/dashboard"
              className="block text-center px-6 py-3 border border-border rounded-xl text-foreground font-medium hover:border-amber-500/40 hover:bg-secondary transition-all duration-200"
            >
              Get Started Free
            </a>
          </div>

          {/* Pro */}
          <div className="bg-card border-2 border-amber-500/60 rounded-2xl p-8 flex flex-col relative shadow-xl shadow-amber-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-amber-500 text-black text-xs font-bold rounded-full tracking-wide">
                COMING SOON
              </span>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">Pro</h2>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-5xl font-bold text-foreground">$4</span>
                <span className="text-muted-foreground mb-1.5">/month</span>
              </div>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" strokeWidth={2} />
                  {f}
                </li>
              ))}
            </ul>
            <SubscribeButton />
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <HelpCircle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="border-b border-border pb-6 last:border-0 last:pb-0">
                <p className="text-foreground font-medium mb-2">{q}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
