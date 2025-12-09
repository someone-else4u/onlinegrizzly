import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  difficulty: string;
  topic: string | null;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  type: string;
  duration: number;
  status: string;
}

export default function TestEdit() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId]);

  const fetchTest = async () => {
    try {
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testError) throw testError;
      setTest(testData);

      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .order('created_at');

      if (questionError) throw questionError;
      setQuestions(questionData || []);
    } catch (error) {
      console.error('Error fetching test:', error);
      toast({ title: "Error", description: "Failed to load test", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!test) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('tests')
        .update({
          title: test.title,
          description: test.description,
          type: test.type,
          duration: test.duration,
          status: test.status,
          total_questions: questions.length
        })
        .eq('id', testId);

      if (error) throw error;
      toast({ title: "Success", description: "Test saved successfully" });
    } catch (error) {
      console.error('Error saving test:', error);
      toast({ title: "Error", description: "Failed to save test", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;

    try {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      if (error) throw error;
      setQuestions(questions.filter(q => q.id !== questionId));
      toast({ title: "Deleted", description: "Question removed" });
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Test not found</h2>
            <Button onClick={() => navigate('/admin/tests')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tests')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">Edit Test</h1>
                <p className="text-sm text-muted-foreground">{test.title}</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="btn-hover">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Test Details */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-foreground mb-4">Test Details</h2>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={test.title}
                    onChange={(e) => setTest({ ...test, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={test.description || ''}
                    onChange={(e) => setTest({ ...test, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Input
                      id="type"
                      value={test.type}
                      onChange={(e) => setTest({ ...test, type: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (mins)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={test.duration}
                      onChange={(e) => setTest({ ...test, duration: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={test.status}
                      onChange={(e) => setTest({ ...test, status: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Questions ({questions.length})</h2>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No questions added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={q.id} className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground mb-2">
                            Q{index + 1}: {q.question_text}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className={q.correct_option === 'a' ? 'text-success font-medium' : ''}>A: {q.option_a}</div>
                            <div className={q.correct_option === 'b' ? 'text-success font-medium' : ''}>B: {q.option_b}</div>
                            <div className={q.correct_option === 'c' ? 'text-success font-medium' : ''}>C: {q.option_c}</div>
                            <div className={q.correct_option === 'd' ? 'text-success font-medium' : ''}>D: {q.option_d}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteQuestion(q.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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