import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, Organization } from '@/types/database.types'

/**
 * À utiliser dans les Server Components / Server Actions protégés.
 * Redirige vers /login si aucune session valide.
 */
export async function requireProfile(): Promise<{
  profile: Profile
  organization: Organization
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', (profile as Profile).organization_id as string)
    .single()

  if (orgError || !organization) {
    redirect('/login')
  }

  return { profile: profile as Profile, organization: organization as Organization }
}
