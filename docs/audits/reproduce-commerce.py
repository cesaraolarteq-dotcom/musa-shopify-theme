"""Read-only browser reproductions; no live Shopify requests or repository writes."""
import ast, os, re, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[2]
js = (root/'assets/musa.js').read_text()
module = ast.parse((root/'scripts/validate-commerce.py').read_text())
node = next(n for n in module.body if isinstance(n, ast.Assign)
            and any(isinstance(t, ast.Name) and t.id == 'html' for t in n.targets))
cart = eval(compile(ast.Expression(node.value), 'fixture', 'eval'), {'script': js})
cart = cart.replace('<body>', '<head><style>.drawer-panel.is-busy{opacity:.7;pointer-events:none}</style></head><body>')
out = Path(os.environ.get('MUSA_OUTPUT_DIR', root.parent/'musa-deliverables'))
product = (out/'qa/product.html').read_text()
# Use current source JS, retaining only rendered template HTML from the fixture.
section = re.search(r'(<section class="product-page[\s\S]*?</section>)', product).group(1)
product = '<!doctype html><html><head><meta charset="utf-8"></head><body>'+section+'<script>'+js+'</script></body></html>'
quick = ('<button data-quick-view="/a?view=quick">A</button>'
         '<button data-quick-view="/b?view=quick">B</button>'
         '<dialog data-quick-view-dialog><button data-dialog-close>Close</button>'
         '<div data-quick-view-content></div></dialog><script>'+js+'</script>')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('MUSA_CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome'), headless=True)
    page = browser.new_page()
    page.route("**/*", lambda route: route.abort())
    for name, html in [('cart', cart), ('product', product), ('quick', quick)]:
        page.route('https://musa.test/'+name,
                   lambda r, request, body=html: r.fulfill(body=body, content_type='text/html'))
    page.goto('https://musa.test/cart')
    page.evaluate('''() => {window.calls=[];window.fetch=(url,options)=>{
      calls.push(JSON.parse(options.body));return new Promise(()=>{});};}''')
    page.locator('[data-cart-open]').click()
    page.locator('[data-cart-change]').focus()
    page.keyboard.press('Enter')
    page.keyboard.press('Enter')
    print('CART_REQUESTS', page.evaluate('window.calls'))
    page.goto('https://musa.test/product')
    page.locator('[data-variant-select]').select_option('103')
    print('VARIANT_STATE', page.evaluate('''({
      selected:document.querySelector('[data-variant-select]').value,
      chips:[...document.querySelectorAll('[data-option-input]:checked')].map(e=>e.value),
      price:document.querySelector('[data-price]').textContent})'''))
    page.goto('https://musa.test/quick')
    page.evaluate('''() => {window.requests=[];
      window.fetch=url=>new Promise(resolve=>requests.push({url,resolve}));}''')
    page.locator('[data-quick-view="/a?view=quick"]').click()
    page.locator('[data-dialog-close]').click()
    page.locator('[data-quick-view="/b?view=quick"]').click()
    for index, title in [(1, 'B'), (0, 'A')]:
        markup = section.replace('QA product', title)
        page.evaluate('([i,html])=>requests[i].resolve({text:()=>Promise.resolve(html)})', [index, markup])
        page.wait_for_timeout(80)
        print('RESPONSE', title, 'VISIBLE_TITLE', page.locator('h1').inner_text())
    browser.close()
