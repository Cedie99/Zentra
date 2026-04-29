'use client'

import { useEffect, useState } from 'react'
import { RepoList } from './repo-list'
import { Loader2, AlertCircle } from 'lucide-react'

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

export default function RepoListFetcher() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/repos')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setRepos(d.repos)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading repositories...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-4 text-red-400">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        {error}
      </div>
    )
  }

  return <RepoList repos={repos} />
}
