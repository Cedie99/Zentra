'use client'

import { useState } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'

interface InviteLinkProps {
  initialLink: string | null
}

export function InviteLink({ initialLink }: InviteLinkProps) {
  const [link, setLink] = useState<string | null>(initialLink)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  async function generateLink() {
    setGenerating(true)
    try {
      const res = await fetch('/api/team/invite/generate', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setLink(data.link)
      }
    } finally {
      setGenerating(false)
    }
  }

  async function regenerateLink() {
    setGenerating(true)
    try {
      const res = await fetch('/api/team/invite', { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        setLink(data.link)
      }
    } finally {
      setGenerating(false)
    }
  }

  async function copyLink() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!link) {
    return (
      <button
        onClick={generateLink}
        disabled={generating}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
      >
        {generating ? 'Generating…' : 'Generate Invite Link'}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={link}
          className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground font-mono truncate focus:outline-none"
        />
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border hover:border-amber-500/40 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={regenerateLink}
          disabled={generating}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
          Regenerate Link
        </button>
        <span className="text-xs text-muted-foreground">· Link expires in 30 days · Share it with teammates to grant read access</span>
      </div>
    </div>
  )
}
