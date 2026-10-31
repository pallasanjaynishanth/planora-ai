# Official API references

Checked during implementation on 2026-10-29. The installed TypeScript definitions are the final compile-time authority for this lockfile; documentation and models may change later.

- [Structured output](https://firebase.google.com/docs/ai-logic/generate-structured-output): `getAI`, `GoogleAIBackend`, `getGenerativeModel`, `Schema`, JSON response MIME type and response schemas.
- [GenerativeModel reference](https://firebase.google.com/docs/reference/js/ai.generativemodel): `generateContent` returns a response with `.text()`; request-specific options are accepted.
- [SingleRequestOptions](https://firebase.google.com/docs/reference/js/ai.singlerequestoptions): AbortSignal support for request cancellation.
- [RequestOptions](https://firebase.google.com/docs/reference/js/ai.requestoptions): millisecond timeouts; used for the SDK's 55-second limit.
- [Schema helpers](https://firebase.google.com/docs/reference/js/ai.schema): integer fields, enum strings, objects and bounded arrays.
- [Supported model names](https://firebase.google.com/docs/ai-logic/models): environment-configurable model selection, verified again in the user's project before deployment.
- [AI Logic and App Check](https://firebase.google.com/docs/ai-logic/app-check): client attestation and console enforcement; initializing the client is only one part of setup.
- [AI Logic security checklist](https://firebase.google.com/docs/ai-logic/security-checklist): layered abuse prevention and the limits of direct browser access.
- [Getting started](https://firebase.google.com/docs/ai-logic/get-started?platform=web): development debug-provider setup and token registration.

No live Firebase project, billing account or Gemini response was used to produce deterministic test data. The example vendor names in browser tests are visibly fictional test input, not recommendations.
