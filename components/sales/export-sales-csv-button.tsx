'use client'

import { Button } from '@/components/ui/button'
import { arrayToCsv, downloadCsv } from '@/lib/csv'

const STATUS_LABEL = {
  paid: 'Payé',
  partial: 'Partiel',
  unpaid: 'Non payé',
}

export function ExportSalesCsvButton({ sales }) {
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
