import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listProducts } from '@/services/products.service'
import { listSuppliers } from '@/services/purchases.service'
import { PurchaseForm } from '@/components/purchases/purchase-form'

export const metadata: Metadata = { title: 'Nouvel achat — BizLink AI Africa' }

export default async function NewPurchasePage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()

  const [products, suppliers] = await Promise.all([
    listProducts(supabase, organization.id),
    listSuppliers(supabase, organization.id),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nouvel achat</h1>
      <PurchaseForm products={products} suppliers={suppliers as any} />
    </div>
  )
}
