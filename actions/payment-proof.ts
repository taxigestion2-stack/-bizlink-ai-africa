'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { requirePlatformAdmin } from '@/lib/platform-admin'
import {
  submitPaymentProofSchema,
  reviewPaymentProofSchema,
  type SubmitPaymentProofInput,
  type ReviewPaymentProofInput,
} from '@/lib/validations/payment-proof'
import * as paymentProofService from '@/services/payment-proof.service'

export type ActionResult = { error: string | null; referenceNumber?: string }

export async function submitPaymentProofAction(input: SubmitPaymentProofInput): Promise<ActionResult> {
  const parsed = submitPaymentProofSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { organization, profile } = await requireProfile()

  if (profile.role !== 'admin') {
    return { error: "Seul un administrateur peut soumettre un paiement." }
  }

  const supabase = await createClient()

  try {
    const transaction = await paymentProofService.submitPaymentProof(supabase, organization.id, parsed.data)
    revalidatePath('/subscriptions')
    return { error: null, referenceNumber: transaction.reference_number }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function reviewPaymentProofAction(input: ReviewPaymentProofInput): Promise<ActionResult> {
  const parsed = reviewPaymentProofSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { userId } = await requirePlatformAdmin()
  const serviceClient = createServiceRoleClient()

  try {
    await paymentProofService.reviewPaymentProof(serviceClient, parsed.data.transactionId, {
      approve: parsed.data.approve,
      reviewNotes: parsed.data.reviewNotes,
      reviewerId: userId,
    })
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/admin/payments')
  return { error: null }
}
