// app/page.tsx
// Public marketing landing page — "/" — no login required.

import HeroSection from "@/src/components/HeroSection";
import FeaturesSection from "@/src/components/FeaturesSection";
import AboutSection from "@/src/components/AboutSection";
import HowItWorksSection from "@/src/components/HowItWorksSection";
import AudienceSection from "@/src/components/AudienceSection";
import CTASection from "@/src/components/CTASection";
import ReviewsSection from "@/src/components/ReviewsSection";
import SiteFooter from "@/src/components/SiteFooter";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <HowItWorksSection />
      <AudienceSection />
      <CTASection />
      <ReviewsSection />
      <SiteFooter />
    </>
  );
}
