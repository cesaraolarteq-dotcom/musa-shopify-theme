(() => {
  function init(root = document) {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.getElementById('MobileMenu');
    if (toggle && menu && !toggle.dataset.ready) {
      toggle.dataset.ready = 'true';
      const close = (focus = false) => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); if (focus) toggle.focus(); };
      toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); menu.hidden = !open; });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) close(true); });
      menu.addEventListener('click', e => { if (e.target.closest('a')) close(); });
      matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) close(); });
    }
    root.querySelectorAll('[data-product-section]').forEach(section => {
      if (section.dataset.ready) return;
      section.dataset.ready = 'true';
      const select = section.querySelector('[data-variant-select]');
      const variants = JSON.parse(section.querySelector('[data-variants]').textContent);
      select.addEventListener('change', () => {
        const variant = variants.find(v => String(v.id) === select.value);
        if (!variant) return;
        section.querySelector('[data-price]').textContent = variant.price;
        const compare = section.querySelector('[data-compare]');
        compare.hidden = !variant.compare; compare.textContent = variant.compare || '';
        const add = section.querySelector('[data-add]'); add.disabled = !variant.available;
        add.querySelector('[data-add-label]').textContent = variant.available ? add.dataset.availableText : add.dataset.unavailableText;
        const qty = section.querySelector('[data-quantity]');
        qty.min = variant.min; qty.step = variant.step;
        if (variant.max != null) qty.max = variant.max; else qty.removeAttribute('max');
        const step = Number(variant.step) || 1, min = Number(variant.min) || 1;
        let value = Math.max(min, Number(qty.value) || min);
        value = min + Math.ceil((value - min) / step) * step;
        if (variant.max != null) value = Math.min(value, Number(variant.max));
        qty.value = value;
        const url = new URL(window.location.href); url.searchParams.set('variant', variant.id); history.replaceState({}, '', url);
        if (variant.media) section.querySelector(`#Media-${variant.media}`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
      });
    });
  }
  init();
  document.addEventListener('shopify:section:load', () => init());
})();
