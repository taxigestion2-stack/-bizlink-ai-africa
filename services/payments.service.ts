import type { SupabaseClient } from '@supabase/supabase-js'
import { getPaymentProvider } from '@/lib/payments/registry'
import { PLAN_DETAILS, AFFILIATE_COMMISSION_RATE, type PlanKey } from '@/lib/plans'

/**
 * Initie un paiement d'abonnement. Utilise le client service_role car
 * `payment_transactions` n'est pas modifiable par les utilisateurs normaux
 * (voir 002_rls_policies.sql) — l'appartenance à l'organisation doit être
 * vérifiée par l'appelant (Server Action) avant d'invoquer cette fonction.
 */
export async function initiateSubscriptionCheckout(
  serviceClient: SupabaseClient,
  organizationId: string,
  plan: PlanKey,
  providerKey: string,
  urls: { successUrl: string; cancelUrl: string }
) {
  if (plan === 'free') {
    throw new Error('Le plan gratuit ne nécessite pas de paiement.')
  }

  const { data: subscription, error: subError } = await serviceClient
    .from('subscriptions')
    .select('id')
    .eq('organization_id', organizationId)
    .single()

  if (subError || !subscription) throw new Error('Abonnement introuvable pour cette organisation.')

  const amount = PLAN_DETAILS[plan].price

  const { data: transaction, error: txError } = await serviceClient
    .from('payment_transactions')
    .insert({
      organization_id: organizationId,
      subscription_id: subscription.id,
      amount,
      currency: 'USD',
      status: 'pending',
      provider: providerKey,
      metadata: { plan },
    })
    .select()
    .single()

  if (txError || !transaction) throw new Error("Impossible de créer la transaction de paiement.")

  const provider = getPaymentProvider(providerKey)
  const checkout = await provider.createCheckout({
    organizationId,
    subscriptionId: subscription.id,
    amount,
    currency: 'USD',
    plan: plan as 'starter' | 'pro',
    successUrl: urls.successUrl,
    cancelUrl: urls.cancelUrl,
    metadata: { plan, transaction_id: transaction.id },
  })

  await serviceClient
    .from('payment_transactions')
    .update({ provider_transaction_id: checkout.providerTransactionId })
    .eq('id', transaction.id)

  return checkout
}

/**
 * Traite un événement de webhook entrant : met à jour la transaction, active
 * l'abonnement et l'organisation si le paiement est confirmé.
 */
export async function handlePaymentWebhookEvent(
  serviceClient: SupabaseClient,
  providerKey: string,
  rawBody: string,
  headers: Headers
) {
  const provider = getPaymentProvider(providerKey)

  if (!provider.verifyWebhookSignature(rawBody, headers)) {
    throw new Error('Signature de webhook invalide.')
  }

  const event = provider.parseWebhookEvent(rawBody)

  const { data: transaction, error } = await serviceClient
    .from('payment_transactions')
    .select('*, subscription:subscriptions(id, organization_id)')
    .eq('provider_transaction_id', event.providerTransactionId)
    .single()

  if (error || !transaction) {
    throw new Error('Transaction introuvable pour cet événement webhook.')
  }

  const statusMap: Record<typeof event.type, 'paid' | 'failed' | 'refunded'> = {
    'payment.succeeded': 'paid',
    'payment.failed': 'failed',
    'payment.refunded': 'refunded',
  }
  const newStatus = statusMap[event.type]

  await serviceClient.from('payment_transactions').update({ status: newStatus }).eq('id', transaction.id)

  if (newStatus === 'paid') {
    const plan = (transaction.metadata?.plan ?? 'starter') as PlanKey
    const organizationId = transaction.subscription.organization_id
    const periodEnd = new Date()
    periodEnd.setDate(periodEnd.getDate() + 30)

    await serviceClient
      .from('subscriptions')
      .update({
        plan,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      })
      .eq('id', transaction.subscription.id)

    await serviceClient.from('organizations').update({ plan }).eq('id', organizationId)

    await serviceClient.from('notifications').insert({
      organization_id: organizationId,
      type: 'payment',
      title: 'Paiement confirmé',
      message: `Votre abonnement ${PLAN_DETAILS[plan].label} est maintenant actif.`,
      metadata: { transaction_id: transaction.id },
    })

    // Programme de parrainage : le premier paiement confirmé d'une organisation
    // filleule convertit le parrainage et déclenche la récompense du parrain.
    const { data: pendingReferral } = await serviceClient
      .from('referrals')
      .select('id, referrer_organization_id')
      .eq('referred_organization_id', organizationId)
      .eq('status', 'pending')
      .maybeSingle()

    if (pendingReferral) {
      await serviceClient
        .from('referrals')
        .update({ status: 'converted', reward_granted: true })
        .eq('id', pendingReferral.id)

      await serviceClient.from('notifications').insert({
        organization_id: pendingReferral.referrer_organization_id,
        type: 'referral_reward',
        title: 'Récompense de parrainage débloquée',
        message: 'Un de vos filleuls a souscrit à un abonnement payant. Votre récompense est activée.',
        metadata: { referral_id: pendingReferral.id },
      })
    }

    // Programme d'affiliation : commission versée à l'affilié qui a apporté
    // cette organisation, calculée sur chaque paiement confirmé.
    const { data: org } = await serviceClient
      .from('organizations')
      .select('referred_by_affiliate_id')
      .eq('id', organizationId)
      .single()

    if (org?.referred_by_affiliate_id) {
      const commissionAmount = Number((transaction.amount * AFFILIATE_COMMISSION_RATE).toFixed(2))

      await serviceClient.from('affiliate_commissions').insert({
        affiliate_account_id: org.referred_by_affiliate_id,
        source_organization_id: organizationId,
        amount: commissionAmount,
        status: 'pending',
      })

      const { data: account } = await serviceClient
        .from('affiliate_accounts')
        .select('total_earnings, user_id')
        .eq('id', org.referred_by_affiliate_id)
        .single()

      if (account) {
        await serviceClient
          .from('affiliate_accounts')
          .update({ total_earnings: Number(account.total_earnings) + commissionAmount })
          .eq('id', org.referred_by_affiliate_id)

        const { data: affiliateProfile } = await serviceClient
          .from('profiles')
          .select('organization_id')
          .eq('id', account.user_id)
          .single()

        if (affiliateProfile?.organization_id) {
          await serviceClient.from('notifications').insert({
            organization_id: affiliateProfile.organization_id,
            user_id: account.user_id,
            type: 'commission',
            title: 'Nouvelle commission d\'affiliation',
            message: `Vous avez gagné une commission de ${commissionAmount.toFixed(2)}.`,
            metadata: { affiliate_account_id: org.referred_by_affiliate_id },
          })
        }
      }
    }
  }

  return { status: newStatus }
}
