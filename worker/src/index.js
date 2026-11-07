// DEX Scheduler API — deploy separately from GitHub Pages; no credential enters the public repo.
const ROLES = new Set(['andrew', 'greyson']);
const encoder = new TextEncoder();
const ITERATIONS = 240_000;
const SESSION_DAYS = 30;
const MAX_EVENTS = 350;

const nowIso = () => new Date().toISOString();
const millis = () => Date.now();
const otherRole = role => role === 'andrew' ? 'greyson' : 'andrew';
const displayName = role => role === 'andrew' ? 'Andrew' : 'Greyson';
const roleValid = role => ROLES.has(role);

function bytesToHex(bytes) { return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''); }
function randomToken() { return bytesToHex(crypto.getRandomValues(new Uint8Array(32))); }
async function hash(value) { return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))); }
function constantTimeEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
}
async function passwordDigest(password, salt, iterations = ITERATIONS) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const key = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' }, material, 256);
  return bytesToHex(new Uint8Array(key));
}
function json(value, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
function fail(status, message) { return json({ error: message }, status); }
function safeDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T12:00:00Z`).getTime()) && new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s; }
function safeBodyObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }
async function readBody(request) {
  const raw = await request.text();
  if (raw.length > 52_000) throw new Error('Request too large');
  const body = JSON.parse(raw);
  if (!safeBodyObject(body)) throw new Error('Expected a JSON object');
  return body;
}
async function auth(request, env) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
  if (!token) return null;
  const match = await env.DB.prepare('SELECT role FROM sessions WHERE token_hash = ? AND expires_at > ?').bind(await hash(token), millis()).first();
  return match?.role || null;
}
async function newSession(role, env) {
  const token = randomToken();
  await env.DB.prepare('INSERT INTO sessions (token_hash, role, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(await hash(token), role, millis() + SESSION_DAYS * 86_400_000, nowIso()).run();
  return token;
}
async function validTicket(ticket, env) {
  if (typeof ticket !== 'string' || !/^[a-f0-9]{64}$/i.test(ticket)) return false;
  return Boolean(await env.DB.prepare('SELECT token_hash FROM entry_tickets WHERE token_hash = ? AND expires_at > ?').bind(await hash(ticket), millis()).first());
}
async function throttle(request, env, key) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const bucket = await hash(`${env.RATE_PEPPER || env.ENTRY_PASSWORD || 'Dexter'}:${ip}:${key}`);
  const previous = await env.DB.prepare('SELECT attempts, window_start FROM auth_attempts WHERE bucket = ?').bind(bucket).first();
  const now = millis();
  if (previous && previous.window_start > now - 15 * 60_000 && previous.attempts >= 8) return false;
  if (!previous || previous.window_start <= now - 15 * 60_000) {
    await env.DB.prepare('INSERT INTO auth_attempts (bucket, attempts, window_start) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = 1, window_start = excluded.window_start').bind(bucket, now).run();
  } else await env.DB.prepare('UPDATE auth_attempts SET attempts = attempts + 1 WHERE bucket = ?').bind(bucket).run();
  return true;
}
function normalizedEvents(value) {
  if (!Array.isArray(value) || value.length > MAX_EVENTS) throw new Error('Invalid schedule');
  const unique = new Set();
  return value.map(item => {
    if (!safeBodyObject(item) || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) || unique.has(item.id)) throw new Error('Invalid schedule ID');
    unique.add(item.id);
    const start = Number(item.start), end = Number(item.end);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end <= start || end - start > 30 * 86_400_000) throw new Error('Invalid start/end');
    const label = String(item.label || '').trim();
    if (label.length > 100) throw new Error('Label too long');
    return { id: item.id, start, end, label };
  }).sort((a, b) => a.start - b.start);
}
async function schedules(env) {
  const entries = await env.DB.prepare('SELECT role, revision, events_json, updated_at FROM schedules ORDER BY role').all();
  const output = {};
  for (const entry of entries.results) output[entry.role] = { revision: entry.revision, events: JSON.parse(entry.events_json), updatedAt: entry.updated_at };
  return output;
}
async function requireSession(request, env) { return auth(request, env); }
function acceptedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  return !origin || origin === (env.APP_ORIGIN || 'https://westkitty.github.io');
}
function withCors(response, request, env) {
  const h = new Headers(response.headers);
  const origin = request.headers.get('Origin');
  if (origin && acceptedOrigin(request, env)) { h.set('Access-Control-Allow-Origin', origin); h.set('Vary', 'Origin'); }
  h.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  h.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  return new Response(response.body, { status: response.status, headers: h });
}

async function processRequest(request, env) {
  if (!env.DB) return fail(503, 'Private database is not configured');
  if (!acceptedOrigin(request, env)) return fail(403, 'Origin not allowed');
  const u = new URL(request.url), path = u.pathname.replace(/\/$/, '') || '/';
  const method = request.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204 });
  if (method === 'GET' && path === '/api/status') {
    const identities = await env.DB.prepare('SELECT role FROM identities').all();
    return json({ configured: true, claimed: identities.results.map(x => x.role), enrollmentEnabled: env.ENROLLMENT_ENABLED === 'true' });
  }
  if (method === 'POST' && path === '/api/gate') {
    if (!await throttle(request, env, 'gate')) return fail(429, 'Too many attempts. Try later.');
    const body = await readBody(request);
    // The user-requested "Dexter" is a welcome code, NOT the security boundary.
    if (!constantTimeEq(body.password, env.ENTRY_PASSWORD || 'Dexter')) return fail(401, 'Incorrect entry password');
    const ticket = randomToken();
    await env.DB.prepare('INSERT INTO entry_tickets (token_hash, expires_at) VALUES (?, ?)').bind(await hash(ticket), millis() + 10 * 60_000).run();
    return json({ ticket });
  }
  if (method === 'POST' && path === '/api/enroll') {
    if (env.ENROLLMENT_ENABLED !== 'true') return fail(403, 'Enrollment is closed');
    if (!await throttle(request, env, 'enroll')) return fail(429, 'Too many attempts. Try later.');
    const b = await readBody(request);
    if (!roleValid(b.role) || typeof b.password !== 'string' || b.password.length < 10 || b.password.length > 128) return fail(400, 'Choose a role and a password of at least 10 characters');
    if (!await validTicket(b.ticket, env)) return fail(403, 'Entry expired. Start again.');
    const expectedInvite = b.role === 'andrew' ? env.INVITE_ANDREW : env.INVITE_GREYSON;
    if (!expectedInvite || expectedInvite.length < 24 || !constantTimeEq(b.invite, expectedInvite)) return fail(403, 'Personal setup link is missing or incorrect');
    const salt = randomToken();
    const passwordHash = await passwordDigest(b.password, salt);
    const add = await env.DB.prepare('INSERT OR IGNORE INTO identities (role, salt, password_hash, iterations, created_at) VALUES (?, ?, ?, ?, ?)').bind(b.role, salt, passwordHash, ITERATIONS, nowIso()).run();
    if (!add.meta.changes) return fail(409, 'This account has already been created');
    await env.DB.batch([
      env.DB.prepare('INSERT OR IGNORE INTO schedules (role, revision, events_json) VALUES (?, 0, ?)').bind(b.role, '[]'),
      env.DB.prepare('DELETE FROM entry_tickets WHERE token_hash = ?').bind(await hash(b.ticket))
    ]);
    return json({ role: b.role, token: await newSession(b.role, env) }, 201);
  }
  if (method === 'POST' && path === '/api/login') {
    if (!await throttle(request, env, 'login')) return fail(429, 'Too many attempts. Try later.');
    const b = await readBody(request);
    if (!roleValid(b.role) || typeof b.password !== 'string' || !await validTicket(b.ticket, env)) return fail(401, 'Incorrect credentials');
    const row = await env.DB.prepare('SELECT salt, password_hash, iterations FROM identities WHERE role = ?').bind(b.role).first();
    if (!row) return fail(401, 'Incorrect credentials');
    const digest = await passwordDigest(b.password, row.salt, row.iterations);
    if (!constantTimeEq(digest, row.password_hash)) return fail(401, 'Incorrect credentials');
    await env.DB.prepare('DELETE FROM entry_tickets WHERE token_hash = ?').bind(await hash(b.ticket)).run();
    return json({ role: b.role, token: await newSession(b.role, env) });
  }
  const role = await requireSession(request, env);
  if (!role) return fail(401, 'Sign in to continue');
  if (method === 'GET' && path === '/api/me') return json({ role });
  if (method === 'POST' && path === '/api/logout') {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await hash(token)).run();
    return json({ ok: true });
  }
  if (method === 'GET' && path === '/api/state') {
    const [s, bills, payments, feed, topics] = await Promise.all([
      schedules(env),
      env.DB.prepare('SELECT * FROM bills ORDER BY due_date').all(),
      env.DB.prepare('SELECT * FROM bill_payments ORDER BY occurrence_date DESC LIMIT 800').all(),
      env.DB.prepare('SELECT * FROM activity WHERE target = ? ORDER BY created_at DESC LIMIT 60').bind(role).all(),
      env.DB.prepare('SELECT role, tags_json FROM interests ORDER BY role').all()
    ]);
    return json({ role, schedules: s, bills: bills.results, payments: payments.results, activity: feed.results, interests: topics.results.map(r => ({ role: r.role, tags: JSON.parse(r.tags_json) })) });
  }
  if (method === 'POST' && path === '/api/publish') {
    const b = await readBody(request);
    if (!Number.isInteger(b.baseRevision) || b.baseRevision < 0) return fail(400, 'Invalid revision');
    const items = normalizedEvents(b.events);
    const newJson = JSON.stringify(items), timestamp = nowIso();
    const update = await env.DB.batch([
      env.DB.prepare('UPDATE schedules SET events_json = ?, revision = revision + 1, updated_at = ? WHERE role = ? AND revision = ?').bind(newJson, timestamp, role, b.baseRevision),
      env.DB.prepare('INSERT INTO activity (id, actor, target, type, message, created_at) SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM schedules WHERE role = ? AND revision = ? AND events_json = ?)')
        .bind(crypto.randomUUID(), role, otherRole(role), 'batch', `${displayName(role)} updated their schedule.`, timestamp, role, b.baseRevision + 1, newJson)
    ]);
    if (!update[0].meta.changes) return fail(409, 'The published schedule changed. Refresh and review before publishing again.');
    return json({ revision: b.baseRevision + 1, updatedAt: timestamp });
  }
  if (method === 'POST' && path === '/api/urgent') {
    const b = await readBody(request);
    if (typeof b.id !== 'string' || !Number.isSafeInteger(b.newEnd)) return fail(400, 'Invalid urgent change');
    const row = await env.DB.prepare('SELECT revision, events_json FROM schedules WHERE role = ?').bind(role).first();
    if (!row) return fail(404, 'Schedule not found');
    const events = JSON.parse(row.events_json), target = events.find(e => e.id === b.id);
    if (!target) return fail(404, 'Only your published events can be changed');
    if (b.newEnd <= target.start || b.newEnd >= target.end) return fail(400, 'New arrival must be earlier than the previously published return time');
    target.end = b.newEnd;
    const normalized = JSON.stringify(normalizedEvents(events));
    const timestamp = nowIso(), shownTime = new Date(b.newEnd).toISOString();
    const update = await env.DB.batch([
      env.DB.prepare('UPDATE schedules SET events_json = ?, revision = revision + 1, updated_at = ? WHERE role = ? AND revision = ?').bind(normalized, timestamp, role, row.revision),
      env.DB.prepare('INSERT INTO activity (id, actor, target, type, message, created_at) SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM schedules WHERE role = ? AND revision = ? AND events_json = ?)')
        .bind(crypto.randomUUID(), role, otherRole(role), 'urgent', `${displayName(role)} is coming home early. New arrival: ${shownTime}.`, timestamp, role, row.revision + 1, normalized)
    ]);
    if (!update[0].meta.changes) return fail(409, 'Schedule changed while saving; refresh and retry.');
    return json({ revision: row.revision + 1, updatedAt: timestamp });
  }
  if (method === 'POST' && path === '/api/bills') {
    const b = await readBody(request);
    const title = String(b.title || '').trim();
    if (!title || title.length > 90 || !Number.isSafeInteger(b.amountCents) || b.amountCents < 0 || b.amountCents > 100_000_000 || !['andrew', 'greyson', 'shared'].includes(b.owner) || !safeDate(b.dueDate) || !['none', 'monthly'].includes(b.recurrence)) return fail(400, 'Invalid bill');
    const id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO bills (id, title, amount_cents, owner, due_date, recurrence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, title, b.amountCents, b.owner, b.dueDate, b.recurrence, nowIso()).run();
    return json({ id }, 201);
  }
  const billMatch = path.match(/^\/api\/bills\/([a-f0-9-]+)\/payment$/i);
  if (billMatch && (method === 'POST' || method === 'DELETE')) {
    const b = await readBody(request);
    if (!safeDate(b.occurrenceDate)) return fail(400, 'Invalid occurrence date');
    const bill = await env.DB.prepare('SELECT id FROM bills WHERE id = ?').bind(billMatch[1]).first();
    if (!bill) return fail(404, 'Bill not found');
    if (method === 'POST') {
      if (!safeDate(b.paidDate)) return fail(400, 'Invalid paid date');
      await env.DB.prepare('INSERT INTO bill_payments (bill_id, occurrence_date, paid_date, paid_by, recorded_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(bill_id, occurrence_date) DO UPDATE SET paid_date = excluded.paid_date, paid_by = excluded.paid_by, recorded_at = excluded.recorded_at').bind(bill.id, b.occurrenceDate, b.paidDate, role, nowIso()).run();
    } else await env.DB.prepare('DELETE FROM bill_payments WHERE bill_id = ? AND occurrence_date = ?').bind(bill.id, b.occurrenceDate).run();
    return json({ ok: true });
  }
  if (method === 'PUT' && path === '/api/interests') {
    const b = await readBody(request);
    if (!Array.isArray(b.tags) || b.tags.length > 20 || b.tags.some(x => typeof x !== 'string' || x.trim().length < 1 || x.trim().length > 35)) return fail(400, 'Invalid interests');
    const tags = [...new Set(b.tags.map(x => x.trim()).filter(Boolean))];
    await env.DB.prepare('INSERT INTO interests (role, tags_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(role) DO UPDATE SET tags_json = excluded.tags_json, updated_at = excluded.updated_at').bind(role, JSON.stringify(tags), nowIso()).run();
    return json({ tags });
  }
  return fail(404, 'Not found');
}

export default {
  async fetch(request, env) {
    try { return withCors(await processRequest(request, env), request, env); }
    catch (error) {
      if (error instanceof SyntaxError || ['Request too large', 'Expected a JSON object', 'Invalid schedule', 'Invalid schedule ID', 'Invalid start/end', 'Label too long'].includes(error.message)) return withCors(fail(400, error.message), request, env);
      console.error('API request failed', error?.name || 'Error');
      return withCors(fail(500, 'Unexpected server error'), request, env);
    }
  }
};
