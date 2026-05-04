import { RequireAuth } from '@/components/auth/RequireAuth'
import { Card } from '@/components/ui/card'

export default function AdminReviewsPage() {
  return (
    <RequireAuth role="ADMIN">
      <Card>
        <h1 className="text-2xl font-semibold">Review moderation</h1>
      </Card>
    </RequireAuth>
  )
}
