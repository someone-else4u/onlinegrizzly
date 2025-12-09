import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Users,
  Mail,
  Calendar
} from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  tests_taken: number;
  avg_score: number;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // Get all student profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email, created_at');

      if (profilesError) throw profilesError;

      // Get student role user IDs
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (rolesError) throw rolesError;

      const studentUserIds = new Set(studentRoles?.map(r => r.user_id) || []);

      // Filter profiles to only students
      const studentProfiles = (profiles || []).filter(p => studentUserIds.has(p.user_id));

      // Get submission stats for each student
      const studentsWithStats: Student[] = [];

      for (const profile of studentProfiles) {
        const { data: submissions } = await supabase
          .from('submissions')
          .select('score, total_marks')
          .eq('user_id', profile.user_id);

        const tests_taken = submissions?.length || 0;
        const avg_score = submissions && submissions.length > 0
          ? Math.round(submissions.reduce((acc, s) => acc + (s.total_marks > 0 ? (s.score / s.total_marks) * 100 : 0), 0) / submissions.length)
          : 0;

        studentsWithStats.push({
          ...profile,
          tests_taken,
          avg_score
        });
      }

      setStudents(studentsWithStats);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Students</h1>
            <p className="text-sm text-muted-foreground">Manage registered students</p>
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
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No students found</h3>
                  <p className="text-muted-foreground">Students will appear here once they register</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <div key={student.user_id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all card-hover">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-lg font-semibold text-secondary-foreground">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{student.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Joined {new Date(student.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{student.tests_taken}</div>
                          <div className="text-xs text-muted-foreground">Tests Taken</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{student.avg_score}%</div>
                          <div className="text-xs text-muted-foreground">Avg Score</div>
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