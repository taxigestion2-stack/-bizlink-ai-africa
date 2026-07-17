import type { SupabaseClient } from '@supabase/supabase-js'
import type { PurchaseInput } from '@/lib/validations/purchase'

export async function listPurchases(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, supplier:suppliers(id, name), items:purchase_items(*, product:products(id, name))')
    .eq('organization_id', organizationId)
    .order('purchase_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getPurchase(supabase: SupabaseClient, organizationId: string, id: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, supplier:suppliers(id, name), items:purchase_items(*, product:products(id, name))')
    .eq('organization_id', organizationId)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Délègue à la fonction RPC `create_purchase_with_items` (voir 004_rpc_functions.sql)
 * pour garantir l'atomicité de la création de l'achat + de ses lignes,
 * et déclencher l'augmentation automatique du stock (triggers SQL).
 */
export async function createPurchase(
  supabase: SupabaseClient,
  organizationId: string,
  input: PurchaseInput
) {
  const { data, error } = await supabase.rpc('create_purchase_with_items', {
    p_organization_id: organizationId,
    p_supplier_id: input.supplierId || null,
    p_purchase_date: input.purchaseDate,
    p_notes: input.notes || null,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_cost: item.unitCost,
    })),
  })

  if (error) throw new Error(error.message)
  return data
}

export async function listSuppliers(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name')

  if (error) throw new Error(error.message)
  return data
}
