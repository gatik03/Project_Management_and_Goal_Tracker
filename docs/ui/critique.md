# UI critique and verification

The [interface brief](../design-brief.md) guided the overhaul. The Plan Bar is the one visually prominent instrument; the rest of the product uses calm records, measured type and direct actions. All 13 main routes were captured at 390, 768, 1280 and 1536 px in light and dark mode in [`after/`](after/). The earlier interface is in [`before/`](before/).

## Changes made after looking at the screenshots

| Observation | Change |
| --- | --- |
| The administrator's top navigation clipped at tablet width, and the phone tabs ended with half a label. | Switched to bottom navigation at 900 px and removed the duplicate admin tabs there. The last two admin routes are in the labelled More menu. |
| The phone account control showed only the role, hiding whose workspace was open. | Kept the person's name visible, with a narrow-screen width limit. |
| The plan-rules rail read “Completed 4 of 8 goals,” which confused a rule check with a status. | Replaced status text in that checklist with a decorative check icon; actual goal statuses still use labelled `StatusGlyph`. |
| Audit entries exposed raw UUIDs and JSON without explaining the change. | Show the actor's email and changed fields in a before/after comparison. |
| A first screenshot immediately after sign-in was blank while the lazy route and request were still loading. | Kept a shaped loading state and changed browser checks to wait for the page heading and data before capture. |
| The sheet visibly dimmed the full desktop viewport, but goal creation failed behind it. | Fixed `Input`, `Select` and `Textarea` to forward refs to React Hook Form. The full create, rebalance and submit flow now passes. |
| The old thick side accents were generic decoration. | Reduced the Plan Bar separator to 1 px and removed thick side borders on comments and report summaries. `npx impeccable detect client/src` now reports no findings. |
| Reports gave a percentage with no shared visual language with the plan. | Added a planned tick and actual fill to achievement rows; results above 100% extend beyond the tick. |
| The expanded contrast test found green status text at 4.34:1 on a sunken surface. | Darkened the light OK token to `#176B43`; every tested paper, surface and sunken pair now reaches 4.5:1. |

The screenshots I am least satisfied with are [`entry-light-390.png`](after/entry-light-390.png), because the role chooser needs a scroll on a short phone, and [`admin-reports-dark-390.png`](after/admin-reports-dark-390.png), because the first chart begins below the filter controls. The controls and outcomes remain readable and reachable without horizontal scrolling. A future pass could shorten the public introduction and let a saved report link collapse its active filter panel.

## Accessibility and interaction checks

- `client/scripts/verify-ui.mjs`: 104 screenshots, zero horizontal-overflow findings, and zero serious or critical axe violations across the main routes and both themes.
- The Plan Bar boundary supports pointer movement and arrow keys in 5% steps. Native buttons also add or remove weight when a plan has an unallocated remainder.
- Radix dialogs and sheets trap focus, close on Escape, restore focus and cover the full viewport. A dirty goal sheet asks before discarding its edits.
- Successful actions use a single toast; field errors remain beside the relevant control. The long-loading state offers Retry after three seconds.
- `npm run test:contrast --workspace client`: all declared text/background pairs meet 4.5:1 and control edges meet 3:1 in both themes.
- `npx impeccable detect client/src`: zero findings after removing the thick accent borders.
- Web Interface Guidelines audit of changed files: checked labelled controls, icon names, keyboard navigation, focus rings, live feedback, URL-backed filters, responsive records, reduced motion and native date/number formatting. Fixed the mobile navigation clipping and the initially unlabelled visual ghost track. No serious issue remains in the changed routes.
- Production Lighthouse mobile: `/login` **97 performance, 100 accessibility**; authenticated `/plan` **95 performance, 100 accessibility**. The plan route preloads its code and goal query while session restoration is in flight. Initial JavaScript is **88.4 kB gzipped**; Recharts is isolated to the Reports chunk.

## API constraint reflected in the interface

The manager's existing `PATCH /manager/goals/:goalId` endpoint rejects a weight change unless the employee's entire plan remains exactly 100% after that one request. Two adjacent weight changes therefore cannot be saved sequentially without an invalid intermediate total. The review page shows the last-saved Plan Bar and tells the manager to send a goal back for employee rebalancing, while target edits, approval and send-back remain available. No API contract or business rule was changed to disguise that limitation.
