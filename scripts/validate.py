"""Run structural and Chromium checks of the theme and its generated preview."""
import json, re, threading, functools, http.server, os, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
out = Path(os.environ.get('MUSA_OUTPUT_DIR', root.parent/'musa-deliverables')).resolve()
count = 0
def check(value, message):
    global count
    assert value, message
    count += 1
    print('PASS:', message)

en = json.loads((root/'locales/en.default.json').read_text())
es = json.loads((root/'locales/es.json').read_text())
def keys(data, prefix=''):
    return {prefix+k for k,v in data.items() if not isinstance(v,dict)} | set().union(*(keys(v,prefix+k+'.') for k,v in data.items() if isinstance(v,dict)))
check(keys(en)==keys(es),'English and Spanish translation keys match')
for file in root.rglob('*.json'):
    data=json.loads(file.read_text())
    if file.parent.name in ['templates','sections'] and isinstance(data,dict) and 'sections' in data:
        check(all((root/'sections'/f"{s['type']}.liquid").exists() for s in data['sections'].values()),f'{file.name}: section references resolve')
for file in (root/'sections').glob('*.liquid'):
    match=re.search(r'{% schema %}([\s\S]*?){% endschema %}',file.read_text())
    check(match is not None and isinstance(json.loads(match[1]),dict),f'{file.name}: schema parses')
css=(root/'assets/musa.css').read_text()
check('prefers-reduced-motion:reduce' in css,'Reduced motion styling exists')
for file in list((root/'sections').glob('*.liquid'))+list((root/'snippets').glob('*.liquid')):
    for key in re.findall(r"'([a-z_]+\.[a-z_]+)'\s*\|\s*t",file.read_text()):
        check(key in keys(en),f'Translation {key} resolves')

handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(out))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as p:
    chromium=os.environ.get('MUSA_CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
    launch_options={'headless':True}
    if chromium: launch_options['executable_path']=chromium
    browser=p.chromium.launch(**launch_options)
    page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    for language,heading in [('en','your new era.'),('es','tu nueva era.')]:
        for width in [1440,390,320]:
            page.set_viewport_size({'width':width,'height':900})
            page.goto(base+'/index-'+language+'.html')
            check(heading in page.locator('h1').inner_text(),f'{language}/{width}: slogan rendered')
            check(page.locator('.demo-card').count()==4,f'{language}/{width}: four concept garments rendered')
            check(page.locator('.demo-disclaimer').count()==1,f'{language}/{width}: concept disclosure rendered')
            check(not page.evaluate('document.documentElement.scrollWidth > innerWidth'),f'{language}/{width}: no horizontal overflow')
            # Trigger actual lazy image loads before checking assets and capturing.
            page.evaluate('document.querySelectorAll("img").forEach(i=>i.loading="eager")')
            page.wait_for_function('Array.from(document.images).every(i=>i.complete)')
            check(page.locator('img').evaluate_all('(imgs)=>imgs.every(i=>i.naturalWidth>0)'),f'{language}/{width}: all images decode')
            if width==1440 and language=='en':page.screenshot(path=str(out/'MUSA-desktop.png'),full_page=True)
            if width==390 and language=='es':page.screenshot(path=str(out/'MUSA-mobile.png'),full_page=True)
            if width<901:
                page.locator('.menu-toggle').click();check(page.locator('#MobileMenu').is_visible(),'Mobile menu opens')
                page.keyboard.press('Escape');check(not page.locator('#MobileMenu').is_visible(),'Escape closes menu')
                check(page.locator('.menu-toggle').evaluate('(e)=>e===document.activeElement'),'Escape restores focus')
    page.locator('.menu-toggle').click()
    page.locator('#MobileMenu select[name=locale_code]').select_option('en')
    page.locator('#MobileMenu .locale-submit').click()
    page.wait_for_url('**/index-en.html')
    check(page.locator('html').get_attribute('lang')=='en','Preview language switch works')
    page.goto(base+'/qa/product.html?campaign=musa')
    check(page.locator('[data-price]').inner_text()=='89,00\u00a0€','Initial variant localized price rendered')
    page.locator('[data-quantity]').fill('8')
    page.locator('[data-variant-select]').select_option('102')
    check(page.locator('[data-add]').is_disabled(),'Sold-out variant disables purchase')
    check(page.locator('[data-price]').inner_text()=='95,00\u00a0€','Variant price updates with localized text')
    check(page.locator('[data-compare]').get_attribute('hidden') is not None,'Non-sale variant hides old price')
    check(page.locator('[data-quantity]').input_value()=='6','Quantity clamps to variant maximum')
    check('campaign=musa' in page.url and 'variant=102' in page.url,'Variant URL preserves other parameters')
    page.locator('[data-variant-select]').select_option('103')
    check(page.locator('[data-add]').is_enabled(),'Available variant re-enables purchase')
    check(page.locator('[data-quantity]').get_attribute('step')=='3','Variant quantity increment updates')
    check(page.locator('[data-quantity]').get_attribute('max') is None,'No stale maximum remains')
    page.locator('[data-option-input][value="M"]').check()
    check(page.locator('[data-add]').is_disabled(),'Size chip selects sold-out variant')
    page.locator('[data-option-input][value="Arena"]').check()
    check(page.locator('[data-variant-select]').input_value()=='103','Color selects nearest available combination')
    check(page.locator('[data-option-input][value="L"]').is_checked(),'Size chip synchronized after color change')
    check(not errors,'No browser JavaScript errors')
    browser.close()
server.shutdown()
print(f'{count} checks passed.')
