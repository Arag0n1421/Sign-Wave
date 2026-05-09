# Sign Wave

Sign Wave is a browser-based tablet MVP for bidirectional communication during emergency intake when a deaf or hard-of-hearing patient and clinician need a fast shared channel.

The build target is a 24 hour hackathon demo, not a production medical device. The MVP deliberately keeps the risky pieces staged: ASL alphabet/common-sign recognition first, explicit medical phrase recognition next, typed fallback throughout, structured multilingual clinician notes, Web Speech API text-to-speech, and a PWA shell.

## Why This Shape

The original idea is strong, but several parts need guardrails:

- WLASL is useful research material, but it is licensed for academic and computational use and is not a clean source for a hospital or commercial demo dataset.
- Open-ended ASL translation from arbitrary webcam input is too broad for 24 hours. The demo should recognize ASL alphabet/common signs plus explicitly trained medical phrases, while making typed correction reliable.
- DTW over MediaPipe hand landmarks is plausible for controlled signs, but it will not be robust across lighting, camera angle, signing speed, or dialect without recorded templates and testing.
- LLM output must never diagnose. It should rephrase the patient's input, surface uncertainty, and ask clarifying questions.
- Offline PWA support can cache the shell and local templates. It cannot make the LLM work offline.

## MVP Scope

1. Patient starts the camera and sees a real-time hand landmark overlay.
2. Sign recognizer emits ASL letters, common signs, or explicit medical phrase glosses.
3. Patient can correct/delete recognized signs or type fallback text.
4. API route converts the confirmed gloss into structured clinician notes in English, Latvian, Russian, and Swedish.
5. Clinician can listen to the English note through browser TTS.
6. Clinician types a reply that appears on the patient side.
7. Learn mode offers flashcards and simple practice feedback against the same recognizer interface.

## Local Setup

```bash
npm install
npm run dev
```

Create `.env.local` when an LLM key is available:

```bash
OPENAI_API_KEY=sk-...
SIGN_WAVE_LLM_MODEL=gpt-5-mini
```

Without an API key, the app uses deterministic fallback notes so the demo still works.

## Repository Structure

```text
app/
  api/llm/route.ts        Structured LLM route with deterministic fallback
  learn/page.tsx          Learn ASL mode
  layout.tsx              App shell and PWA registration
  manifest.ts             App Router web manifest
  page.tsx                Hospital chat mode
components/
  ChatInterface.tsx       Bidirectional patient/clinician workflow
  DisclaimerBanner.tsx    Medical safety framing
  LearnMode.tsx           Flashcards and practice UI
  SignWaveApp.tsx         Main app composition
  SignRecognizer.tsx      MediaPipe camera loop and DTW matching
docs/
  research-sources.md     Sources and architectural notes
  team-parallel-plan.md   Four-person implementation plan, branch plan, and prompts
lib/
  dtw.ts                  Feature extraction and DTW matcher
  llm.ts                  Prompt/schema/fallback helpers
  templates.ts            Template loader
  types.ts                Shared domain types
pitch/
  three-slide-outline.md  Demo pitch skeleton
public/
  asl_templates.json      Small demo template set
  lsl_templates_45.json   Placeholder for future local languages
  sw.js                   Explicit service worker
tests/
  dtw.test.ts             Replay-style matcher tests
  llm.test.ts             Fallback note tests
```

## Team Branches

The starter scaffold is designed so four people can work in parallel. See `docs/team-parallel-plan.md` for the full implementation plan, exact Codex prompts, tests, merge order, and red flags.

- `feature/recognition-engine`: `components/SignRecognizer.tsx`, `lib/dtw.ts`, `lib/templates.ts`, `public/*templates*.json`, `tests/dtw.test.ts`
- `feature/chat-llm-phrase-builder`: `components/ChatInterface.tsx`, `app/api/llm/route.ts`, `lib/llm.ts`, `lib/phrase/*`, `tests/llm.test.ts`
- `feature/realtime-ui-learn-mode`: `app/page.tsx`, `app/learn/page.tsx`, `components/LearnMode.tsx`, visual polish in `app/globals.css`
- `feature/pwa-docs-demo-pack`: `app/manifest.ts`, `public/sw.js`, `docs/*`, `pitch/*`, README updates

Run `bash scripts/create-feature-branches.sh` after the scaffold commit if the team wants local branches created from `main`.

## Open Decisions Before Heavy Build

Answer these before spending serious time on implementation:

1. Which exact 8 to 12 demo glosses are required for the live pitch?
2. Are we allowed to use OpenAI for the submitted demo, or must the app work with a local/no-key fallback only?
3. Will the demo tablet run Chrome on a laptop/tablet over HTTPS? Camera access and service workers are browser-policy sensitive.
4. Is WLASL only a cited research inspiration, or will you actually redistribute derived templates? The latter needs licensing review.
5. Which language should TTS prioritize for the clinician: English only, or per-note language selection?

## Safety Positioning

Sign Wave is a communication aid prototype. It does not replace certified medical interpreters, clinical judgment, or emergency triage protocols. The demo should state that all recognized signs and generated notes must be confirmed by the patient.
