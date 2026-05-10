'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export function DeleteRepoButton({ repoId }: { repoId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/repos/${repoId}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleDelete()
      }}
      disabled={loading}
      title={confirming ? 'Click again to confirm' : 'Remove repository'}
      className={`
        absolute top-3 right-3
        opacity-0 group-hover:opacity-100
        w-7 h-7 rounded-lg flex items-center justify-center
        border transition-all duration-150
        disabled:cursor-not-allowed
        ${confirming
          ? 'opacity-100 bg-red-500/20 border-red-500/40 text-red-400'
          : 'bg-secondary border-border text-muted-foreground hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-400'
        }
      `}
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <Trash2 className="w-3.5 h-3.5" />
      }
    </button>
  )
}
