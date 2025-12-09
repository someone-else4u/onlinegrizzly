import { useState, useEffect } from "react";
import { 
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Trophy
} from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  totalTests: number;
  totalStudents: number;
  totalSubmissions: number;
  avgScore: number;
  topSubject: string;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalTests: 0,
    totalStudents: 0,
    totalSubmissions: 0,
    avgScore: 0,
    topSubject: '-'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch counts
      const [testsRes, studentsRes, submissionsRes] = await Promise.all([
        supabase.from('tests').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('user_id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('submissions').select('score, total_marks')
      ]);

      const submissions = submissionsRes.data || [];
      const avgScore = submissions.length > 0
        ? Math.round(submissions.reduce((acc, s) => acc + (s.total_marks > 0 ? (s.score / s.total_marks) * 100 : 0), 0) / submissions.length)
        : 0;

      setData({
        totalTests: testsRes.count || 0,
        totalStudents: studentsRes.count || 0,
        totalSubmissions: submissions.length,
        avgScore,
        topSubject: 'Physics' // Placeholder
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: FileText, label: 'Total Tests', value: data.totalTests, color: 'bg-primary/10 text-primary' },
    { icon: Users, label: 'Total Students', value: data.totalStudents, color: 'bg-secondary/10 text-secondary' },
    { icon: TrendingUp, label: 'Total Submissions', value: data.totalSubmissions, color: 'bg-success/10 text-success' },
    { icon: Trophy, label: 'Average Score', value: `${data.avgScore}%`, color: 'bg-warning/10 text-warning' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">Platform insights and statistics</p>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
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

              {/* Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Score Distribution</h2>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Charts coming soon</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Tests Over Time</h2>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Charts coming soon</p>
                    </div>
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