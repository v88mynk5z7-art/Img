/* =========================================================
   lumare.js — behaviour for the Lumaré Duo product page.
   Talks to Shopify's real cart via the AJAX Cart API.
   Safe to include from several sections: runs once.
   ========================================================= */
(() => {
  if (window.__lumareLoaded) return;
  window.__lumareLoaded = true;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  const shopEl = () => $('[data-lumare-buy]');
  // bind each element only once (init() re-runs when the theme editor reloads a section)
  const once = (el, key) => { if (!el || el.dataset['lmBound' + key]) return false; el.dataset['lmBound' + key] = '1'; return true; };
  const money = (cents) => {
    const el = shopEl();
    const currency = (el && el.dataset.currency) || 'GBP';
    const locale = (el && el.dataset.locale) || document.documentElement.lang || 'en-GB';
    const v = cents / 100;
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(v);
    } catch { return v.toFixed(2); }
  };

  function init() {
    /* ---------- Announcement rotator ---------- */
    $$('[data-lumare-announce]').forEach((track) => {
      if (!once(track, 'A')) return;
      const items = $$('p', track);
      if (items.length < 2 || reduceMotion) return;
      let i = 0;
      setInterval(() => {
        items[i].classList.remove('lumare-is-active');
        i = (i + 1) % items.length;
        items[i].classList.add('lumare-is-active');
      }, 4200);
    });

    /* ---------- Reveal on scroll ---------- */
    const reveals = $$('.lumare-reveal, .lumare-spectrum');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      reveals.forEach((e) => e.classList.add('lumare-is-in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const sib = [...en.target.parentElement.children].filter((c) => c.classList.contains('lumare-reveal'));
          en.target.style.transitionDelay = `${Math.min(Math.max(0, sib.indexOf(en.target)), 6) * 70}ms`;
          en.target.classList.add('lumare-is-in');
          io.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      reveals.forEach((e) => io.observe(e));
    }

    /* ---------- Statement: words light up on scroll ---------- */
    $$('[data-lumare-words]').forEach((el) => {
      if (!once(el, 'W')) return;
      const wrap = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((part) => {
              if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
              const s = document.createElement('span'); s.className = 'lumare-w'; s.textContent = part; frag.appendChild(s);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1) wrap(n);
        });
      };
      wrap(el);
      const words = $$('.lumare-w', el);
      if (reduceMotion) { words.forEach((w) => w.classList.add('lumare-on')); return; }
      const update = () => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
        const lit = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('lumare-on', i < lit));
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
    });

    /* ---------- Ritual tabs ---------- */
    $$('[data-lumare-modes]').forEach((sec) => {
      if (!once(sec, 'M')) return;
      const tablist = $('.lumare-modes__tabs', sec);
      const stage = $('.lumare-modes__stage', sec);
      const tabs = $$('[role="tab"]', tablist);
      const select = (tab) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute('aria-selected', on);
          t.tabIndex = on ? 0 : -1;
          const panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        stage.dataset.stage = tab.dataset.mode;
        tablist.classList.toggle('lumare-is-ear', tab.dataset.mode === 'ear');
      };
      tabs.forEach((t) => t.addEventListener('click', () => select(t)));
      tablist.addEventListener('keydown', (e) => {
        const i = tabs.indexOf(document.activeElement);
        if (i < 0 || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        next.focus(); select(next);
      });
    });

    /* ---------- Count-up stats ---------- */
    const counters = $$('[data-lumare-count]');
    if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target; const target = parseFloat(el.dataset.lumareCount) || 0; const t0 = performance.now();
          const tick = (t) => {
            const p = Math.min(1, (t - t0) / 1400);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.unobserve(el);
        });
      }, { threshold: 0.6 });
      counters.forEach((e) => { if (once(e, 'C') && /^\d+$/.test(e.dataset.lumareCount)) { e.textContent = '0'; io.observe(e); } });
    }

    initBuy();
    initSticky();
    initPopup();
  }

  /* =========================================================
     Buy box + cart drawer (Shopify AJAX Cart API)
     ========================================================= */
  let drawer; let panel; let lastFocus;

  function initBuy() {
    const buy = shopEl();
    drawer = $('[data-lumare-drawer]');
    panel = drawer && $('.lumare-drawer__panel', drawer);

    // Arrival date
    $$('[data-lumare-arrival]').forEach((el) => {
      const days = parseInt(el.dataset.lumareArrival, 10) || 3;
      const d = new Date(); let added = 0;
      while (added < days) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) added++; }
      el.textContent = d.toLocaleDateString(document.documentElement.lang || 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    });

    if (!buy || !once(buy, 'B')) return;

    // Gallery thumbnails
    const mainImg = $('.lumare-gallery__main img', buy);
    $$('[data-lumare-thumb]', buy).forEach((t) => t.addEventListener('click', () => {
      if (!mainImg) return;
      mainImg.src = t.dataset.src; mainImg.srcset = t.dataset.srcset || '';
      $$('[data-lumare-thumb]', buy).forEach((x) => x.setAttribute('aria-current', x === t));
    }));

    // Bundle selection → button total
    const form = $('form.lumare-form, form[data-lumare-form]', buy);
    if (!form) return;
    const totalEl = $('[data-lumare-buy-total]', buy);
    const sync = () => {
      const checked = $('input[name="id"]:checked', form);
      $$('.lumare-bundle', form).forEach((l) => l.classList.toggle('lumare-is-checked', !!$('input:checked', l)));
      if (checked && totalEl) totalEl.textContent = money(parseInt(checked.dataset.price, 10));
    };
    form.addEventListener('change', sync);
    sync();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('[type="submit"]', form);
      const checked = $('input[name="id"]:checked', form);
      if (!checked) return;
      btn.disabled = true; btn.classList.add('lumare-is-loading');
      try {
        const res = await fetch(`${root}cart/add.js`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: [{ id: parseInt(checked.value, 10), quantity: 1 }] }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast(err.description || err.message || 'Sorry, that couldn’t be added. Please try again.');
          return;
        }
        await refreshCart();
        openDrawer();
      } catch {
        form.submit(); // fall back to a normal post to /cart/add
      } finally {
        btn.disabled = false; btn.classList.remove('lumare-is-loading');
      }
    });

    if (!drawer || !once(drawer, 'D')) return;
    $$('[data-lumare-cart-open]').forEach((b) => b.addEventListener('click', async (e) => { e.preventDefault(); await refreshCart(); openDrawer(); }));
    drawer.addEventListener('click', async (e) => {
      if (e.target.closest('[data-lumare-cart-close]')) { closeDrawer(); return; }
      const t = e.target.closest('button');
      if (!t) return;
      const { inc, dec, remove, upgrade } = t.dataset;
      try {
        if (inc || dec || remove) {
          const key = inc || dec || remove;
          const line = (cartState.items || []).find((i) => i.key === key);
          if (!line) return;
          const quantity = remove ? 0 : line.quantity + (inc ? 1 : -1);
          await fetch(`${root}cart/change.js`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: key, quantity }) });
        }
        if (upgrade) {
          const [fromKey, toId] = upgrade.split('|');
          await fetch(`${root}cart/change.js`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: fromKey, quantity: 0 }) });
          await fetch(`${root}cart/add.js`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: parseInt(toId, 10), quantity: 1 }] }) });
          toast(drawer.dataset.upgradeToast || 'Upgraded — nice choice.');
        }
        await refreshCart();
      } catch { window.location.href = `${root}cart`; }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('lumare-is-open')) closeDrawer(); });
    drawer.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const f = $$('button, a[href], input', panel).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  }

  let cartState = {};
  async function refreshCart() {
    const res = await fetch(`${root}cart.js`, { headers: { Accept: 'application/json' } });
    cartState = await res.json();
    renderCart();
    updateThemeCartIcon();
  }

  function renderCart() {
    if (!drawer) return;
    const items = $('[data-lumare-cart-items]', drawer);
    $('[data-lumare-cart-subtotal]', drawer).textContent = money(cartState.total_price || 0);
    const lines = cartState.items || [];
    if (!lines.length) {
      items.innerHTML = `<div class="lumare-drawer__empty"><p>${drawer.dataset.emptyText || 'Your bag is empty.'}</p></div>`;
    } else {
      items.innerHTML = lines.map((l) => `
        <div class="lumare-line">
          <div class="lumare-line__img">${l.image ? `<img src="${l.image}${l.image.includes('?') ? '&' : '?'}width=160" alt="" width="60" height="60" loading="lazy">` : ''}</div>
          <div>
            <div class="lumare-line__name">${escapeHtml(l.product_title)}</div>
            ${l.variant_title ? `<div class="lumare-line__meta">${escapeHtml(l.variant_title)}</div>` : ''}
            <div class="lumare-qty" role="group" aria-label="Quantity">
              <button type="button" data-dec="${l.key}" aria-label="Decrease quantity">−</button>
              <span>${l.quantity}</span>
              <button type="button" data-inc="${l.key}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="lumare-line__right">
            <div class="lumare-line__price">${money(l.final_line_price)}</div>
            <button type="button" class="lumare-line__remove" data-remove="${l.key}">Remove</button>
          </div>
        </div>`).join('');
    }
    // Upsell: single device in the bag → offer the upgrade variant
    const up = $('[data-lumare-upsell]', drawer);
    const fromId = drawer.dataset.upsellFrom; const toId = drawer.dataset.upsellTo;
    const only = lines.length === 1 && String(lines[0].variant_id) === fromId && lines[0].quantity === 1;
    up.innerHTML = only && toId
      ? `<span>${drawer.dataset.upsellText || ''}</span><button type="button" data-upgrade="${lines[0].key}|${toId}">${drawer.dataset.upsellButton || 'Upgrade'}</button>`
      : '';
  }

  // Best effort: refresh the theme's own cart count (Dawn & most OS 2.0 themes)
  async function updateThemeCartIcon() {
    $$('[data-lumare-cart-count]').forEach((el) => { el.textContent = cartState.item_count || 0; });
    const bubble = document.getElementById('cart-icon-bubble');
    if (!bubble) return;
    try {
      const res = await fetch(`${root}?sections=cart-icon-bubble`);
      const data = await res.json();
      const html = new DOMParser().parseFromString(data['cart-icon-bubble'], 'text/html');
      const fresh = html.querySelector('.shopify-section') || html.body;
      bubble.innerHTML = fresh.innerHTML;
    } catch { /* theme doesn't expose it — ignore */ }
  }

  function openDrawer() {
    if (!drawer) { window.location.href = `${root}cart`; return; }
    lastFocus = document.activeElement;
    drawer.classList.add('lumare-is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => panel.focus(), 50);
  }
  function closeDrawer() {
    drawer.classList.remove('lumare-is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  let toastTimer;
  function toast(msg) {
    let t = $('[data-lumare-toast]');
    if (!t) { t = document.createElement('div'); t.className = 'lumare-toast'; t.dataset.lumareToast = ''; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('lumare-is-visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('lumare-is-visible'), 3200);
  }

  /* ---------- Sticky mobile buy bar ---------- */
  function initSticky() {
    const bar = $('[data-lumare-sticky]');
    const hero = $('[data-lumare-hero]');
    const buy = shopEl();
    const final = $('[data-lumare-final]');
    if (!bar || !once(bar, 'S') || !('IntersectionObserver' in window)) return;
    let pastHero = !hero; let atBuy = false; let atEnd = false;
    const sync = () => {
      const show = pastHero && !atBuy && !atEnd;
      bar.classList.toggle('lumare-is-visible', show);
      bar.setAttribute('aria-hidden', String(!show));
      $$('a, button', bar).forEach((x) => { x.tabIndex = show ? 0 : -1; });
    };
    if (hero) new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); }).observe(hero);
    if (buy) new IntersectionObserver(([e]) => { atBuy = e.isIntersecting; sync(); }, { threshold: 0.1 }).observe(buy);
    if (final) new IntersectionObserver(([e]) => { atEnd = e.isIntersecting || e.boundingClientRect.top < 0; sync(); }).observe(final);
    sync();
  }

  /* ---------- Email popup ---------- */
  function initPopup() {
    const popup = $('[data-lumare-popup]');
    if (!popup || !once(popup, 'P')) return;
    const open = () => {
      if (drawer && drawer.classList.contains('lumare-is-open')) return;
      store.set('lumare-popup-seen', '1');
      popup.classList.add('lumare-is-open');
      popup.setAttribute('aria-hidden', 'false');
      const input = $('input[type="email"]', popup);
      if (input) setTimeout(() => input.focus(), 100);
    };
    const close = () => { popup.classList.remove('lumare-is-open'); popup.setAttribute('aria-hidden', 'true'); };
    $$('[data-lumare-popup-close]', popup).forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popup.classList.contains('lumare-is-open')) close(); });
    if (popup.dataset.posted === 'true') { open(); return; } // just signed up — show the code
    if (window.Shopify && window.Shopify.designMode) return; // don't pop up inside the theme editor
    if (store.get('lumare-popup-seen')) return;
    const delay = (parseInt(popup.dataset.delay, 10) || 25) * 1000;
    const timer = setTimeout(open, delay);
    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget && e.clientY < 8 && !store.get('lumare-popup-seen')) { clearTimeout(timer); open(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // Theme editor: re-bind when a section is re-rendered
  document.addEventListener('shopify:section:load', (e) => {
    $$('.lumare-reveal', e.target).forEach((el) => el.classList.add('lumare-is-in'));
    init();
  });
})();
