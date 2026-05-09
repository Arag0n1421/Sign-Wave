import type { TriageNotes } from "./types";

export const triageNotesJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "inputGloss",
    "clinicianNotes",
    "uncertainty",
    "safetyFlags",
    "suggestedClarifyingQuestions"
  ],
  properties: {
    inputGloss: { type: "string" },
    clinicianNotes: {
      type: "object",
      additionalProperties: false,
      required: ["en", "lv", "ru", "sv"],
      properties: {
        en: { type: "string" },
        lv: { type: "string" },
        ru: { type: "string" },
        sv: { type: "string" }
      }
    },
    uncertainty: {
      type: "string",
      enum: ["low", "medium", "high"]
    },
    safetyFlags: {
      type: "array",
      items: { type: "string" }
    },
    suggestedClarifyingQuestions: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" }
    }
  }
} as const;

export function buildTriageSystemPrompt() {
  return [
    "You convert patient sign-language gloss or typed text into clinician-readable intake notes.",
    "Do not diagnose, infer facts, invent measurements, or add symptoms not present in the input.",
    "Preserve uncertainty and use phrases like 'patient reports' or 'patient may be indicating'.",
    "Return only the requested JSON object in English, Latvian, Russian, and Swedish.",
    "If the input is ambiguous, mark uncertainty high and include clarifying questions.",
    "Mention that the note must be confirmed with the patient when recognition confidence is uncertain."
  ].join(" ");
}

export function normalizeGloss(input: string) {
  return input
    .replace(/[^\p{L}\p{N}\s.,:;!?/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

export function fallbackTriageNotes(input: string): TriageNotes {
  const gloss = normalizeGloss(input).toUpperCase();
  const flags = detectSafetyFlags(gloss);
  const base = gloss || "PATIENT MESSAGE UNCLEAR";
  const uncertainty = gloss.includes("UNKNOWN") || gloss.split(" ").length < 2 ? "high" : "medium";

  return {
    inputGloss: base,
    clinicianNotes: {
      en: `Patient reports or signs: ${base}. Confirm exact symptoms, timing, severity, and location with the patient.`,
      lv: `Pacients norada vai zimo: ${base}. Apstipriniet simptomus, sakuma laiku, smagumu un vietu ar pacientu.`,
      ru: `Пациент сообщает или показывает: ${base}. Уточните симптомы, время начала, тяжесть и локализацию у пациента.`,
      sv: `Patienten uppger eller tecknar: ${base}. Bekrafta symtom, starttid, svaarighetsgrad och plats med patienten.`
    },
    uncertainty,
    safetyFlags: flags,
    suggestedClarifyingQuestions: [
      "When did this start?",
      "Where is the pain or problem located?",
      "How severe is it from 0 to 10?",
      "Do you need an interpreter now?"
    ]
  };
}

export function validateTriageNotes(value: unknown): value is TriageNotes {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<TriageNotes>;
  const notes = candidate.clinicianNotes;

  return (
    typeof candidate.inputGloss === "string" &&
    (candidate.uncertainty === "low" ||
      candidate.uncertainty === "medium" ||
      candidate.uncertainty === "high") &&
    Array.isArray(candidate.safetyFlags) &&
    candidate.safetyFlags.every((flag) => typeof flag === "string") &&
    Array.isArray(candidate.suggestedClarifyingQuestions) &&
    candidate.suggestedClarifyingQuestions.every((question) => typeof question === "string") &&
    !!notes &&
    typeof notes.en === "string" &&
    typeof notes.lv === "string" &&
    typeof notes.ru === "string" &&
    typeof notes.sv === "string"
  );
}

function detectSafetyFlags(gloss: string) {
  const flags: string[] = [];
  const emergencyTerms = ["CHEST", "BREATH", "SEVERE", "BLEED", "ALLERGY", "FAINT"];

  for (const term of emergencyTerms) {
    if (gloss.includes(term)) {
      flags.push(`contains_${term.toLowerCase()}`);
    }
  }

  return flags;
}
