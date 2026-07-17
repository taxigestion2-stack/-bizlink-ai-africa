'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { productSchema, categorySchema, type ProductInput, type CategoryInput } from '@/lib/validations/product'
import * as productsService from '@/services/products.service'

export type ActionResult = { error: string | null }

export async function createProductAction(input: ProductInput): Promise<ActionResult> {
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { organization } = await requireProfile()
  const supabase = await createClient()

  try {
    await productsService.createProduct(supabase, organization.id, parsed.data)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/products')
  return { error: null }
}

export async function updateProductAction(id: string, input: ProductInput): Promise<ActionResult> {
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { organization } = await requireProfile()
  const supabase = await createClient()

  try {
    await productsService.updateProduct(supabase, organization.id, id, parsed.data)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/products')
  return { error: null }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const { organization } = await requireProfile()
  const supabase = await createClient()

  try {
    await productsService.deleteProduct(supabase, organization.id, id)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/products')
  return { error: null }
}

export async function createCategoryAction(input: CategoryInput): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { organization } = await requireProfile()
  const supabase = await createClient()

  try {
    await productsService.createCategory(supabase, organization.id, parsed.data)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/products')
  return { error: null }
}
