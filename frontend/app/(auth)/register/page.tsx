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

      <div className="mt-6 grid gap-3">
        <GoogleLoginButton />
        <TelegramLoginButton />
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-base px-2 text-foreground-muted">Or register with email</span>
        </div>
      </div>

      <form
        className="grid gap-4"
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
      <p className="mt-4 text-sm text-foreground-muted">
        Already registered?{' '}
        <Link className="font-medium text-primary-600" href="/login">
          Sign in
        </Link>
      </p>
    </Card>
  )
}
