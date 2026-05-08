'use client'

import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton'

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
      <p className="mt-2 text-sm text-foreground-muted">
        Sign in to manage bookings, payments, loyalty points, and support.
      </p>

      <div className="mt-6 grid gap-3">
        <GoogleLoginButton />
        <TelegramLoginButton />
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-base px-2 text-foreground-muted">Or continue with email</span>
        </div>
      </div>

      <form
        className="grid gap-4"
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
      <p className="mt-4 text-sm text-foreground-muted">
        New here?{' '}
        <Link className="font-medium text-primary-600" href="/register">
          Create an account
        </Link>
      </p>
    </Card>
  )
}
