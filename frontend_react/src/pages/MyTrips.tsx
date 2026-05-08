import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Calendar, MapPin, ChevronRight, AlertTriangle } from 'lucide-react';

const upcomingBookings = [
  {
    id: '1',
    tripName: 'Angkor Wat Sunrise',
    startDate: '2026-06-15',
    status: 'confirmed' as const,
    totalPrice: 360,
    guestCount: 3,
    location: 'Siem Reap',
  },
  {
    id: '2',
    tripName: 'Phnom Penh Heritage',
    startDate: '2026-07-20',
    status: 'pending' as const,
    totalPrice: 170,
    guestCount: 2,
    location: 'Phnom Penh',
  },
];

const pastBookings = [
  {
    id: '3',
    tripName: 'Koh Rong Island',
    startDate: '2025-12-10',
    status: 'completed' as const,
    totalPrice: 240,
    guestCount: 2,
    location: 'Sihanoukville',
  },
];

type BookingCardProps = typeof upcomingBookings[0] | typeof pastBookings[0];

const BookingCard = ({ booking }: { booking: BookingCardProps }) => {
  const statusColors = {
    confirmed: 'success',
    pending: 'warning',
    cancelled: 'error',
    completed: 'default',
  } as const;

  const isUpcoming = new Date(booking.startDate) > new Date();
  const isWithin24h = isUpcoming && new Date(booking.startDate).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Link to={`/my-trips/${booking.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">{booking.tripName}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {booking.startDate}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {booking.location}
              </p>
              <p className="text-sm text-gray-600">
                {booking.guestCount} guests · ${booking.totalPrice}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={statusColors[booking.status]}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
              {isWithin24h && (
                <Link
                  to={`/emergency?bookingId=${booking.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-red-600 flex items-center gap-1 hover:underline"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Emergency
                </Link>
              )}
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const MyTrips: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.myTrips')}</h1>

      <Tabs
        tabs={[
          {
            id: 'upcoming',
            label: `Upcoming (${upcomingBookings.length})`,
            content: (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
                {upcomingBookings.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No upcoming trips.</p>
                )}
              </div>
            ),
          },
          {
            id: 'past',
            label: `Past (${pastBookings.length})`,
            content: (
              <div className="space-y-3">
                {pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
                {pastBookings.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No past trips.</p>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default MyTrips;
