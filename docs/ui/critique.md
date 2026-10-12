# Screenshot and audit notes

## Phase 0 baseline

Screenshots in `before/` were taken from the running React app backed by the isolated PostgreSQL demo fixture. Each visible role page and sign-in state was captured at 390 px and 1440 px. `checkins-*` uses an approved employee account so the existing quarterly form appears; `employee-*` uses the primary editable demo account. The current app has no role-specific URLs, so manager reporting and every admin workflow appear within one full-page capture for each role.

The least successful baseline images are `before/admin-phone.png` and `before/manager-phone.png`. The admin page is so long that its page overview loses all detail. The employee goal table at 390 px clips the status and actions beyond the viewport. Login leaves a large empty field beside three generic feature cards at desktop width and ships prefilled credentials. These observations changed the brief: admin work becomes deep-linked tabs, manager review becomes master-detail, phone goals become records, and the public entry demonstrates weight rebalancing directly.

The Phase 0 changes add data and documentation only; no client route or UI code has changed. `after/` remains empty until implementation begins. The old screenshot problems are therefore recorded rather than patched in the current UI.

### Automated baseline

The demo seed was run twice with identical fixture totals: 28 users across 5 departments, 92 goals in all 5 states, 96 Q1–Q3 check-ins, 33 audit entries and 4 cycle configs with exactly one active. A production-mode invocation exits before connecting. `npm run lint` and `npm run build` pass. The current initial JS is 192.06 kB gzip; route splitting and keeping Recharts in the reports chunk are Phase 1 and Phase 4 work.

The `@axe-core/playwright` baseline at 390 px found no violations on the employee page. Login has a moderate heading-order issue. Manager has critical missing labels on 60 controls, 3 unnamed selects and one serious scroll-region issue. Admin has 3 critical missing labels, 60 unnamed selects and 35 serious scroll-region issues. The Phase 1–5 rebuild must remove these findings; baseline failures are not accepted as final.

`impeccable detect client/src` found 12 instances of grey text over tinted status/control backgrounds. They are in `AppShell.jsx:54`, `EmployeeGoalsPage.jsx:373,382`, `LandingPage.jsx:63`, and `ManagerApprovalPage.jsx:267,276,285`. This is the untouched baseline. The token and primitive migration will replace the affected components; subsequent phases must leave zero detector findings or name a specific remaining exception here.

The current [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) were checked against the baseline. The implementation audit will use the same rules on changed files. Baseline findings that the brief addresses:

```text
client/src/pages/LoginPage.jsx:6 - credentials prefilled; email and password need autocomplete and names
client/src/pages/LoginPage.jsx:85 - sign-in errors need a live region and error-focused recovery
client/src/components/AppShell.jsx:24 - navigation uses buttons for destinations and includes role-inaccessible sections
client/src/components/AppShell.jsx:64 - icon-only sign-out has a label but needs a visible focus state
client/src/pages/EmployeeGoalsPage.jsx:343 - phone table hides content behind horizontal overflow
client/src/pages/AdminPortalPage.jsx:95 - unlock uses window.prompt instead of an accessible labelled dialog
client/src/components/ReportingDashboard.jsx:83 - filters need visible labels and URL-backed state
```

These references describe the baseline components; the later screenshot audit should use current line numbers after refactoring.
