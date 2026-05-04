'use client'

import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8)
    .regex(/(?=.*[A-Z])/, 'At least one uppercase letter')
    .regex(/(?=.*\d)/, 'At least one number'),
})

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  })

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-semibold">Create your DerLg account</h1>
      <form
        className="mt-6 grid gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          await register.mutateAsync(values)
          router.push('/login')
        })}
      >
        <Input label="Name" error={form.formState.errors.name?.message} {...form.register('name')} />
        <Input label="Email" error={form.formState.errors.email?.message} {...form.register('email')} />
        <Input label="Phone" error={form.formState.errors.phone?.message} {...form.register('phone')} />
        <Input label="Password" type="password" error={form.formState.errors.password?.message} {...form.register('password')} />
        <Button type="submit" loading={register.isPending}>
          Register
        </Button>
      </form>
      <p className="mt-4 text-sm text-[var(--color-foreground-muted)]">
        Already registered?{' '}
        <Link className="font-medium text-[var(--color-primary-600)]" href="/login">
          Sign in
        </Link>
      </p>
    </Card>
  )
}
