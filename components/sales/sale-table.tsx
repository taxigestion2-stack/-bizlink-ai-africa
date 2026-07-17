type SaleRow = {
  id: string
  sale_date: string
  total_amount: number
  profit: number
  payment_status: 'paid' | 'partial' | 'unpaid'
  customer: { name: string } | null
  items: { id: string }[]
}

const STATUS_LABEL: Record<SaleRow['payment_status'], string> = {
  paid: 'Payé',
  partial: 'Partiel',
  unpaid: 'Non payé',
}

const STATUS_CLASS: Record<SaleRow['payment_status'], string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  unpaid: 'bg-red-100 text-red-700',
}

export function SaleTable({ sales }: { sales: SaleRow[] }) {
  if (sales.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucune vente enregistrée pour le moment.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Client</th>
            <th className="p-3">Lignes</th>
            <th className="p-3">Statut</th>
            <th className="p-3 text-right">Bénéfice</th>
            <th className="p-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className="border-t">
              <td className="p-3">{new Date(sale.sale_date).toLocaleDateString('fr-FR')}</td>
              <td className="p-3">{sale.customer?.name ?? 'Client de passage'}</td>
              <td className="p-3">{sale.items?.length ?? 0} produit(s)</td>
              <td className="p-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[sale.payment_status]}`}>
                  {STATUS_LABEL[sale.payment_status]}
                </span>
              </td>
              <td className="p-3 text-right">{sale.profit.toFixed(2)}</td>
              <td className="p-3 text-right font-medium">{sale.total_amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
