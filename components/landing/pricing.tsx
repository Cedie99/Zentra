'use client'

import { Check, Zap } from 'lucide-react'
import { SubscribeButton } from '@/components/pricing/subscribe-button'

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

export function Pricing() {

  return (
    <section id="pricing" className="py-32 px-4 bg-background relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Simple Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Start Free, <span className="text-amber-500">Scale Up</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Get full access to every analysis category from day one.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Card */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground mb-1">Free</h3>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-4xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground mb-1">/month</span>
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

          {/* Pro Card */}
          <div className="bg-card border-2 border-amber-500/60 rounded-2xl p-8 flex flex-col relative shadow-lg shadow-amber-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-amber-500 text-black text-xs font-bold rounded-full tracking-wide">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground mb-1">Pro</h3>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-4xl font-bold text-foreground">$4</span>
                <span className="text-muted-foreground mb-1">/month</span>
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
      </div>
    </section>
  )
}
