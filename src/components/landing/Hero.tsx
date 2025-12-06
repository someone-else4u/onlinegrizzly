import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/50 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative container mx-auto px-4 pt-32 pb-20">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-primary-foreground">GRIZZLY INTEGRATED</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-primary-foreground/80">
              <a href="#features" className="hover:text-primary-foreground transition-colors">Features</a>
              <a href="#security" className="hover:text-primary-foreground transition-colors">Security</a>
              <a href="#pricing" className="hover:text-primary-foreground transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="accent" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto text-center mt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-primary-foreground/80">Trusted by 50,000+ JEE & NEET Aspirants</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary-foreground mb-6 leading-tight animate-slide-up">
            Secure Online Exams for
            <span className="block text-gradient">JEE & NEET Success</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Enterprise-grade proctoring with AI-powered cheating detection. 
            Practice with real exam conditions and track your All India Rank.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register">
              <Button variant="hero" className="group">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="hero-outline">
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {[
              { icon: Users, value: '50,000+', label: 'Active Students' },
              { icon: Trophy, value: '1,200+', label: 'Top 1000 Rankers' },
              { icon: Clock, value: '10M+', label: 'Tests Completed' },
              { icon: Shield, value: '99.9%', label: 'Cheating Detection' },
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-colors">
                <stat.icon className="w-8 h-8 text-accent mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold text-primary-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
