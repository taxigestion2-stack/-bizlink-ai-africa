type ReportRow = {
  id: string
  period_start: string
  period_end: string
  opening_stock_value: number
  purchases_value: number
  sales_value: number
  closing_stock_value: number
  losses: number
}

function getPeriodLabel(periodStart: string, periodEnd: string): string {
  const start = new Date(periodStart)
  const end = new Date(periodEnd)
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  if (start.getDate() === 1 && start.getMonth() === 0 && end.getMonth() === 11 && days >= 365) {
    return 'Annuel'
  }
  if (start.getDate() === 1 && days >= 27 && days <= 31) {
    return 'Mensuel'
  }
  return 'Personnalisé'
}

export function InventoryReportTable({ reports }: { reports: ReportRow[] }) {
  if (reports.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucun rapport d'inventaire pour le moment.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Type</th>
            <th className="p-3">Période</th>
            <th className="p-3 text-right">Stock initial</th>
            <th className="p-3 text-right">Achats</th>
            <th className="p-3 text-right">Ventes</th>
            <th className="p-3 text-right">Pertes</th>
            <th className="p-3 text-right">Stock final</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => {
            const label = getPeriodLabel(r.period_start, r.period_end)
            return (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  <span
                    className={
                      label === 'Annuel'
                        ? 'inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary'
                        : label === 'Mensuel'
                          ? 'inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
                          : 'inline-flex rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground'
                    }
                  >
                    {label}
                  </span>
                </td>
                <td className="p-3">
                  {new Date(r.period_start).toLocaleDateString('fr-FR')} —{' '}
                  {new Date(r.period_end).toLocaleDateString('fr-FR')}
                </td>
                <td className="p-3 text-right">{r.opening_stock_value.toFixed(2)}</td>
                <td className="p-3 text-right">{r.purchases_value.toFixed(2)}</td>
                <td className="p-3 text-right">{r.sales_value.toFixed(2)}</td>
                <td className="p-3 text-right text-destructive">{r.losses.toFixed(2)}</td>
                <td className="p-3 text-right font-medium">{r.closing_stock_value.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
