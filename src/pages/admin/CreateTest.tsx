import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  CalendarIcon,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Wand2,
  FileText
} from "lucide-react";
import { extractQuestionsFromPdf } from "@/lib/pdfExtractor";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const SUBJECTS = ['physics', 'chemistry', 'mathematics', 'biology'] as const;

const questionSchema = z.object({
  question_text: z.string().min(1, "Question text or image is required"),
  option_a: z.string(),
  option_b: z.string(),
  option_c: z.string(),
  option_d: z.string(),
  correct_option: z.enum(["A", "B", "C", "D"]).nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
});

type MarkingPattern = "jee_main" | "jee_advanced" | "neet" | "nda" | "custom";

const MARKING_PRESETS: Record<Exclude<MarkingPattern, "custom">, { marks: number; negative_marks: number; label: string }> = {
  jee_main: { marks: 4, negative_marks: 1, label: "JEE Main (+4 / -1)" },
  jee_advanced: { marks: 4, negative_marks: 2, label: "JEE Advanced (+4 / -2)" },
  neet: { marks: 4, negative_marks: 1, label: "NEET (+4 / -1)" },
  nda: { marks: 2.5, negative_marks: 2.5 / 3, label: "NDA Maths (+2.5 / -0.83)" },
};

interface QuestionForm {
  question_text: string;
  question_image_url: string | null;
  has_options: boolean;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_a_image: string | null;
  option_b_image: string | null;
  option_c_image: string | null;
  option_d_image: string | null;
  correct_option: "A" | "B" | "C" | "D" | null;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  chapter: string;
  source_exam: string;
  source_year: number | null;
  source_question_number: string;
  subject: string;
  marks: number;
  negative_marks: number;
}

const emptyQuestion: QuestionForm = {
  question_text: "",
  question_image_url: null,
  has_options: true,
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  option_a_image: null,
  option_b_image: null,
  option_c_image: null,
  option_d_image: null,
  correct_option: null,
  difficulty: "medium",
  topic: "",
  chapter: "",
  source_exam: "",
  source_year: null,
  source_question_number: "",
  subject: "physics",
  marks: 4,
  negative_marks: 1,
};

