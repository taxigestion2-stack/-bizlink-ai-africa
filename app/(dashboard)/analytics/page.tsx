import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import * as analyticsService from '@/services/analytics.service'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { FinancialTrendChart } from '@/components/analytics/financial-trend-chart'
import { TopProductsChart } from '@/components/analytics/top-products-chart'
import { ExpenseBreakdownChart } from '@/components/analytics/expense-breakdown-chart'
import { PeriodSelector } from '@/components/analytics/period-selector'

export const metadata: Metadata = { title: 'Statistiques — BizLink AI Africa' }

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const { organization } = await requireProfile()
  const supabase = await createClient()
  const { days: daysParam } = await searchParams
  const days = [7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 30

  const [trend, topProducts, expenseBreakdown, metrics] = await Promise.all([
    analyticsService.getFinancialTrend(supabase, organization.id, days),
    analyticsService.getTopProducts(supabase, organization.id, days),
    analyticsService.getExpenseBreakdown(supabase, organization.id, days),
    analyticsService.getKeyMetrics(supabase, organization.id, days),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Statistiques</h1>
          <p className="text-sm text-muted-foreground">Analyse de la performance de votre commerce.</p>
        </div>
        <PeriodSelector currentDays={days} />
      </div>

      <StatsCards
        stats={[
          { label: 'Ventes', value: `${metrics.salesCount}` },
          { label: "Chiffre d'affaires", value: metrics.totalRevenue.toFixed(2) },
          { label: 'Bénéfice', value: metrics.totalProfit.toFixed(2) },
          { label: 'Marge', value: `${metrics.marginRate.toFixed(1)}%`, hint: `Panier moyen : ${metrics.averageBasket.toFixed(2)}` },
        ]}
      />

      <FinancialTrendChart data={trend} />

      <div className="grid gap-6 md:grid-cols-2">
        <TopProductsChart products={topProducts} />
        <ExpenseBreakdownChart categories={expenseBreakdown} />
      </div>
    </div>
  )
}
