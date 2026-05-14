'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, AlertTriangle, X } from 'lucide-react'

export function DeleteRepoButton({ repoId, repoName }: { repoId: string; repoName?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/repos/${repoId}`, { method: 'DELETE' })
      if (res.ok) {
        setOpen(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        title="Remove repository"
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center border bg-secondary border-border text-muted-foreground hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-400 transition-all duration-150"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">Delete repository?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {repoName ? (
                  <>This will permanently delete <span className="text-foreground font-medium">{repoName}</span> and all its analysis reports.</>
                ) : (
                  'This will permanently delete the repository and all its analysis reports.'
                )}
                {' '}This action cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
