/**
 * Contrat générique des fournisseurs de paiement BizLink AI Africa.
 *
 * Chaque fournisseur implémente ce contrat afin que la logique métier
 * reste indépendante du fournisseur de paiement utilisé.
 */

export interface CreateCheckoutParams {
  organizationId: string
  subscriptionId: string
  amount: number
  currency: string
  plan: 'starter' | 'pro'
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface CreateCheckoutResult {
  redirectUrl: string
  providerTransactionId: string
}

export type WebhookEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'

export interface PaymentWebhookEvent {
  type: WebhookEventType
  providerTransactionId: string
  amount?: number
  currency?: string
  metadata?: Record<string, string>
}

/**
 * Contexte HTTP nécessaire pour vérifier les signatures de webhook
 * qui signent des composants de la requête HTTP.
 *
 * PawaPay Signed Callbacks utilise notamment des composants liés
 * à la méthode HTTP, à l'autorité et au chemin de la requête.
 */
export interface WebhookVerificationContext {
  requestUrl: string
  requestMethod: string
}

export interface PaymentProvider {
  /** Identifiant unique stocké dans payment_transactions.provider. */
  key: string

  /** Nom lisible du fournisseur. */
  displayName: string

  /** Initialise un paiement auprès du fournisseur. */
  createCheckout(
    params: CreateCheckoutParams
  ): Promise<CreateCheckoutResult>

  /**
   * Vérifie l'authenticité et l'intégrité du webhook.
   *
   * Le contexte HTTP complet est fourni afin de permettre aux fournisseurs
   * utilisant une signature HTTP structurée, comme RFC 9421, de vérifier
   * correctement les composants signés de la requête.
   */
  verifyWebhookSignature(
    rawBody: string,
    headers: Headers,
    context: WebhookVerificationContext
  ): Promise<boolean>

  /** Transforme le webhook brut en événement normalisé. */
  parseWebhookEvent(rawBody: string): PaymentWebhookEvent
}
