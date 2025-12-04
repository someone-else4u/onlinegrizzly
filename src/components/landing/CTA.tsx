import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="relative max-w-4xl mx-auto text-center p-12 md:p-16 rounded-3xl bg-gradient-hero overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/50 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-sm text-primary-foreground/80">Start Your JEE/NEET Journey</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
              Ready to Practice with
              <span className="text-gradient"> Real Exam Conditions?</span>
            </h2>

            <p className="text-lg text-primary-foreground/70 mb-8 max-w-2xl mx-auto">
              Join thousands of successful aspirants who improved their scores by 30% using our secure testing platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button variant="hero" className="group">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button variant="hero-outline">
                  Admin Login
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-primary-foreground/50">
              No credit card required • 7-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
