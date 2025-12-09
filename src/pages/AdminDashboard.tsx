import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  BarChart3,
  Users,
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Download,
  Bell,
  ChevronRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminDashboardData } from "@/hooks/useDashboardData";
import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { stats, recentTests, topPerformers, loading: dataLoading } = useAdminDashboardData();
  const [searchQuery, setSearchQuery] = useState('');

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  const filteredTests = recentTests.filter(test => 
    test.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.name || 'Admin'}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Link to="/admin/tests/create">
                <Button variant="accent">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Test
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Tests', value: stats.totalTests.toString(), change: '', color: 'bg-accent/10 text-accent' },
              { label: 'Active Students', value: stats.totalStudents.toLocaleString(), change: '', color: 'bg-success/10 text-success' },
              { label: 'Tests Today', value: stats.testsToday.toString(), change: '', color: 'bg-primary/10 text-primary' },
              { label: 'Avg. Score', value: stats.avgScore > 0 ? `${stats.avgScore}%` : '-', change: '', color: 'bg-warning/10 text-warning' },
            ].map((stat, index) => (
              <div key={index} className="bg-card rounded-xl border border-border p-6">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Tests */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-semibold text-foreground">Recent Tests</h2>
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {filteredTests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No tests created yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first test to get started</p>
                    <Link to="/admin/tests/create">
                      <Button variant="accent">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Test
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{test.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{test.type}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {test.date}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="font-medium text-foreground">{test.studentCount.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Students</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-foreground">{test.avgScore || '-'}%</div>
                            <div className="text-xs text-muted-foreground">Avg Score</div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            test.status === 'published' ? 'bg-success/10 text-success' :
                            test.status === 'draft' ? 'bg-warning/10 text-warning' :
                            'bg-secondary text-secondary-foreground'
                          }`}>
                            {test.status}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Students */}
            <div className="bg-card rounded-xl border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-display font-semibold text-foreground">Top Performers</h2>
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {topPerformers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topPerformers.map((student) => (
                      <div key={student.userId} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          student.rank === 1 ? 'bg-accent text-accent-foreground' :
                          student.rank === 2 ? 'bg-muted text-muted-foreground' :
                          student.rank === 3 ? 'bg-warning/20 text-warning' :
                          'bg-secondary text-secondary-foreground'
                        }`}>
                          {student.rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{student.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {student.totalMarks > 0 ? Math.round((student.score / student.totalMarks) * 100) : 0}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">{student.score}</div>
                          <div className="text-xs text-muted-foreground">/{student.totalMarks}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="outline" className="w-full mt-6" disabled={topPerformers.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Leaderboard
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
