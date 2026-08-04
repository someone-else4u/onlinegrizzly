import {
  FileText,
  BarChart3,
  Shield,
  Clock,
  Users,
  Brain,
  Eye,
  Lock,
  Zap,
  MessageSquare,
} from "lucide-react";

const bento = [
  {
    icon: Brain,
    title: "AI Question Intelligence",
    description:
      "Upload a past paper or a photo of it — the engine extracts every question, crops diagrams and tables, tags chapters and years, and applies the exam's own marking scheme.",
    span: "md:col-span-2 md:row-span-2",
    feature: true,
  },
  { icon: FileText, title: "Pattern-Accurate Papers", description: "JEE Main, JEE Advanced, NEET and NDA marking presets with per-question decimal marks." },
  { icon: Clock, title: "Real Exam Clock", description: "Sectional timers, question palette and review flags identical to the live console." },
  { icon: Shield, title: "Lockdown Mode", description: "Full-screen enforcement, copy-paste blocking and devtools shielding." },
  { icon: Eye, title: "Behaviour Telemetry", description: "Tab switches, focus loss and answer-speed anomalies logged per student." },
  {
    icon: BarChart3,
    title: "Rank & Mastery Analytics",
    description: "Percentile curves, chapter mastery heatmaps and time-per-question breakdowns after every attempt.",
    span: "md:col-span-2",
  },
  { icon: Users, title: "Batch Command", description: "Organise batches, schedule windows and run thousands of concurrent sessions." },
  { icon: MessageSquare, title: "Realtime Messaging", description: "Live faculty-to-student chat with unread badges and presence." },
  { icon: Lock, title: "Integrity Reports", description: "Similarity detection and per-attempt integrity scoring." },
  { icon: Zap, title: "Instant Scoring", description: "Server-side grading the second a paper is submitted." },
];

export function BentoFeatures() {
  return (
    <section id="features" className="relative py-24 bg-background overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-40" />
      <div className="relative container mx-auto px-4">
        <div className="max-w-2xl mb-14">
          <span className="tracking-widest-xs text-primary">The Platform</span>
          <h2 className="mt-4 font-tech text-3xl md:text-5xl font-extrabold uppercase text-foreground leading-[1.1]">
            One console for the
            <span className="text-gradient"> entire exam cycle</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Author, secure, deliver and analyse — built for institutions running real JEE, NEET and NDA
            simulations at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[minmax(150px,auto)] gap-4">
          {bento.map((item) => (
            <div
              key={item.title}
              className={`group relative overflow-hidden neo-panel p-6 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 ${item.span ?? ""}`}
            >
              {item.feature && (
                <div className="absolute inset-0 bg-gradient-mesh opacity-80 pointer-events-none" />
              )}
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className={`font-tech uppercase tracking-widest text-foreground ${item.feature ? "text-lg" : "text-sm"}`}>
                  {item.title}
                </h3>
                <p className={`mt-2 text-muted-foreground ${item.feature ? "text-base max-w-md" : "text-sm"}`}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
