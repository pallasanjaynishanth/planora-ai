# Security model and release responsibilities

## Assets and boundaries

The assets are event preferences, contact details, vendor notes, the integrity of budgets/tasks/revisions, authentication sessions and provider spending capacity. Relevant attackers include unauthenticated callers, a different signed-in user, an authorized user with a modified client, malicious text embedded in event fields or model output, and a stolen session or debug attestation token.

1. **Browser ↔ Firebase Auth:** The browser is untrusted. Auth verifies account credentials. The app uses session persistence and clears the rendered workspace when user identity changes. Registration requires at least 12 characters in the UI; configure an equivalent Firebase-enforced policy. No claim is made that the UI enforces account security by itself.
2. **Browser ↔ Firestore:** Rules require `request.auth.uid == uid` for the path. Creates bind `ownerId` to that UID; writes cannot change ownership or creation time. Updates increase the version by one and use server timestamps. Transactions detect concurrent writes. Other document paths deny access by default. Lists are scoped to the user's path. Read and delete permissions never depend on model output.
3. **Browser ↔ AI Logic gateway ↔ Gemini:** Firebase public web config identifies the project. App Check enforcement must be configured in the console. No private Gemini key is embedded. User fields are JSON data under a separate system instruction; the model has no tools, authority to book or access to vendor contacts. Output passes strict schemas, size limits, reference checks and deterministic budget/dependency validation.
4. **Local demo:** localStorage has no authorization boundary. It is explicitly labeled and never substituted for a successful Firebase save. Corrupt records and quota exceptions surface as failures. Do not use it as a sensitive-data vault.

## What the rules validate

Owner identity, allowed top-level fields, schema version, monotonic save version, immutable creation time, server update time, event strings/ranges/currency/type, bounded task/budget/vendor/risk arrays, snapshot envelope and revision count. The production SDK validates complete objects after reads and before writes. Rules are tested with the real emulator suite, when available; see the verification report for actual execution status.

Firestore rules do not provide arbitrary loops. This template therefore does **not** assert that every nested task, quote, risk or revision item is semantically valid at the rules boundary. An owner with a custom client can corrupt their own nested data (and even change revision contents while retaining length), but cannot use that to read another user's documents. A later admin dashboard, shared event, automated booking or authoritative reporting feature must add trusted server validation before relying on those contents. Revision history is application-level preservation, not a tamper-evident audit log.

## Controls and residual risks

- React escapes model and user text; there is no `dangerouslySetInnerHTML` or model-generated navigation URL.
- Dates, monetary values and graph references are bounded and parsed. Non-finite numbers, invalid dates, unknown keys and cycles reject the candidate.
- Scenario costs never decrease by assumption. Lost-vendor cancellation fees remain uncertain and existing costs remain until explicitly edited. Applying a proposal is an explicit user action; the previous snapshot is retained.
- App Check mitigates unauthorized-client abuse; it is not perfect bot prevention, user authorization, a private browser key, or a per-user spending ledger. The app's sign-in gate and cooldown can be bypassed by a modified client. Configure service-side quotas and monitor usage. Budget alerts are notifications, not a guaranteed spending cap.
- Request cancellation does not promise to refund an already-submitted request. There are no automatic retries that could silently increase cost.
- The repository never logs inputs or authentication tokens. Development App Check debug provider output must stay private. Do not attach logs containing tokens to bug reports.
- No credentials belong in committed source or `VITE_*`. Public Firebase web API keys should still have appropriate restrictions. The heuristic secret scan cannot detect all secret formats or sensitive free text.
- No CSP is claimed as verified. Add and exercise a deployment-specific policy with the selected Auth and attestation providers. Hosting templates include basic content-type, referrer and permission headers.
- Data residency, legal basis, privacy notices, deletion/retention policy, account recovery, email verification, dependency advisories, backup/restore and incident response remain the deployer's responsibility. Delete removes the current event and its embedded revisions; Firebase backup retention follows the project configuration.

## Before a public release

Use a separate production Firebase project; enable the selected Auth provider and password protections; deploy and test the rules; register real domains; enforce App Check for AI Logic and Firestore; validate billing, provider quotas and error paths; use a supported model; review `npm audit`; test live save/reopen and cross-user denial; perform keyboard/screen-reader and browser checks; configure monitoring without personal payload logging. No live production review, penetration test or compliance certification is asserted by this project.
