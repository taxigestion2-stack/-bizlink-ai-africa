import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listExpenses } from '@/services/expenses.service'
import { ExpenseTable } from '@/components/expenses/expense-table'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Dépenses — BizLink AI Africa' }

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { organization } = await requireProfile()
  const supabase = await createClient()
  const { month } = await searchParams
  const currentMonth = month ?? new Date().toISOString().slice(0, 7)

  const expenses = await listExpenses(supabase, organization.id, { month: currentMonth })
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dépenses</h1>
          <p className="text-sm text-muted-foreground">
            Total du mois : <span className="font-medium text-foreground">{total.toFixed(2)}</span>
          </p>
        </div>
        <Button asChild>
          <Link href="/expenses/new">Ajouter une dépense</Link>
        </Button>
      </div>

      <form className="flex items-center gap-2">
        <input
          type="month"
          name="month"
          defaultValue={currentMonth}
          className="rounded-md border px-3 py-2 text-sm"
        />
        <Button type="submit" variant="outline" size="sm">
          Filtrer
        </Button>
      </form>

      <ExpenseTable expenses={expenses} />
    </div>
  )
}
