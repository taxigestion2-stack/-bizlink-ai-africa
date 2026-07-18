'use client'

import { useState, useTransition } from 'react'
import { PLAN_DETAILS, type PlanKey } from '@/lib/plans'
import { startSubscriptionCheckoutAction } from '@/actions/payments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DRC_OPERATORS = [
  { code: 'VODACOM_MPESA_COD', label: 'Vodacom M-Pesa' },
  { code: 'AIRTEL_COD', label: 'Airtel Money' },
  { code: 'ORANGE_COD', label: 'Orange Money' },
]

export function PlanCards({ currentPlan }: { currentPlan: PlanKey }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [mobileProvider, setMobileProvider] = useState(DRC_OPERATORS[0].code)

  const handleManualDemo = (plan: PlanKey) => {
    setError(null)
    setLoadingPlan(plan)
    startTransition(async () => {
      const result = await startSubscriptionCheckoutAction(plan, 'manual')
      if (result.error) {
        setError(result.error)
        setLoadingPlan(null)
        return
      }
      if (result.redirectUrl) window.location.href = result.redirectUrl
    })
  }

  const handleMobileMoney = (plan: PlanKey) => {
    if (!phoneNumber) {
      setError('Merci de renseigner un numéro de téléphone.')
      return
    }
    setError(null)
    setLoadingPlan(plan)
    startTransition(async () => {
      const result = await startSubscriptionCheckoutAction(plan, 'pawapay', {
        phoneNumber,
        mobileProvider,
        currency: 'CDF',
      })
      if (result.error) {
        setError(result.error)
        setLoadingPlan(null)
        return
      }
      if (result.redirectUrl) window.location.href = result.redirectUrl
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
                className={`rounded-lg border bg-card p-5 space-y-3 ${isCurrent ? 'border-primary ring-1 ring-primary' : ''}`}
              >
                <div>
                  <p className="font-semibold">{plan.label}</p>
                  <p className="font-mono text-2xl font-bold mt-1">
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
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      disabled={isPending}
                      onClick={() => setSelectedPlan(selectedPlan === key ? null : key)}
                    >
                      {loadingPlan === key ? 'Redirection...' : `Passer à ${plan.label}`}
                    </Button>

                    {selectedPlan === key && (
                      <div className="space-y-3 rounded-md border p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Payer par Mobile Money (PawaPay)
                        </p>
                        <div className="space-y-1">
                          <Label htmlFor={`operator-${key}`}>Opérateur</Label>
                          <select
                            id={`operator-${key}`}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={mobileProvider}
                            onChange={(e) => setMobileProvider(e.target.value)}
                          >
                            {DRC_OPERATORS.map((op) => (
                              <option key={op.code} value={op.code}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`phone-${key}`}>Numéro (ex: 243812345678)</Label>
                          <Input
                            id={`phone-${key}`}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="243..."
                          />
                        </div>
                        <Button
                          className="w-full"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleMobileMoney(key)}
                        >
                          Confirmer le paiement Mobile Money
                        </Button>
                        <button
                          type="button"
                          className="w-full text-center text-xs text-muted-foreground underline"
                          onClick={() => handleManualDemo(key)}
                        >
                          Utiliser le paiement de démonstration à la place
                        </button>
                      </div>
                    )}
                  </div>
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
