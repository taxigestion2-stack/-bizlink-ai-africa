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
 * Inscription. La crÃ©ation de `organizations` + `profiles` + `subscriptions`
 * est dÃ©lÃ©guÃ©e au trigger SQL `handle_new_user` (voir 003_triggers_functions.sql) :
 * on passe simplement les mÃ©tadonnÃ©es nÃ©cessaires dans `options.data`.
 */
export async function signUp(
  input: RegisterInput,
  referralCode?: string,
  affiliateCode?: string
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'DonnÃ©es invalides' }
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
        // CaptÃ©s par le trigger SQL handle_new_user (006_affiliate_attribution.sql)
        referral_code: referralCode || undefined,
        affiliate_code: affiliateCode || undefined,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  redirect('/login?registered=1')
}

export async function signIn(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'DonnÃ©es invalides' }
  }

  // 5 tentatives / 5 minutes par e-mail — anti brute-force sur les mots de passe
  const rateLimit = await checkPersistentRateLimit(
    `login:${parsed.data.email.toLowerCase()}`,
    5,
    5 * 60
  )

  if (!rateLimit.allowed) {
    return { error: 'Trop de tentatives. Merci de réessayer dans quelques minutes.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
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

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'DonnÃ©es invalides' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  })

  // On ne rÃ©vÃ¨le jamais si l'e-mail existe ou non (anti Ã©numÃ©ration de comptes)
  if (error) {
    console.error('resetPasswordForEmail error:', error.message)
  }

  return { error: null }
}

export async function resetPassword(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'DonnÃ©es invalides' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  redirect('/login?reset=1')
}

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou mot de passe incorrect.',
    'User already registered': 'Un compte existe dÃ©jÃ  avec cet e-mail.',
    'Email not confirmed': 'Merci de confirmer votre e-mail avant de vous connecter.',
    'Password should be at least 6 characters': 'Le mot de passe est trop court.',
  }
  return map[message] ?? "Une erreur est survenue. Merci de rÃ©essayer."
}
