import { Card } from '@/components/ui/Card'

export function PhotoGallery({ images }: { images?: string[] }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">Gallery</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(images?.length ? images : Array.from({ length: 3 }).map(() => '')).map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="aspect-[4/3] rounded-2xl bg-[linear-gradient(145deg,#0e7490,#1e293b)]"
            aria-label={image ? `Trip photo ${index + 1}` : 'Decorative trip preview'}
          />
        ))}
      </div>
    </Card>
  )
}
