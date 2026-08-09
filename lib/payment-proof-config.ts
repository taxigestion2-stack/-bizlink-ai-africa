/**
 * Coordonnées officielles de paiement affichées aux commerçants qui
 * souscrivent par preuve de paiement (Mobile Money / virement).
 *
 * ⚠️ À REMPLACER par les vraies coordonnées de BizLink AI Africa avant
 * d'ouvrir ça à de vrais clients — ce sont des valeurs d'exemple.
 */
export const OFFICIAL_MOBILE_MONEY_ACCOUNTS = [
  { operator: 'Vodacom M-Pesa', number: '+243 8XX XXX XXX', name: 'BizLink AI Africa' },
  { operator: 'Airtel Money', number: '+243 9XX XXX XXX', name: 'BizLink AI Africa' },
  { operator: 'Orange Money', number: '+243 8XX XXX XXX', name: 'BizLink AI Africa' },
]

export const OFFICIAL_BANK_ACCOUNT = {
  bankName: 'Nom de la banque',
  accountName: 'BizLink AI Africa SARL',
  accountNumber: 'XXXX XXXX XXXX XXXX',
  swift: 'XXXXXXXX',
}

export function generateReferenceNumber(): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  return `BZ-${random}`
}
