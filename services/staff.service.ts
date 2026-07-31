import type { SupabaseClient } from '@supabase/supabase-js'

export async function listTeamMembers(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function inviteTeamMember(
  serviceClient: SupabaseClient,
  organizationId: string,
  input: { email: string; fullName: string; role: 'admin' | 'staff' },
  siteUrl: string
) {
  const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(input.email, {
    data: {
      full_name: input.fullName,
      invited_organization_id: organizationId,
      invited_role: input.role,
    },
    redirectTo: `${siteUrl}/accept-invite`,
  })

  if (error) throw new Error(error.message)
  return data
}

export async function updateTeamMemberRole(
  supabase: SupabaseClient,
  profileId: string,
  role: 'admin' | 'staff'
) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', profileId)
  if (error) throw new Error(error.message)
}

export async function toggleTeamMemberActive(
  supabase: SupabaseClient,
  profileId: string,
  isActive: boolean
) {
  const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', profileId)
  if (error) throw new Error(error.message)
}
