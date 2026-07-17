'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateInventoryReportAction } from '@/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function defaultPreviousMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 0)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export function GenerateReportForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const defaults = defaultPreviousMonthRange()
  const [periodStart, setPeriodStart] = useState(defaults.start)
  const [periodEnd, setPeriodEnd] = useState(defaults.end)

  const handleGenerate = () => {
    setError(null)
    startTransition(async () => {
      const result = await generateInventoryReportAction(periodStart, periodEnd)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Générer un rapport manuellement</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="periodStart">Début</Label>
          <Input
            id="periodStart"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="periodEnd">Fin</Label>
          <Input id="periodEnd" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </div>
        <Button onClick={handleGenerate} disabled={isPending}>
          {isPending ? 'Génération...' : 'Générer'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Un rapport est aussi généré automatiquement le 1er de chaque mois pour le mois écoulé.
      </p>
    </div>
  )
}
