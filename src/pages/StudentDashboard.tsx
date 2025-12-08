import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Clock, 
  FileText, 
  Trophy, 
  BarChart3, 
  Play,
  ChevronRight,
  LogOut,
  User,
  Bell
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStudentDashboardData } from "@/hooks/useDashboardData";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { signOut, profile, user, isAuthenticated, isStudent, loading: authLoading } = useAuth();
  const { stats, availableTests, recentResults, loading: dataLoading } = useStudentDashboardData(user?.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
    if (!authLoading && isAuthenticated && !isStudent) {
      navigate('/admin-dashboard');
    }
  }, [isAuthenticated, isStudent, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">GRIZZLY INTEGRATED</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome back, {profile?.name || 'Student'}!
          </h1>
          <p className="text-muted-foreground">
            {availableTests.length > 0 
              ? "Ready to ace your next test? Check out available tests below."
              : "No tests available yet. Check back soon!"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: FileText, label: "Tests Taken", value: stats.testsTaken.toString(), color: "bg-accent/10 text-accent" },
            { icon: Trophy, label: "Best Score", value: stats.bestPercentile > 0 ? `${stats.bestPercentile}%` : "-", color: "bg-success/10 text-success" },
            { icon: BarChart3, label: "Avg. Score", value: stats.avgScore > 0 ? `${stats.avgScore}%` : "-", color: "bg-warning/10 text-warning" },
          ].map((stat, index) => (
            <div key={index} className="p-6 rounded-xl bg-card border border-border">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Available Tests */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold text-foreground">Available Tests</h2>
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {availableTests.length === 0 ? (
              <div className="p-12 rounded-xl bg-card border border-border text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No tests available</h3>
                <p className="text-muted-foreground">Tests will appear here once your admin creates them.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableTests.map((test) => (
                  <div 
                    key={test.id}
                    className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{test.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {test.duration} mins
                          </span>
                          <span>{test.questions} questions</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        test.status === 'available' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {test.status === 'available' ? 'Available' : 'Completed'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs">
                        {test.type}
                      </span>
                      {test.status === 'available' ? (
                        <Link to={`/test/${test.id}/pre`}>
                          <Button variant="accent" size="sm">
                            <Play className="w-4 h-4 mr-1" />
                            Start Test
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/test/${test.id}/results`}>
                          <Button variant="secondary" size="sm">
                            View Results
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Results */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold text-foreground">Recent Results</h2>
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {recentResults.length === 0 ? (
              <div className="p-8 rounded-xl bg-card border border-border text-center">
                <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No results yet</p>
                <p className="text-sm text-muted-foreground">Complete a test to see your results here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentResults.map((result) => (
                  <div 
                    key={result.id}
                    className="p-4 rounded-xl bg-card border border-border"
                  >
                    <h4 className="font-medium text-foreground mb-2">{result.test}</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-foreground">
                        {result.score}<span className="text-sm font-normal text-muted-foreground">/{result.total}</span>
                      </span>
                      <span className="text-sm text-success font-medium">{result.percentage}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-accent rounded-full h-2 transition-all"
                        style={{ width: `${result.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-hero">
              <h3 className="font-semibold text-primary-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <Trophy className="w-4 h-4 mr-2" />
                  Leaderboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
