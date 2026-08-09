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

/**
 * Envoie une invitation par e-mail via l'API admin Supabase (nécessite le
 * client service_role — jamais exposé au client). L'organisation et le rôle
 * sont posés en métadonnées ; c'est le trigger SQL `handle_new_user`
 * (007_staff_invites.sql) qui les lit pour rattacher le nouvel utilisateur à
 * l'organisation existante au lieu de lui en créer une nouvelle.
 */
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
