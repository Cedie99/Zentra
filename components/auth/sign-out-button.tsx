'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
    >
      <LogOut className="w-3.5 h-3.5" />
      Sign out
    </button>
  )
}
