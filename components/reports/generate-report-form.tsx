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

function currentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

function currentYearRange() {
  const now = new Date()
  return {
    start: `${now.getFullYear()}-01-01`,
    end: `${now.getFullYear()}-12-31`,
  }
}

function previousYearRange() {
  const year = new Date().getFullYear() - 1
  return { start: `${year}-01-01`, end: `${year}-12-31` }
}

export function GenerateReportForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const defaults = defaultPreviousMonthRange()
  const [periodStart, setPeriodStart] = useState(defaults.start)
  const [periodEnd, setPeriodEnd] = useState(defaults.end)

  const generate = (start: string, end: string) => {
    setPeriodStart(start)
    setPeriodEnd(end)
    setError(null)
    startTransition(async () => {
      const result = await generateInventoryReportAction(start, end)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const handleGenerate = () => generate(periodStart, periodEnd)

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <p className="text-sm font-medium mb-2">Générer rapidement</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => generate(currentMonthRange().start, currentMonthRange().end)}>
            📅 Ce mois-ci
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => generate(defaultPreviousMonthRange().start, defaultPreviousMonthRange().end)}>
            📅 Le mois dernier
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => generate(currentYearRange().start, currentYearRange().end)}>
            🗓️ Cette année
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => generate(previousYearRange().start, previousYearRange().end)}>
            🗓️ L'année dernière
          </Button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Ou choisir une période personnalisée</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="periodStart">Début</Label>
            <Input id="periodStart" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="periodEnd">Fin</Label>
            <Input id="periodEnd" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? 'Génération...' : 'Générer'}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Un rapport mensuel est aussi généré automatiquement le 1er de chaque mois pour le mois écoulé.
      </p>
    </div>
  )
}
