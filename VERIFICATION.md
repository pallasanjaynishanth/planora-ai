# Planora AI — verification report

Final packaging date: **31 October 2026**. This report records executed checks and concrete limits. No live Firebase project, Gemini response, hosting deployment, complete security audit or WCAG certification is claimed.

## Delivered files

- Project directory: `/workspace/scratch/6c9adc1eabab/planora-ai`
- ZIP: `/workspace/scratch/6c9adc1eabab/planora-ai-starter.zip`
- Archive bytes: `751664`
- Source bytes: `736032` across 75 files, excluding dependencies, Git internals, build outputs, local environment files and test artifacts.
- The ZIP has a single `planora-ai/` root and contains committed source, lockfile, tests, configuration, local SVG artwork and documentation. It uses stored ZIP entries; its source content is well below 10 MB.

## Executed checks

| Check | Result | Command and evidence |
| --- | --- | --- |
| Dependency installation | Passed after recovery | `npm install --offline --ignore-scripts --cache ../npm-cache --no-audit --no-fund` completed using cached registry packages. Initial online installation timed out and a partial dependency tree required recovery. A final clean lockfile install is recorded below. |
| TypeScript | Passed | `npm run typecheck` / `tsc --noEmit`, exit 0 with no diagnostics. Strict and unchecked-index checking enabled. |
| ESLint | Passed | `npm run lint` / `eslint .`, exit 0 with no lint findings. |
| Unit and integration tests | Passed | `npm test` / `vitest run`: **8 test files, 81 tests passed**, no failed or skipped tests. Includes exact currency rounding/validation, dependency graphs, mocked AI success/error/timeout/cancellation cases, input validation, local repository behavior, scenarios/readiness and UUID fallback. |
| Firestore security rules | Passed | `npm run test:rules`: **1 test file, 11 tests passed** against Firestore emulator 1.19.8. Tests cover own access, cross-owner read/list/update/delete rejection, unauthenticated access, invalid data, timestamps/versions and unknown paths. The tests use the real rules engine, not a UI substitute. |
| Playwright browser installation | Failed: environment download | `npx playwright install chromium --only-shell` received empty/truncated browser archives and ended with `End of central directory record signature not found` / download failure. No usable local Chromium was installed. |
| Playwright E2E | Blocked; not passed | `PLAYWRIGHT_BASE_URL=http://terminal.local:4173 npm run test:e2e -- --max-failures=1` stopped at browser launch: executable missing. Runner reported **1 failed, 1 interrupted, 4 not run**; no application assertions completed. Six test instances are defined (three journeys × desktop/mobile). They cover planning, validation, checklist, scenario approval, save/reopen, revision display, JSON download, vendor quotation application and axe scans. |
| Browser and accessibility checks | Partial validation passed | Separate interactive browser checks completed the demo create/change/save/reopen flow. Seven axe scans had **0 violations**, including 390-pixel mobile layouts with no horizontal overflow. See [accessibility evidence](docs/ACCESSIBILITY.md) for incomplete checks and exact scope. These do not turn the Playwright suite into a pass. |
| Production build | Passed | `npm run build`: TypeScript then Vite 8.0.13, exit 0. Firebase and workspace feature chunks load separately. No development accessibility-harness entry is shipped. |
| Bundle size | Passed | `npm run check:size`: **280,328 bytes gzip** for all emitted JavaScript and CSS, below the 600,000-byte gate. This is the sum of independently gzipped files, not a browser network measurement. |
| Source size | Passed | `npm run check:size`: source below 10,000,000 bytes; exact final size above. |
| Secret scan | Passed heuristic | `git add .` then `npm run check:secrets`: no common credential patterns or prohibited tracked filenames found. Checks all 75 final tracked files. Only `.env.example` is included. This cannot prove the absence of every possible secret. |
| Production dependency audit | Passed at time checked | `npm audit --omit=dev --json`: **0 reported vulnerabilities** after updating Zod and the gRPC override. Development dependencies are outside this claim. An advisory scan is not a source-code security audit. |
| Git and ZIP | Passed | Local source committed, final `git status --porcelain` empty. `node scripts/package.mjs ../planora-ai-starter.zip` archives committed source only. Python `zipfile` integrity and entry/content checks verify the archive, exclusions and agreement with committed files. |
| Live Auth / Firestore / Gemini | Not run | No project credentials or provider account supplied. SDK declarations and official documentation were checked; this does not verify project billing, model availability, App Check or production permissions. |
| Deployment | Not run | Hosting configuration and instructions are included. No deployment URL is fabricated. |

The final aggregate `npm run verify` completed successfully. Its unit-test summary was:

```text
Test Files  8 passed (8)
     Tests  81 passed (81)
```

