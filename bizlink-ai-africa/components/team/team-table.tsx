'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateTeamMemberRoleAction, toggleTeamMemberActiveAction } from '@/actions/staff'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types/database.types'

export function TeamTable({ members, currentUserId }: { members: Profile[]; currentUserId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleRoleChange = (profileId: string, role: 'admin' | 'staff') => {
    startTransition(async () => {
      await updateTeamMemberRoleAction(profileId, role)
      router.refresh()
    })
  }

  const handleToggleActive = (profileId: string, isActive: boolean) => {
    startTransition(async () => {
      await toggleTeamMemberActiveAction(profileId, isActive)
      router.refresh()
    })
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Nom</th>
            <th className="p-3">E-mail</th>
            <th className="p-3">Rôle</th>
            <th className="p-3">Statut</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const isSelf = member.id === currentUserId
            return (
              <tr key={member.id} className="border-t">
                <td className="p-3 font-medium">
                  {member.full_name ?? '—'} {isSelf && <span className="text-xs text-muted-foreground">(vous)</span>}
                </td>
                <td className="p-3 text-muted-foreground">{member.email}</td>
                <td className="p-3">
                  <select
                    className="rounded-md border px-2 py-1 text-sm bg-transparent"
                    value={member.role}
                    disabled={isPending || isSelf}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'staff')}
                  >
                    <option value="staff">Employé</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </td>
                <td className="p-3">
                  <span
                    className={
                      member.is_active
                        ? 'inline-flex rounded-full bg-success/15 px-2 py-0.5 text-xs text-success'
                        : 'inline-flex rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive'
                    }
                  >
                    {member.is_active ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {!isSelf && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleToggleActive(member.id, !member.is_active)}
                    >
                      {member.is_active ? 'Désactiver' : 'Réactiver'}
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
