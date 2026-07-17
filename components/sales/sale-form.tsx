'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { saleSchema, type SaleInput } from '@/lib/validations/sale'
import { createSaleAction } from '@/actions/sales'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Product, Customer } from '@/types/database.types'

export function SaleForm({
  products,
  customers,
}: {
  products: Product[]
  customers: Pick<Customer, 'id' | 'name'>[]
}) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SaleInput>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      saleDate: new Date().toISOString().slice(0, 10),
      discount: 0,
      paymentStatus: 'paid',
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')
  const discount = Number(watch('discount')) || 0
  const paymentStatus = watch('paymentStatus')
  const subtotal = items?.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0), 0) ?? 0
  const total = Math.max(subtotal - discount, 0)

  const onSubmit = (data: SaleInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = await createSaleAction(data)
      if (result?.error) setServerError(result.error)
    })
  }

  const productMap = new Map(products.map((p) => [p.id, p]))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerId">Client</Label>
          <select id="customerId" className="w-full rounded-md border px-3 py-2 text-sm" {...register('customerId')}>
            <option value="">— Client de passage —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="text-sm text-red-500">{errors.customerId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="saleDate">Date</Label>
          <Input id="saleDate" type="date" {...register('saleDate')} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Produits vendus</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
          >
            + Ajouter une ligne
          </Button>
        </div>

        {fields.map((field, index) => {
          const selectedId = items?.[index]?.productId
          const stock = selectedId ? productMap.get(selectedId)?.stock_quantity : undefined

          return (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-6">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  {...register(`items.${index}.productId` as const)}
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock_quantity} {p.unit} en stock)
                    </option>
                  ))}
                </select>
                {stock !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">Stock disponible : {stock}</p>
                )}
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
                  placeholder="Prix unitaire"
                  {...register(`items.${index}.unitPrice` as const)}
                />
              </div>
              <div className="col-span-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  ✕
                </Button>
              </div>
            </div>
          )
        })}
        {errors.items && <p className="text-sm text-red-500">{errors.items.message as string}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount">Remise</Label>
          <Input id="discount" type="number" step="0.01" {...register('discount')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentStatus">Statut de paiement</Label>
          <select
            id="paymentStatus"
            className="w-full rounded-md border px-3 py-2 text-sm"
            {...register('paymentStatus')}
          >
            <option value="paid">Payé intégralement</option>
            <option value="partial">Paiement partiel</option>
            <option value="unpaid">Non payé (dette totale)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Moyen de paiement</Label>
          <Input id="paymentMethod" placeholder="Cash, Mobile Money..." {...register('paymentMethod')} />
        </div>
      </div>

      {paymentStatus === 'partial' && (
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="paidAmount">Montant payé maintenant</Label>
          <Input id="paidAmount" type="number" step="0.01" {...register('paidAmount')} />
          {errors.paidAmount && <p className="text-sm text-red-500">{errors.paidAmount.message}</p>}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" {...register('notes')} />
      </div>

      <div className="border-t pt-4 space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Sous-total</span>
          <span>{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Remise</span>
          <span>-{discount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{total.toFixed(2)}</span>
        </div>
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Enregistrement...' : 'Enregistrer la vente'}
      </Button>
    </form>
  )
}
