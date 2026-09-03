import { Hero } from "@/components/landing/Hero";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { IntelHub } from "@/components/landing/IntelHub";
import { Security } from "@/components/landing/Security";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { AdSlot } from "@/components/ads/AdSlot";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <BentoFeatures />
      <AdSlot slot="landingMid" />
      <IntelHub />
      <Security />
      <CTA />
      <AdSlot slot="landingBottom" />
      <Footer />
    </div>
  );
};

export default Index;
