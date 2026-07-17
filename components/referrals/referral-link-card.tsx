'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ReferralLinkCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const link = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${code}` : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">Votre lien de parrainage</p>
        <p className="text-xs text-muted-foreground">
          Partagez-le avec d'autres commerçants. Vous recevez une récompense dès qu'un filleul
          souscrit à un abonnement payant.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">{link}</code>
        <Button type="button" size="sm" onClick={handleCopy}>
          {copied ? 'Copié !' : 'Copier'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Code : <span className="font-mono">{code}</span></p>
    </div>
  )
}
