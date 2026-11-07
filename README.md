# DEX Scheduler

A two-person PWA for **Andrew and Greyson**, designed for Android and iPhone. It combines planned away times, a shared scheduled-bills view, a sourced curiosity panel and Dexter's famously unimpressed commentary.

> **Current state: initial implementation, not a production-ready household service.** The GitHub Pages frontend is a public static shell. Until a separate private API/database is configured, it intentionally runs **sample preview only** and never pretends to create real accounts or sync sensitive schedules.

## Current features

- Entry screen asks for the shared word **`Dexter`** (exact capitalization).
- Two fixed identities: **Andrew** (red) and **Greyson** (blue), with separate passwords and immutable role assignment on the private backend.
- A personal registration setup link is required for each person. An outsider who guesses `Dexter` must **not** be able to seize the accounts.
- Existing accounts sign in with their own passwords. Session tokens are validated by the private backend, never GitHub Pages.
- A combined day/week timeline showing published red/blue/purple away times, creation of local private drafts, and an explicit **Save & Sync** publish action.
- Owner-only schedule updates, revision-checked publication, and an independent **Coming home early** action. In-app publish/urgent update feed.
- Shared scheduled monthly/one-time bills, paid dates and monthly attributed totals (shared bills counted once).
- A small curated, sourced daily curiosity collection; interests from both people contribute to the same pool.
- Lightweight Dexter **text cameo placeholder**. No likeness-dependent assets have been imported or represented as approved artwork.

### Not yet working in production

- **Backend deployment / personal accounts / cross-device sync:** requires the Cloudflare Worker + D1 setup below and a real private configuration URL.
- **OS push notifications:** not implemented. The in-app update feed exists, but iPhone/Android push subscription, VAPID and delivery must be separately completed and tested on installed PWAs.
- **OpenAI-powered commentary, generated trivia or meme images:** not yet integrated. No API key is in the frontend.
- **Verified Dexter animated likeness:** pending genuine reference/asset approval and mobile animation testing. The displayed cameo is text-only.
- **Full visual/pinch/gesture mobile QA:** day/week toggle and first-pass long-press interaction exist; device-level verification remains necessary.
- **Offline multi-device publishing:** drafts can survive local restart; remote publication requires connectivity. On logout, this device's private drafts are erased.

## Repository layout

```
public/                Static, installable PWA for GitHub Pages
  index.html           Entry + application host
  app.js               Client state/UX; never contains secrets
  config.js            Public API URL only (empty until backend exists)
  facts.js             Small curated fallback fact collection
  styles.css           Mobile-first appearance
  sw.js                Offline shell cache (no push yet)
worker/
  src/index.js         Cloudflare Worker private API / authentication
  schema.sql           D1 schema
  wrangler.jsonc       Template; database ID needs configuring
  .dev.vars.example    Template for local-only secret names
.github/workflows/pages.yml  GitHub Pages deployment workflow
```

## GitHub Pages deployment

The repository workflow publishes **only** `public/` to Pages after a push to `main`. It does not upload `worker/`, scripts or documentation as public site assets.

**First-time setup is a separate repository admin action:** open **Settings → Pages → Build and deployment → Source: GitHub Actions**. The included `configure-pages` action cannot initially enable Pages with the workflow's standard `GITHUB_TOKEN`; see the [GitHub Pages publishing source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

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

Requires Node.js 22+ for built-in SQLite test adapter. No npm install is required for the static frontend or unit/integration tests.

```sh
node --check public/app.js
node --check worker/src/index.js
node --experimental-sqlite --test tests/api.test.mjs
python3 -m http.server 8765 --directory public
```

After starting the local server, visit `http://localhost:8765/` to inspect the entry flow and sample preview. Password for the **preview** gate is `Dexter`.

**Important:** Do not use GitHub Pages or browser `localStorage` as the primary security mechanism. The shared entry password is explicitly only a welcome step. The Worker validates real credentials and enforces two-person access.

## Product decisions preserved

- Default status is *assumed home* unless the person schedules an away block; never imply live presence.
- Combined timeline: red Andrew, blue Greyson, purple overlap; lighter private drafts and darker published segments.
- Each person edits only their own schedule. Save & Sync is explicit; partner sees last published version until then.
- Each successful batch publish creates **one generic** recipient update. Urgent arrival corrections create a **specific** recipient update and do not publish unrelated drafts.
- Bills are shared records. Separate spending totals cover **scheduled bills only**, not everyday expenses.
- Daily trivia uses a shared interest pool and may be date-specific or general.
- Dexter may appear independently inside the app, but no GPS tracking or native phone companion is planned for the initial version.

**Priority for the next implementation pass:** finish and deploy the private backend, configure Pages, then add cross-platform Web Push, test on real Android/iPhone installed PWAs, and connect verified Dexter assets and server-side AI at a deliberate cost cap.