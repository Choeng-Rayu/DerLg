import { ContactForm } from '@/components/contact/ContactForm'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/card'

export default function ContactPage() {
  return (
    <PageContainer className="py-8">
      <div className="mb-6">
        <h1 className="text-[length:var(--fluid-h2)] font-semibold">Contact & support</h1>
        <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
          Reach travel support, booking assistance, and emergency follow-up.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <ContactForm />
        <Card>
          <h2 className="text-lg font-semibold">Support details</h2>
          <div className="mt-4 grid gap-3 text-sm text-[var(--color-foreground-muted)]">
            <p>Email: support@derlg.com</p>
            <p>Phone: +855 23 000 000</p>
            <p>Business hours: 08:00-20:00 ICT</p>
            <p>For urgent travel-day issues, use the emergency flow from your booking detail.</p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
