/* =========================================================
   Lumaré — storefront behaviour
   Edit CONFIG to change prices, bundles and checkout.
   ========================================================= */
const CONFIG = {
  currency: 'GBP',
  locale: 'en-GB',

  // Where "Secure checkout" sends the shopper.
  // Paste a Shopify cart permalink, Stripe Payment Link, etc.
  // Use {qty} to pass the total number of devices, e.g.
  // 'https://your-store.myshopify.com/cart/VARIANT_ID:{qty}'
  checkoutUrl: '',

  // Business days from order to delivery (used for "arrives by").
  deliveryDays: 3,

  // Bundles. `compareAt` is optional — only use a genuine previous price.
  bundles: [
    { id: 'single', qty: 1, name: 'Lumaré Duo', sub: 'Just for you', price: 89 },
    { id: 'pair', qty: 2, name: 'Duo for Two', sub: 'One each for you &amp; a loved one', price: 149, tag: 'Most popular', default: true },
    { id: 'family', qty: 3, name: 'Family Set', sub: 'Three devices · best value', price: 199, tag: 'Best value' },
  ],
};

document.documentElement.classList.remove('no-js');
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => new Intl.NumberFormat(CONFIG.locale, {
  style: 'currency', currency: CONFIG.currency,
  minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2,
}).format(n);
const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
const session = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const single = CONFIG.bundles[0];

/* ---------- Prices from CONFIG ---------- */
$$('[data-from-price]').forEach((el) => { el.textContent = `from ${money(single.price)}`; });
$$('[data-price-single]').forEach((el) => { el.textContent = money(single.price); });
$('[data-year]').textContent = new Date().getFullYear();

/* ---------- Announcement rotator ---------- */
(() => {
  const items = $$('[data-announce] p');
  if (items.length < 2 || reduceMotion) return;
  let i = 0;
  setInterval(() => {
    items[i].classList.remove('is-active');
    i = (i + 1) % items.length;
    items[i].classList.add('is-active');
  }, 4200);
})();

/* ---------- Header state ---------- */
const header = $('[data-header]');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Reveal on scroll ---------- */
(() => {
  const els = $$('.reveal, .spectrum');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const siblings = [...en.target.parentElement.children].filter((c) => c.classList.contains('reveal'));
      const idx = Math.max(0, siblings.indexOf(en.target));
      en.target.style.transitionDelay = `${Math.min(idx, 6) * 70}ms`;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  els.forEach((e) => io.observe(e));
})();

/* ---------- Statement: words light up as you scroll ---------- */
(() => {
  const el = $('[data-words]');
  if (!el) return;
  const wrap = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrap(n);
    });
  };
  wrap(el);
  const words = $$('.w', el);
  if (reduceMotion) { words.forEach((w) => w.classList.add('on')); return; }
  const update = () => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    const lit = Math.round(progress * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < lit));
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();

/* ---------- Modes tabs ---------- */
(() => {
  const tablist = $('.modes__tabs');
  const stage = $('.modes__stage');
  if (!tablist) return;
  const tabs = $$('[role="tab"]', tablist);
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
    });
    const mode = tab.dataset.mode;
    stage.dataset.stage = mode;
    tablist.classList.toggle('is-ear', mode === 'ear');
  };
  tabs.forEach((t) => t.addEventListener('click', () => select(t)));
  tablist.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0 || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.focus(); select(next);
  });
})();

/* ---------- Count-up stats ---------- */
(() => {
  const els = $$('[data-count]');
  if (!els.length || reduceMotion || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target; const target = +el.dataset.count; const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1400);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });
  els.forEach((e) => { e.textContent = '0'; io.observe(e); });
})();

/* ---------- Arrival date ---------- */
(() => {
  const el = $('[data-arrival]');
  if (!el) return;
  const d = new Date(); let added = 0;
  while (added < CONFIG.deliveryDays) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  el.textContent = d.toLocaleDateString(CONFIG.locale, { weekday: 'long', day: 'numeric', month: 'long' });
})();

