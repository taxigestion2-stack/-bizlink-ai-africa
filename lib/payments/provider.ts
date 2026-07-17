/**
 * Architecture "Paiement Pro" — contrat générique qu'un fournisseur de
 * paiement doit respecter pour être branché sur BizLink AI Africa, sans
 * jamais coder en dur un fournisseur spécifique dans la logique métier.
 *
 * Pour ajouter un nouveau fournisseur (Mobile Money, Stripe, etc.) :
 *   1. Créer lib/payments/providers/<nom>.ts implémentant PaymentProvider
 *   2. L'enregistrer dans lib/payments/registry.ts
 *   3. Ajouter ses variables d'environnement (clé API, secret webhook...)
 * Aucune autre partie du code n'a besoin de changer.
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

export type WebhookEventType = 'payment.succeeded' | 'payment.failed' | 'payment.refunded'

export interface PaymentWebhookEvent {
  type: WebhookEventType
  providerTransactionId: string
  amount?: number
  currency?: string
  metadata?: Record<string, string>
}

export interface PaymentProvider {
  /** Identifiant unique du fournisseur, stocké dans payment_transactions.provider */
  key: string
  displayName: string

  /** Initie un paiement et retourne l'URL de redirection vers le fournisseur */
  createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult>

  /** Vérifie l'authenticité d'un webhook (signature HMAC, etc.) */
  verifyWebhookSignature(rawBody: string, headers: Headers): boolean

  /** Transforme la charge utile brute du webhook en événement normalisé */
  parseWebhookEvent(rawBody: string): PaymentWebhookEvent
}
