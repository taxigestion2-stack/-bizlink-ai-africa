'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { saleSchema, type SaleInput } from '@/lib/validations/sale'
import * as salesService from '@/services/sales.service'

export type ActionResult = { error: string | null }

export async function createSaleAction(input: SaleInput): Promise<ActionResult> {
  const parsed = saleSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { organization } = await requireProfile()
  const supabase = await createClient()

  try {
    await salesService.createSale(supabase, organization.id, parsed.data)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/sales')
  revalidatePath('/products')
  revalidatePath('/debts')
  redirect('/sales')
}
