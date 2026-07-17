'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { generateInventoryReport } from '@/services/inventory.service'

export type ActionResult = { error: string | null }

/**
 * Génération manuelle depuis le dashboard (en plus du cron automatique).
 * Utilise le client service_role car `inventory_reports` n'a pas de policy
 * d'écriture pour les utilisateurs normaux (voir 002_rls_policies.sql) —
 * on vérifie donc explicitement l'appartenance à l'organisation ici.
 */
export async function generateInventoryReportAction(
  periodStart: string,
  periodEnd: string
): Promise<ActionResult> {
  const { organization, profile } = await requireProfile()

  if (profile.role !== 'admin') {
    return { error: 'Seul un administrateur peut générer un rapport d\'inventaire.' }
  }

  const supabase = createServiceRoleClient()

  try {
    await generateInventoryReport(supabase, organization.id, periodStart, periodEnd)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/reports')
  return { error: null }
}
