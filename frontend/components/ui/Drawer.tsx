'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function Drawer({
  open,
  title,
  onClose,
  side = 'right',
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  side?: 'left' | 'right'
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition',
        open ? 'pointer-events-auto bg-black/40' : 'pointer-events-none bg-transparent',
      )}
    >
      <aside
        className={cn(
          'absolute top-0 h-full w-full max-w-md bg-surface-raised p-5 shadow-lg transition',
          side === 'right' ? 'right-0' : 'left-0',
          open
            ? 'translate-x-0'
            : side === 'right'
              ? 'translate-x-full'
              : '-translate-x-full',
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </aside>
    </div>
  )
}
