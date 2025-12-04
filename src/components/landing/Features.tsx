import { 
  FileText, 
  BarChart3, 
  Shield, 
  Clock, 
  Users, 
  Brain,
  Eye,
  Lock,
  Zap
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Smart Test Creation",
    description: "Upload MCQs with images, set difficulty levels, bulk import from Excel, and use AI-powered question templates.",
    color: "bg-accent/10 text-accent"
  },
  {
    icon: Shield,
    title: "Military-Grade Security",
    description: "Full-screen enforcement, copy-paste blocking, tab switch detection, and real-time proctoring.",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Percentile rankings, topic-wise performance, time analysis, and AI-powered improvement suggestions.",
    color: "bg-success/10 text-success"
  },
  {
    icon: Clock,
    title: "Real Exam Experience",
    description: "Timed tests with JEE/NEET patterns, section-wise submission, and authentic exam interface.",
    color: "bg-warning/10 text-warning"
  },
  {
    icon: Eye,
    title: "Live Proctoring",
    description: "Optional webcam monitoring, behavior analysis, and suspicious activity flagging.",
    color: "bg-destructive/10 text-destructive"
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Personalized study plans, weakness identification, and predictive score analysis.",
    color: "bg-accent/10 text-accent"
  },
  {
    icon: Users,
    title: "Batch Management",
    description: "Organize students by class, track progress, and generate bulk performance reports.",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: Lock,
    title: "Anti-Cheating Engine",
    description: "Pattern matching, answer similarity detection, and integrity reports for every test.",
    color: "bg-success/10 text-success"
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Immediate score calculation, detailed explanations, and video solutions for each question.",
    color: "bg-warning/10 text-warning"
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            Powerful Features
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Everything You Need to 
            <span className="text-gradient"> Ace Your Exam</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Built by educators and engineers who understand what JEE & NEET aspirants truly need.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
