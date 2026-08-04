import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Trophy, Users, Shield, Cpu, ScanFace, Sigma } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingStats } from "@/hooks/useLandingStats";
import { Logo } from "@/components/Logo";

export function Hero() {
  const { stats } = useLandingStats();

  const statTiles = [
    { icon: Users, value: stats.totalStudents.toLocaleString(), label: "Registered Aspirants" },
    { icon: Trophy, value: stats.totalTests.toLocaleString(), label: "Live Test Papers" },
    { icon: Clock, value: stats.totalSubmissions.toLocaleString(), label: "Attempts Recorded" },
    { icon: Shield, value: "100%", label: "Proctored Sessions" },
  ];

  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Ambient mesh + grid */}
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute inset-0 grid-lines opacity-70" />
      <div className="absolute inset-x-0 top-1/3 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center shadow-glow">
              <Shield className="w-4 h-4 text-accent" />
            </div>
            <span className="font-tech text-sm md:text-base font-bold uppercase tracking-[0.18em] text-hero-foreground">
              Grizzly
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-hero-foreground/70">
            <a href="#features" className="hover:text-accent transition-colors">Platform</a>
            <a href="#intel" className="hover:text-accent transition-colors">Rank Intel</a>
            <a href="#security" className="hover:text-accent transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-hero-foreground hover:bg-primary/15">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="rounded-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90">
                Launch Console
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative container mx-auto px-4 pt-32 pb-20">
        {/* Bento hero grid */}
        <div className="grid lg:grid-cols-12 gap-4 mt-8">
          {/* Main headline tile */}
          <div className="lg:col-span-8 neo-panel-dark neon-border p-8 md:p-12 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="tracking-widest-xs text-accent">JEE · NEET · NDA Test Engine</span>
            </div>

            <h1 className="font-tech text-3xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.05] text-hero-foreground uppercase">
              The Exam Hall,
              <span className="block text-gradient neon-text">Re-Engineered</span>
            </h1>

            <p className="mt-6 text-base md:text-lg text-hero-foreground/70 max-w-xl">
              Simulate the real paper end to end — AI-imported past questions, LaTeX-perfect maths,
              locked-down proctoring, and instant All India Rank intelligence.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 group">
                  Start Free Simulation
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#intel">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full border-primary/40 bg-transparent text-hero-foreground hover:bg-primary/10">
                  Predict My Rank
                </Button>
              </a>
            </div>
          </div>

          {/* Side capability tiles */}
          <div className="lg:col-span-4 grid gap-4">
            {[
              { icon: Cpu, title: "AI Paper Import", copy: "Drop a PYQ PDF — questions, diagrams and marking schemes auto-extract." },
              { icon: Sigma, title: "LaTeX Maths Engine", copy: "Every equation renders exactly like the printed paper." },
              { icon: ScanFace, title: "Lockdown Proctor", copy: "Tab, copy, resize and devtools events flagged in real time." },
            ].map((tile, i) => (
              <div
                key={tile.title}
                className="neo-panel-dark p-5 group hover:border-primary/40 transition-colors animate-slide-up"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <tile.icon className="w-6 h-6 text-accent mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-tech text-sm uppercase tracking-widest text-hero-foreground">{tile.title}</h3>
                <p className="mt-1.5 text-sm text-hero-foreground/60">{tile.copy}</p>
              </div>
            ))}
          </div>

          {/* Live stat strip */}
          {statTiles.map((stat, index) => (
            <div
              key={stat.label}
              className="lg:col-span-3 neo-panel-dark p-6 animate-slide-up"
              style={{ animationDelay: `${0.3 + index * 0.06}s` }}
            >
              <stat.icon className="w-5 h-5 text-accent mb-3" />
              <div className="font-tech text-2xl md:text-3xl font-bold text-hero-foreground">{stat.value}</div>
              <div className="mt-1 tracking-widest-xs text-hero-foreground/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
