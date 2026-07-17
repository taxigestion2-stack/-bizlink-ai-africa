type PurchaseRow = {
  id: string
  purchase_date: string
  total_amount: number
  supplier: { name: string } | null
  items: { id: string }[]
}

export function PurchaseTable({ purchases }: { purchases: PurchaseRow[] }) {
  if (purchases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucun achat enregistré pour le moment.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Fournisseur</th>
            <th className="p-3">Lignes</th>
            <th className="p-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr key={purchase.id} className="border-t">
              <td className="p-3">{new Date(purchase.purchase_date).toLocaleDateString('fr-FR')}</td>
              <td className="p-3">{purchase.supplier?.name ?? '—'}</td>
              <td className="p-3">{purchase.items?.length ?? 0} produit(s)</td>
              <td className="p-3 text-right font-medium">{purchase.total_amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
