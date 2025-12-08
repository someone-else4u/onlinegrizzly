import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MinusCircle,
  ArrowLeft,
  Download,
  Share2,
  BarChart3,
  Loader2,
  FileText
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Submission {
  id: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
  time_taken: number | null;
  submitted_at: string;
  tests: {
    title: string;
    total_questions: number;
  } | null;
}

export default function TestResults() {
  const { testId } = useParams();
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (testId && user?.id) {
      fetchSubmission();
    }
  }, [testId, user?.id]);

  const fetchSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, tests(title, total_questions)')
        .eq('test_id', testId)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setSubmission(data);
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 75) return 'text-accent';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Results Found</h2>
          <p className="text-muted-foreground mb-4">You haven't submitted this test yet.</p>
          <Link to="/student-dashboard">
            <Button variant="accent">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const percentage = submission.total_marks > 0 
    ? (submission.score / submission.total_marks) * 100 
    : 0;
  const totalQuestions = submission.tests?.total_questions || 
    (submission.correct_answers + submission.wrong_answers + submission.unanswered);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero py-8">
        <div className="container mx-auto px-4">
          <Link to="/student-dashboard" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-2">
                {submission.tests?.title || 'Test Results'}
              </h1>
              <p className="text-primary-foreground/70">
                Submitted on {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="hero-outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              <Button variant="hero-outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Score Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-1 bg-card rounded-2xl border border-border p-6 text-center">
            <div className="w-32 h-32 mx-auto mb-4 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-secondary"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${percentage * 3.52} 352`}
                  className="text-accent"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getGradeColor(percentage)}`}>
                  {submission.score}
                </span>
                <span className="text-sm text-muted-foreground">/{submission.total_marks}</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{percentage.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Your Score</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{percentage.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Score Percentage</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {percentage >= 75 ? 'Great performance!' : percentage >= 50 ? 'Good effort, keep improving!' : 'Keep practicing!'}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{submission.correct_answers}</div>
                <p className="text-sm text-muted-foreground">Correct Answers</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Out of {totalQuestions} questions
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {submission.time_taken ? Math.round(submission.time_taken / 60) : '-'} min
                </div>
                <p className="text-sm text-muted-foreground">Time Taken</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {submission.time_taken && totalQuestions > 0 
                ? `${(submission.time_taken / 60 / totalQuestions).toFixed(1)} min per question`
                : 'No time recorded'}
            </p>
          </div>
        </div>

        {/* Answer Analysis */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">{submission.correct_answers}</div>
                <p className="text-sm text-muted-foreground">Correct Answers</p>
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-success rounded-full h-2" 
                style={{ width: `${totalQuestions > 0 ? (submission.correct_answers / totalQuestions) * 100 : 0}%` }} 
              />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-destructive" />
              <div>
                <div className="text-2xl font-bold text-destructive">{submission.wrong_answers}</div>
                <p className="text-sm text-muted-foreground">Incorrect Answers</p>
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-destructive rounded-full h-2" 
                style={{ width: `${totalQuestions > 0 ? (submission.wrong_answers / totalQuestions) * 100 : 0}%` }} 
              />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <MinusCircle className="w-6 h-6 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold text-muted-foreground">{submission.unanswered}</div>
                <p className="text-sm text-muted-foreground">Unattempted</p>
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-muted-foreground rounded-full h-2" 
                style={{ width: `${totalQuestions > 0 ? (submission.unanswered / totalQuestions) * 100 : 0}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-display font-semibold text-foreground mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Performance Summary
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-secondary/50">
              <h3 className="font-medium text-foreground mb-2">Marks Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Correct answers ({submission.correct_answers} × 4)</span>
                  <span className="text-success">+{submission.correct_answers * 4}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wrong answers ({submission.wrong_answers} × -1)</span>
                  <span className="text-destructive">-{submission.wrong_answers}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-medium">
                  <span className="text-foreground">Final Score</span>
                  <span className="text-foreground">{submission.score}/{submission.total_marks}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <h4 className="font-medium text-foreground mb-2">Recommendations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {percentage < 50 && <li>• Focus on understanding core concepts first</li>}
                {submission.wrong_answers > submission.correct_answers && <li>• Be more careful with your answers to avoid negative marking</li>}
                {submission.unanswered > totalQuestions * 0.2 && <li>• Try to attempt more questions - educated guesses can help</li>}
                {percentage >= 75 && <li>• Excellent work! Keep up the consistent practice</li>}
                <li>• Review incorrect answers to understand your mistakes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/student-dashboard">
            <Button variant="accent" size="lg">
              Back to Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="lg" disabled>
            Review All Answers (Coming Soon)
          </Button>
        </div>
      </main>
    </div>
  );
}
