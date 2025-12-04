import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertTriangle,
  CheckCircle2,
  X,
  Maximize,
  Send
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { toast } from "sonner";
import { Answer } from "@/types/exam";

// Mock questions
const mockQuestions = Array.from({ length: 90 }, (_, i) => ({
  id: `q-${i + 1}`,
  questionNumber: i + 1,
  text: `Question ${i + 1}: ${
    i < 30 ? 'A particle moves in a circular path of radius R with constant speed v. What is the magnitude of average velocity of the particle in half revolution?' :
    i < 60 ? 'The compound that will react most readily with NaOH to form a methanol is:' :
    'If f(x) = x³ - 3x² + 3x - 1, then the value of f(1) is:'
  }`,
  options: [
    { id: 'a', text: 'Option A: This is the first possible answer choice' },
    { id: 'b', text: 'Option B: This is the second possible answer choice' },
    { id: 'c', text: 'Option C: This is the third possible answer choice' },
    { id: 'd', text: 'Option D: This is the fourth possible answer choice' },
  ],
  subject: i < 30 ? 'physics' : i < 60 ? 'chemistry' : 'mathematics',
}));

const subjects = [
  { id: 'physics', name: 'Physics', range: [1, 30] },
  { id: 'chemistry', name: 'Chemistry', range: [31, 60] },
  { id: 'mathematics', name: 'Mathematics', range: [61, 90] },
];

export default function ExamInterface() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [timeRemaining, setTimeRemaining] = useState(180 * 60); // 3 hours in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [activeSubject, setActiveSubject] = useState('physics');

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

  // Timer
  useEffect(() => {
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
  }, []);

  // Enter fullscreen on mount
  useEffect(() => {
    enterFullscreen();
  }, [enterFullscreen]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      // Save to localStorage as backup
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
    const question = mockQuestions[currentQuestion];
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
    const question = mockQuestions[currentQuestion];
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
    const question = mockQuestions[currentQuestion];
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
    if (currentQuestion < mockQuestions.length - 1) {
      const nextQ = currentQuestion + 1;
      setCurrentQuestion(nextQ);
      
      // Mark as visited if not already answered
      const nextQuestion = mockQuestions[nextQ];
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
    const question = mockQuestions[index];
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

  const handleSubmit = useCallback(() => {
    // Calculate results
    const answered = Object.values(answers).filter(a => a.selectedOptionId).length;
    const marked = Object.values(answers).filter(a => a.status === 'marked-for-review').length;
    
    // Navigate to results
    navigate(`/test/${testId}/results`, { 
      state: { 
        answers, 
        timeSpent: 180 * 60 - timeRemaining,
        securityFlags 
      } 
    });
  }, [answers, navigate, testId, timeRemaining, securityFlags]);

  const currentQ = mockQuestions[currentQuestion];
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

  const getSubjectStats = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId)!;
    const subjectAnswers = Object.values(answers).filter(a => {
      const qNum = parseInt(a.questionId.split('-')[1]);
      return qNum >= subject.range[0] && qNum <= subject.range[1];
    });
    
    return {
      answered: subjectAnswers.filter(a => a.selectedOptionId).length,
      total: subject.range[1] - subject.range[0] + 1
    };
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
              Repeated violations may result in disqualification.
            </p>
            <div className="flex gap-3">
              <Button variant="accent" className="flex-1" onClick={() => {
                enterFullscreen();
                setShowWarningModal(false);
              }}>
                <Maximize className="w-4 h-4 mr-2" />
                Return to Fullscreen
              </Button>
            </div>
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
                  {90 - Object.values(answers).filter(a => a.selectedOptionId).length}
                </div>
                <div className="text-sm text-muted-foreground">Unattempted</div>
              </div>
              <div className="p-3 rounded-lg bg-accent/10">
                <div className="text-2xl font-bold text-accent">
                  {Object.values(answers).filter(a => a.status?.includes('marked')).length}
                </div>
                <div className="text-sm text-muted-foreground">Marked for Review</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-2xl font-bold text-foreground">
                  {90 - Object.keys(answers).length}
                </div>
                <div className="text-sm text-muted-foreground">Not Visited</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to submit the test? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </Button>
              <Button variant="accent" className="flex-1" onClick={handleSubmit}>
                <Send className="w-4 h-4 mr-2" />
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
            <h1 className="font-display font-bold text-foreground">JEE Main Mock Test #1</h1>
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
          {/* Subject Tabs */}
          <div className="flex gap-2 mb-6">
            {subjects.map(subject => {
              const stats = getSubjectStats(subject.id);
              return (
                <button
                  key={subject.id}
                  onClick={() => {
                    setActiveSubject(subject.id);
                    goToQuestion(subject.range[0] - 1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSubject === subject.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {subject.name} ({stats.answered}/{stats.total})
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Question {currentQ.questionNumber} of {mockQuestions.length}
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium capitalize">
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
                  {option.text}
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
              <Button variant="accent" onClick={goToNext} disabled={currentQuestion === mockQuestions.length - 1}>
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
          {subjects.map(subject => (
            <div key={subject.id} className="mb-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">{subject.name}</h4>
              <div className="grid grid-cols-5 gap-2">
                {mockQuestions.slice(subject.range[0] - 1, subject.range[1]).map((q, i) => {
                  const qIndex = subject.range[0] - 1 + i;
                  const status = getAnswerStatus(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(qIndex)}
                      className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                        currentQuestion === qIndex ? 'ring-2 ring-foreground ring-offset-2' : ''
                      } ${getStatusColor(status)}`}
                    >
                      {q.questionNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
