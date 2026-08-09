import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { getProduct } from '@/services/products.service'
import { ProductForm } from '@/components/products/product-form'

export const metadata: Metadata = { title: 'Modifier le produit — BizLink AI Africa' }

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { organization } = await requireProfile()
  const supabase = await createClient()

  let product
  try {
    product = await getProduct(supabase, organization.id, id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Modifier le produit</h1>
      <ProductForm product={product} />
    </div>
  )
}
