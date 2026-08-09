import Link from 'next/link'

type DebtRow = {
  id: string
  original_amount: number
  remaining_amount: number
  status: 'open' | 'partial' | 'paid'
  due_date: string | null
  customer: { name: string; phone: string | null } | null
}

const STATUS_LABEL: Record<DebtRow['status'], string> = {
  open: 'Ouverte',
  partial: 'Partiellement payée',
  paid: 'Soldée',
}

const STATUS_CLASS: Record<DebtRow['status'], string> = {
  open: 'bg-destructive/15 text-destructive',
  partial: 'bg-warning/15 text-warning',
  paid: 'bg-success/15 text-success',
}

export function DebtTable({ debts }: { debts: DebtRow[] }) {
  if (debts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">Aucune dette enregistrée.</p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Client</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Échéance</th>
            <th className="p-3 text-right">Montant initial</th>
            <th className="p-3 text-right">Solde restant</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {debts.map((debt) => (
            <tr key={debt.id} className="border-t">
              <td className="p-3">
                <div className="font-medium">{debt.customer?.name ?? 'Client supprimé'}</div>
                {debt.customer?.phone && (
                  <div className="text-xs text-muted-foreground">{debt.customer.phone}</div>
                )}
              </td>
              <td className="p-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[debt.status]}`}>
                  {STATUS_LABEL[debt.status]}
                </span>
              </td>
              <td className="p-3">
                {debt.due_date ? new Date(debt.due_date).toLocaleDateString('fr-FR') : '—'}
              </td>
              <td className="p-3 text-right">{debt.original_amount.toFixed(2)}</td>
              <td className="p-3 text-right font-medium">{debt.remaining_amount.toFixed(2)}</td>
              <td className="p-3 text-right">
                <Link href={`/debts/${debt.id}`} className="text-sm underline">
                  Détails
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
