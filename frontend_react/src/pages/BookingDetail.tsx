import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { Calendar, MapPin, Users, CreditCard, AlertTriangle, ArrowLeft, X, QrCode } from 'lucide-react';

const bookingData = {
  id: '1',
  tripName: 'Angkor Wat Sunrise',
  startDate: '2026-06-15',
  status: 'confirmed' as const,
  totalPrice: 360,
  guestCount: 3,
  location: 'Siem Reap',
  qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BK123',
  meetingPoint: 'Your hotel in Siem Reap at 4:30 AM',
  guide: 'Sokha T.',
  guidePhone: '+855 12 345 678',
};

const BookingDetail: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [showCancel, setShowCancel] = React.useState(false);

  const handleCancel = () => {
    toast.success('Booking cancelled. Refund will be processed within 5-7 business days.');
    navigate('/my-trips');
  };

  const isUpcoming = new Date(bookingData.startDate) > new Date();
  const isWithin24h = isUpcoming && new Date(bookingData.startDate).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to My Trips
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{bookingData.tripName}</h1>
        <Badge variant={bookingData.status === 'confirmed' ? 'success' : 'warning'}>
          {bookingData.status.charAt(0).toUpperCase() + bookingData.status.slice(1)}
        </Badge>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-derlg-primary" />
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{bookingData.startDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-derlg-primary" />
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">{bookingData.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-derlg-primary" />
            <div>
              <p className="text-sm text-gray-500">Guests</p>
              <p className="font-medium">{bookingData.guestCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-derlg-primary" />
            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="font-medium">${bookingData.totalPrice}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Meeting Point</h3>
        <p className="text-gray-600">{bookingData.meetingPoint}</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Your Guide</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-600">
            {bookingData.guide.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{bookingData.guide}</p>
            <p className="text-sm text-gray-500">{bookingData.guidePhone}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 text-center">
        <h3 className="font-semibold text-gray-900 mb-3">Check-in QR Code</h3>
        <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
          <QrCode className="h-12 w-12 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500">Show this at the meeting point</p>
      </Card>

      {isWithin24h && (
        <Button
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
          onClick={() => navigate(`/emergency?bookingId=${bookingId}`)}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Emergency Alert
        </Button>
      )}

      {isUpcoming && (
        <Button
          variant="outline"
          className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
          onClick={() => setShowCancel(true)}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel Booking
        </Button>
      )}

      {showCancel && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-700 mb-3">
            Are you sure you want to cancel? Refunds depend on cancellation policy.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowCancel(false)}>
              Keep Booking
            </Button>
            <Button variant="primary" size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleCancel}>
              Confirm Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BookingDetail;
