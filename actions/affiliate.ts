'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import * as affiliateService from '@/services/affiliate.service'

export type ActionResult = { error: string | null }

export async function applyAsAffiliateAction(): Promise<ActionResult> {
  const { profile } = await requireProfile()
  const supabase = await createClient()

  try {
    await affiliateService.applyAsAffiliate(supabase, profile.id)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/affiliate')
  return { error: null }
}

export async function requestWithdrawalAction(
  affiliateAccountId: string,
  amount: number
): Promise<ActionResult> {
  await requireProfile()
  const supabase = await createClient()

  try {
    await affiliateService.requestWithdrawal(supabase, affiliateAccountId, amount)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/affiliate')
  return { error: null }
}
