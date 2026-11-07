# DEX Scheduler Project Bible

Append-only engineering record for `westkitty/Dex_Scheduler`. The README and source code remain the functional authority; this ledger records why changes were made and what was actually verified. Do not replace it with assumptions from a prior conversation.

## 2026-11-07 — Three-group reliability and personality uplift

### Source baseline

- **Authoritative remote:** `westkitty/Dex_Scheduler`, public, branch `main`, remote HEAD `3bef669fe9192dadb6d52e8eabdebe2cddaab59f` at inspection.
- **Verified inventory:** 21 published blobs (public PWA, Worker, D1 schema, tests, GitHub Pages workflow and docs); prior source was reconstructed from the six exact transport chunks and compared against the GitHub tree (19 non-README SHA matches; README transport differs by one trailing byte from remote).
- **Deployment baseline:** Pages workflow for `3bef669` succeeded; public frontend ships a sample-preview mode. No Cloudflare Worker/D1 service or Web Push connection was verified.
- **Baseline checks:** 6 of 6 Worker API tests passing; original Chromium smoke test passing at 1360 px and 390 px widths. Neither baseline test could establish production sync or push delivery.

### Product purpose and protected journeys

This is a small two-person Android/iPhone shared scheduling PWA, not a finance product or a tracking app. Andrew controls only Andrew's red availability; Greyson controls only Greyson's blue availability; overlap is purple. Home is *assumed*, never location-confirmed. Private drafts must remain private until confirmed Save & Sync; generic batch updates and specific urgent updates must be distinguishable. Shared scheduled bills and dated, sourced curiosities are intentional. Dexter is critical personality, not a substitute for reliable state.

Protect: public static shell never stores real credentials, server derives identity from authentication, two-person invite enrollment, own-schedule-only changes, revision checks, bill access behind sessions, clear preview boundaries, and safe sync. Never ship actual household events, passwords, tokens, OpenAI keys, approved private Dexter photos, or raw session logs to the public repository.

### Accepted improvement groups

1. **Calendar corrections** — Editable/removable own away blocks, accessible field labels, per-event pending tint instead of tinting all owner events, explicit discard action, more helpful next-out/expected-home summary.
2. **Trustworthy state and offline behavior** — Locally retained drafts after conflicts, explicit conflict resolution, urgent return draft rebase only when safe, warning on failed sync, last successful check, periodic refresh that does not destroy open form input, stale refresh protection, network-first versioned static cache excluding API calls.
3. **Daily habit and Dexter presence** — Shared-interest curiosity visible on the calendar, rotates across openings with the current day's date-specific facts considered first, fresh facts on request, context-aware Dexter remarks, quick opening interjection and later independent appearances. No likeness-sensitive art was generated or claimed approved.

### Verification artifacts and methods

- `node --check public/app.js`, `node --check public/sw.js`, `node --check worker/src/index.js`.
- `node --experimental-sqlite --test tests/api.test.mjs`: baseline role/auth/ownership/publish/bill guards.
- `node --test tests/sw.test.mjs`: network-first static update, offline fallback and **API never cached**. GitHub Pages deployment now waits for these Node checks to pass.
- `python3 tests/smoke_browser.py`: wrong-password gate, preview, day/week, bills/trivia at desktop and mobile viewport sizes.
- `python3 tests/e2e_app.py`: real Worker handler against an in-memory local-only SQLite adapter, two browser sessions, draft visibility, editing, removal, urgent return survival, conflicting concurrent sessions, rebase confirmation, first-open fact rotation, contextual cameo, outage warning and mobile overflow check. The browser test intentionally uses an in-memory fetch bridge due to local Chromium network restrictions; it does not prove an actual iOS or Android network connection.
- Screenshots for local before/after UX inspection were generated outside the repository. No fabricated frame rate, memory or network-latency improvement is claimed.

### Rejected, deferred or blocked work

- **BLOCKED by external setup:** real Cloudflare Worker/D1 deployment, private enrollment invites, real two-device production sync. Do not promise this is working on Pages today.
- **DEFERRED:** OS push notifications, backend AI/trivia generation and fact verification pipeline, Dexter image-reference/animated likeness integration, secure password recovery, bill edit/delete, overnight away-block creation, data export, and real device PWA installation/pinch testing.
- **AVOID:** uploading private handoff details or sample passwords as if they were live credentials; simulating real sync; fake live-location badges; arbitrary cosmic horror motifs in a practical household schedule.

### Resumption instruction

