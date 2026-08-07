'use client'

import { Button } from '@/components/ui/button'
import { arrayToCsv, downloadCsv } from '@/lib/csv'

export function ExportExpensesCsvButton({ expenses }) {
  const handleExport = () => {
    const csv = arrayToCsv(
      ['Date', 'Catégorie', 'Description', 'Montant'],
      expenses.map((expense) => [
        new Date(expense.expense_date).toLocaleDateString('fr-FR'),
        expense.category,
        expense.description ?? '',
        expense.amount.toFixed(2),
      ])
    )
    downloadCsv(`depenses-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={expenses.length === 0}>
      📊 Exporter en CSV
    </Button>
  )
}