/* ---------- Bundles ---------- */
const bundleWrap = $('[data-bundles]');
let selected = (CONFIG.bundles.find((b) => b.default) || single).id;
const bundleById = (id) => CONFIG.bundles.find((b) => b.id === id);

(() => {
  CONFIG.bundles.forEach((b) => {
    const save = single.price * b.qty - b.price;
    const compare = b.compareAt || (save > 0 ? single.price * b.qty : null);
    const label = document.createElement('label');
    label.className = 'bundle';
    label.innerHTML = `
      ${b.tag ? `<span class="bundle__tag">${b.tag}</span>` : ''}
      <input type="radio" name="bundle" value="${b.id}" ${b.id === selected ? 'checked' : ''}>
      <span class="bundle__radio" aria-hidden="true"></span>
      <span>
        <span class="bundle__name">${b.name}${save > 0 ? `<span class="bundle__save">Save ${money(save)}</span>` : ''}</span>
        <span class="bundle__sub">${b.sub}${b.qty > 1 ? ` · ${money(b.price / b.qty)} each` : ''}</span>
      </span>
      <span class="bundle__price"><strong>${money(b.price)}</strong>${compare ? `<s>${money(compare)}</s>` : ''}</span>`;
    bundleWrap.appendChild(label);
  });
  const sync = () => {
    $$('.bundle', bundleWrap).forEach((l) => l.classList.toggle('is-checked', $('input', l).checked));
    $('[data-buy-total]').textContent = money(bundleById(selected).price);
  };
  bundleWrap.addEventListener('change', (e) => { selected = e.target.value; sync(); });
  sync();
})();

/* ---------- Cart ---------- */
let cart = store.get('lumare-cart', []).filter((l) => bundleById(l.id));
const drawer = $('[data-drawer]');
const panel = $('.drawer__panel', drawer);
let lastFocus = null;

const saveCart = () => store.set('lumare-cart', cart);
const cartCount = () => cart.reduce((n, l) => n + l.qty * bundleById(l.id).qty, 0);
const cartTotal = () => cart.reduce((n, l) => n + l.qty * bundleById(l.id).price, 0);

function renderCart() {
  const countEl = $('[data-cart-count]');
  const n = cartCount();
  countEl.textContent = n;
  countEl.classList.toggle('has-items', n > 0);
  $('[data-cart-subtotal]').textContent = money(cartTotal());

  const items = $('[data-cart-items]');
  if (!cart.length) {
    items.innerHTML = `<div class="drawer__empty"><p>Your bag is empty.</p><a href="#shop" class="btn btn--primary" data-cart-close>Shop Lumaré Duo</a></div>`;
  } else {
    items.innerHTML = cart.map((l) => {
      const b = bundleById(l.id);
      return `<div class="line">
        <div class="line__img"><img src="assets/img/device.png" alt="" width="60" height="48"></div>
        <div>
          <div class="line__name">${b.name}</div>
          <div class="line__meta">${b.qty} device${b.qty > 1 ? 's' : ''} · Obsidian</div>
          <div class="qty" role="group" aria-label="Quantity for ${b.name}">
            <button type="button" data-dec="${b.id}" aria-label="Decrease quantity">−</button>
            <span>${l.qty}</span>
            <button type="button" data-inc="${b.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="line__right">
          <div class="line__price">${money(b.price * l.qty)}</div>
          <button type="button" class="line__remove" data-remove="${b.id}">Remove</button>
        </div>
      </div>`;
    }).join('');
  }

  // Upsell: nudge single-device shoppers to the pair bundle
  const upsell = $('[data-upsell]');
  const pair = bundleById('pair');
  const onlySingle = cart.length === 1 && cart[0].id === 'single' && cart[0].qty === 1;
  upsell.innerHTML = onlySingle && pair
    ? `<span>Upgrade to <strong>${pair.name}</strong> and save <strong>${money(single.price * 2 - pair.price)}</strong></span><button type="button" data-upgrade>Upgrade</button>`
    : '';
}

function addToCart(id, qty = 1) {
  const line = cart.find((l) => l.id === id);
  if (line) line.qty += qty; else cart.push({ id, qty });
  saveCart(); renderCart();
  const btn = $('[data-cart-open]');
  btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
}

