import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Check, Download, Home, Calendar, Mail, Phone } from 'lucide-react';

const Confirmation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId, totalPrice } = (location.state as { bookingId?: string; totalPrice?: number }) || {};

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-8">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <Check className="h-10 w-10 text-green-600" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-600">Your trip has been successfully booked.</p>
      </div>

      <Card className="text-left p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Booking Reference</span>
            <Badge variant="info">{bookingId || 'BK-12345678'}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Trip</span>
            <span className="font-medium">Angkor Wat Sunrise</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Paid</span>
            <span className="font-bold text-derlg-primary">${totalPrice?.toFixed(2) || '120.00'}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-6 pt-6">
          <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Check className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Show this QR code at check-in</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
        </div>
      </Card>

      <div className="space-y-3 text-left">
        <h3 className="font-semibold text-gray-900 text-center">Need Help?</h3>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-derlg-primary" />
            <div>
              <p className="font-medium text-sm">+855 12 345 678</p>
              <p className="text-xs text-gray-500">24/7 Emergency Support</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-derlg-primary" />
            <div>
              <p className="font-medium text-sm">support@derlg.com</p>
              <p className="text-xs text-gray-500">General inquiries</p>
            </div>
          </div>
        </Card>
      </div>

      <Button onClick={() => navigate('/')} className="w-full" size="lg">
        <Home className="h-4 w-4 mr-2" />
        Back to Home
      </Button>
    </div>
  );
};

export default Confirmation;
