import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { getDebt } from '@/services/debts.service'
import { DebtPaymentForm } from '@/components/debts/debt-payment-form'

export const metadata: Metadata = { title: 'Détail de la dette — BizLink AI Africa' }

export default async function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { organization } = await requireProfile()
  const supabase = await createClient()

  let debt: any
  try {
    debt = await getDebt(supabase, organization.id, id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">{debt.customer?.name ?? 'Client'}</h1>
        <p className="text-sm text-muted-foreground">{debt.customer?.phone}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border bg-card p-4 text-sm">
        <div>
          <p className="text-muted-foreground">Montant initial</p>
          <p className="text-lg font-semibold">{debt.original_amount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Solde restant</p>
          <p className="text-lg font-semibold">{debt.remaining_amount.toFixed(2)}</p>
        </div>
      </div>

      {debt.status !== 'paid' && (
        <DebtPaymentForm debtId={debt.id} remainingAmount={debt.remaining_amount} />
      )}

      <div>
        <h2 className="font-medium mb-2">Historique des paiements</h2>
        {debt.payments?.length ? (
          <ul className="divide-y rounded-lg border bg-card text-sm">
            {debt.payments.map((p: any) => (
              <li key={p.id} className="flex justify-between p-3">
                <span>{new Date(p.payment_date).toLocaleDateString('fr-FR')}</span>
                <span className="font-medium">{Number(p.amount).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
        )}
      </div>
    </div>
  )
}
