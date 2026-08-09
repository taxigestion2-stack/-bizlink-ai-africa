import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listTeamMembers } from '@/services/staff.service'
import { InviteStaffForm } from '@/components/team/invite-staff-form'
import { TeamTable } from '@/components/team/team-table'

export const metadata: Metadata = { title: 'Équipe — BizLink AI Africa' }

export default async function TeamPage() {
  const { organization, profile } = await requireProfile()
  const supabase = await createClient()
  const members = await listTeamMembers(supabase, organization.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Équipe</h1>
        <p className="text-sm text-muted-foreground">
          Gérez les membres qui ont accès à {organization.name}.
        </p>
      </div>

      {profile.role === 'admin' && <InviteStaffForm />}

      <TeamTable members={members as any} currentUserId={profile.id} />
    </div>
  )
}
