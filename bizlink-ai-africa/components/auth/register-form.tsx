'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RegisterForm({
  referralCode,
  affiliateCode,
}: {
  referralCode?: string
  affiliateCode?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = (data: RegisterInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = await signUp(data, referralCode, affiliateCode)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <div className="space-y-6">
      {referralCode && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Vous vous inscrivez grâce à un lien de parrainage 🎉
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input id="fullName" placeholder="Votre nom" {...register('fullName')} />
          {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationName">Nom du commerce</Label>
          <Input id="organizationName" placeholder="Ex: Alimentation Chez Mama" {...register('organizationName')} />
          {errors.organizationName && (
            <p className="text-sm text-red-500">{errors.organizationName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="vous@commerce.com" {...register('email')} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-red-500">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Création du compte...' : 'Créer mon compte'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-foreground underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
