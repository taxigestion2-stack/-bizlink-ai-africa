type TransactionRow = {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  provider: string
  created_at: string
}

const STATUS_LABEL: Record<TransactionRow['status'], string> = {
  pending: 'En attente',
  paid: 'Payé',
  failed: 'Échoué',
  refunded: 'Remboursé',
}

const STATUS_CLASS: Record<TransactionRow['status'], string> = {
  pending: 'bg-warning/15 text-warning',
  paid: 'bg-success/15 text-success',
  failed: 'bg-destructive/15 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
}

export function PaymentHistoryTable({ transactions }: { transactions: TransactionRow[] }) {
  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Aucun paiement pour le moment.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Fournisseur</th>
            <th className="p-3">Statut</th>
            <th className="p-3 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="p-3">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
              <td className="p-3">{t.provider}</td>
              <td className="p-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[t.status]}`}>
                  {STATUS_LABEL[t.status]}
                </span>
              </td>
              <td className="p-3 text-right font-medium">
                {t.amount.toFixed(2)} {t.currency}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
