import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/server'

type RateLimitResult = {
  allowed: boolean
  remaining: number
  reset_at: string
}

export async function checkPersistentRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error('Persistent rate limit error:', error.message)

    // Fail closed : si le système de protection est indisponible,
    // on bloque temporairement plutôt que de laisser passer une attaque.
    return {
      allowed: false,
      remaining: 0,
      reset_at: new Date(Date.now() + 60_000).toISOString(),
    }
  }

  const result = Array.isArray(data) ? data[0] : data

  if (!result) {
    console.error('Persistent rate limit returned no result')

    return {
      allowed: false,
      remaining: 0,
      reset_at: new Date(Date.now() + 60_000).toISOString(),
    }
  }

  return {
    allowed: Boolean(result.allowed),
    remaining: Number(result.remaining),
    reset_at: String(result.reset_at),
  }
}
