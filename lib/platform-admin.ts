import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * À utiliser dans les pages réservées aux opérateurs de BizLink AI Africa
 * eux-mêmes (ex: vérification des preuves de paiement de TOUTES les
 * organisations) — différent de `requireProfile` qui ne garantit qu'un rôle
 * "admin" au sein d'une seule organisation cliente.
 */
export async function requirePlatformAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Vérification via service_role : la table platform_admins n'expose que
  // la ligne de l'utilisateur lui-même via RLS, donc on utilise service_role
  // ici pour une vérification fiable indépendante de la policy RLS.
  const serviceClient = createServiceRoleClient()
  const { data } = await serviceClient
    .from('platform_admins')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!data) {
    redirect('/dashboard')
  }

  return { userId: user.id }
}