Rules-test output:

```text
Test Files  1 passed (1)
     Tests  11 passed (11)
```

## Environment and reproducibility

The build host used Node **24.22.1**, npm **11.9.0**, and OpenJDK **17.0.20**. Firebase CLI **14.22.0** successfully ran the rules tests, with a warning about future Java requirements. Its `superstatic` dependency advertises Node 18/20/22; use **Node 22 LTS (22.13+) and Java 21**, as documented and configured in CI. The host's npm proxy configuration produced non-fatal warnings. No warning is treated as a completed integration test.

The cached-install recovery used `--ignore-scripts` to avoid unrelated install lifecycle behavior. The Vite build and test tools executed successfully afterward. Users should run ordinary `npm ci` from the lockfile. Browser installation requires access to Playwright's browser CDN and OS dependencies. The GitHub workflow is included but has not been run on GitHub.

Final clean lockfile installation: `npm ci --offline --ignore-scripts --cache ../npm-cache --no-audit --no-fund` — **passed**, 988 packages added in 12 seconds, exit 0. The lockfile installs without regeneration. The CLI/tooling tree emitted deprecation warnings; development dependencies need their own advisory review before release.

## Manual setup and remaining release gates

1. Create/select a Firebase project and web app. Configure authorized origins and Email/Password Authentication. Create Firestore in the intended region.
2. Enable Firebase AI Logic with the Google AI backend; select a supported structured-output Gemini model, configure applicable billing/quotas, and verify a real generation. The example model name is configurable and was documentation-checked, not account-tested.
3. Register reCAPTCHA Enterprise App Check, configure its allowed domains, and enforce it in the relevant Firebase service consoles. Set service quotas, usage monitoring and budget alerts. Client cooldowns do not enforce per-user spending limits.
4. Copy `.env.example` to `.env.local`, replace public Firebase configuration placeholders, set `VITE_APP_MODE=firebase`, and keep emulator/debug flags off for production. Never insert Admin credentials, private keys or a standalone Gemini secret into `VITE_*` variables.
5. Deploy the provided Firestore rules and indexes to the intended project. Validate two real users cannot access each other's records, save confirmation only follows server success, and stale updates are rejected.
6. Install Chromium and run `npm run test:e2e`. Complete the keyboard, screen-reader, zoom, browser and print checks listed in the accessibility report, including vendor edits, exports and revision restoration.
7. Build with final Firebase-mode values, review hosting headers/CSP against actual Auth and App Check domains, deploy deliberately, and perform a live sign-in/generate/save/reopen/delete smoke test with synthetic data. Review account deletion, retention, consent and monitoring before real personal data is collected.

## Known product and security limits

Demo mode is a deterministic, explicitly labeled offline experience; its localStorage is not secure cloud persistence. Firebase mode contains the real SDK integrations and requires configuration. Event records are private to one owner. There is no collaboration, vendor lookup, booking, payment, calendar integration, notification service, JSON import or currency conversion. Vendor information and quotations are supplied by the user.

Scenarios retain existing costs, quotations and completed tasks. They update the event brief and obtain alternatives, but do not silently reprice or replace the narrative and schedule. The UI labels retained narrative after a scenario; users must review availability, guest-dependent costs and completed work. Scenario approval and revision restoration preserve earlier snapshots; ordinary edits update the current working snapshot. Histories stop at 30 revisions and saves at 700 KB instead of discarding data. These are operational revisions, not an immutable audit trail.

Firestore rules enforce owner paths, envelope types, event constraints, timestamps, versions and array bounds. They do not iterate arbitrary nested lists to enforce every Zod/business constraint. All application reads are revalidated. A future shared/public workflow or enforceable per-user billing policy needs a trusted backend. See [security model](docs/SECURITY.md).

## Six-criterion Hack2skill readiness assessment

This is a self-assessment against the requested scope, not an official competition score.

| Criterion | Assessment |
| --- | --- |
| Problem fit | Implemented: wedding, birthday, anniversary and community-event planning with budgets, preparation and vendors. |
| Core functionality | Implemented and unit-tested; demo planning/save/scenario flow browser-checked. Full Playwright suite remains blocked. |
| GenAI integration | Real Firebase AI Logic adapter, constrained JSON and validation implemented. Live-project proof is pending. |
| Correctness and security | Deterministic calculations, validation and 11 authorization tests passed. App Check, quotas and live configuration remain release gates. |
| Design and accessibility | Responsive editorial interface; seven axe scans passed. Manual assistive-technology and cross-browser checks remain. |
| Delivery and presentation | Complete source ZIP, lockfile, README, CI and verification evidence supplied. Suitable for a configured demo; production readiness and official judging outcomes are not claimed. |
