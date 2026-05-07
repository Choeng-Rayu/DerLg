import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/Card'

export default function CookiesPage() {
  return (
    <PageContainer className="py-8">
      <Card>
        <h1 className="text-[length:var(--fluid-h2)] font-semibold">Cookie policy</h1>
        <p className="mt-4 text-sm text-foreground-muted">
          Cookie consent and analytics gating are ready to be connected to final policy content and event rules.
        </p>
      </Card>
    </PageContainer>
  )
}
