# Planora AI

**Intelligent Celebration & Event Planner** · React, TypeScript, Firebase and Gemini

Planora turns an event brief into a plan you can actually work with: an integer-currency budget, dependency-aware preparation tasks, vendor questions, risks and reviewable alternatives. The warm ivory, forest-green interface includes a landing page, planning workspace, accessible forms, mobile layouts, JSON export and a print summary. The botanical illustration is local SVG; no image CDN, remote font or tracking script is needed for demo mode.

This is a runnable MVP, not a claim of production certification. Read [VERIFICATION.md](VERIFICATION.md) for **checks actually executed**, environment limits and release gates.

## Start locally

Use **Node.js 22.13 or later in the Node 22 LTS line**, npm, and Git. Node 24 can run the application, but the pinned Firebase CLI has a transitive Node 22 engine recommendation. Java 21 is recommended for emulator tooling. No Gemini key is needed for ordinary tests or the demo.

macOS / Linux:

```bash
unzip planora-ai-starter.zip
cd planora-ai
npm ci
cp .env.example .env.local
npm run dev
```

Windows PowerShell:

```powershell
Expand-Archive .\planora-ai-starter.zip -DestinationPath .\planora-source
Set-Location .\planora-source\planora-ai
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open the URL Vite prints. The default `VITE_APP_MODE=demo` runs without Firebase setup. Click **Plan your occasion**, enter details, and create a deterministic example, or choose **Explore a sample**. Edit the budget, complete prerequisites, enter your own vendor details, compare a what-if, approve it, and save. Demo saves are localStorage on that browser and origin. They are **not authenticated, encrypted storage or cloud saves**. Avoid real sensitive details on shared devices. JSON export provides a portable backup; clearing browser data deletes local demo plans.

The ZIP contains a normal source tree and a valid npm lockfile. It excludes `node_modules`, builds, caches, `.git`, credentials and test screenshots. Run `git init` if starting a new repository from the ZIP.

## What works

- Four occasion types, date/location/guest/currency/budget inputs, themes, cultural preferences, priorities, accessibility and dietary considerations. Dates are local-calendar dates, never ambiguous timestamps.
- Firebase AI Logic through `firebase/ai`, the Google AI backend and an environment-selected Gemini model. Structured schema output is revalidated with Zod and business rules.
- INR, USD, EUR, GBP and JPY. All stored costs are integer minor units. Decimal entry rounds half-up; yen uses zero decimal places. No exchange-rate conversion.
- Budget category totals, contingency reserved from the total cap, remaining balance, over-budget warnings, quoted/confirmed subtotals and per-guest estimates. User edits may exceed the cap; the app exposes that shortfall instead of silently changing costs.
- Stable task ordering, invalid-reference/cycle/deadline checks, overdue warnings and prerequisite-aware completion. Edit dependencies in a task's disclosure panel.
- Suggested vendor categories and questions, user-entered contact details, quotes, booking status and cancellation notes. Applying a quote explicitly **replaces its linked category**, so aggregate all related fees first.
- Deterministic scenario consequences plus Gemini alternatives in Firebase mode. Existing allocations, actual quotes and completed tasks remain; increased guests never automatically become affordable. Over-budget proposals need explicit acknowledgment and remain flagged after approval.
- Owner-private Firebase saves, bounded/paginated reads, stale-write rejection, full-plan deletion, revision restoration, JSON export and print summary. Saves report success only after the storage operation resolves.

## Architecture and data flow

```text
EventForm → Zod event validation → AI gateway → Firebase AI Logic / Gemini
                                        ↓
                         JSON + schema + semantic validation
                                        ↓
               React workspace ↔ pure budget / task / readiness engines
                                        ↓
              repository → owner-scoped Firestore transaction
