'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { purchaseSchema, type PurchaseInput } from '@/lib/validations/purchase'
import * as purchasesService from '@/services/purchases.service'

export type ActionResult = { error: string | null }

export async function createPurchaseAction(input: PurchaseInput): Promise<ActionResult> {
  const parsed = purchaseSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { organization } = await requireProfile()
  const supabase = await createClient()

  try {
    await purchasesService.createPurchase(supabase, organization.id, parsed.data)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/purchases')
  revalidatePath('/products')
  redirect('/purchases')
}
