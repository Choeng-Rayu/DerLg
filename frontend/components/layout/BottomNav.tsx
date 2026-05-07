'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, CalendarCheck2, Compass, House, UserRound } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'

const items = [
  { href: '/', label: 'Home', icon: House },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/booking', label: 'Book', icon: CalendarCheck2 },
  { href: '/my-trip', label: 'Trips', icon: CalendarCheck2 },
  { href: '/profile', label: 'Profile', icon: UserRound },
]

export function BottomNav() {
  const pathname = usePathname()
  const openChat = useAppStore((state) => state.openChat)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[color-mix(in_srgb,var(--color-surface-raised)_92%,transparent)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-6">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${
                active ? 'text-primary-600' : 'text-foreground-muted'
              }`}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={openChat}
          className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-accent"
        >
          <Bot className="size-4" />
          <span>AI</span>
        </button>
      </div>
    </nav>
  )
}
