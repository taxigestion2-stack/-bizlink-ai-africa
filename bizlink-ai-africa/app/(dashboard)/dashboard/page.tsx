import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listProducts } from '@/services/products.service'
import { getTodaySalesSummary, getRevenueLastNDays } from '@/services/sales.service'
import { getMonthlyExpensesTotal } from '@/services/expenses.service'
import { getTotalOutstandingDebt } from '@/services/debts.service'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { LowStockAlert } from '@/components/dashboard/low-stock-alert'

export const metadata: Metadata = { title: 'Tableau de bord — BizLink AI Africa' }

export default async function DashboardPage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [todaySummary, monthlyExpenses, outstandingDebt, lowStockProducts, revenueSeries] =
    await Promise.all([
      getTodaySalesSummary(supabase, organization.id),
      getMonthlyExpensesTotal(supabase, organization.id, currentMonth),
      getTotalOutstandingDebt(supabase, organization.id),
      listProducts(supabase, organization.id, { onlyLowStock: true }),
      getRevenueLastNDays(supabase, organization.id, 7),
    ])

  const stats = [
    { label: 'Ventes du jour', value: `${todaySummary.count}`, hint: `${todaySummary.totalRevenue.toFixed(2)} de CA` },
    { label: 'Bénéfice du jour', value: todaySummary.totalProfit.toFixed(2) },
    { label: 'Dépenses du mois', value: monthlyExpenses.toFixed(2) },
    { label: 'Dettes en cours', value: outstandingDebt.toFixed(2) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de {organization.name}</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <RevenueChart data={revenueSeries} />
        </div>
        <LowStockAlert products={lowStockProducts} />
      </div>
    </div>
  )
}
