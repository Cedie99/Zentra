'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-lg border border-border bg-secondary ${className}`} />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`w-8 h-8 rounded-lg border border-border bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      {isDark
        ? <Sun className="w-4 h-4" strokeWidth={1.5} />
        : <Moon className="w-4 h-4" strokeWidth={1.5} />
      }
    </button>
  )
}
