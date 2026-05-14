'use client'

import { useState } from 'react'
import { MessageSquarePlus, X, Bug, Lightbulb, TrendingUp, MessageCircle, CheckCircle2, Loader2 } from 'lucide-react'

const categories = [
  {
    value: 'BUG',
    label: 'Bug Report',
    description: 'Something is broken',
    icon: Bug,
  },
  {
    value: 'FEATURE',
    label: 'Feature Request',
    description: 'I want something new',
    icon: Lightbulb,
  },
  {
    value: 'IMPROVEMENT',
    label: 'Improvement',
    description: 'Make something better',
    icon: TrendingUp,
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'General feedback',
    icon: MessageCircle,
  },
] as const

export function FeedbackModal() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string>('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const reset = () => {
    setCategory('')
    setMessage('')
    setStatus('idle')
    setErrorMsg('')
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(reset, 200)
  }

  const handleSubmit = async () => {
    if (!category || !message.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message: message.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error ?? 'Something went wrong')
        setStatus('error')
        return
      }

      setStatus('success')
      setTimeout(handleClose, 2000)
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  const canSubmit = category && message.trim() && status !== 'loading'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors w-full"
      >
        <MessageSquarePlus className="w-4 h-4" />
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquarePlus className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground leading-tight">Send Feedback</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Help us improve Zentra</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {status === 'success' ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-green-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold">Thanks for the feedback!</p>
                    <p className="text-sm text-muted-foreground mt-1">We read every submission.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Category picker */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => {
                        const Icon = cat.icon
                        const isSelected = category === cat.value
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setCategory(cat.value)}
                            className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-left transition-all duration-150 ${
                              isSelected
                                ? 'border-amber-500/40 bg-amber-500/8 text-foreground'
                                : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-secondary/70'
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-amber-400' : 'text-muted-foreground'}`}
                              strokeWidth={1.5}
                            />
                            <div>
                              <p className="text-xs font-semibold leading-tight">{cat.label}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{cat.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind…"
                      rows={4}
                      maxLength={2000}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/40 resize-none text-sm leading-relaxed transition-colors"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1.5 text-right tabular-nums">
                      {message.length} / 2000
                    </p>
                  </div>

                  {/* Error */}
                  {status === 'error' && errorMsg && (
                    <div className="text-xs text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
                      {errorMsg}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {status !== 'success' && (
              <div className="px-6 pb-6 flex items-center justify-end gap-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Send Feedback'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
