import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toast';
import { useAppStore } from '@/stores/app-store';
import { Calendar, Users, CreditCard, Gift, GraduationCap, ArrowLeft } from 'lucide-react';

const bookingSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  guestCount: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return num >= 1 && num <= 20;
  }, 'Guests must be between 1 and 20'),
  specialRequests: z.string().max(500, 'Max 500 characters').optional(),
  applyLoyaltyPoints: z.boolean().optional(),
  studentDiscount: z.boolean().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const tripData = {
  id: '1',
  title: 'Angkor Wat Sunrise',
  price: 120,
  duration: 3,
  image: 'https://images.unsplash.com/photo-1600596542815-2495db98dada?w=600&q=80',
};

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAppStore((s) => s.user);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestCount: '1',
      applyLoyaltyPoints: false,
      studentDiscount: false,
    },
  });

  const guestCount = parseInt(watch('guestCount') || '1', 10);
  const basePrice = tripData.price * guestCount;
  const discount = watch('studentDiscount') && user?.isStudentVerified ? basePrice * 0.1 : 0;
  const loyaltyDiscount = watch('applyLoyaltyPoints') && user ? Math.min(user.loyaltyPoints, basePrice * 0.2) : 0;
  const totalPrice = basePrice - discount - loyaltyDiscount;

  const onSubmit = (_data: BookingFormData) => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Booking created! Proceeding to payment...');
      navigate(`/payment/${id || '1'}`, { state: { bookingId: 'mock-booking-id', totalPrice } });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Book {tripData.title}</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-derlg-primary" />
                Booking Details
              </h3>

              <div className="space-y-4">
                <Input
                  label="Start Date"
                  type="date"
                  iconLeft={<Calendar className="h-4 w-4" />}
                  error={errors.startDate?.message}
                  {...register('startDate')}
                />

                <Input
                  label="Number of Guests"
                  type="number"
                  iconLeft={<Users className="h-4 w-4" />}
                  error={errors.guestCount?.message}
                  {...register('guestCount')}
                />

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Special Requests (optional)
                  </label>
                  <textarea
                    {...register('specialRequests')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-derlg-primary focus:border-derlg-primary min-h-[100px]"
                    placeholder="Any dietary requirements, accessibility needs, etc."
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Discounts</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" {...register('applyLoyaltyPoints')} />
                  <div>
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <Gift className="h-4 w-4 text-derlg-secondary" />
                      Use Loyalty Points
                    </span>
                    <p className="text-xs text-gray-500">
                      You have {user?.loyaltyPoints || 0} points available
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...register('studentDiscount')}
                    disabled={!user?.isStudentVerified}
                  />
                  <div>
                    <span className={`text-sm font-medium flex items-center gap-1 ${user?.isStudentVerified ? 'text-gray-900' : 'text-gray-400'}`}>
                      <GraduationCap className="h-4 w-4" />
                      Student Discount (10%)
                    </span>
                    {!user?.isStudentVerified && (
                      <p className="text-xs text-gray-500">Verify your student status in profile</p>
                    )}
                  </div>
                </label>
              </div>
            </Card>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting} disabled={isSubmitting}>
              <CreditCard className="h-4 w-4 mr-2" />
              Proceed to Payment
            </Button>
          </form>
        </div>

        {/* Summary */}
        <div>
          <Card className="p-4 sticky top-4">
            <div className="h-32 rounded-lg overflow-hidden bg-gray-100 mb-4">
              <img src={tripData.image} alt={tripData.title} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-semibold text-gray-900">{tripData.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{tripData.duration} days</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">${tripData.price} x {guestCount} guests</span>
                <span className="font-medium">${basePrice}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Student discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Loyalty points</span>
                  <span>-${loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Booking;
