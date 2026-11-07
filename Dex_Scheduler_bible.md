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

### Implementation commit

_To be appended after an actual remote commit and verification. No commit SHA is predicted._
