import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Monitor,
  Camera,
  Keyboard,
  Mouse,
  ArrowLeft
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

const systemRequirements = [
  { icon: Monitor, label: "Full Screen Mode", status: "ready", description: "Browser will enter full screen" },
  { icon: Keyboard, label: "Keyboard Shortcuts Disabled", status: "ready", description: "Copy, paste, and other shortcuts blocked" },
  { icon: Mouse, label: "Right-Click Disabled", status: "ready", description: "Context menu will be blocked" },
  { icon: Camera, label: "Webcam Access", status: "optional", description: "For proctoring (optional)" },
];

const instructions = [
  "This test contains 90 questions divided into Physics, Chemistry, and Mathematics.",
  "Each correct answer carries +4 marks and each incorrect answer carries -1 mark.",
  "You can mark questions for review and navigate freely between questions.",
  "The test will auto-submit when the time runs out.",
  "Do not switch tabs or minimize the window during the test.",
  "Any suspicious activity will be flagged and reported.",
  "Ensure you have a stable internet connection before starting.",
  "Once started, the test cannot be paused."
];

export default function TestPreview() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleStartTest = async () => {
    if (!agreedToTerms) return;
    
    setIsChecking(true);
    // Simulate system check
    await new Promise(resolve => setTimeout(resolve, 1500));
    navigate(`/test/${testId}/exam`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">ExamShield</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Test Info Card */}
        <div className="bg-gradient-hero rounded-2xl p-8 mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-4">
            JEE Main Full Mock Test #1
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Clock, label: "Duration", value: "3 Hours" },
              { icon: FileText, label: "Questions", value: "90" },
              { label: "Total Marks", value: "300" },
              { label: "Negative Marking", value: "-1 per wrong" },
            ].map((item, index) => (
              <div key={index} className="text-primary-foreground">
                <div className="text-sm text-primary-foreground/60 mb-1">{item.label}</div>
                <div className="text-xl font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Instructions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Instructions
            </h2>
            <ul className="space-y-3">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 text-xs font-medium">
                    {index + 1}
                  </span>
                  {instruction}
                </li>
              ))}
            </ul>
          </div>

          {/* System Requirements */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              System Requirements
            </h2>
            <div className="space-y-4">
              {systemRequirements.map((req, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    req.status === 'ready' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    <req.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{req.label}</span>
                      {req.status === 'ready' ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <span className="text-xs text-warning">Optional</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Warning */}
            <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">Important Notice</p>
                  <p className="text-xs text-destructive/80">
                    Any attempt to cheat will be detected and your test will be flagged for review. 
                    This may result in disqualification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement & Start */}
        <div className="mt-8 bg-card rounded-xl border border-border p-6">
          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 rounded border-input"
            />
            <span className="text-sm text-muted-foreground">
              I have read and understood all the instructions. I agree to follow the exam guidelines 
              and understand that any violation may result in disqualification. I confirm that I will 
              not use any unfair means during the test.
            </span>
          </label>

          <div className="flex items-center gap-4">
            <Button 
              variant="accent" 
              size="lg" 
              className="flex-1"
              onClick={handleStartTest}
              disabled={!agreedToTerms || isChecking}
            >
              {isChecking ? "Checking System..." : "Start Test"}
            </Button>
            <Link to="/dashboard">
              <Button variant="outline" size="lg">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
