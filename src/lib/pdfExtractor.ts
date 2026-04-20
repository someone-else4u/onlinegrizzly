import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - vite worker import
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { supabase } from "@/integrations/supabase/client";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ExtractedQuestion {
  question_text: string;
  question_image_url: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_a_image: string | null;
  option_b_image: string | null;
  option_c_image: string | null;
  option_d_image: string | null;
  correct_option: "A" | "B" | "C" | "D" | null;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  chapter: string;
  source_exam: string;
  source_year: number | null;
  source_question_number: string;
  marks: number | null;
  negative_marks: number | null;
  has_options: boolean;
}

type Bbox = [number, number, number, number] | undefined;

const RENDER_SCALE = 2; // higher = better OCR/cropping quality

async function cropAndUpload(
  pageCanvas: HTMLCanvasElement,
  bbox: Bbox,
  uploadPath: string
): Promise<string | null> {
  if (!bbox || bbox.length !== 4) return null;
  const [x, y, w, h] = bbox;
  if (w <= 0 || h <= 0) return null;
  const W = pageCanvas.width;
  const H = pageCanvas.height;
  // Clamp to page bounds
  const cx = Math.max(0, Math.min(1, x)) * W;
  const cy = Math.max(0, Math.min(1, y)) * H;
  const cw = Math.max(1, Math.min(W - cx, w * W));
  const ch = Math.max(1, Math.min(H - cy, h * H));

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = Math.round(cw);
  cropCanvas.height = Math.round(ch);
  const ctx = cropCanvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(pageCanvas, cx, cy, cw, ch, 0, 0, cropCanvas.width, cropCanvas.height);

  const blob: Blob | null = await new Promise((res) => cropCanvas.toBlob(res, "image/png", 0.92));
  if (!blob) return null;
  const fileName = `${uploadPath}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const { error } = await supabase.storage.from("question-images").upload(fileName, blob, {
    contentType: "image/png",
  });
  if (error) {
    console.error("crop upload error:", error);
    return null;
  }
  const { data } = supabase.storage.from("question-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function extractQuestionsFromPdf(
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<ExtractedQuestion[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const total = pdf.numPages;
  const all: ExtractedQuestion[] = [];

  for (let pageNum = 1; pageNum <= total; pageNum++) {
    onProgress?.(pageNum, total);
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport } as any).promise;

    // Smaller image for AI to keep payload reasonable
    const aiCanvas = document.createElement("canvas");
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(canvas.width, canvas.height));
    aiCanvas.width = Math.round(canvas.width * scale);
    aiCanvas.height = Math.round(canvas.height * scale);
    const actx = aiCanvas.getContext("2d");
    if (!actx) continue;
    actx.drawImage(canvas, 0, 0, aiCanvas.width, aiCanvas.height);
    const dataUrl = aiCanvas.toDataURL("image/jpeg", 0.85);

    const { data, error } = await supabase.functions.invoke("parse-pdf-page", {
      body: { imageBase64: dataUrl, pageNumber: pageNum },
    });
    if (error) {
      console.error("parse-pdf-page error:", error);
      continue;
    }
    const questions = (data?.questions ?? []) as any[];

    for (const q of questions) {
      const has_options = !!(q.option_a || q.option_b || q.option_c || q.option_d);
      const pathBase = `pdf-extract/p${pageNum}`;

      const [qImg, aImg, bImg, cImg, dImg] = await Promise.all([
        cropAndUpload(canvas, q.question_image_bbox, `${pathBase}/q`),
        cropAndUpload(canvas, q.option_a_bbox, `${pathBase}/a`),
        cropAndUpload(canvas, q.option_b_bbox, `${pathBase}/b`),
        cropAndUpload(canvas, q.option_c_bbox, `${pathBase}/c`),
        cropAndUpload(canvas, q.option_d_bbox, `${pathBase}/d`),
      ]);

      all.push({
        question_text: q.question_text || "",
        question_image_url: qImg,
        option_a: q.option_a || "",
        option_b: q.option_b || "",
        option_c: q.option_c || "",
        option_d: q.option_d || "",
        option_a_image: aImg,
        option_b_image: bImg,
        option_c_image: cImg,
        option_d_image: dImg,
        correct_option: ["A", "B", "C", "D"].includes(q.correct_option) ? q.correct_option : null,
        subject: q.subject || "physics",
        difficulty: q.difficulty || "medium",
        topic: q.topic || "",
        chapter: q.chapter || "",
        source_exam: q.source_exam || "",
        source_year: typeof q.source_year === "number" ? q.source_year : null,
        source_question_number: q.question_number || "",
        marks: typeof q.marks === "number" ? q.marks : null,
        negative_marks: typeof q.negative_marks === "number" ? q.negative_marks : null,
        has_options,
      });
    }
  }

  return all;
}
