/* Aumbry storefront: shared chrome (header, menus, bag, footer) and page logic. */
(function () {
  const O = window.AUMBRY;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const page = document.body.dataset.page;

  /* ---------- utilities ---------- */
  const store = {
    mem: {},
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return k in this.mem ? this.mem[k] : d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { this.mem[k] = v; } },
  };
  const money = n => "£" + (Math.round(n * 100) % 100 ? n.toFixed(2) : String(Math.round(n)));
  const img = p => `assets/img/products/${p.id}.jpg`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const kindTag = p => p.kind === "rx" ? `<span class="tag tag--rx">Prescription</span>` : p.kind === "p" ? `<span class="tag">Pharmacy medicine</span>` : "";
  const unitText = p => p.unit === "month" ? "/ month" : p.unit === "2 months" ? "/ 2 months" : "";
  const fromPrice = p => `${p.from ? "<small>From</small> " : ""}${money(p.price)} <small>${unitText(p)}</small>`;
  const planPrice = (opt, plan) => Math.round(opt.price * plan.mult * (1 - (plan.save || 0)));
  const hash = () => decodeURIComponent(location.hash.replace("#", ""));

  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("is-on"), 3200);
  }

  /* ---------- bag ---------- */
  const Bag = {
    items() { return store.get("aumbry-bag", []); },
    save(items) { store.set("aumbry-bag", items); renderBag(); updateCount(); },
    add(item) {
      const items = this.items();
      const key = [item.id, item.opt, item.plan, item.consult ? "c" : ""].join("|");
      const found = items.find(i => i.key === key);
      if (found && !item.consult) found.qty += 1; else if (!found) items.push({ ...item, key, qty: 1 });
      this.save(items);
    },
    remove(key) { this.save(this.items().filter(i => i.key !== key)); },
    qty(key, d) { const items = this.items(); const it = items.find(i => i.key === key); if (!it) return; it.qty = Math.max(1, it.qty + d); this.save(items); },
    clear() { this.save([]); },
    line(it) {
      const p = O.byId[it.id]; if (!p) return null;
      const opt = p.options.find(o => o.id === it.opt) || p.options[0];
      const plan = p.plans.find(x => x.id === it.plan) || p.plans[0];
      return { p, opt, plan, each: planPrice(opt, plan), total: planPrice(opt, plan) * it.qty };
    },
    subtotal() { return this.items().reduce((s, it) => s + (this.line(it)?.total || 0), 0); },
    count() { return this.items().reduce((s, it) => s + it.qty, 0); },
  };
  window.AumbryBag = Bag;

  /* ---------- chrome ---------- */
  const navCols = [["weight", "hair"], ["sexual", "skin"], ["hormones", "wellness"], ["testing"]];
  const catList = c => O.products.filter(p => p.cat === c);

  function header() {
    const megaCols = navCols.map(col => `<div class="mega-col">${col.map(cid => {
      const c = O.catById[cid];
      return `<div><h4><a href="shop.html#${cid}">${c.name}</a></h4><ul>${catList(cid).map(p => `<li><a href="product.html#${p.id}">${p.name}</a></li>`).join("")}</ul></div>`;
    }).join("")}${col.length === 1 ? `<div><a class="link" href="shop.html">All treatments</a></div>` : ""}</div>`).join("");
    const h = document.createElement("div");
    h.innerHTML = `
      <div class="announce"><div class="wrap"><span>Prescribed by UK-registered clinicians</span><span>Free tracked delivery on every plan</span><span>Plain, unbranded packaging</span></div></div>
      <header class="site-header" id="site-header">
        <div class="wrap bar">
          <div style="display:flex;align-items:center">
            <button class="menu-btn icon-btn" aria-label="Open menu" data-open="nav-drawer"><span></span><span></span></button>
            <nav class="nav-primary" aria-label="Primary">
              <button type="button" aria-expanded="false" aria-controls="mega" data-mega>Treatments</button>
              <a href="shop.html" ${page === "shop" ? 'aria-current="page"' : ""}>Shop</a>
              <a href="how-it-works.html" ${page === "how" ? 'aria-current="page"' : ""}>How it works</a>
              <a href="about.html" ${page === "about" ? 'aria-current="page"' : ""}>About</a>
            </nav>
          </div>
          <a class="wordmark" href="index.html" aria-label="Aumbry home">AUMBRY</a>
          <div class="nav-tools">
            <a class="hide-sm" href="help.html">Help</a>
            <a class="hide-sm" href="account.html">Account</a>
            <button type="button" data-open="bag-drawer" aria-label="Open bag">Bag<span class="bag-count num" data-bag-count>0</span></button>
          </div>
        </div>
        <div class="mega" id="mega" hidden>
          <div class="wrap">${megaCols}
            <a class="mega-feature" href="product.html#tirzepatide">
              <img src="assets/img/products/tirzepatide.jpg" alt="Tirzepatide pen and carton" loading="lazy">
              <span class="label">The weight programme</span>
              <span style="font-family:var(--font-display);font-size:1.3rem">Weekly treatment with a clinician beside you</span>
            </a>
          </div>
        </div>
      </header>
      <div class="drawer-scrim" data-scrim hidden></div>
      <aside class="drawer drawer--left" id="nav-drawer" aria-label="Menu" aria-hidden="true">
        <div class="drawer-head"><a class="wordmark" href="index.html" style="margin:0">AUMBRY</a><button class="icon-btn" data-close>Close</button></div>
        <div class="drawer-body mnav">
          ${O.categories.map(c => `<details><summary>${c.name}</summary><ul>${catList(c.id).map(p => `<li><a href="product.html#${p.id}">${p.name}</a></li>`).join("")}<li><a href="shop.html#${c.id}">All ${c.name.toLowerCase()}</a></li></ul></details>`).join("")}
          <a href="how-it-works.html">How it works</a>
          <a href="about.html">About</a>
          <a href="help.html">Help</a>
          <a href="account.html">Account</a>
        </div>
        <div class="drawer-foot"><a class="btn" href="consultation.html">Start a consultation</a></div>
      </aside>
      <aside class="drawer drawer--right" id="bag-drawer" aria-label="Bag" aria-hidden="true">
        <div class="drawer-head"><span class="label">Your bag</span><button class="icon-btn" data-close>Close</button></div>
        <div class="drawer-body" data-bag-body></div>
        <div class="drawer-foot" data-bag-foot></div>
      </aside>`;
    document.body.prepend(...h.childNodes);
  }

  function footer() {
    const f = document.createElement("footer");
    f.className = "site-footer";
    f.innerHTML = `
      <div class="wrap">
        <div class="foot-top">
          <div class="foot-brand">
            <a class="wordmark" href="index.html">AUMBRY</a>
            <p>Private medicine, prescribed by clinicians and delivered with discretion.</p>
            <form class="news" data-news><label class="label" for="news-email" style="position:absolute;left:-9999px">Email</label><input id="news-email" type="email" placeholder="Email for clinical updates" required><button type="submit">Join</button></form>
            <p class="news-msg" data-news-msg aria-live="polite"></p>
          </div>
          <div><h5>Treatments</h5><ul>${O.categories.slice(0, 5).map(c => `<li><a href="shop.html#${c.id}">${c.name}</a></li>`).join("")}</ul></div>
          <div><h5>More</h5><ul><li><a href="shop.html#wellness">Wellness</a></li><li><a href="shop.html#testing">Health testing</a></li><li><a href="how-it-works.html">How it works</a></li><li><a href="about.html">About Aumbry</a></li></ul></div>
          <div><h5>Support</h5><ul><li><a href="help.html">Help centre</a></li><li><a href="help.html#contact">Contact us</a></li><li><a href="account.html">Your account</a></li><li><a href="legal.html#complaints">Complaints</a></li></ul></div>
        </div>
        <div class="foot-reg">
          <p>Aumbry Health Ltd is registered in England and Wales, company no. <span class="placeholder">00000000</span>. Prescriptions are issued by UK-registered prescribers and dispensed by our partner pharmacy, GPhC registration <span class="placeholder">0000000</span>. Our online clinical service is regulated by the Care Quality Commission, provider ID <span class="placeholder">0-000000000</span>. If you feel unwell, call NHS 111. In an emergency, call 999.</p>
          <nav class="foot-legal" aria-label="Legal"><a href="legal.html#terms">Terms</a><a href="legal.html#privacy">Privacy</a><a href="legal.html#cookies">Cookies</a><a href="legal.html#regulation">Regulation</a><span>© ${new Date().getFullYear()} Aumbry Health</span></nav>
        </div>
      </div>`;
    document.body.appendChild(f);
  }

  function updateCount() { $$("[data-bag-count]").forEach(el => el.textContent = Bag.count()); }

  function renderBag() {
    const body = $("[data-bag-body]"), foot = $("[data-bag-foot]");
    if (!body) return;
    const items = Bag.items();
    if (!items.length) {
      body.innerHTML = `<div class="bag-empty"><h4>Your bag is empty</h4><p class="small">Prescription treatments are added after a short consultation. Supplements, skincare and tests can go straight in.</p><a class="link" href="shop.html">Browse treatments</a></div>`;
      foot.innerHTML = ""; return;
    }
    body.innerHTML = items.map(it => {
      const l = Bag.line(it); if (!l) return "";
      return `<div class="bag-line">
        <img src="${img(l.p)}" alt="">
        <div>
          <span class="label">${l.p.kind === "rx" ? "Prescription · pending review" : O.catById[l.p.cat].name}</span>
          <h5>${esc(l.p.name)}</h5>
          <div class="meta">${esc(l.opt.label)} · ${esc(l.plan.label)}</div>
          ${it.consult ? "" : `<div class="qty"><button aria-label="Decrease" data-q="${it.key}" data-d="-1">−</button><span>${it.qty}</span><button aria-label="Increase" data-q="${it.key}" data-d="1">+</button></div>`}
        </div>
        <div style="display:grid;justify-items:end;align-content:space-between"><span class="num">${money(l.total)}</span><button class="bag-remove" data-rm="${it.key}">Remove</button></div>
      </div>`;
    }).join("");
    const hasRx = items.some(it => O.byId[it.id]?.kind === "rx");
    foot.innerHTML = `<div class="sum-row"><span>Subtotal</span><span class="num">${money(Bag.subtotal())}</span></div>
      <div class="sum-row small"><span>Delivery</span><span>Free</span></div>
      ${hasRx ? `<p class="small">Prescription items are charged only once a clinician approves them.</p>` : ""}
      <a class="btn btn--block" href="checkout.html">Checkout <span class="arrow">→</span></a>`;
  }

  function wireChrome() {
    const scrim = $("[data-scrim]");
    let open = null;
    const openDrawer = id => {
      closeDrawer(); open = $("#" + id); if (!open) return;
      scrim.hidden = false; requestAnimationFrame(() => { scrim.classList.add("is-open"); open.classList.add("is-open"); });
      open.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
      setTimeout(() => open && $("[data-close]", open)?.focus(), 50);
    };
    const closeDrawer = () => {
      if (!open) return; open.classList.remove("is-open"); open.setAttribute("aria-hidden", "true"); scrim.classList.remove("is-open");
      setTimeout(() => { if (!$(".drawer.is-open")) scrim.hidden = true; }, 300);
      document.body.style.overflow = ""; open = null;
    };
    window.AumbryOpenBag = () => openDrawer("bag-drawer");
    document.addEventListener("click", e => {
      const o = e.target.closest("[data-open]"); if (o) { e.preventDefault(); openDrawer(o.dataset.open); }
      if (e.target.closest("[data-close]") || e.target === scrim) closeDrawer();
      const q = e.target.closest("[data-q]"); if (q) Bag.qty(q.dataset.q, +q.dataset.d);
      const rm = e.target.closest("[data-rm]"); if (rm) Bag.remove(rm.dataset.rm);
      const add = e.target.closest("[data-add]");
      if (add) { const p = O.byId[add.dataset.add]; Bag.add({ id: p.id, opt: p.options[0].id, plan: p.plans[0].id }); toast(`${p.name} added to your bag`); openDrawer("bag-drawer"); }
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") { closeDrawer(); setMega(false); } });

    // mega menu
    const megaBtn = $("[data-mega]"), mega = $("#mega"), hdr = $("#site-header");
    const setMega = on => { if (!megaBtn) return; megaBtn.setAttribute("aria-expanded", String(on)); mega.hidden = !on; };
    megaBtn?.addEventListener("click", () => setMega(megaBtn.getAttribute("aria-expanded") !== "true"));
    megaBtn?.addEventListener("mouseenter", () => { if (matchMedia("(hover: hover)").matches) setMega(true); });
    hdr?.addEventListener("mouseleave", () => { if (matchMedia("(hover: hover)").matches) setMega(false); });
    document.addEventListener("click", e => { if (!e.target.closest("#site-header")) setMega(false); });

    const onScroll = () => hdr?.classList.toggle("is-scrolled", scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true }); onScroll();

    $("[data-news]")?.addEventListener("submit", e => { e.preventDefault(); $("[data-news-msg]").textContent = "Thank you. You're on the list."; e.target.reset(); });
  }

  /* ---------- shared pieces ---------- */
  function card(p) {
    const cat = O.catById[p.cat];
    const action = p.kind === "rx"
      ? `<a class="quick" href="consultation.html#${p.id}">Start consultation</a>`
      : `<button class="quick" data-add="${p.id}">Add to bag</button>`;
    return `<article class="card">
      <a class="card-media" href="product.html#${p.id}">${kindTag(p)}<img src="${img(p)}" alt="${esc(p.name)}, ${esc(p.format)}" loading="lazy" width="960" height="1200"></a>
      <div class="card-body">
        <span class="label">${cat.name} · ${esc(p.format)}</span>
        <h3><a href="product.html#${p.id}">${esc(p.name)}</a></h3>
        <p>${esc(p.tagline)}</p>
        <div class="card-foot"><span class="price">${fromPrice(p)}</span>${action}</div>
      </div>
    </article>`;
  }

  function doseChart(p) {
    const d = p.dose; if (!d) return "";
    const W = 600, H = 250, L = 46, R = 20, T = 34, B = 40;
    const n = d.steps.length, max = Math.ceil(Math.max(...d.steps) / 5) * 5 || 1;
    const x = i => L + (i / n) * (W - L - R), y = v => T + (1 - v / max) * (H - T - B);
    let path = `M ${x(0)} ${y(d.steps[0])}`, area = `M ${x(0)} ${y(0)} L ${x(0)} ${y(d.steps[0])}`;
    d.steps.forEach((v, i) => {
      if (i) { path += ` L ${x(i)} ${y(d.steps[i - 1])} L ${x(i)} ${y(v)}`; area += ` L ${x(i)} ${y(d.steps[i - 1])} L ${x(i)} ${y(v)}`; }
    });
    path += ` L ${x(n)} ${y(d.steps[n - 1])}`; area += ` L ${x(n)} ${y(d.steps[n - 1])} L ${x(n)} ${y(0)} Z`;
    const ticks = [0, max / 2, max];
    return `<svg class="dose-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.name)} dose schedule: ${d.steps.map(s => s + " " + d.unit).join(", ")}, each for ${d.every}">
      <g class="grid">${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/>`).join("")}</g>
      <g class="axis">${ticks.map(t => `<text x="${L - 10}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join("")}
        <text x="${L - 10}" y="${T - 16}" text-anchor="end">${d.unit.toUpperCase()}</text>
        ${d.steps.map((_, i) => `<text x="${x(i) + 4}" y="${H - 14}">WK ${i * 4 + 1}</text>`).join("")}</g>
      <path class="area" d="${area}"/><path class="step" d="${path}"/>
      ${d.steps.map((v, i) => `<circle class="dot" cx="${(x(i) + x(i + 1)) / 2}" cy="${y(v)}" r="3.5"/><text class="val" x="${(x(i) + x(i + 1)) / 2}" y="${y(v) - 11}" text-anchor="middle">${v}</text>`).join("")}
    </svg>`;
  }

  /* ---------- pages ---------- */
  const pages = {};

  pages.home = () => {
    const cats = $("[data-cats]");
    if (cats) {
      const lead = { weight: "tirzepatide", hair: "finasteride", sexual: "sildenafil", skin: "tretinoin", hormones: "hrt", wellness: "vitamin-d", testing: "blood-panel" };
      cats.innerHTML = O.categories.map((c, i) => {
        const min = Math.min(...catList(c.id).map(p => p.price));
        const wide = i >= 5;
        return `<a class="cat ${i === 0 ? "cat--lead" : ""} ${wide ? "cat--wide" : ""}" href="shop.html#${c.id}">
          <img src="assets/img/products/${lead[c.id]}.jpg" alt="" loading="lazy">
          <div class="cat-info"><div><span class="label">${c.line}</span><h3>${c.name}</h3>${wide ? `<p>${c.blurb}</p>` : ""}</div><span class="label num">From ${money(min)}</span></div>
        </a>`;
      }).join("");
    }
    const best = $("[data-best]");
    if (best) best.innerHTML = ["tirzepatide", "finasteride", "tretinoin", "hrt"].map(id => card(O.byId[id])).join("");
    const dc = $("[data-dose-home]"); if (dc) dc.innerHTML = doseChart(O.byId.tirzepatide);
  };

  pages.shop = () => {
    const grid = $("[data-grid]"), chips = $("[data-chips]"), count = $("[data-count]"), sort = $("#sort"), type = $("#type");
    const intro = $("[data-intro]");
    chips.innerHTML = `<a class="chip" href="#all" data-cat="all">All</a>` + O.categories.map(c => `<a class="chip" href="#${c.id}" data-cat="${c.id}">${c.name}</a>`).join("");
    const draw = () => {
      const cat = O.catById[hash()] ? hash() : "all";
      $$(".chip", chips).forEach(c => c.classList.toggle("is-active", c.dataset.cat === cat));
      let list = O.products.filter(p => cat === "all" || p.cat === cat);
      if (type.value === "rx") list = list.filter(p => p.kind === "rx");
      if (type.value === "otc") list = list.filter(p => p.kind !== "rx");
      if (sort.value === "low") list = [...list].sort((a, b) => a.price - b.price);
      if (sort.value === "high") list = [...list].sort((a, b) => b.price - a.price);
      grid.innerHTML = list.map(card).join("") || `<p class="lede">Nothing matches those filters. <button class="link" data-reset>Clear filters</button></p>`;
      count.textContent = `${list.length} ${list.length === 1 ? "treatment" : "treatments"}`;
      const c = O.catById[cat];
      intro.innerHTML = c
        ? `<div class="stack-sm"><span class="label">${c.line}</span><h1>${c.name}</h1></div><p class="lede">${c.blurb}</p>`
        : `<div class="stack-sm"><span class="label">The Aumbry formulary</span><h1>All <em>treatments</em></h1></div><p class="lede">Prescription treatments need a short online consultation. Supplements, skincare and tests can be ordered straight away.</p>`;
      document.title = (c ? c.name : "Treatments") + " · Aumbry";
    };
    addEventListener("hashchange", draw); sort.addEventListener("change", draw); type.addEventListener("change", draw);
    grid.addEventListener("click", e => { if (e.target.closest("[data-reset]")) { type.value = "all"; location.hash = "all"; draw(); } });
    draw();
  };

  pages.product = () => {
    const root = $("[data-pdp]");
    const draw = () => {
      const p = O.byId[hash()] || O.byId.tirzepatide;
      const c = O.catById[p.cat];
      document.title = `${p.name} · Aumbry`;
      const rx = p.kind === "rx";
      root.innerHTML = `
        <div class="wrap"><nav class="crumbs label" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="shop.html#${c.id}">${c.name}</a><span aria-hidden="true">/</span><span>${esc(p.name)}</span></nav></div>
        <div class="wrap pdp">
          <div class="gallery">
            <div class="thumbs" role="group" aria-label="Product images">
              <button aria-pressed="true" data-view="full"><img src="${img(p)}" alt="Product"></button>
              <button aria-pressed="false" data-view="zoom"><img src="${img(p)}" alt="Label detail" style="transform:scale(1.9);transform-origin:50% 46%"></button>
              <button aria-pressed="false" data-view="box"><img src="assets/img/editorial/discreet.jpg" alt="Delivery box"></button>
            </div>
            <div class="stage"><img data-stage src="${img(p)}" alt="${esc(p.name)}, ${esc(p.format)}" width="960" height="1200"></div>
          </div>
          <div class="buy">
            <div class="buy-head">
              <span class="label">${c.name} · ${esc(p.format)}${rx ? " · Prescription only" : p.kind === "p" ? " · Pharmacy medicine" : ""}</span>
              <h1>${esc(p.name)}</h1>
              <p class="lede">${esc(p.tagline)}</p>
            </div>
            <div class="meta-list">${p.facts.map(([k, v]) => `<div><span class="label">${k}</span><span>${v}</span></div>`).join("")}</div>
            <form class="stack-lg" data-buy>
              <fieldset class="opt-group"><legend class="label"><span>${p.optionLabel}</span>${rx && p.dose ? `<span>Set by your clinician</span>` : ""}</legend>
                <div class="opts">${p.options.map((o, i) => `<label class="opt"><input type="radio" name="opt" value="${o.id}" ${i === 0 ? "checked" : ""}><span>${o.label}</span></label>`).join("")}</div>
              </fieldset>
              <fieldset class="opt-group"><legend class="label">${rx ? "Plan" : "Purchase"}</legend>
                <div class="plans">${p.plans.map((pl, i) => `<label class="plan"><input type="radio" name="plan" value="${pl.id}" ${i === 0 ? "checked" : ""}><span><strong>${pl.label}</strong>${pl.note ? `<span class="small">${pl.note}</span>` : ""}${pl.save ? `<span class="save">Save ${Math.round(pl.save * 100)}%</span>` : ""}</span><span class="num" data-plan-price="${pl.id}"></span></label>`).join("")}</div>
              </fieldset>
              ${rx
                ? `<div class="stack-sm"><a class="btn btn--block" data-consult href="consultation.html#${p.id}">Start your consultation <span class="arrow">→</span></a><p class="small" style="text-align:center">About 5 minutes. You pay only if a clinician prescribes.</p></div>
                   <div class="notice"><span class="notice-mark">Rx</span><span><b>Prescription only.</b> ${esc(p.eligibility || "A clinician reviews every consultation before prescribing.")}</span></div>`
                : `<button class="btn btn--block" type="submit">Add to bag · <span data-total class="num"></span></button>
                   ${p.kind === "p" ? `<div class="notice"><span class="notice-mark">P</span><span><b>Pharmacy medicine.</b> Our pharmacist asks three short questions at checkout before dispatch.</span></div>` : ""}`}
            </form>
            <div class="acc">
              <details open><summary>About ${esc(p.name)}</summary><div class="acc-body"><p>${esc(p.summary)}</p></div></details>
              <details><summary>What's included</summary><div class="acc-body"><ul>${p.includes.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div></details>
              <details><summary>How to use</summary><div class="acc-body"><ul>${p.how.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div></details>
              <details><summary>Side effects and safety</summary><div class="acc-body"><ul>${p.safety.map(i => `<li>${esc(i)}</li>`).join("")}</ul><p class="small">Always read the patient information leaflet supplied with your medicine.</p></div></details>
              <details><summary>Delivery</summary><div class="acc-body"><p>${p.dose ? "Pens travel in a chilled, insulated box with tracked next-day delivery. Put them in the fridge when they arrive." : "Free tracked delivery in 1 to 3 working days."} Everything arrives in a plain box with no product names on the outside.</p></div></details>
            </div>
          </div>
        </div>
        ${p.dose ? `<section class="section section--ink"><div class="wrap split">
            <div class="stack"><span class="label">Dose schedule</span><h2>A gradual start, <em>reviewed every month</em></h2><p class="lede">${esc(p.dose.note)}</p><a class="btn btn--light" href="consultation.html#${p.id}">Check your eligibility</a></div>
            <div>${doseChart(p)}</div></div></section>` : ""}
        <section class="section"><div class="wrap">
          <div class="head"><div class="stack-sm"><span class="label">Often paired with</span><h2>Related <em>treatments</em></h2></div><a class="link" href="shop.html#${c.id}">All ${c.name.toLowerCase()}</a></div>
          <div class="grid-products grid-products--3">${p.related.map(id => O.byId[id]).filter(Boolean).map(card).join("")}</div>
        </div></section>`;

      const form = $("[data-buy]", root);
      const update = () => {
        const opt = p.options.find(o => o.id === form.opt.value) || p.options[0];
        p.plans.forEach(pl => { const el = $(`[data-plan-price="${pl.id}"]`, root); if (el) el.textContent = money(planPrice(opt, pl)); });
        const plan = p.plans.find(x => x.id === form.plan.value) || p.plans[0];
        const t = $("[data-total]", root); if (t) t.textContent = money(planPrice(opt, plan));
        const cl = $("[data-consult]", root); if (cl) { try { sessionStorage.setItem("aumbry-pick", JSON.stringify({ id: p.id, opt: opt.id, plan: plan.id })); } catch {} }
      };
      form.addEventListener("change", update); update();
      form.addEventListener("submit", e => { e.preventDefault(); Bag.add({ id: p.id, opt: form.opt.value, plan: form.plan.value }); toast(`${p.name} added to your bag`); window.AumbryOpenBag(); });
      $$(".thumbs button", root).forEach(b => b.addEventListener("click", () => {
        $$(".thumbs button", root).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        const st = $("[data-stage]", root);
        st.src = b.dataset.view === "box" ? "assets/img/editorial/discreet.jpg" : img(p);
        st.classList.toggle("zoom", b.dataset.view === "zoom");
        st.style.objectFit = "cover";
      }));
      scrollTo({ top: 0 });
    };
    addEventListener("hashchange", draw); draw();
  };

  /* ---------- consultation ---------- */
  pages.consult = () => {
    const root = $("[data-consult]");
    const key = hash();
    let product = O.byId[key];
    let catId = product ? product.cat : (O.catById[key] ? key : null);
    const rxIn = c => O.products.filter(p => p.cat === c && p.kind === "rx");
    const rxCats = O.categories.filter(c => rxIn(c.id).length);
    let pick = {}; try { pick = JSON.parse(sessionStorage.getItem("aumbry-pick") || "{}"); } catch {}

    const A = { cat: catId, product: product && product.kind === "rx" ? product.id : null, units: "metric", conditions: [], history: [] };
    if (A.cat && !A.product) A.product = rxIn(A.cat)[0]?.id || null;
    if (product && product.kind !== "rx") { A.cat = null; A.product = null; }

    const STEPS = ["Treatment", "About you", "Your answers", "Medical history", "Review"];
    let step = 0;

    const specific = {
      weight: () => `
        <div class="stack-sm"><span class="label">Step 3 of 5</span><h2>Your measurements</h2><p class="small">We use your BMI to check whether weight treatment is appropriate. You'll confirm your weight with a photo later.</p></div>
        <div class="chips" role="group" aria-label="Units"><button type="button" class="chip" aria-pressed="${A.units === "metric"}" data-units="metric">cm / kg</button><button type="button" class="chip" aria-pressed="${A.units === "imperial"}" data-units="imperial">ft / st</button></div>
        ${A.units === "metric"
          ? `<div class="form-grid"><label class="field"><span>Height (cm)</span><input id="h-cm" type="number" inputmode="decimal" min="120" max="230" value="${A.hcm || ""}" required></label><label class="field"><span>Weight (kg)</span><input id="w-kg" type="number" inputmode="decimal" min="35" max="300" step="0.1" value="${A.wkg || ""}" required></label></div>`
          : `<div class="form-grid"><label class="field"><span>Height (ft)</span><input id="h-ft" type="number" min="4" max="7" value="${A.hft || ""}" required></label><label class="field"><span>(in)</span><input id="h-in" type="number" min="0" max="11" value="${A.hin ?? ""}"></label><label class="field"><span>Weight (st)</span><input id="w-st" type="number" min="5" max="45" value="${A.wst || ""}" required></label><label class="field"><span>(lb)</span><input id="w-lb" type="number" min="0" max="13" value="${A.wlb ?? ""}"></label></div>`}
        <div class="bmi" aria-live="polite"><div><span class="label">Your BMI</span><div class="bmi-value" data-bmi>–</div></div><div><div class="bmi-scale"><span class="bmi-marker" data-bmi-marker style="left:0"></span></div><div class="bmi-ticks"><span>18.5</span><span>25</span><span>30</span><span>40+</span></div><p class="small" data-bmi-note style="margin-top:10px">Enter your height and weight.</p></div></div>
        <fieldset class="opt-group"><legend class="label">Do you have any of these weight-related conditions?</legend>
          <div class="choices choices--2">${["Type 2 diabetes or prediabetes", "High blood pressure", "High cholesterol", "Obstructive sleep apnoea", "Heart disease", "None of these"].map(o => `<label class="choice"><input type="checkbox" name="cond" value="${o}" ${A.conditions.includes(o) ? "checked" : ""}><span>${o}</span></label>`).join("")}</div>
        </fieldset>`,
      hair: () => radios("Step 3 of 5", "Your hair", [
        ["pattern", "Where are you losing hair?", ["Receding hairline", "Thinning at the crown", "Both hairline and crown", "Patchy or all-over thinning"]],
        ["since", "When did you first notice it?", ["Less than a year ago", "1 to 5 years ago", "More than 5 years ago"]],
      ]),
      sexual: () => radios("Step 3 of 5", "Your symptoms", [
        ["often", "How often do you have difficulty getting or keeping an erection?", ["Occasionally", "About half the time", "Most of the time"]],
        ["pref", "Which would suit you better?", ["Take a tablet when I need it", "Take one every day and not plan ahead"]],
      ]),
      skin: () => radios("Step 3 of 5", "Your skin", [
        ["concern", "What would you most like to treat?", ["Acne and breakouts", "Fine lines and texture", "Uneven tone and pigmentation"]],
        ["used", "Have you used a retinoid before?", ["No, never", "Yes, over the counter retinol", "Yes, prescription tretinoin"]],
      ]),
      hormones: () => `
        <div class="stack-sm"><span class="label">Step 3 of 5</span><h2>Your symptoms</h2></div>
        <fieldset class="opt-group"><legend class="label">Which symptoms do you have? Choose all that apply.</legend>
          <div class="choices choices--2">${["Hot flushes", "Night sweats", "Poor sleep", "Low mood or anxiety", "Brain fog", "Joint aches", "Low libido", "Vaginal dryness"].map(o => `<label class="choice"><input type="checkbox" name="cond" value="${o}" ${A.conditions.includes(o) ? "checked" : ""}><span>${o}</span></label>`).join("")}</div>
        </fieldset>
        ${radioGroup("periods", "Which best describes your periods?", ["Still regular", "Irregular or changing", "Stopped less than 12 months ago", "Stopped more than 12 months ago"])}
        ${radioGroup("womb", "Have you had a hysterectomy?", ["No", "Yes"])}`,
    };

    const history = {
      weight: [["Medullary thyroid cancer or MEN2 (you or a close relative)", "block"], ["Pancreatitis", "block"], ["Pregnant, breastfeeding or trying to conceive", "block"], ["Type 1 diabetes", "block"], ["A current or past eating disorder", "review"], ["Gallbladder disease", "review"]],
      hair: [["Prostate cancer or a raised PSA", "review"], ["Depression or low mood, now or in the past", "review"], ["Liver disease", "review"]],
      sexual: [["I take nitrates (such as GTN spray) or use poppers", "block"], ["Heart attack or stroke in the last 6 months", "block"], ["Very low or uncontrolled blood pressure", "block"], ["Sickle cell anaemia or a blood cancer", "review"]],
      skin: [["Pregnant, breastfeeding or trying to conceive", "block"], ["Eczema or rosacea on the face", "review"]],
      hormones: [["Breast cancer, now or in the past", "block"], ["A blood clot (DVT or pulmonary embolism)", "review"], ["Stroke or heart attack", "review"], ["Liver disease", "review"], ["Unexplained vaginal bleeding", "block"]],
    };

    function radioGroup(name, q, opts) {
      return `<fieldset class="opt-group"><legend class="label">${q}</legend><div class="choices">${opts.map(o => `<label class="choice"><input type="radio" name="${name}" value="${o}" ${A[name] === o ? "checked" : ""} required><span>${o}</span></label>`).join("")}</div></fieldset>`;
    }
    function radios(lab, title, groups) {
      return `<div class="stack-sm"><span class="label">${lab}</span><h2>${title}</h2></div>${groups.map(g => radioGroup(...g)).join("")}`;
    }

    const bmi = () => {
      let h, w;
      if (A.units === "metric") { h = (+A.hcm || 0) / 100; w = +A.wkg || 0; }
      else { h = ((+A.hft || 0) * 12 + (+A.hin || 0)) * 0.0254; w = ((+A.wst || 0) * 14 + (+A.wlb || 0)) * 0.45359237; }
      return h > 1 && w > 30 ? w / (h * h) : null;
    };
    const age = () => { if (!A.dob) return null; const d = new Date(A.dob), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };

    function assess() {
      const p = O.byId[A.product]; const flags = history[A.cat] || [];
      const chosen = flags.filter(([t]) => A.history.includes(t));
      if (chosen.some(([, k]) => k === "block")) return { ok: false, title: "Not suitable to prescribe online", text: "Based on your answers, this treatment may not be safe for you without an in-person assessment. A clinician will message you within one working day to talk through other options. You have not been charged." };
      if (A.cat === "weight") {
        const b = bmi(); const cond = A.conditions.filter(c => c !== "None of these").length;
        if (b && (b >= 30 || (b >= 27 && cond))) return { ok: true, review: chosen.length, title: "You may be eligible", text: `Your BMI of ${b.toFixed(1)} meets the criteria for ${p.name}. A clinician will review your answers and confirm your starting dose, usually within 24 hours.` };
        return { ok: false, title: "Weight treatment isn't right for you yet", text: `Weight injections are licensed for a BMI of 30 or above, or 27 or above with a weight-related condition. Your BMI is ${b ? b.toFixed(1) : "unknown"}. Our clinicians can suggest other support.` };
      }
      if (A.cat === "hair" && A.pattern === "Patchy or all-over thinning") return { ok: false, title: "We'd like a clinician to look first", text: "Patchy or all-over thinning can have other causes, such as thyroid problems or low iron. A clinician will message you, and may suggest a blood test before treatment." };
      return { ok: true, review: chosen.length, title: chosen.length ? "A clinician will review your answers" : "You may be suitable", text: `${p.name} looks appropriate based on your answers. A UK-registered prescriber reviews every consultation, usually within 24 hours, and may message you with questions.` };
    }

    function stepHTML() {
      if (step === 0) {
        return `<div class="stack-sm"><span class="label">Step 1 of 5</span><h2>What would you like help with?</h2></div>
          <fieldset class="opt-group"><legend class="label">Area</legend><div class="chips">${rxCats.map(c => `<button type="button" class="chip" aria-pressed="${A.cat === c.id}" data-cat="${c.id}">${c.name}</button>`).join("")}</div></fieldset>
          ${A.cat ? `<fieldset class="opt-group"><legend class="label">Treatment</legend><div class="choices">${rxIn(A.cat).map(p => `<label class="choice"><input type="radio" name="product" value="${p.id}" ${A.product === p.id ? "checked" : ""}><span class="mini-product"><img src="${img(p)}" alt=""><span><strong>${p.name}</strong><span class="small">${p.format} · ${fromPrice(p)}</span></span></span></label>`).join("")}</div></fieldset>
          <p class="small">Not sure? Choose the closest option. Your clinician can recommend a different treatment.</p>` : `<p class="small">Looking for supplements, skincare or tests? Those don't need a consultation. <a href="shop.html">Shop them here</a>.</p>`}`;
      }
      if (step === 1) {
        return `<div class="stack-sm"><span class="label">Step 2 of 5</span><h2>About you</h2><p class="small">We use these details to create your patient record. We never share them without your consent.</p></div>
          <div class="form-grid">
            <label class="field"><span>First name</span><input id="first" type="text" autocomplete="given-name" value="${esc(A.first || "")}" required></label>
            <label class="field"><span>Last name</span><input id="last" type="text" autocomplete="family-name" value="${esc(A.last || "")}" required></label>
            <label class="field full"><span>Email</span><input id="email" type="email" autocomplete="email" value="${esc(A.email || "")}" required></label>
            <label class="field"><span>Date of birth</span><input id="dob" type="date" value="${A.dob || ""}" required></label>
            <label class="field"><span>Sex registered at birth</span><select id="sex" required><option value="">Select</option>${["Female", "Male"].map(s => `<option ${A.sex === s ? "selected" : ""}>${s}</option>`).join("")}</select><span class="hint">Some medicines work differently by sex.</span></label>
          </div>`;
      }
      if (step === 2) return specific[A.cat]();
      if (step === 3) {
        const list = history[A.cat] || [];
        return `<div class="stack-sm"><span class="label">Step 4 of 5</span><h2>Medical history</h2><p class="small">Please answer honestly. This is how we keep your treatment safe.</p></div>
          <fieldset class="opt-group"><legend class="label">Do any of these apply to you?</legend><div class="choices">
            ${list.map(([t]) => `<label class="choice"><input type="checkbox" name="hist" value="${t}" ${A.history.includes(t) ? "checked" : ""}><span>${t}</span></label>`).join("")}
            <label class="choice"><input type="checkbox" name="hist" value="none" ${A.history.includes("none") ? "checked" : ""}><span>None of these</span></label>
          </div></fieldset>
          <label class="field"><span>Medicines you currently take</span><textarea id="meds" rows="3" placeholder="Include prescriptions, over-the-counter medicines and supplements">${esc(A.meds || "")}</textarea></label>
          <label class="field"><span>Allergies</span><input id="allergies" type="text" value="${esc(A.allergies || "")}" placeholder="Leave blank if none"></label>`;
      }
      const p = O.byId[A.product]; const r = assess();
      const opt = p.options.find(o => o.id === pick.opt && pick.id === p.id) || p.options[0];
      const plan = p.plans.find(x => x.id === (pick.id === p.id ? pick.plan : "")) || p.plans[0];
      const rows = [["Treatment", `${p.name}, ${p.format}`], ["Name", `${A.first} ${A.last}`], ["Age", age()], ...(A.cat === "weight" ? [["BMI", bmi()?.toFixed(1)]] : []), ["Medical history", A.history.filter(h => h !== "none").join("; ") || "None declared"], ["Medicines", A.meds || "None"]];
      return `<div class="stack-sm"><span class="label">Step 5 of 5</span><h2>Review and submit</h2></div>
        <div class="result ${r.ok ? "" : "result--hold"}"><span class="label">${r.ok ? "Initial assessment" : "Clinician follow-up"}</span><h3>${r.title}</h3><p>${r.text}</p></div>
        <dl class="review-list">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v ?? "")}</dd>`).join("")}</dl>
        ${r.ok ? `<fieldset class="opt-group"><legend class="label">Choose your plan · ${p.optionLabel.toLowerCase()} ${p.dose ? `starts at ${p.options[0].label}` : opt.label}</legend><div class="plans">${p.plans.map(pl => `<label class="plan"><input type="radio" name="plan" value="${pl.id}" ${pl.id === plan.id ? "checked" : ""}><span><strong>${pl.label}</strong>${pl.note ? `<span class="small">${pl.note}</span>` : ""}</span><span class="num">${money(planPrice(p.dose ? p.options[0] : opt, pl))}</span></label>`).join("")}</div></fieldset>
        <label class="choice"><input type="checkbox" id="consent" required><span>I confirm my answers are true and complete, and I'll read the patient information leaflet before use.</span></label>` : ""}`;
    }

    function readStep(form) {
      const v = id => form.querySelector("#" + id)?.value.trim();
      if (step === 0) A.product = form.product?.value || A.product;
      if (step === 1) Object.assign(A, { first: v("first"), last: v("last"), email: v("email"), dob: v("dob"), sex: v("sex") });
      if (step === 2) {
        if (A.cat === "weight") { Object.assign(A, A.units === "metric" ? { hcm: v("h-cm"), wkg: v("w-kg") } : { hft: v("h-ft"), hin: v("h-in"), wst: v("w-st"), wlb: v("w-lb") }); }
        A.conditions = $$("input[name=cond]:checked", form).map(i => i.value);
        ["pattern", "since", "often", "pref", "concern", "used", "periods", "womb"].forEach(n => { const el = form.querySelector(`input[name=${n}]:checked`); if (el) A[n] = el.value; });
      }
      if (step === 3) { A.history = $$("input[name=hist]:checked", form).map(i => i.value); A.meds = v("meds"); A.allergies = v("allergies"); }
    }

    function validate(form) {
      if (step === 0 && !A.product) return "Choose a treatment to continue.";
      if (!form.checkValidity()) { form.reportValidity(); return " "; }
      if (step === 1) { const a = age(); if (a === null || a < 18) return "You need to be 18 or over to use Aumbry."; if (a > 100) return "Check your date of birth."; }
      if (step === 2 && A.cat === "weight" && !bmi()) return "Enter your height and weight.";
      if (step === 2 && ["weight", "hormones"].includes(A.cat) && !A.conditions.length) return A.cat === "weight" ? "Choose any conditions that apply, or 'None of these'." : "Choose at least one symptom.";
      if (step === 3 && !A.history.length) return "Tick any that apply, or 'None of these'.";
      return "";
    }

    function draw() {
      $("[data-progress]").innerHTML = STEPS.map((s, i) => `<li ${i === step ? 'aria-current="step"' : ""} class="${i < step ? "is-done" : ""}"><span class="label num">0${i + 1}</span><span>${s}</span></li>`).join("");
      const p = O.byId[A.product];
      $("[data-aside-product]").innerHTML = p ? `<div class="mini-product"><img src="${img(p)}" alt=""><span><span class="label">${O.catById[p.cat].name}</span><strong style="display:block;font-family:var(--font-display);font-weight:400;font-size:1.3rem">${p.name}</strong><span class="small">${fromPrice(p)}</span></span></div>` : "";
      root.innerHTML = `<form class="consult-step" novalidate>${stepHTML()}<p class="error" data-err aria-live="assertive"></p>
        <div class="consult-nav">${step ? `<button type="button" class="btn btn--ghost" data-back>Back</button>` : "<span></span>"}
        ${step < 4 ? `<button class="btn" type="submit">Continue <span class="arrow">→</span></button>` : assess().ok ? `<button class="btn" type="submit">Submit and continue to checkout</button>` : `<a class="btn" href="index.html">Return home</a>`}</div></form>`;
      const form = $("form", root);
      form.addEventListener("submit", e => {
        e.preventDefault(); readStep(form);
        const err = validate(form); $("[data-err]", root).textContent = err.trim();
        if (err) return;
        if (step < 4) { step++; draw(); root.scrollIntoView({ block: "start" }); return; }
        const pl = form.querySelector("input[name=plan]:checked")?.value;
        const p = O.byId[A.product];
        Bag.add({ id: p.id, opt: p.dose ? p.options[0].id : (pick.id === p.id ? pick.opt : p.options[0].id), plan: pl, consult: true });
        location.href = "checkout.html";
      });
      $("[data-back]", root)?.addEventListener("click", () => { readStep(form); step--; draw(); });
      $$("[data-cat]", root).forEach(b => b.addEventListener("click", () => { A.cat = b.dataset.cat; A.product = rxIn(A.cat)[0].id; A.conditions = []; A.history = []; draw(); }));
      $$("[data-units]", root).forEach(b => b.addEventListener("click", () => { readStep(form); A.units = b.dataset.units; draw(); }));
      // exclusive "none" checkboxes
      $$("input[value='None of these'], input[value='none']", root).forEach(n => n.addEventListener("change", () => { if (n.checked) $$(`input[name=${n.name}]`, root).forEach(o => { if (o !== n) o.checked = false; }); }));
      $$("input[name=cond], input[name=hist]", root).forEach(i => i.addEventListener("change", () => { if (i.checked && !["None of these", "none"].includes(i.value)) $$(`input[name=${i.name}]`, root).forEach(o => { if (["None of these", "none"].includes(o.value)) o.checked = false; }); }));
      if (step === 2 && A.cat === "weight") {
        const live = () => { readStep(form); const b = bmi(); const el = $("[data-bmi]"), mk = $("[data-bmi-marker]"), note = $("[data-bmi-note]");
          if (!b) { el.textContent = "–"; note.textContent = "Enter your height and weight."; return; }
          el.textContent = b.toFixed(1); mk.style.left = Math.min(100, Math.max(0, (b - 15) / (45 - 15) * 100)) + "%";
          note.textContent = b >= 30 ? "Within the licensed range for weight treatment." : b >= 27 ? "Eligible if you have a weight-related condition." : "Below the licensed range for weight injections."; };
        $$("input[type=number]", form).forEach(i => i.addEventListener("input", live)); live();
      }
    }
    if (!A.cat && key && O.byId[key]) {
      root.innerHTML = `<div class="stack"><h2>${O.byId[key].name} doesn't need a consultation</h2><p class="lede">You can add it to your bag straight away.</p><a class="btn" href="product.html#${key}">View ${O.byId[key].name}</a></div>`;
      $("[data-progress]").innerHTML = ""; return;
    }
    draw();
  };

  /* ---------- checkout ---------- */
  pages.checkout = () => {
    const root = $("[data-checkout]");
    const draw = () => {
      const items = Bag.items();
      if (!items.length) {
        root.innerHTML = `<div class="confirm"><span class="label">Checkout</span><h1>Your bag is <em>empty</em></h1><p class="lede">Start a consultation for prescription treatments, or add supplements, skincare and tests from the shop.</p><div class="hero-actions"><a class="btn" href="consultation.html">Start a consultation</a><a class="btn btn--ghost" href="shop.html">Browse the shop</a></div></div>`;
        return;
      }
      const hasRx = items.some(it => O.byId[it.id]?.kind === "rx");
      const hasPen = items.some(it => O.byId[it.id]?.dose);
      const hasP = items.some(it => O.byId[it.id]?.kind === "p");
      root.innerHTML = `
        <div class="wrap"><nav class="crumbs label"><a href="index.html">Home</a><span aria-hidden="true">/</span><span>Checkout</span></nav><h1 style="font-size:var(--step-4);margin-bottom:40px">Checkout</h1></div>
        <div class="wrap checkout">
          <form data-co novalidate>
            <section class="co-section"><h2><span class="label">01</span>Contact</h2>
              <div class="form-grid"><label class="field"><span>Email</span><input id="co-email" type="email" autocomplete="email" required></label><label class="field"><span>Mobile</span><input id="co-tel" type="tel" autocomplete="tel" required><span class="hint">For delivery updates and messages from your clinician.</span></label></div>
            </section>
            <section class="co-section"><h2><span class="label">02</span>Delivery address</h2>
              <div class="form-grid">
                <label class="field"><span>First name</span><input id="co-first" type="text" autocomplete="given-name" required></label>
                <label class="field"><span>Last name</span><input id="co-last" type="text" autocomplete="family-name" required></label>
                <label class="field full"><span>Address</span><input id="co-a1" type="text" autocomplete="address-line1" required></label>
                <label class="field full"><span>Flat, building (optional)</span><input id="co-a2" type="text" autocomplete="address-line2"></label>
                <label class="field"><span>Town or city</span><input id="co-city" type="text" autocomplete="address-level2" required></label>
                <label class="field"><span>Postcode</span><input id="co-pc" type="text" autocomplete="postal-code" required pattern="[A-Za-z]{1,2}[0-9][A-Za-z0-9]? ?[0-9][A-Za-z]{2}"></label>
              </div>
              <fieldset class="opt-group"><legend class="label">Delivery</legend><div class="choices">
                ${hasPen ? `<label class="choice"><input type="radio" name="ship" value="cold" checked><span><strong>Chilled next-day · Free</strong><span class="small">Pens travel at 2–8 °C in an insulated box. Order by 2pm, Monday to Thursday.</span></span></label>`
                  : `<label class="choice"><input type="radio" name="ship" value="std" checked><span><strong>Tracked 48 · Free</strong><span class="small">1 to 3 working days.</span></span></label><label class="choice"><input type="radio" name="ship" value="next"><span><strong>Next working day · £4.95</strong><span class="small">Order by 2pm.</span></span></label>`}
              </div></fieldset>
              <p class="small">Every order ships in a plain box. The sender shows as "AH Dispatch".</p>
            </section>
            ${hasP ? `<section class="co-section"><h2><span class="label">03</span>Pharmacy questions</h2>
              ${["Is the medicine for you, and are you aged 18 to 65?", "Do you have heart problems or low blood pressure?", "Are you taking any other medicines?"].map((q, i) => `<fieldset class="opt-group"><legend class="label">${q}</legend><div class="choices choices--2"><label class="choice"><input type="radio" name="pq${i}" value="yes" required><span>Yes</span></label><label class="choice"><input type="radio" name="pq${i}" value="no"><span>No</span></label></div></fieldset>`).join("")}
            </section>` : ""}
            <section class="co-section" style="border:0;margin:0"><h2><span class="label">${hasP ? "04" : "03"}</span>Payment</h2>
              <div class="pay-box"><strong>Card payment connects here at launch</strong><span class="small">Use your payment provider's secure card form (for example Stripe or Shopify Payments). This preview does not take payment or store card details.</span></div>
              ${hasRx ? `<div class="notice"><span class="notice-mark">Rx</span><span><b>You're only charged for prescription items once a clinician approves them.</b> If they don't, the authorisation is released.</span></div>` : ""}
              <p class="error" data-err aria-live="assertive"></p>
              <button class="btn btn--block" type="submit">Place order · <span class="num" data-total></span></button>
              <p class="small">By placing your order you agree to our <a href="legal.html#terms">terms</a> and <a href="legal.html#privacy">privacy policy</a>.</p>
            </section>
          </form>
          <aside class="summary" aria-label="Order summary">
            <span class="label">Order summary</span>
            <div>${items.map(it => { const l = Bag.line(it); return l ? `<div class="bag-line" style="grid-template-columns:64px 1fr auto"><img src="${img(l.p)}" alt="" style="width:64px"><div><h5>${esc(l.p.name)}${it.qty > 1 ? ` × ${it.qty}` : ""}</h5><div class="meta">${esc(l.opt.label)} · ${esc(l.plan.label)}${it.consult ? "<br>Consultation submitted" : ""}</div></div><span class="num">${money(l.total)}</span></div>` : ""; }).join("")}</div>
            <div class="sum-row"><span>Subtotal</span><span class="num">${money(Bag.subtotal())}</span></div>
            <div class="sum-row"><span>Delivery</span><span class="num" data-ship>Free</span></div>
            <div class="sum-row sum-row--total" style="border-top:1px solid var(--rule);padding-top:16px"><span>Total</span><span class="num" data-grand></span></div>
          </aside>
        </div>`;
      const form = $("[data-co]", root);
      const totals = () => { const ship = form.ship?.value === "next" ? 4.95 : 0; $("[data-ship]", root).textContent = ship ? money(ship) : "Free"; const t = money(Bag.subtotal() + ship); $("[data-grand]", root).textContent = t; $("[data-total]", root).textContent = t; };
      form.addEventListener("change", totals); totals();
      form.addEventListener("submit", e => {
        e.preventDefault();
        if (!form.checkValidity()) { $("[data-err]", root).textContent = "Please complete the highlighted fields."; form.reportValidity(); return; }
        const no = "ORL-" + Math.random().toString(36).slice(2, 7).toUpperCase();
        const first = $("#co-first", form).value;
        Bag.clear();
        root.innerHTML = `<div class="wrap"><div class="confirm"><span class="label">Order received</span><h1>Thank you, <em>${esc(first)}</em></h1>
          <p class="lede">Your order number is <span class="order-no">${no}</span>. ${hasRx ? "A clinician is reviewing your consultation now, usually within 24 hours. We'll email you as soon as your prescription is approved and dispatched." : "We'll email you tracking details as soon as it's on its way."}</p>
          <ol class="steps" style="margin-top:24px"><li class="step"><span class="step-n">1</span><h3>${hasRx ? "Clinical review" : "Packed"}</h3><p class="small">${hasRx ? "A prescriber checks your answers and may message you." : "Packed by our team within one working day."}</p></li><li class="step"><span class="step-n">2</span><h3>Dispatched</h3><p class="small">Plain box, tracked from our partner pharmacy.</p></li><li class="step"><span class="step-n">3</span><h3>Ongoing care</h3><p class="small">Message your clinical team any time from your account.</p></li></ol>
          <div class="hero-actions"><a class="btn" href="account.html">Go to your account</a><a class="btn btn--ghost" href="shop.html">Continue shopping</a></div></div></div>`;
        scrollTo({ top: 0 });
      });
    };
    draw();
  };

  /* ---------- account ---------- */
  pages.account = () => {
    const root = $("[data-account]");
    const today = new Date();
    const fmt = (d, o = { day: "numeric", month: "short" }) => d.toLocaleDateString("en-GB", o);
    const plus = n => new Date(today.getTime() + n * 864e5);
    const weights = [98.4, 97.1, 96.3, 95.6, 94.4, 93.8, 92.9, 92.1];

    const signIn = () => {
      root.innerHTML = `<div class="wrap" style="max-width:560px;padding-block:var(--section)"><div class="stack-lg">
        <div class="stack-sm"><span class="label">Your account</span><h1 style="font-size:var(--step-4)">Sign in</h1><p class="lede">We'll email you a secure link. No password needed.</p></div>
        <form class="stack" data-signin><label class="field"><span>Email</span><input id="si-email" type="email" autocomplete="email" required></label><button class="btn btn--block" type="submit">Email me a sign-in link</button><p class="small" data-si-msg aria-live="polite"></p></form>
        <div class="notice"><span class="notice-mark">i</span><span><b>Preview the patient account.</b> See what customers see after their first order. <button class="link" data-example style="margin-left:6px">View example account</button></span></div>
      </div></div>`;
      $("[data-signin]").addEventListener("submit", e => { e.preventDefault(); if (!e.target.checkValidity()) return e.target.reportValidity(); $("[data-si-msg]").textContent = "Sign-in links send once the store is live. Use the example account below to look around."; });
      $("[data-example]").addEventListener("click", dash);
    };

    const spark = () => {
      const W = 760, H = 200, L = 34, R = 48, T = 16, B = 28, min = 90, max = 100;
      const x = i => L + i / (weights.length - 1) * (W - L - R), y = v => T + (1 - (v - min) / (max - min)) * (H - T - B);
      const d = weights.map((v, i) => `${i ? "L" : "M"} ${x(i)} ${y(v)}`).join(" ");
      return `<svg class="dose-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight from ${weights[0]} kg to ${weights.at(-1)} kg over 8 weeks">
        <g class="grid">${[90, 95, 100].map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/>`).join("")}</g>
        <g class="axis">${[90, 95, 100].map(t => `<text x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join("")}${weights.map((_, i) => i % 2 ? "" : `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">WK ${i + 1}</text>`).join("")}</g>
        <path class="area" d="${d} L ${x(weights.length - 1)} ${y(min)} L ${x(0)} ${y(min)} Z"/><path class="step" d="${d}"/>
        <circle class="dot" cx="${x(weights.length - 1)}" cy="${y(weights.at(-1))}" r="4"/><text class="val" x="${x(weights.length - 1) + 8}" y="${y(weights.at(-1)) + 4}">${weights.at(-1)}</text></svg>`;
    };

    const tabs = {
      overview: () => `<div class="panel-grid">
        <div class="panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><span class="label">Current treatment</span><span class="pill pill--ok">Active</span></div>
          <div class="mini-product"><img src="assets/img/products/tirzepatide.jpg" alt=""><span><h3>Tirzepatide</h3><span class="small">5 mg weekly · Month 2</span></span></div>
          <div class="stack-sm"><div class="sum-row small"><span>Next dose</span><span>${fmt(plus(2), { weekday: "long", day: "numeric", month: "short" })}</span></div><div class="progress-bar"><span style="width:58%"></span></div><div class="sum-row small"><span>Pen 2 of plan</span><span>Dose 3 of 4</span></div></div>
        </div>
        <div class="panel"><span class="label">Next delivery</span><h3>${fmt(plus(9), { weekday: "long", day: "numeric", month: "long" })}</h3><p class="small">Chilled next-day. Tirzepatide 5 mg, needles and sharps bin.</p><div style="display:flex;gap:18px;flex-wrap:wrap"><button class="link" data-toast="Your next delivery is paused. You can resume it from this page.">Pause</button><button class="link" data-toast="Delivery date updated.">Change date</button></div></div>
        <div class="panel" style="grid-column:1/-1"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div class="stack-sm"><span class="label">Your progress</span><h3>−${(weights[0] - weights.at(-1)).toFixed(1)} kg <span class="small">since starting</span></h3></div><button class="btn btn--ghost" data-toast="Weight logged. Your clinician will see it at your next review.">Log weight</button></div>${spark()}</div>
        <div class="panel"><div style="display:flex;justify-content:space-between;gap:12px"><span class="label">Clinical team</span><span class="pill pill--wait">Review due</span></div><p>Your monthly dose review is due. Answer four short questions so we can confirm whether to stay on 5 mg or step up.</p><button class="btn" data-toast="Your dose review form opens here at launch.">Start dose review</button></div>
        <div class="panel"><span class="label">Messages</span><p>"Thanks for your update. Mild nausea in the first days after a dose increase is common. Smaller meals and staying hydrated usually help."</p><button class="link" data-tab="messages">Open messages</button></div>
      </div>`,
      treatments: () => `<div class="panel-grid"><div class="panel"><div class="mini-product"><img src="assets/img/products/tirzepatide.jpg" alt=""><span><span class="pill pill--ok">Active</span><h3>Tirzepatide</h3><span class="small">5 mg weekly · Monthly plan · ${money(179)} / month</span></span></div><div class="stack-sm"><button class="link" data-toast="Dose review requested. Your clinician will reply within one working day.">Request a dose review</button><br><button class="link" data-toast="Your plan is paused after the current pen.">Pause plan</button></div></div>
        <div class="panel"><span class="label">Add a treatment</span><h3>Most added alongside weight treatment</h3><div class="grid-products" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">${["blood-panel", "satiety-fibre"].map(id => card(O.byId[id])).join("")}</div></div></div>`,
      messages: () => `<div class="panel"><span class="label">Clinical team · usually replies within one working day</span><div class="thread">
        <div class="msg msg--me"><span class="label">You · ${fmt(plus(-3))}</span>Moved up to 5 mg on Thursday. Bit of nausea the next day but it settled by the weekend.</div>
        <div class="msg msg--them"><span class="label">Clinical team · ${fmt(plus(-2))}</span>Thanks for your update. Mild nausea in the first days after a dose increase is common. Smaller meals and staying hydrated usually help. If it lasts beyond a week, or you can't keep fluids down, message us straight away.</div>
      </div><form class="compose" data-compose><label for="cm" style="position:absolute;left:-9999px">Message</label><input id="cm" class="input" type="text" placeholder="Write a message" style="background:var(--ground);border:1px solid var(--rule);padding:14px"><button class="btn" type="submit">Send</button></form></div>`,
      orders: () => `<div class="panel"><span class="label">Order history</span><div class="table-wrap"><table class="data"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th>Total</th></tr></thead><tbody>
        ${[["ORL-7Q2KD", -24, "Tirzepatide 5 mg", "Delivered", 179], ["ORL-5M8TA", -52, "Tirzepatide 2.5 mg · Advanced Health Panel", "Delivered", 278], ["ORL-3B1XN", -55, "Online consultation", "Approved", 0]].map(([n, d, it, s, t]) => `<tr><td class="order-no">${n}</td><td>${fmt(plus(d), { day: "numeric", month: "short", year: "numeric" })}</td><td>${it}</td><td><span class="pill pill--ok">${s}</span></td><td>${t ? money(t) : "—"}</td></tr>`).join("")}
      </tbody></table></div></div>`,
      results: () => `<div class="panel"><span class="label">Blood results</span><h3>Advanced Health Panel · ${fmt(plus(-48), { day: "numeric", month: "long" })}</h3><div class="table-wrap"><table class="data"><thead><tr><th>Biomarker</th><th>Result</th><th>Range</th><th>Status</th></tr></thead><tbody>
        ${[["HbA1c", "41 mmol/mol", "< 42", "ok"], ["LDL cholesterol", "3.4 mmol/L", "< 3.0", "wait"], ["Vitamin D", "48 nmol/L", "50 – 175", "wait"], ["Ferritin", "96 µg/L", "30 – 400", "ok"], ["TSH", "1.8 mIU/L", "0.27 – 4.2", "ok"]].map(([b, r, g, s]) => `<tr><td>${b}</td><td>${r}</td><td>${g}</td><td><span class="pill ${s === "ok" ? "pill--ok" : "pill--wait"}">${s === "ok" ? "In range" : "Borderline"}</span></td></tr>`).join("")}
      </tbody></table></div><p class="small">Doctor's note: HbA1c is at the top of the normal range and LDL is slightly raised. Both often improve with weight loss. We suggest retesting in six months, and a vitamin D supplement through winter.</p></div>`,
      details: () => `<form class="panel stack" data-details><span class="label">Your details</span><div class="form-grid"><label class="field"><span>First name</span><input id="d-first" type="text" value="Alex"></label><label class="field"><span>Last name</span><input id="d-last" type="text" value="Morgan"></label><label class="field full"><span>Email</span><input id="d-email" type="email" value="alex@example.com"></label><label class="field full"><span>Delivery address</span><input id="d-addr" type="text" value="12 Example Street, London, N1 0AA"></label></div><label class="choice"><input type="checkbox" checked><span>Email me clinical updates and reminders</span></label><div><button class="btn" type="submit">Save changes</button></div></form>`,
    };

    const dash = () => {
      const names = { overview: "Overview", treatments: "Treatments", messages: "Messages", orders: "Orders", results: "Results", details: "Details" };
      root.innerHTML = `<div class="wrap page-head" style="padding-bottom:32px"><div class="head" style="margin:0"><div class="stack-sm"><span class="example-chip">Example account · sample data</span><h1 style="font-size:var(--step-4)">Good to see you, <em>Alex</em></h1></div><button class="link" data-signout>Sign out</button></div></div>
        <div class="wrap acct"><nav class="acct-nav" role="tablist" aria-label="Account">${Object.entries(names).map(([k, v], i) => `<button role="tab" aria-selected="${i === 0}" data-tab="${k}">${v}</button>`).join("")}</nav><div data-tabpanel role="tabpanel"></div></div>`;
      const show = k => { $$(".acct-nav [data-tab]", root).forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === k))); $("[data-tabpanel]", root).innerHTML = tabs[k](); };
      root.onclick = e => {
        const t = e.target.closest("[data-tab]"); if (t) show(t.dataset.tab);
        const m = e.target.closest("[data-toast]"); if (m) toast(m.dataset.toast + " (Example account)");
        if (e.target.closest("[data-signout]")) signIn();
      };
      root.onsubmit = e => { e.preventDefault(); if (e.target.matches("[data-compose]")) { toast("Example account. Messages send once the clinic is live."); e.target.reset(); } if (e.target.matches("[data-details]")) toast("Changes saved (Example account)"); };
      show("overview"); scrollTo({ top: 0 });
    };
    signIn();
  };

  pages.help = () => {
    $("[data-contact]")?.addEventListener("submit", e => {
      e.preventDefault(); const f = e.target;
      if (!f.checkValidity()) return f.reportValidity();
      $("[data-contact-msg]").textContent = "Thank you. Your message form connects to your inbox at launch; for now nothing has been sent.";
      f.reset();
    });
  };

  /* ---------- boot ---------- */
  header(); footer(); wireChrome(); renderBag(); updateCount();
  (pages[page] || (() => {}))();
})();
