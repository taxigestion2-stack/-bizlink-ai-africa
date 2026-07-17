'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { initiateSubscriptionCheckout } from '@/services/payments.service'
import type { PlanKey } from '@/lib/plans'

export type CheckoutResult = { redirectUrl: string | null; error: string | null }

export async function startSubscriptionCheckoutAction(
  plan: PlanKey,
  providerKey: string
): Promise<CheckoutResult> {
  const { organization, profile } = await requireProfile()

  if (profile.role !== 'admin') {
    return { redirectUrl: null, error: 'Seul un administrateur peut gérer l\'abonnement.' }
  }

  const serviceClient = createServiceRoleClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  try {
    const checkout = await initiateSubscriptionCheckout(serviceClient, organization.id, plan, providerKey, {
      successUrl: `${siteUrl}/subscriptions?status=success`,
      cancelUrl: `${siteUrl}/subscriptions?status=cancelled`,
    })
    return { redirectUrl: checkout.redirectUrl, error: null }
  } catch (e) {
    return { redirectUrl: null, error: (e as Error).message }
  }
}
