import crypto from 'crypto'
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CreateCheckoutResult,
  PaymentWebhookEvent,
} from '@/lib/payments/provider'

/**
 * Fournisseur PawaPay (Mobile Money — MTN, Orange, Airtel... en Afrique).
 * Contrairement à un fournisseur "hébergé" (Stripe), PawaPay ne redirige pas
 * vers une page de paiement externe : on envoie directement une demande de
 * dépôt à un numéro de téléphone, et le client confirme avec son code PIN
 * Mobile Money reçu sur son téléphone. `createCheckout` retourne donc une URL
 * interne "en attente de confirmation" plutôt qu'une vraie redirection externe.
 *
 * Documentation : https://docs.pawapay.io
 */
export class PawaPayProvider implements PaymentProvider {
  key = 'pawapay'
  displayName = 'Mobile Money (PawaPay)'

  private get apiToken() {
    const token = process.env.PAWAPAY_API_TOKEN
    if (!token) throw new Error('PAWAPAY_API_TOKEN non configurée côté serveur.')
    return token
  }

  private get baseUrl() {
    return process.env.PAWAPAY_BASE_URL ?? 'https://api.sandbox.pawapay.io'
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
    const phoneNumber = params.metadata?.phoneNumber
    const provider = params.metadata?.mobileProvider

    if (!phoneNumber || !provider) {
      throw new Error(
        'Numéro de téléphone et opérateur Mobile Money requis pour payer avec PawaPay.'
      )
    }

    const depositId = crypto.randomUUID()

    const response = await fetch(`${this.baseUrl}/v2/deposits`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        depositId,
        payer: {
          type: 'MMO',
          accountDetails: { phoneNumber, provider },
        },
        amount: String(params.amount),
        currency: params.currency,
        clientReferenceId: params.metadata?.transaction_id ?? depositId,
        customerMessage: `Abonnement ${params.plan}`.slice(0, 22),
        metadata: [{ orderId: params.metadata?.transaction_id ?? depositId }],
      }),
    })

    const data = await response.json()

    if (!response.ok || data.status === 'REJECTED') {
      throw new Error(`PawaPay a refusé la demande de dépôt : ${JSON.stringify(data)}`)
    }

    // Pas de redirection externe : on renvoie vers une page interne qui informe
    // le client de confirmer le paiement sur son téléphone (code PIN Mobile Money).
    const redirectUrl = new URL(params.successUrl)
    redirectUrl.searchParams.set('provider', 'pawapay')
    redirectUrl.searchParams.set('depositId', depositId)

    return {
      redirectUrl: redirectUrl.toString(),
      providerTransactionId: depositId,
    }
  }

  /**
   * Vérification d'intégrité basique via l'en-tête Content-Digest (hash SHA-256
   * du corps de la requête) que PawaPay inclut dans ses callbacks.
   *
   * LIMITE CONNUE : ceci vérifie que le contenu n'a pas été altéré en transit,
   * mais pas l'authenticité complète (signature cryptographique RFC-9421 avec
   * la clé publique PawaPay). Pour une sécurité renforcée en production,
   * activer "Signed callbacks" dans le Dashboard PawaPay et implémenter la
   * vérification de signature complète (voir docs.pawapay.io).
   */
  verifyWebhookSignature(rawBody: string, headers: Headers): boolean {
    const contentDigest = headers.get('content-digest')
    if (!contentDigest) {
      // Callbacks non signés (configuration par défaut) : accepté tel quel.
      // Recommandé : activer les callbacks signés côté PawaPay dès que possible.
      return true
    }

    const expectedHash = crypto.createHash('sha256').update(rawBody).digest('base64')
    return contentDigest.includes(expectedHash)
  }

  parseWebhookEvent(rawBody: string): PaymentWebhookEvent {
    const payload = JSON.parse(rawBody)

    const statusMap: Record<string, PaymentWebhookEvent['type']> = {
      COMPLETED: 'payment.succeeded',
      FAILED: 'payment.failed',
      REJECTED: 'payment.failed',
    }

    return {
      type: statusMap[payload.status] ?? 'payment.failed',
      providerTransactionId: payload.depositId,
      amount: payload.depositedAmount ? Number(payload.depositedAmount) : undefined,
      currency: payload.currency,
      metadata: payload.metadata
        ? Object.fromEntries(
            (Array.isArray(payload.metadata) ? payload.metadata : []).map((m: any) => {
              const [key, value] = Object.entries(m)[0] as [string, string]
              return [key, value]
            })
          )
        : undefined,
    }
  }
}
