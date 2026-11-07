# DEX_Cal (formerly DEX Scheduler)

A two-person PWA for **Andrew and Greyson**, designed for Android and iPhone. The user-selected product name is **DEX_Cal**; the current shipped app, GitHub repository slug and Pages URL still use the older **DEX Scheduler** branding until a future authorized migration. It combines planned away times, scheduled bills, trivia and Dexter's judgmental commentary.


## Implementation handoff and selected portrait design (November 7, 2026)

**Use [`docs/DEX_CAL_IMPLEMENTATION_HANDOFF.md`](docs/DEX_CAL_IMPLEMENTATION_HANDOFF.md) as the successor-AI development contract and complete build plan.** It includes the copy-ready handoff prompt, verified repository state, privacy and non-regression constraints, staged implementation sequence, acceptance matrix, safe commands and open questions.

The chosen design references are committed under [`docs/design-references/`](docs/design-references/README.md): a user-selected portrait phone UI and the later requested Day, Week and Month ruled-paper mockups. The intended new calendar has **one straight hour line per hour** in Day and Week, a real **seven-column Week**, a true **Month** and progressive pinch **Day -> Week -> Month** (with visible button alternatives). **These views and the new DEX_Cal runtime branding are NOT yet implemented.** Existing horizontal day/week tracks remain in the live preview.

**Source baseline for the handoff:** `main` at `386f91773328f836382dfbdbfe98374d6482cddd` before the documentation-only handoff update. The repository and Pages URL have **not** been renamed. GitHub documents that project Pages URLs do not automatically redirect after repository renames; see the migration guardrails in the handoff.

The recommended *next authorized implementation slice* is **Phase 0-2: verify current HEAD, preserve/test the existing two-person source, build the portrait DEX_Cal shell and a true vertical 24-hour lined Day calendar**. Then add the full seven-column Week, Month and progressive pinch in Phase 3. Cloudflare deployment comes after the safe pre-backend UI/rehearsal work unless newly authorized otherwise.

> **Current state: initial implementation, not a production-ready household service.** The GitHub Pages frontend is a public static shell. Until a separate private API/database is configured, it intentionally runs **sample preview only** and never pretends to create real accounts or sync sensitive schedules.

## Current features

- Entry screen asks for the shared word **`Dexter`** (exact capitalization).
- Two fixed identities: **Andrew** (red) and **Greyson** (blue), with separate passwords and immutable role assignment on the private backend.
- A personal registration setup link is required for each person. An outsider who guesses `Dexter` must **not** be able to seize the accounts.
- Existing accounts sign in with their own passwords. Session tokens are validated by the private backend, never GitHub Pages.
- A combined day/week timeline showing published red/blue/purple away times, *per-block* lighter unpublished draft coloring, and explicit **Save & Sync**.
- **Editable and removable away blocks**, including published blocks edited privately before batch publication. Discard-all-drafts is confirmed.
- Revision-checked publication, preservation of drafts on conflict/reload, explicit confirmation before resolving conflicts, and an independent **Coming home early** action that preserves unrelated drafts. In-app publication/urgent update feed.
- **Visible sync health** and a last-checked stamp; background refresh does not discard text being entered into open forms.
- Shared scheduled monthly/one-time bills, paid dates and monthly attributed totals (shared bills counted once).
- A small curated, sourced daily curiosity collection, visible on the calendar and rotated with each opening; interests from both people contribute to the same pool.
- Quick opening Dexter commentary plus occasional contextual, independently timed interjections. The familiar is still a **text cameo placeholder**. No likeness-dependent assets have been imported or represented as approved artwork.

### Not yet working in production

- **Backend deployment / personal accounts / cross-device sync:** requires the Cloudflare Worker + D1 setup below and a real private configuration URL.
- **OS push notifications:** not implemented. The in-app update feed exists, but iPhone/Android push subscription, VAPID and delivery must be separately completed and tested on installed PWAs.
- **OpenAI-powered commentary, generated trivia or meme images:** not yet integrated. No API key is in the frontend.
- **Verified Dexter animated likeness:** pending genuine reference/asset approval and mobile animation testing. The displayed cameo is text-only.
- **Full visual/pinch/gesture mobile QA:** day/week toggle and first-pass long-press interaction exist; basic Chromium desktop/mobile browser QA passes, but physical Android/iPhone gesture and install tests remain necessary.
- **Bill editing/deletion, overnight away entry, password recovery and data export:** not yet provided; do not treat the current app as a complete household system.
- **Offline multi-device publishing:** drafts can survive local restart; remote publication requires connectivity. On logout, this device's private drafts are erased.

## Repository layout

```
public/                Static, installable PWA for GitHub Pages
  index.html           Entry + application host
  app.js               Client state/UX; never contains secrets
  config.js            Public API URL only (empty until backend exists)
  facts.js             Small curated fallback fact collection
  styles.css           Mobile-first appearance
  sw.js                Network-first static shell cache, no private API caching or push
worker/
  src/index.js         Cloudflare Worker private API / authentication
  schema.sql           D1 schema
  wrangler.jsonc       Template; database ID needs configuring
  # .dev.vars.example is NOT currently present in the verified remote tree.
.github/workflows/pages.yml  GitHub Pages deployment workflow
```

## GitHub Pages deployment

The repository workflow runs Node syntax/API/service-worker checks before publishing **only** `public/` to Pages after a push to `main`. It does not upload `worker/`, scripts or documentation as public site assets.

