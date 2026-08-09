import type { SupabaseClient } from '@supabase/supabase-js'
import { PLAN_DETAILS, type PlanKey } from '@/lib/plans'
import { generateReferenceNumber } from '@/lib/payment-proof-config'
import { activateSubscriptionForTransaction } from '@/services/payments.service'

/**
 * Enregistre une soumission de preuve de paiement. La transaction reste
 * "pending" jusqu'à validation manuelle par un admin de la plateforme —
 * voir `reviewPaymentProof`. Utilise le client de l'utilisateur (pas
 * service_role) : la capture d'écran a déjà été téléversée par ce même
 * utilisateur via le bucket Storage RLS-protégé avant cet appel.
 */
export async function submitPaymentProof(
  supabase: SupabaseClient,
  organizationId: string,
  input: {
    plan: PlanKey
    paymentMethod: 'mobile_money' | 'bank_transfer'
    proofTransactionId: string
    screenshotPath: string
    currency: string
  }
) {
  if (input.plan === 'free') {
    throw new Error('Le plan gratuit ne nécessite pas de paiement.')
  }

  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('organization_id', organizationId)
    .single()

  if (subError || !subscription) throw new Error('Abonnement introuvable pour cette organisation.')

  const amount = PLAN_DETAILS[input.plan].price
  const referenceNumber = generateReferenceNumber()

  const { data: transaction, error } = await supabase
    .from('payment_transactions')
    .insert({
      organization_id: organizationId,
      subscription_id: subscription.id,
      amount,
      currency: input.currency,
      status: 'pending',
      provider: 'proof_of_payment',
      payment_method: input.paymentMethod,
      proof_transaction_id: input.proofTransactionId,
      proof_screenshot_path: input.screenshotPath,
      reference_number: referenceNumber,
      metadata: { plan: input.plan },
    })
    .select()
    .single()

  if (error || !transaction) throw new Error("Impossible d'enregistrer la preuve de paiement.")

  return transaction
}

/** Réservé aux admins plateforme (service_role) : liste des preuves à vérifier. */
export async function listPendingPaymentProofs(serviceClient: SupabaseClient) {
  const { data, error } = await serviceClient
    .from('payment_transactions')
    .select('*, organization:organizations(name)')
    .eq('provider', 'proof_of_payment')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

/** Réservé aux admins plateforme : historique complet des preuves déjà traitées. */
export async function listReviewedPaymentProofs(serviceClient: SupabaseClient) {
  const { data, error } = await serviceClient
    .from('payment_transactions')
    .select('*, organization:organizations(name)')
    .eq('provider', 'proof_of_payment')
    .neq('status', 'pending')
    .order('reviewed_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data
}

/** Génère une URL signée temporaire pour afficher une capture privée. */
export async function getProofScreenshotUrl(serviceClient: SupabaseClient, path: string) {
  const { data, error } = await serviceClient.storage
    .from('payment-proofs')
    .createSignedUrl(path, 60 * 10) // valable 10 minutes

  if (error) throw new Error(error.message)
  return data.signedUrl
}

/**
 * Valide ou rejette une preuve de paiement. Si acceptée, active
 * l'abonnement via la même logique que les webhooks automatiques
 * (parrainage, affiliation inclus).
 */
export async function reviewPaymentProof(
  serviceClient: SupabaseClient,
  transactionId: string,
  input: { approve: boolean; reviewNotes?: string; reviewerId: string }
) {
  const { data: transaction, error } = await serviceClient
    .from('payment_transactions')
    .select('*, subscription:subscriptions(id, organization_id)')
    .eq('id', transactionId)
    .eq('provider', 'proof_of_payment')
    .single()

  if (error || !transaction) throw new Error('Preuve de paiement introuvable.')
  if (transaction.status !== 'pending') throw new Error('Cette preuve a déjà été traitée.')

  const newStatus = input.approve ? 'paid' : 'failed'

  await serviceClient
    .from('payment_transactions')
    .update({
      status: newStatus,
      reviewed_by: input.reviewerId,
      review_notes: input.reviewNotes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  if (input.approve) {
    await activateSubscriptionForTransaction(serviceClient, transaction)
  } else {
    await serviceClient.from('notifications').insert({
      organization_id: transaction.subscription.organization_id,
      type: 'payment',
      title: 'Paiement refusé',
      message: input.reviewNotes
        ? `Votre preuve de paiement (réf. ${transaction.reference_number}) a été refusée : ${input.reviewNotes}`
        : `Votre preuve de paiement (réf. ${transaction.reference_number}) a été refusée. Contactez le support.`,
      metadata: { transaction_id: transaction.id },
    })
  }

  return { status: newStatus }
}
