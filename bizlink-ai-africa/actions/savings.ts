'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { savingsTransactionSchema, type SavingsTransactionInput } from '@/lib/validations/savings'
import * as savingsService from '@/services/savings.service'

export type ActionResult = { error: string | null }

export async function createSavingsTransactionAction(
  input: SavingsTransactionInput
): Promise<ActionResult> {
  const parsed = savingsTransactionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { organization } = await requireProfile()
  const supabase = await createClient()

  try {
    await savingsService.createSavingsTransaction(supabase, organization.id, parsed.data)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/savings')
  return { error: null }
}
