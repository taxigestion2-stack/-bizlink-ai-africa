import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Connexion — BizLink AI Africa' }

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-center">Connexion</h2>
      <LoginForm />
    </div>
  )
}
