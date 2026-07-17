import type { SupabaseClient } from '@supabase/supabase-js'

export async function listInventoryReports(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('inventory_reports')
    .select('*')
    .eq('organization_id', organizationId)
    .order('period_end', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

/**
 * Génère (ou régénère) le rapport d'inventaire d'une période donnée.
 *
 * Méthode de calcul (MVP, sans comptage physique) :
 *  - closing_stock_value = valeur du stock actuel au coût d'achat
 *  - purchases_value     = somme des achats de la période (coût)
 *  - sales_value          = somme des ventes de la période (chiffre d'affaires)
 *  - cogs (coût des ventes) = quantité vendue x coût unitaire, sur la période
 *  - opening_stock_value  = closing - purchases + cogs (reconstruction comptable)
 *  - losses / discrepancies = 0 par défaut : nécessitent un comptage physique
 *    manuel (fonctionnalité future "ajustement d'inventaire"), volontairement
 *    hors scope de ce livrable.
 */
export async function generateInventoryReport(
  supabase: SupabaseClient,
  organizationId: string,
  periodStart: string,
  periodEnd: string
) {
  const { data: purchaseRows, error: purchaseError } = await supabase
    .from('purchase_items')
    .select('subtotal, purchase:purchases!inner(organization_id, purchase_date)')
    .eq('purchase.organization_id', organizationId)
    .gte('purchase.purchase_date', periodStart)
    .lte('purchase.purchase_date', periodEnd)

  if (purchaseError) throw new Error(purchaseError.message)

  const { data: saleRows, error: saleError } = await supabase
    .from('sale_items')
    .select('subtotal, quantity, unit_cost, sale:sales!inner(organization_id, sale_date)')
    .eq('sale.organization_id', organizationId)
    .gte('sale.sale_date', periodStart)
    .lte('sale.sale_date', periodEnd)

  if (saleError) throw new Error(saleError.message)

  const { data: productRows, error: productError } = await supabase
    .from('products')
    .select('stock_quantity, purchase_price')
    .eq('organization_id', organizationId)

  if (productError) throw new Error(productError.message)

  const purchasesValue = (purchaseRows ?? []).reduce((sum, r: any) => sum + Number(r.subtotal), 0)
  const salesValue = (saleRows ?? []).reduce((sum, r: any) => sum + Number(r.subtotal), 0)
  const cogs = (saleRows ?? []).reduce(
    (sum, r: any) => sum + Number(r.quantity) * Number(r.unit_cost),
    0
  )
  const closingStockValue = (productRows ?? []).reduce(
    (sum, p: any) => sum + Number(p.stock_quantity) * Number(p.purchase_price),
    0
  )
  const openingStockValue = closingStockValue - purchasesValue + cogs

  const { data, error } = await supabase
    .from('inventory_reports')
    .upsert(
      {
        organization_id: organizationId,
        period_start: periodStart,
        period_end: periodEnd,
        opening_stock_value: openingStockValue,
        purchases_value: purchasesValue,
        sales_value: salesValue,
        closing_stock_value: closingStockValue,
        losses: 0,
        discrepancies: 0,
      },
      { onConflict: 'organization_id,period_start,period_end' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Calcule automatiquement les bornes du mois précédent (utilisé par le cron). */
export function getPreviousMonthRange(referenceDate = new Date()) {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() // 0-indexed ; mois précédent = month - 1
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  }
}
