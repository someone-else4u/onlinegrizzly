import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus,
  Search,
  FileText,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Clock
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";

interface Test {
  id: string;
  title: string;
  type: string;
  duration: number;
  total_questions: number;
  status: string;
  created_at: string;
}

export default function TestsList() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const { error } = await supabase.from('tests').delete().eq('id', id);
      if (error) throw error;
      setTests(tests.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  const filteredTests = tests.filter(test =>
    test.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Tests</h1>
              <p className="text-sm text-muted-foreground">Manage all your tests</p>
            </div>
            <Link to="/admin/tests/new">
              <Button className="btn-hover">
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="bg-card rounded-xl border border-border shadow-lg">
            <div className="p-6 border-b border-border">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : filteredTests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No tests found</h3>
                  <p className="text-muted-foreground mb-4">Create your first test to get started</p>
                  <Link to="/admin/tests/new">
                    <Button className="btn-hover">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Test
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all card-hover">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{test.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="capitalize">{test.type}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {test.duration} mins
                            </span>
                            <span>•</span>
                            <span>{test.total_questions} questions</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          test.status === 'published' ? 'bg-success/10 text-success' :
                          test.status === 'draft' ? 'bg-warning/10 text-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {test.status}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/tests/${test.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/tests/${test.id}`)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(test.id)}>
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
        </main>
      </div>
    </div>
  );
}