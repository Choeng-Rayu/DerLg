import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { toast } from '@/components/ui/Toast';
import { Calendar, Clock, MapPin, Star, Users, ArrowLeft, Check, X } from 'lucide-react';

const tripData = {
  id: '1',
  title: 'Angkor Wat Sunrise',
  description: 'Experience the magical sunrise at Angkor Wat, followed by a full day exploring the ancient temples of the Khmer Empire.',
  price: 120,
  duration: 3,
  images: [
    'https://images.unsplash.com/photo-1600596542815-2495db98dada?w=1200&q=80',
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80',
  ],
  itinerary: [
    { day: 1, title: 'Arrival & Sunset at Angkor', description: 'Pick up from hotel, visit Angkor Wat for sunset, then dinner at local restaurant.' },
    { day: 2, title: 'Temple Circuit', description: 'Early sunrise at Angkor Wat, visit Bayon, Ta Prohm, and Banteay Srei.' },
    { day: 3, title: 'Floating Village & Departure', description: 'Visit Kampong Phluk floating village, then transfer to airport.' },
  ],
  included: ['Professional guide', 'Hotel pickup/dropoff', 'Temple passes', 'Meals', 'Transportation'],
  excluded: ['Personal expenses', 'Tips', 'Travel insurance'],
  meetingPoint: 'Your hotel in Siem Reap',
  cancellationPolicy: 'Free cancellation up to 48 hours before the trip.',
  reviews: [
    { id: '1', user: { name: 'Sarah M.', avatar: null }, rating: 5, text: 'Absolutely breathtaking experience!', verifiedBooking: true },
    { id: '2', user: { name: 'James K.', avatar: null }, rating: 4, text: 'Great guide, beautiful temples.', verifiedBooking: true },
  ],
  averageRating: 4.5,
  reviewCount: 2,
};

const similarTrips = [
  { id: '2', title: 'Phnom Penh Heritage', price: 85, duration: 2, image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80' },
  { id: '3', title: 'Siem Reap Food Tour', price: 45, duration: 1, image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80' },
];

const TripDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = React.useState(true);
  const [activeImage, setActiveImage] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton height="400px" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton height="40px" width="70%" />
            <Skeleton height="20px" width="40%" />
            <Skeleton height="100px" />
          </div>
          <Skeleton height="200px" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>

      {/* Gallery */}
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden h-64 md:h-96 bg-gray-100">
          <img src={tripData.images[activeImage]} alt={tripData.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex gap-3">
          {tripData.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(idx)}
              className={`h-20 w-32 rounded-lg overflow-hidden border-2 transition-colors ${activeImage === idx ? 'border-derlg-primary' : 'border-transparent'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{tripData.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" /> {tripData.averageRating} ({tripData.reviewCount} reviews)
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {tripData.duration} days
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Siem Reap
              </span>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed">{tripData.description}</p>

          <Tabs
            tabs={[
              {
                id: 'itinerary',
                label: 'Itinerary',
                content: (
                  <div className="space-y-4">
                    {tripData.itinerary.map((day) => (
                      <div key={day.day} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-derlg-primary text-white flex items-center justify-center font-semibold">
                          {day.day}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{day.title}</h4>
                          <p className="text-gray-600 text-sm">{day.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                id: 'details',
                label: 'Details',
                content: (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Meeting Point</h4>
                      <p className="text-gray-600 text-sm">{tripData.meetingPoint}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Included</h4>
                      <ul className="space-y-1">
                        {tripData.included.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                            <Check className="h-4 w-4 text-green-500" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Not Included</h4>
                      <ul className="space-y-1">
                        {tripData.excluded.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                            <X className="h-4 w-4 text-red-400" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h4>
                      <p className="text-gray-600 text-sm">{tripData.cancellationPolicy}</p>
                    </div>
                  </div>
                ),
              },
              {
                id: 'reviews',
                label: `Reviews (${tripData.reviewCount})`,
                content: (
                  <div className="space-y-4">
                    {tripData.reviews.map((review) => (
                      <Card key={review.id} className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                            {review.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{review.user.name}</p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.verifiedBooking && (
                            <Badge variant="success" className="ml-auto">Verified</Badge>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm">{review.text}</p>
                      </Card>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">${tripData.price}</div>
            <p className="text-gray-500 text-sm mb-4">per person</p>
            <Link to={`/booking/${tripData.id}`}>
              <Button className="w-full" size="lg">
                Book Now
              </Button>
            </Link>
          </Card>

          {/* Similar Trips */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Similar Trips</h3>
            <div className="space-y-3">
              {similarTrips.map((trip) => (
                <Link key={trip.id} to={`/trips/${trip.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-32 bg-gray-200">
                      <img src={trip.image} alt={trip.title} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="pt-3">
                      <h4 className="font-medium text-gray-900">{trip.title}</h4>
                      <p className="text-sm text-gray-500">{trip.duration} days · ${trip.price}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
