'use client'

import { create } from 'zustand'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

interface ToastStore {
  items: ToastItem[]
  push: (item: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (item) =>
    set((state) => ({
      items: [...state.items, { ...item, id: crypto.randomUUID() }],
    })),
  dismiss: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
}))

export function toast(item: Omit<ToastItem, 'id'>) {
  useToastStore.getState().push(item)
}

export function Toaster() {
  const items = useToastStore((state) => state.items)
  const dismiss = useToastStore((state) => state.dismiss)

  useEffect(() => {
    const timers = items.map((item) =>
      window.setTimeout(() => dismiss(item.id), 4000),
    )

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [dismiss, items])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] mx-auto flex w-full max-w-md flex-col gap-2 px-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-md)]"
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
                  {item.description}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
