'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { savingsTransactionSchema, type SavingsTransactionInput } from '@/lib/validations/savings'
import { createSavingsTransactionAction } from '@/actions/savings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SavingsForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SavingsTransactionInput>({
    resolver: zodResolver(savingsTransactionSchema),
    defaultValues: { type: 'deposit' },
  })

  const onSubmit = (data: SavingsTransactionInput) => {
    setError(null)
    startTransition(async () => {
      const result = await createSavingsTransactionAction(data)
      if (result?.error) {
        setError(result.error)
        return
      }
      reset({ type: 'deposit', amount: undefined, notes: '' })
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-4 max-w-md">
      <p className="text-sm font-medium">Nouvelle opération</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select id="type" className="w-full rounded-md border px-3 py-2 text-sm" {...register('type')}>
            <option value="deposit">Dépôt (mettre de côté)</option>
            <option value="withdrawal">Retrait (utiliser l'épargne)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Montant</Label>
          <Input id="amount" type="number" step="0.01" {...register('amount')} />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (facultatif)</Label>
        <Input id="notes" placeholder="Ex: réserve pour réapprovisionnement" {...register('notes')} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </form>
  )
}