**Current source deployment is verified:** GitHub Actions run [42366806040](https://github.com/westkitty/Dex_Scheduler/actions/runs/42366806040) succeeded for the baseline `386f917`. For an independent fork/new repo, Pages source setup may still be needed (Settings > Pages > Build and deployment > GitHub Actions).

The intended URL is `https://westkitty.github.io/Dex_Scheduler/` after a successful Pages deployment. **Do not assume it is live until a successful deploy and HTTP readback are observed.**

## Private account backend (Cloudflare Worker + D1)

GitHub Pages cannot securely store personal passwords or run a private database. The Worker is separate from Pages. Setup requires **your own Cloudflare account**, a newly created D1 database and protected Worker secrets. Never commit any passwords or invite tokens.

1. From `worker/`, run `npx wrangler login` and `npx wrangler d1 create dex-scheduler`. Record the returned D1 database UUID in `worker/wrangler.jsonc` as `database_id`.
2. Apply the schema to the **correct** D1 database: `npx wrangler d1 execute dex-scheduler --remote --file=schema.sql`. Verify the target and avoid applying it to an existing unrelated database.
3. Generate **two different** long random hex strings, e.g. `openssl rand -hex 32`. Store them **only as Worker secrets** using `npx wrangler secret put INVITE_ANDREW` and `npx wrangler secret put INVITE_GREYSON`. Create a third random `RATE_PEPPER` secret. Keep these values private.
4. The shared entry password defaults to **`Dexter`** on the backend, matching the requested first screen. It is **not** a meaningful access control; the personal invite tokens and individual passwords are. If you change it, set `ENTRY_PASSWORD` as a Worker secret.
5. For a **short setup window**, change `ENROLLMENT_ENABLED` in `worker/wrangler.jsonc` from `false` to `true`, and deploy with `npx wrangler deploy`. After both accounts are created, change it back to `false` and redeploy. Never leave enrollment enabled unnecessarily.
6. Give each person their own private setup URL using a **fragment** (not a query string), for example:
   - `https://westkitty.github.io/Dex_Scheduler/#invite=<ANDREW_RANDOM_INVITE>`
   - `https://westkitty.github.io/Dex_Scheduler/#invite=<GREYSON_RANDOM_INVITE>`
   The fragment is removed from the browser URL and retained only for setup. Do not post these URLs publicly.
7. Each person opens their private setup URL, enters **Dexter**, selects their own identity and creates a password (at least 10 characters). After both are registered, normal sign-in requires the shared entry word then the individual's password. Sessions are remembered on each device until expiry/sign-out.
8. Change **only** the public `apiBase` URL in `public/config.js` to your deployed Worker's HTTPS origin, commit/push the config change, and verify that the PWA can reach `/api/status`, enroll both accounts, and publish/read schedules from two independent devices.

**Security limits:** The service uses server-side PBKDF2 hashes, limited password attempts, non-reversible bearer-session hashes, scoped role writes, independent enrollment tokens and CORS restricted to the Pages origin. It does *not* yet include MFA, a self-service forgotten-password recovery flow, a security audit, production monitoring or encrypted client-side draft storage. Its current 30-day session bearer token persists in browser storage; use a trusted device and do not install untrusted extensions. For production accounts, prefer a careful security review and an admin-controlled password recovery plan before storing sensitive details.

If `apiBase` is empty, the site does **not** accept real accounts: only sample preview, with explicitly fictional schedules/bills. This prevents a fake security gate from exposing personal data.

## Development and tests

Requires Node.js 22+ for the built-in SQLite test adapter. No npm install is required for the static frontend or Node tests. Python browser tests additionally require `playwright` and a local Chromium executable at `/usr/bin/chromium`. `tests/e2e_app.py` exercises the real Worker handler and two separately authenticated browser sessions using a local-only in-memory SQLite API bridge; it does not contact Cloudflare or demonstrate deployed sync.

```sh
node --check public/app.js
node --check worker/src/index.js
node --experimental-sqlite --test tests/api.test.mjs
node --test tests/sw.test.mjs
python3 tests/smoke_browser.py
python3 tests/e2e_app.py
python3 -m http.server 8765 --directory public
```

After starting the local server, visit `http://localhost:8765/` to inspect the entry flow and sample preview. Password for the **preview** gate is `Dexter`.

**Important:** Do not use GitHub Pages or browser `localStorage` as the primary security mechanism. The shared entry password is explicitly only a welcome step. The Worker validates real credentials and enforces two-person access.

## Product decisions preserved

- Default status is *assumed home* unless the person schedules an away block; never imply live presence.
- Combined timeline: red Andrew, blue Greyson, purple overlap; lighter private drafts and darker published segments.
- Each person edits only their own schedule. Save & Sync is explicit; partner sees last published version until then.
- Each successful batch publish creates **one generic** recipient update. Urgent arrival corrections create a **specific** recipient update and do not publish unrelated drafts.
- Edited but unchanged published blocks remain dark; only unpublished changes go pale. Conflicts retain local drafts and require explicit review before publication.
- Bills are shared records. Separate spending totals cover **scheduled bills only**, not everyday expenses.
- Daily trivia uses a shared interest pool and may be date-specific or general.
- Dexter may appear independently inside the app, but no GPS tracking or native phone companion is planned for the initial version.

**Priority for the next implementation pass:** follow the new DEX_Cal [handoff](docs/DEX_CAL_IMPLEMENTATION_HANDOFF.md): selected portrait design and Day/Week/Month ruled-paper calendar with progressive pinch, test stable drafts/ownership and rehearsal UX, then deploy the private D1/Worker with explicit user infrastructure authority. Web Push, validated Dexter animation and optional server-side AI are later gated phases. Until a real Worker is deployed and configured, the public Pages build remains clearly labeled preview only.
