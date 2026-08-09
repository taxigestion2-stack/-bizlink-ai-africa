import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = { title: 'Mot de passe oublié — BizLink AI Africa' }

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-center">Mot de passe oublié</h2>
      <ForgotPasswordForm />
    </div>
  )
}
