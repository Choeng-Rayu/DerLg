import { Card } from '@/components/ui/card'

export function TripItinerary({
  itinerary,
}: {
  itinerary?: Array<{ day: number; title: string; description: string }>
}) {
  if (!itinerary?.length) {
    return (
      <Card>
        <h2 className="text-lg font-semibold">Itinerary</h2>
        <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
          Day-by-day scheduling will appear here as the backend expands itinerary details.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Itinerary</h2>
      <div className="mt-4 grid gap-4">
        {itinerary.map((item) => (
          <div key={item.day} className="rounded-2xl bg-[var(--color-surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary-600)]">
              Day {item.day}
            </p>
            <h3 className="mt-1 font-medium">{item.title}</h3>
            <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
