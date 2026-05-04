'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import type { User } from '@/types'

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  preferredLanguage: z.enum(['EN', 'KH', 'ZH']).optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
})

export function ProfileForm({ user }: { user: User }) {
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone || '',
      preferredLanguage: user.preferredLanguage || 'EN',
      emergencyContactName: user.emergencyContactName || '',
      emergencyContactPhone: user.emergencyContactPhone || '',
    },
  })

  const updateProfile = useMutation({
    mutationFn: (payload: z.infer<typeof profileSchema>) => api.users.updateProfile(payload),
    onSuccess: () =>
      toast({
        tone: 'success',
        title: 'Profile updated',
      }),
  })

  return (
    <Card>
      <h2 className="text-lg font-semibold">Profile</h2>
      <form className="mt-4 grid gap-4" onSubmit={form.handleSubmit((values) => updateProfile.mutate(values))}>
        <Input label="Name" error={form.formState.errors.name?.message} {...form.register('name')} />
        <Input label="Phone" error={form.formState.errors.phone?.message} {...form.register('phone')} />
        <Input label="Emergency contact" {...form.register('emergencyContactName')} />
        <Input label="Emergency phone" {...form.register('emergencyContactPhone')} />
        <Button type="submit" loading={updateProfile.isPending}>
          Save profile
        </Button>
      </form>
    </Card>
  )
}
