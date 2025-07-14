import { 
  LandingHero, 
  PartnersSection,
  FeaturesGrid, 
  ScalesToAllSizes,
  CodeExample, 
  LiveDemo,
  Testimonials,
  UpcomingSection,
  Footer 
} from "@/components/landing"

/**
 * Curia Host Service Landing Page
 * 
 * Professional landing page showcasing the Web3 forum embed platform
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-900 no-horizontal-scroll">
      <LandingHero />
      <PartnersSection />
      <FeaturesGrid />
      <ScalesToAllSizes />
      <Testimonials />
      <LiveDemo />
      <CodeExample />
      <UpcomingSection />
      <Footer />
    </main>
  );
} 