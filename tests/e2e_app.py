"""Real UI through the real Worker handler + in-memory SQLite adapter.
Run: python3 tests/e2e_app.py. Requires local Chromium and Playwright.
"""
import subprocess
import re
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = 'https://app.dex.test'
BACKEND = 'http://127.0.0.1:18765'
ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'

def wait_ready(proc):
    for _ in range(90):
        if proc.poll() is not None: raise RuntimeError('API test server terminated')
        try:
            with urllib.request.urlopen(BACKEND + '/index.html', timeout=.3) as f:
                if f.status == 200: return
        except OSError: time.sleep(.1)
    raise TimeoutError('API test server did not start')

def call_worker(source, payload):
    path = payload['url'].removeprefix(BASE)
    headers = {'Origin': BASE, **(payload.get('headers') or {})}
    body = payload.get('body')
    req = urllib.request.Request(BACKEND + path, data=body.encode() if body is not None else None,
                                 headers=headers, method=payload.get('method') or 'GET')
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return {'status':response.status, 'body':response.read().decode()}
    except urllib.error.HTTPError as error:
        return {'status':error.code,'body':error.read().decode()}


def open_app(context, storage=None):
    import json
    page = context.new_page()
    page.expose_binding('dexApi', call_worker)
    markup = (PUBLIC / 'index.html').read_text()
    markup = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', markup)
    markup = re.sub(r'<(script|link)[^>]*\b(?:src|href)="\./[^"]+"[^>]*>(?:</script>)?', '', markup)
    page.set_content(markup, wait_until='load')
    page.add_style_tag(content=(PUBLIC/'styles.css').read_text())
    page.add_script_tag(content=f"""
      const makeStore=(initial)=>{{const m=new Map(Object.entries(initial));return {{
        getItem:k=>m.has(k)?m.get(k):null,
        setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),
        dump:()=>Object.fromEntries(m)
      }};}};
      Object.defineProperty(window,'localStorage',{{value:makeStore({json.dumps(storage or {})})}});
      Object.defineProperty(window,'sessionStorage',{{value:makeStore({{}})}});
      if(!crypto.randomUUID){{let n=0;crypto.randomUUID=()=>`test-${{Date.now()}}-${{++n}}`;}}
      window.fetch=async(url,opts={{}})=>{{
        const response=await window.dexApi({{url:String(url),method:opts.method||'GET',headers:opts.headers||{{}},body:opts.body}});
        return new Response(response.body,{{status:response.status,headers:{{'content-type':'application/json'}}}});
      }};
    """)
    page.add_script_tag(content=f"window.DEX_CONFIG=Object.freeze({{apiBase:'{BASE}'}});")
    page.add_script_tag(content=(PUBLIC/'facts.js').read_text())
    page.add_script_tag(content=(PUBLIC/'app.js').read_text())
    return page


def reopen(page, context):
    storage = page.evaluate('window.localStorage.dump()')
    page.close()
    new_page=open_app(context, storage)
    new_page.on('dialog',lambda d:d.accept())
    return new_page


def make_account(page, role):
    page.get_by_label('Household entry password').fill('Dexter')
    page.locator('#entry-form button[type=submit]').click()
    page.locator('[data-role=' + role + ']').click()
    page.locator('#user-password').fill(role + '-a-strong-test-password')
    page.locator('#confirm-password').fill(role + '-a-strong-test-password')
    page.locator('#invite-code').fill(('a' if role == 'andrew' else 'g') * 48)
    page.locator('#account-form button[type=submit]').click()
    page.get_by_role('heading', name="Who's home?").wait_for()

