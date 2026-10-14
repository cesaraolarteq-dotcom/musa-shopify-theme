import json,threading,http.server,os,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
script=(Path(__file__).resolve().parents[1]/'assets/musa.js').read_text()
html='''<!doctype html><html><body><a href="/cart" data-cart-open aria-label="bag (0)">Bag <span data-cart-count>0</span></a>
<div data-cart-drawer hidden data-count="0"><div class="drawer-panel" tabindex="-1"><button data-drawer-close>Close</button><div data-line="1"><button data-cart-change="2">Increase</button></div><p data-drawer-error hidden role="alert"></p><p>EMPTY CART</p></div></div>
<section data-product-section><form data-product-form><select name="id" data-variant-select><option value="101">S</option></select><input name="quantity" data-quantity min="1" step="1" value="1"><button data-add data-available-text="Add" data-unavailable-text="Sold out" data-adding-text="Adding"><span data-add-label>Add</span></button><p data-form-error hidden></p></form><script type="application/json" data-variants>[{"id":101,"available":true,"min":1,"step":1,"max":null}]</script></section>
<script>window.musa={cartDrawer:true,routes:{cartChange:'/cart/change.js',cartAdd:'/cart/add.js'},strings:{error:'Error',changeError:'Could not update cart'}};</script><script>'''+script+'</script></body></html>'
class H(http.server.BaseHTTPRequestHandler):
 def do_GET(self):
  self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(html.encode())
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 browser_path=os.environ.get('MUSA_CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
 b=p.chromium.launch(**({'executable_path':browser_path} if browser_path else {}),headless=True)
 page=b.new_page();url=f'http://127.0.0.1:{server.server_port}'
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/cart/change.js',lambda r:r.fulfill(status=422,content_type='application/json',body=json.dumps({'status':422,'description':'Inventory limit'})))
 page.goto(url);page.locator('[data-cart-open]').click();page.locator('[data-cart-change]').click()
 page.wait_for_function("!document.querySelector('.drawer-panel').classList.contains('is-busy')")
 assert page.locator('[data-drawer-error]').inner_text()=='Inventory limit'
 print('PASS 422 shows error and unlocks cart')
 fresh='<div data-cart-drawer hidden data-count="1"><div class="drawer-panel" tabindex="-1"><button data-drawer-close>Close</button><p>Updated cart</p></div></div>'
 mutations=[]
 def add(route):
  mutations.append(route.request.method)
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'id':101,'quantity':1,'sections':{'cart-drawer':None}}))
 page.route('**/cart/add.js',add)
 page.route('**/?sections=cart-drawer',lambda r:r.fulfill(content_type='application/json',body=json.dumps({'cart-drawer':fresh})))
 page.goto(url);page.locator('[data-add]').click()
 page.wait_for_function("document.querySelector('[data-cart-count]').textContent==='1'")
 assert page.locator('[data-cart-drawer]').is_visible() and mutations==['POST']
 print('PASS null add section refreshed with exactly one mutation')
 page.unroute('**/cart/change.js')
 page.route('**/cart/change.js',lambda r:r.fulfill(content_type='application/json',body=json.dumps({'sections':{'cart-drawer':None}})))
 page.goto(url);page.locator('[data-cart-open]').click();page.locator('[data-cart-change]').click()
 page.wait_for_function("document.querySelector('[data-cart-count]').textContent==='1'")
 assert not page.locator('.drawer-panel').evaluate("e=>e.classList.contains('is-busy')")
 print('PASS null change section refresh')
 page.unroute('**/?sections=cart-drawer')
 page.route('**/?sections=cart-drawer',lambda r:r.fulfill(status=500,body='Failed'))
 page.goto(url);page.locator('[data-add]').click();page.wait_for_url('**/cart')
 assert len(mutations)==2
 print('PASS failed refresh falls back to native cart without duplicate add')
 for motion in ['reduce','no-preference']:
  page.emulate_media(reduced_motion=motion)
  page.goto(url);page.locator('[data-cart-open]').click();page.keyboard.press('Escape');page.locator('[data-cart-open]').click();page.wait_for_timeout(400)
  assert page.locator('[data-cart-drawer]').is_visible()
  assert page.locator('html').evaluate("e=>e.classList.contains('drawer-locked')")
  print('PASS close/reopen race',motion)
 assert not errors,errors
 b.close()
server.shutdown()
