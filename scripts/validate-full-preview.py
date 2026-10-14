from pathlib import Path
import functools,http.server,threading,os,shutil
from playwright.sync_api import sync_playwright
out=Path(os.environ.get('MUSA_FULL_PREVIEW_OUTPUT',Path(__file__).resolve().parents[2]/'musa-full-preview'))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(out)));threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 browser_path=os.environ.get('MUSA_CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
 b=p.chromium.launch(**({'executable_path':browser_path} if browser_path else {}),headless=True)
 page=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
 for lang in ['es','en']:
  for width in [1440,390,320]:
   page.set_viewport_size({'width':width,'height':1000});page.goto(f'http://127.0.0.1:{server.server_port}/index-{lang}.html')
   page.evaluate('document.querySelectorAll("img").forEach(i=>i.loading="eager")');page.evaluate('document.fonts.ready');page.wait_for_function('Array.from(document.images).every(i=>i.complete)')
   assert page.locator('[data-catalog-card]').count()==15
   assert page.locator('.hero').count()==1 and page.locator('.site-footer').count()==1 and page.locator('.club').count()==1
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),f'Overflow {lang} {width}'
   assert page.locator('img').evaluate_all('(imgs)=>imgs.every(i=>i.naturalWidth>0)')
   if lang=='es' and width in [1440,390]:
    page.screenshot(path=str(out/('pagina-completa.png' if width==1440 else 'pagina-movil.png')),full_page=True)
    if width==1440:page.screenshot(path=str(out/'portada.png'))
   page.locator('[data-catalog-filter="sets-3"]').click();assert page.locator('[data-catalog-card]:visible').count()==4
   print('PASS full homepage',lang,width,'images, fonts, structure, filters and no overflow')
 page.evaluate('window.scrollTo(0,0)');page.locator('.menu-toggle').click();page.locator('#MobileMenu [name=locale_code]').select_option('es');page.wait_for_url('**/index-es.html');assert page.locator('html').get_attribute('lang')=='es'
 print('PASS mobile language switch; JS errors:',errors);assert not errors
 b.close()
server.shutdown()
