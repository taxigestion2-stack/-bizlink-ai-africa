import type { Metadata } from 'next'
import { ExpenseForm } from '@/components/expenses/expense-form'

export const metadata: Metadata = { title: 'Nouvelle dépense — BizLink AI Africa' }

export default function NewExpensePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nouvelle dépense</h1>
      <ExpenseForm />
    </div>
  )
}
