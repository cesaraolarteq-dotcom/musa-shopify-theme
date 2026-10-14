/* MUSA "Seda Viva" (Claude, design layer): living-silk canvas, floating header on the home,
   ink-in manifesto, magnetic CTA, reveal and catalog swatches. Presentation only; commerce
   logic stays in assets/musa.js and assets/musa-catalog.js.
   Robustness rules (Codex review D2-3895582):
   - Content is visible by default; motion classes are added only after the controller is running.
   - The floating header exists only while html.silk-float is set (inline flag in silk-hero.liquid,
     confirmed here, removed if this file never runs).
   - Turning on reduced motion mid-session removes every inline motion style. */
(() => {
  if (window.musaSilk) return;
  window.musaSilk = true;
  const root = document.documentElement;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- silk canvas (one controller per stage, cleaned up on section unload) ---------- */
  const stages = new Map();
  function silk(stage) {
    if (stages.has(stage)) return;
    const canvas = stage.querySelector('[data-silk-canvas]');
    const ctx = canvas && canvas.getContext('2d');
    const off = new AbortController();
    const ctl = { start() {}, destroy() { off.abort(); } };
    stages.set(stage, ctl);
    videoControl(stage, off.signal);
    if (!ctx) return;
    let W = 0, H = 0, t = 2, px = .5, py = .5, tx = .5, ty = .5, visible = true, running = false, last = 0, alive = true;
    const bands = Array.from({ length: 9 }, (_, i) => ({ y: -.15 + i * .16, amp: .07 + (i % 3) * .025, f: 1.1 + (i % 4) * .22, sp: .12 + (i % 5) * .03, ph: i * 1.7, th: .085 + (i % 2) * .03 }));
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, finePointer ? 2 : 1.25);
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
      if (!alive || !visible || document.hidden || reduced()) { running = false; return; }
      if (!finePointer && last && now - last < 30) { requestAnimationFrame(frame); return; }
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      t += dt;
      if (!finePointer) { tx = .5 + Math.sin(t * .25) * .3; ty = .5 + Math.cos(t * .19) * .2; }
      draw();
      requestAnimationFrame(frame);
    };
    ctl.start = () => { if (alive && !running && visible && !document.hidden && !reduced()) { running = true; last = 0; requestAnimationFrame(frame); } };
    size(); draw(); canvas.classList.add('is-live'); stage.classList.add('is-live'); ctl.start();
    const opts = { passive: true, signal: off.signal };
    addEventListener('resize', () => { size(); draw(); }, opts);
    if (finePointer) addEventListener('pointermove', e => { tx = e.clientX / innerWidth; ty = e.clientY / innerHeight; }, opts);
    document.addEventListener('visibilitychange', ctl.start, { signal: off.signal });
    let io = null;
    if ('IntersectionObserver' in window) { io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; stage.classList.toggle('is-offscreen', !visible); ctl.start(); }); io.observe(stage); }
    ctl.destroy = () => { alive = false; off.abort(); io && io.disconnect(); };
  }

  /* ---------- campaign video: accessible pause, paused under reduced motion ---------- */
  function videoControl(stage, signal) {
    const video = stage.querySelector('video.silk-media');
    const button = stage.querySelector('[data-silk-video-toggle]');
    if (!video) return;
    const sync = () => {
      if (!button) return;
      const paused = video.paused;
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? button.dataset.playLabel : button.dataset.pauseLabel);
      button.classList.toggle('is-paused', paused);
    };
    if (reduced()) video.pause();
    if (button) {
      button.hidden = false;
      button.addEventListener('click', () => { video.paused ? video.play().catch(() => {}) : video.pause(); }, { signal });
    }
    video.addEventListener('play', sync, { signal });
    video.addEventListener('pause', sync, { signal });
    sync();
  }

  /* ---------- floating header + entrance recede on scroll ---------- */
  let stage = null, inner = null, ticking = false, toggleWatch = null;
  const menuOpen = () => document.querySelector('.menu-toggle')?.getAttribute('aria-expanded') === 'true';
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (stage) {
        const h = stage.offsetHeight, s = scrollY;
        root.classList.toggle('silk-solid', s > h - 100 || menuOpen());
        if (inner && reduced()) { inner.style.transform = ''; inner.style.opacity = ''; }
        else if (inner) {
          const p = Math.min(1, s / h);
          inner.style.transform = `translateY(${p * 120}px) scale(${1 - p * .08})`;
          inner.style.opacity = String(Math.max(0, 1 - p * 1.3));
        }
      }
      ink();
    });
  }
  function headerState() {
    const main = document.getElementById('MainContent');
    const first = main && main.firstElementChild;
    stage = first ? (first.matches('[data-silk-stage]') ? first : first.querySelector(':scope > [data-silk-stage]')) : null;
    inner = stage && stage.querySelector('[data-silk-inner]');
    root.classList.toggle('silk-float', !!stage);
    if (!stage) { root.classList.remove('silk-solid'); return; }
    const toggle = document.querySelector('.menu-toggle');
    if (toggle && toggleWatch?.target !== toggle) {
      toggleWatch?.observer.disconnect();
      const observer = new MutationObserver(onScroll);
      observer.observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] });
      toggleWatch = { target: toggle, observer };
    }
    onScroll();
  }

  /* ---------- manifesto inks in, word by word ---------- */
  let inkTargets = [];
  function prepareInk(scope = document) {
    scope.querySelectorAll('[data-ink]').forEach(el => {
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
      inkTargets.push({ el, words: [...el.querySelectorAll('.ink-w')] });
    });
  }
  function ink() {
    inkTargets = inkTargets.filter(x => x.el.isConnected);
    if (reduced()) return;
    inkTargets.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight * .88 - r.top) / (r.height + innerHeight * .3)));
      words.forEach((w, i) => w.style.setProperty('--ink', (.2 + Math.max(0, Math.min(1, p * words.length - i)) * .8).toFixed(3)));
    });
  }

  /* ---------- magnetic CTA ---------- */
  function magnetic(scope = document) {
    if (!finePointer) return;
    scope.querySelectorAll('[data-magnetic]').forEach(el => {
      if (el.dataset.magReady) return;
      el.dataset.magReady = 'true';
      el.addEventListener('pointermove', e => {
        if (reduced()) return;
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .28}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- reveal: hidden state is added only once the observer is watching ---------- */
  let revealIO = null;
  function reveal(scope = document) {
    if (reduced() || !('IntersectionObserver' in window)) return;
    revealIO = revealIO || new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    scope.querySelectorAll('[data-reveal], .musa-catalog-card, .musa-catalog-intro').forEach((el, i) => {
      if (el.classList.contains('silk-reveal')) return;
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.style.setProperty('--reveal-delay', `${(i % 3) * .09}s`);
      el.classList.add('silk-reveal');
      revealIO.observe(el);
    });
  }

  /* ---------- reduced motion switched on/off without reloading ---------- */
  function settleMotion() {
    if (reduced()) {
      if (inner) { inner.style.transform = ''; inner.style.opacity = ''; }
      inkTargets.forEach(({ words }) => words.forEach(w => w.style.removeProperty('--ink')));
      document.querySelectorAll('[data-magnetic]').forEach(el => { el.style.transform = ''; });
      document.querySelectorAll('.silk-reveal').forEach(el => el.classList.add('is-in'));
      document.querySelectorAll('video.silk-media').forEach(v => v.pause());
    } else {
      stages.forEach(ctl => ctl.start());
      onScroll();
    }
  }

  /* ---------- catalog: colour swatches + size tags over the native select ----------
     The select stays the source of truth; a click sets its value and fires `change`,
     so assets/musa-catalog.js keeps updating the sizes exactly as before.
     Colours are visual approximations of the provisional colour names. */
  const SW = {
    'almond / khaki': ['#d8c3a5', '#a89a72'], 'almendra / caqui': ['#d8c3a5', '#a89a72'],
    'berry red': ['#9b2335'], 'rojo baya': ['#9b2335'], 'black': ['#1f1a17'], 'negro': ['#1f1a17'],
    'blue': ['#2f5fa7'], 'azul': ['#2f5fa7'],
    'blue with light blue': ['#2f5fa7', '#a9c8e8'], 'azul con azul claro': ['#2f5fa7', '#a9c8e8'],
    'brown': ['#6b4430'], 'marrón': ['#6b4430'], 'butter yellow': ['#f1df9a'], 'amarillo mantequilla': ['#f1df9a'],
    'cherry blossom pink': ['#f2b8c6'], 'rosa cerezo': ['#f2b8c6'], 'chocolate brown': ['#4a2c1f'], 'marrón chocolate': ['#4a2c1f'],
    'cream yellow': ['#f3e6b8'], 'amarillo crema': ['#f3e6b8'],
    'dark brown with yellow': ['#3b2418', '#e8c547'], 'marrón oscuro con amarillo': ['#3b2418', '#e8c547'],
    'dark coffee': ['#3b2418'], 'café oscuro': ['#3b2418'], 'deep blue': ['#1f3b73'], 'azul profundo': ['#1f3b73'],
    'deep coffee': ['#4a2e20'], 'café intenso': ['#4a2e20'], 'fig brown': ['#6e4a4f'], 'marrón higo': ['#6e4a4f'],
    'ice blue': ['#cfe3ef'], 'azul hielo': ['#cfe3ef'], 'indigo blue': ['#2e3a7a'], 'azul índigo': ['#2e3a7a'],
    'ink blue': ['#1c2a4a'], 'azul tinta': ['#1c2a4a'], 'ivory yellow': ['#f4ecc9'], 'amarillo marfil': ['#f4ecc9'],
    'light lilac': ['#cdbbe0'], 'lila claro': ['#cdbbe0'], 'mocha': ['#7a5642'], 'moca': ['#7a5642'],
    'orange': ['#e07a2e'], 'naranja': ['#e07a2e'], 'pine green': ['#2f4f3e'], 'verde pino': ['#2f4f3e'],
    'purple': ['#6b3f8f'], 'morado': ['#6b3f8f'], 'strawberry pink': ['#e45d7f'], 'rosa fresa': ['#e45d7f'],
    'taupe / truffle': ['#9c8b7d', '#6b5a4e'], 'topo / trufa': ['#9c8b7d', '#6b5a4e'],
    'white': ['#fbfaf7'], 'blanco': ['#fbfaf7'], 'wine': ['#5e1a2a'], 'vino': ['#5e1a2a'],
    'wine / berry': ['#5e1a2a', '#9b2335'], 'vino / baya': ['#5e1a2a', '#9b2335']
  };
  const swatchBg = name => {
    const c = SW[name.trim().toLowerCase()] || ['#cfc3b6'];
    return c.length > 1 ? `linear-gradient(135deg, ${c[0]} 0 50%, ${c[1]} 50% 100%)` : c[0];
  };
  function catalogSwatches(root = document) {
    root.querySelectorAll('[data-catalog-color]').forEach(select => {
      const control = select.closest('[data-catalog-color-control]');
      if (!control || control.classList.contains('is-enhanced')) return;
      const label = control.querySelector('label');
      const sizesOut = control.querySelector('[data-catalog-sizes]');
      const head = document.createElement('p');
      head.className = 'cat-color-head';
      head.append(label ? label.textContent.trim() : '');
      const current = document.createElement('span');
      head.append(current);
      const group = document.createElement('div');
      group.className = 'cat-swatches';
      group.setAttribute('role', 'radiogroup');
      if (label) group.setAttribute('aria-label', label.textContent.trim());
      const tags = document.createElement('span');
      tags.className = 'cat-sizes';
      tags.setAttribute('aria-hidden', 'true');
      const buttons = [...select.options].map((opt, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'cat-swatch'; b.title = opt.textContent.trim();
        b.setAttribute('role', 'radio'); b.setAttribute('aria-label', opt.textContent.trim());
        b.innerHTML = '<i></i>';
        b.firstChild.style.setProperty('--sw', swatchBg(opt.textContent));
        b.addEventListener('click', () => choose(i, true));
        b.addEventListener('keydown', e => {
          const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (!step) return;
          e.preventDefault();
          const next = (i + step + buttons.length) % buttons.length;
          choose(next, true); buttons[next].focus();
        });
        group.append(b);
        return b;
      });
      function choose(i, fromUser) {
        const opt = select.options[i];
        buttons.forEach((b, k) => { b.setAttribute('aria-checked', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
        current.textContent = opt.textContent.trim();
        tags.replaceChildren(...(opt.dataset.sizes || '').split('·').map(s => s.trim()).filter(Boolean).map((s, n) => {
          const t = document.createElement('span'); t.className = 'cat-size'; t.style.setProperty('--n', n); t.textContent = s; return t;
        }));
        if (fromUser && select.selectedIndex !== i) { select.selectedIndex = i; select.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      control.insertBefore(group, control.firstChild);
      control.insertBefore(head, group);
      if (sizesOut) { sizesOut.classList.add('is-enhanced'); sizesOut.parentNode.append(tags); }
      select.tabIndex = -1;
      select.setAttribute('aria-hidden', 'true');
      select.addEventListener('change', () => choose(Math.max(0, select.selectedIndex), false));
      control.classList.add('is-enhanced');
      choose(Math.max(0, select.selectedIndex), false);
    });
  }

  /* ---------- pause decorative SVG wave drift while off screen ---------- */
  let waveIO = null;
  function pauseWaves(scope = document) {
    if (!('IntersectionObserver' in window)) return;
    waveIO = waveIO || new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('is-offscreen', !e.isIntersecting)));
    scope.querySelectorAll('.brand-art').forEach(el => { if (!el.dataset.waveWatch) { el.dataset.waveWatch = 'true'; waveIO.observe(el); } });
  }

  function init(scope = document) {
    pauseWaves(scope);
    scope.querySelectorAll('[data-silk-stage]').forEach(silk);
    catalogSwatches(scope);
    prepareInk(scope); magnetic(scope); reveal(scope); headerState();
  }
  function unload(scope) {
    stages.forEach((ctl, el) => { if (scope.contains(el)) { ctl.destroy(); stages.delete(el); } });
    setTimeout(headerState, 0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  motionQuery.addEventListener('change', settleMotion);
  document.addEventListener('shopify:section:load', e => init(e.target));
  document.addEventListener('shopify:section:unload', e => unload(e.target));
  document.addEventListener('shopify:section:reorder', () => setTimeout(headerState, 0));
})();
