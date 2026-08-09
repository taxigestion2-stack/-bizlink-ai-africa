import type { PaymentProvider } from '@/lib/payments/provider'
import { ManualPaymentProvider } from '@/lib/payments/providers/manual-provider'
import { PawaPayProvider } from '@/lib/payments/providers/pawapay-provider'

const providers: Record<string, PaymentProvider> = {
  manual: new ManualPaymentProvider(),
  pawapay: new PawaPayProvider(),
  // mtn_momo: new MtnMomoProvider(),
  // orange_money: new OrangeMoneyProvider(),
  // stripe: new StripeProvider(),
}

export function getPaymentProvider(key: string): PaymentProvider {
  const provider = providers[key]
  if (!provider) {
    throw new Error(`Fournisseur de paiement inconnu : "${key}"`)
  }
  return provider
}

export function listAvailablePaymentProviders(): { key: string; displayName: string }[] {
  return Object.values(providers).map((p) => ({ key: p.key, displayName: p.displayName }))
}
