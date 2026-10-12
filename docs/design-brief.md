# Goal tracker — interface brief

## Product decision

Goal tracker helps an employee assemble a weighted plan, submit it at exactly 100%, get it reviewed, then compare each quarter's actual result with its plan. The first screen must make the plan's weight and review state legible before it offers analytics. A manager needs to find the next plan that needs a decision. An HR administrator needs to find an exception, its reason and its audit trail. These tasks determine the hierarchy on every route.

The product name is **Goal tracker**. In implementation, one `BRAND` constant supplies the visible name and document title; the static HTML title uses the same spelling before JavaScript loads.

## Visual thesis

Calm, exact and slightly industrial: mineral-grey paper, graphite text and a deep-teal signal. Think of a production tolerance sheet refined into software: measured proportions, readable labels, quiet surfaces and a single instrument-like element. The **Plan Bar** is that element. It represents the complete 100% plan as a continuous strip. Segment widths carry weight, while pattern and glyph carry review state: draft has a dashed outline; submitted has a pale teal tint; approved is solid teal; rework has diagonal hatching; locked is solid graphite with a lock glyph. A screen reader receives the same title, weight and state in text. Teal is reserved for progress, the main action and focus.

One large tabular figure can anchor a workspace when it states the decision to make: `85%` beside “Add 15% to submit”, or the remaining days in the active cycle. Four metrics in four identical cards would bury that decision, so counts sit in sentences, table columns or a compact context rail.

## Content plan

The public entry opens with a live, local-only example of four weighted appliance goals. The visitor moves a boundary and sees the sentence update from “85% weighted” to “100% ready to submit”; a role chooser sits below. There is no invented company photography or decorative dashboard preview.

The employee plan shows one statement in words, the Plan Bar, then four goal records. A record leads with a credible outcome such as “Improve BLDC motor efficiency”; it follows with thrust area, parsed unit and target, weight, deadline and a labelled status glyph. The context rail explains the three submission rules and the current cycle. Check-ins use Q1–Q4 as an actual sequence. The selected goal displays the planned mark, actual fill, the uncapped achievement and the capped progress returned by the engine; an overshoot continues beyond the 100% mark. Manager comments stay with that quarter.

Review opens with the direct-report queue, prioritised by pending plans, then the selected employee's plan. Admin splits people, hierarchy, cycles, unlocks and audit into deep-linkable routes so a 92-goal demo does not become one enormous page. Reports lead with filters and one primary comparison, then smaller charts and a table view. Filters remain in the URL. In every empty state, the next allowed action is named.

## Interaction thesis

Plan Bar boundaries transfer weight between adjacent goals in 5% steps. Pointer dragging and arrow keys make the same move. The combined total stays constant; each goal stays at or above 10%; no plan has more than eight segments. Before the first full plan, the unallocated remainder is a visibly labelled neutral segment. “Save weights” sends the existing goal updates in sequence, reports the exact failed goal and leaves unsaved changes visible. For manager edits, decreases are saved before increases because the current API rejects an intermediate total above 100%. The ghost track shows the last saved values behind the local adjustment. A failed later request keeps the successfully saved values and asks the user to retry the remaining ones; it never claims an all-or-nothing save.

The manager queue supports `j` and `k` outside text fields. “Send back” opens a note-required dialog. Admin unlock requires a reason in the same dialog. Sheets and dialogs trap and restore focus, close on Escape, and preserve dirty form state until discard is confirmed. A successful action uses one toast. Validation sits beside its field. Progress loading first matches the eventual layout; after roughly three seconds it says “The server is waking up” and offers Retry.

Navigation is role-aware at both route and action level. The top rail carries the name, permitted sections, active cycle, theme and account. Phones use bottom tabs and one-column records. A 401 returns to sign-in with the requested path; 403 and 404 have distinct recovery links. The cycle indicator derives from a signed-in read-only active-cycle endpoint if existing data cannot supply it consistently to every role.

## Tokens

All colours are CSS custom properties on `:root` and `[data-theme="dark"]`, exposed through Tailwind. The dark palette is designed as a low-glare instrument surface rather than a numeric inversion. Feature code uses semantic tokens, never raw hex values.

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Paper | `#EFF1EE` | `#111A18` | Workspace canvas |
| Surface | `#FBFBF9` | `#1B2623` | Records, sheets and menus |
| Sunken | `#E6E9E5` | `#26332F` | Secondary tracks and grouped fields |
| Line | `#D4D9D4` | `#64776E` | Quiet dividers; dark line is strong enough for interactive edges |
| Control edge | `#76857E` | `#64776E` | Focusable control boundary, at least 3:1 against the adjacent surface |
| Ink | `#111816` | `#F1F5F1` | Primary text |
| Muted ink | `#55605C` | `#C0CEC8` | Secondary text |
| Signal | `#0C6B5E` | `#72CDB9` | Main action, approved plan, focus |
| OK | `#1F7A4D` | `#82D8A7` | Completed status and explanatory text |
| Warning | `#A8610A` | `#F0BA6E` | Warning icon and surface text |
| Warning ink | `#935309` | `#F0BA6E` | Small warning text on paper |
| Danger | `#B4332E` | `#F39B95` | Error and destructive action |

