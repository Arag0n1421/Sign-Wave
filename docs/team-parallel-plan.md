# Sign Wave Implementation Plan

This is the working plan for the next implementation phase. It replaces the earlier thin branch list with the actual product context, technical direction, team ownership, merge strategy, and realistic tests.

## Product Context

Sign Wave is a browser-based communication tablet for a deaf or hard-of-hearing ASL signer and a clinician. The user should see their own webcam feed, see a live hand skeleton/landmark overlay, and see recognition feedback while they sign. The app converts recognized signs into a gloss stream, uses typed fallback when recognition is uncertain, then turns the patient message into clinician-readable notes.

The intended flow is:

1. Patient starts camera.
2. App detects both hands with MediaPipe.
3. App draws the hand landmarks and connections over the video in real time.
4. Recognition engine emits letters, common ASL signs, or explicitly trained medical signs.
5. The app builds a patient utterance/gloss such as `I CHEST PAIN SINCE 2 AM`.
6. The LLM route rewrites the gloss into clear clinician notes while preserving uncertainty.
7. Clinician replies in text; patient sees the reply immediately.

## What Exists Now

The repository already has:

- Next.js 15 app shell with TypeScript and Tailwind.
- Main chat screen and learn mode screen.
- MediaPipe HandLandmarker camera loop scaffold.
- Basic DTW implementation and placeholder ASL templates.
- LLM API route with structured JSON fallback.
- Web Speech API TTS button.
- PWA manifest and explicit service worker.
- Initial tests for DTW and fallback notes.

## What We Are Building Next

The next build must make sign recognition real enough to demo. The goal is not “perfect universal ASL translation.” The goal is a reliable staged recognizer:

- Stage 1: ASL alphabet/fingerspelling subset and a small common-word set.
- Stage 2: Explicit medical phrases such as `CHEST PAIN`, `SINCE 2 AM`, `ALLERGY`, `SHORT BREATH`, `SEVERE`, `HELP`.
- Stage 3: Phrase composer that combines recognized signs, typed corrections, and time/severity widgets into a useful patient statement.
- Stage 4: Better recognition models later, likely LSTM/Transformer over MediaPipe landmark sequences, once real training data exists.

## Architectural Decision

Use a two-track recognizer:

- DTW template matcher for hackathon demo signs and fast user-recorded templates.
- Clean model boundary so a learned classifier can replace or augment DTW later.

This matters because the linked `gabguerin/Sign-Language-Recognition--MediaPipe-DTW` repo is a strong fit for a controlled template recognizer. It extracts MediaPipe landmarks, represents each hand by connection-angle features, compares temporal sequences with DTW, and only emits a sign after voting/confidence thresholding. That same repo warns its dataset is insufficient for good results, which is exactly the trap we need to avoid.

Broad ASL recognition is hard because ASL is not English word-for-word. It uses movement, facial expression, body posture, space, classifiers, grammar, and context. MediaPipe hand landmarks alone are enough for many alphabet/static signs and some controlled word-level signs, but not enough for open-ended clinical ASL translation. Our MVP should say “ASL-assisted patient communication with a growing vocabulary,” not “complete ASL interpreter.”

## Recognition Pipeline

Person A owns the recognizer contract. Everyone else must consume the contract without editing the recognizer internals.

Recognition output should use this shape:

```ts
type RecognitionCandidate = {
  gloss: string;
  label: string;
  confidence: number;
  source: "dtw-template" | "manual-demo" | "typed" | "future-model";
  startedAt: number;
  endedAt: number;
  landmarksQuality: "good" | "partial" | "lost";
};
```

The recognizer should expose:

- `onCandidate(candidate)` for provisional live predictions.
- `onCommit(candidate)` when a sign is accepted.
- `onLandmarks(frame)` for UI overlay/debug display.
- `onError(error)` for camera/model problems.

## Real-Time Hand Display

The camera view must show what the engine sees:

- Mirrored video feed.
- Canvas overlay with 21 landmarks per hand.
- Hand connections drawn in different colors for left and right hand.
- Small status readout: `hands detected`, `tracking quality`, `frames collected`, `top prediction`, `confidence`.
- Optional debug panel with raw gloss candidates.

This is not decoration. It is how judges understand the recognizer is actually processing hand motion.

