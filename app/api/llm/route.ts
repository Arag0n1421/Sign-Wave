import { NextResponse } from "next/server";
import {
  buildTriageSystemPrompt,
  fallbackTriageNotes,
  normalizeGloss,
  triageNotesJsonSchema,
  validateTriageNotes
} from "@/lib/llm";
import type { TriageNotes } from "@/lib/types";

export const runtime = "nodejs";

type LlmRequestBody = {
  gloss?: string;
  text?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LlmRequestBody;
  const gloss = normalizeGloss(body.gloss ?? body.text ?? "");

  if (!gloss) {
    return NextResponse.json(
      { error: "A patient gloss or typed message is required." },
      { status: 400 }
    );
  }

  const fallback = fallbackTriageNotes(gloss);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      notes: fallback,
      provider: "deterministic-fallback"
    });
  }

  try {
    const model = process.env.SIGN_WAVE_LLM_MODEL ?? "gpt-5-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: buildTriageSystemPrompt()
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({ patient_gloss: gloss })
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "sign_wave_triage_notes",
            strict: true,
            schema: triageNotesJsonSchema
          }
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json({
        notes: fallback,
        provider: "deterministic-fallback",
        warning: `LLM request failed with ${response.status}.`
      });
    }

    const data = (await response.json()) as unknown;
    const parsed = parseTriageResponse(data);

    if (!parsed) {
      return NextResponse.json({
        notes: fallback,
        provider: "deterministic-fallback",
        warning: "LLM returned an unexpected shape."
      });
    }

    return NextResponse.json({
      notes: parsed,
      provider: model
    });
  } catch (error) {
    return NextResponse.json({
      notes: fallback,
      provider: "deterministic-fallback",
      warning: error instanceof Error ? error.message : "Unknown LLM failure."
    });
  }
}

function parseTriageResponse(data: unknown): TriageNotes | null {
  const text = extractResponseText(data);

  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    return validateTriageNotes(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function extractResponseText(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  if ("output_text" in data && typeof data.output_text === "string") {
    return data.output_text;
  }

  const output = "output" in data && Array.isArray(data.output) ? data.output : [];

  for (const item of output) {
    if (!item || typeof item !== "object" || !("content" in item)) {
      continue;
    }

    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
        return part.text;
      }
    }
  }

  return null;
}