The baseline contrast calculation gives light ink/surface 17.38:1, muted ink/paper 5.75:1, signal/paper 5.64:1, warning ink/paper 5.31:1, dark ink/surface 14.15:1, muted ink/surface 9.57:1, and dark signal/surface 8.27:1. The light `line` is deliberately a nonessential divider and is not used as the only boundary of an interactive control. The implementation will unit-test every actual text/background pair at 4.5:1 and meaningful UI boundaries at 3:1.

| System | Tokens | Rule |
| --- | --- | --- |
| Display type | Bricolage Grotesque Variable, self-hosted, `swap` | Headings and only the numerals that drive a decision |
| UI type | Public Sans Variable, self-hosted, `swap` | Forms, records and dense data; tabular figures enabled for every number |
| Type scale | 12 / 13 / 14 / 16 / 20 / 28 / 40 / 64 px | Sentence case; ordinary text stays at 14–16 px; line length below 70ch |
| Space | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px | 8 px rhythm, with 4 px for icon and label gaps only |
| Radius | 3 px chip / 6 px control / 10 px panel | Shape communicates role, not a universal card style |
| Depth | 1 px keylines and tonal layers | Shadow only on floating menus, sheets, dialogs and toasts |
| Motion | 500 ms Plan Bar settle, 160–220 ms responses | Ease-out, interruptible, transform/opacity; reduced motion disables ornamental movement |
| Layout | 8/4 desktop grid; one phone column | Workspace left, rule/cycle context right; safe-area aware bottom tabs |

## Alignment rules

The wordmark, page title, Plan Bar, section labels and first record edge share one left alignment. A number aligns on its decimal/right edge only when it is being compared with numbers in the same column. Goal titles stay left aligned and wrap naturally; no justified text. The Plan Bar and its labels share a single measured width. The context rail begins at the title baseline on desktop and follows the main action on phones. Form labels sit above controls; errors sit below their own controls. Tables align text left and numeric measures right. On phones, the record title and status remain visible without sideways scrolling.

## Wireframes

`=` is filled weight, `:` is a draft outline, `/` is rework, `#` is locked, and `|` is a target tick. These are diagram symbols; production uses patterns, labelled glyphs and accessible text.

### Plan, desktop

```text
Goal tracker   Plan   Check-ins                        Q4 ends in 80 days   Theme  Account
┌──────────────────────────────────────────────────────────┬─────────────────────────┐
│ Your plan                                                │ Current cycle           │
│ 4 goals, 85% weighted. Add 15% to submit.               │ Q1──Q2──Q3──[Q4]       │
│ [/////30/////][////25////][:::20:::][::10::][15 open]    │ Plan rules              │
│                                                    85%   │ ✓ 4 of 8 goals          │
│ [New goal]                                [Submit plan]   │ ✓ 10% minimum           │
│                                                          │ ○ Exactly 100%          │
│ Reduce supplier motor defects              Rework needed │ Manager note            │
│ Supplier quality · 12 per thousand · 30% · 80 days left │ Revise baseline…        │
│ ──────────────────────────────────────────────────────── │                         │
│ Raise first-pass fan assembly yield        Rework needed │                         │
└──────────────────────────────────────────────────────────┴─────────────────────────┘
```

### Plan, phone

```text
Goal tracker                              Account
Your plan
4 goals, 85% weighted. Add 15% to submit.
[////30////][///25///][::20::][::10::][15 open]
85% weighted
[New goal]                       [Submit plan]
┌───────────────────────────────────────┐
│ Reduce supplier motor defects         │
│ Rework needed · Supplier quality      │
│ 12 per thousand         30% · 80 days │
└───────────────────────────────────────┘
Current cycle / plan rules
Plan            Check-ins           Account
```

### Review, desktop

```text
Goal tracker   Team   Team check-ins   Reports           Q4 ends in 80 days   Account
┌──────────────────────┬──────────────────────────────────────────────┬─────────────┐
│ Direct reports       │ Aarav Mehta · Rework needed                 │ Cycle       │
│ Search / filter      │ [saved ghost................................] │ Q1 Q2 Q3 Q4 │
│ Aarav    85%  2 open │ [////30////][////25////][:::20:::][::10::]  │ Rules       │
│ Kavya   100%  4 open │                                               │             │
│ Rohan   100%  0 open │ Goal                       Target     Weight │             │
│                      │ Supplier motor defects     12            30% │             │
│                      │ [Save weights] [Approve] [Send back]         │             │
└──────────────────────┴──────────────────────────────────────────────┴─────────────┘
```

### Review, phone

