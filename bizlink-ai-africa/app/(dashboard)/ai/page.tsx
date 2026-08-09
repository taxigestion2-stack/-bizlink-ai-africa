import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { ChatWidget } from '@/components/ai/chat-widget'

export const metadata: Metadata = { title: 'Assistant IA — BizLink AI Africa' }

export default async function AiPage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('chat_logs')
    .select('role, message, created_at')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: true })
    .limit(30)

  const initialMessages = (logs ?? []).map((log) => ({
    role: log.role as 'user' | 'assistant',
    content: log.message,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assistant IA</h1>
        <p className="text-sm text-muted-foreground">
          Posez des questions sur vos ventes, dépenses, stock et bénéfices.
        </p>
      </div>
      <ChatWidget initialMessages={initialMessages} />
    </div>
  )
}
