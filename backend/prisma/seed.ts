import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ---- 1. Trips ----
  const trips = await Promise.all([
    prisma.trip.upsert({
      where: { slug: 'angkor-wat-sunrise-3d' },
      update: {},
      create: {
        title: 'Angkor Wat Sunrise Experience',
        titleKh: 'បទពិសោធន៍ព្រះអាទិត្យរះនៅអង្គរវត្ត',
        titleZh: '吴哥窟日出体验',
        slug: 'angkor-wat-sunrise-3d',
        description:
          'Witness the legendary sunrise over Angkor Wat, explore Bayon Temple, and discover the hidden gems of the Angkor Archaeological Park.',
        descriptionKh:
          'មើលព្រះអាទិត្យរះដ៏ល្បីនៅអង្គរវត្ត រុករកប្រាសាទបាយ័ន និងរកមើលកន្លែងលាក់កំបាំងនៅឧទ្យានបុរាណអង្គរ។',
        destination: 'Siem Reap',
        province: 'Siem Reap',
        durationDays: 3,
        pricePerPersonUsd: 180,
        environment: 'TEMPLE',
        moodTags: ['cultural', 'historical', 'spiritual'],
        highlights: [
          'Sunrise at Angkor Wat',
          'Bayon Temple faces tour',
          'Ta Prohm jungle temple',
          'Angkor Thom ancient city',
          'Traditional Apsara dance dinner',
        ],
        minPeople: 1,
        maxPeople: 15,
        imageUrls: ['/images/trips/angkor-wat-1.jpg'],
        avgRating: 4.85,
        totalReviews: 234,
        isActive: true,
      },
    }),
    prisma.trip.upsert({
      where: { slug: 'koh-rong-beach-escape-4d' },
      update: {},
      create: {
        title: 'Koh Rong Beach Escape',
        titleKh: 'ការរកមើលឆ្នេរកោះរុង',
        titleZh: '高龙岛海滩度假',
        slug: 'koh-rong-beach-escape-4d',
        description:
          'Relax on pristine white sand beaches, snorkel crystal-clear waters, and enjoy bioluminescent plankton at night.',
        destination: 'Koh Rong',
        province: 'Sihanoukville',
        durationDays: 4,
        pricePerPersonUsd: 250,
        environment: 'ISLAND',
        moodTags: ['relaxation', 'beach', 'adventure'],
        highlights: [
          'Long Beach white sand',
          'Snorkeling with tropical fish',
          'Bioluminescent plankton',
          'Kayaking to hidden coves',
          'Sunset beach bonfire',
        ],
        minPeople: 1,
        maxPeople: 10,
        imageUrls: ['/images/trips/koh-rong-1.jpg'],
        avgRating: 4.72,
        totalReviews: 156,
        isActive: true,
      },
    }),
    prisma.trip.upsert({
      where: { slug: 'cardamom-mountains-trek-5d' },
      update: {},
      create: {
        title: 'Cardamom Mountains Trek',
        titleKh: 'ដំណើរជំរះភ្នំក្រវាញ',
        titleZh: '豆蔻山徒步探险',
        slug: 'cardamom-mountains-trek-5d',
        description:
          'Hike through one of Southeast Asia\'s largest rainforests, encounter wildlife, and camp by pristine waterfalls.',
        destination: 'Cardamom Mountains',
        province: 'Koh Kong',
        durationDays: 5,
        pricePerPersonUsd: 350,
        environment: 'FOREST',
        moodTags: ['adventure', 'nature', 'wildlife'],
        highlights: [
          'Rainforest trekking',
          'Waterfall camping',
          'Wildlife spotting',
          'River swimming',
          'Indigenous community visit',
        ],
        minPeople: 2,
        maxPeople: 8,
        imageUrls: ['/images/trips/cardamom-1.jpg'],
        avgRating: 4.90,
        totalReviews: 89,
        isActive: true,
      },
    }),
    prisma.trip.upsert({
      where: { slug: 'phnom-penh-culture-2d' },
      update: {},
      create: {
        title: 'Phnom Penh Cultural Discovery',
        titleKh: 'ការរកឃើញវប្បធម៌ភ្នំពេញ',
        titleZh: '金边文化之旅',
        slug: 'phnom-penh-culture-2d',
        description:
          'Explore the Royal Palace, Silver Pagoda, Central Market, and enjoy the vibrant riverside nightlife.',
        destination: 'Phnom Penh',
        province: 'Phnom Penh',
        durationDays: 2,
        pricePerPersonUsd: 120,
        environment: 'CITY',
        moodTags: ['cultural', 'food', 'nightlife'],
        highlights: [
          'Royal Palace tour',
          'Central Market shopping',
          'Tuol Sleng Museum',
          'Riverside food tour',
          'Rooftop sunset drinks',
        ],
        minPeople: 1,
        maxPeople: 20,
        imageUrls: ['/images/trips/phnom-penh-1.jpg'],
        avgRating: 4.60,
        totalReviews: 312,
        isActive: true,
      },
    }),
    prisma.trip.upsert({
      where: { slug: 'bokor-mountain-adventure-3d' },
      update: {},
      create: {
        title: 'Bokor Mountain Adventure',
        titleKh: 'ការផ្សងព្រេងភ្នំបូកគោ',
        titleZh: '波哥山探险',
        slug: 'bokor-mountain-adventure-3d',
        description:
          'Explore the abandoned French hill station, hike through cloud forests, and enjoy panoramic views of the coast.',
        destination: 'Bokor National Park',
        province: 'Kampot',
        durationDays: 3,
        pricePerPersonUsd: 200,
        environment: 'MOUNTAIN',
        moodTags: ['adventure', 'history', 'nature'],
        highlights: [
          'Abandoned Bokor Palace',
          'Cloud forest hiking',
          'Popokvil Waterfall',
          'Panoramic coast views',
          'Kampot pepper farm visit',
        ],
        minPeople: 2,
        maxPeople: 12,
        imageUrls: ['/images/trips/bokor-1.jpg'],
        avgRating: 4.78,
        totalReviews: 67,
        isActive: true,
      },
    }),
    prisma.trip.upsert({
      where: { slug: 'kep-beach-seafood-2d' },
      update: {},
      create: {
        title: 'Kep Beach & Seafood Trail',
        titleKh: 'ឆ្នេរកែប និងផ្លូវម្ហូបសមុទ្រ',
        titleZh: '白马海滩与海鲜之旅',
        slug: 'kep-beach-seafood-2d',
        description:
          'Enjoy fresh crab at the famous Kep Crab Market, swim at sunset beach, and visit Rabbit Island.',
        destination: 'Kep',
        province: 'Kep',
        durationDays: 2,
        pricePerPersonUsd: 130,
        environment: 'BEACH',
        moodTags: ['relaxation', 'food', 'beach'],
        highlights: [
          'Kep Crab Market feast',
          'Rabbit Island snorkeling',
          'Sunset beach relaxation',
          'Kampot pepper plantation',
          'Kayaking mangroves',
        ],
        minPeople: 1,
        maxPeople: 10,
        imageUrls: ['/images/trips/kep-1.jpg'],
        avgRating: 4.65,
        totalReviews: 198,
        isActive: true,
      },
    }),
  ])
  console.log(`  ✅ Created ${trips.length} trips`)

  // ---- 2. Hotels ----
  const hotels = await Promise.all([
    prisma.hotel.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Angkor Grand Resort',
        province: 'Siem Reap',
        address: 'National Road 6, Siem Reap',
        starRating: 5,
        amenities: ['pool', 'spa', 'gym', 'restaurant', 'wifi', 'airport_shuttle'],
        imageUrls: ['/images/hotels/angkor-grand-1.jpg'],
        checkInTime: '14:00',
        checkOutTime: '12:00',
        isActive: true,
      },
    }),
    prisma.hotel.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Riverside Boutique Hotel',
        province: 'Phnom Penh',
        address: 'Sisowath Quay, Phnom Penh',
        starRating: 4,
        amenities: ['rooftop_bar', 'restaurant', 'wifi', 'laundry'],
        imageUrls: ['/images/hotels/riverside-boutique-1.jpg'],
        checkInTime: '14:00',
        checkOutTime: '11:00',
        isActive: true,
      },
    }),
    prisma.hotel.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Koh Rong Beach Resort',
        province: 'Sihanoukville',
        address: 'Long Beach, Koh Rong Island',
        starRating: 4,
        amenities: ['beach_access', 'dive_center', 'restaurant', 'wifi'],
        imageUrls: ['/images/hotels/koh-rong-resort-1.jpg'],
        checkInTime: '15:00',
        checkOutTime: '11:00',
        isActive: true,
      },
    }),
  ])
  console.log(`  ✅ Created ${hotels.length} hotels`)

  // ---- 3. Hotel Rooms ----
  const rooms = await Promise.all([
    prisma.hotelRoom.upsert({
      where: { id: '00000000-0000-0000-0001-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0001-000000000001',
        hotelId: hotels[0].id,
        roomType: 'DOUBLE',
        bedrooms: 1,
        capacity: 2,
        pricePerNightUsd: 85,
        amenities: ['ac', 'minibar', 'balcony', 'pool_view'],
        imageUrls: ['/images/rooms/angkor-double-1.jpg'],
        totalRooms: 20,
        isActive: true,
      },
    }),
    prisma.hotelRoom.upsert({
      where: { id: '00000000-0000-0000-0001-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0001-000000000002',
        hotelId: hotels[0].id,
        roomType: 'SUITE',
        bedrooms: 2,
        capacity: 4,
        pricePerNightUsd: 220,
        amenities: ['ac', 'minibar', 'jacuzzi', 'river_view', 'living_room'],
        imageUrls: ['/images/rooms/angkor-suite-1.jpg'],
        totalRooms: 5,
        isActive: true,
      },
    }),
    prisma.hotelRoom.upsert({
      where: { id: '00000000-0000-0000-0001-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0001-000000000003',
        hotelId: hotels[1].id,
        roomType: 'SINGLE',
        bedrooms: 1,
        capacity: 1,
        pricePerNightUsd: 45,
        amenities: ['ac', 'wifi', 'city_view'],
        imageUrls: ['/images/rooms/riverside-single-1.jpg'],
        totalRooms: 15,
        isActive: true,
      },
    }),
    prisma.hotelRoom.upsert({
      where: { id: '00000000-0000-0000-0001-000000000004' },
      update: {},
      create: {
        id: '00000000-0000-0000-0001-000000000004',
        hotelId: hotels[2].id,
        roomType: 'DOUBLE',
        bedrooms: 1,
        capacity: 2,
        pricePerNightUsd: 65,
        amenities: ['fan', 'beach_access', 'hammock'],
        imageUrls: ['/images/rooms/kohrong-double-1.jpg'],
        totalRooms: 10,
        isActive: true,
      },
    }),
  ])
  console.log(`  ✅ Created ${rooms.length} hotel rooms`)

  // ---- 4. Transportation Vehicles ----
  const vehicles = await Promise.all([
    prisma.transportationVehicle.upsert({
      where: { id: '00000000-0000-0000-0002-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0002-000000000001',
        category: 'VAN',
        model: 'Toyota HiAce',
        tier: 'STANDARD',
        seatCapacity: 12,
        pricePerDayUsd: 75,
        pricePerKmUsd: 0.35,
        features: ['ac', 'wifi', 'usb_charging'],
        imageUrls: ['/images/vehicles/hiace-1.jpg'],
        isActive: true,
      },
    }),
    prisma.transportationVehicle.upsert({
      where: { id: '00000000-0000-0000-0002-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0002-000000000002',
        category: 'VAN',
        model: 'Mercedes-Benz Sprinter',
        tier: 'VIP',
        seatCapacity: 8,
        pricePerDayUsd: 150,
        pricePerKmUsd: 0.55,
        features: ['ac', 'wifi', 'leather_seats', 'minibar', 'entertainment_system'],
        imageUrls: ['/images/vehicles/sprinter-1.jpg'],
        isActive: true,
      },
    }),
    prisma.transportationVehicle.upsert({
      where: { id: '00000000-0000-0000-0002-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0002-000000000003',
        category: 'TUK_TUK',
        model: 'Classic Tuk-Tuk',
        tier: 'STANDARD',
        seatCapacity: 4,
        pricePerDayUsd: 25,
        pricePerKmUsd: 0.15,
        features: ['open_air', 'rain_cover'],
        imageUrls: ['/images/vehicles/tuktuk-1.jpg'],
        isActive: true,
      },
    }),
    prisma.transportationVehicle.upsert({
      where: { id: '00000000-0000-0000-0002-000000000004' },
      update: {},
      create: {
        id: '00000000-0000-0000-0002-000000000004',
        category: 'BUS',
        model: 'Giant Ibis Sleeper Bus',
        tier: 'VIP',
        seatCapacity: 24,
        pricePerDayUsd: 200,
        pricePerKmUsd: 0.25,
        features: ['ac', 'wifi', 'sleeper_beds', 'tv', 'snacks'],
        imageUrls: ['/images/vehicles/sleeper-bus-1.jpg'],
        isActive: true,
      },
    }),
  ])
  console.log(`  ✅ Created ${vehicles.length} vehicles`)

  // ---- 5. Places ----
  const places = await Promise.all([
    prisma.place.upsert({
      where: { id: '00000000-0000-0000-0003-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0003-000000000001',
        name: 'Angkor Wat',
        nameKh: 'អង្គរវត្ត',
        nameZh: '吴哥窟',
        province: 'Siem Reap',
        category: 'TEMPLE',
        description: 'The largest religious structure in the world, a UNESCO World Heritage Site.',
        visitorTips: 'Visit at sunrise for the best photos. Dress modestly (cover shoulders and knees).',
        dressCode: 'Cover shoulders and knees',
        entryFeeUsd: 37,
        openingHours: { open: '05:00', close: '17:30' },
        latitude: 13.4125,
        longitude: 103.8670,
        imageUrls: ['/images/places/angkor-wat-1.jpg'],
        isOfflineAvailable: true,
      },
    }),
    prisma.place.upsert({
      where: { id: '00000000-0000-0000-0003-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0003-000000000002',
        name: 'Royal Palace',
        nameKh: 'ព្រះបរមរាជវាំង',
        nameZh: '皇宫',
        province: 'Phnom Penh',
        category: 'MUSEUM',
        description: 'The official residence of the King of Cambodia, featuring the Silver Pagoda.',
        visitorTips: 'Photography is not allowed inside the Silver Pagoda.',
        dressCode: 'Cover shoulders and knees',
        entryFeeUsd: 10,
        openingHours: { open: '08:00', close: '17:00', break: '11:00-14:00' },
        latitude: 11.5639,
        longitude: 104.9319,
        imageUrls: ['/images/places/royal-palace-1.jpg'],
        isOfflineAvailable: true,
      },
    }),
    prisma.place.upsert({
      where: { id: '00000000-0000-0000-0003-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0003-000000000003',
        name: 'Phsar Thmei (Central Market)',
        nameKh: 'ផ្សារថ្មី',
        nameZh: '中央市场',
        province: 'Phnom Penh',
        category: 'MARKET',
        description: 'Art Deco landmark built in 1937. Shop for gems, textiles, and street food.',
        entryFeeUsd: 0,
        openingHours: { open: '07:00', close: '17:00' },
        latitude: 11.5694,
        longitude: 104.9210,
        imageUrls: ['/images/places/central-market-1.jpg'],
        isOfflineAvailable: true,
      },
    }),
  ])
  console.log(`  ✅ Created ${places.length} places`)

  // ---- 6. Festivals ----
  const festivals = await Promise.all([
    prisma.festival.upsert({
      where: { id: '00000000-0000-0000-0004-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0004-000000000001',
        name: 'Water Festival (Bon Om Touk)',
        nameKh: 'បុណ្យអុំទូក',
        nameZh: '送水节',
        province: 'Phnom Penh',
        startDate: new Date('2026-11-14'),
        endDate: new Date('2026-11-16'),
        description: 'Cambodia\'s largest celebration with boat races, fireworks, and illuminated floats along the Tonle Sap river.',
        placeId: places[1].id,
        hasDiscount: true,
        discountPercent: 15,
        isActive: true,
      },
    }),
    prisma.festival.upsert({
      where: { id: '00000000-0000-0000-0004-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0004-000000000002',
        name: 'Khmer New Year (Choul Chnam Thmey)',
        nameKh: 'ចូលឆ្នាំថ្មី',
        nameZh: '柬埔寨新年',
        startDate: new Date('2027-04-14'),
        endDate: new Date('2027-04-16'),
        description: 'The biggest holiday in Cambodia. Three days of celebrations with traditional games, dance, and family gatherings.',
        hasDiscount: true,
        discountPercent: 20,
        isActive: true,
      },
    }),
  ])
  console.log(`  ✅ Created ${festivals.length} festivals`)

  // ---- 7. Discount Codes ----
  const discountCodes = await Promise.all([
    prisma.discountCode.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2027-12-31'),
        maxUses: 1000,
        isActive: true,
      },
    }),
    prisma.discountCode.upsert({
      where: { code: 'WATERFEIST26' },
      update: {},
      create: {
        code: 'WATERFEIST26',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minBookingUsd: 100,
        validFrom: new Date('2026-11-01'),
        validUntil: new Date('2026-11-30'),
        festivalId: festivals[0].id,
        maxUses: 500,
        isActive: true,
      },
    }),
    prisma.discountCode.upsert({
      where: { code: 'FLAT25' },
      update: {},
      create: {
        code: 'FLAT25',
        discountType: 'FIXED_AMOUNT',
        discountValue: 25,
        minBookingUsd: 150,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2027-06-30'),
        maxUses: 200,
        isActive: true,
      },
    }),
  ])
  console.log(`  ✅ Created ${discountCodes.length} discount codes`)

  console.log('\n🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
