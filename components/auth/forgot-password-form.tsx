'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { requestPasswordReset } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = (data: ForgotPasswordInput) => {
    startTransition(async () => {
      await requestPasswordReset(data)
      setSent(true)
    })
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d'être
          envoyé. Vérifiez votre boîte de réception.
        </p>
        <Link href="/login" className="text-sm underline">
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" placeholder="vous@commerce.com" {...register('email')} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  )
}
