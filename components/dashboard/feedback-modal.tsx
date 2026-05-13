'use client'

import { useState } from 'react'
import { MessageSquarePlus, X } from 'lucide-react'

const categories = [
  { value: 'BUG', label: 'Bug Report', emoji: '🐛' },
  { value: 'FEATURE', label: 'Feature Request', emoji: '✨' },
  { value: 'IMPROVEMENT', label: 'Improvement', emoji: '💡' },
  { value: 'OTHER', label: 'Other', emoji: '💬' },
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
    // Reset after the close animation
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
      setTimeout(handleClose, 1500)
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors w-full"
      >
        <MessageSquarePlus className="w-4 h-4" />
        Feedback
      </button>

      {/* Backdrop + Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Send Feedback</h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {status === 'success' ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <span className="text-green-400 text-2xl">✓</span>
                  </div>
                  <p className="text-foreground font-medium">Thanks for your feedback!</p>
                  <p className="text-sm text-muted-foreground">We appreciate you helping us improve Zentra.</p>
                </div>
              ) : (
                <>
                  {/* Category picker */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                            category === cat.value
                              ? 'border-amber-500/50 bg-amber-500/10 text-foreground'
                              : 'border-border bg-secondary/50 text-muted-foreground hover:border-border hover:text-foreground'
                          }`}
                        >
                          <span>{cat.emoji}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind..."
                      rows={4}
                      maxLength={2000}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 resize-none text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {message.length}/2000
                    </p>
                  </div>

                  {/* Error */}
                  {status === 'error' && errorMsg && (
                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {errorMsg}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {status !== 'success' && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!category || !message.trim() || status === 'loading'}
                  className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
