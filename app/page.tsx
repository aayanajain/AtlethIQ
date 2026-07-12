// app/page.tsx
// Public marketing landing page — "/" — no login required.

import HeroSection from "@/src/components/HeroSection";
import FeaturesSection from "@/src/components/FeaturesSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
    </>
  );
}
