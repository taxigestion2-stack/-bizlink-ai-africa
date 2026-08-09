import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { handlePaymentWebhookEvent } from '@/services/payments.service'

/**
 * Webhook unique pour tous les fournisseurs de paiement : le fournisseur
 * est identifié via ?provider=<key>, jamais codé en dur. Chaque fournisseur
 * gère sa propre vérification de signature dans son implémentation
 * PaymentProvider (voir lib/payments/providers/).
 *
 * Exemple d'URL à configurer côté fournisseur :
 *   https://votredomaine.com/api/webhooks/payments?provider=manual
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const providerKey = searchParams.get('provider')

  if (!providerKey) {
    return NextResponse.json({ error: 'Paramètre "provider" manquant' }, { status: 400 })
  }

  const rawBody = await request.text()
  const serviceClient = createServiceRoleClient()

  try {
    const result = await handlePaymentWebhookEvent(serviceClient, providerKey, rawBody, request.headers)
    return NextResponse.json({ received: true, status: result.status })
  } catch (e) {
    console.error('Erreur webhook paiement:', (e as Error).message)
    // On répond 400 (et non 500) pour indiquer au fournisseur de ne pas
    // réessayer indéfiniment un événement malformé/non authentifié.
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
