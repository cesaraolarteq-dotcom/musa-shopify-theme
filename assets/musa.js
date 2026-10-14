(() => {
  const config = window.musa || { cartDrawer: false, routes: {}, strings: {} };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- cart drawer ---------- */
  const drawer = {
    el: () => document.querySelector('[data-cart-drawer]'),
    lastFocus: null,
    open() {
      const el = this.el(); if (!el) return false;
      this.lastFocus = document.activeElement;
      el.hidden = false;
      requestAnimationFrame(() => el.classList.add('is-open'));
      document.documentElement.classList.add('drawer-locked');
      el.querySelector('.drawer-panel')?.focus();
      document.querySelectorAll('[data-cart-open]').forEach(a => a.setAttribute('aria-expanded', 'true'));
      return true;
    },
    close() {
      const el = this.el(); if (!el || el.hidden) return;
      el.classList.remove('is-open');
      document.documentElement.classList.remove('drawer-locked');
      document.querySelectorAll('[data-cart-open]').forEach(a => a.setAttribute('aria-expanded', 'false'));
      setTimeout(() => { el.hidden = true; }, reduced() ? 0 : 320);
      if (this.lastFocus) this.lastFocus.focus();
    },
    render(html) {
      const el = this.el(); if (!el || !html) return;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const fresh = doc.querySelector('[data-cart-drawer]'); if (!fresh) return;
      const wasOpen = !el.hidden;
      el.replaceWith(fresh);
      if (wasOpen) { fresh.hidden = false; fresh.classList.add('is-open'); }
      const count = fresh.dataset.count;
      document.querySelectorAll('[data-cart-count]').forEach(c => { c.textContent = count; });
      document.querySelectorAll('[data-cart-open]').forEach(a => a.setAttribute('aria-label', a.getAttribute('aria-label').replace(/\(\d+\)/, `(${count})`)));
    }
  };

  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-cart-open]');
    if (opener && config.cartDrawer && drawer.el()) { e.preventDefault(); drawer.open(); return; }
    if (e.target.closest('[data-drawer-close]')) { drawer.close(); return; }
    const change = e.target.closest('[data-cart-change]');
    if (change) {
      const line = change.closest('[data-line]');
      const panel = change.closest('.drawer-panel');
      panel?.classList.add('is-busy');
      fetch(config.routes.cartChange, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line: Number(line.dataset.line), quantity: Math.max(0, Number(change.dataset.cartChange)), sections: ['cart-drawer'], sections_url: location.pathname })
      }).then(r => r.json()).then(data => {
        if (data.sections) drawer.render(data.sections['cart-drawer']);
        document.querySelector('[data-cart-drawer] .drawer-panel')?.focus();
      }).catch(() => panel?.classList.remove('is-busy'));
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') drawer.close();
    if (e.key === 'Tab') {
      const el = drawer.el(); if (!el || el.hidden) return;
      const items = [...el.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')].filter(n => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el.querySelector('.drawer-panel'))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- dialogs (size guide, quick view) ---------- */
  document.addEventListener('click', e => {
    const guide = e.target.closest('[data-size-guide-open]');
    if (guide) { guide.closest('[data-product-section]')?.querySelector('[data-size-guide]')?.showModal(); return; }
    const close = e.target.closest('[data-dialog-close]');
    if (close) { close.closest('dialog')?.close(); return; }
    if (e.target.tagName === 'DIALOG') e.target.close();
  });

  const quickDialog = () => document.querySelector('[data-quick-view-dialog]');
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-quick-view]');
    if (!btn) return;
    const dialog = quickDialog(); if (!dialog) return;
    e.preventDefault();
    const content = dialog.querySelector('[data-quick-view-content]');
    content.innerHTML = '<div class="quick-view-loading" aria-busy="true"></div>';
    dialog.showModal();
    fetch(btn.dataset.quickView).then(r => r.text()).then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const section = doc.querySelector('[data-product-section]');
      if (!section) { location.href = btn.dataset.quickView.split('?')[0]; return; }
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => s.remove());
      content.replaceChildren(section);
      section.classList.add('is-quick');
      const title = section.querySelector('h1');
      if (title) { const link = document.createElement('a'); link.href = btn.dataset.quickView.split('?')[0]; link.className = 'text-link quick-view-full'; link.textContent = title.textContent; title.replaceChildren(link); }
      init(content);
    }).catch(() => { location.href = btn.dataset.quickView.split('?')[0]; });
  });

  /* ---------- product: variants, swatches, quantity, add to bag ---------- */
  function initProduct(section) {
    if (section.dataset.ready) return;
    section.dataset.ready = 'true';
    const select = section.querySelector('[data-variant-select]');
    const variants = JSON.parse(section.querySelector('[data-variants]').textContent);
    const picker = section.querySelector('[data-variant-picker]');
    const groups = picker ? [...picker.querySelectorAll('[data-option-group]')] : [];
    const qty = section.querySelector('[data-quantity]');
    const add = section.querySelector('[data-add]');
    const sticky = section.querySelector('[data-sticky-atc]');
    const form = section.querySelector('[data-product-form]');
    const errorBox = section.querySelector('[data-form-error]');

    const selectedOptions = () => groups.map(g => g.querySelector('[data-option-input]:checked')?.value);

    function refreshAvailability() {
      const chosen = selectedOptions();
      groups.forEach((group, i) => {
        group.querySelectorAll('[data-option-input]').forEach(input => {
          // A value is crossed out when, combined with the other current choices, it is sold out or doesn't exist.
          const candidate = chosen.slice(); candidate[i] = input.value;
          const exact = variants.find(v => v.options.every((o, j) => o === candidate[j]));
          input.closest('label').classList.toggle('is-unavailable', !(exact && exact.available));
        });
        const current = group.querySelector('[data-option-current]');
        if (current) current.textContent = chosen[i] || '';
      });
    }

    function applyVariant(variant) {
      if (!variant) return;
      section.querySelector('[data-price]').textContent = variant.price;
      const compare = section.querySelector('[data-compare]');
      compare.hidden = !variant.compare; compare.textContent = variant.compare || '';
      [add, sticky?.querySelector('[data-sticky-add]')].forEach(btn => {
        if (!btn) return;
        btn.disabled = !variant.available;
        btn.querySelector('[data-add-label]').textContent = variant.available ? add.dataset.availableText : add.dataset.unavailableText;
      });
      if (sticky) {
        sticky.querySelector('[data-sticky-price]').textContent = variant.price;
        const label = sticky.querySelector('[data-sticky-variant]'); if (label && groups.length) label.textContent = variant.title;
      }
      qty.min = variant.min; qty.step = variant.step;
      if (variant.max != null) qty.max = variant.max; else qty.removeAttribute('max');
      const step = Number(variant.step) || 1, min = Number(variant.min) || 1;
      let value = Math.max(min, Number(qty.value) || min);
      value = min + Math.ceil((value - min) / step) * step;
      if (variant.max != null) value = Math.min(value, Number(variant.max));
      qty.value = value;
      if (!section.classList.contains('is-quick')) {
        const url = new URL(window.location.href); url.searchParams.set('variant', variant.id); history.replaceState({}, '', url);
      }
      if (variant.media) section.querySelector(`[id$="-${variant.media}"]`)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' });
      if (errorBox) errorBox.hidden = true;
    }

    select.addEventListener('change', () => applyVariant(variants.find(v => String(v.id) === select.value)));

    if (picker) {
      picker.addEventListener('change', e => {
        const input = e.target.closest('[data-option-input]'); if (!input) return;
        const chosen = selectedOptions();
        const index = groups.indexOf(input.closest('[data-option-group]'));
        let variant = variants.find(v => v.options.every((o, j) => o === chosen[j]));
        if (!variant) {
          // Keep the clicked value and pick the closest available combination.
          variant = variants.find(v => v.options[index] === input.value && v.available) || variants.find(v => v.options[index] === input.value);
          if (variant) groups.forEach((g, j) => { const r = [...g.querySelectorAll('[data-option-input]')].find(x => x.value === variant.options[j]); if (r) r.checked = true; });
        }
        if (!variant) return;
        select.value = String(variant.id);
        applyVariant(variant);
        refreshAvailability();
      });
      refreshAvailability();
    }

    section.querySelectorAll('[data-qty-step]').forEach(btn => btn.addEventListener('click', () => {
      const step = Number(qty.step) || 1, min = Number(qty.min) || 1, max = qty.max ? Number(qty.max) : Infinity;
      qty.value = Math.min(max, Math.max(min, (Number(qty.value) || min) + step * Number(btn.dataset.qtyStep)));
    }));

    if (form && config.cartDrawer && document.querySelector('[data-cart-drawer]')) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const buttons = [add, sticky?.querySelector('[data-sticky-add]')].filter(Boolean);
        buttons.forEach(b => { b.disabled = true; b.setAttribute('aria-busy', 'true'); b.querySelector('[data-add-label]').textContent = add.dataset.addingText; });
        const body = new FormData(form);
        body.append('sections', 'cart-drawer'); body.append('sections_url', location.pathname);
        fetch(config.routes.cartAdd, { method: 'POST', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body })
          .then(r => r.json().then(data => ({ ok: r.ok, data })))
          .then(({ ok, data }) => {
            if (!ok) throw new Error(data.description || data.message || config.strings.error);
            quickDialog()?.open && quickDialog().close();
            drawer.render(data.sections && data.sections['cart-drawer']);
            drawer.open();
          })
          .catch(err => { if (errorBox) { errorBox.textContent = err.message || config.strings.error; errorBox.hidden = false; } })
          .finally(() => {
            const variant = variants.find(v => String(v.id) === select.value);
            buttons.forEach(b => { b.removeAttribute('aria-busy'); b.disabled = !(variant && variant.available); b.querySelector('[data-add-label]').textContent = variant && variant.available ? add.dataset.availableText : add.dataset.unavailableText; });
          });
      });
    }

    if (sticky && add && 'IntersectionObserver' in window && !section.classList.contains('is-quick')) {
      new IntersectionObserver(([entry]) => {
        const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        sticky.classList.toggle('is-visible', show);
        sticky.setAttribute('aria-hidden', String(!show));
        sticky.querySelector('[data-sticky-add]').tabIndex = show ? 0 : -1;
      }).observe(add);
    }
  }

  /* ---------- mobile menu ---------- */
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
    root.querySelectorAll('[data-product-section]').forEach(initProduct);
  }
  init();
  document.addEventListener('shopify:section:load', () => init());
})();
