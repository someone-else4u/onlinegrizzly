import { useState, useEffect } from "react";
import { 
  BarChart3,
  TrendingUp,
  Trophy,
  Target
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AnalyticsData {
  testsCompleted: number;
  avgScore: number;
  bestScore: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

export default function StudentAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('score, total_marks, correct_answers, wrong_answers, unanswered')
        .eq('user_id', user?.id);

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        setData(null);
      } else {
        const totalScore = submissions.reduce((acc, s) => acc + s.score, 0);
        const totalMarks = submissions.reduce((acc, s) => acc + s.total_marks, 0);
        const correctAnswers = submissions.reduce((acc, s) => acc + s.correct_answers, 0);
        const totalQuestions = submissions.reduce((acc, s) => acc + s.correct_answers + s.wrong_answers + s.unanswered, 0);

        const scores = submissions.map(s => s.total_marks > 0 ? (s.score / s.total_marks) * 100 : 0);

        setData({
          testsCompleted: submissions.length,
          avgScore: totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0,
          bestScore: Math.round(Math.max(...scores)),
          totalQuestions,
          correctAnswers,
          accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = data ? [
    { icon: Trophy, label: 'Tests Completed', value: data.testsCompleted, color: 'bg-primary/10 text-primary' },
    { icon: TrendingUp, label: 'Average Score', value: `${data.avgScore}%`, color: 'bg-secondary/10 text-secondary' },
    { icon: Trophy, label: 'Best Score', value: `${data.bestScore}%`, color: 'bg-success/10 text-success' },
    { icon: Target, label: 'Accuracy', value: `${data.accuracy}%`, color: 'bg-warning/10 text-warning' },
  ] : [];

  return (
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">Track your performance over time</p>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : !data ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center shadow-lg">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No data yet</h3>
              <p className="text-muted-foreground">Complete some tests to see your analytics</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-card rounded-xl border border-border p-6 shadow-lg card-hover">
                    <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-4`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Performance Summary */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-foreground mb-4">Performance Summary</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Questions Answered</span>
                      <span className="font-medium text-foreground">{data.totalQuestions}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Correct Answers</span>
                      <span className="font-medium text-success">{data.correctAnswers}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success rounded-full transition-all" 
                        style={{ width: `${data.accuracy}%` }} 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Average Score</span>
                      <span className="font-medium text-secondary">{data.avgScore}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full transition-all" 
                        style={{ width: `${data.avgScore}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Placeholder */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-foreground mb-4">Performance Trends</h2>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Charts coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}