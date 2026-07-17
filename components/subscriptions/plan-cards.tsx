'use client'

import { useState, useTransition } from 'react'
import { PLAN_DETAILS, type PlanKey } from '@/lib/plans'
import { startSubscriptionCheckoutAction } from '@/actions/payments'
import { Button } from '@/components/ui/button'

export function PlanCards({ currentPlan }: { currentPlan: PlanKey }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)

  const handleUpgrade = (plan: PlanKey) => {
    setError(null)
    setLoadingPlan(plan)
    startTransition(async () => {
      const result = await startSubscriptionCheckoutAction(plan, 'manual')
      if (result.error) {
        setError(result.error)
        setLoadingPlan(null)
        return
      }
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.entries(PLAN_DETAILS) as [PlanKey, (typeof PLAN_DETAILS)[PlanKey]][]).map(
          ([key, plan]) => {
            const isCurrent = key === currentPlan
            return (
              <div
                key={key}
                className={`rounded-lg border p-5 space-y-3 ${isCurrent ? 'border-primary ring-1 ring-primary' : ''}`}
              >
                <div>
                  <p className="font-semibold">{plan.label}</p>
                  <p className="text-2xl font-bold mt-1">
                    {plan.price === 0 ? 'Gratuit' : `${plan.price}$`}
                    {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mois</span>}
                  </p>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button className="w-full" disabled variant="outline">
                    Plan actuel
                  </Button>
                ) : key === 'free' ? (
                  <Button className="w-full" disabled variant="outline">
                    —
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={isPending}
                    onClick={() => handleUpgrade(key)}
                  >
                    {loadingPlan === key ? 'Redirection...' : `Passer à ${plan.label}`}
                  </Button>
                )}
              </div>
            )
          }
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
