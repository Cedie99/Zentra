'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Globe, Star, GitFork, Loader2 } from 'lucide-react'

interface Repo {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  private: boolean
  html_url: string
  updated_at: string | null
  stargazers_count: number
}

interface RepoListProps {
  repos: Repo[]
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-500',
  Go: 'bg-cyan-400',
  Rust: 'bg-orange-500',
  Ruby: 'bg-red-500',
  Java: 'bg-orange-600',
}

export function RepoList({ repos }: RepoListProps) {
  const router = useRouter()
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleAnalyze(fullName: string) {
    setAnalyzing(fullName)
    setError(null)
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: fullName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      router.push(`/analysis/${data.reportId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setAnalyzing(null)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search repositories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((repo) => (
          <div
            key={repo.id}
            className="flex items-center gap-4 bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {repo.private ? (
                  <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                )}
                <span className="font-medium text-white truncate">{repo.name}</span>
                {repo.language && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${LANGUAGE_COLORS[repo.language] || 'bg-gray-500'}`} />
                    <span className="text-xs text-gray-400">{repo.language}</span>
                  </div>
                )}
              </div>
              {repo.description && (
                <p className="text-sm text-gray-400 mt-1 truncate">{repo.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3 h-3" />
                  {repo.stargazers_count}
                </span>
                {repo.updated_at && (
                  <span className="text-xs text-gray-500">
                    Updated {new Date(repo.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleAnalyze(repo.full_name)}
              disabled={analyzing !== null}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
            >
              {analyzing === repo.full_name ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            No repositories found matching &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  )
}
