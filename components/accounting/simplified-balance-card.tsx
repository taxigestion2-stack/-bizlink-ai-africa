type Balance = {
  stockValue: number
  savingsBalance: number
  receivables: number
  totalAssets: number
}

export function SimplifiedBalanceCard({ balance }: { balance: Balance }) {
  const rows = [
    { label: 'Valeur du stock', value: balance.stockValue },
    { label: "Épargne", value: balance.savingsBalance },
    { label: 'Créances clients (dettes à recevoir)', value: balance.receivables },
  ]

  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm font-medium mb-1">Bilan simplifié</p>
      <p className="text-xs text-muted-foreground mb-4">
        Photographie de ce que vaut votre commerce aujourd'hui — approximation utile, pas un bilan comptable
        officiel à partie double.
      </p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{row.label}</span>
            <span className="font-mono">{row.value.toFixed(2)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-2 mt-2 text-sm font-semibold">
          <span>Total actif estimé</span>
          <span className="font-mono text-primary">{balance.totalAssets.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
