export interface Question {
  id: string;
  questionNumber: number;
  text: string;
  imageUrl?: string;
  options: Option[];
  correctOptionId: string;
  subject: 'physics' | 'chemistry' | 'mathematics' | 'biology';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  explanation?: string;
}

export interface Option {
  id: string;
  text: string;
  imageUrl?: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  type: 'full-length' | 'chapter' | 'mini' | 'practice';
  examType: 'JEE' | 'NEET';
  duration: number; // in minutes
  totalQuestions: number;
  totalMarks: number;
  subjects: string[];
  scheduledAt?: Date;
  endsAt?: Date;
  isActive: boolean;
  instructions: string[];
}

export interface TestAttempt {
  id: string;
  testId: string;
  studentId: string;
  startedAt: Date;
  endedAt?: Date;
  answers: Answer[];
  status: 'in-progress' | 'submitted' | 'expired' | 'flagged';
  securityFlags: SecurityFlag[];
  timeSpentPerQuestion: Record<string, number>;
}

export interface Answer {
  questionId: string;
  selectedOptionId?: string;
  status: 'not-visited' | 'not-answered' | 'answered' | 'marked-for-review' | 'answered-marked';
  timeSpent: number;
}

export interface SecurityFlag {
  type: 'tab-switch' | 'copy-attempt' | 'fullscreen-exit' | 'devtools' | 'screenshot' | 'suspicious-timing';
  timestamp: Date;
  details?: string;
}

export interface Student {
  id: string;
  email: string;
  name: string;
  rollNumber: string;
  batch: string;
  phone?: string;
  isVerified: boolean;
  deviceFingerprint?: string;
}

export interface TestResult {
  attemptId: string;
  testId: string;
  studentId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  percentile: number;
  rank: number;
  totalAttempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  subjectWise: SubjectScore[];
  timeTaken: number;
  averageTimePerQuestion: number;
}

export interface SubjectScore {
  subject: string;
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  percentage: number;
}
