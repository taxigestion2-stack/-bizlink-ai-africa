import type { SupabaseClient } from '@supabase/supabase-js'
import type { DebtPaymentInput } from '@/lib/validations/debt'

export async function listDebts(
  supabase: SupabaseClient,
  organizationId: string,
  options?: { onlyOpen?: boolean }
) {
  let query = supabase
    .from('debts')
    .select('*, customer:customers(id, name, phone)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (options?.onlyOpen) {
    query = query.in('status', ['open', 'partial'])
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function getDebt(supabase: SupabaseClient, organizationId: string, id: string) {
  const { data, error } = await supabase
    .from('debts')
    .select('*, customer:customers(id, name, phone), payments:debt_payments(*)')
    .eq('organization_id', organizationId)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * L'insertion déclenche le trigger SQL `apply_debt_payment` qui met à jour
 * automatiquement `debts.remaining_amount` et `debts.status`.
 */
export async function addDebtPayment(
  supabase: SupabaseClient,
  debtId: string,
  input: DebtPaymentInput
) {
  const { data, error } = await supabase
    .from('debt_payments')
    .insert({
      debt_id: debtId,
      amount: input.amount,
      payment_date: input.paymentDate,
      notes: input.notes || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getTotalOutstandingDebt(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('debts')
    .select('remaining_amount')
    .eq('organization_id', organizationId)
    .in('status', ['open', 'partial'])

  if (error) throw new Error(error.message)
  return (data ?? []).reduce((sum, d) => sum + Number(d.remaining_amount), 0)
}
