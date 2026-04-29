import Link from 'next/link'
import { GitBranch, LayoutDashboard } from 'lucide-react'

export function NavBar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/repos" className="flex items-center gap-2 text-white font-semibold">
            <GitBranch className="w-5 h-5 text-blue-400" />
            ArchAnalyzer
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Reports
            </Link>
            <Link
              href="/repos"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              Analyze
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
