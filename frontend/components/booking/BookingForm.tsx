'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'

const bookingSchema = z.object({
  bookingType: z.enum(['PACKAGE', 'HOTEL_ONLY', 'TRANSPORT_ONLY', 'GUIDE_ONLY']),
  tripId: z.string().optional(),
  hotelRoomId: z.string().optional(),
  vehicleId: z.string().optional(),
  guideId: z.string().optional(),
  travelDate: z.string().min(1, 'Travel date is required'),
  endDate: z.string().optional(),
  numAdults: z.number().min(1).max(20),
  numChildren: z.number().min(0).max(10),
  pickupLocation: z.string().optional(),
  specialRequests: z.string().max(1000).optional(),
  loyaltyPointsToRedeem: z.number().min(0).optional(),
  applyStudentDiscount: z.boolean().default(false),
})

type BookingFormValues = z.input<typeof bookingSchema>

export function BookingForm({ tripId }: { tripId?: string }) {
  const router = useRouter()
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingType: tripId ? 'PACKAGE' : 'PACKAGE',
      tripId,
      numAdults: 1,
      numChildren: 0,
      applyStudentDiscount: false,
      loyaltyPointsToRedeem: 0,
    },
  })

  const watchTripId = form.watch('tripId')
  const availability = useQuery({
    queryKey: ['booking', 'availability', watchTripId, form.watch('travelDate')],
    queryFn: () =>
      api.bookings.availability(watchTripId || '', {
        travelDate: form.getValues('travelDate'),
        endDate: form.getValues('endDate'),
      }),
    enabled: Boolean(watchTripId && form.watch('travelDate')),
  })

  const createBooking = useMutation({
    mutationFn: (payload: BookingFormValues) => api.bookings.create(payload),
    onSuccess: (booking) => {
      toast({
        tone: 'success',
        title: 'Booking hold created',
        description: `Reference ${booking.bookingRef} is reserved for payment.`,
      })
      router.push(`/booking/${booking.bookingRef}`)
    },
    onError: (error: Error) => {
      toast({
        tone: 'error',
        title: 'Booking failed',
        description: error.message,
      })
    },
  })

  const onSubmit = (values: BookingFormValues) => {
    createBooking.mutate(values)
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Create a booking</h2>
      <form className="mt-4 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Select
          value={form.watch('bookingType')}
          onChange={(event) =>
            form.setValue('bookingType', event.target.value as BookingFormValues['bookingType'])
          }
          options={[
            { label: 'Package', value: 'PACKAGE' },
            { label: 'Hotel only', value: 'HOTEL_ONLY' },
            { label: 'Transport only', value: 'TRANSPORT_ONLY' },
            { label: 'Guide only', value: 'GUIDE_ONLY' },
          ]}
        />
        <Input
          label="Trip ID"
          placeholder="Paste a trip ID from the trip detail page"
          error={form.formState.errors.tripId?.message}
          {...form.register('tripId')}
        />
        <DateRangePicker
          startDate={form.watch('travelDate')}
          endDate={form.watch('endDate')}
          onStartDateChange={(value) => form.setValue('travelDate', value)}
          onEndDateChange={(value) => form.setValue('endDate', value)}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Adults"
            type="number"
            min={1}
            error={form.formState.errors.numAdults?.message}
            {...form.register('numAdults', { valueAsNumber: true })}
          />
          <Input
            label="Children"
            type="number"
            min={0}
            error={form.formState.errors.numChildren?.message}
            {...form.register('numChildren', { valueAsNumber: true })}
          />
        </div>
        <Input label="Pickup location" {...form.register('pickupLocation')} />
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Special requests</span>
          <textarea
            className="min-h-28 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 outline-none"
            {...form.register('specialRequests')}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Loyalty points to redeem"
            type="number"
            min={0}
            {...form.register('loyaltyPointsToRedeem', { valueAsNumber: true })}
          />
          <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4">
            <input type="checkbox" {...form.register('applyStudentDiscount')} />
            <span>Apply student discount</span>
          </label>
        </div>
        {availability.data ? (
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Availability: {availability.data.available ? 'Available' : 'Conflicts detected'}
          </p>
        ) : null}
        <Button type="submit" loading={createBooking.isPending} disabled={createBooking.isPending}>
          Reserve booking
        </Button>
      </form>
    </Card>
  )
}
