import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listProducts } from '@/services/products.service'
import { listCustomers } from '@/services/sales.service'
import { SaleForm } from '@/components/sales/sale-form'

export const metadata: Metadata = { title: 'Nouvelle vente — BizLink AI Africa' }

export default async function NewSalePage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()

  const [products, customers] = await Promise.all([
    listProducts(supabase, organization.id),
    listCustomers(supabase, organization.id),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nouvelle vente</h1>
      <SaleForm products={products} customers={customers as any} />
    </div>
  )
}