```

The above arrows describe data flow; there is no server proxy hosted by this repository. The Firebase AI Logic service provides the provider gateway. The browser contains Firebase public web configuration, not a private Gemini credential.

| Location | Responsibility |
| --- | --- |
| `src/schemas/` | Bounded event, model response, saved-plan and revision schemas |
| `src/features/budget/engine.ts` | Integer money arithmetic and explicit allocation changes |
| `src/features/timeline/engine.ts` | Graph ordering, deadlines and completion rules |
| `src/features/events/readiness.ts` | Explainable readiness calculation |
| `src/features/scenarios/engine.ts` | Deterministic comparisons and retained snapshots |
| `src/lib/ai/` | Schema-constrained generation, timeout, cancellation, request gate |
| `src/lib/firebase/` | Firebase initialization, App Check and owner-scoped repository |
| `src/services/` | Demo data, persistence interface and semantic validation |
| `src/features/*/*Panel.tsx` | Lazy-loaded workspace sections |
| `tests/rules/`, `e2e/`, `src/**/*.test.*` | Emulator, browser, unit and integration tests |

A Firestore document lives at `users/{uid}/events/{uuid}` and has `ownerId`, `schemaVersion`, `version`, `workspace`, `createdAt` and `updatedAt`. `workspace` includes the current snapshot and up to 30 previous scenario/restore snapshots. Transactions check the expected version before replacement. Revisions are embedded so deletion removes them atomically with the event; there are no orphaned subcollections. The app rejects rather than truncates histories at 30 revisions or payloads above 700 KB. Ordinary task, risk, budget and vendor edits update the current working snapshot; **scenario application and restoration** create historical snapshots. Save persists all of them together.

Firestore listing reads 25 documents per page, with server timestamp + document-ID pagination. There are no background snapshot listeners or automatic writes on keystrokes. Firebase uses in-memory Firestore caching and session-based Auth persistence. SDKs and nonessential panels load dynamically. The demo repository validates stored data and surfaces corruption or quota errors without resetting it.

## Configure Firebase and Gemini

1. Create a Firebase project and register a web app. Copy the web configuration to `.env.local`. Enable Cloud Firestore in the region you select; use locked rules, not open test rules. Consider data residency and retention requirements before storing real information.
2. Enable **Authentication → Email/Password**. Add your development and deployed domains under authorized domains. Configure a production password policy, email enumeration protection and account recovery according to your project needs. This MVP provides registration, sign-in and sign-out; password-reset UI and email verification workflows are future enhancements.
3. Open **Firebase AI Logic** in the console. Enable its API and select the **Gemini Developer API / Google AI backend**. Complete the provider's setup and billing/terms steps as required by the chosen model. The app never needs a standalone Gemini secret in an environment variable.
4. Select a supported text model with structured-output support. `.env.example` gives `gemini-3.8-flash` as the documentation-checked starting value; model availability, retirement and quotas change, so verify it in your project. Change `VITE_GEMINI_MODEL` and rebuild when needed. A successful local build does not prove your account can call that model.
5. Register the web app with **App Check using reCAPTCHA Enterprise**. Set the public site key in `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`. Configure real production domains. Initialize App Check before accessing Firebase services; this is implemented in `src/lib/firebase/client.ts`.
6. **Enforce App Check** for Firebase AI Logic and Cloud Firestore in the console; confirm the enforcement status and metrics. Enabling the client SDK alone does not enforce it. Configure Authentication protection where supported by your project/provider. The app does not enable limited-use tokens or claim replay protection; configure and test that separately before enforcing replay protection.
7. For local live-Firebase development only, set `VITE_APPCHECK_DEBUG=true`. Firebase's debug provider displays a registration token in the developer console; register it as a debug token. Treat that token as a secret. Never commit it or publish a debug build. Do not allow localhost as a production reCAPTCHA domain. Production initialization rejects the debug/emulator flags.
8. Set `VITE_APP_MODE=firebase`, restart Vite, sign in, and test generation plus save/reopen on your own configured project. No project was provisioned or live call verified for you by this source archive.

Firebase CLI setup and deployment of rules:

```bash
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
```

`.firebaserc` deliberately defaults to the nonproduction `demo-planora` project. Always supply your real project ID explicitly when deploying. `firestore.indexes.json` disables unnecessary indexing of the large workspace map. The bounded query orders by `updatedAt` and document ID and uses the default single-field index; it does not require an application-specific composite index.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_APP_MODE` | `demo` (default) or `firebase` |
| `VITE_FIREBASE_API_KEY` | Firebase **public web configuration** API key; restrict appropriately in Google Cloud |
| `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` | Registered project and auth domain |
| `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID` | Web app configuration values |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` | Public attestation site key, not its secret counterpart |
| `VITE_GEMINI_MODEL` | Supported Gemini text-model ID |
| `VITE_USE_EMULATORS` | Development-only Auth/Firestore emulators on ports 9099/8080 |
| `VITE_APPCHECK_DEBUG` | Development-only App Check debug provider flag |

**Every `VITE_*` value is compiled into the browser bundle.** Do not put service-account JSON, Firebase Admin credentials, refresh tokens, private reCAPTCHA secrets or standalone Gemini secrets in those variables. Firebase web configuration is public identification, not authorization. Rules and service-side App Check enforcement provide the relevant boundaries. `.env*` is ignored except the placeholder-only example.

## Tests and verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:rules
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
npm run check:size
```

