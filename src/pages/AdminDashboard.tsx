import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  FileText, 
  Users, 
  BarChart3, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  LogOut,
  Settings,
  Bell,
  ChevronRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const recentTests = [
  { id: '1', title: 'JEE Main Mock #15', type: 'Full Length', status: 'active', students: 1245, avgScore: 78, date: 'Dec 10, 2024' },
  { id: '2', title: 'Physics Chapter Test', type: 'Chapter', status: 'scheduled', students: 0, avgScore: 0, date: 'Dec 15, 2024' },
  { id: '3', title: 'Chemistry Quick Test', type: 'Practice', status: 'completed', students: 892, avgScore: 82, date: 'Dec 8, 2024' },
  { id: '4', title: 'NEET Biology Full Test', type: 'Full Length', status: 'completed', students: 2341, avgScore: 71, date: 'Dec 5, 2024' },
];

const topStudents = [
  { rank: 1, name: 'Priya Sharma', score: 298, percentile: 99.8 },
  { rank: 2, name: 'Rahul Verma', score: 295, percentile: 99.5 },
  { rank: 3, name: 'Ankit Kumar', score: 292, percentile: 99.2 },
  { rank: 4, name: 'Sneha Patel', score: 290, percentile: 98.9 },
  { rank: 5, name: 'Vikash Singh', score: 288, percentile: 98.5 },
];

const sidebarItems = [
  { icon: BarChart3, label: 'Dashboard', active: true },
  { icon: FileText, label: 'Tests' },
  { icon: Users, label: 'Students' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Settings, label: 'Settings' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-foreground block">ExamShield</span>
              <span className="text-xs text-muted-foreground">Admin Portal</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {sidebarItems.map((item, index) => (
              <li key={index}>
                <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/')}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, Admin</p>
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
              { label: 'Total Tests', value: '48', change: '+5 this month', color: 'bg-accent/10 text-accent' },
              { label: 'Active Students', value: '12,450', change: '+234 this week', color: 'bg-success/10 text-success' },
              { label: 'Tests Today', value: '3', change: '2 ongoing', color: 'bg-primary/10 text-primary' },
              { label: 'Avg. Score', value: '76%', change: '+2.3% vs last month', color: 'bg-warning/10 text-warning' },
            ].map((stat, index) => (
              <div key={index} className="bg-card rounded-xl border border-border p-6">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="text-xs text-success mt-2">{stat.change}</div>
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
                <div className="space-y-4">
                  {recentTests.map((test) => (
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
                          <div className="font-medium text-foreground">{test.students.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Students</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">{test.avgScore || '-'}%</div>
                          <div className="text-xs text-muted-foreground">Avg Score</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          test.status === 'active' ? 'bg-success/10 text-success' :
                          test.status === 'scheduled' ? 'bg-warning/10 text-warning' :
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
                <div className="space-y-4">
                  {topStudents.map((student) => (
                    <div key={student.rank} className="flex items-center gap-4">
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
                        <div className="text-xs text-muted-foreground">{student.percentile}%ile</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">{student.score}</div>
                        <div className="text-xs text-muted-foreground">/300</div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-6">
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