## Data Plan

Do not bundle WLASL video or derived templates until licensing is reviewed. WLASL is useful for research direction, but it is licensed for academic/computational use and disallows commercial usage.

For this hackathon, create our own demo landmark templates:

- Record 5 to 10 samples per sign using the actual demo camera and lighting.
- Store only normalized landmark/angle sequences, not patient-identifying video.
- Keep each template small enough to load instantly from `public/asl_templates.json`.
- Start with 10 to 16 signs:
  `A`, `B`, `C`, `YES`, `NO`, `HELP`, `PAIN`, `CHEST PAIN`, `SHORT BREATH`, `ALLERGY`, `MEDICINE`, `DIZZY`, `SINCE`, `HOUR`, `SEVERE`, `INTERPRETER`.

The medical examples should be explicit phrases, not inferred diagnosis. For example, if the recognizer sees `CHEST PAIN SINCE 2 AM`, the app may write “Patient reports chest pain since 2:00 a.m.” It must not write “possible heart attack.”

## Four-Person Work Split

Every person starts from `main` after pulling the latest commit. Each person creates their own branch. No one edits another person’s owned files unless they announce it first and the branch owner agrees.

### Branch Commands

Each person runs:

```bash
git checkout main
git pull origin main
git checkout -b feature/<branch-name>
npm install
npm run test
```

Before merging:

```bash
npm run lint
npm run test
npm run build
git status --short
```

Open pull requests into `main`. Merge order:

1. `feature/recognition-engine`
2. `feature/chat-llm-phrase-builder`
3. `feature/realtime-ui-learn-mode`
4. `feature/pwa-docs-demo-pack`

This order keeps the core recognition contract stable before UI and docs finalize.

## Person A: Recognition Engine

Branch: `feature/recognition-engine`

Owned files:

- `components/SignRecognizer.tsx`
- `lib/dtw.ts`
- `lib/templates.ts`
- `lib/types.ts` only for recognition types
- `public/asl_templates.json`
- `tests/dtw.test.ts`
- New files under `lib/recognition/*`
- New files under `tests/recognition/*`

Do not edit:

- `components/ChatInterface.tsx`
- `app/api/llm/route.ts`
- `components/LearnMode.tsx`
- `docs/*`
- `pitch/*`

Paste into Codex:

```text
You are Codex Agent for Sign Wave on branch feature/recognition-engine.

Goal: make the recognition engine real enough for a live ASL demo. Implement MediaPipe HandLandmarker processing, real-time canvas landmark overlay, frame buffering, quality status, DTW template matching, confidence thresholding, and a clean RecognitionCandidate contract.

Use the architecture from docs/team-parallel-plan.md. Use gabguerin/Sign-Language-Recognition--MediaPipe-DTW as the DTW reference: hand landmarks -> normalized connection angle features -> temporal DTW -> confidence/voting threshold. Port the idea, do not copy Python directly.

Build:
- Canvas overlay drawing 21 landmarks and hand connections over the mirrored video.
- Frame buffer with start/stop/pause detection.
- Top-3 candidate display and accepted candidate callback.
- Template JSON format that supports multiple examples per gloss.
- 10 to 16 demo templates. If real recordings are not available, add deterministic synthetic replay fixtures and mark them clearly as fixtures.
- Unit tests for normalization, DTW distance, thresholding, and at least 5 replay signs.

Keep your edits inside your owned files. Do not edit chat, LLM, PWA, docs, or pitch files unless a shared type is unavoidable.

Definition of done:
- Camera failure does not crash the app.
- Overlay clearly shows tracked hands.
- Recognition emits candidate and committed gloss events.
- Tests pass with npm run test.
- npm run build passes.

After completion ask: "Next phase? (yes/no)"
```

Real tests needed:

- `dtwDistance` returns near-zero for identical sequences.
- Mirrored/scale-normalized samples still match their sign.
- Unknown/random sequence is rejected below threshold.
- Five replay fixtures produce expected gloss.
- Missing one hand does not crash feature extraction.

## Person B: Chat, Phrase Builder, LLM, TTS

Branch: `feature/chat-llm-phrase-builder`

Owned files:

