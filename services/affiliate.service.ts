import type { SupabaseClient } from '@supabase/supabase-js'

function generateAffiliateCode(userId: string) {
  return 'AFF' + userId.replace(/-/g, '').slice(0, 8).toUpperCase()
}

export async function getAffiliateAccount(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('affiliate_accounts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/** Inscrit l'utilisateur courant comme affilié (statut "pending" en attente de validation). */
export async function applyAsAffiliate(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('affiliate_accounts')
    .insert({
      user_id: userId,
      affiliate_code: generateAffiliateCode(userId),
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function listCommissions(supabase: SupabaseClient, affiliateAccountId: string) {
  const { data, error } = await supabase
    .from('affiliate_commissions')
    .select('*')
    .eq('affiliate_account_id', affiliateAccountId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function listWithdrawals(supabase: SupabaseClient, affiliateAccountId: string) {
  const { data, error } = await supabase
    .from('affiliate_withdrawals')
    .select('*')
    .eq('affiliate_account_id', affiliateAccountId)
    .order('requested_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function requestWithdrawal(
  supabase: SupabaseClient,
  affiliateAccountId: string,
  amount: number
) {
  const { data: account, error: accountError } = await supabase
    .from('affiliate_accounts')
    .select('total_earnings')
    .eq('id', affiliateAccountId)
    .single()

  if (accountError || !account) throw new Error('Compte affilié introuvable.')

  const { data: paidWithdrawals } = await supabase
    .from('affiliate_withdrawals')
    .select('amount')
    .eq('affiliate_account_id', affiliateAccountId)
    .in('status', ['pending', 'processing', 'paid'])

  const alreadyRequested = (paidWithdrawals ?? []).reduce((sum, w: any) => sum + Number(w.amount), 0)
  const available = Number(account.total_earnings) - alreadyRequested

  if (amount > available) {
    throw new Error(`Montant demandé supérieur au solde disponible (${available.toFixed(2)}).`)
  }

  const { data, error } = await supabase
    .from('affiliate_withdrawals')
    .insert({ affiliate_account_id: affiliateAccountId, amount, status: 'pending' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
