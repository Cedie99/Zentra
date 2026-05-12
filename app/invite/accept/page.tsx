'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function AcceptInvite() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid invite link.')
      return
    }

    fetch(`/api/team/invite/accept?token=${token}`)
      .then(async (res) => {
        if (res.redirected) {
          router.replace(new URL(res.url).pathname + new URL(res.url).search)
          return
        }
        if (res.ok) {
          setStatus('success')
          setTimeout(() => router.replace('/dashboard?joined=true'), 1500)
        } else {
          const data = await res.json().catch(() => ({}))
          setStatus('error')
          setMessage(data.error ?? 'This invite is invalid or has expired.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      })
  }, [token, router])

  return (
    <div className="bg-card border border-border rounded-2xl p-10 max-w-sm w-full text-center space-y-4">
      {status === 'loading' && (
        <>
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Accepting invite…</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <span className="text-green-400 text-xl">✓</span>
          </div>
          <p className="text-foreground font-medium">You've joined the workspace!</p>
          <p className="text-sm text-muted-foreground">Redirecting to dashboard…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-red-400 text-xl">✕</span>
          </div>
          <p className="text-foreground font-medium">Invite failed</p>
          <p className="text-sm text-muted-foreground">{message}</p>
          <a href="/dashboard" className="inline-block mt-2 text-sm text-amber-500 hover:text-amber-400 transition-colors">
            Go to Dashboard
          </a>
        </>
      )}
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="bg-card border border-border rounded-2xl p-10 max-w-sm w-full text-center space-y-4">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }>
        <AcceptInvite />
      </Suspense>
    </div>
  )
}
