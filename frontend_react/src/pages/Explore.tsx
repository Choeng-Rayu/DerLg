import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Search, MapPin, Calendar } from 'lucide-react';

const places = [
  { id: '1', name: 'Angkor Wat', category: 'temples', region: 'Siem Reap', description: 'The largest religious monument in the world.' },
  { id: '2', name: 'Bayon Temple', category: 'temples', region: 'Siem Reap', description: 'Famous for its smiling stone faces.' },
  { id: '3', name: 'Koh Rong', category: 'nature', region: 'Sihanoukville', description: 'Pristine island with white sand beaches.' },
  { id: '4', name: 'Tonle Sap', category: 'nature', region: 'Siem Reap', description: 'The largest freshwater lake in Southeast Asia.' },
];

const festivals = [
  { id: '1', name: 'Khmer New Year', date: '2026-04-13', location: 'Nationwide', description: 'Three days of traditional games and ceremonies.', type: 'cultural' },
  { id: '2', name: 'Water Festival', date: '2026-11-10', location: 'Phnom Penh', description: 'Boat races and fireworks on the Tonle Sap river.', type: 'cultural' },
];

const filters = ['all', 'temples', 'nature', 'culture', 'adventure', 'food'];

const Explore: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('category') || 'all');
  const [selectedPlace, setSelectedPlace] = useState<typeof places[0] | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<typeof festivals[0] | null>(null);

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = activeFilter === 'all' || p.category === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [search, activeFilter]);

  const filteredFestivals = useMemo(() => {
    return festivals.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.explore')}</h1>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              activeFilter === f
                ? 'bg-derlg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Input
        placeholder={t('explore.search')}
        iconLeft={<Search className="h-4 w-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Tabs
        tabs={[
          {
            id: 'places',
            label: t('explore.places'),
            content: (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlaces.map((place) => (
                  <Card
                    key={place.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedPlace(place)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900">{place.name}</h3>
                        <Badge variant="info">{place.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {place.region}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{place.description}</p>
                    </CardContent>
                  </Card>
                ))}
                {filteredPlaces.length === 0 && (
                  <p className="text-gray-500 col-span-full text-center py-8">{t('explore.noResults')}</p>
                )}
              </div>
            ),
          },
          {
            id: 'festivals',
            label: t('explore.festivals'),
            content: (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredFestivals.map((festival) => (
                  <Card
                    key={festival.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedFestival(festival)}
                  >
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-gray-900">{festival.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {festival.date}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {festival.location}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">{festival.description}</p>
                    </CardContent>
                  </Card>
                ))}
                {filteredFestivals.length === 0 && (
                  <p className="text-gray-500 col-span-full text-center py-8">{t('explore.noResults')}</p>
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal isOpen={!!selectedPlace} onClose={() => setSelectedPlace(null)} title={selectedPlace?.name}>
        <div className="space-y-2">
          <Badge variant="info">{selectedPlace?.category}</Badge>
          <p className="text-gray-600">{selectedPlace?.description}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {selectedPlace?.region}
          </p>
        </div>
      </Modal>

      <Modal isOpen={!!selectedFestival} onClose={() => setSelectedFestival(null)} title={selectedFestival?.name}>
        <div className="space-y-2">
          <p className="text-gray-600">{selectedFestival?.description}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {selectedFestival?.date}
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {selectedFestival?.location}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Explore;
