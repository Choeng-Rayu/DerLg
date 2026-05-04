'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'

export function LoyaltyPoints() {
  const balance = useQuery({
    queryKey: ['loyalty', 'balance'],
    queryFn: () => api.loyalty.balance(),
  })
  const history = useQuery({
    queryKey: ['loyalty', 'transactions'],
    queryFn: () => api.loyalty.transactions({ page: 1, perPage: 5 }),
  })

  const points = balance.data?.points || 0
  const nextTierTarget = 1000

  return (
    <Card>
      <h2 className="text-lg font-semibold">Loyalty points</h2>
      <p className="mt-2 text-3xl font-semibold">{points}</p>
      <p className="text-sm text-[var(--color-foreground-muted)]">
        Approximate value ${balance.data?.valueUsd.toFixed(2) || '0.00'}
      </p>
      <div className="mt-4">
        <ProgressBar value={(points / nextTierTarget) * 100} />
      </div>
      <div className="mt-6 grid gap-3">
        {history.data?.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 rounded-2xl bg-[var(--color-surface-muted)] p-3 text-sm">
            <span>{item.description || item.type}</span>
            <span className="font-medium">{item.points > 0 ? `+${item.points}` : item.points}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
