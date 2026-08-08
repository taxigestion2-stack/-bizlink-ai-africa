import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listSavingsTransactions, getSavingsBalance } from '@/services/savings.service'
import { SavingsForm } from '@/components/savings/savings-form'
import { SavingsBalanceCard, SavingsHistoryTable } from '@/components/savings/savings-history-table'

export const metadata: Metadata = { title: 'Épargne — BizLink AI Africa' }

export default async function SavingsPage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()

  const [transactions, balance] = await Promise.all([
    listSavingsTransactions(supabase, organization.id),
    getSavingsBalance(supabase, organization.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Épargne</h1>
        <p className="text-sm text-muted-foreground">
          Mettez de l'argent de côté pour votre commerce (réapprovisionnement, taxes, imprévus).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SavingsBalanceCard balance={balance} />
        <SavingsForm />
      </div>

      <div>
        <h2 className="font-medium mb-3">Historique</h2>
        <SavingsHistoryTable transactions={transactions as any} />
      </div>
    </div>
  )
}