def run():
    proc = subprocess.Popen(['node', '--experimental-sqlite', 'tests/dev_api_server.mjs'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    try:
        wait_ready(proc)
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
            a_ctx = browser.new_context(viewport={'width': 1280, 'height': 900}, service_workers='block')
            g_ctx = browser.new_context(viewport={'width': 390, 'height': 844}, service_workers='block', is_mobile=True, has_touch=True)
            a = open_app(a_ctx); g = open_app(g_ctx)
            errors = []
            for name, page in [('andrew', a), ('greyson', g)]:
                page.on('pageerror', lambda exc, label=name: errors.append((label, str(exc))))
                page.on('dialog', lambda d: d.accept())
            make_account(a, 'andrew'); make_account(g, 'greyson')
            # Freshly installed real accounts see exactly their own role.
            assert a.locator('.topbar').get_by_text('Andrew', exact=False).count()
            assert g.locator('.topbar').get_by_text('Greyson', exact=False).count()
            # The new calendar-side daily curiosity must be present without switching tabs.
            assert g.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile calendar horizontally overflows'
            a.locator('#familiar.show').wait_for(timeout=4000)
            assert a.locator('#familiar.show p').inner_text().strip()
            a.locator('[data-action="hide-cameo"]').click()
            assert a.locator('#familiar.show').count() == 0
            assert a.locator('[data-testid="calendar-fact"]').count() == 1
            a.screenshot(path='/mnt/data/dex_scheduler_after_desktop.png', full_page=True)
            g.screenshot(path='/mnt/data/dex_scheduler_after_mobile.png', full_page=True)
            first_fact = a.locator('[data-testid="calendar-fact"] h3').inner_text()
            a = reopen(a, a_ctx); a.get_by_role('heading', name="Who's home?").wait_for(); a.on('pageerror',lambda e: errors.append(('andrew',str(e))))
            later_fact = a.locator('[data-testid="calendar-fact"] h3').inner_text()
            assert first_fact != later_fact, (first_fact, later_fact)
            # Create and publish an away block.
            a.locator('[data-action="add-away"]').click()
            a.locator('#away-form [name=from]').fill('09:00')
            a.locator('#away-form [name=until]').fill('17:00')
            a.locator('#away-form [name=label]').fill('Original away block')
            a.locator('#away-form button[type=submit]').click()
            a.locator('[data-action="publish"]').click()
            a.get_by_text('All changes published').wait_for()
            g.locator('[data-action="refresh"]').count()  # accessible via Updates tab
            g.locator('[data-nav="updates"]:visible').click()
            g.locator('[data-action="refresh"]').click()
            g.get_by_text('Andrew updated their schedule.', exact=False).wait_for()
            # Edits stay private until Save & Sync; old published block stays on partner view.
            a.locator('[data-nav="calendar"]:visible').click()
            a.locator('[data-action="add-away"]').click()
            a.locator('#away-form [name=from]').fill('18:00')
            a.locator('#away-form [name=until]').fill('19:00')
            a.locator('#away-form [name=label]').fill('Unpublished second block')
            a.locator('#away-form button[type=submit]').click()
            # Only the new block goes light; untouched published blocks stay dark.
            assert a.locator('.timeline-segment.red.draft').count() >= 1
            assert a.locator('.timeline-segment.red:not(.draft)').count() >= 1
            a.locator('[data-action="discard-draft"]').click()
            a.locator('[data-action="edit-away"]').first.click()
            a.locator('#away-form [name=label]').fill('Private changed label')
            a.locator('#away-form button[type=submit]').click()
            assert a.get_by_text('Private changed label', exact=False).count() >= 1
            g.locator('[data-nav="calendar"]:visible').click()
            g = reopen(g, g_ctx); g.get_by_role('heading', name="Who's home?").wait_for(); g.on('pageerror',lambda e: errors.append(('greyson',str(e))))
            assert g.get_by_text('Private changed label').count() == 0
            # A refresh while the modal is open must not throw away partially edited data.
            a.locator('[data-action="edit-away"]').first.click()
            a.locator('#away-form [name=label]').fill('Unsaved typing must survive polling')
            a.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
            a.wait_for_timeout(900)
            assert a.locator('#edit-dialog[open]').count() == 1
            assert a.locator('#away-form [name=label]').input_value() == 'Unsaved typing must survive polling'
            a.locator('#edit-dialog [data-action="close-modal"]').first.click()
            # Urgent change adjusts the published block without publishing unrelated drafts.
            a.locator('[data-action="urgent"]').click()
            a.locator('#urgent-form [name=arrival]').fill(a.locator('#urgent-form [name=arrival]').input_value()[:11] + '15:00')
            a.locator('#urgent-form button[type=submit]').click()
            a = reopen(a, a_ctx); a.get_by_role('heading', name="Who's home?").wait_for(); a.on('pageerror',lambda e: errors.append(('andrew',str(e))))
            assert a.get_by_text('Private changed label', exact=False).count() >= 1
            assert a.locator('[data-action="publish"]:not([disabled])').count() == 1
            # Removing a published event must not affect the other account before publishing.
            a.locator('[data-action="remove-away"]').first.click()
            assert a.get_by_text('Original away block').count() == 0
            g = reopen(g, g_ctx); g.get_by_role('heading', name="Who's home?").wait_for(); g.on('pageerror',lambda e: errors.append(('greyson',str(e))))
            assert g.locator('.timeline-segment.red').count() >= 1
            a.locator('[data-action="publish"]').click()
            g = reopen(g, g_ctx); g.get_by_role('heading', name="Who's home?").wait_for(); g.on('pageerror',lambda e: errors.append(('greyson',str(e))))
            assert g.locator('.timeline-segment.red').count() == 0
            # Two sessions signed in to the same account must not silently overwrite each other.
            copy = open_app(a_ctx, a.evaluate('window.localStorage.dump()'))
            copy.on('dialog', lambda d:d.accept())
            copy.get_by_role('heading', name="Who's home?").wait_for()
            a.locator('[data-action="add-away"]').click()
            a.locator('#away-form [name=from]').fill('10:00')
            a.locator('#away-form [name=until]').fill('12:00')
            a.locator('#away-form [name=label]').fill('Andrew private conflict draft')
            a.locator('#away-form button[type=submit]').click()
            copy.locator('[data-action="add-away"]').click()
            copy.locator('#away-form [name=from]').fill('15:00')
            copy.locator('#away-form [name=until]').fill('18:00')
            copy.locator('#away-form [name=label]').fill('Newer other-session edit')
            copy.locator('#away-form button[type=submit]').click()
            copy.locator('[data-action="publish"]').click()
            copy.get_by_text('All changes published').wait_for()
            a.locator('[data-action="publish"]').click()
            a.locator('.draft-conflict').wait_for()
            assert a.locator('[data-action="publish"]').is_disabled()
            a = reopen(a, a_ctx)
            a.get_by_role('heading',name="Who's home?").wait_for()
            a.locator('.draft-conflict').wait_for()
            assert a.get_by_text('Andrew private conflict draft', exact=False).count() >= 1
            a.locator('[data-action="rebase-draft"]').click()
            assert a.locator('[data-action="publish"]').is_enabled()
            a.locator('[data-action="publish"]').click()
            a.get_by_text('All changes published').wait_for()
            # Network failure must be visible as stale sync, never a green live indicator.
            a.evaluate("() => { window.fetch = () => Promise.reject(new Error('Synthetic offline check')); }")
            a.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
            a.locator('.sync-warning').wait_for()
            assert a.get_by_text('Cannot reach the private sync service.',exact=False).count() >= 1
            assert not errors, errors
            browser.close()
            print('E2E PASS: two accounts, fresh facts, private edits, modal resilience, urgent draft survival, delayed removal publishing')
    finally:
        proc.terminate()
        try: proc.communicate(timeout=4)
        except subprocess.TimeoutExpired: proc.kill(); proc.communicate()

if __name__ == '__main__': run()
