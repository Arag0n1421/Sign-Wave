# Research Sources and Implementation Notes

Sources checked on 2026-05-09:

- Google MediaPipe Hand Landmarker for Web: `@mediapipe/tasks-vision` supports JavaScript web apps and `detectForVideo` with `runningMode: "VIDEO"`. Source: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- Google HandLandmarker API reference: confirms `createFromOptions`, `detect`, `detectForVideo`, and `HAND_CONNECTIONS`. Source: https://ai.google.dev/edge/api/mediapipe/js/tasks-vision.handlandmarker
- gabguerin MediaPipe plus DTW repo: validates the landmark-angle plus DTW approach, while its own README warns the available dataset is insufficient for strong results. Source: https://github.com/gabguerin/Sign-Language-Recognition--MediaPipe-DTW
- WLASL repository: large ASL word-level research dataset, but licensed under C-UDA with no commercial usage. Source: https://github.com/dxli94/WLASL
- Next.js PWA guide: App Router supports `app/manifest.ts` and explicit service worker implementation. Source: https://nextjs.org/docs/app/guides/progressive-web-apps
- MDN SpeechSynthesis: browser TTS is widely available and works through `window.speechSynthesis`. Source: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
- OpenAI Structured Outputs guide: JSON schema constrained outputs are the right shape for reliable clinician-note responses. Source: https://platform.openai.com/docs/guides/structured-outputs

## Architecture Decisions

1. Use explicit PWA files instead of `next-pwa`.
   Next's current App Router docs make the manifest and service worker path straightforward. A hand-written service worker is easier to reason about during a 24 hour hackathon.

2. Treat WLASL as research inspiration, not bundled production data.
   The starter `public/asl_templates.json` file is now only an A-Z letter registry. Letter examples are recorded locally in the browser.

3. Use a deterministic fallback path.
   The demo must survive missing API keys, model throttling, bad Wi-Fi, or failed JSON parsing.

4. Keep LLM work behind a server route.
   Browser code never receives API keys. The route returns the same typed `TriageNotes` shape whether the provider is OpenAI or fallback.

5. Make the typed patient path first-class.
   Recognition is the differentiator, but typed input is what keeps the live demo reliable.

6. Show the recognizer's hand-tracking view in real time.
   The user and judges should see the same hand landmarks that the engine sees. MediaPipe returns 21 landmarks per detected hand, handedness, and world landmarks, so the browser UI should render a canvas skeleton over the mirrored webcam feed.

7. Use DTW as the MVP recognizer, not the final recognition strategy.
   The gabguerin repo is directly relevant because it uses MediaPipe hand landmarks, normalized hand-connection angles, DTW over time, and confidence/voting. It is best for controlled templates and a curated demo set. For broader ASL, plan a later trainable model such as LSTM/temporal CNN/Transformer over landmark sequences.

8. Treat "general ASL translator" as a staged roadmap.
   The current shippable version is ASL letters only. Open-ended ASL requires more data, signer variation, body/face context, and grammar handling.

## Additional Repos Reviewed

- `gabguerin/Sign-Language-Recognition--MediaPipe-DTW`: best architecture reference for the current browser DTW recognizer. The repo itself warns that its small dataset is insufficient for strong results.
- `shubhammore1251/Sign-Language-Recognition-Using-Mediapipe-and-React`: useful React/MediaPipe learning-app reference, with a claimed scope of 26 ASL alphabets and 16 common words.
- `kaushiks-info/Real-Time-ASL-Gesture-Recognition`: useful reminder that teams often need to collect and train their own landmark data because accuracy depends heavily on hand shape, lighting, and camera setup.
- `metehanozdeniz/sign-language-recognition`: useful reference for a later word-level model pipeline using MediaPipe landmarks, sliding windows, LSTM prediction, and top-3 confidence display.

## Dataset Decision

The Kaggle WLASL processed dataset is not bundled. It is word-level, large, and not the right source for ASL alphabet templates. For this PWA, letter examples should be recorded as MediaPipe landmark/angle sequences in the browser and stored locally or exported as compact JSON.

## Testing Direction

- Unit test feature extraction and DTW matching with deterministic landmark/feature fixtures.
- Replay test at least five signs from saved landmark sequences.
- Reject unknown/random sequences below threshold.
- Browser test the camera denied state, model loading state, no-hands state, and normal recognition state.
- Confirm that generated clinician notes never diagnose and always preserve uncertainty.
