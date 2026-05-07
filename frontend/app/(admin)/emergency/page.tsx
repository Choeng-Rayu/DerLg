import { RequireAuth } from '@/components/auth/RequireAuth'
import { Card } from '@/components/ui/Card'

export default function AdminEmergencyPage() {
  return (
    <RequireAuth role="ADMIN">
      <Card>
        <h1 className="text-2xl font-semibold">Emergency alerts</h1>
      </Card>
    </RequireAuth>
  )
}
