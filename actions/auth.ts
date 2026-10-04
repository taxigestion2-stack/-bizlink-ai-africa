'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkPersistentRateLimit } from '@/lib/persistent-rate-limit'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '@/lib/validations/auth'

export type ActionResult = { error: string | null }

/**
 * Inscription.
 *
 * La création de `organizations` + `profiles` + `subscriptions`
 * est déléguée au trigger SQL `handle_new_user`
 * (voir 003_triggers_functions.sql).
 *
 * On passe simplement les métadonnées nécessaires
 * dans `options.data`.
 */
export async function signUp(
  input: RegisterInput,
  referralCode?: string,
  affiliateCode?: string
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Données invalides',
    }
  }

  const supabase = await createClient()
  const { fullName, organizationName, email, password } = parsed.data

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        organization_name: organizationName,
        // Captés par le trigger SQL handle_new_user.
        referral_code: referralCode || undefined,
        affiliate_code: affiliateCode || undefined,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error('signUp error:', error.message)
    return { error: translateAuthError(error.message) }
  }

  redirect('/login?registered=1')
}

export async function signIn(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Données invalides',
    }
  }

  // 5 tentatives / 5 minutes par e-mail —
  // anti brute-force sur les mots de passe.
  const rateLimit = await checkPersistentRateLimit(
    `login:${parsed.data.email.toLowerCase()}`,
    5,
    5 * 60
  )

  if (!rateLimit.allowed) {
    return {
      error: 'Trop de tentatives. Merci de réessayer dans quelques minutes.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    console.error('signIn error:', error.message)
    return { error: translateAuthError(error.message) }
  }

  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error || !data?.url) {
    redirect('/login?error=oauth')
  }

  redirect(data.url)
}

export async function requestPasswordReset(
  input: ForgotPasswordInput
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Données invalides',
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    }
  )

  // On ne révèle jamais si l'e-mail existe ou non
  // afin d'éviter l'énumération de comptes.
  if (error) {
    console.error('resetPasswordForEmail error:', error.message)
  }

  return { error: null }
}

export async function resetPassword(
  input: ResetPasswordInput
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Données invalides',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    console.error('resetPassword error:', error.message)
    return { error: translateAuthError(error.message) }
  }

  redirect('/login?reset=1')
}

function translateAuthError(message: string): string {
  const normalized = message.toLowerCase()

  const map: Record<string, string> = {
    'invalid login credentials':
      'E-mail ou mot de passe incorrect.',
    'user already registered':
      'Un compte existe déjà avec cet e-mail.',
    'email not confirmed':
      'Merci de confirmer votre e-mail avant de vous connecter.',
    'password should be at least 6 characters':
      'Le mot de passe est trop court.',
  }

  if (map[message]) {
    return map[message]
  }

  if (
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('too many attempts')
  ) {
    return 'Trop de tentatives. Merci de patienter quelques minutes avant de réessayer.'
  }

  if (
    normalized.includes('email') &&
    normalized.includes('invalid')
  ) {
    return 'Adresse e-mail invalide.'
  }

  if (
    normalized.includes('password') &&
    normalized.includes('weak')
  ) {
    return 'Le mot de passe est trop faible.'
  }

  console.error('Unhandled Supabase auth error:', message)

  return 'Une erreur est survenue. Merci de réessayer.'
}