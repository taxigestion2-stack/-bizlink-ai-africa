'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { debtPaymentSchema, type DebtPaymentInput } from '@/lib/validations/debt'
import { addDebtPaymentAction } from '@/actions/debts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DebtPaymentForm({ debtId, remainingAmount }: { debtId: string; remainingAmount: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DebtPaymentInput>({
    resolver: zodResolver(debtPaymentSchema),
    defaultValues: { paymentDate: new Date().toISOString().slice(0, 10) },
  })

  const onSubmit = (data: DebtPaymentInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = await addDebtPaymentAction(debtId, data)
      if (result?.error) {
        setServerError(result.error)
        return
      }
      reset({ amount: undefined, paymentDate: new Date().toISOString().slice(0, 10), notes: '' })
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        Solde restant : <span className="font-medium text-foreground">{remainingAmount.toFixed(2)}</span>
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Montant payé</Label>
          <Input id="amount" type="number" step="0.01" {...register('amount')} />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentDate">Date</Label>
          <Input id="paymentDate" type="date" {...register('paymentDate')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" {...register('notes')} />
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Enregistrement...' : 'Enregistrer le paiement'}
      </Button>
    </form>
  )
}
