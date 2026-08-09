'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitPaymentProofAction } from '@/actions/payment-proof'
import { OFFICIAL_MOBILE_MONEY_ACCOUNTS, OFFICIAL_BANK_ACCOUNT } from '@/lib/payment-proof-config'
import { PLAN_DETAILS, type PlanKey } from '@/lib/plans'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProofOfPaymentForm({ organizationId }: { organizationId: string }) {
  const [plan, setPlan] = useState<PlanKey>('starter')
  const [method, setMethod] = useState<'mobile_money' | 'bank_transfer'>('mobile_money')
  const [transactionId, setTransactionId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!file) {
      setError('Merci de joindre une capture d\'écran de la preuve de paiement.')
      return
    }
    if (!transactionId.trim()) {
      setError("Merci de renseigner l'identifiant de transaction.")
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const path = `${organizationId}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(path, file)
      if (uploadError) {
        setError(`Échec du téléversement : ${uploadError.message}`)
        return
      }

      const result = await submitPaymentProofAction({
        plan,
        paymentMethod: method,
        proofTransactionId: transactionId.trim(),
        screenshotPath: path,
        currency: 'USD',
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setReferenceNumber(result.referenceNumber ?? null)
    })
  }

  if (referenceNumber) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/10 p-6 space-y-2">
        <p className="font-medium text-success">Preuve envoyée avec succès ✅</p>
        <p className="text-sm text-muted-foreground">
          Votre paiement est en cours de vérification. Vous recevrez une notification dès qu'il sera validé
          (généralement sous 24h).
        </p>
        <p className="text-sm">
          Votre numéro de référence : <span className="font-mono font-semibold">{referenceNumber}</span>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-card p-5 max-w-lg">
      <div>
        <p className="font-medium">Payer par Mobile Money ou virement (avec preuve)</p>
        <p className="text-xs text-muted-foreground mt-1">
          Utile en attendant l'activation des paiements automatiques dans votre pays.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">Plan à activer</Label>
        <select
          id="plan"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={plan}
          onChange={(e) => setPlan(e.target.value as PlanKey)}
        >
          <option value="starter">Starter — {PLAN_DETAILS.starter.price}$/mois</option>
          <option value="pro">Pro — {PLAN_DETAILS.pro.price}$/mois</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Mode de paiement</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMethod('mobile_money')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm ${
              method === 'mobile_money' ? 'border-primary bg-primary/10 text-primary' : ''
            }`}
          >
            Mobile Money
          </button>
          <button
            type="button"
            onClick={() => setMethod('bank_transfer')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm ${
              method === 'bank_transfer' ? 'border-primary bg-primary/10 text-primary' : ''
            }`}
          >
            Virement bancaire
          </button>
        </div>
      </div>

      {/* Coordonnées officielles */}
      <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
        <p className="font-medium">Coordonnées de paiement</p>
        {method === 'mobile_money' ? (
          <ul className="space-y-1 text-muted-foreground">
            {OFFICIAL_MOBILE_MONEY_ACCOUNTS.map((acc) => (
              <li key={acc.operator}>
                <span className="text-foreground">{acc.operator}</span> — {acc.number} ({acc.name})
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-1 text-muted-foreground">
            <li>Banque : <span className="text-foreground">{OFFICIAL_BANK_ACCOUNT.bankName}</span></li>
            <li>Titulaire : <span className="text-foreground">{OFFICIAL_BANK_ACCOUNT.accountName}</span></li>
            <li>Numéro de compte : <span className="text-foreground">{OFFICIAL_BANK_ACCOUNT.accountNumber}</span></li>
            <li>SWIFT : <span className="text-foreground">{OFFICIAL_BANK_ACCOUNT.swift}</span></li>
          </ul>
        )}
        <p className="text-xs">
          Envoyez le montant exact du plan choisi ({PLAN_DETAILS[plan].price}$), puis remplissez le formulaire
          ci-dessous avec la preuve de votre transaction.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transactionId">Identifiant de la transaction</Label>
        <Input
          id="transactionId"
          placeholder="Ex: MP240812.1234.A56789"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Le code de confirmation reçu par SMS ou affiché sur votre reçu de virement.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="screenshot">Capture d'écran de la preuve</Label>
        <input
          id="screenshot"
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Envoi en cours...' : 'Envoyer la preuve de paiement'}
      </Button>
    </form>
  )
}
