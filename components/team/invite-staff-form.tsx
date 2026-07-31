'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inviteStaffSchema, type InviteStaffInput } from '@/lib/validations/staff'
import { inviteStaffAction } from '@/actions/staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function InviteStaffForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteStaffInput>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: { role: 'staff' },
  })

  const onSubmit = (data: InviteStaffInput) => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await inviteStaffAction(data)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      reset({ email: '', fullName: '', role: 'staff' })
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-4 max-w-md">
      <p className="text-sm font-medium">Inviter un membre de l'équipe</p>

      <div className="space-y-2">
        <Label htmlFor="fullName">Nom complet</Label>
        <Input id="fullName" {...register('fullName')} />
        {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" placeholder="employe@exemple.com" {...register('email')} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rôle</Label>
        <select id="role" className="w-full rounded-md border px-3 py-2 text-sm" {...register('role')}>
          <option value="staff">Employé (accès limité)</option>
          <option value="admin">Administrateur (accès complet)</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <p className="text-sm text-success">
          Invitation envoyée ! La personne recevra un e-mail pour créer son mot de passe.
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Envoi...' : "Envoyer l'invitation"}
      </Button>
    </form>
  )
}