- `components/ChatInterface.tsx`
- `app/api/llm/route.ts`
- `lib/llm.ts`
- `lib/types.ts` only for chat/triage types
- `tests/llm.test.ts`
- New files under `lib/phrase/*`
- New files under `tests/phrase/*`

Do not edit:

- `components/SignRecognizer.tsx`
- `lib/dtw.ts`
- `public/asl_templates.json`
- `components/LearnMode.tsx`
- `docs/*`

Paste into Codex:

```text
You are Codex Agent for Sign Wave on branch feature/chat-llm-phrase-builder.

Goal: turn recognizer output and typed fallback into a usable patient statement. Build a phrase composer that accepts RecognitionCandidate events, lets the patient correct/delete words, adds simple time/severity inputs, and sends a confirmed gloss/text to the LLM route.

Build:
- Phrase buffer for committed signs: e.g. CHEST PAIN SINCE 2 AM.
- Patient correction controls: undo last sign, clear phrase, type fallback.
- Medical quick chips for time, severity, location, and interpreter request.
- LLM route prompt that turns confirmed gloss into clinician notes in EN/LV/RU/SV without diagnosing.
- TTS support for clinician note and clinician reply.
- Deterministic fallback when no API key exists.

Respect Person A's RecognitionCandidate contract. If the contract is not merged yet, code against the documented shape and keep adapters small.

Keep your edits inside your owned files. Do not edit recognition engine, learn mode, PWA, docs, or pitch files unless a shared type is unavoidable.

Definition of done:
- A committed sign appears in the phrase buffer.
- The patient can edit the phrase before sending.
- Medical chips can build "I am having chest pain since 2:00 a.m." without relying on model hallucination.
- LLM output preserves uncertainty and never diagnoses.
- npm run test, lint, and build pass.

After completion ask: "Next phase? (yes/no)"
```

Real tests needed:

- Candidate stream builds the expected phrase.
- Undo removes only the last committed sign.
- Medical chips produce deterministic gloss text.
- Fallback notes include all four languages.
- Malformed LLM provider response falls back safely.

## Person C: Real-Time UI and Learn Mode

Branch: `feature/realtime-ui-learn-mode`

Owned files:

- `app/page.tsx`
- `app/learn/page.tsx`
- `components/SignWaveApp.tsx`
- `components/LearnMode.tsx`
- `components/DisclaimerBanner.tsx`
- `app/globals.css`
- New UI-only components under `components/ui/*`

Do not edit:

- `components/SignRecognizer.tsx` internals
- `lib/dtw.ts`
- `app/api/llm/route.ts`
- `public/sw.js`
- `docs/*`

Paste into Codex:

```text
You are Codex Agent for Sign Wave on branch feature/realtime-ui-learn-mode.

Goal: make the app feel like a serious hospital tablet and make recognition state understandable. Build the visible UX around the recognizer contract without changing the recognition internals.

Build:
- Main tablet layout with large patient side and clinician side.
- Recognition status panel: tracking quality, top candidate, accepted gloss, confidence.
- Phrase buffer UI from Person B's contract if available; otherwise add a typed fallback placeholder.
- Learn mode with ASL alphabet/common signs flashcards, practice state, and clear feedback.
- High contrast, large touch targets, no overlapping text on tablet/mobile.
- Empty/loading/error states for camera denied, model loading, no hands detected, low confidence.

Keep your edits inside your owned files. Do not edit recognition engine, LLM route, PWA, docs, or pitch files unless a shared type is unavoidable.

Definition of done:
- The first screen is the actual app, not a landing page.
- A judge can see what the camera recognizes and why a sign was accepted/rejected.
- Learn mode reuses the recognizer API but can run with demo buttons if camera is unavailable.
- npm run lint and npm run build pass.

After completion ask: "Next phase? (yes/no)"
```

Real tests needed:

- Manual browser test at desktop and tablet widths.
- Camera denied state is readable and recoverable.
- Long clinician/patient messages do not overflow.
- Learn mode can move through the deck and score a practice attempt.

## Person D: PWA, Docs, Demo Pack, Merge Captain

Branch: `feature/pwa-docs-demo-pack`

Owned files:

- `README.md`
- `docs/*`
- `pitch/*`
- `app/manifest.ts`
- `public/sw.js`
- `public/offline.html`
- `public/icon.svg`
- `scripts/*`
- New demo checklist files under `demo/*`

