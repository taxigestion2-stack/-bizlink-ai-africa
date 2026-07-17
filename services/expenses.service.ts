import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExpenseInput } from '@/lib/validations/expense'
import type { Expense } from '@/types/database.types'

export async function listExpenses(
  supabase: SupabaseClient,
  organizationId: string,
  options?: { month?: string } // format 'YYYY-MM'
) {
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('organization_id', organizationId)
    .order('expense_date', { ascending: false })

  if (options?.month) {
    const start = `${options.month}-01`
    const end = new Date(
      new Date(start).getFullYear(),
      new Date(start).getMonth() + 1,
      0
    )
      .toISOString()
      .slice(0, 10)
    query = query.gte('expense_date', start).lte('expense_date', end)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as Expense[]
}

export async function createExpense(
  supabase: SupabaseClient,
  organizationId: string,
  input: ExpenseInput
) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      organization_id: organizationId,
      category: input.category,
      description: input.description || null,
      amount: input.amount,
      expense_date: input.expenseDate,
      receipt_url: input.receiptUrl || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Expense
}

export async function deleteExpense(supabase: SupabaseClient, organizationId: string, id: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('organization_id', organizationId)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getMonthlyExpensesTotal(
  supabase: SupabaseClient,
  organizationId: string,
  month: string
) {
  const expenses = await listExpenses(supabase, organizationId, { month })
  return expenses.reduce((sum, e) => sum + Number(e.amount), 0)
}
