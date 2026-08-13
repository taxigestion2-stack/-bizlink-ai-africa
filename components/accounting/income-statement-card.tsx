type IncomeStatement = {
  revenue: number
  cogs: number
  grossMargin: number
  grossMarginRate: number
  totalExpenses: number
  netResult: number
}

export function IncomeStatementCard({ statement }: { statement: IncomeStatement }) {
  const rows = [
    { label: "Chiffre d'affaires", value: statement.revenue, emphasis: false },
    { label: 'Coût des marchandises vendues', value: -statement.cogs, emphasis: false },
    { label: 'Marge brute', value: statement.grossMargin, emphasis: true, hint: `${statement.grossMarginRate.toFixed(1)}%` },
    { label: "Dépenses d'exploitation", value: -statement.totalExpenses, emphasis: false },
    { label: 'Résultat net', value: statement.netResult, emphasis: true },
  ]

  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm font-medium mb-4">Compte de résultat</p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-center justify-between text-sm ${
              row.emphasis ? 'border-t pt-2 mt-2 font-semibold' : 'text-muted-foreground'
            }`}
          >
            <span className={row.emphasis ? 'text-foreground' : ''}>
              {row.label} {row.hint && <span className="text-xs text-muted-foreground">({row.hint})</span>}
            </span>
            <span
              className={`font-mono ${row.emphasis ? (row.value >= 0 ? 'text-success' : 'text-destructive') : ''}`}
            >
              {row.value >= 0 ? '' : '-'}
              {Math.abs(row.value).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
