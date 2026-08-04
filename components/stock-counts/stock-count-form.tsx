'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { stockCountSchema, type StockCountInput } from '@/lib/validations/stock-count'
import { performStockCountAction } from '@/actions/stock-counts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Product } from '@/types/database.types'

export function StockCountForm({ products }: { products: Product[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    watch,
  } = useForm<StockCountInput>({
    resolver: zodResolver(stockCountSchema),
    defaultValues: {
      items: products.map((p) => ({
        productId: p.id,
        productName: p.name,
        systemQuantity: p.stock_quantity,
        unit: p.unit,
        countedQuantity: p.stock_quantity,
      })),
    },
  })

  const { fields } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  const totalLossValue = products.reduce((sum, p, index) => {
    const counted = Number(items?.[index]?.countedQuantity ?? p.stock_quantity)
    const diff = counted - p.stock_quantity
    return diff < 0 ? sum + Math.abs(diff) * Number(p.purchase_price) : sum
  }, 0)

  const onSubmit = (data: StockCountInput) => {
    setError(null)
    startTransition(async () => {
      const result = await performStockCountAction(data)
      if (result?.error) setError(result.error)
    })
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucun produit à compter. Ajoutez d'abord des produits à votre catalogue.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-3xl">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Produit</th>
              <th className="p-3 text-right">Stock système</th>
              <th className="p-3 text-right">Quantité comptée</th>
              <th className="p-3 text-right">Écart</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const product = products[index]
              const counted = Number(items?.[index]?.countedQuantity ?? product.stock_quantity)
              const diff = counted - product.stock_quantity
              return (
                <tr key={field.id} className="border-t">
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3 text-right text-muted-foreground">
                    {product.stock_quantity} {product.unit}
                  </td>
                  <td className="p-3 text-right">
                    <Input
                      type="number"
                      step="0.01"
                      className="w-28 ml-auto text-right"
                      {...register(`items.${index}.countedQuantity` as const)}
                    />
                  </td>
                  <td
                    className={`p-3 text-right font-mono ${
                      diff < 0 ? 'text-destructive' : diff > 0 ? 'text-success' : 'text-muted-foreground'
                    }`}
                  >
                    {diff > 0 ? '+' : ''}
                    {diff.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (facultatif)</Label>
        <Input id="notes" placeholder="Ex: comptage de fin de mois" {...register('notes')} />
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Valeur estimée des pertes</p>
        <p className="font-mono text-lg font-semibold text-destructive">{totalLossValue.toFixed(2)}</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Enregistrement...' : 'Valider le comptage'}
      </Button>
    </form>
  )
}
