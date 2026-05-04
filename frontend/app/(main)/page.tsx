import { CategoriesSection } from '@/components/home/CategoriesSection'
import { FeaturedTrips } from '@/components/home/FeaturedTrips'
import { FestivalsSection } from '@/components/home/FestivalsSection'
import { HeroSection } from '@/components/home/HeroSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <FeaturedTrips />
      <FestivalsSection />
    </>
  )
}
