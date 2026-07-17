import type { SupabaseClient } from '@supabase/supabase-js'

export async function getReferralCode(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function listReferrals(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('referrals')
    .select('*, referred_organization:organizations!referrals_referred_organization_id_fkey(name)')
    .eq('referrer_organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getReferralStats(supabase: SupabaseClient, organizationId: string) {
  const referrals = await listReferrals(supabase, organizationId)
  return {
    totalReferrals: referrals.length,
    converted: referrals.filter((r: any) => r.status === 'converted').length,
    rewarded: referrals.filter((r: any) => r.reward_granted).length,
  }
}
