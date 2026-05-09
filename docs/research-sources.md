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
   The starter `public/asl_templates.json` file is a demo placeholder. Replace it with templates recorded by the team for the exact pitch vocabulary.

3. Use a deterministic fallback path.
   The demo must survive missing API keys, model throttling, bad Wi-Fi, or failed JSON parsing.

4. Keep LLM work behind a server route.
   Browser code never receives API keys. The route returns the same typed `TriageNotes` shape whether the provider is OpenAI or fallback.

5. Make the typed patient path first-class.
   Recognition is the differentiator, but typed input is what keeps the live demo reliable.
