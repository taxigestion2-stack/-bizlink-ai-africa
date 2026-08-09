import Link from 'next/link'

type StockCountRow = {
  id: string
  completed_at: string
  total_loss_value: number
  notes: string | null
  items: { id: string }[]
}

export function StockCountHistoryTable({ counts }: { counts: StockCountRow[] }) {
  if (counts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucun comptage physique effectué pour le moment.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Produits comptés</th>
            <th className="p-3">Notes</th>
            <th className="p-3 text-right">Pertes constatées</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {counts.map((count) => (
            <tr key={count.id} className="border-t">
              <td className="p-3">{new Date(count.completed_at).toLocaleString('fr-FR')}</td>
              <td className="p-3">{count.items?.length ?? 0}</td>
              <td className="p-3 text-muted-foreground">{count.notes ?? '—'}</td>
              <td className="p-3 text-right font-mono">
                {count.total_loss_value > 0 ? (
                  <span className="text-destructive">{count.total_loss_value.toFixed(2)}</span>
                ) : (
                  <span className="text-success">0.00</span>
                )}
              </td>
              <td className="p-3 text-right">
                <Link href={`/stock-counts/${count.id}`} className="text-sm underline">
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
