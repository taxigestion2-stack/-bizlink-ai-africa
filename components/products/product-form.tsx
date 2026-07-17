'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, type ProductInput } from '@/lib/validations/product'
import { createProductAction, updateProductAction } from '@/actions/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Product } from '@/types/database.types'

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          categoryId: product.category_id ?? undefined,
          sku: product.sku ?? '',
          barcode: product.barcode ?? '',
          description: product.description ?? '',
          unit: product.unit,
          purchasePrice: product.purchase_price,
          salePrice: product.sale_price,
          stockQuantity: product.stock_quantity,
          minStockAlert: product.min_stock_alert,
          imageUrl: product.image_url ?? '',
          isActive: product.is_active,
        }
      : { unit: 'unité', stockQuantity: 0, minStockAlert: 5, isActive: true },
  })

  const onSubmit = (data: ProductInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = product
        ? await updateProductAction(product.id, data)
        : await createProductAction(data)

      if (result?.error) {
        setServerError(result.error)
        return
      }
      router.push('/products')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du produit</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU / Référence</Label>
          <Input id="sku" {...register('sku')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Code-barres</Label>
          <Input id="barcode" {...register('barcode')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...register('description')} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unité</Label>
          <Input id="unit" placeholder="unité, kg, sac..." {...register('unit')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Prix d'achat</Label>
          <Input id="purchasePrice" type="number" step="0.01" {...register('purchasePrice')} />
          {errors.purchasePrice && (
            <p className="text-sm text-red-500">{errors.purchasePrice.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="salePrice">Prix de vente</Label>
          <Input id="salePrice" type="number" step="0.01" {...register('salePrice')} />
          {errors.salePrice && <p className="text-sm text-red-500">{errors.salePrice.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stockQuantity">Stock initial</Label>
          <Input
            id="stockQuantity"
            type="number"
            step="0.01"
            disabled={!!product}
            {...register('stockQuantity')}
          />
          {product && (
            <p className="text-xs text-muted-foreground">
              Le stock se met à jour automatiquement via les achats/ventes.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStockAlert">Seuil d'alerte</Label>
          <Input id="minStockAlert" type="number" step="0.01" {...register('minStockAlert')} />
        </div>
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Enregistrement...' : product ? 'Mettre à jour' : 'Créer le produit'}
      </Button>
    </form>
  )
}
