import type { SupabaseClient } from '@supabase/supabase-js'

export async function listSavingsTransactions(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('savings_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getSavingsBalance(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('savings_transactions')
    .select('type, amount')
    .eq('organization_id', organizationId)

  if (error) throw new Error(error.message)

  return (data ?? []).reduce(
    (balance, t: any) => balance + (t.type === 'deposit' ? Number(t.amount) : -Number(t.amount)),
    0
  )
}

/**
 * Passe par la fonction RPC `create_savings_transaction` (voir 009_savings.sql)
 * qui recalcule le solde côté serveur et refuse un retrait supérieur au
 * solde disponible — jamais de confiance dans un solde calculé côté client.
 */
export async function createSavingsTransaction(
  supabase: SupabaseClient,
  organizationId: string,
  input: { type: 'deposit' | 'withdrawal'; amount: number; notes?: string }
) {
  const { data, error } = await supabase.rpc('create_savings_transaction', {
    p_organization_id: organizationId,
    p_type: input.type,
    p_amount: input.amount,
    p_notes: input.notes || null,
  })

  if (error) throw new Error(error.message)
  return data
}
