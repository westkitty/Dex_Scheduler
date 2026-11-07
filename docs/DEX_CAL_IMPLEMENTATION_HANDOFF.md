# DEX_Cal - Complete Build Plan and Successor-AI Handoff

**Document type:** executable project handoff, implementation specification and continuity contract  
**Prepared:** 2026-11-07  
**Product name (user-decided):** `DEX_Cal`  
**Current GitHub repository (verified, NOT yet renamed):** [`westkitty/Dex_Scheduler`](https://github.com/westkitty/Dex_Scheduler)  
**Source baseline at preparation:** `main` @ `386f91773328f836382dfbdbfe98374d6482cddd`  
**Current Pages preview:** <https://westkitty.github.io/Dex_Scheduler/>  
**Delivery state:** this document is a build plan; the lined-paper UI and three-level gesture navigation described below have NOT been implemented.  
**Audience:** a new ChatGPT Work, Codex, Claude Code or other authorized coding project with no access to the prior conversation.

> **READ THIS FIRST: THIS IS A HANDOFF TO IMPLEMENT, NOT A CLAIM THAT IMPLEMENTATION IS FINISHED.**
>
> Use the existing repository and preserve its verified security, drafts, publishing and bill behavior. The user has chosen one portrait-phone design and explicitly requested a lined-paper hour grid with progressive Day -> Week -> Month pinch navigation. The product is called **DEX_Cal**, despite the repository and running app still using the former DEX Scheduler name. Implement deliberately in the ordered phases below. No greenfield rewrite, fake real-user sync, invented assets, or automatic repository rename.

---

## 0. PASTE-READY SUCCESSOR-AI EXECUTION PROMPT

> You are taking over development of **DEX_Cal**, an existing two-person private scheduling PWA for Andrew (red) and Greyson (blue), with derived purple overlap when BOTH people are scheduled away. The authoritative current repository is `https://github.com/westkitty/Dex_Scheduler`, NOT a hypothetical new repo. This file, `docs/DEX_CAL_IMPLEMENTATION_HANDOFF.md`, is the complete user-intent and execution contract for the next build. Read it in full, then read `README.md`, `Dex_Scheduler_bible.md`, `docs/SECURITY_AND_LIMITS.md`, the existing source, and the four checked-in `docs/design-references/` images. Inspect current HEAD, branch, working-tree status, tests and GitHub Pages before editing; the SHA printed in this handoff is only a baseline, not an eternal HEAD.
>
> **Do the work, do not restart discovery.** Preserve the two fixed identities, shared `Dexter` entry step, private invite-based personal password enrollment, owner-only schedules, local private drafts, explicit `Save & Sync`, version-conflict protection, independent urgent early-return publishing, shared scheduled bills, sourced rotating trivia and Dexter's dry personality. The currently deployed GitHub Pages build is preview only until the separate private Cloudflare Worker and D1 service is configured; never imply that real accounts or cross-device synchronization already work.
>
> **Design mandate:** Recreate the user-selected portrait phone composition: narrow charcoal left navigation rail, bold `DEX_Cal` branding, turquoise outlined white calendar sheet, straight horizontal notebook rules, black hourly labels, large legible red/blue/purple away blocks and a strong turquoise `+ Add Schedule` action. A line represents **one hour** in Day and Week; preserve real event duration and precise alignment. Week = all seven days across the sheet. Month = a seven-column true calendar grid with subtle notebook-like rules inside date cells. Implement progressive two-finger zoom across Day -> Week -> Month and reverse, plus equivalent visible Day/Week/Month buttons. Do not copy wavy lines from the user's rough sketch, hard-coded example dates, or false `Both Home` purple blocks.
>
> Implement in bounded phases: first visual shell and three calendar views, then gesture/event editing and mobile QA, then bills/trivia/household UX, then production backend/auth and real-device validation, then notifications and Dexter animation/optional AI. Make no real-data or infrastructure claim without evidence. After each phase, test the actual journey at Android/iPhone sizes and protect existing behavior. Keep the public repo free of private records and secrets. Request missing service/account authorization only when reached; do not ask for details already present here. Commit/push/deploy only when explicitly authorized by the active conversation and verify the resulting remote revision and Pages deployment. Provide a concise evidence-based implementation report and update the append-only project Bible.
>
> Begin with Phase 0: verify HEAD and current source, identify the smallest safe frontend change set for the portrait design, and establish failing design/interaction tests before implementation. Do not attempt a repository URL rename or private Cloudflare deployment in Phase 0.

### Important authority boundary

This handoff is a **planning artifact**. It is not itself standing permission for the successor to modify a live repository, spend money, deploy a Worker, expose private content, rename a GitHub repository, generate likeness-sensitive Dexter art, or force-push. A later user message such as "implement the next phase" can authorize that bounded phase. Preserve the user's preference for efficient execution without repeated non-blocking questions.

---

## 1. Product identity and protected purpose

**User-decided product name: `DEX_Cal`.** Do not quietly revert to `DEX Scheduler` or create an unrelated new application. The current repository slug, Pages URL, worker name and various code labels remain under the older name: they are **implementation migration targets**, not a reason to start over.

- **Exactly two people:** Andrew and Greyson. Role IDs already in code are `andrew` and `greyson`; retain these stable internal identifiers. No imaginary third participant. The prior voice-transcription name was an error and must not appear in UI, tests or handoffs.
- **Devices:** Android phone for Andrew and iPhone for Greyson; desktop browser remains useful for development but phone portrait is the primary design target.
- **Essential function:** see who is *expected* to be away, when they are expected to return, and whether both people have overlapping planned absences, without implying GPS tracking or proven physical presence.
- **Deliberate publishing:** plan a week's absences privately, inspect them, then publish together with `Save & Sync`. The other person must not see intermediate drafts.
- **Urgency:** an early-return update must immediately publish the affected event and notify the other person without publishing any unrelated drafts.
- **Secondary functions:** recurring scheduled bills and paid dates, shared-interest historical/general trivia, and an independent on-screen Dexter familiar making terse, judgmental observations.
- **Character:** this is a trustworthy small household utility with personality, not a finance app, GPS tracker, game or general-purpose AI calendar assistant.

### Hard product invariants (must not regress)

| ID | Rule |
|---|---|
| INV-01 | Exactly two fixed user identities, each with their own private password; shared entry word alone never grants private access. |
| INV-02 | `No away block` means **assumed home**, NOT independently verified home. |
| INV-03 | Andrew = red; Greyson = blue; purple = intervals where their away schedules overlap. Purple never means just "together" or "both home." |
| INV-04 | Published blocks are darker/saturated; new or modified **unpublished** blocks are lighter and distinguishable by something besides color (pattern/badge). |
| INV-05 | One account edits only its own away data, with server-side role enforcement. |
| INV-06 | Counterpart reads the last published schedule until explicit `Save & Sync`; drafts remain private to owner/device. |
| INV-07 | Revision conflicts block silent overwrites and retain the user's draft until explicit resolution. |
| INV-08 | `Coming home early` affects one identified published away block and leaves other unpublished changes private. |
| INV-09 | Multiple changes in one published batch produce **one generic** counterpart update; urgent changes produce a **specific** time-sensitive update. |
| INV-10 | Both people may view/pay a shared scheduled bill; shared obligations are not double-counted in household totals. |
| INV-11 | Daily trivia draws from one combined interest pool and can rotate within a day without rapid repeats; dated historical claims require sources. |
| INV-12 | Dexter is non-blocking, dismissible and optional; his behavior never writes schedule or bill truth. |
| INV-13 | Public Pages assets contain no private household data, credentials, invites, personal notes, session tokens or raw private reference photos. |
| INV-14 | App still works for core browsing/drafting when optional AI fails; remote publication is never falsely marked successful while offline. |
| INV-15 | All calendar views render the same underlying time intervals and ownership; zoom never mutates data or changes its meaning. |

---

## 2. Grounded evidence and what is actually implemented

### Evidence inspected for this document

1. **Live GitHub repository**, owner `westkitty`, public, default branch `main`, HEAD `386f91773328f836382dfbdbfe98374d6482cddd` on 2026-11-07. The remote full tree was inspected.
2. `README.md`, `Dex_Scheduler_bible.md`, `docs/SECURITY_AND_LIMITS.md`, `.github/workflows/pages.yml` and `worker/wrangler.jsonc` inspected directly from the GitHub connector.
3. The complete existing source was reconstructed from previously generated exact-byte repository transport bundles; every reconstructed Git blob SHA was checked against the current GitHub tree (25 published blobs, including empty `.nojekyll`). Local inspection included `public/app.js`, `public/styles.css`, `public/manifest.webmanifest`, `public/config.js`, the Worker API, D1 schema and tests.
4. Current CI history inspected: GitHub Actions run [`42366806040`](https://github.com/westkitty/Dex_Scheduler/actions/runs/42366806040) succeeded for that HEAD. This proves the existing Pages workflow succeeded, **not** that the requested design or private backend is live.
5. Local checks run on the reproduced source using Node `v22.16.0`: `node --check public/app.js`, `node --check worker/src/index.js`, 6/6 Worker API tests passing, 2/2 service-worker tests passing; `python3 tests/smoke_browser.py` passed desktop and phone viewport smoke checks. These are existing-baseline tests, not tests of new notebook UI or actual Android/iPhone hardware.
6. Earlier discovery-stage `Shared_Home_Scheduler_Dexter_Development_Handoff.md` (conversation artifact, **not a file committed in this repository**) was read as historical user-intent evidence. **It predates this repository** and its claims that no code had been built are stale. Use current source and this document for implementation state.
7. User-selected portrait UI screenshot plus newer Day/Week/Month ruled-paper mockups are bundled under `docs/design-references/`. The screenshot selection and new calendar rules came directly from the conversation.

### Current actual status (source/CI verified unless specified)

| Subsystem | Status as of baseline | Notes |
|---|---|---|
| Public GitHub Pages | **Deployed**, preview | Pages builds only `public/`; current app and manifest still say DEX Scheduler. |
| Shared `Dexter` entry screen | **Implemented** | An intentionally weak UX gate, not private authentication by itself. |
| Two named accounts, private invite setup and personal passwords | **Backend code + local tests** | Not deployed on the user's Cloudflare account. |
| Worker + D1 | **Source only** | `worker/wrangler.jsonc` contains placeholder D1 ID. |
| Private schedule ownership and version-checked publishing | **Source + tests** | Validated in isolated API/browser harness, not on two live phones. |
| Draft persistence, edit/delete, urgent return | **Source + tests** | Owner-local storage, explicit conflict handling; no guarantee across devices yet. |
| Current Day/Week calendar | **Implemented but visually obsolete** | Day/week currently use short HORIZONTAL 24-hour tracks arranged as rows; Week is seven day rows, not seven columns. |
| Current pinch | **Partial** | Simple two-finger Day/Week detection; no Month state; gestures disabled in preview. |
| Ruled-paper Day/Week/Month UI | **NOT built** | Selected future target, described in this document. |
| Scheduled bills | **Initial implementation** | One-time/monthly, payment toggle and totals; editing/deletion/expanded recurrence still missing. |
| Trivia | **Initial implementation** | Curated fallback, combined interests, rotating selections; not an AI-verified live historical pipeline. |
| Dexter | **Text cameo only** | No likeness-validated, independent walking animated character integrated. |
| OS push notifications | **Not implemented** | In-app update feed exists. |
| OpenAI commentary/meme images | **Not implemented** | No OpenAI API key in client; remain optional behind explicit privacy/cost controls. |
| Real two-device usability | **Not verified** | Requires real backend plus physical devices. |

### Existing repository map: verified files

```text
westkitty/Dex_Scheduler/             # Current repository name; not yet renamed
  README.md                            # Existing operational summary, needs DEX_Cal handoff pointer
  Dex_Scheduler_bible.md               # Append-only historical engineering record
  docs/
    SECURITY_AND_LIMITS.md             # Auth/data/preview boundaries
    DEX_CAL_IMPLEMENTATION_HANDOFF.md  # This new executable design/build handoff
    design-references/                # Chosen screenshot and ruled-paper view references
  public/
    index.html                         # PWA HTML shell, still old branding
    app.js                             # State, UI rendering, forms, draft/publish, gestures
    styles.css                         # Current dark dashboard styling, to be redesigned
    config.js                          # Public API URL only; apiBase is EMPTY
    facts.js                           # Local curated trivia
    manifest.webmanifest               # Current PWA name/scope, old branding
    sw.js                              # Static shell cache; private APIs bypass cache
    icon.svg, icon-192.png, icon-512.png
  worker/
    src/index.js                       # Private Worker API handler
    schema.sql                         # Existing D1 schema
    wrangler.jsonc                     # Template with placeholder database ID
  tests/
    api.test.mjs                       # Auth/ownership/publish/bill behavior
    sw.test.mjs                        # Static/offline cache behavior
    smoke_browser.py                   # Existing browser preview smoke checks
    e2e_app.py                         # In-memory test API / two-account browser path
    dev_api_server.mjs                 # Test-only fake service, NEVER production backend
  .github/workflows/pages.yml         # Node checks then Pages publish of public/ only
```

**Documentation drift already found:** the old README lists a `worker/.dev.vars.example` that is not in the verified GitHub tree. Do not assume it exists. The old README also retains a first-time Pages setup instruction even though the observed Actions workflow is now successfully deploying. This handoff corrects interpretation; follow-up docs/code improvements should reconcile these messages explicitly.

---

## 3. Design source of truth and supplied files

| Priority | Repository reference | Status | How to use |
|---|---|---|---|
| 1 | [`docs/design-references/selected-phone-portrait.webp`](design-references/selected-phone-portrait.webp) | **USER-SELECTED MASTER** | Composition, palette, typography, slim rail, white turquoise-bordered calendar, portrait proportions. |
| 2 | [`docs/design-references/day-ruled-hours.webp`](design-references/day-ruled-hours.webp) | User-requested mockup | One straight horizontal rule per hour, full Day mode, vertical chronological stacking. |
| 3 | [`docs/design-references/week-seven-columns.webp`](design-references/week-seven-columns.webp) | User-requested mockup | Seven day columns sharing straight hourly rules, Week tab active and pinch hint. |
| 4 | [`docs/design-references/month-ruled-cells.webp`](design-references/month-ruled-cells.webp) | User-requested mockup | True month matrix with subtle ruled-paper decoration inside each date, compact event indicators. |

The user chose the portrait screenshot explicitly with "This is definitely the one that we should focus on," then requested **hourly ruled paper** and **progressive pinch to Week and Month**. Later generated mockups are visualization references, not additional approvals for every sample label, date, schedule, icon or dog depiction. No other generated variant supersedes the selected master.

### Reference errors to correct in production

- The screenshot's `Monday Nov 10th` is a **fixture/example**. Monday November 10 is in **2025**, not 2026. The running app uses actual local dates; never hard-code this date into runtime.
- A purple `Both - Home` block in sample imagery is **semantically wrong**. Purple means both scheduled **away**, and must be derived from the overlap of two owner-controlled schedules. Empty time on paper means **assumed home**, not an explicit presence record.
- Sample event labels such as deliveries, work, games and dinner are fictional placeholder content, not real user appointments. Do not commit actual household data.
- The illustrated dog photo is **not** a reliable canonical Dexter reference. Do not use a generated/generic dog as the final character asset.
- Month cells cannot literally show 24 readable hours at phone width. Keep a subtle notebook motif in Month, but display real temporal detail in Day/Week and in a tapped detail sheet.
- The model-produced reference images may have visual calendar inconsistencies. Functional date math and time placement outrank mockup typography/fixture accuracy.

### Visual design contract

1. **Portrait-first:** designed for 320-430 CSS px width and common iPhone/Android tall screens. Do NOT simply render the 1024px-wide reference scaled down; adapt real touch sizes and text density.
2. **Outer shell:** deep charcoal/black, narrow dark navigation rail at left, `DEX_Cal` wordmark with simple turquoise house/calendar identity. White/turquoise main sheet takes most width. Later desktop can widen rail and show peripheral information, but phone is the primary.
3. **Calendar sheet:** near-white paper with rounded corners, bright turquoise outline, subtle inset/outer shadow. No glassmorphism reflex, gradients everywhere, or unrelated cosmic imagery.
4. **Paper rules:** precise straight horizontal lines, consistently spaced according to a single hours-to-pixels scale. Day and Week: one rule for every local wall-clock hour; optional finer subdivisions are restrained and subordinate. Never wavy/uneven lines.
5. **Time labels:** bold high-contrast dark labels aligned with exact hour boundaries, no arbitrary decorative placement. Support entire 00:00-24:00 day, not only illustrated 06:00-00:00. Initial Day scroll/viewport may center useful waking hours without losing night access.
6. **Schedule blocks:** consistent rectangular/rounded bars, rich blue for Greyson away, rich red for Andrew away and purple for intersection; correct time-height/position; white readable event text and a small relevant icon when space allows. Small blocks collapse labels and open details on tap.
7. **Drafts:** light/tinted blocks with clear draft label, dashed edge or pattern; never let color alone communicate unpublished state. Preserve published/owner contrast and distinction across overlaps.
8. **Top controls:** previous/next date arrows, dynamic date header, explicit Day/Week/Month selector always available, optionally `Today` shortcut. Controls never become decorative dead buttons.
9. **Primary action:** visually prominent `+ Add Schedule` button, opening an accessible edit/confirm flow. `Save & Sync` and pending-count indicator must also stay findable without competing with the calendar.
10. **Rail navigation:** show only functioning destinations or clearly accessible feature explanations. The reference depicts Calendar, People, Tasks, Bills, Overview, Settings, Help and Sign Out. Do not silently invent a complete task-management suite from a mockup; scope any missing screen explicitly.
11. **Adaptive navigation:** for ~320px phones, collapse rail to icons with accessible labels or a deliberately equivalent menu, rather than making the week grid unusable; preserve selected styling, navigation access and consistency. Respect safe areas.
12. **Typography and colors:** bold neutral sans-serif; approximate target palette charcoal `#10161b`, white `#ffffff`, turquoise `#05dcc8`, blue `#1167c8`, red `#d32930`, purple `#7836a7`, then measure/refine by comparing actual screen captures. These are proposed implementation tokens, not exact sampled canon.
13. **Quiet animation:** tactile transitions for zoom/view switch only when useful; respect reduced-motion and do not animate rulers in a way that suggests event times have changed.
14. **No real-person images needed** for the calendar UI. Dexter-specific imagery must go through its own reference/approval gate later.

### Required screen states for design QA

- Gate, identity selection, new account, returning sign-in, preview warning.
- Day: empty, single away, both separate absences, overlap, partial/changed private draft, compact short event, overnight split, bill due, alert pending, offline/error.
- Week: no events, dense seven-day week, narrow phone, two-person overlap, per-hour straight alignment, pending drafts, weekday navigation.
- Month: four/five/six-week layouts, leading/trailing days, compact indicators, selected day, overflow `+N` counts, bill amount badge, month boundary.
- Dialogs: add, confirm, edit, discard, conflict, urgent return, bill details, password and notification settings.
- Dexter: opening cameo, later independent interjection and reduced-motion/off states after likeness-approved assets exist.

---

## 4. Calendar semantics and time model

### 4.1 Canonical event model

- Every personal away block is `{ id, start, end, label? }` in existing source, with epoch-millisecond `start` and `end`. Keep working IDs and API contracts until migration is deliberately scoped. `start` is inclusive, `end` exclusive.
- Both owners independently edit their own *away* spans. **Do not create a mutable third "Both" owner**. Intersection of Andrew and Greyson away windows is a derived rendering only.
- Recommended follow-on metadata (schema design, not an existing guarantee): event creation/update timestamps, optional timezone/recurrence and locally persisted draft status. Avoid exposing private labels in generic updates.
- `home` means planned default in the absence of a recorded away block; no device location, geofence or sensor verification.
- A user can provide optional labels/reasons, but no label is required. Do not reveal notes to AI by default.
- Events may cross midnight and span multiple days. Display clipped portions in each affected Day/Week/Month cell with one underlying event ID; editing affects the original interval, not duplicates.
- Timezone: persist absolute instants; choose and document one household display timezone (default device local, if consistent) with an explicit zone rule before shipping multi-timezone support. Do not silently shift scheduled wall-clock times after travel. Test DST ambiguous/nonexistent times.
- Existing code builds local dates using `new Date()` and `dayAt()`; preserve old saved events, add focused DST/timezone tests before changing serialization.

### 4.2 Derive the overlap mathematically

Compute the union of each owner's non-overlapping normalized away intervals, then intersect those two unions for purple overlap. For display, partition a day into maximal disjoint segments with membership `{none, andrew, greyson, both}`; render blue, red or purple accordingly. If only one is away, show only that owner's color. Do not overpaint a purple block on top of a red/blue block without an accessible label reflecting the same interval.

Example: Greyson 09:00-12:00, Andrew 10:00-14:00 -> blue 09:00-10:00, purple 10:00-12:00, red 12:00-14:00. The remaining time is neutral paper, assumed home. A draft can overlay an owner's changed published view **locally** with its own light tint and pending marker; it must never leak to the other user's published feed.

### 4.3 Day view: ruled paper with 24 hourly rows

- At top: localized dynamic weekday/date, previous/next, Day active, Week and Month options.
- A dedicated vertical time gutter shows 00:00, 01:00 ... 23:00 and the next-day boundary. No uneven lines: every hour has equal visual height in the default scale, e.g. CSS variable `--hour-height` proposed 48-60px (actual final size validated on devices).
- The calendar is a scrollable vertical day canvas. Each block's top and height derive from interval start/end as a percentage of 24h or minutes times hour height; 15-minute entries align proportionally rather than snapping to a whole-hour boundary.
- Draw the rules **behind** events; keep rules subtle and visible through empty areas. Current-time marker may be used but must not obscure labels.
- Short events (less than block text height) show a color band, accessible name and tap detail panel. Offscreen events stay discoverable by scrolling and agenda-style accessibility list.
- Tapping an existing owner block opens details then edit/remove. Tapping counterpart event is read-only. Long-press + vertical drag creates a time range draft, followed by a confirmation dialog; tapping `+ Add Schedule` must provide an equivalent form-based path.
- Dragging is never the only input. Provide keyboard/screen reader access and avoid page-wide touch suppression.

### 4.4 Week view: **all seven days in columns**

- Header names the actual date range (e.g., Mon-Sun) and a seven-column matrix, each column anchored to one real date. An hour rule runs straight across all seven day columns; 24-hour time gutter remains aligned at the left.
- The same event rectangles are clipped into each column with proportional vertical positions. Blue/red/purple derive from absolute intervals, not colorful hand-placed tiles.
- On a 320-430px phone, seven columns are narrow. Use compact blocks and density-coded marks; reveal full label/start/end/owner in accessible details sheet on tap. Do not rely on microscopic white text inside every slot.
- Provide selection focus and navigate next/previous week; preserve focus date when switching from Day and Month. Display weekdays and dates accurately, including year transitions.
- The Week view must really show **seven side-by-side days**, not the existing implementation's seven horizontal day rows.

### 4.5 Month view: **true calendar matrix**

- Header uses current month/year. Grid columns Sunday-Saturday or Monday-Sunday according to one explicit, consistent setting (default US Sunday-Saturday is defensible; don't leave different views contradictory). Include leading/trailing days only when useful for fixed weeks.
- 4-6 week rows as required by the real month. Dates are correct for the calendar year; no static Nov 2025 example in runtime.
- Subtle ruled lines **inside date cells** evoke paper but do not falsely claim each miniature line represents an hour. Show small colored away indicators, purple only where real overlap exists, and a due-bill amount badge where applicable. Dense days display `+N` and a details sheet.
- Tap day -> Day view, preserving selected date. Long press on a date may open form with date prefilled, not an unworkable 24-hour tiny grid.
- Month navigation and selection are stable across leap years and 28/29/30/31-day months.

### 4.6 Progressive pinch and zoom state machine (user-decided outcome)

**Required view progression:** start Day -> first progressive two-finger zoom-out step shows the complete Week -> continued zoom-out shows Month; reverse zoom-in returns Month -> Week -> Day. The user described this as "pinch out to show full week, pinch further for month." The key locked behavior is the widening/narrowing **calendar scope**, not an unverified assumption about which finger-motion direction they call "out". Conventional pinch-to-zoom uses **decreasing finger distance** for zooming out; confirm the physical direction with a short on-phone usability trial, then preserve their intended semantics in UI hints.

Proposed implementation without a new gesture library unless evidence justifies it:

1. Detect two active touch pointers within the **calendar canvas only**, track distance and midpoint. Distinguish native browser viewport zoom from app calendar navigation; preserve normal browser zoom and screen-reader accessibility outside this scope.
2. Use a normalized pinch ratio with hysteresis and two thresholds, not an instantaneous 80-pixel absolute cutoff. Suggested prototype ratios: `0.84` -> next wider mode and `0.68` -> next wider mode on the same uninterrupted gesture, then tune on devices. Expand past mirrored thresholds to narrow mode. Do not permit oscillation near threshold.
3. Explicit gesture lifecycle: `idle -> primed(two pointers) -> tracking -> transitioning -> complete/cancelled`; handle `pointercancel`, lost capture, changed fingers, vertical scroll, menu opening, app backgrounding and page navigation.
4. Do not treat a two-finger pinch as a long-press/drag event. Cancel pending draft selection when a second pointer arrives. Do not change views while a modal is open or text is being entered.
5. Anchor the transition around the touched date/time or selected day, not always jump back to today. Preserve unpublished draft state and current data version.
6. Day / Week / Month tab buttons are **mandatory** alternatives on touch, desktop, keyboard and assistive technology. Pinch failures on installed iOS PWA must not make views inaccessible.
7. Do not apply `touch-action:none` to `body` or disable user scaling globally. If a small calendar surface requires custom touch handling, scope it carefully and demonstrate that native page scrolling/zoom and accessibility continue to work.
8. Provide a nonintrusive "Pinch to zoom calendar" discovery hint, dismissible after first success. Match gesture direction labels to observed behavior.

**Proof:** test continuous 1-step and 2-step pinch, reverse pinch, threshold jitter, scroll interference, orientation changes, tap/long-press conflict, Android Chrome and installed iPhone PWA. Confirm all three views show matching event dates before and after transitions. Simulated Chromium multi-pointer tests are necessary but **not sufficient** for physical iPhone proof.

---

## 5. Scheduling, drafts, publication and urgent returns

### Entry creation/editing flow

1. User chooses `+ Add Schedule` or long-presses and drags time range on Day/Week.
2. Accessible dialog shows start/end **dates** and times, optional label/reason, owner locked to current authenticated identity. Support spans that end on following days.
3. Validate real order, DST edge cases, exact time zone and conflicts. Refuse `end <= start`; avoid silently truncating an overnight span at 23:30.
4. User confirms. New/changed block becomes a *light* pending draft on this device only. Existing published block remains visible to partner.
5. Changes may be batched for a week or longer. Pending indicator shows count with `Save & Sync` / `Discard Drafts`. Discard confirms and restores last published version; restore from local draft after reload.
6. On `Save & Sync`, send the owner's full normalized event set with base revision. Worker must atomically reject revision mismatch (`409`); local UI presents review/rebase/replace choices without losing the draft. Server creates **one generic** activity update to partner only after successful commit.
7. After success, pending markers darken to published and last-sync time advances. Only then announce success.

### Urgent return

- Visible priority action `Coming home early` lists owned **published** away windows, lets owner specify revised end/arrival, confirms action, and calls the server's urgent endpoint independently of draft set.
- Only that published event changes immediately. One specific partner alert contains the new expected arrival time, but not private reason/notes. Concurrent unrelated drafts remain pending after the server revision advances (safe rebase only if unambiguous).
- Handle urgent timestamp before start or after original end explicitly; do not silently erase future spans without preview/confirmation.
- Repeated urgent action and simultaneous requests should be idempotent or safely conflict-detected. Partner reads updated published data after fetch; never use an AI-created arrival time.

### Offline and conflict behavior

- Public shell can load offline using its current service worker, but authenticated API data is **network-only** and must not be presented as fresh when disconnected. Clearly label last-known published cache if any authenticated data is added later and evaluate security before storing it.
- Private drafts can remain on a trusted device after app restart. Validate stored version/schema and preserve the existing draft on a failed publish. Logout deliberately clears this device's private draft and session (warn before destructive logout if pending).
- Unexpected network loss, HTTP 409, expired login, interrupted publish, duplicate tap and stale requests produce visible recoverable states, not a fake "Synced" badge.
- If two signed-in sessions of the same owner publish concurrently, make conflict resolution explicit; no silent last-write-wins.

### Recurrent scheduling (later addition)

User discussed planning across a week; recurring away periods and "copy last week" are valuable follow-ons but **not explicitly mandatory in the original first version**. Add only after stable overnight and edit/publish semantics. Avoid a recurrence engine that silently expands an unbounded infinity of records; use bounded date ranges and clear exceptions.

---

## 6. Authentication, personal accounts and private infrastructure

**User-decided first-run flow:** open Pages -> enter shared word **`Dexter`** (case as existing) -> choose **Greyson** or **Andrew** -> for an unclaimed role create a separate personal password -> for a claimed role sign in with that personal password -> enter private schedule. User asked for account creation on first login, not just switching a local UI label.

**Security interpretation (existing implementation):** GitHub Pages is a public static site. If a random visitor knows or guesses `Dexter`, they may pass the *welcome step* but must not be able to claim an account or read private schedules. Each role's first registration requires an independently generated high-entropy private invitation fragment, short-lived setup enrollment period and backend validation. Do not place usable passwords/invites in JS, HTML, README, screenshots, CI logs or GitHub commits.

### Preserve and inspect before changing

- Worker source `worker/src/index.js` already contains password hashing, login tickets, scoped `Bearer` session validation, rate limiting, role ownership checks and endpoints for account setup, publishing, urgent returns, bills and interests. Read tests before refactoring.
- `worker/schema.sql` defines `identities`, `sessions`, `entry_tickets`, `auth_attempts`, `schedules`, `activity`, `bills`, `bill_payments`, `interests`.
- `public/config.js` has `window.DEX_CONFIG = Object.freeze({ apiBase: '' });`; **empty** means real accounts are disabled. Never fake successful enrollment in preview.
- `worker/wrangler.jsonc` uses `DB` D1 binding and a placeholder database ID. It also uses the old service name and current Pages origin in configuration; update migration dependencies together if/when URLs change.
- User-specific actual password recovery path and account reset/migration safety are **not yet implemented**. Add an authorized, auditable recovery plan before routine production use; never expose a public self-service reset without appropriate verification.

### Cloudflare Worker/D1 production integration (explicitly later than safe UI work)

1. Verify which Cloudflare account belongs to the user and whether the Worker/D1 services and limits are available. Do not assume a connected Cloudflare account, credentials or zero cost.
2. Obtain explicit authority for creating/deploying that private service. Check actual Cloudflare plan limits and costs at execution time.
3. Create the **new isolated** D1 database; update the real binding ID privately and apply schema through a tracked, tested migration workflow. Avoid applying schema to unrelated D1 data. Prepare rollback/backup before any later destructive migration.
4. Generate separate `INVITE_ANDREW`, `INVITE_GREYSON`, and rate-limiting/auth secrets server-side; never put actual secret values into GitHub. Keep `ENTRY_PASSWORD` override optional; the user-visible default is still `Dexter`.
5. Enable enrollment only for the minimum setup window. Provide privately delivered fragment links to each person; confirm `Dexter` alone cannot seize either role. Turn off enrollment afterward and test duplicate-claim denial.
6. Deploy Worker with correct CORS/origin, add only the **public Worker HTTPS origin** to `public/config.js`, verify `/api/status` and auth. Build a separate staging backend first if feasible, without personal records.
7. From two real devices/identities verify create account -> login -> own draft -> publish -> partner read -> urgent return -> paid bill -> logout/relogin -> session revocation. No sample fixture may masquerade as live data.
8. Implement backup/export, password recovery and operational error visibility before inviting long-term sensitive use; validate data retention/recovery policy.
9. Keep Cloudflare Worker binding, GitHub Pages origin, manifest scope, service worker and login redirect policies consistent through any later public repository rename.

**Threat model:** enumeration/account claiming, CSRF/CORS confusion, leaked bearer token in `localStorage`, unencrypted private device drafts, rate-limit abuse, unauthorized ownership changes, cross-device stale revision, logs leaking notes, push content exposing private details. Do not claim professional security approval based on unit tests alone. Review deployment credentials and storage options without pretending the shared word is a second security factor.

---

## 7. Shared scheduled bills and financial summary

### Required product behavior

- Track **scheduled bills**, not purchases, bank accounts or broad personal spending. Each item has name, amount, date, owner attribution (Andrew, Greyson or shared), repeat rule and optional reminder preference.
- Show a small dollar/money-bag marker with **numeric amount** on each due date in Day/Week/Month, with an accessible label. Tap opens modal with itemized bills, due dates, owners and paid status. Calendar markers must not obscure time rules.
- Separate Bills screen contains upcoming and overdue obligations, monthly totals (both separately and shared), payment history and controls to mark paid with a paid date. Either person may mark a shared bill paid; both see the record.
- Shared household total counts a bill **once**. If displaying individual owed shares, use a separately defined allocation rather than implicitly charging each person the full shared amount. Current source uses owner/shared categories and total; equal-split semantics are NOT yet defined.
- Current source supports one-time and monthly recurrence and payment toggle; bill **editing, deletion and richer recurrence** require implementation and tests. Preserve history when editing recurring future amounts/due dates; don't retroactively rewrite paid occurrences.

### Recommended explicit recurrence rules (proposed; validate before production)

- Model immutable bill ID and dated occurrences; a recurring bill due on day 31 should specify how February is handled (proposed: last day of shorter month, consistent with existing local calculation).
- Editing recurring obligations should ask "this occurrence" vs "all future occurrences" where it materially changes history. Maintain paid proof/history; prevent accidental double charge and double marking.
- Paid-on date may differ from due-on date; record both. Do not equate scheduled with actually paid.
- Reminders are opt-in and non-sensitive by default; avoid disclosing amounts or bill labels on lock screen unless both consent.

### Bill acceptance examples

- $75 shared + $40 Andrew + $30 Greyson in one month -> household scheduled total **$145**, shared bucket **$75**, Andrew-owned **$40**, Greyson-owned **$30**; do not count the shared $75 twice.
- A payment marker on recurring November bill does not mark December paid. Both can read November paid date. A recurrence edit preserves November history.
- Tapping a $75 due badge opens the correct occurrence and does not mutate it.

---

## 8. Daily trivia / On This Day

**User-decided:** date-specific historic "on this day" material when available, plus interesting general trivia; users contribute to **one shared interest pool** rather than isolated personal feeds. Each app opening can show a different fact from a prepared daily batch, with repeat avoidance. Dexter can respond to it.

- Existing `public/facts.js` and `public/app.js` provide a curated starting pool and rotation. Preserve offline fallback; avoid claiming the content is newly researched daily if it is not.
- Store interest contributions per role and merge them for fact selection. Do not expose a separate "only your facts" user mode unless explicitly chosen later.
- A date-specific fact must match the **current month/day**, independent of the year of the user's calendar selection. Display fact date correctly; a historic event tied to Nov 10 must not become an event on Nov 9 after timezone conversion.
- For dynamic/AI facts later: verify facts and citations from reliable sources before publishing them as historical facts; cache a small daily batch centrally, rotate per device/user without quick repeats, and fall back to local verified facts when offline or budget-limited. Model output alone is not verification.
- Do not make the calendar depend on a network trivia query on each launch. Show a compact fact entry point and a full sourced detail screen.
- A daily novelty should not interrupt scheduling, hide errors, or disclose private interests without consent.

---

## 9. Dexter: the furious on-screen household familiar

### Required character behavior and tone

- Dexter is a small, long-haired tricolor **Phalene** with **floppy DOWN ears**, dark dominant coat, pale cream facial points, white muzzle/chest and compact proportions. He is stern and unimpressed, never a generic upright-eared cartoon dog.
- On opening the app, a **brief quick cameo**; later, less predictable independent appearances while the PWA is in use: head up from corner -> waddle across a safe route -> pause/comment -> wander off. Genuinely independent timing, not a reaction every time a user taps a control.
- Commentary may be prompted by *accurate* derived schedule patterns, a due bill or a trivia item. Dry, aloof, judgmental. No cloying encouragement, no fabricated facts or humiliating private disclosures.
- Animation remains strictly inside the PWA. Do not promise always-on-top OS companion behavior on iPhone/Android.
- Never cover active dialog controls, date/ruler labels, Save & Sync, a bill paid action or a keyboard input. Allow dismissal and disable/mute settings; honor `prefers-reduced-motion` and page visibility to avoid background loops/leaks.

### Canonical asset production GATE: required before visuals

1. Inspect actual permitted Dexter references and existing `westkitty/Dexter_Desk_Familiar` sources/assets **at execution time**; do not infer visual approval from names, memory or a generic mockup illustration. For likeness-sensitive image creation, follow the currently available `canonical-character-image-production` procedure and its live registry/reference/evidence requirements. If verification fails, do not substitute unrelated animal art.
2. Preserve existing approved cel-shaded motion quality as a benchmark when accessible. Do not replace it with a rough rigged 3D prototype without user-judged side-by-side proof. The existing Desk Familiar is inspiration, not automatic license/asset readiness proof.
3. Start with a renderer-agnostic behavior controller and **placeholder-free text-only fallback**. Integrate approved visual sprites/WebM/other assets only after bytes, provenance, build pipeline, mobile decode and performance are verified.
4. Motion acceptance: down ears in every identifiable frame, consistent markings, believable short waddle, smooth pause/exit, no screen-blocking, no performance collapse after repeated cameos, reduced-motion static/text alternative.
5. Optional poke/tap reaction is a later Easter egg; avoid making the app a toy at the expense of scheduling.

### AI personality and optional meme mode

- User wants **fun**, not an AI assistant for routine calendar entry or availability Q&A. OpenAI-generated snark and occasional creative trivia/meme concepts are possible enhancements, not a reason to rebuild scheduling around an LLM.
- All model calls require server-side proxy, cost/quota caps, explicit enable/disable, consent for minimum context and no notes/credentials. No model can write schedule, mark a bill paid, invent push receipt or confirm someone's presence.
- Graceful fallback to curated local lines/facts is required. AI image generation/meme maker was discussed but **not locked as a required initial release**; if included, separate cost/privacy/user intent review from the standalone `DEX_Meme_Factory` project.
- Do not embed OpenAI keys in `public/config.js`, cache API credentials, or rely on a live provider to display the calendar.

---

## 10. Notifications and communication

- **Batch Publish:** exactly one generic in-app update for the partner; planned OS push example "Greyson updated his schedule." Do not list dates, reasons or private labels in a lock-screen notification.
- **Urgent early return:** a separate specific update indicating the revised expected arrival time, without optional sensitive notes. It is not suppressed by the presence of unpublished drafts.
- **Bill alerts:** proposed, optional after user consent; do not invent mandatory alert times or amount visibility.
- **In-app update history/unread badges:** preserve as fallback when OS push is unavailable or denied. On open, sync status and partner's latest published revision provide the source of truth.
- **Web Push implementation:** Web Push/Notifications/Service Worker subscription on actual installed iPhone home-screen PWA and Android. Permission only in direct response to user action, not immediately on the welcome screen. Secure server stores per-device subscriptions, expiration, revocation, deduplicated event queue and retry handling. Present notification promptly when push delivered; never silent push tracking.
- **Delivery semantics:** queued/sent are not guaranteed delivered/read. Product must never infer user attention from push dispatch success. Provide in-app fallback, optional test-notification screen and notifications-off mode.

Technical basis: Apple WebKit/Apple Developer docs confirm Web Push on iOS 16.4+ Home Screen web apps with direct user interaction, and service-worker/subscription requirements. Verify newer target-device specifics at build time.

---

## 11. Navigation and secondary UI: no fake modules

### Existing meaningful destinations

`Calendar`, `Bills`, `Daily curiosity/Trivia`, `Updates`, role/session details and settings are grounded in existing functionality. The selected mockup also depicts `People`, `Tasks`, `Overview` and `Help`. Treat the latter labels as **visual UI directions** until each has a defined functional path. Options:

- `People`: read-only two-person identity/legend, public schedule freshness, settings for your own account; never expose private unshared drafts.
- `Overview`: a concise next-out/expected-return summary, due bills and next fact, grounded only in current published data and marked stale when offline.
- `Help`: inline guide for meanings, draft vs publish, available swipe/pinch, installed PWA and limitations.
- `Tasks`: user did not specify a full checklist/task schema; either defer/hide this nav item until authorized or implement a deliberately minimal, explicitly approved household task feature. Do not add a dead button because it appears in an AI mockup.

**Do not confuse the model-generated colored blocks with a universal "event category" calendar.** The core calendar is a two-person *away* calendar with optional labels, not a general shared appointments/tasks calendar.

---

## 12. Architecture: reuse existing sources, do not rewrite blindly

### Current data/control flow (confirmed by source)

```text
GitHub Pages public/ (static PWA)
   -> entry gate + role/password UI
   -> state and event render in public/app.js
   -> device-local unpublished drafts, state.view and selected date
   -> when Worker origin configured: authenticated HTTPS requests
   -> Cloudflare Worker worker/src/index.js (not deployed yet)
   -> D1 DB: identity/session/schedule/bill/interest/activity tables
   -> partner reads published snapshot + in-app activity
   -> future push/AI are separately gated modules

Service Worker public/sw.js caches static shell only; private API requests do not enter that cache.
```

### Proposed modular boundaries (refactor incrementally only when needed)

- `calendarModel`: local dates, timezone/overnight clipping, per-hour coordinates, overlap partition and day/week/month projection; **pure deterministic functions** with exhaustive tests.
- `calendarView`: one owner of view state (`day | week | month`, anchor date, scroll position, zoom interaction), renders accessible rules and event bars. Avoid duplicate state for calendar copies.
- `gestureController`: scoped two-pointer tracking, cancellation, hysteresis and explicit view switch; no competing hidden touch handler.
- `draftController`: owner drafts, base revision, pending/edited/deleted semantics, restore, confirmed discard, conflict review, urgent rebase.
- `apiClient`: authenticated requests, abort/version tokens, clear offline/error states, never leaks server credentials.
- `billModel`: recurring occurrences, payments, attribution and totals separated from display.
- `dexController`: autonomous timing/motion/text with page lifecycle, stop/start, reduced-motion and optional AI; not tied to schedule mutation.
- `factModel`: shared merged interests, date source, repeat control and source evidence.

The repository currently uses dependency-free vanilla JS with one large `public/app.js`; extracting modules is **optional** until clear tests justify it. Preserve working behavior and Pages' direct static deployment. Do not introduce React, a large build pipeline, Tailwind or arbitrary dependencies solely for style.

### Data/version evolution

- Existing D1 `schedules.events_json` and revision counters are authoritative; changes to event intervals must preserve old records and reject malformed data.
- Add DB migrations for new bill functionality, notification subscriptions, optional account recovery and any recurrence schema. Do not overwrite historical paid occurrences.
- For local drafts, version the payload and schema, validate on restore, provide an explicit recovery path from malformed state and avoid mixing user identities in keys.
- Test logout/login on shared browser, two tabs same user, offline/online publication, 409 conflict, data export and timezone edge cases.

### Hosting/repo name transition

The user has **renamed the product** to `DEX_Cal`; this does not mean GitHub has already renamed the repository. There are two independent decisions:

1. **Immediate UI/code brand rename** (inside a future authorized implementation phase): update title, UI logo, manifest name/short name, icons, screen reader names, document links and app copy; do not change internal role IDs or current service URLs accidentally.
2. **Optional later GitHub repository rename** from `westkitty/Dex_Scheduler` to `westkitty/DEX_Cal`: requires explicit user-authorized admin action, verify no target name collision, audit Pages project URL change, service worker scope, installed app manifest/start_url/id, Cloudflare `APP_ORIGIN` and CORS, invite links, tests, docs, Git remotes, deployment, notifications and old bookmarks. GitHub documentation says repository link redirects generally exist but **project Pages URLs do not redirect automatically**; preserve a migration/old-link plan and verify the new Pages deployment before retiring the old URL.

**Do not rename the remote repo just to make docs look nice.** The handoff and README can use the new product name while accurately retaining the existing repo slug until the user authorizes a migration.

---

## 13. Ordered implementation roadmap with acceptance gates

The user asked what can be improved *before* connecting Cloudflare: most visual, calendar and rehearsal work should be done first. These are bounded vertical slices, not a license to declare the entire project finished from one build.

### PHASE 0 - Source verification, asset lock and regression baseline (first action)

**Scope:** read-only checks followed by test additions only after user authorizes work.

1. Check actual target repo, branch, HEAD, remotes/upstream and dirty/untracked changes. Preserve existing user work. Read this handoff, README, Bible, security guide, core source and tests.
2. Confirm checked-in four visual references match supplied intent; compare portrait screenshot proportions to 360x800, 390x844, 430x932 and desktop contexts.
3. Run existing Node API/SW checks and browser smoke/E2E where dependencies permit. Capture current gate, preview, Day/Week, Bills and mobile screenshots to form evidence-backed baseline.
4. Freeze protected invariants INV-01..INV-15. Draft minimal state transitions and test cases for new Day/Week/Month views.
5. Establish code locations for visual shells, interval math, drafts, bills, gestures and Worker boundaries; check any pre-existing code changes before starting.

**Exit:** a concise baseline receipt names actual current HEAD, working-tree status, old UI evidence, verified checks, and the first patch scope. No external deployment, account setup or server changes yet.

### PHASE 1 - Rebrand and build the selected portrait shell

**Work:** update PWA visible branding to `DEX_Cal`; adapt `public/index.html`, `public/styles.css`, shell rendering in `public/app.js`, manifest/icon as needed. Build charcoal rail + turquoise-bordered white calendar paper, accessible navigation, date header and primary actions, mobile responsive behavior. Preserve gate and existing screens.

**Acceptance:** visual screenshot comparison with selected master at **actual phone CSS size**; no clipped text, sideways body scroll or inaccessible modal; keyboard/focus/contrast controls remain operable; original backend tests still pass; no dead navigation items. Do not change the GitHub repository name in this phase.

### PHASE 2 - Real ruled Day timeline and correct time projections

**Work:** extract/test pure interval math, true vertical 24h Day grid with hour lines, 15-minute accurate placement, overlap derivation, compact events, overnight clips, DST/calendar boundaries and read-only counterpart events.

**Acceptance:** exact time-position assertions and visual screenshots for empty, solo, overlap and midnight-crossing fixtures; no purple-home state; default assumed home visible as neutral paper; published/draft distinction retained.

### PHASE 3 - Seven-column Week, true Month and progressive pinch

**Work:** implement all seven columns in Week; true month grid; unified selected-date/view state; two-pointer gesture thresholds, multi-step zoom, reverse zoom, keyboard/tab alternatives, focus preservation and mobile safe area constraints.

**Acceptance:** Day -> Week -> Month and reverse across gesture and button paths; no unintentional schedule edits, page zoom hijacking, lost drafts or stale state; seven columns correctly aligned to same hour scale; 4/5/6-row months and leap years correct. **Physical Android and iPhone PWA pinch QA remains mandatory before claiming full phone support.**

### PHASE 4 - Editing, drafts, conflict safety and UX integration

**Work:** adapt long-press/vertical drag selection; start/end date and time forms (including overnight); edit/remove; pending visual styles; confirm, discard, batch Save & Sync, urgent return; preserve local drafts during render and gesture transitions.

**Acceptance:** two-account harness verifies draft invisibility, one generic update per batch, urgent-specific update without publishing other drafts, conflict retention, explicit rebase, offline failure clarity, tab/reload persistence. Enforce backend role boundaries using existing source, not UI-only checks.

### PHASE 5 - Bills, overview, trivia and practical settings

**Work:** complete real Bill edit/remove/occurrence/history semantics; due amount markers in all views; separate bill summary; shared-interest trivia view; source citations, daily rotation and functional Help/Overview/People screens. Resolve undefined Tasks nav honestly.

**Acceptance:** monthly math correct, shared bill counted once, paid dates preserved, same due marker across Day/Week/Month, modal usable, facts sourced and nonrepeating, navigation has no dead controls. No fabricated synced information in preview.

### PHASE 6 - Realistic offline-capable **rehearsal mode** and hardening

**Work:** create a clearly fictional two-person test playground using existing test-only in-memory API harness, with scripts to generate dense schedules, two concurrent sessions, bill history, conflicts, urgent returns, empty/offline states and app relaunch. Keep it **visibly distinct** from real accounts.

**Acceptance:** repeatable end-to-end scripted path with separate browser contexts, Android/iPhone-sized captures, accessibility and cross-view correctness. No rehearsal identities/passwords or fake API exposed as a live production service.

### PHASE 7 - Private Cloudflare Worker + D1 live integration

**Dependency:** user-provided authorized Cloudflare account/service capability and any cost decisions.

**Work:** deploy isolated private DB/Worker, secure invites/passwords, verify CORS, schema migration, role enforcement, session lifecycle, real two-device published sync, conflict recovery, paid bill propagation, status freshness and backup/recovery path.

**Acceptance:** real Android and iPhone log in as distinct accounts, share published events and bills, cannot edit each other's schedules, cannot see drafts, and receive reliable in-app update history. User data never reaches GitHub Pages static assets, sample fixtures or model prompts.

### PHASE 8 - Best-effort Web Push and respectful alerts

**Work:** server-side push subscription/storage/delivery for installed PWAs, user-gesture opt-in, generic batch and specific urgent alerts, retry/expiry and fallback. Test separate iOS/Android devices with permission granted/denied and app closed/open.

**Acceptance:** one intended generic alert per batch, one specific urgent alert, no private labels, in-app history survives push failure, no claim of guaranteed delivery.

### PHASE 9 - Dexter visual familiar, optional AI and polish

**Work:** verify real Dexter reference approvals and existing Desk Familiar assets; implement independent waddle/cameo system, context-aware scripted jokes and nonblocking presentation; optionally add server-side cost-limited AI lines. Treat meme generator as optional separate phase depending on user decision.

**Acceptance:** user-approved likeness on both devices, floppy ears down, real animated runtime screenshots/video proof, no blocked scheduling controls, no background animation leaks, working reduced-motion/mute toggles; with AI disabled all core actions and curated jokes still work.

### PHASE 10 - Production hardening and controlled brand/URL migration

**Work:** run full functional, security, accessibility, DST, mobile, offline, source/privacy and performance checks; verify data export/recovery; audit any planned remote repo rename; record migration plan and perform only with explicit permission. Update every governing doc and project Bible, Git history, CI and Pages.

**Acceptance:** current source, tests and deployed URL refer to the same revision; remote Pages and Worker are verified separately; physical devices installed and usable; no false green statuses or orphaned private data. Optionally rename GitHub repo only after verified redirect/URL plan and explicit authorization.

### Delivery cadence

Deliver one scoped phase at a time with **working, testable commits** when authorized. No phase can claim success solely because the design looks right; no later phase may overwrite working core behavior for aesthetic fidelity. No unbounded "keep going until perfect" loop; close or report blocked gates explicitly.

---

## 14. Acceptance matrix - tests a successor must create or retain

| ID | Priority | Test scenario | Required outcome |
|---|---|---|---|
| CAL-01 | P0 | Day shows 24 hours with straight evenly spaced lines | One hour per rule; labels exactly aligned and overnight accessible. |
| CAL-02 | P0 | Week view at 390px | All 7 day columns visible; rules continuous and event details reachable. |
| CAL-03 | P0 | Month with 28/29/30/31 days | Correct weekdays, rows, selected date and compact indicators. |
| CAL-04 | P0 | Progressive pinch | Day -> Week -> Month, reverse to Day; explicit buttons equivalent. |
| CAL-05 | P0 | Two-finger pinch during pending long-press | Does not create or publish an accidental event. |
| CAL-06 | P0 | Blue 09-12, red 10-14 | Blue 09-10, purple 10-12, red 12-14; neutral elsewhere. |
| CAL-07 | P0 | "Both home" fixture | No purple block because no overlapping away data. |
| CAL-08 | P0 | 15-minute and short spans | Accurate proportional placement; accessible details sheet. |
| CAL-09 | P0 | Overnight and DST transitions | Correct clipping, date boundaries and unambiguous validation. |
| CAL-10 | P0 | Date today vs Nov 10 mockup | Runtime derives real date; demo reference remains static only. |
| DFT-01 | P0 | Owner adds/edits/removes draft | Only owner sees lighter pending version until publish. |
| DFT-02 | P0 | Reload or pinch with drafts | No local loss, accidental cross-account leak or state reset. |
| DFT-03 | P0 | Save & Sync 5 drafts | One atomic publication and exactly one generic partner update. |
| DFT-04 | P0 | Two sessions publish with stale revision | HTTP 409, retained draft and explicit conflict review. |
| DFT-05 | P0 | Urgent arrival with other drafts | Only that published block changes; other drafts stay private. |
| AUTH-01 | P0 | Guess `Dexter` without private invite | Cannot claim role, access schedules or enroll unauthorized user. |
| AUTH-02 | P0 | Andrew attempts Greyson write via API | Denied irrespective of UI role field. |
| AUTH-03 | P0 | Expired token/logout/relogin | Access denied until valid authentication; local draft handled safely. |
| OFF-01 | P0 | Offline opening/publishing | Cache serves only static shell; no API response cached; no false success. |
| BILL-01 | P1 | Shared bill and both personal bills | Correct due markers, totals and shared count once. |
| BILL-02 | P1 | Monthly bill marked paid | Only targeted occurrence paid; paid date preserved next month. |
| FACT-01 | P1 | Both edit interests | Source pool includes both contributions; reopen rotates fact. |
| FACT-02 | P1 | Historic date-specific fact | Date and citation verified before displaying as fact. |
| DEX-01 | P1 | Opening + later autonomous cameo | Non-obstructive, context-correct, dismissible and lifecycled. |
| DEX-02 | P1 | Reduced motion / AI unavailable | Functional fallback; no critical workflow impairment. |
| PUSH-01 | P1 | Batch publish and urgent return | Generic vs specific copy correct, opt-in, partner in-app fallback. |
| UI-01 | P0 | 320/360/390/430 CSS px portrait and desktop | No sideways scrolling or unreadable/squashed interactions; rail adaptive. |
| UI-02 | P0 | Keyboard/screen reader-only use | Change views, read calendar event, add/edit draft, publish and inspect bills. |
| QA-01 | P0 | CI test and Pages deployment | Same source revision validated; Pages deployment success tied to intended commit. |
| QA-02 | P0 | Production auth/sync on physical devices | Never upgrade from test-harness proof to real-device claim without device evidence. |

### Required design QA artifacts for actual implementation

- Same-device, same-viewport reference-versus-implementation captures of Day, Week, Month.
- Screenshot/DOM assertions that hourly rules are straight and even (measure pixel top positions across 24 rows; no accumulated drift beyond rounding).
- Real-pointer and accessibility tests for switching modes without accidental edits or native-zoom traps.
- Test output plus visible evidence for owned draft vs counterpart published view.
- Responsive 320px smallest supported screen, 390px target, desktop, and physical installed iPhone/Android before production claim.
- No performance number claimed without matched measured scenario; avoid regressions in render length, touch latency and animation lifecycle.

---

## 15. Safe verification commands and environment assumptions

These commands are scoped to an **already checked-out clone** of the correct repository. Do NOT run destructive operations. Confirm Node and Python versions; current API tests require Node 22+ SQLite test support and local browser tests need Playwright plus Chromium.

```bash
# Read-only context; never assume HEAD will stay at the 2026-11-07 baseline.
git remote -v
git branch --show-current
git rev-parse HEAD
git status --short
git log -n 5 --oneline

# Existing Node validation that passed at the 2026-11-07 baseline:
node --check public/app.js
node --check public/sw.js
node --check worker/src/index.js
node --experimental-sqlite --test tests/api.test.mjs
node --test tests/sw.test.mjs

# Existing browser harness (requires Python Playwright and Chromium):
python3 tests/smoke_browser.py
python3 tests/e2e_app.py

# Preview static Pages shell locally (no private backend):
python3 -m http.server 8765 --directory public
```

`tests/e2e_app.py` uses an in-memory local adapter and is **not** proof of live Cloudflare or physical iPhone behavior. The existing CI workflow checks Node syntax and Node tests and deploys `public/`; expand it with build/gesture and screenshot checks when they become stable, while ensuring environment-specific physical tests remain a separate manual gate.

**Do not automatically execute** database creation, schema application, Worker deploy, GitHub remote rename, force operations, real password changes, public pushes or actions that could spend funds. Only use those after target-specific user authority and safety review.

---

## 16. External research / confirmed platform constraints

This is a bounded design/engineering scout, not a claim that a framework was selected. Links are primary documentation checked on 2026-11-07. A future implementer should refresh version-sensitive requirements.

1. **Pointer events and pinch handling**: MDN describes tracking two touch pointers for pinch and explains that native browser handling can issue `pointercancel`; CSS `touch-action` controls gesture ownership. Avoid globally disabling zoom. Sources: [MDN pinch gestures](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures), [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action).
2. **Gesture accessibility**: WCAG 2.2 requires alternatives for dragging and reasonable target sizes. Make Day/Week/Month buttons and form-based scheduling primary alternatives, not optional afterthoughts. Source: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/), especially 2.5.7 and 2.5.8.
3. **iOS Web Push**: Apple confirms standards-based Web Push on iOS/iPadOS 16.4+ Home Screen apps; permission must follow a direct user action. It is not guaranteed for arbitrary Safari tabs and requires service-worker/server work. Sources: [Apple Developer Web Push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers), [WebKit Web Push](https://webkit.org/blog/13878/).
4. **Worker/D1 setup and migrations**: Cloudflare documents D1 database binding/UUID creation and versioned SQL migrations. Prefer versioned migration scripts for schema expansion and check deployment cost/limits at execution. Sources: [D1 Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).
5. **GitHub rename caveat**: GitHub repo paths generally redirect after a rename but **project Pages URLs do not**. UI/product rename is safer to do before a separate authorized repo URL migration. Source: [GitHub repository rename docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository).

**Evidence-based recommendation:** keep the existing dependency-free PWA and tested private API boundary, adapt only the necessary calendar/view/gesture structure, preserve browser accessibility, and defer real account deployment until the UI is well tested and the authorized infrastructure is available. A gesture library or UI framework is an *experiment*, not a default dependency.

---

## 17. Known contradictions, risks, unknowns and safe decisions

| Topic | Conflict / uncertainty | Governing interpretation |
|---|---|---|
| App name | New user name `DEX_Cal`; code/repo still `DEX Scheduler` | UI/brand target is **DEX_Cal**. Actual repo slug remains old until independently authorized remote rename. |
| Status color | AI mockups show purple `Both Home` | **Reject:** purple means overlap of two away intervals only. |
| Day/week gesture | User says "pinch out" to see broader scope; native convention varies colloquially | Lock the Day -> Week -> Month result; measure physical gesture direction and give tab fallback. |
| Calendar orientation | Existing source has horizontal day tracks; selected design has vertical hourly paper | Redesign renderer while preserving source event values and draft/sync logic. |
| Screenshots | Fixed Monday Nov 10, sometimes implicitly 2026 | Fixtures only. Correct running calendar dates; Nov 10 Monday is 2025. |
| Calendar time coverage | Mockup shows 6am-midnight only | All 24 local hours accessible for real users; useful initial scroll permitted. |
| Month hour grid | Day/Week rules each represent an hour | Month keeps **paper aesthetic**, not false hour-scale; tap to view time details. |
| Accounts | Public shared word `Dexter`; role registration needs privacy | `Dexter` is ceremony; private per-person invite + backend auth controls access. |
| Real backend | Worker code exists but D1 id blank and API URL empty | Not deployed/connected. Do not claim real shared scheduling yet. |
| Bills | Shared attribution and personal totals | Household totals count shared bill once; allocation shares require explicit rule before showing "you owe". |
| UI `Tasks` | Mockup visually includes Tasks but discovery did not define task system | Do not ship dead or invented app; mark optional and ask only if required later. |
| Dexter images | Some mockups contain generic dog images | Not approved likeness; verify real Dexter references and actual reusable assets before new art. |
| Data date/time | Local JS epoch and timezone differences | Define TZ/overnight/DST policy and regression fixtures before migration. |
| Push | User wants notifications but mobile delivery may be denied | Best-effort OS push with in-app update fallback; no delivery guarantee. |
| AI | User wants silly Dexter commentary and possible meme maker | Core scheduler never depends on model, API key server-only, cost and privacy gated. |
| Historical discovery file | Says nothing had been built | Stale by design; live current repo/test evidence controls implementation status. |

### Public-release / privacy requirements

Never put actual household schedules, finances, notes, passwords, invite fragments, Worker secrets, auth logs, original private Dexter reference photos, or OpenAI keys in this public repo or generated asset previews. Use invented fixture data and sanitize documentation. Private Worker configuration stays separate. Inspect changes for sensitive patterns before pushing. A Pages deployment is public even if it starts with a `Dexter` welcome screen.

### Risk-ranked follow-ups

1. **Critical:** fake privacy if static site preview is mistaken for real auth; account claim if invite bypassed; draft leaks; concurrency overwrite.
2. **High:** gesture collisions with native zoom/long-press, miscolored overlap, midnight/timezone bugs, installed PWA caching across URL rename.
3. **High:** losing user drafts on re-render, stale API refresh, untested real iOS Web Push and offline error handling.
4. **Medium:** unreadable 7-column Week at 320px, bill recurrence errors, inaccurate historic trivia and stateful animation leaks.
5. **Medium:** generic Dexter art violating approved likeness; excessive AI calls exposing private data or costs.

### Questions that can wait until they genuinely block work

- Which Cloudflare account/billing limits can be authorized for production setup?
- For shared bills, should "your share" be 50/50, manually configured, or simply shown as a separate shared bucket? Keep current shared bucket until answered.
- Which physical two-finger direction feels intuitive for the requested Day -> Week -> Month view change? Test on-device rather than extending discovery chat.
- Should a full Tasks feature be created or the sample navigation item omitted until later?
- Are recurring away templates/copy-last-week necessary before first production use?
- Which real approved Dexter art/animations may be reused, and is AI meme image generation inside this app or only in its separate project?
- Exact OS bill reminder timing, private notification detail preferences and monthly AI spending cap.

None of these should block building the selected Day/Week/Month visual interface against fictional fixtures.

---

## 18. Change management, delivery and final verification contract

1. Treat prior commits and working assets as the baseline to preserve; inspect `git status` and full target diff, never wipe unrelated user edits. Do not force-push or silently rewrite the project's history.
2. For each accepted implementation phase, define failing behavior tests/screenshots first, implement the smallest coherent patch, run targeted tests then relevant regression suite and browser QA. Do not conflate a green test with real-device success.
3. Keep `Dex_Scheduler_bible.md` append-only. Record phase, branch/HEAD, changed files, test commands and outputs, user-visible behavior, deployment status, open risks and next action. The name of this existing Bible file is historical and not an automatic rename target.
4. Update `README.md`, `docs/SECURITY_AND_LIMITS.md`, PWA manifest, source and CI when corresponding code changes make old docs inaccurate. Don't claim features active merely because this plan names them.
5. Every deployment, if authorized, must cite exact commit, remote revision, test run and Pages/Worker evidence; verify production account/server separately from static Pages.
6. Never use screenshots that contain invented schedule data as evidence for personal live data; visual snapshots prove layout only.
7. Do not mark requirements complete if unverified on supported mobile devices. Keep explicit `PASS`, `PARTIAL`, `BLOCKED`, `NOT STARTED` classifications with evidence.
8. When a scope gate is blocked by service access, continue independent pre-backend work only within authorized tasks. Do not make up credentials or submit private data into public logs.
9. Limit each coding-agent pass to a defined slice and one bounded repair pass, except for severe security/data-integrity regressions which require correction or safe rollback before delivery. Stop adding optional polish once accepted scope is verified.
10. Final reports should be compact: actual status, user-visible difference, relevant changed paths, tests run, Git hashes, Pages/Worker state, remaining blockers and the next safe step. No self-congratulatory claims.

### Definition of Done for the **complete DEX_Cal product**

The project is not complete merely because GitHub Pages serves a pretty mockup. Completion requires **all explicitly user-decided** calendar and account behavior, a reliable production private sync service, correct Day/Week/Month ruled-paper navigation with touch and non-touch alternatives, shared bills, accurate shared-interest trivia, a likeness-approved and nonintrusive Dexter familiar, best-effort notification system with in-app fallback, security/privacy boundaries, and real Android/iPhone QA. Optional meme generation, complete Tasks module, GPS/home detection and broad finances do not belong to the core done definition unless separately authorized.

### Definition of Done for **this handoff artifact**

- This Markdown is saved in the existing repository, plus the four design references.
- The README names `DEX_Cal`, links to this handoff, and accurately states that the deployed runtime and repository have not yet been renamed.
- The append-only Bible records this documentation-only planning change and its evidence baseline.
- Repository source/test/deployment has **not** been changed under the guise of planning.
- The user can download an identical standalone copy of the Markdown and give it to another project; no secret conversation context is required.

---

## 19. Immediate next action for successor

**START WITH Phase 0.** Open the verified repository and this file. Check live HEAD and preserve any dirty work; run the existing six API tests, two service-worker tests and browser smoke; inspect the four reference images and the current `public/app.js` renderer. Then implement **Phase 1 and Phase 2 as the first authorized cohesive coding slice**: DEX_Cal portrait shell plus straight 24-hour ruled Day view, with accurate owner/overlap/draft semantics and UI regression proof. Do not use a backend deployment or repo rename as a prerequisite for this initial front-end slice. After the Day view is proven, extend the **same** calendar model into Week and Month with progressive pinch in Phase 3.

If you are asked only to plan, audit or summarize rather than implement, stop after providing an updated evidence-based plan. If implementation is explicitly authorized, do not ask the user to restate the discovery narrative; proceed within the newly authorized phase and ask only for genuine secrets/service permissions or mutually incompatible user decisions.

---

## Appendix A. Source proof and confidence ledger

| Claim | Classification | Evidence |
|---|---|---|
| Existing repo is `westkitty/Dex_Scheduler` and branch `main` was `386f917` at preparation | VERIFIED | GitHub `get_repo`, `commits/main`, recursive tree on 2026-11-07. |
| Existing API tests pass six cases | VERIFIED (local reconstruction) | Node 22.16.0 `node --experimental-sqlite --test tests/api.test.mjs` (6 pass, 0 fail). |
| Existing service-worker tests pass two cases | VERIFIED (local reconstruction) | `node --test tests/sw.test.mjs` (2 pass, 0 fail). |
| Existing browser preview works on desktop/mobile viewport smoke | VERIFIED (local Chromium) | `python3 tests/smoke_browser.py` exit 0; covers gate, preview, day/week, bills/trivia. |
| Current GitHub Pages CI deployment passed for original source | VERIFIED (CI history) | Run `42366806040` success on HEAD `386f917`. |
| Cloudflare private DB/Worker is live | **NOT VERIFIED; config indicates NOT CONNECTED** | `public/config.js` empty `apiBase`; `worker/wrangler.jsonc` placeholder ID. |
| Lined Day/Week/Month views and new pinches are implemented | **NO** | New mockups are visual references; current `public/app.js` has only horizontal Day/Week and no Month. |
| iOS/Android physical gesture and push works | **UNKNOWN/NOT TESTED** | No physical-device evidence present. |
| Dexter's real visual likeness has been integrated | **NO** | Current app has text cameo only; no approved reference asset proof. |
| App's final display branding is DEX_Cal | **USER-DECIDED, NOT IMPLEMENTED** | User's explicit rename; existing runtime HTML/manifest still old. |

## Appendix B. Decision and evidence precedence

For **user intent**: latest explicit corrections > selected master design and ruled mockup requirements > original product discovery > assistant suggestions. For **what is built**: current source/tests/CI and deployed readback > docs/Bible > prior assistant status claims > example screenshots. For **Dexter visuals**: actual user-approved reference bytes and verified character production gate > user-provided real photos > generic mockups. Unknown is not consent, a plan is not a commit, and a pretty screenshot is not functioning scheduling software.

**End of successor handoff. Start by verifying the current repository, not by reinventing the project.**
