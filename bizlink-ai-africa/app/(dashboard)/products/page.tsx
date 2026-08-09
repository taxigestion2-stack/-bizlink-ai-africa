import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listProducts } from '@/services/products.service'
import { ProductTable } from '@/components/products/product-table'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Produits — BizLink AI Africa' }

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { organization } = await requireProfile()
  const supabase = await createClient()
  const { q } = await searchParams

  const products = await listProducts(supabase, organization.id, { search: q })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produits</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} produit{products.length > 1 ? 's' : ''} au catalogue
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">Ajouter un produit</Link>
        </Button>
      </div>

      <form className="max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher un produit..."
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </form>

      <ProductTable products={products} />
    </div>
  )
}
