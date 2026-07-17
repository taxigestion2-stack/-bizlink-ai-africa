'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expenseSchema, EXPENSE_CATEGORIES, type ExpenseInput } from '@/lib/validations/expense'
import { createExpenseAction } from '@/actions/expenses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ExpenseForm() {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { expenseDate: new Date().toISOString().slice(0, 10) },
  })

  const onSubmit = (data: ExpenseInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = await createExpenseAction(data)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <select id="category" className="w-full rounded-md border px-3 py-2 text-sm" {...register('category')}>
            <option value="">Choisir...</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Montant</Label>
          <Input id="amount" type="number" step="0.01" {...register('amount')} />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...register('description')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expenseDate">Date</Label>
          <Input id="expenseDate" type="date" {...register('expenseDate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="receiptUrl">Justificatif (URL)</Label>
          <Input id="receiptUrl" placeholder="https://..." {...register('receiptUrl')} />
        </div>
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Enregistrement...' : 'Enregistrer la dépense'}
      </Button>
    </form>
  )
}