```text
Goal tracker                              Account
Team   Team check-ins   Reports
Direct reports   [Search]
[Aarav Mehta · Rework needed · 85% · 2 open]
Selected: Aarav Mehta
[Saved ghost............................]
[////30////][////25////][:::20:::][::10::]
Supplier motor defects
Target [12]                         30%
[Save weights] [Approve] [Send back]
Team          Check-ins          Reports
```

### Admin, desktop

```text
Goal tracker   People   Hierarchy   Cycles   Unlocks   Audit   Reports    Account
┌──────────────────────────────────────────────────────────┬─────────────────────┐
│ People                                                   │ Cycle / exceptions  │
│ [Name or department] [Role]                 [Add person] │ Q1 Q2 Q3 [Q4]      │
│ Name                 Department      Reports to    Status │ 3 unlocks pending   │
│ Aarav Mehta          Operations      Nisha Rao     Active │                     │
│ Kavya Iyer           Operations      Nisha Rao     Active │                     │
│ Open editor in a right-side sheet                         │                     │
└──────────────────────────────────────────────────────────┴─────────────────────┘
```

### Admin, phone

```text
Goal tracker                              Account
People  Hierarchy  Cycles  Unlocks  Audit
People                         [Filter]
[Aarav Mehta]
Operations · Nisha Rao · Active
[Edit person]
[Kavya Iyer]
Operations · Nisha Rao · Active
People         Cycles           Audit
```

### Reports, desktop

```text
Goal tracker   Team   Reports                   Q4 ends in 80 days   Account
┌──────────────────────────────────────────────────────────┬─────────────────────┐
│ Reports                                                  │ Reading this view   │
│ Department [All]  Status [All]  Quarter [Q3]             │ 24 goals · Q3       │
│ [Q3 ×]                          [Export CSV] [Export XLS]│ Filters in the URL  │
│ Goal state: [Draft ====][Submitted ===][Approved =====]  │                     │
│ [View data table]                                        │                     │
│ Achievement by team                                     │                     │
│ Motor efficiency   [actual========>] | planned           │                     │
│ Service turnaround [actual=====     ] | planned          │                     │
└──────────────────────────────────────────────────────────┴─────────────────────┘
```

### Reports, phone

```text
Goal tracker                              Account
Reports
Department [All]  Status [All]
Quarter [Q3]              [Q3 ×]
[Export CSV] [Export XLS]
Goal state
Draft        =====  5
Submitted    ===    3
Approved     =====  7
[View data table]
Achievement by team
Motor efficiency  actual 108% | plan 100%
[View data table]
Team             Reports          Account
```

## Generic-choice critique and replacement

| Choice I could make for any HR dashboard | Product-specific replacement and reason |
| --- | --- |
| A “Welcome back” landing page | Start with an editable weighted plan; it teaches the core job in one gesture. |
| Three feature cards | One Plan Bar and one plain sentence: plan, approve, track. |
| Four KPI cards | State the actionable total in words; put supporting counts in the context rail. |
| An always-visible department sidebar | A role-aware top rail and phone bottom tabs keep the 8/4 workspace available for goals. |
| A generic progress donut | A 100% segmented strip that encodes each goal's weight and review state. |
| Blue or purple success styling | Mineral neutrals and teal; status also has a glyph and a readable name. |
| A dense all-purpose admin dashboard | Deep links for people, hierarchy, cycles, unlocks and audit, because each is a different task. |
| A pie chart with a legend | A directly labelled stacked state bar using the same visual grammar as the Plan Bar. |
| A table on every viewport | Desktop tables where comparison helps; phone records with title, status and next action visible. |
| Anonymous “Goal 1” placeholder data | BLDC efficiency, service turnaround, channel sell-through and supplier quality with believable units and names. |
| Decorative motion on every card | One 500 ms Plan Bar arrival; all other motion responds to an action. |
| Error and success banners together with toasts | Field-level errors, one success toast, and dialogs only when a decision is hard to undo. |

## Banned-list check

This brief excludes gradient washes and text; glassmorphism; purple-to-blue blends; a centred hero with three cards; identical shadow cards; icons in tinted squares; KPI-card rows; uppercase tracked eyebrows; middle-dot metadata; “WORD - fragment” labels; tiny monospace metadata; arrows appended to links; one highlighted headline word; sequence numbers outside the real Q1–Q4 cycle; cream/serif/terracotta styling; black/acid accent styling; broadsheet hairline decoration; emoji; “Welcome back”; and stock illustrations. Recheck the built screens against this list after every screenshot pass.

## Phase 0 observations that informed the brief

At 390 px, the current employee goal table clips columns; the status and actions leave the viewport. The fixed desktop sidebar disappears without useful phone navigation. Admin and manager roles currently render every function on one extremely long page; the full-page screenshots are hard to scan even at 1440 px. The login has prefilled credentials and a three-card feature row. Reports are embedded under the manager and admin page and begin with cards and a pie. The proposed route and content structure directly addresses these observed problems without changing endpoint contracts.
