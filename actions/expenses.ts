'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { expenseSchema, type ExpenseInput } from '@/lib/validations/expense'
import * as expensesService from '@/services/expenses.service'

export type ActionResult = { error: string | null }

export async function createExpenseAction(input: ExpenseInput): Promise<ActionResult> {
  const parsed = expenseSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { organization } = await requireProfile()
  const supabase = await createClient()

  try {
    await expensesService.createExpense(supabase, organization.id, parsed.data)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/expenses')
  redirect('/expenses')
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  const { organization } = await requireProfile()
  const supabase = await createClient()

  try {
    await expensesService.deleteExpense(supabase, organization.id, id)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/expenses')
  return { error: null }
}
