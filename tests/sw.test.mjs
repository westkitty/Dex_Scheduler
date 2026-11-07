import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/sw.js', import.meta.url),'utf8');
const scope = 'https://westkitty.github.io/Dex_Scheduler/';

async function setup() {
  const events = {};
  const data = new Map();
  let online = true;
  let version = 'new-v2';
  const cache = {
    async addAll(paths) { for (const path of paths) data.set(new URL(path,scope).pathname, new Response('cached-v1')); },
    async put(request,response) { data.set(new URL(request.url).pathname,response); },
    async match(request) { return data.get(new URL(request.url,scope).pathname); }
  };
  const caches = {
    async open() { return cache; },
    async match(request) { return cache.match(request); },
    async keys() { return ['dex-shell-v1','dex-shell-v2']; },
    async delete(name) { return name === 'dex-shell-v1'; }
  };
  const self = {
    location: new URL(scope), registration: { scope },
    skipWaiting() {}, clients:{claim() {}},
    addEventListener(type,callback) { events[type] = callback; }
  };
  const fetch = async () => { if (!online) throw Error('offline'); return new Response(version); };
  vm.runInNewContext(source,{self,caches,URL,Response,fetch}, {filename:'sw.js'});
  await new Promise(resolve => events.install({waitUntil:promise=>promise.then(resolve)}));
  return {
    request: async (url,method='GET') => {
      let pending = null;
      events.fetch({request:new Request(url,{method}),respondWith:p=>pending=p});
      return pending ? await pending : null;
    },
    setOnline(value) {online = value;},
    setVersion(value) {version = value;},
    data
  };
}

test('static shell refreshes from network and falls back to offline cache', async () => {
  const sw = await setup();
  const first = await sw.request(scope+'app.js');
  assert.equal(await first.text(),'new-v2');
  sw.setVersion('new-v3');
  assert.equal(await (await sw.request(scope+'app.js')).text(),'new-v3');
  sw.setOnline(false);
  assert.equal(await (await sw.request(scope+'app.js')).text(),'new-v3');
});

test('auth and household API data are never intercepted or cached', async () => {
  const sw = await setup();
  assert.equal(await sw.request(scope+'api/state'),null);
  assert.equal(await sw.request(scope+'api/me'),null);
  assert.equal(await sw.request(scope+'api/bills'),null);
  assert.equal(await sw.request(scope+'app.js','POST'),null);
  assert.equal(sw.data.has('/Dex_Scheduler/api/state'),false);
});
