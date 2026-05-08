import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function ReviewsSection({
  rating,
  reviewCount,
}: {
  rating?: number | null
  reviewCount?: number | null
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Reviews</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Verified review APIs are not exposed yet, so this surface is ready for the real feed.
          </p>
        </div>
        {rating ? <Badge tone="warning">{rating.toFixed(1)} average</Badge> : null}
      </div>
      <p className="mt-4 text-sm text-foreground-muted">
        {reviewCount || 0} review entries available in current metadata.
      </p>
    </Card>
  )
}
