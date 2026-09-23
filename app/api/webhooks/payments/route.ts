import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { handlePaymentWebhookEvent } from '@/services/payments.service'

/**
 * Webhook unique pour tous les fournisseurs de paiement.
 *
 * Le fournisseur est identifié via ?provider=<key>.
 * La vérification cryptographique reste entièrement déléguée
 * à l'implémentation du PaymentProvider concerné.
 *
 * Exemple :
 *   https://votredomaine.com/api/webhooks/payments?provider=pawapay
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const providerKey = searchParams.get('provider')

  if (!providerKey) {
    return NextResponse.json(
      { error: 'Paramètre "provider" manquant' },
      { status: 400 }
    )
  }

  const rawBody = await request.text()
  const serviceClient = createServiceRoleClient()

  try {
    const result = await handlePaymentWebhookEvent(
      serviceClient,
      providerKey,
      rawBody,
      request.headers,
      {
        requestUrl: request.url,
        requestMethod: request.method,
      }
    )

    return NextResponse.json({
      received: true,
      status: result.status,
    })
  } catch (e) {
    console.error(
      'Erreur webhook paiement:',
      e instanceof Error ? e.message : e
    )

    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Erreur webhook paiement.',
      },
      { status: 400 }
    )
  }
}
