import { RequireAuth } from '@/components/auth/RequireAuth'
import { Card } from '@/components/ui/card'

export default function AdminBookingsPage() {
  return (
    <RequireAuth role="ADMIN">
      <Card>
        <h1 className="text-2xl font-semibold">Admin bookings</h1>
      </Card>
    </RequireAuth>
  )
}
