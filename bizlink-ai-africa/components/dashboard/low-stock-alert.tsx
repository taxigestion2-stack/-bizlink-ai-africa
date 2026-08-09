import Link from 'next/link'
import type { Product } from '@/types/database.types'

export function LowStockAlert({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium">Stock</p>
        <p className="text-sm text-muted-foreground mt-2">Aucune alerte de stock. Tout va bien 👍</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
      <p className="text-sm font-medium text-destructive">
        {products.length} produit{products.length > 1 ? 's' : ''} en stock faible
      </p>
      <ul className="mt-2 space-y-1 text-sm text-destructive/90">
        {products.slice(0, 5).map((p) => (
          <li key={p.id} className="flex justify-between">
            <span>{p.name}</span>
            <span>
              {p.stock_quantity} {p.unit}
            </span>
          </li>
        ))}
      </ul>
      <Link href="/products" className="mt-3 inline-block text-sm underline text-destructive">
        Voir tous les produits
      </Link>
    </div>
  )
}
