'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

const verificationSchema = z.object({
  institutionName: z.string().min(2),
  studentIdImageUrl: z.string().url(),
  faceSelfieUrl: z.string().url().optional().or(z.literal('')),
})

export function StudentVerification() {
  const status = useQuery({
    queryKey: ['student', 'status'],
    queryFn: () => api.student.status(),
  })
  const form = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      institutionName: '',
      studentIdImageUrl: '',
      faceSelfieUrl: '',
    },
  })

  const submit = useMutation({
    mutationFn: (payload: z.infer<typeof verificationSchema>) => api.student.verify(payload),
  })

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Student discount</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Verification is API-backed. File storage endpoints are not live yet, so URL inputs are used for now.
          </p>
        </div>
        {status.data ? (
          <Badge tone={status.data.status === 'APPROVED' ? 'success' : status.data.status === 'REJECTED' ? 'danger' : 'warning'}>
            {status.data.status}
          </Badge>
        ) : null}
      </div>
      <form className="mt-4 grid gap-4" onSubmit={form.handleSubmit((values) => submit.mutate(values))}>
        <Input label="Institution" {...form.register('institutionName')} />
        <Input label="Student ID image URL" {...form.register('studentIdImageUrl')} />
        <Input label="Selfie URL (optional)" {...form.register('faceSelfieUrl')} />
        <Button type="submit" loading={submit.isPending}>
          Submit verification
        </Button>
      </form>
    </Card>
  )
}
