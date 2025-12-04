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
  TrendingUp
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const mockResults = {
  totalScore: 245,
  maxScore: 300,
  percentage: 81.67,
  percentile: 95.2,
  rank: 4520,
  totalParticipants: 125000,
  correct: 58,
  incorrect: 12,
  unattempted: 20,
  timeTaken: 162, // minutes
  subjects: [
    { name: 'Physics', score: 85, max: 100, correct: 20, incorrect: 5, unattempted: 5 },
    { name: 'Chemistry', score: 80, max: 100, correct: 19, incorrect: 4, unattempted: 7 },
    { name: 'Mathematics', score: 80, max: 100, correct: 19, incorrect: 3, unattempted: 8 },
  ],
  topicAnalysis: [
    { topic: 'Mechanics', accuracy: 85 },
    { topic: 'Thermodynamics', accuracy: 70 },
    { topic: 'Organic Chemistry', accuracy: 90 },
    { topic: 'Calculus', accuracy: 75 },
    { topic: 'Algebra', accuracy: 80 },
  ]
};

export default function TestResults() {
  const { testId } = useParams();

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 75) return 'text-accent';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero py-8">
        <div className="container mx-auto px-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-2">
                JEE Main Full Mock Test #1
              </h1>
              <p className="text-primary-foreground/70">Completed on December 10, 2024 at 1:45 PM</p>
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
                  strokeDasharray={`${mockResults.percentage * 3.52} 352`}
                  className="text-accent"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getGradeColor(mockResults.percentage)}`}>
                  {mockResults.totalScore}
                </span>
                <span className="text-sm text-muted-foreground">/{mockResults.maxScore}</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{mockResults.percentage.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Your Score</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{mockResults.percentile}%ile</div>
                <p className="text-sm text-muted-foreground">Percentile</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You performed better than {mockResults.percentile}% of all test takers
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">#{mockResults.rank.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">All India Rank</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Out of {mockResults.totalParticipants.toLocaleString()} participants
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{mockResults.timeTaken} min</div>
                <p className="text-sm text-muted-foreground">Time Taken</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Average: 1.8 min per question
            </p>
          </div>
        </div>

        {/* Answer Analysis */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">{mockResults.correct}</div>
                <p className="text-sm text-muted-foreground">Correct Answers</p>
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-success rounded-full h-2" style={{ width: `${(mockResults.correct / 90) * 100}%` }} />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-destructive" />
              <div>
                <div className="text-2xl font-bold text-destructive">{mockResults.incorrect}</div>
                <p className="text-sm text-muted-foreground">Incorrect Answers</p>
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-destructive rounded-full h-2" style={{ width: `${(mockResults.incorrect / 90) * 100}%` }} />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <MinusCircle className="w-6 h-6 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold text-muted-foreground">{mockResults.unattempted}</div>
                <p className="text-sm text-muted-foreground">Unattempted</p>
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-muted-foreground rounded-full h-2" style={{ width: `${(mockResults.unattempted / 90) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Subject-wise Analysis */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-display font-semibold text-foreground mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Subject-wise Analysis
            </h2>

            <div className="space-y-6">
              {mockResults.subjects.map((subject, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{subject.name}</span>
                    <span className="text-sm text-muted-foreground">{subject.score}/{subject.max}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3 mb-2">
                    <div 
                      className="bg-accent rounded-full h-3 transition-all"
                      style={{ width: `${subject.score}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      {subject.correct} Correct
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      {subject.incorrect} Wrong
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      {subject.unattempted} Skipped
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Analysis */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-display font-semibold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Topic-wise Accuracy
            </h2>

            <div className="space-y-4">
              {mockResults.topicAnalysis.map((topic, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-32 text-sm text-muted-foreground truncate">{topic.topic}</span>
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div 
                      className={`rounded-full h-2 transition-all ${
                        topic.accuracy >= 80 ? 'bg-success' :
                        topic.accuracy >= 60 ? 'bg-accent' : 'bg-destructive'
                      }`}
                      style={{ width: `${topic.accuracy}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium w-12 text-right ${
                    topic.accuracy >= 80 ? 'text-success' :
                    topic.accuracy >= 60 ? 'text-accent' : 'text-destructive'
                  }`}>
                    {topic.accuracy}%
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <h4 className="font-medium text-foreground mb-2">💡 Recommendations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Focus on Thermodynamics - your accuracy is below average</li>
                <li>• Great job on Organic Chemistry! Keep practicing</li>
                <li>• Try more Calculus problems to improve your speed</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/dashboard">
            <Button variant="accent" size="lg">
              Back to Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="lg">
            Review All Answers
          </Button>
          <Button variant="outline" size="lg">
            Attempt Again
          </Button>
        </div>
      </main>
    </div>
  );
}
