'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function AffiliateLinkCard({ code, status }: { code: string; status: 'pending' | 'approved' | 'suspended' }) {
  const [copied, setCopied] = useState(false)
  const link =
    typeof window !== 'undefined' ? `${window.location.origin}/api/affiliate/click?code=${code}` : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'pending') {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
        Votre candidature est en cours de validation par l'équipe BizLink AI Africa.
      </div>
    )
  }

  if (status === 'suspended') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Votre compte affilié est suspendu. Contactez le support pour plus d'informations.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <p className="text-sm font-medium">Votre lien d'affiliation</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">{link}</code>
        <Button type="button" size="sm" onClick={handleCopy}>
          {copied ? 'Copié !' : 'Copier'}
        </Button>
      </div>
    </div>
  )
}
