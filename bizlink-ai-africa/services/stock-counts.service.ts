import type { SupabaseClient } from '@supabase/supabase-js'

export async function listStockCounts(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('stock_counts')
    .select('*, items:stock_count_items(*)')
    .eq('organization_id', organizationId)
    .order('completed_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getStockCount(supabase: SupabaseClient, organizationId: string, id: string) {
  const { data, error } = await supabase
    .from('stock_counts')
    .select('*, items:stock_count_items(*)')
    .eq('organization_id', organizationId)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Enregistre un comptage physique via la fonction RPC atomique
 * `perform_stock_count` (voir 008_stock_counts.sql) : ajuste le stock de
 * chaque produit à la quantité réellement comptée, et calcule la valeur
 * des pertes constatées.
 */
export async function performStockCount(
  supabase: SupabaseClient,
  organizationId: string,
  items: { productId: string; countedQuantity: number }[],
  notes?: string
) {
  const { data, error } = await supabase.rpc('perform_stock_count', {
    p_organization_id: organizationId,
    p_items: items.map((item) => ({
      product_id: item.productId,
      counted_quantity: item.countedQuantity,
    })),
    p_notes: notes || null,
  })

  if (error) throw new Error(error.message)
  return data
}
