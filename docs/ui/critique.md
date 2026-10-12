# UI critique and verification

The [interface brief](../design-brief.md) guided the overhaul. The Plan Bar is the one visually prominent instrument; the rest of the product uses calm records, measured type and direct actions. All 15 role-route combinations, including employee and manager notifications, were captured at 390, 768, 1280 and 1536 px in light and dark mode in [`after/`](after/). The earlier interface is in [`before/`](before/).

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
| Manager weight editing initially repeated a large 100% heading above the Plan Bar. | Combined the selected employee and weight controls into one panel. The saved weight appears as a ghost only while edits are pending. |
| A returned employee can have unpublished draft goals that managers cannot see. | The review editor now explains why a partial visible plan cannot be rebalanced and disables its controls until a complete 100% plan is available. |
| Notification rows needed to read clearly without relying on the teal tone. | Each row includes the actor, action, detail, timestamp, and explicit Read or Unread text. The phone tab carries a labelled count. |
| A notification initially used a button to move to another page. | Changed the row to a real link with modifier-click support; the ordinary click records read state before navigating. Added names and autocomplete hints to weight inputs. |
| Saving manager weights moved the edited goals to the front because the manager list was ordered by update time. | Ordered plan goals by creation time for both employee and manager views, so boundaries stay beside the same goals after a save. |
| The thin saved-weight ghost looked like an unlabelled second track. | Added “Last saved weights” and “Unsaved adjustment” labels beside the two layers. |

The screenshots I am least satisfied with are [`entry-light-390.png`](after/entry-light-390.png), because the role chooser needs a scroll on a short phone, and [`admin-reports-dark-390.png`](after/admin-reports-dark-390.png), because the first chart begins below the filter controls. The controls and outcomes remain readable and reachable without horizontal scrolling. A future pass could shorten the public introduction and let a saved report link collapse its active filter panel.

## Accessibility and interaction checks

- `client/scripts/verify-ui.mjs`: 120 screenshots, zero horizontal-overflow findings, and zero serious or critical axe violations across the main routes and both themes.
- `client/scripts/notification-flow.mjs`: manager rebalance, employee notification and persistent read state, check-in update, manager notification, and phone axe checks passed on a disposable database.
- The Plan Bar boundary supports pointer movement and arrow keys in 5% steps. Native buttons also add or remove weight when a plan has an unallocated remainder.
- Radix dialogs and sheets trap focus, close on Escape, restore focus and cover the full viewport. A dirty goal sheet asks before discarding its edits.
- Successful actions use a single toast; field errors remain beside the relevant control. The long-loading state offers Retry after three seconds.
- `npm run test:contrast --workspace client`: all declared text/background pairs meet 4.5:1 and control edges meet 3:1 in both themes.
- `npx impeccable detect client/src`: zero findings after removing the thick accent borders.
- Web Interface Guidelines audit of changed files: checked labelled controls, icon names, keyboard navigation, focus rings, live feedback, URL-backed filters, responsive records, reduced motion and native date/number formatting. Fixed the mobile navigation clipping and the initially unlabelled visual ghost track. No serious issue remains in the changed routes.
- The previous production Lighthouse mobile baseline was `/login` **97 performance, 100 accessibility** and authenticated `/plan` **95 performance, 100 accessibility**. The plan route preloads its code and goal query while session restoration is in flight. The current initial JavaScript is about **89.2 kB gzipped**; the notifications screen is lazy-loaded and Recharts stays in the Reports chunk.

## Atomic manager weight changes

The existing single-goal manager PATCH still rejects a weight change that would leave the plan outside 100%. The new batch weight endpoint checks all proposed changes in one serializable transaction, preserving direct-report scope and the exact total. Submitted and returned goals can move; approved and locked goals stay fixed. The employee receives one grouped notification after a successful save, with before/after weights. Existing API responses were not changed.
