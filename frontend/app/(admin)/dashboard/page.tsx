import { RequireAuth } from '@/components/auth/RequireAuth'
import { Card } from '@/components/ui/card'

export default function AdminDashboardPage() {
  return (
    <RequireAuth role="ADMIN">
      <Card>
        <h1 className="text-[length:var(--fluid-h2)] font-semibold">Admin dashboard</h1>
        <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
          Role-protected shell is in place. Metrics and moderation tables can now be connected module by module.
        </p>
      </Card>
    </RequireAuth>
  )
}
