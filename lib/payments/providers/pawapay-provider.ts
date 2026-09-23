import crypto from 'crypto'
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CreateCheckoutResult,
  PaymentWebhookEvent,
  WebhookVerificationContext,
} from '@/lib/payments/provider'

/**
 * Fournisseur PawaPay (Mobile Money — MTN, Orange, Airtel... en Afrique).
 *
 * PawaPay ne redirige pas nécessairement vers une page de paiement externe :
 * un dépôt peut être envoyé directement vers le numéro Mobile Money du client.
 *
 * Documentation :
 * https://docs.pawapay.io
 */
export class PawaPayProvider implements PaymentProvider {
  key = 'pawapay'
  displayName = 'Mobile Money (PawaPay)'

  private get apiToken() {
    const token = process.env.PAWAPAY_API_TOKEN

    if (!token) {
      throw new Error(
        'PAWAPAY_API_TOKEN non configurée côté serveur.'
      )
    }

    return token
  }

  private get baseUrl() {
    return (
      process.env.PAWAPAY_BASE_URL ??
      'https://api.sandbox.pawapay.io'
    )
  }

  async createCheckout(
    params: CreateCheckoutParams
  ): Promise<CreateCheckoutResult> {
    const phoneNumber = params.metadata?.phoneNumber
    const provider = params.metadata?.mobileProvider

    if (!phoneNumber || !provider) {
      throw new Error(
        'Numéro de téléphone et opérateur Mobile Money requis pour payer avec PawaPay.'
      )
    }

    const depositId = crypto.randomUUID()

    const response = await fetch(
      `${this.baseUrl}/v2/deposits`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          depositId,
          payer: {
            type: 'MMO',
            accountDetails: {
              phoneNumber,
              provider,
            },
          },
          amount: String(params.amount),
          currency: params.currency,
          clientReferenceId:
            params.metadata?.transaction_id ?? depositId,
          customerMessage: `Abonnement ${params.plan}`.slice(
            0,
            22
          ),
          metadata: [
            {
              orderId:
                params.metadata?.transaction_id ?? depositId,
            },
          ],
        }),
      }
    )

    const data = await response.json()

    if (!response.ok || data.status === 'REJECTED') {
      throw new Error(
        `PawaPay a refusé la demande de dépôt : ${JSON.stringify(data)}`
      )
    }

    /**
     * PawaPay peut fonctionner sans redirection externe.
     * Cette URL interne permet à BizLink d'afficher l'état
     * du paiement pendant que le client confirme sur son téléphone.
     */
    const redirectUrl = new URL(params.successUrl)

    redirectUrl.searchParams.set('provider', 'pawapay')
    redirectUrl.searchParams.set('depositId', depositId)

    return {
      redirectUrl: redirectUrl.toString(),
      providerTransactionId: depositId,
    }
  }

  /**
   * Vérification préliminaire du webhook PawaPay.
   *
   * Cette méthode respecte le contrat PaymentProvider :
   * - elle est async ;
   * - elle reçoit le contexte de la requête ;
   * - elle retourne Promise<boolean>.
   *
   * IMPORTANT :
   * Cette implémentation est volontairement fail-closed.
   * Elle vérifie la présence des éléments attendus et l'intégrité
   * SHA-256 du corps, mais ne prétend pas encore effectuer la
   * validation cryptographique complète de la signature PawaPay.
   *
   * Tant que la clé publique et le mécanisme exact de vérification
   * des Signed Callbacks PawaPay ne sont pas configurés, le webhook
   * est refusé plutôt que considéré comme authentique.
   */
  async verifyWebhookSignature(
    rawBody: string,
    headers: Headers,
    _context: WebhookVerificationContext
  ): Promise<boolean> {
    const signature = headers.get('signature')
    const signatureInput = headers.get('signature-input')
    const contentDigest = headers.get('content-digest')
    const contentType = headers.get('content-type')

    /**
     * Un callback signé doit fournir les éléments nécessaires
     * à sa vérification.
     */
    if (
      !signature ||
      !signatureInput ||
      !contentDigest ||
      !contentType
    ) {
      return false
    }

    /**
     * Vérification de l'empreinte SHA-256 du corps.
     */
    const expectedDigest = crypto
      .createHash('sha256')
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('base64')

    const digestMatches =
      contentDigest.includes(expectedDigest) ||
      contentDigest.includes(
        `sha-256=:${expectedDigest}:`
      )

    if (!digestMatches) {
      return false
    }

    /**
     * IMPORTANT :
     *
     * La simple présence de Signature + Signature-Input ne
     * constitue pas une preuve cryptographique suffisante.
     *
     * Nous refusons donc le webhook tant que la vérification
     * complète avec la clé publique PawaPay n'est pas implémentée.
     *
     * Cela évite d'accepter accidentellement des webhooks
     * non authentifiés en production.
     */
    return false
  }

  parseWebhookEvent(
    rawBody: string
  ): PaymentWebhookEvent {
    const payload = JSON.parse(rawBody)

    const statusMap: Record<
      string,
      PaymentWebhookEvent['type']
    > = {
      COMPLETED: 'payment.succeeded',
      FAILED: 'payment.failed',
      REJECTED: 'payment.failed',
    }

    return {
      type:
        statusMap[payload.status] ??
        'payment.failed',

      providerTransactionId:
        payload.depositId,

      amount:
        payload.depositedAmount
          ? Number(payload.depositedAmount)
          : undefined,

      currency:
        payload.currency,

      metadata:
        payload.metadata
          ? Object.fromEntries(
              (
                Array.isArray(payload.metadata)
                  ? payload.metadata
                  : []
              ).map(
                (
                  item: Record<string, unknown>
                ) => {
                  const [
                    key,
                    value,
                  ] = Object.entries(
                    item
                  )[0] as [
                    string,
                    string,
                  ]

                  return [
                    key,
                    value,
                  ]
                }
              )
            )
          : undefined,
    }
  }
}
