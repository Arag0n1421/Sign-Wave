# Sign Wave 4-Person Parallel Plan

## Merge Strategy

Start from the scaffold commit on `main`. Each person creates one branch and only edits their owned files. Open pull requests into `main`, run `npm run test` and `npm run build`, then merge in this order:

1. `feature/recognition-engine`
2. `feature/chat-llm-tts`
3. `feature/ui-learn-mode`
4. `feature/pwa-docs-pitch`

If a conflict appears, prefer the branch owner for the conflicting area.

## Person A: Recognition Engine

Branch: `feature/recognition-engine`

Owned files:

- `components/SignRecognizer.tsx`
- `lib/dtw.ts`
- `lib/templates.ts`
- `public/asl_templates.json`
- `public/lsl_templates_45.json`
- `tests/dtw.test.ts`

Prompt:

```text
You are Codex Agent for Sign Wave. Create branch feature/recognition-engine.
Implement only the recognition slice. Improve MediaPipe HandLandmarker setup, angle-feature extraction, DTW template matching, frame buffering, pause/capture behavior, and confidence output.
Do not edit chat, LLM, PWA, docs, or learn-mode files unless a type contract absolutely requires it.
Replace the placeholder templates with 8 to 12 demo templates recorded or synthetically replayable for the pitch vocabulary.
Add Vitest replay tests for at least 5 signs.
After completion ask: "Next phase? (yes/no)"
```

Definition of done:

- Camera starts reliably in Chrome over HTTPS or localhost.
- A failed camera or model load does not break typed fallback.
- Five replay tests pass.
- Confidence is visible and thresholded conservatively.

## Person B: Chat, LLM, TTS

Branch: `feature/chat-llm-tts`

Owned files:

- `components/ChatInterface.tsx`
- `app/api/llm/route.ts`
- `lib/llm.ts`
- `lib/types.ts` only when needed for note contracts
- `tests/llm.test.ts`

Prompt:

```text
You are Codex Agent for Sign Wave. Create branch feature/chat-llm-tts.
Implement only the bidirectional chat, clinician notes, strict JSON LLM rephraser, deterministic fallback, and Web Speech API TTS slice.
Do not edit recognition, learn mode, PWA, docs, or pitch files unless a type contract absolutely requires it.
Use the existing TriageNotes schema. Do not add diagnosis, treatment advice, or invented symptoms.
Add Vitest tests for gloss-to-note fallback and malformed provider responses.
After completion ask: "Next phase? (yes/no)"
```

Definition of done:

- Patient signed and typed messages create clinician notes.
- Clinician replies appear on the patient side.
- TTS works for the English note in Chrome.
- Missing API key still produces a usable demo.

## Person C: UI and Learn Mode

Branch: `feature/ui-learn-mode`

Owned files:

- `app/page.tsx`
- `app/learn/page.tsx`
- `components/SignWaveApp.tsx`
- `components/LearnMode.tsx`
- `components/DisclaimerBanner.tsx`
- `app/globals.css`

Prompt:

```text
You are Codex Agent for Sign Wave. Create branch feature/ui-learn-mode.
Implement only tablet-friendly visual polish, split-screen layout, Learn ASL mode, flashcards, practice feedback, confidence display styling, and high-contrast accessibility.
Do not edit recognition, LLM route, service worker, docs, or pitch files unless a type contract absolutely requires it.
Keep the first screen as the usable hospital chat experience, not a marketing landing page.
Verify desktop and mobile layouts with screenshots.
After completion ask: "Next phase? (yes/no)"
```

Definition of done:

- Main page works at tablet width.
- Learn mode reuses the recognizer contract.
- Text does not overlap or overflow.
- Safety banner is always visible near the workflow.

## Person D: PWA, Docs, Pitch

Branch: `feature/pwa-docs-pitch`

Owned files:

- `app/manifest.ts`
- `public/sw.js`
- `public/offline.html`
- `public/icon.svg`
- `README.md`
- `docs/*`
- `pitch/*`
- `scripts/*`

Prompt:

```text
You are Codex Agent for Sign Wave. Create branch feature/pwa-docs-pitch.
Implement only PWA shell support, app manifest, explicit service worker, README, contribution guide, safety disclaimer language, and 3-slide pitch content.
Do not edit recognition, chat UI, LLM, or learn mode code unless a type contract absolutely requires it.
Document the WLASL licensing risk and the recommended demo-template approach.
After completion ask: "Next phase? (yes/no)"
```

Definition of done:

- Manifest exists and references an icon.
- Production build registers a service worker.
- README explains setup, scope, risks, and branch ownership.
- Pitch deck outline supports a 60 second demo.

## Build Red Flags To Avoid

- Do not claim broad ASL recognition. Say "demo vocabulary".
- Do not ship WLASL-derived data without reviewing C-UDA terms.
- Do not depend on the LLM for core demo flow.
- Do not make clinician notes sound like diagnosis.
- Do not bury typed fallback. It is the reliability path.
- Do not let all branches edit the same large app component.
