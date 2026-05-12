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
      disabled
      className="w-full text-center px-6 py-3 bg-muted text-muted-foreground font-semibold rounded-xl cursor-not-allowed opacity-70"
    >
      Coming Soon
    </button>
  )
}
