import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listProducts } from '@/services/products.service'
import { StockCountForm } from '@/components/stock-counts/stock-count-form'

export const metadata: Metadata = { title: 'Nouveau comptage — BizLink AI Africa' }

export default async function NewStockCountPage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()
  const products = await listProducts(supabase, organization.id)
  const activeProducts = products.filter((p) => p.is_active)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nouveau comptage physique</h1>
        <p className="text-sm text-muted-foreground">
          Entrez la quantité réellement présente dans votre boutique pour chaque produit.
          Le stock sera automatiquement ajusté après validation.
        </p>
      </div>
      <StockCountForm products={activeProducts} />
    </div>
  )
}
