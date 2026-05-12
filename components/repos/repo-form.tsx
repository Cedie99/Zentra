'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, AlertTriangle, Zap } from 'lucide-react'
import Link from 'next/link'

function parseRepoInput(input: string): string | null {
  const trimmed = input.trim()
  // Full URL: https://github.com/owner/repo
  const urlMatch = trimmed.match(/github\.com\/([^/]+\/[^/]+)/)
  if (urlMatch) return urlMatch[1].replace(/\.git$/, '')
  // owner/repo
  if (/^[^/]+\/[^/]+$/.test(trimmed)) return trimmed
  return null
}

type UsageData = {
  used: number
  limit: number | null
  plan: 'FREE' | 'PRO'
}

export function RepoForm() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => {
    fetch('/api/user/usage')
      .then((r) => r.ok ? r.json() : null)
      .then((data: UsageData | null) => {
        if (data) {
          setUsage(data)
          if (data.limit !== null && data.used >= data.limit) {
            setLimitReached(true)
          }
        }
      })
      .catch(() => {/* ignore — degrade gracefully */})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const repoFullName = parseRepoInput(input)
    if (!repoFullName) {
      setError('Enter a valid GitHub URL or owner/repo format.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName }),
      })
      const data = await res.json()
      if (res.status === 402 || data.error === 'LIMIT_REACHED') {
        setLimitReached(true)
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      router.push(`/reports/${data.repositoryId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Usage indicator */}
      {usage && usage.limit !== null && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usage.used >= usage.limit ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
            />
          </div>
          <span className={usage.used >= usage.limit ? 'text-red-400 font-medium' : ''}>
            {usage.used} / {usage.limit} analyses used this month
          </span>
        </div>
      )}

      {/* Upgrade banner */}
      {limitReached && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-300">Monthly limit reached</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {usage?.plan === 'FREE' ? (
                <>
                  You&apos;ve used all {usage.limit} free analyses this month.{' '}
                  <Link href="/pricing" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
                    Upgrade to Pro
                  </Link>{' '}
                  to get more.
                </>
              ) : (
                <>Your workspace has used all {usage?.limit} shared analyses this month.</>
              )}
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
          >
            <Zap className="w-3 h-3" />
            Upgrade
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-500 text-sm disabled:opacity-50"
            disabled={loading || limitReached}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || limitReached}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-3 rounded-xl transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm px-1">{error}</p>
        )}

        <p className="text-xs text-muted-foreground px-1">
          Works with any public repository. Private repos require a <code>GITHUB_TOKEN</code> with access.
        </p>
      </form>
    </div>
  )
}
