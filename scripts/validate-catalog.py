"""Validate prelaunch catalog consistency and actual browser interactions."""
import functools
import http.server
import json
import os
from pathlib import Path
import shutil
import threading
from collections import Counter
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
output=Path(os.environ.get('MUSA_CATALOG_OUTPUT_DIR',root.parent/'musa-catalog-preview'))
catalog=json.loads((root/'catalog/musa-products.json').read_text())
products=catalog['products']
assert len(products)==15
assert Counter(p['category'] for p in products)=={'sets-2':9,'sets-3':4,'bodysuits':1,'leggings':1}
assert sum(len(p['colors']) for p in products)==46
assert sum(len(c['sizes']) for p in products for c in p['colors'])==139
assert all(p['sale_price'] is None for p in products)
assert all(p['sell_as']=='complete_set' for p in products[:13])
assert all(p['sell_as']=='individual_garment' for p in products[13:])
assert all('cost' not in k and 'ordered_sale_units' not in k for p in products for k in p)
assert [p['id'] for p in products if not p['supplier_reference_confirmed']]==['PI-12','PI-13']
print('PASS: 15 sale references, 46 colour combinations, 139 variants; sets complete, prices pending.')

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(output)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
try:
    with sync_playwright() as pw:
        options={'headless':True}
        chrome=os.environ.get('MUSA_CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
        if chrome:options['executable_path']=chrome
        browser=pw.chromium.launch(**options)
        page=browser.new_page(viewport={'width':1440,'height':1050})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        for lang in ['es','en']:
            page.goto(base+f'/index-{lang}.html')
            assert page.locator('[data-catalog-card]:visible').count()==15
            for cat,count in [('sets-2',9),('sets-3',4),('bodysuits',1),('leggings',1),('all',15)]:
                page.locator(f'[data-catalog-filter="{cat}"]').click()
                assert page.locator('[data-catalog-card]:visible').count()==count
            # Only L was ordered for this specific colour; no synthetic S/M options.
            pink=page.locator('[data-reference="PI-07"]')
            pink.locator('select').select_option('1')
            assert pink.locator('[data-catalog-sizes]').inner_text()=='L'
            for i in range(4):
                card=page.locator('[data-reference="PI-12"]')
                card.locator('select').select_option(str(i))
                assert card.locator('[data-catalog-sizes]').inner_text()=='M · L'
            page.locator('[data-reference="PI-15"] select').select_option('3')
            assert page.locator('[data-reference="PI-15"] [data-catalog-sizes]').inner_text()=='S · M · L · XL'
            assert page.locator('form[action*="cart"],a[href*="checkout"],button[name="add"]').count()==0
            for width in [1440,390,320]:
                page.set_viewport_size({'width':width,'height':1050})
                assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),f'Overflow {lang}/{width}'
                if lang=='es' and width in [1440,390]:
                    page.evaluate('window.scrollTo(0,0)')
                    page.screenshot(path=str(output/('catalog-desktop.png' if width==1440 else 'catalog-mobile.png')))
            print(f'PASS: {lang} categories, dependent sizes, no checkout, desktop/mobile/320px layouts.')
        context=browser.new_context(java_script_enabled=False)
        nojs=context.new_page()
        nojs.goto(base+'/index-es.html')
        assert nojs.locator('[data-catalog-matrix]:visible').count()==15
        assert nojs.locator('[data-catalog-filters]').is_hidden()
        nojs.locator('[data-reference="PI-07"] summary').click()
        assert 'Rosa cerezo' in nojs.locator('[data-reference="PI-07"] ul').inner_text()
        assert not errors,errors
        print('PASS: all 15 colour/size matrices accessible without JavaScript; no browser errors.')
        browser.close()
finally:
    server.shutdown()
