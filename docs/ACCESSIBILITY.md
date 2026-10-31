# Accessibility checks

The browser checks below were executed on 30 October 2026 (UTC) using the development axe harness in `e2e/a11y.html`, axe-core 4.10.3, and WCAG 2 A/AA, 2.1 AA and 2.2 AA tags. These are recorded summaries of the observed results, not a WCAG certification or the output of the blocked Playwright suite.

| View | Viewport width | Violations | Passed rules | Incomplete rules | Horizontal overflow |
| --- | ---: | ---: | ---: | ---: | --- |
| Landing | 1363 px | 0 | 21 | 2 | No |
| Event form with validation error | 1363 px | 0 | 25 | 1 | No |
| Plan overview | 1363 px | 0 | 24 | 0 | No |
| Plan overview | 390 px | 0 | 25 | 1 | No |
| Budget | 390 px | 0 | 25 | 1 | No |
| Timeline | 390 px | 0 | 25 | 1 | No |
| Scenario comparison | 390 px | 0 | 30 | 1 | No |

Small secondary labels initially failed contrast checks. Their foreground colors were darkened, and the scans above passed after that fix. A 390-pixel iframe activates the application's mobile CSS; it is not a physical-device test. The development harness and axe are excluded from the production entry build.

Manual browser observations used synthetic data: “Community garden day”, “Example City”, 60 guests and an INR 120,000 budget. Zero guests produced an accessible validation error. The generated deterministic example showed an exact INR 120,000 planned total including a 12,000 reserve. Completing the first checklist task unlocked its dependent task. Changing to 90 guests and a 60,000 budget retained existing costs and showed a 54,000 shortfall; approval required explicit over-budget acknowledgment. After approval, the plan displayed 90 guests and one revision. Saving produced the explicit device-local success message; reloading and reopening preserved the changed event and save version. An HTTP preview exposed an unavailable `crypto.randomUUID` API; a Web Crypto byte-based fallback was implemented and unit-tested, and generation succeeded afterward.

Remaining manual checks: resolve axe's incomplete checks with human review; keyboard-only navigation and focus restoration across every screen; screen-reader announcements and headings; 200–400% zoom and text spacing; reduced-motion settings; print pagination; Windows high contrast; Safari and Firefox; physical phones and tablets; and Firebase sign-in/error states. Vendor editing, export/download and revision restoration have automated test coverage definitions or application logic, but their complete browser journeys were not verified in this environment. The final small narrative clarification and risk-ID collision fix were compiler/unit-tested after these browser scans; the scans do not claim to cover every final UI state.
