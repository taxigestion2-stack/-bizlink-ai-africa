import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Client Supabase pour Server Components et Server Actions.
 * Respecte RLS : les requêtes s'exécutent avec l'identité de l'utilisateur connecté.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, any> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll appelé depuis un Server Component : ignoré si le
            // middleware gère déjà le rafraîchissement de session.
          }
        },
      },
    }
  )
}

/**
 * Client "admin" utilisant la service_role key.
 * Bypasse RLS — à utiliser UNIQUEMENT dans des Route Handlers de confiance
 * (webhooks de paiement, cron d'inventaire). Ne jamais exposer côté client.
 */
export function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
