import { Trash2, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionForm } from "@/lib/testQuestionForm";
import { SUBJECTS } from "@/lib/testQuestionForm";

interface TestQuestionCardProps {
  question: QuestionForm;
  index: number;
  canRemove: boolean;
  uploadingImage: string | null;
  onUpdate: <K extends keyof QuestionForm>(field: K, value: QuestionForm[K]) => void;
  onRemove: () => void;
  onImageUpload: (field: keyof QuestionForm, file: File) => void;
}

function ImageUploadButton({
  currentUrl,
  field,
  label,
  onClear,
  onImageUpload,
  uploading,
}: {
  currentUrl: string | null;
  field: keyof QuestionForm;
  label: string;
  onClear: () => void;
  onImageUpload: (field: keyof QuestionForm, file: File) => void;
  uploading: boolean;
}) {
  return currentUrl ? (
    <div className="relative group">
      <img src={currentUrl} alt={`${label} preview`} className="h-20 w-full rounded-md border border-border object-cover" />
      <button
        type="button"
        onClick={onClear}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  ) : (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground transition-colors hover:bg-muted">
      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImageUpload(field, file);
          event.target.value = "";
        }}
      />
    </label>
  );
}

export function TestQuestionCard({
  question,
  index,
  canRemove,
  uploadingImage,
  onUpdate,
  onRemove,
  onImageUpload,
}: TestQuestionCardProps) {
  const optionKeys = ["a", "b", "c", "d"] as const;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-medium text-foreground">Question {index + 1}</h3>
        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={onRemove} disabled={!canRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Subject *</label>
            <select
              value={question.subject}
              onChange={(event) => onUpdate("subject", event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject.charAt(0).toUpperCase() + subject.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Difficulty</label>
            <select
              value={question.difficulty}
              onChange={(event) => onUpdate("difficulty", event.target.value as QuestionForm["difficulty"])}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Topic</label>
            <Input value={question.topic} placeholder="e.g., Kinematics" onChange={(event) => onUpdate("topic", event.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Marks (+)</label>
            <Input type="number" step="0.01" min={0} value={question.marks} onChange={(event) => onUpdate("marks", parseFloat(event.target.value) || 0)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Negative Marks (-)</label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={question.negative_marks}
              onChange={(event) => onUpdate("negative_marks", parseFloat(event.target.value) || 0)}
            />
          </div>
          <div className="flex items-end">
            <label className="flex h-10 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={question.has_options}
                onChange={(event) => onUpdate("has_options", event.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm font-medium text-foreground">Has MCQ options</span>
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Chapter</label>
            <Input value={question.chapter} placeholder="e.g., Electrostatics" onChange={(event) => onUpdate("chapter", event.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Source Exam</label>
            <Input value={question.source_exam} placeholder="e.g., JEE Advanced" onChange={(event) => onUpdate("source_exam", event.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Year</label>
            <Input
              type="number"
              value={question.source_year ?? ""}
              placeholder="e.g., 2021"
              onChange={(event) => onUpdate("source_year", event.target.value ? parseInt(event.target.value, 10) : null)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Original Q No.</label>
            <Input
              value={question.source_question_number}
              placeholder="e.g., 17"
              onChange={(event) => onUpdate("source_question_number", event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Question Text</label>
          <Textarea
            className="min-h-[96px] font-mono"
            placeholder={'Enter your question. For math, use LaTeX: inline $E=mc^2$ or block $$\\int_0^1 x\\,dx$$'}
            value={question.question_text}
            onChange={(event) => onUpdate("question_text", event.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Use <code className="rounded bg-muted px-1">$ ... $</code> for inline math and <code className="rounded bg-muted px-1">$$ ... $$</code> for block math.
          </p>
          <div className="mt-2">
            <ImageUploadButton
              currentUrl={question.question_image_url}
              field="question_image_url"
              label="Upload question image"
              onClear={() => onUpdate("question_image_url", null)}
              onImageUpload={onImageUpload}
              uploading={uploadingImage === `${index}-question_image_url`}
            />
          </div>
        </div>

        {question.has_options ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {optionKeys.map((option) => {
                const optionField = `option_${option}` as keyof QuestionForm;
                const optionImageField = `option_${option}_image` as keyof QuestionForm;

                return (
                  <div key={option}>
                    <label className="mb-2 block text-sm font-medium text-foreground">Option {option.toUpperCase()}</label>
                    <Input
                      className="mb-2 font-mono text-xs"
                      value={(question[optionField] as string) ?? ""}
                      placeholder={`Option ${option.toUpperCase()} (text or LaTeX)`}
                      onChange={(event) => onUpdate(optionField, event.target.value as QuestionForm[typeof optionField])}
                    />
                    <ImageUploadButton
                      currentUrl={(question[optionImageField] as string | null) ?? null}
                      field={optionImageField}
                      label={`Upload option ${option.toUpperCase()} image`}
                      onClear={() => onUpdate(optionImageField, null)}
                      onImageUpload={onImageUpload}
                      uploading={uploadingImage === `${index}-${optionImageField}`}
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Correct Answer <span className="text-muted-foreground">(can be set later)</span>
              </label>
              <select
                value={question.correct_option || ""}
                onChange={(event) => onUpdate("correct_option", (event.target.value || null) as QuestionForm["correct_option"])}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            📝 No-options mode — this question will be shown without MCQ choices.
          </div>
        )}
      </div>
    </div>
  );
}