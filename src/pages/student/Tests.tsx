import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  FileText,
  Clock,
  Play,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { StudentSidebar } from "@/components/StudentSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Test {
  id: string;
  title: string;
  type: string;
  duration: number;
  total_questions: number;
  description: string | null;
  completed: boolean;
}

export default function StudentTests() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTests();
    }
  }, [user]);

  const fetchTests = async () => {
    try {
      // Fetch published tests
      const { data: testsData, error: testsError } = await supabase
        .from('tests')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (testsError) throw testsError;

      // Fetch user's submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('test_id')
        .eq('user_id', user?.id);

      const completedTestIds = new Set(submissions?.map(s => s.test_id) || []);

      const testsWithStatus = (testsData || []).map(test => ({
        ...test,
        completed: completedTestIds.has(test.id)
      }));

      setTests(testsWithStatus);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableTests = tests.filter(t => !t.completed);
  const completedTests = tests.filter(t => t.completed);

  return (
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">My Tests</h1>
            <p className="text-sm text-muted-foreground">View and take available tests</p>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : tests.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center shadow-lg">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No tests available</h3>
              <p className="text-muted-foreground">Tests will appear here once your admin publishes them</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Available Tests */}
              {availableTests.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Available Tests</h2>
                  <div className="grid gap-4">
                    {availableTests.map(test => (
                      <div key={test.id} className="bg-card rounded-xl border border-border p-6 shadow-lg card-hover">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground text-lg mb-2">{test.title}</h3>
                            {test.description && (
                              <p className="text-muted-foreground mb-3">{test.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {test.duration} mins
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {test.total_questions} questions
                              </span>
                              <span className="px-2 py-1 rounded bg-muted text-muted-foreground capitalize">
                                {test.type}
                              </span>
                            </div>
                          </div>
                          <Link to={`/test/${test.id}/pre`}>
                            <Button className="btn-hover">
                              <Play className="w-4 h-4 mr-2" />
                              Start Test
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tests */}
              {completedTests.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Completed Tests</h2>
                  <div className="grid gap-4">
                    {completedTests.map(test => (
                      <div key={test.id} className="bg-card rounded-xl border border-border p-6 shadow-lg opacity-80">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-success" />
                              <h3 className="font-semibold text-foreground text-lg">{test.title}</h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {test.duration} mins
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {test.total_questions} questions
                              </span>
                            </div>
                          </div>
                          <Link to={`/test/${test.id}/results`}>
                            <Button variant="outline" className="btn-hover">
                              View Results
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}