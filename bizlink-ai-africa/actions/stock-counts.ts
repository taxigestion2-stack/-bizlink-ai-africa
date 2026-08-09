'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { stockCountSchema, type StockCountInput } from '@/lib/validations/stock-count'
import * as stockCountsService from '@/services/stock-counts.service'

export type ActionResult = { error: string | null }

export async function performStockCountAction(input: StockCountInput): Promise<ActionResult> {
  const parsed = stockCountSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { organization } = await requireProfile()
  const supabase = await createClient()

  try {
    await stockCountsService.performStockCount(
      supabase,
      organization.id,
      parsed.data.items.map((i) => ({ productId: i.productId, countedQuantity: i.countedQuantity })),
      parsed.data.notes
    )
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/stock-counts')
  revalidatePath('/products')
  revalidatePath('/reports')
  redirect('/stock-counts')
}
