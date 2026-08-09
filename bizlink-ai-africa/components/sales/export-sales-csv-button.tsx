'use client'

import { Button } from '@/components/ui/button'
import { arrayToCsv, downloadCsv } from '@/lib/csv'

type SaleRow = {
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

export function ExportSalesCsvButton({ sales }: { sales: SaleRow[] }) {
  const handleExport = () => {
    const csv = arrayToCsv(
      ['Date', 'Client', 'Nombre de produits', 'Statut de paiement', 'Bénéfice', 'Total'],
      sales.map((sale) => [
        new Date(sale.sale_date).toLocaleDateString('fr-FR'),
        sale.customer?.name ?? 'Client de passage',
        sale.items?.length ?? 0,
        STATUS_LABEL[sale.payment_status],
        sale.profit.toFixed(2),
        sale.total_amount.toFixed(2),
      ])
    )
    downloadCsv(`ventes-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={sales.length === 0}>
      📊 Exporter en CSV
    </Button>
  )
}
