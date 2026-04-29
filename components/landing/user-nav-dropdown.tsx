'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, LogOut, ChevronDown } from 'lucide-react'

interface Props {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function UserNavDropdown({ name, email, image }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
      >
        {image ? (
          <img src={image} alt={name ?? ''} className="w-7 h-7 rounded-full object-cover border border-border" />
        ) : (
          <div className="w-7 h-7 bg-primary/10 border border-border rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-foreground">{initials}</span>
          </div>
        )}
        <span className="hidden sm:inline text-sm font-medium text-foreground">{name ?? email}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
            Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors border-t border-border"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
