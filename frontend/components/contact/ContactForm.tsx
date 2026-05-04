'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false)

  return (
    <Card>
      <h2 className="text-lg font-semibold">Contact us</h2>
      <form
        className="mt-4 grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault()
          setSubmitting(true)
          await new Promise((resolve) => setTimeout(resolve, 800))
          setSubmitting(false)
          toast({
            tone: 'success',
            title: 'Message captured',
            description: 'Hook this form to the support endpoint once it lands.',
          })
        }}
      >
        <Input label="Name" required />
        <Input label="Email" type="email" required />
        <Input label="Subject" required />
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Message</span>
          <textarea className="min-h-32 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 outline-none" required />
        </label>
        <Button type="submit" loading={submitting}>
          Send message
        </Button>
      </form>
    </Card>
  )
}
