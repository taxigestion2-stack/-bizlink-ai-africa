type SavingsRow = {
  id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  notes: string | null
  created_at: string
}

export function SavingsBalanceCard({ balance }: { balance: number }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">Solde d'épargne actuel</p>
      <p className="font-mono text-3xl font-semibold mt-1 text-primary">{balance.toFixed(2)}</p>
    </div>
  )
}

export function SavingsHistoryTable({ transactions }: { transactions: SavingsRow[] }) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucune opération d'épargne pour le moment.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Type</th>
            <th className="p-3">Notes</th>
            <th className="p-3 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="p-3">{new Date(t.created_at).toLocaleString('fr-FR')}</td>
              <td className="p-3">
                <span
                  className={
                    t.type === 'deposit'
                      ? 'inline-flex rounded-full bg-success/15 px-2 py-0.5 text-xs text-success'
                      : 'inline-flex rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning'
                  }
                >
                  {t.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                </span>
              </td>
              <td className="p-3 text-muted-foreground">{t.notes ?? '—'}</td>
              <td
                className={`p-3 text-right font-mono ${
                  t.type === 'deposit' ? 'text-success' : 'text-warning'
                }`}
              >
                {t.type === 'deposit' ? '+' : '-'}
                {t.amount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
