'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { requestWithdrawalAction } from '@/actions/affiliate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function WithdrawalForm({ affiliateAccountId, available }: { affiliateAccountId: string; available: number }) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await requestWithdrawalAction(affiliateAccountId, Number(amount))
      if (result?.error) {
        setError(result.error)
        return
      }
      setAmount('')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3">
      <p className="text-sm">
        Solde disponible : <span className="font-medium">{available.toFixed(2)}</span>
      </p>
      <div className="flex items-end gap-2">
        <div className="space-y-1 flex-1">
          <Label htmlFor="withdrawAmount">Montant à retirer</Label>
          <Input
            id="withdrawAmount"
            type="number"
            step="0.01"
            max={available}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isPending || !amount}>
          {isPending ? 'Envoi...' : 'Demander'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  )
}
