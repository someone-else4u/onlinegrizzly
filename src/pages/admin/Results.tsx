import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Trophy,
  Download,
  Medal
} from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  totalScore: number;
  totalMarks: number;
  testsCompleted: number;
  avgPercentage: number;
}

export default function Results() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Fetch all submissions with user info
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('user_id, score, total_marks');

      if (error) throw error;

      // Aggregate by user
      const userStats: Record<string, { totalScore: number; totalMarks: number; testsCompleted: number }> = {};

      for (const sub of submissions || []) {
        if (!userStats[sub.user_id]) {
          userStats[sub.user_id] = { totalScore: 0, totalMarks: 0, testsCompleted: 0 };
        }
        userStats[sub.user_id].totalScore += sub.score;
        userStats[sub.user_id].totalMarks += sub.total_marks;
        userStats[sub.user_id].testsCompleted += 1;
      }

      // Fetch profiles for users with submissions
      const userIds = Object.keys(userStats);
      if (userIds.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      // Build leaderboard
      const entries: LeaderboardEntry[] = userIds.map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const stats = userStats[userId];
        const avgPercentage = stats.totalMarks > 0 
          ? Math.round((stats.totalScore / stats.totalMarks) * 100) 
          : 0;

        return {
          rank: 0,
          userId,
          name: profile?.name || 'Unknown',
          email: profile?.email || '',
          totalScore: stats.totalScore,
          totalMarks: stats.totalMarks,
          testsCompleted: stats.testsCompleted,
          avgPercentage
        };
      });

      // Sort by total score descending
      entries.sort((a, b) => b.totalScore - a.totalScore);

      // Assign ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Rank', 'Name', 'Email', 'Total Score', 'Total Marks', 'Tests Completed', 'Average %'],
      ...leaderboard.map(e => [e.rank, e.name, e.email, e.totalScore, e.totalMarks, e.testsCompleted, e.avgPercentage])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leaderboard.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Results & Leaderboard</h1>
              <p className="text-sm text-muted-foreground">View top performers and export results</p>
            </div>
            <Button onClick={handleExport} disabled={leaderboard.length === 0} className="btn-hover">
              <Download className="w-4 h-4 mr-2" />
              Export Leaderboard
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="bg-card rounded-xl border border-border shadow-lg">
            <div className="p-6 border-b border-border">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : filteredLeaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No results yet</h3>
                  <p className="text-muted-foreground">Results will appear once students complete tests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLeaderboard.map((entry) => (
                    <div key={entry.userId} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all card-hover">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankBadge(entry.rank)}`}>
                          {entry.rank <= 3 ? <Medal className="w-5 h-5" /> : entry.rank}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{entry.name}</h4>
                          <p className="text-sm text-muted-foreground">{entry.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{entry.totalScore}/{entry.totalMarks}</div>
                          <div className="text-xs text-muted-foreground">Total Score</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{entry.testsCompleted}</div>
                          <div className="text-xs text-muted-foreground">Tests</div>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <div className={`font-semibold ${entry.avgPercentage >= 70 ? 'text-success' : entry.avgPercentage >= 50 ? 'text-warning' : 'text-destructive'}`}>
                            {entry.avgPercentage}%
                          </div>
                          <div className="text-xs text-muted-foreground">Average</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}