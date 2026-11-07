from playwright.sync_api import sync_playwright
from pathlib import Path
import re

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        for width,height in [(1360,900),(390,844)]:
            page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            root=Path(__file__).resolve().parent.parent/'public'
            markup=(root/'index.html').read_text()
            markup=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', markup)
            markup=re.sub(r'<(script|link)[^>]*\b(?:src|href)="\./[^"]+"[^>]*>(?:</script>)?', '', markup)
            page.set_content(markup,wait_until='load')
            page.add_style_tag(content=(root/'styles.css').read_text())
            page.add_script_tag(content=(root/'config.js').read_text())
            page.add_script_tag(content=(root/'facts.js').read_text())
            page.add_script_tag(content="const memoryStorage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};Object.defineProperty(window,'localStorage',{value:memoryStorage()});Object.defineProperty(window,'sessionStorage',{value:memoryStorage()});")
            page.add_script_tag(content=(root/'app.js').read_text())
            assert page.get_by_label('Household entry password').is_visible()
            page.get_by_label('Household entry password').fill('wrong')
            page.locator('#entry-form button[type=submit]').click()
            assert page.locator('.toast.visible').count()==1
            page.get_by_label('Household entry password').fill('Dexter')
            page.locator('#entry-form button[type=submit]').click()
            assert page.get_by_role('heading',name="Who's reporting in?").is_visible()
            page.locator('[data-action=preview]').click()
            assert page.get_by_role('heading',name="Who's home?").is_visible()
            assert page.get_by_text('SAMPLE PREVIEW',exact=False).is_visible()
            assert page.locator('.timeline-segment.purple').count()>=1
            page.locator('[data-view=week]').click()
            assert page.locator('.day-row').count()==7
            page.locator('[data-nav=bills]:visible').click()
            assert page.get_by_role('heading',name='Money obligations.').is_visible()
            page.locator('[data-nav=trivia]:visible').click()
            assert page.get_by_role('heading',name="Today's peculiarities.").is_visible()
            page.screenshot(path=f'/tmp/dex-preview-{width}.png',full_page=True)
            if errors:print('BROWSER ERRORS',width,errors)
            assert not errors,errors
            page.close()
        browser.close()
        print('BROWSER SMOKE PASS: entry gate, wrong password, role selection, labeled preview, day/week, bills, trivia at desktop and phone widths; zero uncaught page errors')
if __name__ == '__main__':run()
