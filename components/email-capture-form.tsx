'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

export function EmailCaptureForm() {
  const [repo, setRepo] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Store repo URL in session storage to use after auth
    if (repo) {
      sessionStorage.setItem('pendingRepo', repo)
    }
    // Redirect to repos page (will trigger auth if needed)
    router.push('/repos')
  }

  return (
    <form className="max-w-md mx-auto w-full" onSubmit={handleSubmit}>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Paste your repo URL"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm transition-colors"
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <span className="hidden sm:inline">Analyze</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}
