import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateInventoryReport, getPreviousMonthRange } from '@/services/inventory.service'

/**
 * Déclenché par un Cron Job (ex: Vercel Cron, `0 2 1 * *` — le 1er de chaque
 * mois à 2h du matin) pour générer le rapport d'inventaire du mois écoulé,
 * pour toutes les organisations actives.
 *
 * Sécurisé par un secret partagé (jamais par une simple absence d'auth) :
 * configurer CRON_SECRET côté Vercel/Supabase et appeler cette route avec
 * l'en-tête `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { periodStart, periodEnd } = getPreviousMonthRange()

  const { data: organizations, error } = await supabase.from('organizations').select('id')
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = await Promise.allSettled(
    (organizations ?? []).map((org: { id: string }) =>
      generateInventoryReport(supabase, org.id, periodStart, periodEnd)
    )
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({
    period: { periodStart, periodEnd },
    organizations: organizations?.length ?? 0,
    succeeded,
    failed,
  })
}
