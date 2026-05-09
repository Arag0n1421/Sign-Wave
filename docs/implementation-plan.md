# Sign Wave Implementation Plan

This version of Sign Wave is focused on **basic ASL letters only**. The old multi-branch plan has been removed. The active branches are:

- `main`: app scaffold, ASL letter recognizer, PWA shell, docs.
- `feature/chat-llm-phrase-builder`: phrase-builder and LLM work.

## Recognition Scope

The recognizer is not trying to cover complete ASL right now. It is scoped to ASL alphabet letters:

- Static letters: `A` through `I`, `K` through `Y`.
- Motion letters: `J` and `Z`, using short frame sequences.

The app uses the architecture from `gabguerin/Sign-Language-Recognition--MediaPipe-DTW`:

1. Detect hands with MediaPipe HandLandmarker.
2. Convert each hand into connection vectors.
3. Build pairwise angle features from those vectors.
4. Store a short time sequence for the current sign.
5. Compare the live sequence to reference templates with DTW.
6. Return a match only when confidence is high enough.

## Dataset Decision

The Kaggle WLASL processed dataset is not included in this app. It is a word-level ASL video dataset, not an ASL alphabet dataset, and it is too large to ship inside a PWA. For the current letters-only build, the app should use local landmark templates recorded from the actual camera and lighting used in the demo.

The current `public/asl_templates.json` file contains only the A-Z registry. Its examples are intentionally empty. Real examples are recorded in the browser and stored in `localStorage` under:

```text
sign-wave-asl-letter-templates-v1
```

This keeps the PWA lightweight and avoids committing raw videos or questionable derived dataset files.

## How To Train Letters In The App

1. Start the camera.
2. Select the training letter.
3. Hold or move the ASL letter in front of the camera.
4. Wait until the frame counter has at least 8 frames.
5. Click `Save template`.
6. Repeat 5 to 10 times per letter.
7. Click `Capture letter` to test DTW matching.

For best results:

- Keep the same camera and lighting as the demo.
- Record each letter from the same distance.
- Keep one signer for the MVP.
- Record `J` and `Z` with their motion, not a static hand shape.

## Why This Is Better Than Shipping WLASL

WLASL is useful for future word-level research, but it does not solve alphabet recognition directly. Shipping 5+ GB of videos in a PWA is also not viable. For a hackathon, a recorded landmark template pack is smaller, faster, and easier to explain.

## Next Work

On `main`:

- Improve the ASL letter training UI.
- Add import/export for local letter templates as JSON.
- Add replay tests with recorded letter template fixtures.
- Add clearer low-confidence messaging.

On `feature/chat-llm-phrase-builder`:

- Convert committed letters into a fingerspelled phrase buffer.
- Add delete, space, clear, and send controls.
- Send confirmed text to the LLM route.
- Keep deterministic fallback when no API key is configured.

## Tests Needed

- DTW identical sequence test.
- DTW timing variation test.
- Unknown sequence rejection test.
- Hand feature vector length test.
- Browser test: camera denial.
- Browser test: save template then capture same letter.
- Browser test: clear local templates.

## Removed Scope

- Medical vocabulary recognition.
- General ASL word-level recognition.
- WLASL-derived templates in the PWA.
- Extra feature branches for recognition/UI/PWA/docs.
