import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = { title: 'Réinitialiser le mot de passe — BizLink AI Africa' }

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-center">Nouveau mot de passe</h2>
      <ResetPasswordForm />
    </div>
  )
}
