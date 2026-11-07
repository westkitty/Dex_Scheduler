# Security boundaries and acceptance gates

## Public boundary

The repository and GitHub Pages artifacts are public. Never commit real household schedules, bill records, private notes, passwords, personal invite URLs, OpenAI API keys, Cloudflare account tokens, logs with credentials or private original Dexter reference images. The `public/` site contains only code and fictional preview records.

## Authentication flow

1. On app entry, ask for the shared word `Dexter`.
2. With a configured server, send it to the server's `/api/gate` endpoint. The server issues a short-lived single-use enrollment/login ticket; it does not grant user access.
3. Choose Andrew or Greyson.
4. If the identity is unclaimed, creating a password also requires that identity's **private setup secret** via a personally sent fragment link. Enrollment must be explicitly enabled on the Worker during a bounded setup window.
5. If already claimed, sign in with the individual password. The server checks the PBKDF2 digest and issues a random session bearer token. Only its hash is stored in D1.
6. A valid session is necessary for all personal and shared household data API routes.

The initial code is a UX ceremony, not a second authentication factor. Do not present it as a meaningful access restriction. If password reset is needed, use authenticated administrative backend repair, not a public reset endpoint.

## Ownership rules

- `/api/publish` and `/api/urgent` derive `role` strictly from validated session, never a body-supplied role.
- Schedule snapshots have a version counter; a conflicting publish returns HTTP 409 rather than overwriting newer publication.
- Drafts remain on the device only; publishing deliberately replaces the caller's own published schedule.
- Bills and interest pool are shared; interest editing is restricted to each person's own contribution.
- Optional notes and appointment labels should never enter generic push notifications or AI prompts.

## Not yet production-ready

- OS push notification delivery has not been implemented or validated.
- No independent professional security audit, recovery path, persistent monitoring or backend deployment has been performed.
- Some private drafts persist in localStorage until publishing/logout; shared-device physical access could expose them. Do not use untrusted/shared devices for sensitive drafts.
- Low-entropy shared bootstrap phrase does not secure enrollment; private tokens do. Disable enrollment after two accounts are claimed.
- Workers are public HTTPS APIs; CORS is a browser-origin policy, **not an authorization mechanism**. Always verify session ownership server-side.

## Minimum final device QA

- Two separate physical devices and two distinct accounts.
- Account takeover attempt with `Dexter` but without an invite must fail.
- Login with incorrect password must fail and be rate-limited.
- Unauthorized API reads must fail with 401.
- One person cannot publish or urgently edit the other's schedule.
- Drafts stay private until publish; a conflict never loses newer data.
- iOS installed-PWA push and Android installed-PWA push must each be tested separately when implemented.
- Sign out must revoke the current session and clear device drafts.
