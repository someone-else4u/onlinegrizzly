import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const questionSchema = z.object({
  question_text: z.string().min(5, "Question must be at least 5 characters"),
  option_a: z.string().min(1, "Option A is required"),
  option_b: z.string().min(1, "Option B is required"),
  option_c: z.string().min(1, "Option C is required"),
  option_d: z.string().min(1, "Option D is required"),
  correct_option: z.enum(["A", "B", "C", "D"], { required_error: "Select correct answer" }),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic: z.string().optional(),
});

interface QuestionForm {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

const emptyQuestion: QuestionForm = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
  difficulty: "medium",
  topic: "",
};

export default function CreateTest() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  
  const [testTitle, setTestTitle] = useState("");
  const [testType, setTestType] = useState("full");
  const [testDuration, setTestDuration] = useState(180);
  const [testDescription, setTestDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionForm[]>([{ ...emptyQuestion }]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
          <Link to="/">
            <Button variant="accent">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const addQuestion = () => {
    setQuestions([...questions, { ...emptyQuestion }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSave = async (publish: boolean) => {
    if (!testTitle.trim()) {
      toast.error("Please enter a test title");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    // Validate all questions
    for (let i = 0; i < questions.length; i++) {
      try {
        questionSchema.parse(questions[i]);
      } catch (err: any) {
        const errors = err.errors || [];
        toast.error(`Question ${i + 1}: ${errors[0]?.message || 'Invalid question'}`);
        return;
      }
    }

    setSaving(true);

    try {
      // Create test
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert({
          title: testTitle,
          type: testType,
          duration: testDuration,
          description: testDescription || null,
          total_questions: questions.length,
          status: publish ? 'published' : 'draft',
          created_by: user?.id,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Create questions
      const questionsToInsert = questions.map(q => ({
        test_id: testData.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        difficulty: q.difficulty,
        topic: q.topic || null,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast.success(publish ? 'Test published successfully!' : 'Test saved as draft!');
      navigate('/admin-dashboard');
    } catch (error: any) {
      console.error('Error saving test:', error);
      toast.error(error.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin-dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">Create Test</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>
            <Button variant="accent" onClick={() => handleSave(true)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Publish Test
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Test Details */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Test Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Test Title *</label>
              <Input
                placeholder="e.g., JEE Main Mock Test #1"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Test Type</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="full">Full Length</option>
                <option value="chapter">Chapter Test</option>
                <option value="practice">Practice Test</option>
                <option value="mini">Mini Test</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Duration (minutes)</label>
              <Input
                type="number"
                min={1}
                value={testDuration}
                onChange={(e) => setTestDuration(parseInt(e.target.value) || 60)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Description (optional)</label>
              <Input
                placeholder="Brief description of the test"
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Questions ({questions.length})
            </h2>
            <Button variant="outline" onClick={addQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>

          {questions.map((q, index) => (
            <div key={index} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Question {index + 1}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removeQuestion(index)}
                  disabled={questions.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Question Text *</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Enter your question here..."
                    value={q.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Option A *</label>
                    <Input
                      placeholder="Option A"
                      value={q.option_a}
                      onChange={(e) => updateQuestion(index, 'option_a', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Option B *</label>
                    <Input
                      placeholder="Option B"
                      value={q.option_b}
                      onChange={(e) => updateQuestion(index, 'option_b', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Option C *</label>
                    <Input
                      placeholder="Option C"
                      value={q.option_c}
                      onChange={(e) => updateQuestion(index, 'option_c', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Option D *</label>
                    <Input
                      placeholder="Option D"
                      value={q.option_d}
                      onChange={(e) => updateQuestion(index, 'option_d', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Correct Answer *</label>
                    <select
                      value={q.correct_option}
                      onChange={(e) => updateQuestion(index, 'correct_option', e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
                    <select
                      value={q.difficulty}
                      onChange={(e) => updateQuestion(index, 'difficulty', e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Topic</label>
                    <Input
                      placeholder="e.g., Physics, Chemistry"
                      value={q.topic}
                      onChange={(e) => updateQuestion(index, 'topic', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={addQuestion}>
            <Plus className="w-4 h-4 mr-2" />
            Add Another Question
          </Button>
        </div>
      </main>
    </div>
  );
}
