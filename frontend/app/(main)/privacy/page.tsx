import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/Card'

export default function PrivacyPage() {
  return (
    <PageContainer className="py-8">
      <Card>
        <h1 className="text-[length:var(--fluid-h2)] font-semibold">Privacy policy</h1>
        <p className="mt-4 text-sm text-foreground-muted">
          This frontend now includes the privacy route and consent-friendly structure; the final policy content should be reviewed with legal.
        </p>
      </Card>
    </PageContainer>
  )
}