function openCart() {
  lastFocus = document.activeElement;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => panel.focus(), 50);
}
function closeCart() {
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}

$('[data-add-to-cart]').addEventListener('click', () => { addToCart(selected); openCart(); });
$('[data-cart-open]').addEventListener('click', openCart);
drawer.addEventListener('click', (e) => {
  const t = e.target.closest('button, a');
  if (e.target.closest('[data-cart-close]')) { closeCart(); return; }
  if (!t) return;
  const { inc, dec, remove } = t.dataset;
  if (inc) { cart.find((l) => l.id === inc).qty++; }
  if (dec) { const l = cart.find((x) => x.id === dec); l.qty--; if (l.qty < 1) cart = cart.filter((x) => x !== l); }
  if (remove) { cart = cart.filter((l) => l.id !== remove); }
  if (t.hasAttribute('data-upgrade')) { cart = [{ id: 'pair', qty: 1 }]; toast('Upgraded to Duo for Two — nice choice.'); }
  if (inc || dec || remove || t.hasAttribute('data-upgrade')) { saveCart(); renderCart(); }
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (drawer.classList.contains('is-open')) closeCart();
  if (popup.classList.contains('is-open')) closePopup();
});
// keep focus inside the drawer while open
drawer.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const f = $$('button, a[href], input', panel).filter((x) => x.offsetParent !== null);
  if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
});

$('[data-checkout]').addEventListener('click', () => {
  if (!cart.length) { toast('Your bag is empty.'); return; }
  if (CONFIG.checkoutUrl) {
    window.location.href = CONFIG.checkoutUrl.replace('{qty}', cartCount());
  } else {
    toast('Checkout isn’t connected yet — add your checkout link in main.js.');
  }
});

renderCart();

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $('[data-toast]');
  t.textContent = msg; t.classList.add('is-visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-visible'), 3200);
}

/* ---------- Sticky mobile buy bar ---------- */
(() => {
  const bar = $('[data-sticky]');
  const hero = $('.hero');
  const shop = $('#shop');
  if (!bar || !('IntersectionObserver' in window)) return;
  let pastHero = false; let atShop = false;
  const sync = () => {
    const show = pastHero && !atShop;
    bar.classList.toggle('is-visible', show);
    bar.setAttribute('aria-hidden', String(!show));
    $('a', bar).tabIndex = show ? 0 : -1;
  };
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; sync(); }).observe(hero);
  new IntersectionObserver(([e]) => { atShop = e.isIntersecting; sync(); }, { threshold: 0.15 }).observe(shop);
})();

/* ---------- Newsletter ---------- */
$('[data-newsletter]').addEventListener('submit', (e) => {
  e.preventDefault();
  // TODO: send to your email platform (Klaviyo, Mailchimp, Shopify Customers…)
  $('[data-newsletter-msg]').textContent = 'Welcome to Lumaré — your 10% code is GLOW10.';
  e.target.reset();
});

/* ---------- Email popup (once per visitor) ---------- */
const popup = $('[data-popup]');
function openPopup() {
  if (store.get('lumare-popup-seen', false) || drawer.classList.contains('is-open')) return;
  store.set('lumare-popup-seen', true);
  popup.classList.add('is-open');
  popup.setAttribute('aria-hidden', 'false');
  setTimeout(() => $('input', popup).focus(), 100);
}
function closePopup() {
  popup.classList.remove('is-open');
  popup.setAttribute('aria-hidden', 'true');
}
$$('[data-popup-close]', popup).forEach((b) => b.addEventListener('click', closePopup));
$('[data-popup-form]').addEventListener('submit', (e) => {
  e.preventDefault();
  // TODO: send to your email platform
  e.target.hidden = true;
  $('[data-popup-success]').hidden = false;
  $('.popup__skip', popup).textContent = 'Continue shopping';
});
(() => {
  if (store.get('lumare-popup-seen', false) || session.get('lumare-no-popup')) return;
  const timer = setTimeout(openPopup, 25000);
  // exit intent on desktop
  document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget && e.clientY < 8) { clearTimeout(timer); openPopup(); }
  });
})();
