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

export function InventoryReportTable({ reports }: { reports: ReportRow[] }) {
  if (reports.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucun rapport d'inventaire pour le moment.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Période</th>
            <th className="p-3 text-right">Stock initial</th>
            <th className="p-3 text-right">Achats</th>
            <th className="p-3 text-right">Ventes</th>
            <th className="p-3 text-right">Stock final</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-3">
                {new Date(r.period_start).toLocaleDateString('fr-FR')} —{' '}
                {new Date(r.period_end).toLocaleDateString('fr-FR')}
              </td>
              <td className="p-3 text-right">{r.opening_stock_value.toFixed(2)}</td>
              <td className="p-3 text-right">{r.purchases_value.toFixed(2)}</td>
              <td className="p-3 text-right">{r.sales_value.toFixed(2)}</td>
              <td className="p-3 text-right font-medium">{r.closing_stock_value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