On Windows, `npx playwright install chromium` installs the browser; `--with-deps` is primarily for Linux system packages. Java must be on PATH for Firestore emulator tests. The CLI downloads the emulator on first use and needs internet. `test:rules` starts a **demo** Firestore emulator, runs real authorization assertions against its rules engine, and stops it. Ordinary Vitest tests mock only the Gemini transport and never call a live model. Playwright starts Vite with demo mode and covers desktop and mobile Chromium, including axe accessibility checks.

`PLAYWRIGHT_BASE_URL` can point tests at an already-running **demo** preview. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can point to a compatible preinstalled Chromium binary; omit it for the pinned Playwright browser. Browser/OS combinations other than those recorded in the verification report still need validation.

For an additional browser-driven accessibility check, run the development server and open `/e2e/a11y.html`. Navigate the embedded demo, choose desktop or 390-pixel mobile width, then select **Run accessibility check**. The page reports axe violations, incomplete checks and horizontal overflow. This development harness is not included in the production build. Passing scans are not a WCAG certification; screen-reader, keyboard, zoom and real-device checks remain necessary.

The lockfile pins compatible dependency versions. `playwright-core` is overridden to match the test runner across axe's dependencies; `@grpc/grpc-js` is pinned to a patched version. Review and rerun tests when updating these constraints. Production dependency audit results are recorded in the verification report and do not cover every development dependency.

For manual Auth emulator work:

```bash
npx firebase emulators:start --only auth,firestore --project demo-planora
```

Use development `.env.local` configuration with that project, `VITE_APP_MODE=firebase` and `VITE_USE_EMULATORS=true`. Gemini calls are deliberately rejected in emulator mode; use the demo for offline generation or configure a separate real development Firebase project. There is no pretend AI emulator.

After `git init` and staging the source, run:

```bash
git add .
npm run check:secrets
npm run verify
```

The secret checker reads tracked files using Git and detects common credential patterns. It is a heuristic, not an exhaustive audit. `check:size` checks source under 10 MB and all gzip JS/CSS under 600 KB. `verify` excludes emulator/browser tests because their external runtimes need setup. CI runs them as additional jobs/steps and uses Node 22 and Java 21.

## Build and deploy

```bash
npm run build
npm run preview
npx firebase deploy --only hosting --project YOUR_PROJECT_ID
```

Vite replaces environment variables at **build time**. Set Firebase-mode values in your CI/build environment before building; changing hosting runtime values cannot alter a built SPA. Deploy rules and indexes first. Firebase Hosting rewrites client navigation to `index.html`. Basic response-header templates are included; tailor and test CSP for the actual Firebase Auth and reCAPTCHA domains before production. Do not deploy the demo build as though it were a live Firebase integration.

No deployment URL is included because this deliverable is a local source project, not an executed hosting deployment. To create another source ZIP after your changes, commit them and run:

