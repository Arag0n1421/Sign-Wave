# Sign Wave Three-Slide Pitch

## Slide 1: Problem

ER intake is stressful, noisy, and time-sensitive. Deaf and hard-of-hearing patients may need to communicate symptoms before an interpreter is available.

Demo line: "Sign Wave gives the patient and clinician a shared tablet channel in the first minutes of intake."

## Slide 2: MVP

- Patient signs a tiny ASL demo vocabulary or types.
- MediaPipe landmarks plus DTW produce a gloss.
- Structured LLM route creates clinician-readable notes in English, Latvian, Russian, and Swedish.
- Clinician can speak the note aloud and type back to the patient.

Demo line: "Recognition is assistive, typed fallback is always available, and every note is confirm-before-use."

## Slide 3: Why Now

- Browser camera APIs and MediaPipe make local landmark extraction practical.
- Structured LLM output makes the translation layer testable.
- Community template uploads can grow language coverage after the hackathon.

Close: "Built on ASL demo templates today. Designed so contributors can add LSL, SSL, and other local sign-language templates tomorrow."
