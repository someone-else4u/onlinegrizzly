import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LandingStats {
  totalStudents: number;
  totalTests: number;
  totalSubmissions: number;
}

export function useLandingStats() {
  const [stats, setStats] = useState<LandingStats>({
    totalStudents: 0,
    totalTests: 0,
    totalSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: studentsCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      const { count: testsCount } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      const { count: submissionsCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalStudents: studentsCount || 0,
        totalTests: testsCount || 0,
        totalSubmissions: submissionsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching landing stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading };
}
