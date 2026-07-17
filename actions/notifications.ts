'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'

export type ActionResult = { error: string | null }

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  await requireProfile()
  const supabase = await createClient()

  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { error: null }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const { organization } = await requireProfile()
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('organization_id', organization.id)
    .eq('is_read', false)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { error: null }
}
