import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, Sparkles, Tent, TreePine, Utensils, Landmark, Waves } from 'lucide-react';

const categories = [
  { id: 'temples', label: 'Temples', icon: Landmark },
  { id: 'nature', label: 'Nature', icon: TreePine },
  { id: 'culture', label: 'Culture', icon: Tent },
  { id: 'adventure', label: 'Adventure', icon: Waves },
  { id: 'food', label: 'Food', icon: Utensils },
];

const featuredTrips = [
  { id: '1', title: 'Angkor Wat Sunrise', price: 120, duration: 3, image: 'https://images.unsplash.com/photo-1600596542815-2495db98dada?w=600&q=80' },
  { id: '2', title: 'Phnom Penh Heritage', price: 85, duration: 2, image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80' },
  { id: '3', title: 'Siem Reap Food Tour', price: 45, duration: 1, image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80' },
];

const upcomingFestivals = [
  { id: '1', name: 'Khmer New Year', date: '2026-04-13', location: 'Nationwide' },
  { id: '2', name: 'Water Festival', date: '2026-11-10', location: 'Phnom Penh' },
];

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState('');

  return (
    <div className="space-y-10 pb-12">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-derlg-primary to-blue-800 text-white py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('home.heroTitle')}</h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8">{t('home.heroSubtitle')}</p>
          <div className="max-w-xl mx-auto flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={t('home.searchPlaceholder')}
                iconLeft={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/90 text-gray-900 placeholder-gray-500 border-none"
              />
            </div>
            <Link to={`/explore?q=${encodeURIComponent(search)}`}>
              <Button size="lg">{t('home.bookNow')}</Button>
            </Link>
          </div>
          <button className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors">
            <Sparkles className="h-4 w-4" />
            Ask AI for recommendations
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('home.categories')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/explore?category=${cat.id}`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-derlg-primary hover:shadow-sm transition-all"
            >
              <cat.icon className="h-6 w-6 text-derlg-primary" />
              <span className="text-sm font-medium text-gray-700">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Trips */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{t('home.featuredTrips')}</h2>
          <Link to="/explore" className="text-sm text-derlg-primary font-medium hover:underline">
            {t('home.viewAll')}
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredTrips.map((trip) => (
            <Link key={trip.id} to={`/trips/${trip.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gray-200">
                  <img src={trip.image} alt={trip.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <CardContent className="pt-3">
                  <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {trip.duration} days · ${trip.price}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming Festivals */}
      <section className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('home.upcomingFestivals')}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {upcomingFestivals.map((festival) => (
            <Card key={festival.id} className="p-4 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer">
              <div className="h-12 w-12 rounded-full bg-derlg-secondary/10 flex items-center justify-center text-derlg-secondary">
                <Tent className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{festival.name}</h3>
                <p className="text-sm text-gray-500">
                  {festival.date} · {festival.location}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
