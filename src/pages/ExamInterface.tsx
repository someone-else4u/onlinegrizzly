import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertTriangle,
  X,
  Maximize,
  Send,
  Loader2,
  FileText
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { toast } from "sonner";
import { Answer } from "@/types/exam";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Question {
  id: string;
  questionNumber: number;
  text: string;
  options: { id: string; text: string }[];
  subject: string;
}

interface Test {
  id: string;
  title: string;
  duration: number;
  total_questions: number;
}

export default function ExamInterface() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { 
    isFullscreen, 
    tabSwitchCount, 
    securityFlags, 
    enterFullscreen 
  } = useExamSecurity({
    onSecurityViolation: (flag) => {
      if (flag.type === 'tab-switch') {
        toast.warning(`Warning: Tab switch detected (${tabSwitchCount + 1} times)`);
      }
    },
    onFullscreenExit: () => {
      setShowWarningModal(true);
    }
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (testId) {
      fetchTestAndQuestions();
    }
  }, [testId]);

  const fetchTestAndQuestions = async () => {
    try {
      // Fetch test
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .maybeSingle();

      if (testError) throw testError;
      if (!testData) {
        setLoading(false);
        return;
      }

      setTest(testData);
      setTimeRemaining(testData.duration * 60);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .order('created_at', { ascending: true });

      if (questionsError) throw questionsError;

      const formattedQuestions: Question[] = (questionsData || []).map((q, index) => ({
        id: q.id,
        questionNumber: index + 1,
        text: q.question_text,
        options: [
          { id: 'a', text: `A: ${q.option_a}` },
          { id: 'b', text: `B: ${q.option_b}` },
          { id: 'c', text: `C: ${q.option_c}` },
          { id: 'd', text: `D: ${q.option_d}` },
        ],
        subject: q.topic || 'General',
      }));

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching test:', error);
      toast.error('Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Enter fullscreen on mount
  useEffect(() => {
    if (questions.length > 0) {
      enterFullscreen();
    }
  }, [enterFullscreen, questions.length]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem(`exam-${testId}-answers`, JSON.stringify(answers));
      localStorage.setItem(`exam-${testId}-time`, String(timeRemaining));
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [answers, timeRemaining, testId]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnswerStatus = (questionId: string): Answer['status'] => {
    return answers[questionId]?.status || 'not-visited';
  };

  const selectOption = (optionId: string) => {
    if (questions.length === 0) return;
    const question = questions[currentQuestion];
    const currentAnswer = answers[question.id];
    
    setAnswers(prev => ({
      ...prev,
      [question.id]: {
        questionId: question.id,
        selectedOptionId: optionId,
        status: currentAnswer?.status === 'marked-for-review' ? 'answered-marked' : 'answered',
        timeSpent: (currentAnswer?.timeSpent || 0) + 1
      }
    }));
  };

  const markForReview = () => {
    if (questions.length === 0) return;
    const question = questions[currentQuestion];
    const currentAnswer = answers[question.id];
    
    setAnswers(prev => ({
      ...prev,
      [question.id]: {
        ...prev[question.id],
        questionId: question.id,
        status: currentAnswer?.selectedOptionId ? 'answered-marked' : 'marked-for-review',
        timeSpent: currentAnswer?.timeSpent || 0
      }
    }));
    
    toast.info('Question marked for review');
    goToNext();
  };

  const clearResponse = () => {
    if (questions.length === 0) return;
    const question = questions[currentQuestion];
    setAnswers(prev => ({
      ...prev,
      [question.id]: {
        questionId: question.id,
        selectedOptionId: undefined,
        status: 'not-answered',
        timeSpent: prev[question.id]?.timeSpent || 0
      }
    }));
  };

  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      const nextQ = currentQuestion + 1;
      setCurrentQuestion(nextQ);
      
      const nextQuestion = questions[nextQ];
      if (!answers[nextQuestion.id]) {
        setAnswers(prev => ({
          ...prev,
          [nextQuestion.id]: {
            questionId: nextQuestion.id,
            status: 'not-answered',
            timeSpent: 0
          }
        }));
      }
    }
  };

  const goToPrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
    const question = questions[index];
    if (!answers[question.id]) {
      setAnswers(prev => ({
        ...prev,
        [question.id]: {
          questionId: question.id,
          status: 'not-answered',
          timeSpent: 0
        }
      }));
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!test || !user?.id || submitting) return;
    
    setSubmitting(true);
    
    try {
      // Fetch questions with correct answers
      const { data: questionsData } = await supabase
        .from('questions')
        .select('id, correct_option, marks, negative_marks')
        .eq('test_id', testId);

      let score = 0;
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let unanswered = 0;

      (questionsData || []).forEach(q => {
        const answer = answers[q.id];
        if (!answer?.selectedOptionId) {
          unanswered++;
        } else if (answer.selectedOptionId.toUpperCase() === q.correct_option) {
          correctAnswers++;
          score += q.marks;
        } else {
          wrongAnswers++;
          score -= q.negative_marks;
        }
      });

      const totalMarks = (questionsData || []).reduce((acc, q) => acc + q.marks, 0);
      const timeTaken = (test.duration * 60) - timeRemaining;

      // Save submission
      const { error } = await supabase
        .from('submissions')
        .insert({
          test_id: testId,
          user_id: user.id,
          score: Math.max(0, score),
          total_marks: totalMarks,
          correct_answers: correctAnswers,
          wrong_answers: wrongAnswers,
          unanswered,
          time_taken: timeTaken,
        });

      if (error) throw error;

      // Clear localStorage
      localStorage.removeItem(`exam-${testId}-answers`);
      localStorage.removeItem(`exam-${testId}-time`);

      toast.success('Test submitted successfully!');
      navigate(`/test/${testId}/results`);
    } catch (error: any) {
      console.error('Error submitting test:', error);
      if (error.code === '23505') {
        toast.error('You have already submitted this test');
        navigate(`/test/${testId}/results`);
      } else {
        toast.error('Failed to submit test');
      }
    } finally {
      setSubmitting(false);
    }
  }, [answers, navigate, testId, timeRemaining, test, user?.id, submitting]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {!test ? 'Test Not Found' : 'No Questions Available'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {!test ? 'This test doesn\'t exist.' : 'This test has no questions yet.'}
          </p>
          <Link to="/student-dashboard">
            <Button variant="accent">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const currentAnswer = answers[currentQ.id];

  const getStatusColor = (status: Answer['status']) => {
    switch (status) {
      case 'answered': return 'bg-success text-success-foreground';
      case 'marked-for-review': return 'bg-accent text-accent-foreground';
      case 'answered-marked': return 'bg-accent text-accent-foreground ring-2 ring-success';
      case 'not-answered': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col secure-content">
      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Fullscreen Required</h3>
                <p className="text-sm text-muted-foreground">You exited fullscreen mode</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This action has been logged. Please return to fullscreen to continue the test.
            </p>
            <Button variant="accent" className="w-full" onClick={() => {
              enterFullscreen();
              setShowWarningModal(false);
            }}>
              <Maximize className="w-4 h-4 mr-2" />
              Return to Fullscreen
            </Button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-display font-semibold text-foreground text-lg mb-4">Submit Test?</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-success/10">
                <div className="text-2xl font-bold text-success">
                  {Object.values(answers).filter(a => a.selectedOptionId).length}
                </div>
                <div className="text-sm text-muted-foreground">Answered</div>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <div className="text-2xl font-bold text-destructive">
                  {questions.length - Object.values(answers).filter(a => a.selectedOptionId).length}
                </div>
                <div className="text-sm text-muted-foreground">Unattempted</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to submit? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </Button>
              <Button variant="accent" className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Test
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display font-bold text-foreground">{test.title}</h1>
            {tabSwitchCount > 0 && (
              <span className="px-2 py-1 rounded bg-destructive/10 text-destructive text-xs font-medium">
                {tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${
              timeRemaining < 600 ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-primary text-primary-foreground'
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeRemaining)}
            </div>
            <Button variant="accent" onClick={() => setShowSubmitModal(true)}>
              Submit Test
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Question Card */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Question {currentQ.questionNumber} of {questions.length}
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {currentQ.subject}
              </span>
            </div>

            <div className="text-lg text-foreground mb-6 no-select">
              {currentQ.text}
            </div>

            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => selectOption(option.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    currentAnswer?.selectedOptionId === option.id
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-border bg-card hover:border-accent/50 text-foreground'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 text-sm font-medium ${
                    currentAnswer?.selectedOptionId === option.id
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option.text.substring(3)}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Button variant="outline" onClick={clearResponse} disabled={!currentAnswer?.selectedOptionId}>
                <X className="w-4 h-4 mr-2" />
                Clear Response
              </Button>
              <Button variant="outline" onClick={markForReview}>
                <Flag className="w-4 h-4 mr-2" />
                Mark for Review
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={goToPrev} disabled={currentQuestion === 0}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button variant="accent" onClick={goToNext} disabled={currentQuestion === questions.length - 1}>
                Save & Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </main>

        {/* Question Navigation Sidebar */}
        <aside className="w-72 bg-card border-l border-border p-4 overflow-auto">
          <h3 className="font-semibold text-foreground mb-4">Question Palette</h3>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-secondary" />
              <span className="text-muted-foreground">Not Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-destructive" />
              <span className="text-muted-foreground">Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-success" />
              <span className="text-muted-foreground">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-accent" />
              <span className="text-muted-foreground">Marked</span>
            </div>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => goToQuestion(index)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  currentQuestion === index ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : ''
                } ${getStatusColor(getAnswerStatus(q.id))}`}
              >
                {q.questionNumber}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
