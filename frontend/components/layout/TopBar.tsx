'use client'

import Link from 'next/link'
import { Bot, Compass, Heart, UserRound } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useAppStore } from '@/stores/app-store'
import { useAuthStore } from '@/stores/authStore'
import { SearchBox } from '@/components/search/SearchBox'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/booking', label: 'Booking' },
  { href: '/my-trip', label: 'My Trip' },
  { href: '/profile', label: 'Profile' },
]

export function TopBar() {
  const pathname = usePathname()
  const openChat = useAppStore((state) => state.openChat)
  const favorites = useAppStore((state) => state.favorites)
  const user = useAuthStore((state) => state.user)

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-raised)_88%,transparent)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-white">
            <Compass className="size-5" />
          </span>
          <span className="hidden sm:inline">DerLg</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? 'bg-[var(--color-surface-muted)] text-[var(--color-foreground)]'
                    : 'text-[var(--color-foreground-muted)] hover:bg-[var(--color-surface-muted)]'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto hidden max-w-md flex-1 lg:block">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button type="button" variant="ghost" size="icon" aria-label="Favorites">
            <Heart className="size-4" />
            {favorites.length ? (
              <span className="absolute -right-1 -top-1 inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] text-slate-900">
                {favorites.length}
              </span>
            ) : null}
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Open AI chat" onClick={openChat}>
            <Bot className="size-4" />
          </Button>
          <ThemeToggle />
          <Link href="/profile" aria-label="Profile">
            {user ? (
              <Avatar alt={user.name} src={user.avatarUrl} className="size-10" />
            ) : (
              <span className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--color-border)]">
                <UserRound className="size-4" />
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
