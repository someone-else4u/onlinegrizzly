import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Save,
  Loader2,
  Image as ImageIcon,
  GripVertical,
  Check,
  Upload,
  FileText,
  Wand2,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { TestQuestionCard } from "@/components/admin/TestQuestionCard";
import {
  MARKING_PRESETS,
  emptyQuestion,
  mergeQuestionDefaults,
  normalizeStoredQuestion,
  toQuestionPayload,
  type MarkingPattern,
  type QuestionForm,
} from "@/lib/testQuestionForm";
import { extractQuestionsFromPdf } from "@/lib/pdfExtractor";
import { cn } from "@/lib/utils";

export default function QuestionBuilder() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testTitle, setTestTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [markingPattern, setMarkingPattern] = useState<MarkingPattern>("custom");
  const [aiText, setAiText] = useState("");
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [aiParsing, setAiParsing] = useState(false);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ page: number; total: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!testId) return;

      const { data: testData, error: testError } = await supabase
        .from("tests")
        .select("title")
        .eq("id", testId)
        .single();

      if (testError) {
        toast.error("Test not found");
        navigate("/admin/tests");
        return;
      }

      setTestTitle(testData.title);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("test_id", testId)
        .order("created_at", { ascending: true });

      if (questionsError) {
        console.error("Error fetching questions:", questionsError);
      } else if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData.map(normalizeStoredQuestion));
      }

      setLoading(false);
    };

    fetchData();
  }, [testId, navigate]);

  const addQuestion = () => {
    const preset = markingPattern === "custom" ? null : MARKING_PRESETS[markingPattern];
    const newQ: QuestionForm = {
      ...emptyQuestion,
      marks: preset?.marks ?? emptyQuestion.marks,
      negative_marks: preset?.negative_marks ?? emptyQuestion.negative_marks,
    };
    setQuestions((prev) => [...prev, newQ]);
    setSelectedIndex(questions.length);
  };

  const removeQuestion = async (index: number) => {
    const question = questions[index];
    if (!window.confirm("Delete this question?")) return;

    if (question.id) {
      const { error } = await supabase.from("questions").delete().eq("id", question.id);
      if (error) {
        toast.error("Failed to delete question");
        return;
      }
    }

    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex(null);
    toast.success("Question deleted");
  };

  const updateQuestion = <K extends keyof QuestionForm>(index: number, field: K, value: QuestionForm[K]) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const fileName = `${path}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("question-images").upload(fileName, file);
    if (error) {
      toast.error("Failed to upload image");
      return null;
    }
    const { data } = supabase.storage.from("question-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageUpload = async (index: number, field: keyof QuestionForm, file: File) => {
    const key = `${index}-${field}`;
    setUploadingImage(key);
    const url = await uploadImage(file, `qbuilder/${testId}/q${index}`);
    if (url) updateQuestion(index, field, url as QuestionForm[keyof QuestionForm]);
    setUploadingImage(null);
  };

  const applyMarkingPatternToAll = (pattern: MarkingPattern) => {
    setMarkingPattern(pattern);
    if (pattern === "custom") return;
    const preset = MARKING_PRESETS[pattern];
    setQuestions((prev) => prev.map((q) => ({ ...q, marks: preset.marks, negative_marks: preset.negative_marks })));
  };

  const appendQuestions = (incoming: Partial<QuestionForm>[]) => {
    setQuestions((prev) => [...prev, ...incoming.map((q) => mergeQuestionDefaults(q, markingPattern))]);
  };

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
      const extracted = await extractQuestionsFromPdf(file, (page, total) => setPdfProgress({ page, total }));
      if (extracted.length === 0) {
        toast.error("AI couldn't find any questions in this PDF");
      } else {
        appendQuestions(extracted);
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

  const handleAiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAiImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAiParse = async () => {
    if (!aiText.trim() && !aiImageBase64) {
      toast.error("Please enter text or upload an image for AI to parse");
      return;
    }
    setAiParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-questions", {
        body: { text: aiText.trim() || undefined, imageBase64: aiImageBase64 || undefined },
      });
      if (error) throw error;
      if (!data?.questions?.length) {
        toast.error("AI couldn't extract any questions from the input");
        return;
      }
      appendQuestions(
        data.questions.map((q: any) => ({
          question_text: q.question_text || "",
          option_a: q.option_a || "",
          option_b: q.option_b || "",
          option_c: q.option_c || "",
          option_d: q.option_d || "",
          correct_option: ["A", "B", "C", "D"].includes(q.correct_option) ? q.correct_option : null,
          subject: q.subject || "physics",
          difficulty: q.difficulty || "medium",
          topic: q.topic || "",
          chapter: q.chapter || "",
          source_exam: q.source_exam || "",
          source_year: typeof q.source_year === "number" ? q.source_year : null,
          source_question_number: q.source_question_number || q.question_number || "",
          marks: typeof q.marks === "number" ? q.marks : undefined,
          negative_marks: typeof q.negative_marks === "number" ? q.negative_marks : undefined,
          has_options: Boolean(q.option_a || q.option_b || q.option_c || q.option_d),
          correct_answer: q.correct_answer || "",
          answer_tolerance: typeof q.answer_tolerance === "number" ? q.answer_tolerance : 0,
        }))
      );
      setAiText("");
      setAiImageBase64(null);
      toast.success(`AI extracted ${data.questions.length} question(s)!`);
    } catch (e: any) {
      console.error("AI parse error:", e);
      toast.error(e.message || "Failed to parse questions with AI");
    } finally {
      setAiParsing(false);
    }
  };

  const saveQuestion = async (index: number) => {
    const question = questions[index];
    if (!question.question_text.trim() && !question.question_image_url) {
      toast.error("Question text or image is required");
      return;
    }

    setSaving(true);
    try {
      const payload = toQuestionPayload(question, testId!);
      if (question.id) {
        const { error } = await supabase.from("questions").update(payload).eq("id", question.id);
        if (error) throw error;
        toast.success("Question updated");
      } else {
        const { data, error } = await supabase.from("questions").insert(payload).select().single();
        if (error) throw error;
        setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, id: data.id } : q)));
        toast.success("Question added");
      }
      await supabase.from("tests").update({ total_questions: questions.length }).eq("id", testId);
    } catch (error: any) {
      console.error("Error saving question:", error);
      toast.error(error.message || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const saveAllQuestions = async () => {
    setSaving(true);
    let successCount = 0;
    const updated = [...questions];

    for (let i = 0; i < updated.length; i++) {
      const q = updated[i];
      if (!q.question_text.trim() && !q.question_image_url) continue;
      try {
        const payload = toQuestionPayload(q, testId!);
        if (q.id) {
          const { error } = await supabase.from("questions").update(payload).eq("id", q.id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from("questions").insert(payload).select().single();
          if (error) throw error;
          if (data) updated[i] = { ...q, id: data.id };
        }
        successCount++;
      } catch (err) {
        console.error(`Error saving question ${i + 1}:`, err);
      }
    }

    setQuestions(updated);
    await supabase.from("tests").update({ total_questions: updated.length }).eq("id", testId);
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
        {/* Sidebar */}
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
                <p className="text-xs">Add manually, paste with AI, or upload a PDF</p>
              </div>
            ) : (
              <div className="space-y-1">
                {questions.map((q, index) => (
                  <button
                    key={q.id ?? `new-${index}`}
                    onClick={() => setSelectedIndex(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedIndex === index ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <GripVertical className="w-4 h-4 opacity-50" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Q{index + 1}</span>
                        {q.id && <Check className="w-3 h-3 text-success" />}
                        {!q.has_options && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedIndex === index ? "bg-primary-foreground/20" : "bg-muted-foreground/20"}`}>
                            NUM
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${selectedIndex === index ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {q.question_text || "No text yet..."}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        q.difficulty === "easy"
                          ? "bg-success/20 text-success"
                          : q.difficulty === "hard"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">Total: {questions.length} questions</p>
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Marking pattern */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <h2 className="font-display font-semibold text-foreground">Marking Pattern</h2>
                  <p className="text-xs text-muted-foreground">Applies to all questions; override per question if needed.</p>
                </div>
              </div>
              <div className="grid md:grid-cols-5 gap-2">
                {(["jee_main", "jee_advanced", "neet", "nda", "custom"] as MarkingPattern[]).map((p) => {
                  const label = p === "custom" ? "Custom" : MARKING_PRESETS[p].label;
                  const active = markingPattern === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyMarkingPatternToAll(p)}
                      className={cn(
                        "rounded-lg border p-2 text-xs text-left transition-colors",
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

            {/* PDF Importer */}
            <div className="bg-card rounded-xl border-2 border-dashed border-accent/40 p-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-accent" />
                <h2 className="font-display font-semibold text-foreground">Import Past Exam PDF</h2>
                <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">AI</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Upload a previous JEE / NEET paper. AI extracts every question, math, and diagrams automatically.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <label
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm transition-colors",
                    pdfParsing ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-muted"
                  )}
                >
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
            </div>

            {/* AI Parser */}
            <div className="bg-card rounded-xl border-2 border-dashed border-primary/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-foreground">AI Question Parser</h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Beta</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Paste questions or upload an image — AI formats them automatically.
              </p>
              <div className="space-y-3">
                <Textarea
                  placeholder="Paste your questions here..."
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors text-sm text-muted-foreground">
                    <ImageIcon className="w-4 h-4" />
                    {aiImageBase64 ? "Image uploaded ✓" : "Upload question image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAiImageUpload} />
                  </label>
                  {aiImageBase64 && (
                    <button onClick={() => setAiImageBase64(null)} className="text-xs text-destructive hover:underline">
                      Remove image
                    </button>
                  )}
                  <div className="flex-1" />
                  <Button onClick={handleAiParse} disabled={aiParsing || (!aiText.trim() && !aiImageBase64)} className="gap-2">
                    {aiParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {aiParsing ? "Parsing..." : "Extract Questions with AI"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Selected question editor */}
            {selectedQuestion === null ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {questions.length === 0 ? "Start building your test" : "Select a question to edit"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {questions.length === 0
                    ? "Add manually, paste with AI, or upload a past-paper PDF"
                    : "Click a question from the sidebar to edit its details"}
                </p>
                {questions.length === 0 && (
                  <Button variant="accent" onClick={addQuestion}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Question
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => saveQuestion(selectedIndex!)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Question
                  </Button>
                </div>

                <TestQuestionCard
                  question={selectedQuestion}
                  index={selectedIndex!}
                  canRemove
                  uploadingImage={uploadingImage}
                  onUpdate={(field, value) => updateQuestion(selectedIndex!, field, value)}
                  onRemove={() => removeQuestion(selectedIndex!)}
                  onImageUpload={(field, file) => handleImageUpload(selectedIndex!, field, file)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
