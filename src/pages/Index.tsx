import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Security } from "@/components/landing/Security";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <Security />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
