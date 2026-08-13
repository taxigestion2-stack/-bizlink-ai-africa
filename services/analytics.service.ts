import type { SupabaseClient } from '@supabase/supabase-js'

/** Série temporelle revenus/bénéfice/dépenses sur N jours (pour graphique). */
export async function getFinancialTrend(supabase: SupabaseClient, organizationId: string, days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  const [salesRes, expensesRes] = await Promise.all([
    supabase
      .from('sales')
      .select('sale_date, total_amount, profit')
      .eq('organization_id', organizationId)
      .gte('sale_date', startStr)
      .lte('sale_date', endStr),
    supabase
      .from('expenses')
      .select('expense_date, amount')
      .eq('organization_id', organizationId)
      .gte('expense_date', startStr)
      .lte('expense_date', endStr),
  ])

  if (salesRes.error) throw new Error(salesRes.error.message)
  if (expensesRes.error) throw new Error(expensesRes.error.message)

  const byDay = new Map<string, { revenue: number; profit: number; expenses: number }>()
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    byDay.set(d.toISOString().slice(0, 10), { revenue: 0, profit: 0, expenses: 0 })
  }

  for (const row of salesRes.data ?? []) {
    const entry = byDay.get(row.sale_date)
    if (entry) {
      entry.revenue += Number(row.total_amount)
      entry.profit += Number(row.profit)
    }
  }
  for (const row of expensesRes.data ?? []) {
    const entry = byDay.get(row.expense_date)
    if (entry) entry.expenses += Number(row.amount)
  }

  return Array.from(byDay.entries()).map(([date, values]) => ({ date, ...values }))
}

/** Produits les plus vendus (par quantité et par revenu) sur une période. */
export async function getTopProducts(
  supabase: SupabaseClient,
  organizationId: string,
  days: number,
  limit = 5
) {
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))

  const { data, error } = await supabase
    .from('sale_items')
    .select('quantity, subtotal, product:products(name), sale:sales!inner(organization_id, sale_date)')
    .eq('sale.organization_id', organizationId)
    .gte('sale.sale_date', start.toISOString().slice(0, 10))

  if (error) throw new Error(error.message)

  const byProduct = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const row of (data ?? []) as any[]) {
    const name = row.product?.name ?? 'Produit supprimé'
    const entry = byProduct.get(name) ?? { name, quantity: 0, revenue: 0 }
    entry.quantity += Number(row.quantity)
    entry.revenue += Number(row.subtotal)
    byProduct.set(name, entry)
  }

  return Array.from(byProduct.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

/** Répartition des dépenses par catégorie sur une période (pour graphique circulaire). */
export async function getExpenseBreakdown(supabase: SupabaseClient, organizationId: string, days: number) {
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))

  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount')
    .eq('organization_id', organizationId)
    .gte('expense_date', start.toISOString().slice(0, 10))

  if (error) throw new Error(error.message)

  const byCategory = new Map<string, number>()
  for (const row of data ?? []) {
    byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + Number(row.amount))
  }

  return Array.from(byCategory.entries()).map(([category, amount]) => ({ category, amount }))
}

/** Répartition des ventes par statut de paiement (payé/partiel/non payé). */
export async function getPaymentStatusBreakdown(
  supabase: SupabaseClient,
  organizationId: string,
  days: number
) {
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))

  const { data, error } = await supabase
    .from('sales')
    .select('payment_status, total_amount')
    .eq('organization_id', organizationId)
    .gte('sale_date', start.toISOString().slice(0, 10))

  if (error) throw new Error(error.message)

  const counts = { paid: 0, partial: 0, unpaid: 0 }
  const amounts = { paid: 0, partial: 0, unpaid: 0 }
  for (const row of data ?? []) {
    const status = row.payment_status as 'paid' | 'partial' | 'unpaid'
    counts[status] += 1
    amounts[status] += Number(row.total_amount)
  }

  return { counts, amounts }
}

/** Indicateurs clés (KPIs) sur une période, pour les cartes de synthèse. */
export async function getKeyMetrics(supabase: SupabaseClient, organizationId: string, days: number) {
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  const startStr = start.toISOString().slice(0, 10)

  const { data: sales, error } = await supabase
    .from('sales')
    .select('total_amount, profit')
    .eq('organization_id', organizationId)
    .gte('sale_date', startStr)

  if (error) throw new Error(error.message)

  const salesCount = sales?.length ?? 0
  const totalRevenue = (sales ?? []).reduce((s, r: any) => s + Number(r.total_amount), 0)
  const totalProfit = (sales ?? []).reduce((s, r: any) => s + Number(r.profit), 0)
  const averageBasket = salesCount > 0 ? totalRevenue / salesCount : 0
  const marginRate = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  return { salesCount, totalRevenue, totalProfit, averageBasket, marginRate }
}