```bash
node scripts/package.mjs ../planora-ai-starter.zip
```

## Security, privacy and operational limits

Read [docs/SECURITY.md](docs/SECURITY.md) for trust boundaries and residual risks. Never use app UI state as an authorization check. Owner-only rules deny other users and unauthenticated clients, reject unknown top-level keys and enforce event fields, list lengths, timestamps and increasing save versions. Rules cannot iterate through arbitrary arrays to enforce every Zod constraint, semantic graph rule or revision content. All application reads validate again. This is suitable for private per-user records; a future shared/public workflow needs server-validated authoritative data.

The readiness score is defined, not model-generated: required tasks 40 points, important booked vendors 20, budget within cap including reserve 20, valid graph with no high-priority overdue/next-7-day tasks 10, and resolved-risk fraction 10. Empty required/vendor/risk sets receive their full component points. Any over-budget state, invalid graph, critical deadline or unresolved high risk forces **Needs attention**, regardless of the numeric score. A high score is not a guarantee of a successful event.

Model output is always plain React text. The gateway limits requests to 18 KB, output to 100 KB and model tokens to 8,192; validates arrays, strings, dates, references and budget feasibility before initial application; and has a 60-second outer timeout with a 55-second SDK timeout. Cancellation uses the installed SDK's AbortSignal API, but a request already accepted by the provider can still incur cost. A request gate prevents concurrent generations within the app instance and applies a short cooldown. **These client controls are bypassable and do not establish enforceable per-user billing limits.** Use console-enforced App Check, provider quotas, monitoring and budget alerts. A strict per-user spending policy or privileged action would require a trusted backend with durable rate accounting; neither is claimed here.

Event preferences are sent to Gemini in Firebase mode. Vendor contact details, cancellation notes and revision history are excluded from scenario requests. Review provider data-use terms, retention, consent and local requirements before collecting personal information. The app does not log event payloads or auth tokens. Firebase's explicit development App Check debug-token output is the documented exception.

## Troubleshooting

| Symptom | Next step |
| --- | --- |
| Firebase configuration error | Replace every placeholder; restart Vite. Never substitute Admin credentials. |
| Permission denied | Check sign-in, owner path, deployed rules, App Check registration/enforcement and project ID. |
| Model unavailable / 403 / 429 | Check selected model, API setup, App Check, provider quotas and billing; retry only after the cause is addressed. |
| Invalid or over-budget AI response | Nothing was applied. Review inputs or retry after the cooldown. Estimates still need real quotations. |
| Save is pending offline | Firestore transaction needs a server response. Do not treat it as saved; export JSON before closing. |
| Version conflict | Reopen the saved event. Export unsaved work first; the app never silently overwrites another version. |
| Demo quota/corruption | Export any open plan. Free storage or restore externally; the app does not silently reset data. |
| History/save size limit | Export and begin a new event. Existing revisions are not automatically deleted. |
| Emulator cannot start | Check Java, ports, initial download access and `npm run test:rules` output. |
| Playwright browser missing | Run the installation command above or supply a compatible executable path. |
| Dependency engine warning | Use Node 22 LTS. Review dependency advisories before production. |
| Dev source changed but preview stale | Restart the server after `.env` changes; rebuild for production preview. |

## Known scope and next steps

This MVP is single-owner, not collaborative. No vendor marketplace, live pricing, availability lookup, payment processing, calendar integration, notification service, file upload or automatic booking is implemented. JSON export is supported; JSON import is not. A scenario retains completed tasks even if the date or theme changes, so the user must review and reopen any affected work. Initial AI response validation can fail instead of automatically spending more tokens on retries. There is no automatic currency conversion. Thirty revision snapshots and a 700 KB save bound keep Firestore documents manageable. Manual screen-reader/keyboard testing, Safari/Firefox coverage, live-project security configuration, account lifecycle review, provider billing tests and a deployment smoke test remain release work.

Official SDK references and the integration decisions checked for this build are recorded in [docs/API-REFERENCES.md](docs/API-REFERENCES.md).
