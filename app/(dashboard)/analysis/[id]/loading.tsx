import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center gap-3 text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin" />
      Loading report...
    </div>
  )
}
