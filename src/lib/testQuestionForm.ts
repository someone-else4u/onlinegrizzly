export const SUBJECTS = ["physics", "chemistry", "mathematics", "biology"] as const;

export type MarkingPattern = "jee_main" | "jee_advanced" | "neet" | "nda" | "custom";

export const MARKING_PRESETS: Record<Exclude<MarkingPattern, "custom">, { marks: number; negative_marks: number; label: string }> = {
  jee_main: { marks: 4, negative_marks: 1, label: "JEE Main (+4 / -1)" },
  jee_advanced: { marks: 4, negative_marks: 2, label: "JEE Advanced (+4 / -2)" },
  neet: { marks: 4, negative_marks: 1, label: "NEET (+4 / -1)" },
  nda: { marks: 2.5, negative_marks: 2.5 / 3, label: "NDA Maths (+2.5 / -0.83)" },
};

export interface QuestionForm {
  id?: string;
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

export const emptyQuestion: QuestionForm = {
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

const hasMeaningfulValue = (value?: string | null) => Boolean(value && value !== "N/A" && value !== "See image");

export const hasOptionsInStoredQuestion = (question: Partial<QuestionForm> & Record<string, unknown>) => {
  return Boolean(
    hasMeaningfulValue(question.option_a as string | null | undefined) ||
    hasMeaningfulValue(question.option_b as string | null | undefined) ||
    hasMeaningfulValue(question.option_c as string | null | undefined) ||
    hasMeaningfulValue(question.option_d as string | null | undefined) ||
    question.option_a_image ||
    question.option_b_image ||
    question.option_c_image ||
    question.option_d_image ||
    question.correct_option
  );
};

export const mergeQuestionDefaults = (
  question: Partial<QuestionForm>,
  markingPattern: MarkingPattern = "custom"
): QuestionForm => {
  const preset = markingPattern === "custom" ? null : MARKING_PRESETS[markingPattern];

  return {
    ...emptyQuestion,
    ...question,
    topic: question.topic || question.chapter || "",
    marks: question.marks ?? preset?.marks ?? emptyQuestion.marks,
    negative_marks: question.negative_marks ?? preset?.negative_marks ?? emptyQuestion.negative_marks,
    source_year: question.source_year ?? null,
    question_image_url: question.question_image_url ?? null,
    option_a_image: question.option_a_image ?? null,
    option_b_image: question.option_b_image ?? null,
    option_c_image: question.option_c_image ?? null,
    option_d_image: question.option_d_image ?? null,
    correct_option: question.correct_option ?? null,
    has_options: question.has_options ?? hasOptionsInStoredQuestion(question),
  };
};

export const normalizeStoredQuestion = (question: Record<string, any>): QuestionForm => {
  const has_options = hasOptionsInStoredQuestion(question);

  return mergeQuestionDefaults({
    id: question.id,
    question_text: question.question_text ?? "",
    question_image_url: question.question_image_url ?? null,
    has_options,
    option_a: has_options && question.option_a !== "N/A" ? question.option_a ?? "" : "",
    option_b: has_options && question.option_b !== "N/A" ? question.option_b ?? "" : "",
    option_c: has_options && question.option_c !== "N/A" ? question.option_c ?? "" : "",
    option_d: has_options && question.option_d !== "N/A" ? question.option_d ?? "" : "",
    option_a_image: question.option_a_image ?? null,
    option_b_image: question.option_b_image ?? null,
    option_c_image: question.option_c_image ?? null,
    option_d_image: question.option_d_image ?? null,
    correct_option: ["A", "B", "C", "D"].includes(question.correct_option) ? question.correct_option : null,
    difficulty: ["easy", "medium", "hard"].includes(question.difficulty) ? question.difficulty : "medium",
    topic: question.topic ?? "",
    chapter: question.chapter ?? "",
    source_exam: question.source_exam ?? "",
    source_year: typeof question.source_year === "number" ? question.source_year : null,
    source_question_number: question.source_question_number ?? "",
    subject: question.subject ?? "physics",
    marks: typeof question.marks === "number" ? question.marks : Number(question.marks ?? emptyQuestion.marks),
    negative_marks:
      typeof question.negative_marks === "number"
        ? question.negative_marks
        : Number(question.negative_marks ?? emptyQuestion.negative_marks),
  });
};

export const toQuestionPayload = (question: QuestionForm, testId: string) => ({
  test_id: testId,
  question_text: question.question_text || "Image Question",
  option_a: question.has_options ? question.option_a || "See image" : "N/A",
  option_b: question.has_options ? question.option_b || "See image" : "N/A",
  option_c: question.has_options ? question.option_c || "See image" : "N/A",
  option_d: question.has_options ? question.option_d || "See image" : "N/A",
  correct_option: question.has_options ? question.correct_option : null,
  difficulty: question.difficulty,
  topic: question.topic || null,
  chapter: question.chapter || null,
  source_exam: question.source_exam || null,
  source_year: question.source_year,
  source_question_number: question.source_question_number || null,
  subject: question.subject,
  marks: question.marks,
  negative_marks: question.negative_marks,
  question_image_url: question.question_image_url,
  option_a_image: question.has_options ? question.option_a_image : null,
  option_b_image: question.has_options ? question.option_b_image : null,
  option_c_image: question.has_options ? question.option_c_image : null,
  option_d_image: question.has_options ? question.option_d_image : null,
});