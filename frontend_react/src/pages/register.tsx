import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRegister } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { UserPlus, Mail, Lock, User, Phone } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(6, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Account created!');
        navigate('/');
      },
      onError: (err: Error) => {
        toast.error(err.message);
      },
    });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6">
          <UserPlus className="h-10 w-10 text-derlg-primary mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.registerTitle')}</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('auth.name')}
            iconLeft={<User className="h-4 w-4" />}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label={t('auth.email')}
            type="email"
            iconLeft={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label={t('auth.phone')}
            iconLeft={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label={t('auth.password')}
            type="password"
            iconLeft={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" className="w-full" loading={registerMutation.isPending}>
            {t('auth.submit')}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-derlg-primary font-medium hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
