import crypto from 'crypto'
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CreateCheckoutResult,
  PaymentWebhookEvent,
} from '@/lib/payments/provider'

/**
 * Fournisseur de référence, à utiliser en développement local et comme
 * modèle pour implémenter un vrai fournisseur (Mobile Money, Stripe...).
 * Ne fait AUCUN appel réseau réel : simule un checkout et signe ses
 * webhooks avec HMAC-SHA256 pour illustrer le pattern attendu.
 */
export class ManualPaymentProvider implements PaymentProvider {
  key = 'manual'
  displayName = 'Paiement manuel (référence)'

  private get secret() {
    return process.env.MANUAL_PAYMENT_WEBHOOK_SECRET ?? 'dev-secret-change-me'
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
    const providerTransactionId = `manual_${crypto.randomUUID()}`

    // Un vrai fournisseur ferait ici un appel API pour créer une session de
    // paiement et retournerait son URL d'hébergement. Ici, on redirige vers
    // une page interne qui simule la confirmation (utile en dev/démo).
    // On utilise l'objet URL pour ajouter les paramètres correctement, que
    // successUrl contienne déjà un "?" ou non (évite les doubles "?").
    const redirectUrl = new URL(params.successUrl)
    redirectUrl.searchParams.set('provider', 'manual')
    redirectUrl.searchParams.set('txn', providerTransactionId)

    return { redirectUrl: redirectUrl.toString(), providerTransactionId }
  }

  verifyWebhookSignature(rawBody: string, headers: Headers): boolean {
    const signature = headers.get('x-signature')
    if (!signature) return false

    const expected = crypto.createHmac('sha256', this.secret).update(rawBody).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  }

  parseWebhookEvent(rawBody: string): PaymentWebhookEvent {
    const payload = JSON.parse(rawBody)
    return {
      type: payload.type,
      providerTransactionId: payload.transaction_id,
      amount: payload.amount,
      currency: payload.currency,
      metadata: payload.metadata,
    }
  }
}
