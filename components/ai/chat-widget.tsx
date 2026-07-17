'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Combien ai-je gagné aujourd\'hui ?',
  'Quels produits sont en rupture ?',
  'Quel produit vend le plus ?',
  'Comment augmenter mon bénéfice ?',
]

export function ChatWidget({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    setError(null)
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.')
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setError('Impossible de contacter l\'assistant. Vérifiez votre connexion.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[70vh] max-w-2xl flex-col rounded-lg border">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Posez une question sur votre commerce. Exemples :
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && <p className="text-sm text-muted-foreground">L'assistant réfléchit...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage(input)
        }}
        className="flex items-center gap-2 border-t p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre question..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          Envoyer
        </Button>
      </form>
    </div>
  )
}
