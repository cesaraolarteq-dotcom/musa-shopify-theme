"""New page/navigation/photo/import checks, plus bilingual event-block rendering."""
import csv,functools,http.server,json,os,shutil,subprocess,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];out=Path(os.environ.get('MUSA_FULL_PREVIEW_OUTPUT',root.parent/'musa-full-preview'))
rows=list(csv.DictReader((root/'imports/MUSA-products-DRAFT.csv').open(encoding='utf-8-sig')))
assert len(rows)==139 and len({r['Handle'] for r in rows})==15
assert len({r['Variant SKU'] for r in rows})==139
assert all(r['Status']=='draft' and r['Published']=='FALSE' and r['Variant Inventory Qty']=='0' for r in rows)
assert not any('price' in k.lower() or 'cost' in k.lower() for k in rows[0])
print('PASS draft-only CSV: 15 handles / 139 unique variants, no costs/prices')
# Render an intentionally hostile title through the real event section; this fixture is never delivered as an event.
js=r"""
const fs=require('fs'),path=require('path');let Liquid;try{({Liquid}=require('liquidjs'))}catch{({Liquid}=require(path.resolve('../.musa-tools/node_modules/liquidjs')))};
const engine=new Liquid({root:'snippets',extname:'.liquid'});engine.registerFilter('asset_url',x=>x);engine.registerFilter('stylesheet_tag',()=> '');
(async()=>{for(const lang of ['en','es']){const d=JSON.parse(fs.readFileSync('locales/'+(lang==='en'?'en.default':'es')+'.json'));engine.registerFilter('t',k=>k.split('.').reduce((a,k)=>a[k],d));const scope={request:{locale:{iso_code:lang}},section:{id:'qa',blocks:[{settings:{title_en:'QA <img src=x onerror=alert(1)>',title_es:'QA español <script>alert(1)</script>',schedule:'QA 10:00 AM CT',location:'QA room',description_en:'QA only',description_es:'Solo QA',link:'https://example.com/event'}}]}};const source=fs.readFileSync('sections/club-events.liquid','utf8').replace(/{% schema %}[\s\S]*?{% endschema %}/,'');fs.writeFileSync(process.argv[1]+'/event-qa-'+lang+'.html',await engine.parseAndRender(source,scope,{globals:scope}));}})();
"""
subprocess.run(['node','-e',js,str(out)],cwd=root,check=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(out)));threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MUSA_CHROMIUM_PATH') or shutil.which('chromium'),headless=True)
  page=browser.new_page(reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  for lang in ['es','en']:
   for kind in ['index','catalog','club']:
    for width in [1440,390,320]:
     page.set_viewport_size({'width':width,'height':1000});page.goto(f'{base}/{kind}-{lang}.html')
     page.evaluate('document.querySelectorAll("img").forEach(i=>i.loading="eager")');page.wait_for_function('Array.from(document.images).every(i=>i.complete)')
     assert page.locator('img').evaluate_all('imgs=>imgs.every(i=>i.naturalWidth>0)')
     assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(kind,lang,width)
     if kind!='club':
      assert page.locator('[data-catalog-card]').count()==(6 if kind=='index' else 15)
      assert page.locator('.musa-reference-label').count()==(6 if kind=='index' else 15)
     else:
      assert page.locator('.musa-event').count()==0 and page.locator('.musa-events-empty').is_visible()
      assert page.locator('[name="contact[accepts_marketing]"]').get_attribute('required') is not None
     if lang=='es' and width in [1440,390]:
      page.add_style_tag(content='*{content-visibility:visible!important}');page.screenshot(path=str(out/f'{kind}-{width}.png'),full_page=True)
   page.goto(f'{base}/index-{lang}.html');page.locator('.musa-catalog a.text-link').click();page.wait_for_url(f'**/catalog-{lang}.html')
   page.goto(f'{base}/club-{lang}.html');assert page.locator('a[href="mailto:musawellnesssportwear@gmail.com"]').count()>0
   page.goto(f'{base}/event-qa-{lang}.html');assert page.locator('.musa-event').count()==1
   assert page.locator('.musa-event h2 img,.musa-event h2 script').count()==0
   assert page.locator('a[href="https://example.com/event"]').count()==1
   print('PASS',lang,'home/catalog/Club, photos, responsive layouts, links, consent and escaped event rendering')
  assert not errors,errors
  browser.close()
finally:
 server.shutdown()
 for f in out.glob('event-qa-*.html'):f.unlink()
