import type { SupabaseClient } from '@supabase/supabase-js'
import type { SaleInput } from '@/lib/validations/sale'

export async function listSales(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('sales')
    .select('*, customer:customers(id, name), items:sale_items(*, product:products(id, name))')
    .eq('organization_id', organizationId)
    .order('sale_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getSale(supabase: SupabaseClient, organizationId: string, id: string) {
  const { data, error } = await supabase
    .from('sales')
    .select('*, customer:customers(id, name), items:sale_items(*, product:products(id, name))')
    .eq('organization_id', organizationId)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Délègue à la fonction RPC `create_sale_with_items` (voir 004_rpc_functions.sql)
 * pour garantir l'atomicité, vérifier le stock disponible ligne par ligne,
 * calculer le profit, et créer automatiquement une dette si nécessaire.
 */
export async function createSale(supabase: SupabaseClient, organizationId: string, input: SaleInput) {
  const { data, error } = await supabase.rpc('create_sale_with_items', {
    p_organization_id: organizationId,
    p_customer_id: input.customerId || null,
    p_sale_date: input.saleDate,
    p_discount: input.discount,
    p_payment_status: input.paymentStatus,
    p_payment_method: input.paymentMethod || null,
    p_notes: input.notes || null,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
    p_paid_amount: input.paidAmount ?? null,
  })

  if (error) throw new Error(error.message)
  return data
}

export async function listCustomers(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name')

  if (error) throw new Error(error.message)
  return data
}

export async function getRevenueLastNDays(supabase: SupabaseClient, organizationId: string, days = 7) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))

  const { data, error } = await supabase
    .from('sales')
    .select('sale_date, total_amount, profit')
    .eq('organization_id', organizationId)
    .gte('sale_date', start.toISOString().slice(0, 10))
    .lte('sale_date', end.toISOString().slice(0, 10))

  if (error) throw new Error(error.message)

  const byDay = new Map<string, { revenue: number; profit: number }>()
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    byDay.set(d.toISOString().slice(0, 10), { revenue: 0, profit: 0 })
  }

  for (const row of data ?? []) {
    const entry = byDay.get(row.sale_date)
    if (entry) {
      entry.revenue += Number(row.total_amount)
      entry.profit += Number(row.profit)
    }
  }

  return Array.from(byDay.entries()).map(([date, values]) => ({ date, ...values }))
}

export async function getTodaySalesSummary(supabase: SupabaseClient, organizationId: string) {

  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('sales')
    .select('total_amount, profit')
    .eq('organization_id', organizationId)
    .eq('sale_date', today)

  if (error) throw new Error(error.message)

  const rows = data ?? []
  return {
    count: rows.length,
    totalRevenue: rows.reduce((sum, r) => sum + Number(r.total_amount), 0),
    totalProfit: rows.reduce((sum, r) => sum + Number(r.profit), 0),
  }
}
