'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteExpenseAction } from '@/actions/expenses'
import { Button } from '@/components/ui/button'
import type { Expense } from '@/types/database.types'

export function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return
    startTransition(async () => {
      await deleteExpenseAction(id)
      router.refresh()
    })
  }

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucune dépense enregistrée pour ce mois.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Catégorie</th>
            <th className="p-3">Description</th>
            <th className="p-3 text-right">Montant</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} className="border-t">
              <td className="p-3">{new Date(expense.expense_date).toLocaleDateString('fr-FR')}</td>
              <td className="p-3">{expense.category}</td>
              <td className="p-3 text-muted-foreground">{expense.description ?? '—'}</td>
              <td className="p-3 text-right font-medium">{expense.amount.toFixed(2)}</td>
              <td className="p-3 text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(expense.id)}
                >
                  Supprimer
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
