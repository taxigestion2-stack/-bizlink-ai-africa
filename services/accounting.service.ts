import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Compte de résultat simplifié sur une période :
 * Chiffre d'affaires - Coût des marchandises vendues = Marge brute
 * Marge brute - Dépenses d'exploitation = Résultat net
 */
export async function getIncomeStatement(
  supabase: SupabaseClient,
  organizationId: string,
  periodStart: string,
  periodEnd: string
) {
  const [salesRes, expensesRes] = await Promise.all([
    supabase
      .from('sale_items')
      .select('quantity, unit_price, unit_cost, sale:sales!inner(organization_id, sale_date)')
      .eq('sale.organization_id', organizationId)
      .gte('sale.sale_date', periodStart)
      .lte('sale.sale_date', periodEnd),
    supabase
      .from('expenses')
      .select('amount, category')
      .eq('organization_id', organizationId)
      .gte('expense_date', periodStart)
      .lte('expense_date', periodEnd),
  ])

  if (salesRes.error) throw new Error(salesRes.error.message)
  if (expensesRes.error) throw new Error(expensesRes.error.message)

  const revenue = (salesRes.data ?? []).reduce(
    (sum, r: any) => sum + Number(r.quantity) * Number(r.unit_price),
    0
  )
  const cogs = (salesRes.data ?? []).reduce(
    (sum, r: any) => sum + Number(r.quantity) * Number(r.unit_cost),
    0
  )
  const grossMargin = revenue - cogs

  const expensesByCategory = new Map<string, number>()
  let totalExpenses = 0
  for (const row of expensesRes.data ?? []) {
    totalExpenses += Number(row.amount)
    expensesByCategory.set(row.category, (expensesByCategory.get(row.category) ?? 0) + Number(row.amount))
  }

  const netResult = grossMargin - totalExpenses

  return {
    revenue,
    cogs,
    grossMargin,
    grossMarginRate: revenue > 0 ? (grossMargin / revenue) * 100 : 0,
    totalExpenses,
    expensesByCategory: Array.from(expensesByCategory.entries()).map(([category, amount]) => ({
      category,
      amount,
    })),
    netResult,
  }
}

/**
 * Bilan simplifié à l'instant présent (pas un vrai bilan comptable à partie
 * double — une approximation utile pour un petit commerce) :
 * Actif = valeur du stock + épargne + créances clients (dettes à recevoir)
 */
export async function getSimplifiedBalance(supabase: SupabaseClient, organizationId: string) {
  const [productsRes, savingsRes, debtsRes] = await Promise.all([
    supabase
      .from('products')
      .select('stock_quantity, purchase_price')
      .eq('organization_id', organizationId),
    supabase
      .from('savings_transactions')
      .select('type, amount')
      .eq('organization_id', organizationId),
    supabase
      .from('debts')
      .select('remaining_amount')
      .eq('organization_id', organizationId)
      .in('status', ['open', 'partial']),
  ])

  if (productsRes.error) throw new Error(productsRes.error.message)
  if (savingsRes.error) throw new Error(savingsRes.error.message)
  if (debtsRes.error) throw new Error(debtsRes.error.message)

  const stockValue = (productsRes.data ?? []).reduce(
    (sum, p: any) => sum + Number(p.stock_quantity) * Number(p.purchase_price),
    0
  )
  const savingsBalance = (savingsRes.data ?? []).reduce(
    (sum, t: any) => sum + (t.type === 'deposit' ? Number(t.amount) : -Number(t.amount)),
    0
  )
  const receivables = (debtsRes.data ?? []).reduce((sum, d: any) => sum + Number(d.remaining_amount), 0)

  return {
    stockValue,
    savingsBalance,
    receivables,
    totalAssets: stockValue + savingsBalance + receivables,
  }
}

export type JournalEntry = {
  date: string
  type: 'sale' | 'purchase' | 'expense' | 'savings_deposit' | 'savings_withdrawal'
  label: string
  amount: number
  direction: 'in' | 'out'
}

/** Journal chronologique de tous les mouvements financiers d'une période, tous types confondus. */
export async function getJournalEntries(
  supabase: SupabaseClient,
  organizationId: string,
  periodStart: string,
  periodEnd: string
): Promise<JournalEntry[]> {
  const [salesRes, purchasesRes, expensesRes, savingsRes] = await Promise.all([
    supabase
      .from('sales')
      .select('sale_date, total_amount, customer:customers(name)')
      .eq('organization_id', organizationId)
      .gte('sale_date', periodStart)
      .lte('sale_date', periodEnd),
    supabase
      .from('purchases')
      .select('purchase_date, total_amount, supplier:suppliers(name)')
      .eq('organization_id', organizationId)
      .gte('purchase_date', periodStart)
      .lte('purchase_date', periodEnd),
    supabase
      .from('expenses')
      .select('expense_date, amount, category')
      .eq('organization_id', organizationId)
      .gte('expense_date', periodStart)
      .lte('expense_date', periodEnd),
    supabase
      .from('savings_transactions')
      .select('created_at, type, amount, notes')
      .eq('organization_id', organizationId)
      .gte('created_at', periodStart)
      .lte('created_at', `${periodEnd} 23:59:59`),
  ])

  if (salesRes.error) throw new Error(salesRes.error.message)
  if (purchasesRes.error) throw new Error(purchasesRes.error.message)
  if (expensesRes.error) throw new Error(expensesRes.error.message)
  if (savingsRes.error) throw new Error(savingsRes.error.message)

  const entries: JournalEntry[] = []

  for (const s of (salesRes.data ?? []) as any[]) {
    entries.push({
      date: s.sale_date,
      type: 'sale',
      label: `Vente — ${s.customer?.name ?? 'Client de passage'}`,
      amount: Number(s.total_amount),
      direction: 'in',
    })
  }
  for (const p of (purchasesRes.data ?? []) as any[]) {
    entries.push({
      date: p.purchase_date,
      type: 'purchase',
      label: `Achat — ${p.supplier?.name ?? 'Fournisseur non renseigné'}`,
      amount: Number(p.total_amount),
      direction: 'out',
    })
  }
  for (const e of (expensesRes.data ?? []) as any[]) {
    entries.push({
      date: e.expense_date,
      type: 'expense',
      label: `Dépense — ${e.category}`,
      amount: Number(e.amount),
      direction: 'out',
    })
  }
  for (const sv of (savingsRes.data ?? []) as any[]) {
    entries.push({
      date: sv.created_at.slice(0, 10),
      type: sv.type === 'deposit' ? 'savings_deposit' : 'savings_withdrawal',
      label: sv.notes ? `Épargne — ${sv.notes}` : sv.type === 'deposit' ? 'Dépôt épargne' : 'Retrait épargne',
      amount: Number(sv.amount),
      direction: sv.type === 'deposit' ? 'out' : 'in', // un dépôt "sort" de la trésorerie courante vers l'épargne
    })
  }

  return entries.sort((a, b) => (a.date < b.date ? 1 : -1))
}