export default function CreateTest() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  
  const [testTitle, setTestTitle] = useState("");
  const [testType, setTestType] = useState("full");
  const [testDuration, setTestDuration] = useState(180);
  const [testDescription, setTestDescription] = useState("");
  const [scheduleType, setScheduleType] = useState<"flexible" | "fixed">("flexible");
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>();
  const [endsAt, setEndsAt] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [endsTime, setEndsTime] = useState("18:00");
  const [questions, setQuestions] = useState<QuestionForm[]>([{ ...emptyQuestion }]);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [aiParsing, setAiParsing] = useState(false);
  const [markingPattern, setMarkingPattern] = useState<MarkingPattern>("jee_main");
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ page: number; total: number } | null>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    setPdfParsing(true);
    setPdfProgress({ page: 0, total: 0 });
    try {
      toast.info("Extracting questions from PDF — this may take a minute…");
      const extracted = await extractQuestionsFromPdf(file, (page, total) =>
        setPdfProgress({ page, total })
      );
      if (extracted.length === 0) {
        toast.error("AI couldn't find any questions in this PDF");
      } else {
        const preset = markingPattern === "custom" ? null : MARKING_PRESETS[markingPattern];
        const newQs: QuestionForm[] = extracted.map((q) => ({
          ...emptyQuestion,
          ...q,
          topic: q.topic || q.chapter || "",
          marks: q.marks ?? preset?.marks ?? 4,
          negative_marks: q.negative_marks ?? preset?.negative_marks ?? 1,
        }));
        // Replace the single empty question if user hasn't touched it
        setQuestions((prev) => {
          const isEmptyStart = prev.length === 1 && !prev[0].question_text && !prev[0].question_image_url;
          return isEmptyStart ? newQs : [...prev, ...newQs];
        });
        toast.success(`Extracted ${extracted.length} question(s) from PDF!`);
      }
    } catch (err: any) {
      console.error("PDF parse error:", err);
      toast.error(err.message || "Failed to parse PDF");
    } finally {
      setPdfParsing(false);
      setPdfProgress(null);
    }
  };

  const applyMarkingPatternToAll = (pattern: MarkingPattern) => {
    setMarkingPattern(pattern);
    if (pattern === "custom") return;
    const preset = MARKING_PRESETS[pattern];
    setQuestions(prev => prev.map(q => ({ ...q, marks: preset.marks, negative_marks: preset.negative_marks })));
  };

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
          <Link to="/"><Button variant="accent">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  const addQuestion = () => setQuestions([...questions, { ...emptyQuestion }]);
  const removeQuestion = (index: number) => {
    if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== index));
  };
  const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('question-images').upload(fileName, file);
    if (error) { toast.error('Failed to upload image'); return null; }
    const { data } = supabase.storage.from('question-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageUpload = async (index: number, field: keyof QuestionForm, file: File) => {
    const key = `${index}-${field}`;
    setUploadingImage(key);
    const url = await uploadImage(file, `test-new/q${index}`);
    if (url) updateQuestion(index, field, url);
    setUploadingImage(null);
  };

  const combineDateTime = (date: Date | undefined, time: string): string | null => {
    if (!date) return null;
    const [h, m] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(h, m, 0, 0);
    return combined.toISOString();
  };

  const handleAiParse = async () => {
    if (!aiText.trim() && !aiImageBase64) {
      toast.error("Please enter text or upload an image for AI to parse");
      return;
    }
    setAiParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-questions', {
        body: { text: aiText.trim() || undefined, imageBase64: aiImageBase64 || undefined },
      });
      if (error) throw error;
      if (data?.questions?.length > 0) {
        const parsed: QuestionForm[] = data.questions.map((q: any) => ({
          ...emptyQuestion,
          question_text: q.question_text || "",
          option_a: q.option_a || "",
          option_b: q.option_b || "",
          option_c: q.option_c || "",
          option_d: q.option_d || "",
          correct_option: ["A","B","C","D"].includes(q.correct_option) ? q.correct_option : null,
          subject: q.subject || "physics",
          difficulty: q.difficulty || "medium",
          topic: q.topic || "",
          chapter: q.chapter || "",
          source_exam: q.source_exam || "",
          source_year: typeof q.source_year === "number" ? q.source_year : null,
          source_question_number: q.source_question_number || q.question_number || "",
          marks: typeof q.marks === "number" ? q.marks : emptyQuestion.marks,
          negative_marks: typeof q.negative_marks === "number" ? q.negative_marks : emptyQuestion.negative_marks,
        }));
        setQuestions(prev => [...prev, ...parsed]);
        setAiText("");
        setAiImageBase64(null);
        toast.success(`AI extracted ${parsed.length} question(s)!`);
      } else {
        toast.error("AI couldn't extract any questions from the input");
      }
    } catch (e: any) {
      console.error("AI parse error:", e);
      toast.error(e.message || "Failed to parse questions with AI");
    } finally {
      setAiParsing(false);
    }
  };

  const handleAiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAiImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (publish: boolean) => {
    if (!testTitle.trim()) { toast.error("Please enter a test title"); return; }
    if (questions.length === 0) { toast.error("Please add at least one question"); return; }
    if (publish && scheduledAt && endsAt && new Date(combineDateTime(endsAt, endsTime)!) <= new Date(combineDateTime(scheduledAt, scheduledTime)!)) {
      toast.error("End time must be after start time"); return;
    }

    setSaving(true);
    try {
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
          schedule_type: scheduleType,
          scheduled_at: combineDateTime(scheduledAt, scheduledTime),
          ends_at: combineDateTime(endsAt, endsTime),
        })
        .select()
        .single();

      if (testError) throw testError;

      const questionsToInsert = questions.map(q => ({
        test_id: testData.id,
        question_text: q.question_text || 'Image Question',
        option_a: q.has_options ? (q.option_a || 'See image') : 'N/A',
        option_b: q.has_options ? (q.option_b || 'See image') : 'N/A',
        option_c: q.has_options ? (q.option_c || 'See image') : 'N/A',
        option_d: q.has_options ? (q.option_d || 'See image') : 'N/A',
        correct_option: q.has_options ? q.correct_option : null,
        difficulty: q.difficulty,
        topic: q.topic || null,
        chapter: q.chapter || null,
        source_exam: q.source_exam || null,
        source_year: q.source_year,
        source_question_number: q.source_question_number || null,
        subject: q.subject,
        marks: q.marks,
        negative_marks: q.negative_marks,
        question_image_url: q.question_image_url,
        option_a_image: q.has_options ? q.option_a_image : null,
        option_b_image: q.has_options ? q.option_b_image : null,
        option_c_image: q.has_options ? q.option_c_image : null,
        option_d_image: q.has_options ? q.option_d_image : null,
      }));

      const { error: questionsError } = await supabase.from('questions').insert(questionsToInsert);
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

  const ImageUploadButton = ({ index, field, currentUrl, label }: { index: number; field: keyof QuestionForm; currentUrl: string | null; label: string }) => {
    const key = `${index}-${field}`;
    return (
      <div className="relative">
        {currentUrl ? (
          <div className="relative group">
            <img src={currentUrl} alt={label} className="w-full h-20 object-cover rounded-md border border-border" />
            <button
              onClick={() => updateQuestion(index, field, null)}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >×</button>
          </div>
        ) : (
          <label className="flex items-center gap-2 p-2 border border-dashed border-border rounded-md cursor-pointer hover:bg-muted transition-colors text-xs text-muted-foreground">
            {uploadingImage === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {label}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(index, field, file);
            }} />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin-dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
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
              <Input placeholder="e.g., JEE Main Mock Test #1" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Test Type</label>
              <select value={testType} onChange={(e) => setTestType(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="full">Full Length</option>
                <option value="chapter">Chapter Test</option>
                <option value="practice">Practice Test</option>
                <option value="mini">Mini Test</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Duration (minutes)</label>
              <Input type="number" min={1} value={testDuration} onChange={(e) => setTestDuration(parseInt(e.target.value) || 60)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Description (optional)</label>
              <Input placeholder="Brief description of the test" value={testDescription} onChange={(e) => setTestDescription(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Marking Pattern */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-display font-semibold text-foreground mb-2">Marking Pattern</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose an exam pattern — this sets the default marks &amp; negative marks for every question. You can still override per question.
          </p>
          <div className="grid md:grid-cols-5 gap-3">
            {(["jee_main", "jee_advanced", "neet", "nda", "custom"] as MarkingPattern[]).map((p) => {
              const label = p === "custom" ? "Custom (per question)" : MARKING_PRESETS[p].label;
              const active = markingPattern === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => applyMarkingPatternToAll(p)}
                  className={cn(
                    "rounded-lg border p-3 text-sm text-left transition-colors",
                    active
                      ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  <div className="font-medium text-foreground">{label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scheduling */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Test Schedule</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Schedule Type</label>
              <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value as any)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="flexible">Flexible (students can attempt anytime within window)</option>
                <option value="fixed">Fixed (all students must start at exact time)</option>
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Opens On</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !scheduledAt && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledAt ? format(scheduledAt, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={scheduledAt} onSelect={setScheduledAt} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-32" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Closes On</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !endsAt && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endsAt ? format(endsAt, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endsAt} onSelect={setEndsAt} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <Input type="time" value={endsTime} onChange={(e) => setEndsTime(e.target.value)} className="w-32" />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Leave dates empty if the test should be available indefinitely once published.</p>
          </div>
        </div>

        {/* PDF Past-Paper Importer */}
        <div className="bg-card rounded-xl border-2 border-dashed border-accent/40 p-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-semibold text-foreground">Import Past Exam PDF</h2>
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">AI</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a previous JEE / NEET paper (PDF). AI will extract every question, render math as LaTeX, and
            automatically <strong>crop diagrams, graphs, tables, circuits and complex math</strong> as images so the
            paper feels identical to the original.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <label className={cn(
              "flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm transition-colors",
              pdfParsing ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-muted"
            )}>
              {pdfParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {pdfParsing ? "Processing PDF…" : "Upload PDF"}
              <input type="file" accept="application/pdf" className="hidden" disabled={pdfParsing} onChange={handlePdfUpload} />
            </label>
            {pdfProgress && pdfProgress.total > 0 && (
              <span className="text-xs text-muted-foreground">
                Page {pdfProgress.page} of {pdfProgress.total}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            ⚡ Tip: Higher quality scans give better extraction. Each page is sent to AI separately, so longer PDFs take more time.
          </p>
        </div>

        {/* AI Question Parser */}
        <div className="bg-card rounded-xl border-2 border-dashed border-primary/30 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-display font-semibold text-foreground">AI Question Parser</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Beta</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Paste question text or upload an image with questions — AI will extract and format them as MCQs automatically.
          </p>
          <div className="space-y-4">
            <Textarea
              placeholder="Paste your questions here... e.g.&#10;1. What is Newton's first law?&#10;A) Law of inertia B) F=ma C) Action-reaction D) Gravity&#10;Answer: A"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors text-sm text-muted-foreground">
                <ImageIcon className="w-4 h-4" />
                {aiImageBase64 ? "Image uploaded ✓" : "Upload question image"}
                <input type="file" accept="image/*" className="hidden" onChange={handleAiImageUpload} />
              </label>
              {aiImageBase64 && (
                <button onClick={() => setAiImageBase64(null)} className="text-xs text-destructive hover:underline">Remove image</button>
              )}
              <div className="flex-1" />
              <Button onClick={handleAiParse} disabled={aiParsing || (!aiText.trim() && !aiImageBase64)} className="gap-2">
                {aiParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiParsing ? "Parsing..." : "Extract Questions with AI"}
              </Button>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-foreground">Questions ({questions.length})</h2>
            <Button variant="outline" onClick={addQuestion}><Plus className="w-4 h-4 mr-2" /> Add Question</Button>
          </div>

          {questions.map((q, index) => (
            <div key={index} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Question {index + 1}</h3>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeQuestion(index)} disabled={questions.length === 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Subject & Difficulty */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Subject *</label>
                    <select value={q.subject} onChange={(e) => updateQuestion(index, 'subject', e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {SUBJECTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
                    <select value={q.difficulty} onChange={(e) => updateQuestion(index, 'difficulty', e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Topic</label>
                    <Input placeholder="e.g., Kinematics" value={q.topic} onChange={(e) => updateQuestion(index, 'topic', e.target.value)} />
                  </div>
                </div>

                {/* Marks (per question) */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Marks (+)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={q.marks}
                      onChange={(e) => updateQuestion(index, 'marks', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Negative Marks (-)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={q.negative_marks}
                      onChange={(e) => updateQuestion(index, 'negative_marks', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer h-10">
                      <input
                        type="checkbox"
                        checked={q.has_options}
                        onChange={(e) => updateQuestion(index, 'has_options', e.target.checked)}
                        className="w-4 h-4 rounded border-border accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground">Has MCQ options</span>
                    </label>
                  </div>
                </div>

                {/* PYQ / Source metadata — used for chapterwise mock test creation */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Chapter</label>
                    <Input
                      placeholder="e.g., Electrostatics"
                      value={q.chapter}
                      onChange={(e) => updateQuestion(index, 'chapter', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Source Exam</label>
                    <Input
                      placeholder="e.g., JEE Advanced"
                      value={q.source_exam}
                      onChange={(e) => updateQuestion(index, 'source_exam', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Year</label>
                    <Input
                      type="number"
                      placeholder="e.g., 2021"
                      value={q.source_year ?? ''}
                      onChange={(e) =>
                        updateQuestion(
                          index,
                          'source_year',
                          e.target.value ? parseInt(e.target.value, 10) : null
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Original Q No.</label>
                    <Input
                      placeholder="e.g., 17"
                      value={q.source_question_number}
                      onChange={(e) => updateQuestion(index, 'source_question_number', e.target.value)}
                    />
                  </div>
                </div>

                {/* Question Text + Image */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Question Text</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    placeholder={'Enter your question. For math, use LaTeX:  inline $E=mc^2$  or block $$\\int_0^1 x\\,dx$$'}
                    value={q.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Tip: Wrap math in <code className="bg-muted px-1 rounded">$ ... $</code> for inline or{" "}
                    <code className="bg-muted px-1 rounded">$$ ... $$</code> for block. Example:{" "}
                    <code className="bg-muted px-1 rounded">{"$x^2 + y^2 = r^2$"}</code>
                  </p>
                  <div className="mt-2">
                    <ImageUploadButton index={index} field="question_image_url" currentUrl={q.question_image_url} label="Upload question image" />
                  </div>
                </div>

                {/* Options with image support — only when has_options is true */}
                {q.has_options ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                        <div key={opt}>
                          <label className="text-sm font-medium text-foreground mb-2 block">Option {opt.toUpperCase()}</label>
                          <Input
                            placeholder={`Option ${opt.toUpperCase()} (text or LaTeX)`}
                            value={q[`option_${opt}` as keyof QuestionForm] as string}
                            onChange={(e) => updateQuestion(index, `option_${opt}` as keyof QuestionForm, e.target.value)}
                            className="mb-2 font-mono text-xs"
                          />
                          <ImageUploadButton index={index} field={`option_${opt}_image` as keyof QuestionForm} currentUrl={q[`option_${opt}_image` as keyof QuestionForm] as string | null} label={`Upload option ${opt.toUpperCase()} image`} />
                        </div>
                      ))}
                    </div>

                    {/* Correct Answer (optional - can be set later) */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Correct Answer <span className="text-muted-foreground">(can be set later)</span></label>
                      <select
                        value={q.correct_option || ''}
                        onChange={(e) => updateQuestion(index, 'correct_option', e.target.value || null)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Not set yet</option>
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    📝 No-options mode — this question will be displayed without MCQ choices (e.g., subjective / numerical / descriptive).
                  </div>
                )}
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={addQuestion}>
            <Plus className="w-4 h-4 mr-2" /> Add Another Question
          </Button>
        </div>
      </main>
    </div>
  );
}
