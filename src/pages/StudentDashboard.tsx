import { Button } from "@/components/ui/button";
import { 
  Clock, 
  FileText, 
  Trophy, 
  BarChart3, 
  Play,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStudentDashboardData } from "@/hooks/useDashboardData";
import { StudentSidebar } from "@/components/StudentSidebar";
import { FloatingMessenger } from "@/components/FloatingMessenger";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { profile, user, isAuthenticated, isStudent, loading: authLoading } = useAuth();
  const { stats, availableTests, recentResults, loading: dataLoading } = useStudentDashboardData(user?.id);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Welcome back, {profile?.name || 'Student'}!
              </h1>
              <p className="text-sm text-muted-foreground">
                {availableTests.length > 0 
                  ? "Ready to ace your next test?"
                  : "No tests available yet. Check back soon!"}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { icon: FileText, label: "Tests Taken", value: stats.testsTaken.toString(), color: "bg-primary/10 text-primary" },
              { icon: Trophy, label: "Best Score", value: stats.bestPercentile > 0 ? `${stats.bestPercentile}%` : "-", color: "bg-success/10 text-success" },
              { icon: BarChart3, label: "Avg. Score", value: stats.avgScore > 0 ? `${stats.avgScore}%` : "-", color: "bg-warning/10 text-warning" },
            ].map((stat, index) => (
              <div key={index} className="p-6 rounded-xl bg-card border border-border card-hover">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Available Tests */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-display font-semibold text-foreground">Available Tests</h2>
                  <Link to="/student/tests">
                    <Button variant="ghost" size="sm">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {availableTests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No tests available</h3>
                    <p className="text-muted-foreground">Tests will appear here once your admin creates them.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableTests.slice(0, 5).map((test) => (
                      <div 
                        key={test.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{test.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {test.duration} mins
                              </span>
                              <span>•</span>
                              <span>{test.questions} questions</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            test.status === 'available' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {test.status === 'available' ? 'Available' : 'Completed'}
                          </span>
                          {test.status === 'available' ? (
                            <Link to={`/test/${test.id}/pre`}>
                              <Button className="btn-hover">
                                <Play className="w-4 h-4 mr-1" />
                                Start Test
                              </Button>
                            </Link>
                          ) : (
                            <Link to={`/test/${test.id}/results`}>
                              <Button variant="outline">View Results</Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Results */}
            <div className="bg-card rounded-xl border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-display font-semibold text-foreground">Recent Results</h2>
                  <Link to="/student/results">
                    <Button variant="ghost" size="sm">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {recentResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No results yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Complete a test to see results here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentResults.map((result) => (
                      <div key={result.id} className="p-4 rounded-lg bg-muted/30">
                        <h4 className="font-medium text-foreground mb-2">{result.test}</h4>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-foreground">
                            {result.score}<span className="text-sm font-normal text-muted-foreground">/{result.total}</span>
                          </span>
                          <span className="text-sm text-success font-medium">{result.percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${result.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 space-y-2">
                  <Link to="/student/analytics" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                  <Link to="/student/results" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Trophy className="w-4 h-4 mr-2" />
                      All Results
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Messenger */}
      <FloatingMessenger />
    </div>
  );
}
