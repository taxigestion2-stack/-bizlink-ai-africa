import type { SupabaseClient } from '@supabase/supabase-js'

export async function getCurrentSubscription(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function listPaymentHistory(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}
