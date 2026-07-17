'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { applyAsAffiliateAction } from '@/actions/affiliate'
import { Button } from '@/components/ui/button'

export function ApplyAffiliateCard() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleApply = () => {
    setError(null)
    startTransition(async () => {
      const result = await applyAsAffiliateAction()
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border p-6 text-center space-y-3 max-w-md">
      <h2 className="font-medium">Devenez affilié BizLink AI Africa</h2>
      <p className="text-sm text-muted-foreground">
        Gagnez une commission sur chaque commerce que vous apportez et qui souscrit à un
        abonnement payant.
      </p>
      <Button onClick={handleApply} disabled={isPending}>
        {isPending ? 'Envoi...' : 'Devenir affilié'}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
