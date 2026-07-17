import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = { title: 'Créer un compte — BizLink AI Africa' }

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; aff?: string }>
}) {
  const { ref, aff } = await searchParams

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-center">Créer votre compte</h2>
      <RegisterForm referralCode={ref} affiliateCode={aff} />
    </div>
  )
}
