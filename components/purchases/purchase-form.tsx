'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { purchaseSchema, type PurchaseInput } from '@/lib/validations/purchase'
import { createPurchaseAction } from '@/actions/purchases'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Product, Supplier } from '@/types/database.types'

export function PurchaseForm({
  products,
  suppliers,
}: {
  products: Product[]
  suppliers: Pick<Supplier, 'id' | 'name'>[]
}) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PurchaseInput>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().slice(0, 10),
      items: [{ productId: '', quantity: 1, unitCost: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')
  const total = items?.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitCost || 0), 0) ?? 0

  const onSubmit = (data: PurchaseInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = await createPurchaseAction(data)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="supplierId">Fournisseur</Label>
          <select id="supplierId" className="w-full rounded-md border px-3 py-2 text-sm" {...register('supplierId')}>
            <option value="">— Aucun —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Date</Label>
          <Input id="purchaseDate" type="date" {...register('purchaseDate')} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Produits achetés</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ productId: '', quantity: 1, unitCost: 0 })}
          >
            + Ajouter une ligne
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-6">
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                {...register(`items.${index}.productId` as const)}
              >
                <option value="">Sélectionner un produit</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Qté"
                {...register(`items.${index}.quantity` as const)}
              />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                step="0.01"
                placeholder="Coût unitaire"
                {...register(`items.${index}.unitCost` as const)}
              />
            </div>
            <div className="col-span-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                ✕
              </Button>
            </div>
          </div>
        ))}
        {errors.items && <p className="text-sm text-red-500">{errors.items.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" {...register('notes')} />
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">Total de l'achat</p>
        <p className="text-lg font-semibold">{total.toFixed(2)}</p>
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Enregistrement...' : "Enregistrer l'achat"}
      </Button>
    </form>
  )
}
