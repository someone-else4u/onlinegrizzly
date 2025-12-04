import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Clock, 
  FileText, 
  Trophy, 
  BarChart3, 
  Calendar,
  Play,
  ChevronRight,
  LogOut,
  User,
  Bell
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const upcomingTests = [
  {
    id: "1",
    title: "JEE Main Full Mock Test #1",
    type: "Full Length",
    duration: 180,
    questions: 90,
    scheduledAt: "2024-12-15 10:00 AM",
    subjects: ["Physics", "Chemistry", "Maths"],
    status: "scheduled"
  },
  {
    id: "2",
    title: "Physics - Mechanics Chapter Test",
    type: "Chapter Test",
    duration: 60,
    questions: 30,
    scheduledAt: "Available Now",
    subjects: ["Physics"],
    status: "available"
  },
  {
    id: "3",
    title: "Chemistry - Organic Reactions",
    type: "Practice",
    duration: 45,
    questions: 25,
    scheduledAt: "Available Now",
    subjects: ["Chemistry"],
    status: "available"
  }
];

const recentResults = [
  { test: "JEE Main Mock #12", score: 245, total: 300, percentile: 95.2, rank: 4520 },
  { test: "Physics Quick Test", score: 28, total: 30, percentile: 98.1, rank: 892 },
  { test: "Chemistry Full Test", score: 85, total: 100, percentile: 91.5, rank: 8234 },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">ExamShield</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome back, Rahul! 👋
          </h1>
          <p className="text-muted-foreground">Ready to ace your next test? Your preparation stats look great!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileText, label: "Tests Taken", value: "24", color: "bg-accent/10 text-accent" },
            { icon: Trophy, label: "Best Percentile", value: "98.1%", color: "bg-success/10 text-success" },
            { icon: Clock, label: "Study Hours", value: "156h", color: "bg-primary/10 text-primary" },
            { icon: BarChart3, label: "Avg. Score", value: "82%", color: "bg-warning/10 text-warning" },
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
          {/* Upcoming Tests */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold text-foreground">Upcoming Tests</h2>
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingTests.map((test) => (
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
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {test.status === 'available' ? 'Available Now' : 'Scheduled'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {test.subjects.map((subject, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs">
                        {subject}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {test.scheduledAt}
                    </div>
                    <Link to={`/test/${test.id}/pre`}>
                      <Button variant={test.status === 'available' ? 'accent' : 'secondary'} size="sm">
                        <Play className="w-4 h-4 mr-1" />
                        {test.status === 'available' ? 'Start Test' : 'View Details'}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Results */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold text-foreground">Recent Results</h2>
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-3">
              {recentResults.map((result, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-card border border-border"
                >
                  <h4 className="font-medium text-foreground mb-2">{result.test}</h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-foreground">
                      {result.score}<span className="text-sm font-normal text-muted-foreground">/{result.total}</span>
                    </span>
                    <span className="text-sm text-success font-medium">{result.percentile}%ile</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-accent rounded-full h-2 transition-all"
                      style={{ width: `${(result.score / result.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    All India Rank: #{result.rank.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-hero">
              <h3 className="font-semibold text-primary-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Practice Questions
                </Button>
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
