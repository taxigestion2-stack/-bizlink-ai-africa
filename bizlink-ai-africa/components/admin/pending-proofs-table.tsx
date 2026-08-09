'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { reviewPaymentProofAction } from '@/actions/payment-proof'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ProofRow = {
  id: string
  reference_number: string | null
  amount: number
  currency: string
  payment_method: string | null
  proof_transaction_id: string | null
  created_at: string
  organization: { name: string } | null
  metadata: { plan?: string } | null
}

const METHOD_LABEL: Record<string, string> = {
  mobile_money: 'Mobile Money',
  bank_transfer: 'Virement bancaire',
}

export function PendingProofsTable({
  proofs,
  screenshotUrls,
}: {
  proofs: ProofRow[]
  screenshotUrls: Record<string, string>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const handleReview = (transactionId: string, approve: boolean) => {
    setError(null)
    startTransition(async () => {
      const result = await reviewPaymentProofAction({
        transactionId,
        approve,
        reviewNotes: notes[transactionId],
      })
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  if (proofs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucune preuve de paiement en attente. 👍
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {proofs.map((proof) => (
        <div key={proof.id} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{proof.organization?.name ?? 'Organisation inconnue'}</p>
              <p className="text-xs text-muted-foreground">
                Réf. <span className="font-mono">{proof.reference_number}</span> — {new Date(proof.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
            <span className="font-mono text-lg font-semibold">
              {proof.amount.toFixed(2)} {proof.currency}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Plan demandé</p>
              <p className="capitalize">{proof.metadata?.plan ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mode de paiement</p>
              <p>{proof.payment_method ? METHOD_LABEL[proof.payment_method] : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ID transaction fourni</p>
              <p className="font-mono">{proof.proof_transaction_id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Capture de preuve</p>
              {screenshotUrls[proof.id] ? (
                <a
                  href={screenshotUrls[proof.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Voir la preuve
                </a>
              ) : (
                <span className="text-muted-foreground">Indisponible</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Commentaire (optionnel, ex: raison du refus)"
              value={notes[proof.id] ?? ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [proof.id]: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleReview(proof.id, true)}
              >
                ✅ Valider et activer
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => handleReview(proof.id, false)}
              >
                ❌ Refuser
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
