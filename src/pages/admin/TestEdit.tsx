import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, FileText, Loader2, Plus, Save, Sparkles, Wand2, Image as ImageIcon, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { AdminSidebar } from "@/components/AdminSidebar";
import { TestQuestionCard } from "@/components/admin/TestQuestionCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { extractQuestionsFromPdf } from "@/lib/pdfExtractor";
import { MARKING_PRESETS, mergeQuestionDefaults, normalizeStoredQuestion, type MarkingPattern, type QuestionForm, emptyQuestion, toQuestionPayload } from "@/lib/testQuestionForm";
import { toast } from "sonner";

interface EditableTest {
  id: string;
  title: string;
  description: string | null;
  type: string;
  duration: number;
  status: string;
  schedule_type: "flexible" | "fixed";
}

export default function TestEdit() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState<EditableTest | null>(null);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [aiParsing, setAiParsing] = useState(false);
  const [markingPattern, setMarkingPattern] = useState<MarkingPattern>("custom");
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ page: number; total: number } | null>(null);
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>();
  const [endsAt, setEndsAt] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [endsTime, setEndsTime] = useState("18:00");

  useEffect(() => {
    if (!testId) return;

    const fetchTest = async () => {
      try {
        const [{ data: testData, error: testError }, { data: questionData, error: questionError }] = await Promise.all([
          supabase.from("tests").select("*").eq("id", testId).single(),
          supabase.from("questions").select("*").eq("test_id", testId).order("created_at"),
        ]);

        if (testError) throw testError;
        if (questionError) throw questionError;

        setTest({
          id: testData.id,
          title: testData.title,
          description: testData.description,
          type: testData.type,
          duration: testData.duration,
          status: testData.status,
          schedule_type: (testData.schedule_type as "flexible" | "fixed") || "flexible",
        });

        if (testData.scheduled_at) {
          const date = new Date(testData.scheduled_at);
          setScheduledAt(date);
          setScheduledTime(`${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`);
        }

        if (testData.ends_at) {
          const date = new Date(testData.ends_at);
          setEndsAt(date);
          setEndsTime(`${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`);
        }

        setQuestions((questionData || []).map(normalizeStoredQuestion));
      } catch (error) {
        console.error("Error fetching test:", error);
        toast.error("Failed to load test");
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  const updateQuestion = <K extends keyof QuestionForm>(index: number, field: K, value: QuestionForm[K]) => {
    setQuestions((prev) => prev.map((question, questionIndex) => (questionIndex === index ? { ...question, [field]: value } : question)));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, { ...emptyQuestion }]);

  const removeQuestion = async (index: number) => {
    const question = questions[index];
    if (!question) return;
    if (!window.confirm("Delete this question?")) return;

    if (question.id) {
      const { error } = await supabase.from("questions").delete().eq("id", question.id);
      if (error) {
        toast.error("Failed to delete question");
        return;
      }
    }

    setQuestions((prev) => prev.filter((_, questionIndex) => questionIndex !== index));
    toast.success("Question removed");
  };

  const combineDateTime = (date: Date | undefined, time: string) => {
    if (!date) return null;
    const [hours, minutes] = time.split(":").map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined.toISOString();
  };

  const uploadImage = async (file: File, path: string) => {
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
    const url = await uploadImage(file, `test-edit/${testId}/q${index}`);
    if (url) updateQuestion(index, field, url as QuestionForm[keyof QuestionForm]);
    setUploadingImage(null);
  };

  const applyMarkingPatternToAll = (pattern: MarkingPattern) => {
    setMarkingPattern(pattern);
    if (pattern === "custom") return;
    const preset = MARKING_PRESETS[pattern];
    setQuestions((prev) => prev.map((question) => ({ ...question, marks: preset.marks, negative_marks: preset.negative_marks })));
  };

  const appendQuestions = (incomingQuestions: Partial<QuestionForm>[]) => {
    setQuestions((prev) => [...prev, ...incomingQuestions.map((question) => mergeQuestionDefaults(question, markingPattern))]);
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setPdfParsing(true);
    setPdfProgress({ page: 0, total: 0 });

    try {
      const extracted = await extractQuestionsFromPdf(file, (page, total) => setPdfProgress({ page, total }));
      if (extracted.length === 0) {
        toast.error("AI couldn't find any questions in this PDF");
      } else {
        appendQuestions(extracted);
        toast.success(`Extracted ${extracted.length} question(s) from PDF`);
      }
    } catch (error: any) {
      console.error("PDF parse error:", error);
      toast.error(error.message || "Failed to parse PDF");
    } finally {
      setPdfParsing(false);
      setPdfProgress(null);
    }
  };

  const handleAiImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
        data.questions.map((question: any) => ({
          question_text: question.question_text || "",
          option_a: question.option_a || "",
          option_b: question.option_b || "",
          option_c: question.option_c || "",
          option_d: question.option_d || "",
          correct_option: ["A", "B", "C", "D"].includes(question.correct_option) ? question.correct_option : null,
          subject: question.subject || "physics",
          difficulty: question.difficulty || "medium",
          topic: question.topic || "",
          chapter: question.chapter || "",
          source_exam: question.source_exam || "",
          source_year: typeof question.source_year === "number" ? question.source_year : null,
          source_question_number: question.source_question_number || question.question_number || "",
          marks: typeof question.marks === "number" ? question.marks : undefined,
          negative_marks: typeof question.negative_marks === "number" ? question.negative_marks : undefined,
          has_options: Boolean(question.option_a || question.option_b || question.option_c || question.option_d),
        }))
      );

      setAiText("");
      setAiImageBase64(null);
      toast.success(`AI extracted ${data.questions.length} question(s)`);
    } catch (error: any) {
      console.error("AI parse error:", error);
      toast.error(error.message || "Failed to parse questions with AI");
    } finally {
      setAiParsing(false);
    }
  };

  const handleSave = async () => {
    if (!test || !testId) return;
    if (!test.title.trim()) {
      toast.error("Please enter a test title");
      return;
    }
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    const scheduledAtIso = combineDateTime(scheduledAt, scheduledTime);
    const endsAtIso = combineDateTime(endsAt, endsTime);

    if (scheduledAtIso && endsAtIso && new Date(endsAtIso) <= new Date(scheduledAtIso)) {
      toast.error("End time must be after start time");
      return;
    }

    setSaving(true);

    try {
      const { error: testError } = await supabase
        .from("tests")
        .update({
          title: test.title,
          description: test.description,
          type: test.type,
          duration: test.duration,
          status: test.status,
          schedule_type: test.schedule_type,
          scheduled_at: scheduledAtIso,
          ends_at: endsAtIso,
          total_questions: questions.length,
        })
        .eq("id", testId);

      if (testError) throw testError;

      const existingQuestions = questions.filter((question) => question.id);
      const newQuestions = questions.filter((question) => !question.id);

      if (existingQuestions.length > 0) {
        const updateResults = await Promise.all(
          existingQuestions.map((question) =>
            supabase.from("questions").update(toQuestionPayload(question, testId)).eq("id", question.id as string)
          )
        );
        const failedUpdate = updateResults.find((result) => result.error);
        if (failedUpdate?.error) throw failedUpdate.error;
      }

      if (newQuestions.length > 0) {
        const { data: insertedQuestions, error: insertError } = await supabase
          .from("questions")
          .insert(newQuestions.map((question) => toQuestionPayload(question, testId)))
          .select("id");

        if (insertError) throw insertError;

        if (insertedQuestions) {
          let insertedIndex = 0;
          setQuestions((prev) =>
            prev.map((question) => {
              if (question.id) return question;
              const insertedQuestion = insertedQuestions[insertedIndex++];
              return insertedQuestion ? { ...question, id: insertedQuestion.id } : question;
            })
          );
        }
      }

      toast.success("Test updated successfully");
    } catch (error: any) {
      console.error("Error saving test:", error);
      toast.error(error.message || "Failed to save test");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold text-foreground">Test not found</h2>
            <Button onClick={() => navigate("/admin/tests")}>Back to Tests</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tests")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">Edit Test</h1>
                <p className="text-sm text-muted-foreground">{test.title}</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </header>

        <main className="space-y-8 overflow-auto p-6">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-display font-semibold text-foreground">Test Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                  <Input value={test.title} onChange={(event) => setTest({ ...test, title: event.target.value })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Type</label>
                  <select value={test.type} onChange={(event) => setTest({ ...test, type: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="full">Full Length</option>
                    <option value="chapter">Chapter Test</option>
                    <option value="practice">Practice Test</option>
                    <option value="mini">Mini Test</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Duration (minutes)</label>
                  <Input type="number" min={1} value={test.duration} onChange={(event) => setTest({ ...test, duration: parseInt(event.target.value, 10) || 0 })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Status</label>
                  <select value={test.status} onChange={(event) => setTest({ ...test, status: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                  <Textarea value={test.description || ""} onChange={(event) => setTest({ ...test, description: event.target.value })} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-display font-semibold text-foreground">Test Schedule</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Schedule Type</label>
                  <select value={test.schedule_type} onChange={(event) => setTest({ ...test, schedule_type: event.target.value as EditableTest["schedule_type"] })} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="flexible">Flexible</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Opens On</label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !scheduledAt && "text-muted-foreground")}>
                            {scheduledAt ? format(scheduledAt, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={scheduledAt} onSelect={setScheduledAt} initialFocus className="pointer-events-auto p-3" />
                        </PopoverContent>
                      </Popover>
                      <Input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} className="w-32" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Closes On</label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !endsAt && "text-muted-foreground")}>
                            {endsAt ? format(endsAt, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={endsAt} onSelect={setEndsAt} initialFocus className="pointer-events-auto p-3" />
                        </PopoverContent>
                      </Popover>
                      <Input type="time" value={endsTime} onChange={(event) => setEndsTime(event.target.value)} className="w-32" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-2 text-lg font-display font-semibold text-foreground">Marking Pattern</h2>
              <p className="mb-4 text-sm text-muted-foreground">Apply a preset to all questions, then fine-tune any question individually.</p>
              <div className="grid gap-3 md:grid-cols-5">
                {(["jee_main", "jee_advanced", "neet", "nda", "custom"] as MarkingPattern[]).map((pattern) => {
                  const label = pattern === "custom" ? "Custom (per question)" : MARKING_PRESETS[pattern].label;
                  const active = markingPattern === pattern;

                  return (
                    <button
                      key={pattern}
                      type="button"
                      onClick={() => applyMarkingPatternToAll(pattern)}
                      className={cn(
                        "rounded-lg border p-3 text-left text-sm transition-colors",
                        active ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/30" : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      <div className="font-medium text-foreground">{label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-accent/40 bg-card p-6">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-display font-semibold text-foreground">Import Past Exam PDF</h2>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">Upload a past paper and append extracted questions, diagrams, tables, and math directly into this test.</p>
              <div className="flex flex-wrap items-center gap-4">
                <label className={cn("flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition-colors", pdfParsing ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted")}>
                  {pdfParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {pdfParsing ? "Processing PDF..." : "Upload PDF"}
                  <input type="file" accept="application/pdf" className="hidden" disabled={pdfParsing} onChange={handlePdfUpload} />
                </label>
                {pdfProgress && pdfProgress.total > 0 ? <span className="text-xs text-muted-foreground">Page {pdfProgress.page} of {pdfProgress.total}</span> : null}
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold text-foreground">AI Question Parser</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Beta</span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">Paste question text or upload an image to append formatted questions to this test.</p>
              <div className="space-y-4">
                <Textarea className="min-h-[120px]" value={aiText} onChange={(event) => setAiText(event.target.value)} placeholder="Paste your questions here..." />
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted">
                    <ImageIcon className="h-4 w-4" />
                    {aiImageBase64 ? "Image uploaded ✓" : "Upload question image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAiImageUpload} />
                  </label>
                  {aiImageBase64 ? (
                    <button type="button" onClick={() => setAiImageBase64(null)} className="text-xs text-destructive hover:underline">
                      Remove image
                    </button>
                  ) : null}
                  <div className="flex-1" />
                  <Button onClick={handleAiParse} disabled={aiParsing || (!aiText.trim() && !aiImageBase64)}>
                    {aiParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {aiParsing ? "Parsing..." : "Extract Questions with AI"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-semibold text-foreground">Questions ({questions.length})</h2>
                <Button variant="outline" onClick={addQuestion}>
                  <Plus className="mr-2 h-4 w-4" /> Add Question
                </Button>
              </div>

              {questions.map((question, index) => (
                <TestQuestionCard
                  key={question.id ?? `new-${index}`}
                  question={question}
                  index={index}
                  canRemove={questions.length > 1}
                  uploadingImage={uploadingImage}
                  onUpdate={(field, value) => updateQuestion(index, field, value)}
                  onRemove={() => removeQuestion(index)}
                  onImageUpload={(field, file) => handleImageUpload(index, field, file)}
                />
              ))}

              <Button variant="outline" className="w-full" onClick={addQuestion}>
                <Plus className="mr-2 h-4 w-4" /> Add Another Question
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}