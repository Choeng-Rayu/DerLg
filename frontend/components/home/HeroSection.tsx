import Link from 'next/link'
import { Bot, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/layout/PageContainer'

export function HeroSection() {
  return (
    <section className="py-10 sm:py-14">
      <PageContainer className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            Cambodia travel planning
          </p>
          <h1 className="mt-4 max-w-3xl text-[length:var(--fluid-h1)] font-semibold leading-[1.05]">
            Build a calmer trip from booking to arrival
          </h1>
          <p className="mt-4 max-w-2xl text-base text-foreground-muted sm:text-lg">
            Trips, hotels, transport, festivals, and a bilingual support layer in one place.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild={false}>
              <Link href="/explore" className="inline-flex items-center gap-2">
                <Search className="size-4" />
                Explore now
              </Link>
            </Button>
            <Button asChild={false} variant="outline">
              <Link href="/chat" className="inline-flex items-center gap-2">
                <Bot className="size-4" />
                Ask the AI planner
              </Link>
            </Button>
          </div>
        </div>
        <div className="rounded-[2rem] border border-border bg-[linear-gradient(180deg,#0e7490,#102a43)] p-6 text-white shadow-lg">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-white/80">Featured trips</p>
              <p className="mt-2 text-3xl font-semibold">10+</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-white/80">Upcoming festivals</p>
              <p className="mt-2 text-3xl font-semibold">Year-round</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-white/80">Support coverage</p>
              <p className="mt-2 text-3xl font-semibold">24/7</p>
            </div>
            <div className="rounded-2xl bg-[color-mix(in_srgb,var(--color-accent)_72%,white_28%)] p-4 text-slate-900">
              <p className="text-sm">Student & loyalty savings</p>
              <p className="mt-2 text-3xl font-semibold">Built in</p>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  )
}
