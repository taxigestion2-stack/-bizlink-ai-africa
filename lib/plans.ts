export const PLAN_DETAILS = {
  free: {
    label: 'Gratuit',
    price: 0,
    features: ['Données limitées', 'Historique limité (30 jours)', 'Chatbot IA limité (5 messages/jour)'],
  },
  starter: {
    label: 'Starter',
    price: 15,
    features: ['Accès complet aux modules', 'Historique complet', 'Chatbot IA standard'],
  },
  pro: {
    label: 'Pro',
    price: 35,
    features: [
      'Analytics avancés',
      'Export PDF des rapports',
      'IA avancée (analyses approfondies)',
      'Rapports détaillés',
      'Support prioritaire',
    ],
  },
} as const

export type PlanKey = keyof typeof PLAN_DETAILS

/** Pourcentage du montant payé reversé en commission à l'affilié qui a apporté le client */
export const AFFILIATE_COMMISSION_RATE = 0.2
