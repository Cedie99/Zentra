'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight } from 'lucide-react'

function parseRepoInput(input: string): string | null {
  const trimmed = input.trim()
  // Full URL: https://github.com/owner/repo
  const urlMatch = trimmed.match(/github\.com\/([^/]+\/[^/]+)/)
  if (urlMatch) return urlMatch[1].replace(/\.git$/, '')
  // owner/repo
  if (/^[^/]+\/[^/]+$/.test(trimmed)) return trimmed
  return null
}

export function RepoForm() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      router.push(`/analysis/${data.reportId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-500 text-sm"
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
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
  )
}
