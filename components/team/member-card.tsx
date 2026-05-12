'use client'

import { useState } from 'react'
import { UserX, ChevronDown, X, AlertTriangle } from 'lucide-react'

type Role = 'EDITOR' | 'VIEWER'

interface MemberCardProps {
  memberId: string
  name: string | null
  email: string | null
  image: string | null
  role: Role
  joinedAt: Date
  onRemoved: (memberId: string) => void
  onRoleChanged: (memberId: string, role: Role) => void
}

function KickModal({
  name,
  email,
  image,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string | null
  email: string | null
  image: string | null
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const displayName = name ?? email ?? 'this member'
  const initials = (name ?? email ?? '?')[0].toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-base font-semibold text-foreground">Remove member</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member preview */}
        <div className="flex items-center gap-3 px-4 py-3 bg-secondary/50 border border-border rounded-xl">
          {image ? (
            <img src={image} alt={name ?? ''} className="w-8 h-8 rounded-full border border-border object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-secondary border border-border rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-muted-foreground">{initials}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm text-foreground font-medium truncate">{name ?? '—'}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </div>

        {/* Body */}
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{displayName}</span> will immediately lose access to the workspace, all repositories, and reports. This cannot be undone.
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground hover:border-amber-500/30 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded-xl text-sm text-red-400 font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function MemberCard({
  memberId,
  name,
  email,
  image,
  role,
  joinedAt,
  onRemoved,
  onRoleChanged,
}: MemberCardProps) {
  const [currentRole, setCurrentRole] = useState<Role>(role)
  const [kicking, setKicking] = useState(false)
  const [showKickModal, setShowKickModal] = useState(false)
  const [updatingRole, setUpdatingRole] = useState(false)

  async function handleRoleChange(newRole: Role) {
    if (newRole === currentRole || updatingRole) return
    setUpdatingRole(true)
    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        setCurrentRole(newRole)
        onRoleChanged(memberId, newRole)
      }
    } finally {
      setUpdatingRole(false)
    }
  }

  async function handleKickConfirm() {
    setKicking(true)
    try {
      const res = await fetch(`/api/team/members/${memberId}`, { method: 'DELETE' })
      if (res.ok) {
        setShowKickModal(false)
        onRemoved(memberId)
      }
    } finally {
      setKicking(false)
    }
  }

  const initials = (name ?? email ?? '?')[0].toUpperCase()

  return (
    <>
      {showKickModal && (
        <KickModal
          name={name}
          email={email}
          image={image}
          onConfirm={handleKickConfirm}
          onCancel={() => setShowKickModal(false)}
          loading={kicking}
        />
      )}

      <div className="flex items-center gap-3 py-2">
        {image ? (
          <img src={image} alt={name ?? ''} className="w-8 h-8 rounded-full border border-border object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 bg-secondary border border-border rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-muted-foreground">{initials}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium truncate">{name ?? '—'}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>

        <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">
          Joined {new Date(joinedAt).toLocaleDateString()}
        </span>

        {/* Role selector */}
        <div className="relative flex-shrink-0">
          <select
            value={currentRole}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            disabled={updatingRole}
            className="appearance-none bg-secondary border border-border rounded-lg pl-3 pr-7 py-1.5 text-xs text-foreground cursor-pointer hover:border-amber-500/40 focus:outline-none focus:border-amber-500/60 disabled:opacity-50 transition-colors"
          >
            <option value="EDITOR">Editor</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        </div>

        {/* Kick button */}
        <button
          onClick={() => setShowKickModal(true)}
          title="Remove from workspace"
          className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <UserX className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </>
  )
}
