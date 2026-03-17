import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Image as ImageIcon,
  GripVertical,
  Check
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

const SUBJECTS = ['physics', 'chemistry', 'mathematics', 'biology'] as const;

interface Question {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D" | null;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  subject: string;
  marks: number;
  negative_marks: number;
  question_image_url: string | null;
  option_a_image: string | null;
  option_b_image: string | null;
  option_c_image: string | null;
  option_d_image: string | null;
}

const emptyQuestion: Question = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: null,
  difficulty: "medium",
  topic: "",
  subject: "physics",
  marks: 4,
  negative_marks: 1,
  question_image_url: null,
  option_a_image: null,
  option_b_image: null,
  option_c_image: null,
  option_d_image: null,
};

export default function QuestionBuilder() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testTitle, setTestTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!testId) return;

      // Fetch test info
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('title')
        .eq('id', testId)
        .single();

      if (testError) {
        toast.error('Test not found');
        navigate('/admin/tests');
        return;
      }

      setTestTitle(testData.title);

      // Fetch existing questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .order('created_at', { ascending: true });

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
      } else if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData.map(q => ({
          ...q,
          correct_option: (q.correct_option as "A" | "B" | "C" | "D" | null) ?? null,
          difficulty: q.difficulty as "easy" | "medium" | "hard",
          subject: (q as any).subject || 'physics',
          option_a_image: (q as any).option_a_image || null,
          option_b_image: (q as any).option_b_image || null,
          option_c_image: (q as any).option_c_image || null,
          option_d_image: (q as any).option_d_image || null,
        })));
      }

      setLoading(false);
    };

    fetchData();
  }, [testId, navigate]);

  const addQuestion = () => {
    setQuestions([...questions, { ...emptyQuestion }]);
    setSelectedIndex(questions.length);
  };

  const removeQuestion = async (index: number) => {
    const question = questions[index];
    
    if (question.id) {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', question.id);
      
      if (error) {
        toast.error('Failed to delete question');
        return;
      }
    }
    
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    setSelectedIndex(null);
    toast.success('Question deleted');
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const saveQuestion = async (index: number) => {
    const question = questions[index];
    
    if (!question.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (!question.option_a || !question.option_b || !question.option_c || !question.option_d) {
      toast.error('All options are required');
      return;
    }

    setSaving(true);

    try {
      if (question.id) {
        // Update existing question
        const { error } = await supabase
          .from('questions')
          .update({
            question_text: question.question_text,
            option_a: question.option_a,
            option_b: question.option_b,
            option_c: question.option_c,
            option_d: question.option_d,
            correct_option: question.correct_option,
            difficulty: question.difficulty,
            topic: question.topic || null,
            subject: question.subject,
            marks: question.marks,
            negative_marks: question.negative_marks,
            question_image_url: question.question_image_url,
          })
          .eq('id', question.id);

        if (error) throw error;
        toast.success('Question updated');
      } else {
        // Create new question
        const { data, error } = await supabase
          .from('questions')
          .insert({
            test_id: testId,
            question_text: question.question_text,
            option_a: question.option_a,
            option_b: question.option_b,
            option_c: question.option_c,
            option_d: question.option_d,
            correct_option: question.correct_option,
            difficulty: question.difficulty,
            topic: question.topic || null,
            subject: question.subject,
            marks: question.marks,
            negative_marks: question.negative_marks,
            question_image_url: question.question_image_url,
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state with new ID
        const updated = [...questions];
        updated[index] = { ...updated[index], id: data.id };
        setQuestions(updated);
        
        toast.success('Question added');
      }

      // Update test total_questions count
      await supabase
        .from('tests')
        .update({ total_questions: questions.length })
        .eq('id', testId);

    } catch (error: any) {
      console.error('Error saving question:', error);
      toast.error(error.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const saveAllQuestions = async () => {
    setSaving(true);
    let successCount = 0;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question_text.trim()) continue;

      try {
        if (question.id) {
          await supabase
            .from('questions')
            .update({
              question_text: question.question_text,
              option_a: question.option_a,
              option_b: question.option_b,
              option_c: question.option_c,
              option_d: question.option_d,
              correct_option: question.correct_option,
              difficulty: question.difficulty,
              topic: question.topic || null,
              marks: question.marks,
              negative_marks: question.negative_marks,
            })
            .eq('id', question.id);
        } else {
          const { data } = await supabase
            .from('questions')
            .insert({
              test_id: testId,
              question_text: question.question_text,
              option_a: question.option_a,
              option_b: question.option_b,
              option_c: question.option_c,
              option_d: question.option_d,
              correct_option: question.correct_option,
              difficulty: question.difficulty,
              topic: question.topic || null,
              marks: question.marks,
              negative_marks: question.negative_marks,
            })
            .select()
            .single();

          if (data) {
            questions[i].id = data.id;
          }
        }
        successCount++;
      } catch (error) {
        console.error(`Error saving question ${i + 1}:`, error);
      }
    }

    await supabase
      .from('tests')
      .update({ total_questions: questions.length })
      .eq('id', testId);

    setSaving(false);
    toast.success(`Saved ${successCount} questions`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedQuestion = selectedIndex !== null ? questions[selectedIndex] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/tests" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="border-l border-border pl-4">
              <Logo size="sm" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="font-display font-bold text-foreground">Question Builder</h1>
            <p className="text-sm text-muted-foreground">{testTitle}</p>
          </div>
          <Button variant="default" onClick={saveAllQuestions} disabled={saving || questions.length === 0}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save All
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Questions List Sidebar */}
        <div className="w-72 bg-card border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <Button variant="accent" className="w-full" onClick={addQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto p-2">
            {questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No questions yet</p>
                <p className="text-xs">Click "Add Question" to start</p>
              </div>
            ) : (
              <div className="space-y-1">
                {questions.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedIndex === index
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 opacity-50" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Q{index + 1}</span>
                        {q.id && (
                          <Check className="w-3 h-3 text-success" />
                        )}
                      </div>
                      <p className={`text-xs truncate ${
                        selectedIndex === index ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {q.question_text || 'No text yet...'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      q.difficulty === 'easy' ? 'bg-success/20 text-success' :
                      q.difficulty === 'hard' ? 'bg-destructive/20 text-destructive' :
                      'bg-warning/20 text-warning'
                    }`}>
                      {q.difficulty}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-border bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              Total: {questions.length} questions
            </p>
          </div>
        </div>

        {/* Question Editor */}
        <div className="flex-1 overflow-auto p-6">
          {selectedQuestion === null ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {questions.length === 0 ? 'Start building your test' : 'Select a question'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {questions.length === 0 
                    ? 'Add your first question to begin'
                    : 'Click on a question from the sidebar to edit it'
                  }
                </p>
                {questions.length === 0 && (
                  <Button variant="accent" onClick={addQuestion}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Question
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-semibold text-foreground">
                  Question {selectedIndex! + 1}
                </h2>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => saveQuestion(selectedIndex!)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Question
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-destructive"
                    onClick={() => removeQuestion(selectedIndex!)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Question Text */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Question Text *</label>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    placeholder="Enter your question here..."
                    value={selectedQuestion.question_text}
                    onChange={(e) => updateQuestion(selectedIndex!, 'question_text', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
                    <select
                      value={selectedQuestion.subject}
                      onChange={(e) => updateQuestion(selectedIndex!, 'subject', e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Topic</label>
                    <Input
                      placeholder="e.g., Kinematics"
                      value={selectedQuestion.topic}
                      onChange={(e) => updateQuestion(selectedIndex!, 'topic', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
                    <select
                      value={selectedQuestion.difficulty}
                      onChange={(e) => updateQuestion(selectedIndex!, 'difficulty', e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Marks</label>
                      <Input
                        type="number"
                        min={1}
                        value={selectedQuestion.marks}
                        onChange={(e) => updateQuestion(selectedIndex!, 'marks', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Negative</label>
                      <Input
                        type="number"
                        min={0}
                        value={selectedQuestion.negative_marks}
                        onChange={(e) => updateQuestion(selectedIndex!, 'negative_marks', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="font-medium text-foreground">Answer Options</h3>
                
                <div className="grid gap-3">
                  {(['A', 'B', 'C', 'D'] as const).map((option) => {
                    const fieldName = `option_${option.toLowerCase()}` as keyof Question;
                    const isCorrect = selectedQuestion.correct_option === option;
                    
                    return (
                      <div
                        key={option}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                          isCorrect 
                            ? 'border-success bg-success/5' 
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <button
                          onClick={() => updateQuestion(selectedIndex!, 'correct_option', selectedQuestion.correct_option === option ? null : option)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                            isCorrect
                              ? 'bg-success text-success-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-background'
                          }`}
                        >
                          {option}
                        </button>
                        <Input
                          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder={`Option ${option}`}
                          value={selectedQuestion[fieldName] as string}
                          onChange={(e) => updateQuestion(selectedIndex!, fieldName, e.target.value)}
                        />
                        {isCorrect && (
                          <span className="text-xs font-medium text-success px-2 py-1 bg-success/10 rounded">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
