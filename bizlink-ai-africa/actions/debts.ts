'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { debtPaymentSchema, type DebtPaymentInput } from '@/lib/validations/debt'
import * as debtsService from '@/services/debts.service'

export type ActionResult = { error: string | null }

export async function addDebtPaymentAction(debtId: string, input: DebtPaymentInput): Promise<ActionResult> {
  const parsed = debtPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  // requireProfile garantit une session valide ; la RLS garantit que le
  // paiement ne peut être rattaché qu'à une dette de l'organisation courante.
  await requireProfile()
  const supabase = await createClient()

  try {
    await debtsService.addDebtPayment(supabase, debtId, parsed.data)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/debts')
  revalidatePath(`/debts/${debtId}`)
  return { error: null }
}