Do not edit:

- `components/SignRecognizer.tsx`
- `components/ChatInterface.tsx`
- `lib/dtw.ts`
- `lib/llm.ts`

Paste into Codex:

```text
You are Codex Agent for Sign Wave on branch feature/pwa-docs-demo-pack.

Goal: make the project shippable and presentable. Build the README, demo script, data recording guide, merge checklist, PWA polish, and pitch language. Be honest about limits: ASL-assisted communication, not a certified interpreter.

Build:
- README that explains what Sign Wave is, what is built, what remains, setup, env vars, and demo steps.
- Demo script for a 60 to 90 second pitch: camera overlay -> recognize sign -> build phrase -> clinician note -> doctor reply.
- Template recording guide: lighting, framing, sample count, naming, consent/privacy.
- Merge checklist for all four branches.
- PWA/offline explanation: shell and local templates offline, LLM online unless fallback.
- Safety and licensing notes for WLASL and third-party repos.

Keep your edits inside your owned files. Do not edit recognition, chat, or LLM code unless the merge checklist reveals a broken file reference.

Definition of done:
- A teammate can follow the README from clone to demo.
- Sources are cited.
- The pitch does not overclaim broad ASL accuracy.
- npm run build passes after merge.

After completion ask: "Next phase? (yes/no)"
```

Real tests needed:

- Follow README setup from a clean clone.
- Confirm `/` and `/learn` load.
- Confirm service worker does not break dev mode.
- Confirm demo script matches the actual app.

## Integration Rules

- Shared contracts go in `lib/types.ts`; do not create duplicate incompatible types.
- If a branch needs a cross-team contract, add the smallest type and mention it in the PR.
- Do not rename routes or components owned by another branch.
- Do not run broad formatting across the repo.
- Avoid changing package versions unless your feature requires it.
- Never commit `.env.local`, videos of patients, or raw private recordings.
- PR descriptions must list files changed, tests run, and any contract changes.

## Merge Checklist

Before merging a branch:

- `git status --short` is clean except intentional files.
- `npm run lint` passes.
- `npm run test` passes.
- `npm run build` passes.
- Browser smoke test: `/` loads.
- Browser smoke test: `/learn` loads.
- No references to old project names.
- No API keys or private recordings committed.

After all branches merge:

1. Run `npm install`.
2. Run `npm run lint`.
3. Run `npm run test`.
4. Run `npm run build`.
5. Open the app and run the demo path end to end.
6. Tag the MVP commit or create a release branch.

## What To Improve After The MVP

- Move MediaPipe frame processing into a Web Worker because `detectForVideo` blocks the UI thread.
- Add pose and face landmarks for signs that need body position or facial grammar.
- Replace or augment DTW with a trainable sequence model: LSTM, temporal CNN, or Transformer over landmark sequences.
- Add active learning: save rejected/confirmed landmark sequences with consent and retrain.
- Add signer calibration because hand shape, camera, and lighting affect recognition.
- Add a proper ASL gloss grammar layer rather than word-by-word English.
- Add clinician/patient confirmation flow before notes are accepted.

## Red Flags

- Full general ASL translation is not doable in one hackathon with DTW templates alone.
- ASL alphabet is easier than word-level signs; word-level medical vocabulary needs explicit training examples.
- Medical notes must not infer diagnosis or treatment.
- WLASL should not be redistributed in this project unless licensing is cleared.
- Demos must work when the camera fails, the LLM key is missing, or the model is unsure.

## Sources

- gabguerin MediaPipe + DTW repo: https://github.com/gabguerin/Sign-Language-Recognition--MediaPipe-DTW
- MediaPipe Hand Landmarker Web docs: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- WLASL dataset card: https://huggingface.co/datasets/Voxel51/WLASL
- Real-Time ASL Gesture Recognition repo: https://github.com/kaushiks-info/Real-Time-ASL-Gesture-Recognition
- Sign Language Recognition Using MediaPipe and React repo: https://github.com/shubhammore1251/Sign-Language-Recognition-Using-Mediapipe-and-React
- Word-level MediaPipe/LSTM recognition repo: https://github.com/metehanozdeniz/sign-language-recognition
