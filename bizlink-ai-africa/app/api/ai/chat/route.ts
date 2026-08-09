import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { buildBusinessContext, buildSystemPrompt, generateChatResponse } from '@/services/ai.service'

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Organisation introuvable' }, { status: 400 })
  }

  const organizationId = profile.organization_id as string

  // 20 messages / 10 minutes par organisation — évite l'abus de l'API OpenAI payante
  const rateLimit = checkRateLimit(`ai-chat:${organizationId}`, { limit: 20, windowMs: 10 * 60 * 1000 })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de messages envoyés. Merci de réessayer dans quelques minutes." },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = chatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Message invalide' }, { status: 400 })
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single()

  const { data: recentLogs } = await supabase
    .from('chat_logs')
    .select('role, message')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(10)

  const history = (recentLogs ?? [])
    .reverse()
    .map((log) => ({ role: log.role as 'user' | 'assistant', content: log.message }))

  history.push({ role: 'user', content: parsed.data.message })

  const context = await buildBusinessContext(supabase, organizationId)
  const systemPrompt = buildSystemPrompt(context, organization?.name ?? 'votre commerce')

  let reply: string
  try {
    reply = await generateChatResponse(systemPrompt, history)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }

  await supabase.from('chat_logs').insert([
    { organization_id: organizationId, user_id: user.id, role: 'user', message: parsed.data.message },
    { organization_id: organizationId, user_id: user.id, role: 'assistant', message: reply },
  ])

  return NextResponse.json({ reply })
}
