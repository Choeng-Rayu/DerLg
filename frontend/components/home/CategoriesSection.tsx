import Link from 'next/link'
import { Landmark, Trees, UtensilsCrossed, WavesLadder, Mountain } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/PageContainer'

const categories = [
  { label: 'Temples', value: 'TEMPLE', icon: Landmark },
  { label: 'Nature', value: 'NATURE', icon: Trees },
  { label: 'Culture', value: 'CULTURE', icon: WavesLadder },
  { label: 'Adventure', value: 'ADVENTURE', icon: Mountain },
  { label: 'Food', value: 'FOOD', icon: UtensilsCrossed },
]

export function CategoriesSection() {
  return (
    <section className="py-8">
      <PageContainer>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[length:var(--fluid-h3)] font-semibold">Browse by vibe</h2>
            <p className="text-sm text-[var(--color-foreground-muted)]">
              Start wide, then tighten the route as you learn what fits.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link key={category.value} href={`/explore?category=${category.value}`}>
                <Card className="flex h-full items-center gap-3 p-4 transition hover:-translate-y-0.5">
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--color-surface-muted)] text-[var(--color-primary-600)]">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-medium">{category.label}</span>
                </Card>
              </Link>
            )
          })}
        </div>
      </PageContainer>
    </section>
  )
}
