import { LandingNav } from '@/features/landing/LandingNav'
import { Hero } from '@/features/landing/Hero'
import { Features } from '@/features/landing/Features'
import { Pricing } from '@/features/landing/Pricing'
import { Testimonials } from '@/features/landing/Testimonials'
import { Footer } from '@/features/landing/Footer'
import { AnimatedPage } from '@/components/common/AnimatedPage'

export function LandingPage() {
  return (
    <AnimatedPage>
      <LandingNav />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
      </main>
      <Footer />
    </AnimatedPage>
  )
}
