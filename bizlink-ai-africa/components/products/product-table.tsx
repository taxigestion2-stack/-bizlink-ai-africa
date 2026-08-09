'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteProductAction } from '@/actions/products'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types/database.types'

export function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    startTransition(async () => {
      await deleteProductAction(id)
      router.refresh()
    })
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucun produit pour le moment. Ajoutez votre premier produit pour commencer.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Produit</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Prix d'achat</th>
            <th className="p-3">Prix de vente</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isLow = product.stock_quantity <= product.min_stock_alert
            return (
              <tr key={product.id} className="border-t">
                <td className="p-3 font-medium">{product.name}</td>
                <td className="p-3">
                  <span
                    className={
                      isLow
                        ? 'inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive'
                        : 'inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-xs text-success'
                    }
                  >
                    {product.stock_quantity} {product.unit}
                  </span>
                </td>
                <td className="p-3">{product.purchase_price.toFixed(2)}</td>
                <td className="p-3">{product.sale_price.toFixed(2)}</td>
                <td className="p-3 text-right space-x-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/products/${product.id}/edit`}>Modifier</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(product.id)}
                  >
                    Supprimer
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
