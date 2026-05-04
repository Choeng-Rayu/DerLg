import { RequireAuth } from '@/components/auth/RequireAuth'
import { Card } from '@/components/ui/card'

export default function AdminSupportPage() {
  return (
    <RequireAuth role="ADMIN">
      <Card>
        <h1 className="text-2xl font-semibold">Support queue</h1>
      </Card>
    </RequireAuth>
  )
}
