/* MUSA "Seda Viva" (Claude, design layer): living-silk canvas, floating header state on the home,
   ink-in manifesto, magnetic CTA and reveal for the new blocks. Presentation only; commerce
   logic stays in assets/musa.js. Everything degrades to the static page without this file. */
(() => {
  if (window.musaSilk) return;
  window.musaSilk = true;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- silk canvas ---------- */
  function silk(stage) {
    const canvas = stage.querySelector('[data-silk-canvas]');
    if (!canvas || canvas.dataset.ready) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.dataset.ready = 'true';
    let W = 0, H = 0, t = 0, px = .5, py = .5, tx = .5, ty = .5, visible = true, running = false, last = 0;
    const bands = Array.from({ length: 9 }, (_, i) => ({ y: -.15 + i * .16, amp: .07 + (i % 3) * .025, f: 1.1 + (i % 4) * .22, sp: .12 + (i % 5) * .03, ph: i * 1.7, th: .085 + (i % 2) * .03 }));
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const yAt = (b, u, time) => {
      const pull = Math.exp(-Math.pow((u - px) * 2.4, 2)) * (py - .5) * .22;
      return (b.y + Math.sin(u * Math.PI * b.f + time * b.sp + b.ph) * b.amp + Math.sin(u * 7 + time * .35 + b.ph) * .012 + pull) * H;
    };
    const draw = () => {
      px += (tx - px) * .04; py += (ty - py) * .04;
      ctx.fillStyle = '#1a100b'; ctx.fillRect(0, 0, W, H);
      const step = Math.max(8, W / 90);
      bands.forEach((b, k) => {
        const th = b.th * H;
        ctx.beginPath();
        for (let x = -step; x <= W + step; x += step) { const y = yAt(b, x / W, t); x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        for (let x = W + step; x >= -step; x -= step) ctx.lineTo(x, yAt(b, x / W, t + .9) + th);
        ctx.closePath();
        const lift = .5 + .5 * Math.sin(t * .2 + k);
        const g = ctx.createLinearGradient(0, b.y * H - th, W * .3, b.y * H + th * 2);
        g.addColorStop(0, 'rgb(36,22,15)');
        g.addColorStop(.45, `rgb(${70 + lift * 30 | 0},${44 + lift * 18 | 0},${31 + lift * 12 | 0})`);
        g.addColorStop(1, 'rgb(30,18,12)');
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = `rgba(195,184,178,${(.05 + lift * .08).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke();
      });
    };
    const frame = now => {
      if (!visible || document.hidden || reduced()) { running = false; return; }
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      t += dt;
      if (!finePointer) { tx = .5 + Math.sin(t * .25) * .3; ty = .5 + Math.cos(t * .19) * .2; }
      draw();
      requestAnimationFrame(frame);
    };
    const start = () => { if (!running && visible && !document.hidden && !reduced()) { running = true; last = 0; requestAnimationFrame(frame); } };
    size(); t = 2; draw(); canvas.classList.add('is-live'); start();
    addEventListener('resize', () => { size(); draw(); }, { passive: true });
    if (finePointer) addEventListener('pointermove', e => { tx = e.clientX / innerWidth; ty = e.clientY / innerHeight; }, { passive: true });
    document.addEventListener('visibilitychange', start);
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(stage);
  }

  /* ---------- header + entrance recede on scroll ---------- */
  let stage = null, inner = null, ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (!stage) return;
      const h = stage.offsetHeight, s = scrollY;
      document.body.classList.toggle('silk-solid', s > h - 100 || menuOpen());
      if (inner && !reduced() && s < h) {
        const p = s / h;
        inner.style.transform = `translateY(${p * 120}px) scale(${1 - p * .08})`;
        inner.style.opacity = String(Math.max(0, 1 - p * 1.3));
      }
      ink();
    });
  }
  const menuOpen = () => document.querySelector('.menu-toggle')?.getAttribute('aria-expanded') === 'true';
  function headerState() {
    const main = document.getElementById('MainContent');
    const first = main && main.firstElementChild;
    stage = first && (first.matches('[data-silk-stage]') ? first : first.querySelector(':scope > [data-silk-stage]'));
    inner = stage && stage.querySelector('[data-silk-inner]');
    if (!stage) { document.body.classList.remove('silk-solid'); return; }
    const toggle = document.querySelector('.menu-toggle');
    if (toggle && !toggle.dataset.silkWatch) {
      toggle.dataset.silkWatch = 'true';
      new MutationObserver(onScroll).observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] });
    }
    onScroll();
  }

  /* ---------- manifesto inks in, word by word ---------- */
  let inkWords = [], inkEl = null;
  function prepareInk(root = document) {
    root.querySelectorAll('[data-ink]').forEach(el => {
      if (el.dataset.inkReady) return;
      el.dataset.inkReady = 'true';
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        if (!node.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const span = document.createElement('span');
          span.className = 'ink-w'; span.textContent = part; frag.append(span);
        });
        node.replaceWith(frag);
      });
      inkEl = el; inkWords = [...el.querySelectorAll('.ink-w')];
    });
  }
  function ink() {
    if (!inkEl || reduced()) return;
    const r = inkEl.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * .88 - r.top) / (r.height + innerHeight * .3)));
    const n = inkWords.length;
    inkWords.forEach((w, i) => w.style.setProperty('--ink', (.2 + Math.max(0, Math.min(1, p * n - i)) * .8).toFixed(3)));
  }

  /* ---------- magnetic CTA ---------- */
  function magnetic(root = document) {
    if (!finePointer || reduced()) return;
    root.querySelectorAll('[data-magnetic]').forEach(el => {
      if (el.dataset.magReady) return;
      el.dataset.magReady = 'true';
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .28}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- reveal for palette panels and catalog cards ---------- */
  function reveal(root = document) {
    const targets = root.querySelectorAll('[data-reveal], .musa-catalog-card, .musa-catalog-intro');
    if (reduced() || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    targets.forEach((el, i) => {
      if (el.dataset.revealReady) return;
      el.dataset.revealReady = 'true';
      if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
      el.style.setProperty('--reveal-delay', `${(i % 3) * .09}s`);
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in');
      io.observe(el);
    });
  }

  function init(root = document) {
    root.querySelectorAll('[data-silk-stage]').forEach(silk);
    prepareInk(root); magnetic(root); reveal(root); headerState();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  document.addEventListener('shopify:section:load', e => init(e.target));
  document.addEventListener('shopify:section:unload', () => setTimeout(headerState, 0));
})();
