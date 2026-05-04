'use client'

import { useEffect, useMemo, useState } from 'react'
import { env } from '@/lib/env'
import { useAppStore } from '@/stores/app-store'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { ChatMessage } from '@/types'

export function AIChat() {
  const open = useAppStore((state) => state.isChatOpen)
  const closeChat = useAppStore((state) => state.closeChat)
  const history = useAppStore((state) => state.chatHistory)
  const addMessage = useAppStore((state) => state.addMessage)
  const [draft, setDraft] = useState('')
  const [sessionId] = useState(() => crypto.randomUUID())

  const onMessage = (data: Record<string, unknown>) => {
    addMessage({
      id: crypto.randomUUID(),
      role: (data.role as ChatMessage['role']) || 'assistant',
      type: (data.type as ChatMessage['type']) || 'text',
      content: String(data.content || ''),
      metadata: data,
      createdAt: new Date().toISOString(),
    })
  }

  const websocket = useWebSocket<Record<string, unknown>>({
    url: `${env.NEXT_PUBLIC_WS_URL}?sessionId=${sessionId}`,
    enabled: open,
    onMessage,
  })

  useEffect(() => {
    if (!open) return
    addMessage({
      id: crypto.randomUUID(),
      role: 'system',
      type: 'status',
      content: 'Connected to planner',
      createdAt: new Date().toISOString(),
    })
  }, [addMessage, open])

  const grouped = useMemo(() => history.slice(-20), [history])

  return (
    <Drawer open={open} onClose={closeChat} title="AI planner">
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="mb-3 text-xs text-[var(--color-foreground-subtle)]">
          Status: {websocket.status}
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-[var(--color-surface-muted)] p-3">
          {grouped.map((message) => (
            <div
              key={message.id}
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'ml-auto bg-[var(--color-primary-500)] text-white'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-foreground)]'
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!draft.trim()) return
            const message = {
              id: crypto.randomUUID(),
              role: 'user' as const,
              type: 'text' as const,
              content: draft,
              createdAt: new Date().toISOString(),
            }
            addMessage(message)
            websocket.send(message)
            setDraft('')
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-11 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 outline-none"
            placeholder="Ask about timing, budgets, routes, or hotel combinations"
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </Drawer>
  )
}
