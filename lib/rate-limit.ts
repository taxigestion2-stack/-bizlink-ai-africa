/**
 * Rate limiter en mémoire, à granularité par clé (ex: organizationId).
 *
 * LIMITE CONNUE : ne fonctionne correctement que sur une seule instance de
 * serveur (pas de partage d'état entre lambdas/serveurs). Suffisant pour un
 * MVP mono-instance. Pour une vraie mise à l'échelle horizontale, remplacer
 * par un store partagé (ex: Upstash Redis + @upstash/ratelimit).
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}
