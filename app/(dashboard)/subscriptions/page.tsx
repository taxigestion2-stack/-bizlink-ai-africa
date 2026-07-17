import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { getCurrentSubscription, listPaymentHistory } from '@/services/subscriptions.service'
import { PlanCards } from '@/components/subscriptions/plan-cards'
import { PaymentHistoryTable } from '@/components/subscriptions/payment-history-table'
import type { PlanKey } from '@/lib/plans'

export const metadata: Metadata = { title: 'Abonnement — BizLink AI Africa' }

export default async function SubscriptionsPage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()

  const [subscription, transactions] = await Promise.all([
    getCurrentSubscription(supabase, organization.id),
    listPaymentHistory(supabase, organization.id),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Abonnement</h1>
        <p className="text-sm text-muted-foreground">
          Statut actuel :{' '}
          <span className="font-medium text-foreground">
            {subscription.status === 'active' ? 'Actif' : subscription.status}
          </span>
          {subscription.current_period_end &&
            ` — renouvellement le ${new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}`}
        </p>
      </div>

      <PlanCards currentPlan={organization.plan as PlanKey} />

      <div>
        <h2 className="font-medium mb-3">Historique des paiements</h2>
        <PaymentHistoryTable transactions={transactions as any} />
      </div>
    </div>
  )
}
