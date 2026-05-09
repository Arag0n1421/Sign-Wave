export type SupportedLanguage = "en" | "lv" | "ru" | "sv";

export type MessageRole = "patient" | "clinician";

export type MessageSource = "typed" | "signed" | "clinician";

export type TriageNotes = {
  inputGloss: string;
  clinicianNotes: Record<SupportedLanguage, string>;
  uncertainty: "low" | "medium" | "high";
  safetyFlags: string[];
  suggestedClarifyingQuestions: string[];
};

export type ChatMessage = {
  id: string;
  role: MessageRole;
  source: MessageSource;
  text: string;
  gloss?: string;
  notes?: TriageNotes;
  createdAt: string;
};

export type Landmark = {
  x: number;
  y: number;
  z?: number;
};

export type SignTemplate = {
  id: string;
  gloss: string;
  label: string;
  tags: string[];
  examples: number[][][];
};

export type RecognitionCandidate = {
  gloss: string;
  label: string;
  confidence: number;
  source: "dtw-template" | "manual-demo" | "typed" | "future-model";
  startedAt: number;
  endedAt: number;
  landmarksQuality: "good" | "partial" | "lost";
};

export type MatchResult = {
  template: SignTemplate;
  gloss: string;
  distance: number;
  confidence: number;
};
