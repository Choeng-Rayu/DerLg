'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useSearch } from '@/hooks/useSearch'

export function SearchBox() {
  const [value, setValue] = useState('')
  const { groups } = useSearch(value)

  const hasResults = useMemo(
    () => groups.some((group) => group.items.length > 0),
    [groups],
  )

  return (
    <div className="relative">
      <Input
        aria-label="Search"
        placeholder="Search trips, places, festivals, hotels"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        icon={<Search className="size-4 text-foreground-subtle" />}
      />
      {value.length > 1 ? (
        <Card className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-96 overflow-auto p-3">
          {hasResults ? (
            <div className="space-y-4">
              {groups.map((group) =>
                group.items.length ? (
                  <div key={group.type} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {(
                        group.items as Array<{
                          id: string
                          title?: string
                          name?: string
                        }>
                      ).map((item) => (
                        <Link
                          key={String(item.id)}
                          href={
                            group.type === 'trip'
                              ? `/trips/${String(item.id)}`
                              : group.type === 'place'
                                ? `/explore?place=${String(item.id)}`
                                : group.type === 'festival'
                                  ? `/festivals?festival=${String(item.id)}`
                                  : `/hotels/${String(item.id)}`
                          }
                          className="block rounded-2xl px-3 py-2 text-sm hover:bg-surface-muted"
                        >
                          {String(item.title || item.name)}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          ) : (
            <p className="text-sm text-foreground-muted">
              No results yet. Try a province, travel style, hotel, or festival name.
            </p>
          )}
        </Card>
      ) : null}
    </div>
  )
}
