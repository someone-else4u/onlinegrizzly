import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Receives a single rendered PDF page (as a base64 data URL) and asks the AI
 * to extract MCQ questions. The AI also returns OPTIONAL bounding-box regions
 * (in 0-1 normalized coords) for any diagrams / tables / figures / complex math
 * that should be cropped from the page image and attached to that question /
 * option as an image.
 *
 * Coordinate system: top-left = (0,0), bottom-right = (1,1).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, pageNumber } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert exam-paper digitizer for JEE/NEET. You receive a rendered PDF page image of a past exam paper. Extract every MCQ question on the page.

For each question:
- Capture the question text. Convert any printed math into LaTeX: inline as $...$ and block as $$...$$.
- Capture options A, B, C, D as text (also LaTeX where applicable).
- If a question or option contains a DIAGRAM, FIGURE, CIRCUIT, GRAPH, CHEMICAL STRUCTURE, TABLE, or COMPLEX MATH that cannot be reliably written as LaTeX, return a normalized bounding box [x, y, w, h] (top-left origin, values 0..1 of the page) so the client can crop that region and attach it as an image.
- Detect subject (physics/chemistry/mathematics/biology), difficulty, topic, and the correct answer if printed (answer key).
- If a question continues onto the next page or is partial, set "partial": true and still return what you have.

Be thorough. Return ALL questions visible on the page.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `This is page ${pageNumber ?? "?"} of a past JEE/NEET exam paper. Extract every question. Use bounding boxes for any visual element that can't be written as plain text or LaTeX.` },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_exam_questions",
            description: "Extract structured MCQ questions from an exam page",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question_number: { type: "string", description: "Original question number from paper, e.g. '12'" },
                      question_text: { type: "string", description: "Question text in plain text + LaTeX" },
                      question_image_bbox: {
                        type: "array", items: { type: "number" },
                        description: "Optional [x,y,w,h] normalized 0..1 region to crop as the question's diagram/figure",
                      },
                      option_a: { type: "string" },
                      option_b: { type: "string" },
                      option_c: { type: "string" },
                      option_d: { type: "string" },
                      option_a_bbox: { type: "array", items: { type: "number" } },
                      option_b_bbox: { type: "array", items: { type: "number" } },
                      option_c_bbox: { type: "array", items: { type: "number" } },
                      option_d_bbox: { type: "array", items: { type: "number" } },
                      correct_option: { type: "string", enum: ["A", "B", "C", "D", ""] },
                      subject: { type: "string", enum: ["physics", "chemistry", "mathematics", "biology"] },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                      topic: { type: "string" },
                      partial: { type: "boolean" },
                    },
                    required: ["question_text"],
                  },
                },
              },
              required: ["questions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_exam_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ questions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-pdf-page error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
