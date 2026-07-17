'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { resetPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = (data: ResetPasswordInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = await resetPassword(data)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
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
        {isPending ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
      </Button>
    </form>
  )
}
