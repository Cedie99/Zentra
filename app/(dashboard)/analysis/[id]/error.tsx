'use client'

import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ErrorPage({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-white font-semibold">Something went wrong</p>
        <p className="text-gray-400 text-sm">{error.message}</p>
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm">
          Back to reports
        </Link>
      </div>
    </div>
  )
}
