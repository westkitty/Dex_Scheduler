import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import api from '../worker/src/index.js';

function makeDB() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(new URL('../worker/schema.sql', import.meta.url), 'utf8'));
  return {
    raw: db,
    prepare(sql) {
      const statement = db.prepare(sql);
      return {
        async first() { return statement.get() ?? null; },
        async all() { return { results: statement.all() }; },
        async run() { const result = statement.run(); return { meta: { changes: result.changes } }; },
        bind(...params) {
        return {
          _statement: statement, _params: params,
          async first() { return statement.get(...params) ?? null; },
          async all() { return { results: statement.all(...params) }; },
          async run() { const result = statement.run(...params); return { meta: { changes: result.changes } }; }
        };
      } };
    },
    async batch(actions) {
      db.exec('BEGIN');
      try {
        const out = actions.map(x => ({ meta: { changes: x._statement.run(...x._params).changes } }));
        db.exec('COMMIT');return out;
      } catch(e) { db.exec('ROLLBACK');throw e; }
    }
  };
}
async function makeApp() {
  const DB = makeDB();
  const env = { DB, ENTRY_PASSWORD:'Dexter',ENROLLMENT_ENABLED:'true',APP_ORIGIN:'https://westkitty.github.io',INVITE_ANDREW:'a'.repeat(48),INVITE_GREYSON:'g'.repeat(48), RATE_PEPPER:'z'.repeat(48) };
  let token = null;
  async function request(path, method='GET', data, suppliedToken=token, origin='https://westkitty.github.io') {
    const headers = {'Origin':origin,'CF-Connecting-IP': '127.0.0.1'};
    if (suppliedToken) headers.Authorization = `Bearer ${suppliedToken}`;
    if (data !== undefined) headers['Content-Type']='application/json';
    const result = await api.fetch(new Request(`https://api.example.test${path}`, { method, headers, body: data===undefined?undefined:JSON.stringify(data) }),env);
    let body={};if(result.headers.get('content-type')?.includes('json')) body=await result.json();
    return {status:result.status,body,headers:result.headers};
  }
  async function gate() {const response=await request('/api/gate','POST',{password:'Dexter'});assert.equal(response.status,200);return response.body.ticket;}
  async function enroll(role,invite) {const ticket=await gate();const response=await request('/api/enroll','POST',{role,invite,ticket,password:role+'-very-long-secret'});assert.equal(response.status,201);return response.body.token;}
  return {DB,env,request,gate,enroll};
}

test('gate rejects wrong entry phrase, requires a personal invite for claiming a role',async () => {
  const app=await makeApp();
  assert.equal((await app.request('/api/gate','POST',{password:'wrong'})).status,401);
  const ticket=await app.gate();
  assert.equal((await app.request('/api/enroll','POST',{role:'andrew',ticket,password:'at-least-ten'})).status,403);
  const account=await app.request('/api/enroll','POST',{role:'andrew',ticket,invite:'a'.repeat(48),password:'at-least-ten'});
  assert.equal(account.status,201);
  const status=(await app.request('/api/status')).body;
  assert.deepEqual(status.claimed,['andrew']);
  assert.equal((await app.request('/api/enroll','POST',{role:'andrew',ticket,invite:'a'.repeat(48),password:'another-long-one'})).status,403);
});

test('two users have distinct login credentials and private bearer sessions',async () => {
  const app=await makeApp();
  const a=await app.enroll('andrew','a'.repeat(48));
  const g=await app.enroll('greyson','g'.repeat(48));
  assert.equal((await app.request('/api/me','GET',undefined,a)).body.role,'andrew');
  assert.equal((await app.request('/api/me','GET',undefined,g)).body.role,'greyson');
  assert.equal((await app.request('/api/me','GET',undefined,'0'.repeat(64))).status,401);
  const ticket=await app.gate();
  assert.equal((await app.request('/api/login','POST',{role:'greyson',password:'andrew-very-long-secret',ticket})).status,401);
  const login=await app.request('/api/login','POST',{role:'greyson',password:'greyson-very-long-secret',ticket});
  assert.equal(login.status,200);
  assert.notEqual(login.body.token,g);
  assert.equal((await app.request('/api/logout','POST',{},g)).status,200);
  assert.equal((await app.request('/api/me','GET',undefined,g)).status,401);
});

