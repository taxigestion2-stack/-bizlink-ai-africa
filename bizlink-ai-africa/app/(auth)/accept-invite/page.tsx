import type { Metadata } from 'next'
import { AcceptInviteForm } from '@/components/auth/accept-invite-form'

export const metadata: Metadata = { title: 'Rejoindre l\'équipe — BizLink AI Africa' }

export default function AcceptInvitePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-center">Bienvenue dans l'équipe 🎉</h2>
      <p className="text-sm text-muted-foreground text-center">
        Définissez votre mot de passe pour accéder à votre espace de travail.
      </p>
      <AcceptInviteForm />
    </div>
  )
}
