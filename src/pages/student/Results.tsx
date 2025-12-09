import { useState, useEffect } from "react";
import { 
  Trophy,
  TrendingUp,
  Calendar
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Result {
  id: string;
  testTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
}

export default function StudentResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  const fetchResults = async () => {
    try {
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('id, test_id, score, total_marks, submitted_at')
        .eq('user_id', user?.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Fetch test titles
      const resultsWithTests: Result[] = [];
      for (const sub of submissions || []) {
        const { data: test } = await supabase
          .from('tests')
          .select('title')
          .eq('id', sub.test_id)
          .single();

        resultsWithTests.push({
          id: sub.id,
          testTitle: test?.title || 'Unknown Test',
          score: sub.score,
          totalMarks: sub.total_marks,
          percentage: sub.total_marks > 0 ? Math.round((sub.score / sub.total_marks) * 100) : 0,
          submittedAt: sub.submitted_at
        });
      }

      setResults(resultsWithTests);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-primary';
    if (percentage >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const stats = results.length > 0 ? {
    totalTests: results.length,
    avgScore: Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length),
    bestScore: Math.max(...results.map(r => r.percentage))
  } : null;

  return (
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">My Results</h1>
            <p className="text-sm text-muted-foreground">View your test performance</p>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : results.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center shadow-lg">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No results yet</h3>
              <p className="text-muted-foreground">Complete a test to see your results here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Summary */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stats.totalTests}</p>
                        <p className="text-sm text-muted-foreground">Tests Completed</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stats.avgScore}%</p>
                        <p className="text-sm text-muted-foreground">Average Score</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stats.bestScore}%</p>
                        <p className="text-sm text-muted-foreground">Best Score</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results List */}
              <div className="bg-card rounded-xl border border-border shadow-lg">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">All Results</h2>
                </div>
                <div className="p-6 space-y-4">
                  {results.map(result => (
                    <div key={result.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 card-hover">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{result.testTitle}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(result.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {result.score}/{result.totalMarks}
                          </p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <p className={`text-2xl font-bold ${getScoreColor(result.percentage)}`}>
                            {result.percentage}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}