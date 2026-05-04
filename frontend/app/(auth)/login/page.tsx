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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
        Sign in to manage bookings, payments, loyalty points, and support.
      </p>
      <form
        className="mt-6 grid gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          await login.mutateAsync(values)
          const returnTo =
            typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('returnTo')
              : null
          router.push(returnTo || '/')
        })}
      >
        <Input label="Email" error={form.formState.errors.email?.message} {...form.register('email')} />
        <Input label="Password" type="password" error={form.formState.errors.password?.message} {...form.register('password')} />
        <Button type="submit" loading={login.isPending}>
          Sign in
        </Button>
      </form>
      <p className="mt-4 text-sm text-[var(--color-foreground-muted)]">
        New here?{' '}
        <Link className="font-medium text-[var(--color-primary-600)]" href="/register">
          Create an account
        </Link>
      </p>
    </Card>
  )
}
