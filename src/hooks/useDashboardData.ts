import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalTests: number;
  totalStudents: number;
  testsToday: number;
  avgScore: number;
}

interface RecentTest {
  id: string;
  title: string;
  type: string;
  status: string;
  date: string;
  studentCount: number;
  avgScore: number;
}

interface TopPerformer {
  rank: number;
  name: string;
  score: number;
  totalMarks: number;
  userId: string;
}

export function useAdminDashboardData() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    totalStudents: 0,
    testsToday: 0,
    avgScore: 0,
  });
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total tests count
      const { count: testsCount } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true });

      // Fetch total students count
      const { count: studentsCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // Fetch today's tests
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Fetch average score from submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('score, total_marks');

      let avgScore = 0;
      if (submissions && submissions.length > 0) {
        const totalPercentage = submissions.reduce((acc, s) => {
          return acc + (s.total_marks > 0 ? (s.score / s.total_marks) * 100 : 0);
        }, 0);
        avgScore = Math.round(totalPercentage / submissions.length);
      }

      setStats({
        totalTests: testsCount || 0,
        totalStudents: studentsCount || 0,
        testsToday: todayCount || 0,
        avgScore,
      });

      // Fetch recent tests
      const { data: tests } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (tests) {
        const testsWithStats = await Promise.all(
          tests.map(async (test) => {
            const { count: studentCount } = await supabase
              .from('submissions')
              .select('*', { count: 'exact', head: true })
              .eq('test_id', test.id);

            const { data: testSubmissions } = await supabase
              .from('submissions')
              .select('score, total_marks')
              .eq('test_id', test.id);

            let testAvgScore = 0;
            if (testSubmissions && testSubmissions.length > 0) {
              const total = testSubmissions.reduce((acc, s) => {
                return acc + (s.total_marks > 0 ? (s.score / s.total_marks) * 100 : 0);
              }, 0);
              testAvgScore = Math.round(total / testSubmissions.length);
            }

            return {
              id: test.id,
              title: test.title,
              type: test.type,
              status: test.status,
              date: new Date(test.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              studentCount: studentCount || 0,
              avgScore: testAvgScore,
            };
          })
        );
        setRecentTests(testsWithStats);
      }

      // Fetch top performers
      const { data: topSubmissions } = await supabase
        .from('submissions')
        .select('user_id, score, total_marks')
        .order('score', { ascending: false })
        .limit(5);

      if (topSubmissions && topSubmissions.length > 0) {
        const performersWithProfiles = await Promise.all(
          topSubmissions.map(async (submission, index) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', submission.user_id)
              .maybeSingle();

            return {
              rank: index + 1,
              name: profile?.name || 'Unknown',
              score: submission.score,
              totalMarks: submission.total_marks,
              userId: submission.user_id,
            };
          })
        );
        setTopPerformers(performersWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, recentTests, topPerformers, loading, refetch: fetchDashboardData };
}

export function useStudentDashboardData(userId: string | undefined) {
  const [stats, setStats] = useState({
    testsTaken: 0,
    bestPercentile: 0,
    avgScore: 0,
  });
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchStudentData();
    }
  }, [userId]);

  const fetchStudentData = async () => {
    if (!userId) return;

    try {
      // Fetch student's submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*, tests(title)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (submissions) {
        const testsTaken = submissions.length;
        let bestPercentile = 0;
        let totalScore = 0;

        submissions.forEach((s) => {
          if (s.total_marks > 0) {
            const percentage = (s.score / s.total_marks) * 100;
            totalScore += percentage;
            if (percentage > bestPercentile) {
              bestPercentile = percentage;
            }
          }
        });

        setStats({
          testsTaken,
          bestPercentile: Math.round(bestPercentile * 10) / 10,
          avgScore: testsTaken > 0 ? Math.round(totalScore / testsTaken) : 0,
        });

        // Recent results
        setRecentResults(
          submissions.slice(0, 3).map((s: any) => ({
            id: s.id,
            test: s.tests?.title || 'Unknown Test',
            score: s.score,
            total: s.total_marks,
            percentage: s.total_marks > 0 ? Math.round((s.score / s.total_marks) * 100) : 0,
          }))
        );
      }

      // Fetch available (published) tests
      const { data: tests } = await supabase
        .from('tests')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (tests) {
        // Check which tests the student has already taken
        const { data: takenTests } = await supabase
          .from('submissions')
          .select('test_id')
          .eq('user_id', userId);

        const takenTestIds = new Set(takenTests?.map((t) => t.test_id) || []);

        setAvailableTests(
          tests.map((test) => ({
            id: test.id,
            title: test.title,
            type: test.type,
            duration: test.duration,
            questions: test.total_questions,
            status: takenTestIds.has(test.id) ? 'completed' : 'available',
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, availableTests, recentResults, loading, refetch: fetchStudentData };
}
