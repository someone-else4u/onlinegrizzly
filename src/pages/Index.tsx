import { Hero } from "@/components/landing/Hero";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { IntelHub } from "@/components/landing/IntelHub";
import { Security } from "@/components/landing/Security";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <BentoFeatures />
      <IntelHub />
      <Security />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
