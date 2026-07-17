import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listDebts, getTotalOutstandingDebt } from '@/services/debts.service'
import { DebtTable } from '@/components/debts/debt-table'

export const metadata: Metadata = { title: 'Dettes clients — BizLink AI Africa' }

export default async function DebtsPage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()

  const [debts, totalOutstanding] = await Promise.all([
    listDebts(supabase, organization.id),
    getTotalOutstandingDebt(supabase, organization.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dettes clients</h1>
        <p className="text-sm text-muted-foreground">
          Total dû : <span className="font-medium text-foreground">{totalOutstanding.toFixed(2)}</span>
        </p>
      </div>

      <DebtTable debts={debts as any} />
    </div>
  )
}
