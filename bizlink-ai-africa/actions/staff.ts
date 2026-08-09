'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { inviteStaffSchema, type InviteStaffInput } from '@/lib/validations/staff'
import * as staffService from '@/services/staff.service'

export type ActionResult = { error: string | null }

export async function inviteStaffAction(input: InviteStaffInput): Promise<ActionResult> {
  const parsed = inviteStaffSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { organization, profile } = await requireProfile()

  if (profile.role !== 'admin') {
    return { error: 'Seul un administrateur peut inviter un membre.' }
  }

  const serviceClient = createServiceRoleClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  try {
    await staffService.inviteTeamMember(serviceClient, organization.id, parsed.data, siteUrl)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/team')
  return { error: null }
}

export async function updateTeamMemberRoleAction(
  profileId: string,
  role: 'admin' | 'staff'
): Promise<ActionResult> {
  const { profile } = await requireProfile()

  if (profile.role !== 'admin') {
    return { error: 'Seul un administrateur peut modifier un rôle.' }
  }

  const supabase = await createClient()

  try {
    await staffService.updateTeamMemberRole(supabase, profileId, role)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/team')
  return { error: null }
}

export async function toggleTeamMemberActiveAction(
  profileId: string,
  isActive: boolean
): Promise<ActionResult> {
  const { profile } = await requireProfile()

  if (profile.role !== 'admin') {
    return { error: 'Seul un administrateur peut activer/désactiver un membre.' }
  }

  const supabase = await createClient()

  try {
    await staffService.toggleTeamMemberActive(supabase, profileId, isActive)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/team')
  return { error: null }
}
