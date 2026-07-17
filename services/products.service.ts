import type { SupabaseClient } from '@supabase/supabase-js'
import type { Product } from '@/types/database.types'
import type { ProductInput } from '@/lib/validations/product'

/**
 * Toute la logique métier "produits" est centralisée ici. Les Server Actions
 * ne font que valider l'input (Zod) et déléguer à ces fonctions — aucune
 * requête Supabase ne doit être écrite directement dans app/ ou actions/.
 */

export async function listProducts(
  supabase: SupabaseClient,
  organizationId: string,
  options?: { search?: string; categoryId?: string; onlyLowStock?: boolean }
) {
  let query = supabase
    .from('products')
    .select('*, category:categories(id, name)')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })

  if (options?.search) {
    query = query.ilike('name', `%${options.search}%`)
  }
  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const products = (data ?? []) as unknown as Product[]

  if (options?.onlyLowStock) {
    return products.filter((p) => p.stock_quantity <= p.min_stock_alert)
  }

  return products
}

export async function getProduct(supabase: SupabaseClient, organizationId: string, id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as Product
}

export async function createProduct(
  supabase: SupabaseClient,
  organizationId: string,
  input: ProductInput
) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      organization_id: organizationId,
      name: input.name,
      category_id: input.categoryId || null,
      sku: input.sku || null,
      barcode: input.barcode || null,
      description: input.description || null,
      unit: input.unit,
      purchase_price: input.purchasePrice,
      sale_price: input.salePrice,
      stock_quantity: input.stockQuantity,
      min_stock_alert: input.minStockAlert,
      image_url: input.imageUrl || null,
      is_active: input.isActive,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Product
}

export async function updateProduct(
  supabase: SupabaseClient,
  organizationId: string,
  id: string,
  input: ProductInput
) {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: input.name,
      category_id: input.categoryId || null,
      sku: input.sku || null,
      barcode: input.barcode || null,
      description: input.description || null,
      unit: input.unit,
      purchase_price: input.purchasePrice,
      sale_price: input.salePrice,
      min_stock_alert: input.minStockAlert,
      image_url: input.imageUrl || null,
      is_active: input.isActive,
      // Le stock n'est jamais modifié directement ici : il évolue uniquement
      // via les triggers d'achats/ventes pour garder une source de vérité unique.
    })
    .eq('organization_id', organizationId)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Product
}

export async function deleteProduct(supabase: SupabaseClient, organizationId: string, id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('organization_id', organizationId)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function listCategories(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name')

  if (error) throw new Error(error.message)
  return data
}

export async function createCategory(
  supabase: SupabaseClient,
  organizationId: string,
  input: { name: string; description?: string }
) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ organization_id: organizationId, name: input.name, description: input.description || null })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
