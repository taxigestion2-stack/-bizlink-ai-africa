'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type ReportRow = {
  period_start: string
  period_end: string
  opening_stock_value: number
  purchases_value: number
  sales_value: number
  closing_stock_value: number
  losses: number
}

export function ExportPdfButton({
  reports,
  organizationName,
  plan,
}: {
  reports: ReportRow[]
  organizationName: string
  plan: 'free' | 'starter' | 'pro'
}) {
  const [isGenerating, setIsGenerating] = useState(false)

  if (plan !== 'pro') {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/subscriptions">🔒 Export PDF (plan Pro)</Link>
      </Button>
    )
  }

  const handleExport = async () => {
    setIsGenerating(true)
    try {
      // Chargés dynamiquement : évite d'alourdir le chargement initial de la
      // page pour les organisations qui n'exportent jamais de PDF.
      const { default: jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('BizLink AI Africa', 14, 18)
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(`Rapports d'inventaire — ${organizationName}`, 14, 26)
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 32)

      autoTable(doc, {
        startY: 40,
        head: [['Période', 'Stock initial', 'Achats', 'Ventes', 'Stock final', 'Pertes']],
        body: reports.map((r) => [
          `${new Date(r.period_start).toLocaleDateString('fr-FR')} - ${new Date(r.period_end).toLocaleDateString('fr-FR')}`,
          r.opening_stock_value.toFixed(2),
          r.purchases_value.toFixed(2),
          r.sales_value.toFixed(2),
          r.closing_stock_value.toFixed(2),
          r.losses.toFixed(2),
        ]),
        headStyles: { fillColor: [20, 33, 61] },
        styles: { fontSize: 9 },
      })

      doc.save(`rapport-inventaire-${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isGenerating || reports.length === 0}>
      {isGenerating ? 'Génération...' : '📄 Exporter en PDF'}
    </Button>
  )
}
