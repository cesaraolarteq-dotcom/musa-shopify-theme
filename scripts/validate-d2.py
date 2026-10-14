"""D2 regression checks against the generated full preview and real theme scripts."""
from pathlib import Path
import functools, http.server, threading, os, shutil, re
from playwright.sync_api import sync_playwright
out=Path(os.environ.get('MUSA_FULL_PREVIEW_OUTPUT',Path(__file__).resolve().parents[2]/'musa-full-preview'))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(out)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as p:
 browser_path=os.environ.get('MUSA_CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
 b=p.chromium.launch(**({'executable_path':browser_path} if browser_path else {}),headless=True)
 page=b.new_page(viewport={'width':390,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 for lang in ['es','en']:
  page.goto(f'{base}/index-{lang}.html')
  assert page.locator('.silk-canvas.is-live').count()==1
  assert page.locator('[role=radiogroup]').count()==15
  # All 46 ordered color/size combinations retain the native source of truth.
  for control in page.locator('[data-catalog-color-control]').all():
   select=control.locator('select')
   for i in range(select.locator('option').count()):
    control.locator('[role=radio]').nth(i).evaluate('e=>e.click()')
    assert select.evaluate('e=>e.selectedIndex')==i
    expected=select.locator('option').nth(i).get_attribute('data-sizes')
    assert control.locator('[data-catalog-sizes]').inner_text()==expected
    assert control.locator('.cat-size').all_text_contents()==[s.strip() for s in expected.split('·')]
   assert select.get_attribute('tabindex')=='-1'
  control=next(c for c in page.locator('[data-catalog-color-control]').all() if c.locator('[role=radio]').count()>1)
  control.locator('[role=radio]').first.focus();page.keyboard.press('ArrowRight')
  assert control.locator('select').evaluate('e=>e.selectedIndex')==1
  control.locator('select').evaluate("e=>{e.selectedIndex=0;e.dispatchEvent(new Event('change',{bubbles:true}));}")
  assert control.locator('[role=radio]').first.get_attribute('aria-checked')=='true'
  page.evaluate('scrollTo(0,0)');page.locator('.menu-toggle').click();page.wait_for_timeout(650)
  assert round(page.locator('#MobileMenu').bounding_box()['y'])==92
  page.keyboard.press('Escape')
  page.evaluate('scrollTo(0,400)');page.wait_for_timeout(350)
  page.emulate_media(reduced_motion='reduce');page.evaluate('scrollTo(0,0)');page.wait_for_timeout(300)
  assert page.locator('[data-silk-inner]').evaluate('e=>getComputedStyle(e).opacity')=='1'
  assert page.locator('[data-silk-inner]').evaluate('e=>getComputedStyle(e).transform')=='none'
  assert page.locator('.cat-size').first.evaluate('e=>getComputedStyle(e).animationName')=='none'
  page.emulate_media(reduced_motion='no-preference')
  print('PASS',lang,'46 color/size combinations, keyboard, native change sync, header and live reduced-motion change')
 page.goto(base+'/index-en.html')
 page.evaluate('''() => { const stage=document.querySelector('[data-silk-stage]'); const ctx=stage.querySelector('canvas').getContext('2d'); const fill=ctx.fillRect.bind(ctx); window.draws=0; ctx.fillRect=(...args)=>{window.draws++;fill(...args)}; stage.dispatchEvent(new CustomEvent('shopify:section:unload',{bubbles:true})); stage.remove(); }''')
 page.wait_for_timeout(250)
 assert page.evaluate('window.draws')==0
 assert not page.locator('body').evaluate("e=>e.classList.contains('silk-ready')")
 print('PASS section unload stops canvas and clears floating header')
 html=(out/'index-en.html').read_text()
 without_hero=re.sub(r'<section class="silk-stage[\s\S]*?</section>','',html,count=1)
 page.route('**/standalone.html',lambda r:r.fulfill(content_type='text/html',body=without_hero))
 page.goto(base+'/standalone.html')
 assert page.locator('[role=radiogroup]').count()==15
 assert not page.locator('body').evaluate("e=>e.classList.contains('silk-ready')")
 print('PASS catalog swatches without silk hero')
 failed=re.sub(r'<script data-silk-script>[\s\S]*?</script>','',html)
 page.route('**/failed.html',lambda r:r.fulfill(content_type='text/html',body=failed))
 page.goto(base+'/failed.html');page.locator('.musa-catalog').scroll_into_view_if_needed()
 assert page.locator('.site-header').evaluate('e=>getComputedStyle(e).backgroundColor')!='rgba(0, 0, 0, 0)'
 assert page.locator('.brand-logo').evaluate('e=>getComputedStyle(e).opacity')=='1'
 assert page.locator('[data-catalog-color]').first.is_visible()
 print('PASS failed silk download keeps native controls and solid header')
 ctx=b.new_context(java_script_enabled=False);no=ctx.new_page();no.goto(base+'/index-en.html')
 assert no.locator('[data-catalog-matrix]:visible').count()==15
 assert no.locator('.site-header').evaluate('e=>getComputedStyle(e).backgroundColor')!='rgba(0, 0, 0, 0)'
 print('PASS no-JS catalog matrices and solid header')
 assert not errors,errors
 b.close()
server.shutdown()
