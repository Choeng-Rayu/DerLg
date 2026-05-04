'use client'

export function MapView({
  markers,
}: {
  markers: Array<{
    id: string
    name: string
    latitude?: number
    longitude?: number
  }>
}) {
  const centeredMarkers = markers.filter(
    (marker) => typeof marker.latitude === 'number' && typeof marker.longitude === 'number',
  )

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[linear-gradient(135deg,#d9f2f8,#f8fafc)] p-5">
      <div className="flex min-h-[420px] flex-col justify-between rounded-[2rem] border border-dashed border-[var(--color-primary-300)] bg-[radial-gradient(circle_at_25%_30%,rgba(14,116,144,0.16),transparent_20%),radial-gradient(circle_at_75%_65%,rgba(245,158,11,0.18),transparent_18%),white] p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-primary-700)]">
            Map view
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Spatial planning surface</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-foreground-muted)]">
            The explore map is scaffolded here. Marker data is already flowing; the final interactive Leaflet layer can be dropped in after the library compatibility pass.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {centeredMarkers.slice(0, 6).map((marker) => (
            <div
              key={marker.id}
              className="rounded-2xl border border-[var(--color-border)] bg-white/80 p-3 text-sm shadow-[var(--shadow-sm)]"
            >
              <p className="font-medium">{marker.name}</p>
              <p className="mt-1 text-[var(--color-foreground-muted)]">
                {marker.latitude?.toFixed(4)}, {marker.longitude?.toFixed(4)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
