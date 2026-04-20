import { useState, useEffect } from "react";
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
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const systemRequirements = [
  { icon: Monitor, label: "Full Screen Mode", status: "ready", description: "Browser will enter full screen" },
  { icon: Keyboard, label: "Keyboard Shortcuts Disabled", status: "ready", description: "Copy, paste, and other shortcuts blocked" },
  { icon: Mouse, label: "Right-Click Disabled", status: "ready", description: "Context menu will be blocked" },
  { icon: Camera, label: "Webcam Access", status: "optional", description: "For proctoring (optional)" },
];

const instructions = [
  "Each correct answer carries +4 marks and each incorrect answer carries -1 mark.",
  "You can mark questions for review and navigate freely between questions.",
  "The test will auto-submit when the time runs out.",
  "Do not switch tabs or minimize the window during the test.",
  "Any suspicious activity will be flagged and reported.",
  "Ensure you have a stable internet connection before starting.",
  "Once started, the test cannot be paused."
];

interface Test {
  id: string;
  title: string;
  duration: number;
  total_questions: number;
  type: string;
  description: string | null;
}

interface MarkingSummary {
  positive: number;
  negative: number;
  totalMarks: number;
}

export default function TestPreview() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [marking, setMarking] = useState<MarkingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId]);

  const fetchTest = async () => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .maybeSingle();

      if (error) throw error;
      setTest(data);

      const { data: questions } = await supabase
        .from('questions')
        .select('marks, negative_marks')
        .eq('test_id', testId);

      if (questions) {
        const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);
        const positives = [...new Set(questions.map((q) => Number(q.marks || 0)))].sort((a, b) => a - b);
        const negatives = [...new Set(questions.map((q) => Number(q.negative_marks || 0)))].sort((a, b) => a - b);
        setMarking({
          positive: positives[0] ?? 0,
          negative: negatives[0] ?? 0,
          totalMarks,
        });
      }
    } catch (error) {
      console.error('Error fetching test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!agreedToTerms) return;
    
    setIsChecking(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    navigate(`/test/${testId}/exam`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Test Not Found</h2>
          <p className="text-muted-foreground mb-4">This test doesn't exist or has been removed.</p>
          <Link to="/student-dashboard">
            <Button variant="accent">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalMarks = marking?.totalMarks ?? test.total_questions * 4;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/student-dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">GRIZZLY INTEGRATED</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Test Info Card */}
        <div className="bg-gradient-hero rounded-2xl p-8 mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-4">
            {test.title}
          </h1>
          {test.description && (
            <p className="text-primary-foreground/70 mb-4">{test.description}</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Clock, label: "Duration", value: `${test.duration} min` },
              { icon: FileText, label: "Questions", value: test.total_questions.toString() },
              { label: "Total Marks", value: totalMarks.toString() },
              { label: "Negative Marking", value: `-${marking?.negative ?? 1} per wrong` },
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
            <Link to="/student-dashboard">
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