test('drafts are not on server; publish is own-schedule-only, revisioned and atomic',async () => {
  const app=await makeApp();const a=await app.enroll('andrew','a'.repeat(48));const g=await app.enroll('greyson','g'.repeat(48));
  const event={id:'andrew-1',start:Date.UTC(2026,10,10,14),end:Date.UTC(2026,10,10,18),label:'Private plan'};
  let before=(await app.request('/api/state','GET',undefined,g)).body;
  assert.deepEqual(before.schedules.andrew.events,[]);
  const published=await app.request('/api/publish','POST',{events:[event],baseRevision:0},a);
  assert.equal(published.status,200);
  const after=(await app.request('/api/state','GET',undefined,g)).body;
  assert.equal(after.schedules.andrew.events.length,1);
  assert.equal(after.schedules.greyson.events.length,0);
  assert.equal(after.activity.length,1);
  assert.match(after.activity[0].message,/Andrew updated their schedule/);
  assert.equal((await app.request('/api/publish','POST',{events:[],baseRevision:0},a)).status,409);
  assert.equal((await app.request('/api/publish','POST',{events:[],baseRevision:0},g)).status,200);
  assert.equal((await app.request('/api/state','GET',undefined,g)).body.schedules.andrew.events.length,1);
});

test('urgent return updates only published owner event, preserves other updates', async () => {
  const app=await makeApp(); const a=await app.enroll('andrew','a'.repeat(48)); const g=await app.enroll('greyson','g'.repeat(48));
  const events=[{id:'one',start:Date.UTC(2026,10,10,9),end:Date.UTC(2026,10,10,19)},{id:'two',start:Date.UTC(2026,10,12,10),end:Date.UTC(2026,10,12,20)}];
  assert.equal((await app.request('/api/publish','POST',{events,baseRevision:0},g)).status,200);
  assert.equal((await app.request('/api/urgent','POST',{id:'one',newEnd:Date.UTC(2026,10,10,17)},a)).status,404);
  assert.equal((await app.request('/api/urgent','POST',{id:'one',newEnd:Date.UTC(2026,10,10,20)},g)).status,400);
  assert.equal((await app.request('/api/urgent','POST',{id:'one',newEnd:Date.UTC(2026,10,10,17)},g)).status,200);
  const latest=(await app.request('/api/state','GET',undefined,a)).body;
  assert.equal(latest.schedules.greyson.events[0].end,Date.UTC(2026,10,10,17));
  assert.equal(latest.schedules.greyson.events[1].end,events[1].end);
  assert.equal(latest.activity.length,2);
  assert.equal(latest.activity[0].type,'urgent');
});

test('shared bills, paid marker and interests sync across both roles',async () => {
  const app=await makeApp(); const a=await app.enroll('andrew','a'.repeat(48)); const g=await app.enroll('greyson','g'.repeat(48));
  const created=await app.request('/api/bills','POST',{title:'Internet',amountCents:6900,owner:'shared',dueDate:'2026-11-10',recurrence:'monthly'},a);
  assert.equal(created.status,201);
  const billId=created.body.id;
  assert.equal((await app.request(`/api/bills/${billId}/payment`,'POST',{occurrenceDate:'2026-11-10',paidDate:'2026-11-08'},g)).status,200);
  assert.equal((await app.request('/api/interests','PUT',{tags:['history','animals']},g)).status,200);
  const state=(await app.request('/api/state','GET',undefined,a)).body;
  assert.equal(state.bills[0].amount_cents,6900);
  assert.equal(state.payments[0].paid_by,'greyson');
  assert.deepEqual(state.interests[0].tags,['history','animals']);
});

test('rejects unauthorized origin and malformed schedule; enrollment can be disabled',async () => {
  const app=await makeApp(); const a=await app.enroll('andrew','a'.repeat(48));
  assert.equal((await app.request('/api/state','GET',undefined,a,'https://attacker.example')).status,403);
  assert.equal((await app.request('/api/publish','POST',{events:[{id:'x',start:1,end:1}],baseRevision:0},a)).status,400);
  app.env.ENROLLMENT_ENABLED='false';
  const ticket=await app.gate();
  assert.equal((await app.request('/api/enroll','POST',{role:'greyson',password:'sufficient-long',ticket,invite:'g'.repeat(48)})).status,403);
});
