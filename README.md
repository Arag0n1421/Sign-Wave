# Sign Wave

Sign Wave is a browser-based tablet MVP for ASL-assisted communication. The current implementation is scoped to basic ASL letter recognition first, with the phrase-builder branch handling how recognized letters become patient text.

The build target is a 24 hour hackathon demo, not a production interpreter or medical device. The MVP deliberately keeps recognition narrow: ASL alphabet, typed fallback, structured multilingual clinician notes, Web Speech API text-to-speech, and a PWA shell.

## Why This Shape

The original idea is strong, but several parts need guardrails:

- WLASL is useful research material, but it is licensed for academic and computational use and is not a clean source for a hospital or commercial demo dataset.
- Open-ended ASL translation from arbitrary webcam input is too broad for 24 hours. The demo should recognize ASL letters first, while making typed correction reliable.
- DTW over MediaPipe hand landmarks is plausible for controlled letters, but it will not be robust across lighting, camera angle, signing speed, or signer variation without recorded templates and testing.
- LLM output must never diagnose. It should rephrase the patient's input, surface uncertainty, and ask clarifying questions.
- Offline PWA support can cache the shell and local templates. It cannot make the LLM work offline.

## MVP Scope

1. Patient starts the camera and sees a real-time hand landmark overlay.
2. User records local ASL letter templates in the browser.
3. Sign recognizer uses MediaPipe hand landmarks plus DTW to match letters.
4. Patient can correct/delete recognized letters or type fallback text.
5. API route converts confirmed text into structured clinician notes in English, Latvian, Russian, and Swedish.
6. Clinician can listen to the English note through browser TTS.
7. Clinician types a reply that appears on the patient side.

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
  implementation-plan.md  Current ASL letters-only build plan
lib/
  dtw.ts                  Feature extraction and DTW matcher
  llm.ts                  Prompt/schema/fallback helpers
  templates.ts            Template loader
  types.ts                Shared domain types
pitch/
  three-slide-outline.md  Demo pitch skeleton
public/
  asl_templates.json      A-Z ASL letter registry; examples are recorded locally
  sw.js                   Explicit service worker
tests/
  dtw.test.ts             Replay-style matcher tests
  llm.test.ts             Fallback note tests
```

## Branches

The repository currently uses only:

- `main`
- `feature/chat-llm-phrase-builder`

See `docs/implementation-plan.md` for the current scope and next build steps.

## Open Decisions Before Heavy Build

Answer these before spending serious time on implementation:

1. Which ASL letters must be demoed live first?
2. Are we allowed to use OpenAI for the submitted demo, or must the app work with a local/no-key fallback only?
3. Will the demo tablet run Chrome on a laptop/tablet over HTTPS? Camera access and service workers are browser-policy sensitive.
4. Which teammate will record the first local template pack?
5. Should local letter templates be exportable/importable as JSON for the team?

## Safety Positioning

Sign Wave is a communication aid prototype. It does not replace certified medical interpreters, clinical judgment, or emergency triage protocols. The demo should state that all recognized signs and generated notes must be confirmed by the patient.
