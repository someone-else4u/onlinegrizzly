import { CheckCircle2, XCircle, AlertTriangle, Shield } from "lucide-react";

const securityFeatures = [
  "Full-screen mode enforcement",
  "Right-click context menu disabled",
  "Copy-paste prevention (Ctrl+C/V blocked)",
  "Screenshot detection & watermarking",
  "Tab switch monitoring & logging",
  "Developer tools blocking (F12, Ctrl+Shift+I)",
  "Browser resize prevention",
  "Question randomization per student",
  "Option shuffling (A,B,C,D randomized)",
  "Device fingerprinting",
  "IP location tracking",
  "Session token encryption"
];

const detectedBehaviors = [
  { behavior: "Tab Switching", risk: "high", count: 3 },
  { behavior: "Copy Attempt", risk: "high", count: 2 },
  { behavior: "Full-screen Exit", risk: "medium", count: 1 },
  { behavior: "Fast Answer Pattern", risk: "low", count: 5 },
];

export function Security() {
  return (
    <section id="security" className="py-24 bg-gradient-hero text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-sm font-semibold mb-4">
            <Shield className="w-4 h-4 text-accent" />
            Enterprise Security
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Anti-Cheating Technology That
            <span className="text-gradient"> Actually Works</span>
          </h2>
          <p className="text-lg text-primary-foreground/70">
            Our multi-layer security system ensures exam integrity with 99.9% accuracy in detecting suspicious behavior.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Security Features List */}
          <div className="space-y-6">
            <h3 className="text-2xl font-display font-semibold mb-6">Security Measures</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {securityFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10"
                >
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm text-primary-foreground/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Monitoring Preview */}
          <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl p-6">
            <h3 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              Live Monitoring Dashboard
            </h3>
            
            <div className="space-y-3">
              {detectedBehaviors.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/5 border border-primary-foreground/10"
                >
                  <div className="flex items-center gap-3">
                    {item.risk === 'high' ? (
                      <XCircle className="w-5 h-5 text-destructive" />
                    ) : item.risk === 'medium' ? (
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    )}
                    <span className="text-primary-foreground/90">{item.behavior}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.risk === 'high' ? 'bg-destructive/20 text-destructive' :
                      item.risk === 'medium' ? 'bg-warning/20 text-warning' :
                      'bg-success/20 text-success'
                    }`}>
                      {item.risk.toUpperCase()}
                    </span>
                    <span className="text-primary-foreground/60 text-sm">{item.count}x</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary-foreground mb-1">Integrity Alert</p>
                  <p className="text-xs text-primary-foreground/70">
                    Student ID: JEE2024-1234 flagged for multiple tab switches. Auto-generated report sent to admin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