Before another coding pass, read the current remote HEAD/tree, README, this ledger, `docs/SECURITY_AND_LIMITS.md` and the tests. The first external dependency to resolve is Cloudflare ownership/credentials and private backend deployment. Never discard unpublished local user edits or override a published revision silently. Use separate staging and verify GitHub Actions Pages deployment from the exact pushed revision.

### Implementation commit and CI receipt

- **Remote implementation SHA:** `51011693cb312add5829f00b9f9761beef150120` on `westkitty/Dex_Scheduler` `main` (GitHub tree `91705a346c9a0e2d44f769e6fb19cb604c6d56fb`).
- **GitHub Actions receipt:** [run 42366722513](https://github.com/westkitty/Dex_Scheduler/actions/runs/42366722513) completed successfully. Both `verify` (Node syntax, API, service-worker tests) and `deploy` (GitHub Pages) jobs succeeded for that exact implementation commit.
- **Remaining external blocker:** the private Cloudflare Worker/D1 is *not* deployed; the publicly reachable Pages frontend still labels itself sample preview. Automated tests do not prove real phone push notifications or real two-device Cloudflare sync.
- **This ledger receipt update** is a documentation-only follow-up; it does not alter published app code.

## 2026-11-07 - DEX_Cal successor handoff and portrait design lock

### Authority, design and current repository state

- The user changed the **product name** to `DEX_Cal`. As of this entry, the real repo remains `westkitty/Dex_Scheduler`, `main` baseline `386f91773328f836382dfbdbfe98374d6482cddd`; the Pages URL remains `https://westkitty.github.io/Dex_Scheduler/`. No GitHub repository/Pages URL rename, Worker deployment or runtime UI rebuild has been performed by this documentation task.
- The user explicitly selected one **portrait phone** charcoal-and-turquoise calendar image, then requested **one straight notebook-paper rule for each hour**, full **seven-column Week** and **Month** with progressive Day -> Week -> Month pinch zoom. `Both home` must **never** render as purple; purple means simultaneous *away* windows only.
- Checked-in handoff: `docs/DEX_CAL_IMPLEMENTATION_HANDOFF.md` and its four visual refs in `docs/design-references/`, plus an updated root README and design-reference README. The original historical discovery handoff was examined but not publicly copied; it predates the built project and contains stale 'not built' language.
- Purpose and privacy protected: two roles `andrew`/`greyson`, separate private personal passwords/invites, weak shared `Dexter` entry ceremony, assumed-home-not-GPS, local private drafts until deliberate publish, 409 conflict preservation, urgent-only change path, generic batch messages and specific urgent alert semantics, shared-bill total once, accurate fact sources and optional non-blocking Dexter. Do not place household secrets/private photos in public GitHub.

### Verification performed for planning (not a redesign implementation)

- Live GitHub tree/repo/CI inspected and every locally reconstructed source blob SHA matched the remote tree on the baseline.
- Node 22.16.0: `node --check public/app.js`, `node --check worker/src/index.js`, `node --experimental-sqlite --test tests/api.test.mjs` (6/6 pass), `node --test tests/sw.test.mjs` (2/2 pass). Chromium Playwright `python3 tests/smoke_browser.py` PASS at original desktop/mobile preview journey. Previous remote GitHub Actions run `42366806040` succeeded at baseline `386f917`. These prove only the **old** interface/backend harness.
- Scoped external documentation check: MDN pinch/touch-action behavior, WCAG 2.2 non-drag alternatives, Apple iOS home-screen Web Push, Cloudflare D1 migrations and GitHub Pages URL caveat after repo rename. Sources linked inside the new handoff.

### Next authorized work and known blockers

- Begin with `docs/DEX_CAL_IMPLEMENTATION_HANDOFF.md`, verify current HEAD and preserve user changes; implement Phase 1-2 portrait shell/true ruled Day, then Phase 3 seven-column Week/Month/multilevel gestures with real phone tests. This documentation entry is **not authority** for future commits, deployments, paid services, remote rename or canonical likeness generation.
- Cloudflare Worker/D1 and real accounts remain unconfigured (`public/config.js` `apiBase` empty, `worker/wrangler.jsonc` placeholder ID). Real iPhone/Android sync, push, production AI and approved animated Dexter likeness remain unverified/unbuilt as listed in handoff.
- A future implementation team must preserve old published schedule data, source APIs, local drafts, release path and the *append-only* nature of this Bible, and must not treat static example schedule labels as real household data.
