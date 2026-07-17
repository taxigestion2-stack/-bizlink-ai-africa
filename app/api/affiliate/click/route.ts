import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Route publique (non authentifiée) appelée quand quelqu'un clique sur un
 * lien d'affiliation du type /api/affiliate/click?code=AFFXXXX&next=/register.
 * Enregistre le clic puis redirige vers la destination avec ?aff=code
 * préservé pour l'attribution à l'inscription (voir actions/auth.ts).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/register'

  if (!code) {
    return NextResponse.redirect(`${origin}/register`)
  }

  const supabase = createServiceRoleClient()

  const { data: account } = await supabase
    .from('affiliate_accounts')
    .select('id, total_clicks')
    .eq('affiliate_code', code)
    .eq('status', 'approved')
    .maybeSingle()

  if (account) {
    await supabase.from('affiliate_clicks').insert({
      affiliate_account_id: account.id,
      referrer_url: request.headers.get('referer'),
    })
    await supabase
      .from('affiliate_accounts')
      .update({ total_clicks: Number(account.total_clicks) + 1 })
      .eq('id', account.id)
  }

  const destination = new URL(next, origin)
  destination.searchParams.set('aff', code)
  return NextResponse.redirect(destination.toString())
}
