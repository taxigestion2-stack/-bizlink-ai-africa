'use client'

import { Button } from '@/components/ui/button'
import { arrayToCsv, downloadCsv } from '@/lib/csv'

type JournalEntry = {
  date: string
  type: string
  label: string
  amount: number
  direction: 'in' | 'out'
}

const TYPE_LABEL: Record<string, string> = {
  sale: 'Vente',
  purchase: 'Achat',
  expense: 'Dépense',
  savings_deposit: 'Épargne (dépôt)',
  savings_withdrawal: 'Épargne (retrait)',
}

export function JournalTable({ entries }: { entries: JournalEntry[] }) {
  const handleExport = () => {
    const csv = arrayToCsv(
      ['Date', 'Type', 'Libellé', 'Sens', 'Montant'],
      entries.map((e) => [
        new Date(e.date).toLocaleDateString('fr-FR'),
        TYPE_LABEL[e.type] ?? e.type,
        e.label,
        e.direction === 'in' ? 'Entrée' : 'Sortie',
        e.amount.toFixed(2),
      ])
    )
    downloadCsv(`journal-comptable-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Journal des mouvements ({entries.length})</p>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={entries.length === 0}>
          📊 Exporter en CSV
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Aucun mouvement sur cette période.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left sticky top-0">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Libellé</th>
                <th className="p-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                  <td className="p-3 text-muted-foreground">{TYPE_LABEL[e.type] ?? e.type}</td>
                  <td className="p-3">{e.label}</td>
                  <td
                    className={`p-3 text-right font-mono ${
                      e.direction === 'in' ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {e.direction === 'in' ? '+' : '-'}
                    {e.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
