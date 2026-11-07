// Local-only, dependency-free integration harness. Never deploy this server.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import api from '../worker/src/index.js';

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../worker/schema.sql', import.meta.url), 'utf8'));
const DB = {
  prepare(sql) {
    const statement = db.prepare(sql);
    const run = (...params) => ({ meta: { changes: statement.run(...params).changes } });
    const first = async (...params) => statement.get(...params) ?? null;
    const all = async (...params) => ({ results: statement.all(...params) });
    return { first, all, run: async (...params) => run(...params), bind(...params) { return {
      _statement: statement, _params: params,
      first: () => first(...params), all: () => all(...params),
      run: async () => run(...params)
    }; } };
  },
  async batch(actions) {
    db.exec('BEGIN');
    try {
      const result = actions.map(x => ({ meta: { changes: x._statement.run(...x._params).changes } }));
      db.exec('COMMIT');
      return result;
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
};
const port = Number(process.env.DEX_TEST_PORT || 18765);
const base = `http://127.0.0.1:${port}`;
const env = {
  DB, APP_ORIGIN: 'https://app.dex.test', ENTRY_PASSWORD: 'Dexter', ENROLLMENT_ENABLED: 'true',
  INVITE_ANDREW: 'a'.repeat(48), INVITE_GREYSON: 'g'.repeat(48),
  RATE_PEPPER: 'test-rate-pepper-not-for-production'
};
const types = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const root = resolve(new URL('../public/', import.meta.url).pathname);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, base);
    if (url.pathname.startsWith('/api/')) {
      const chunks = []; for await (const c of req) chunks.push(c);
      const headers = new Headers(req.headers);
      headers.set('CF-Connecting-IP', req.socket.remoteAddress || '127.0.0.1');
      const result = await api.fetch(new Request(`${base}${url.pathname}`, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined }), env);
      res.writeHead(result.status, Object.fromEntries(result.headers));
      res.end(Buffer.from(await result.arrayBuffer()));
      return;
    }
    if (url.pathname === '/config.js') {
      res.writeHead(200, { 'Content-Type': types['.js'], 'Cache-Control': 'no-store' });
      res.end(`window.DEX_CONFIG = Object.freeze({apiBase: '${base}'});`);
      return;
    }
    const pathname = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const file = resolve(root, `.${pathname}`);
    if (!file.startsWith(root + '/') && file !== resolve(root, 'index.html')) { res.writeHead(403); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(readFileSync(file));
  } catch (error) { res.writeHead(500); res.end(String(error.message)); }
});
server.listen(port, '127.0.0.1', () => console.log(`DEX_TEST_SERVER_READY ${base}`));
process.on('SIGTERM', () => server.close());
