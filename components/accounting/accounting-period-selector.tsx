'use client'

import { useRouter } from 'next/navigation'

function currentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

function previousMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 0)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

function currentYearRange() {
  const year = new Date().getFullYear()
  return { start: `${year}-01-01`, end: `${year}-12-31` }
}

export function AccountingPeriodSelector({
  periodStart,
  periodEnd,
}: {
  periodStart: string
  periodEnd: string
}) {
  const router = useRouter()

  const go = (start: string, end: string) => {
    router.push(`/accounting?start=${start}&end=${end}`)
  }

  const isActive = (start: string, end: string) => periodStart === start && periodEnd === end

  const options = [
    { ...currentMonthRange(), label: 'Ce mois-ci' },
    { ...previousMonthRange(), label: 'Le mois dernier' },
    { ...currentYearRange(), label: 'Cette année' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => go(opt.start, opt.end)}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            isActive(opt.start, opt.end)
              ? 'border-primary bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
