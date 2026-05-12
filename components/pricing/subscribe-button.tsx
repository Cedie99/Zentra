'use client'

import { useState } from 'react'

export function SubscribeButton() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      const { url } = await res.json()
      window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="w-full text-center px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-black font-semibold rounded-xl transition-all duration-200 shadow-md shadow-amber-500/20"
    >
      {loading ? 'Redirecting...' : 'Subscribe — $4/month'}
    </button>
  )
}
