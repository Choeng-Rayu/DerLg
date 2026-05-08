import Link from 'next/link'
import { Languages } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Guide } from '@/types'

export function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link href={`/guides/${guide.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5">
        <div className="flex items-start gap-3">
          <Avatar alt={guide.user?.name || 'Guide'} src={guide.user?.avatarUrl} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{guide.user?.name || 'Local guide'}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">
              {guide.bio || 'Experienced private guide for cultural and regional itineraries.'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {guide.isVerified ? <Badge tone="success">Verified</Badge> : null}
          {guide.languages?.slice(0, 3).map((language) => (
            <Badge key={language}>
              <span className="inline-flex items-center gap-1">
                <Languages className="size-3" />
                {language}
              </span>
            </Badge>
          ))}
        </div>
      </Card>
    </Link>
  )
}
