'use client'

import { useState } from 'react'
import { MemberCard } from './member-card'

type Role = 'EDITOR' | 'VIEWER'

interface Member {
  id: string
  memberId: string
  role: Role
  joinedAt: Date
  member: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

interface MemberListProps {
  initialMembers: Member[]
}

export function MemberList({ initialMembers }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers)

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No members yet. Share your invite link to add teammates.</p>
    )
  }

  function handleRemoved(memberId: string) {
    setMembers((prev) => prev.filter((m) => m.member.id !== memberId))
  }

  function handleRoleChanged(memberId: string, role: Role) {
    setMembers((prev) =>
      prev.map((m) => (m.member.id === memberId ? { ...m, role } : m))
    )
  }

  return (
    <div className="divide-y divide-border">
      {members.map((m) => (
        <MemberCard
          key={m.id}
          memberId={m.member.id}
          name={m.member.name}
          email={m.member.email}
          image={m.member.image}
          role={m.role}
          joinedAt={m.joinedAt}
          onRemoved={handleRemoved}
          onRoleChanged={handleRoleChanged}
        />
      ))}
    </div>
  )
}
