import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <PageContainer className="py-8">
      <Card>
        <h1 className="text-[length:var(--fluid-h2)] font-semibold">Terms of service</h1>
        <p className="mt-4 text-sm text-[var(--color-foreground-muted)]">
          Final legal copy still needs product and policy review. This page is now in place for the production content pass.
        </p>
      </Card>
    </PageContainer>
  )
}
