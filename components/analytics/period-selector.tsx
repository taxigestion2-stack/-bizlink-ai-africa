'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const OPTIONS = [
  { days: 7, label: '7 jours' },
  { days: 30, label: '30 jours' },
  { days: 90, label: '90 jours' },
]

export function PeriodSelector({ currentDays }: { currentDays: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSelect = (days: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('days', String(days))
    router.push(`/analytics?${params.toString()}`)
  }

  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.days}
          onClick={() => handleSelect(opt.days)}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            currentDays === opt.days
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
