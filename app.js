// YZZY — A doua plecare · logica partajata (catalog, cos, efecte)
const P = (window.YZZY_DATA && YZZY_DATA.products) || [];
const CATS = (window.YZZY_DATA && YZZY_DATA.cats) || [];
const fmtLei = v => new Intl.NumberFormat('ro-RO', {maximumFractionDigits: 2}).format(v / 100) + ' lei';
const byId = id => P.find(p => p.id === id);
const qs = k => new URLSearchParams(location.search).get(k);
const tagFor = p => (p.on_sale && p.regular > p.price)
  ? ('-' + Math.round((1 - p.price / p.regular) * 100) + '%') : p.condition;

// ---------- cos (localStorage, partajat intre pagini) ----------
let cart = [];
try { cart = JSON.parse(localStorage.getItem('yzzy2Cart')) || []; } catch (e) {}
const saveCart = () => localStorage.setItem('yzzy2Cart', JSON.stringify(cart));
const cartTotal = () => cart.reduce((s, it) => { const p = byId(it.id); return s + (p ? p.price * it.qty : 0); }, 0);
function updateCartBadge() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = cart.reduce((s, it) => s + it.qty, 0);
}
function addToCart(id, qty = 1) {
  const found = cart.find(it => it.id === id);
  if (found) found.qty += qty; else cart.push({id, qty});
  saveCart(); updateCartBadge();
  const p = byId(id);
  toast(`<b>[ ÎMBARCAT ]</b> ${p ? p.name : 'Produs'} e în coș`);
}
function setQty(id, qty) {
  const it = cart.find(x => x.id === id);
  if (!it) return;
  it.qty = qty;
  if (it.qty < 1) cart = cart.filter(x => x.id !== id);
  saveCart(); updateCartBadge();
}

// ---------- toast ----------
let toastT;
function toast(html) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.innerHTML = html;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 2600);
}

// ---------- nav comun ----------
function renderNav(active) {
  const links = [
    ['index.html', 'Acasă'], ['catalog.html', 'Catalog'], ['rate.html', 'Rate 0%'],
    ['service.html', 'Service'], ['vinde.html', 'Vinde'], ['contact.html', 'Contact'],
  ];
  document.getElementById('nav').innerHTML = `
    <a class="logo" href="index.html" aria-label="yzzy — acasă">${'YZZY'.split('').map(c => `<span class="tile"><span>${c}</span></span>`).join('')}</a>
    <ul class="nav-links">${links.map(([h, l]) => `<li><a href="${h}"${h === active ? ' class="active"' : ''}>${l}</a></li>`).join('')}</ul>
    <div class="nav-cta">
      <button class="icon-btn" id="searchBtn" aria-label="Caută">⌕</button>
      <a class="btn btn-ghost" id="cartBtn" href="cos.html">Coș<span class="cart-count" id="cartCount">0</span></a>
      <a class="btn btn-amber" href="catalog.html">Vezi cursele</a>
    </div>`;
  addEventListener('scroll', () => document.getElementById('nav').classList.toggle('scrolled', scrollY > 30), {passive: true});
  document.getElementById('nav').classList.toggle('scrolled', scrollY > 30);
  updateCartBadge();
  initSearch();
  logoFlip();
}

// ---------- ticker comun ----------
function renderTicker(el) {
  const items = ['Garanție 2 ani', 'Retur gratuit 30 de zile', 'Livrare în 24h', 'Rate 0% prin 4 bănci', 'Niciun telefon nu decolează netestat'];
  const half = items.map(t => `<span>${t}</span><i>◆</i>`).join('');
  el.innerHTML = `<div class="ticker-track">${half}${half}</div>`;
}

// ---------- footer comun ----------
function renderFooter(el) {
  el.innerHTML = `
  <div class="foot-grid">
    <div class="foot-brand">
      <a class="logo" href="index.html">${'YZZY'.split('').map(c => `<span class="tile"><span>${c}</span></span>`).join('')}</a>
      <p>Tehnologie cu a doua plecare: telefoane și gadgeturi recondiționate impecabil, garantate 2 ani. YZZY MOBILE SRL · Suceava, Str. Ana Ipătescu, Nr. 5.</p>
    </div>
    <div><h5>Magazin</h5><ul>
      <li><a href="catalog.html?cat=telefoane">Telefoane</a></li>
      <li><a href="catalog.html?cat=tablete">Tablete</a></li>
      <li><a href="catalog.html?cat=laptopuri">Laptopuri</a></li>
      <li><a href="catalog.html?cat=smartwatch">Smartwatch</a></li>
      <li><a href="catalog.html?cat=accesorii">Accesorii</a></li>
    </ul></div>
    <div><h5>Servicii</h5><ul>
      <li><a href="vinde.html">Vinde-ți telefonul</a></li>
      <li><a href="service.html">Service iPhone</a></li>
      <li><a href="service.html#samsung">Service Samsung</a></li>
      <li><a href="rate.html">Rate fără dobândă</a></li>
      <li><a href="politici.html">Politici & garanții</a></li>
    </ul></div>
    <div><h5>Contact</h5><ul>
      <li><a href="tel:0761053053">0761 053 053</a></li>
      <li><a href="https://wa.me/+40761053053">WhatsApp</a></li>
      <li><a href="https://www.instagram.com/yzzy.ro/">Instagram</a></li>
      <li><a href="https://www.tiktok.com/@yzzy.ro">TikTok</a></li>
      <li><a href="https://www.facebook.com/yzzy.mobile">Facebook</a></li>
    </ul></div>
  </div>
  <div class="foot-bottom">
    <span>© 2026 YZZY MOBILE SRL · CUI RO44982632 · J33/1848/2021</span>
    <span><a href="politici.html">Termeni & politici</a> · <a href="https://anpc.ro/">ANPC</a> · demo de design</span>
  </div>`;
}

// ---------- split-flap ----------
const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-% ';
function flapText(el, final, speed = 50) {
  const target = final.toUpperCase();
  let frame = 0;
  const settle = target.split('').map((_, i) => 3 + i * 0.9 + Math.random() * 2);
  const tick = () => {
    let out = '', done = true;
    for (let i = 0; i < target.length; i++) {
      if (frame >= settle[i] || target[i] === ' ') out += target[i];
      else { out += FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)]; done = false; }
    }
    el.textContent = out;
    frame++;
    if (!done) setTimeout(tick, speed);
  };
  tick();
}
// logo: la intrarea pe site (o data pe sesiune) — cascada Solari EASY -> YZZY
// fiecare litera se roteste separat, la timpii exacti ceruti (ms de la deschidere):
//  E start 1.0s, stop 4.5s | A start 2.5s, stop 6.5s | S start 4.0s, stop 8.5s | Y start 5.5s, stop 10.5s
function logoFlip() {
  const tiles = [...document.querySelectorAll('nav .logo .tile')];
  const spans = tiles.map(t => t.querySelector('span'));
  if (spans.length !== 4) return;
  // ruleaza pe homepage la FIECARE incarcare/refresh (fara gate de sesiune),
  // dar nu si la navigarea intre subpagini
  const p = location.pathname;
  if (!(p.endsWith('index.html') || p.endsWith('/'))) return;

  const EASY = 'EASY', YZZY = 'YZZY';
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  spans.forEach((s, i) => { s.textContent = EASY[i]; });

  const seq = [
    { start: 1000, stop: 4500 },   // E -> Y
    { start: 2500, stop: 6500 },   // A -> Z
    { start: 4000, stop: 8500 },   // S -> Z (al II-lea Z)
    { start: 5500, stop: 10500 },  // Y -> Y
  ];

  function flapTick(span, ch) {
    span.textContent = ch;
    span.style.animation = 'none';
    void span.offsetWidth;
    span.style.animation = 'flapDrop 85ms cubic-bezier(.3,.7,.4,1)';
  }

  seq.forEach((cfg, i) => {
    setTimeout(() => {
      tiles[i].classList.add('flapping');
      let k = ALPHA.indexOf(EASY[i]);
      if (k < 0) k = 0;
      const iv = setInterval(() => { k = (k + 1) % 26; flapTick(spans[i], ALPHA[k]); }, 85);
      setTimeout(() => {
        clearInterval(iv);
        spans[i].style.animation = 'none';
        void spans[i].offsetWidth;
        spans[i].textContent = YZZY[i];
        spans[i].style.animation = 'flapDrop 130ms cubic-bezier(.3,.7,.4,1)';
        tiles[i].classList.remove('flapping');
      }, cfg.stop - cfg.start);
    }, cfg.start);
  });
}

// ---------- efecte ----------
function initReveal() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold: .1});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}
function initSpotlight(container) {
  container.addEventListener('pointermove', e => {
    const card = e.target.closest('.pcard');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
}
function countUp(el, end, dec = 0, suffix = '') {
  const t0 = performance.now();
  const tick = t => {
    const p = Math.min((t - t0) / 1400, 1), v = end * (1 - Math.pow(1 - p, 3));
    el.textContent = (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('ro-RO')) + (p === 1 ? suffix : '');
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function initCounters() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    countUp(e.target, parseFloat(e.target.dataset.count), +(e.target.dataset.dec || 0), e.target.dataset.suffix || '');
  }), {threshold: .5});
  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
}

// ---------- card produs (HTML) ----------
function cardHTML(p) {
  const sale = p.on_sale && p.regular > p.price;
  return `<a class="pcard" href="produs.html?id=${p.id}">
    <span class="pvis"><span class="ptag">${tagFor(p)}</span><img src="${p.thumb}" alt="${p.name}" loading="lazy"></span>
    <span class="pname">${p.brand ? p.brand + ' ' : ''}${p.name}</span>
    <span class="pstate">[ ${p.condition} · Garanție 2 ani ]</span>
    <span class="pfoot"><span class="pprice">${sale ? `<s>${fmtLei(p.regular)}</s>` : ''}${fmtLei(p.price)}</span>
    <button class="padd" data-add="${p.id}" aria-label="Adaugă în coș">+</button></span>
  </a>`;
}
function bindAddButtons(container) {
  container.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    e.preventDefault();
    addToCart(b.dataset.add);
  });
}

// ---------- cautare ----------
function initSearch() {
  const btn = document.getElementById('searchBtn');
  if (!btn) return;
  let ov = document.querySelector('.search-ov');
  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'search-ov';
    ov.innerHTML = `<button class="icon-btn search-close" aria-label="Închide">×</button>
      <input type="text" placeholder="Caută o cursă…" aria-label="Caută produse">
      <div class="search-res"></div>`;
    document.body.appendChild(ov);
    const input = ov.querySelector('input'), res = ov.querySelector('.search-res');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { res.innerHTML = ''; return; }
      const hits = P.filter(p => (p.brand + ' ' + p.name).toLowerCase().includes(q)).slice(0, 10);
      res.innerHTML = hits.length
        ? hits.map(p => `<a href="produs.html?id=${p.id}"><span>${p.brand} ${p.name}</span><b>${fmtLei(p.price)}</b></a>`).join('')
        : '<a style="color:var(--gri)">Nicio cursă găsită pentru această destinație.</a>';
    });
    ov.querySelector('.search-close').addEventListener('click', () => ov.classList.remove('show'));
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('show'); });
    addEventListener('keydown', e => { if (e.key === 'Escape') ov.classList.remove('show'); });
  }
  btn.addEventListener('click', () => { ov.classList.add('show'); ov.querySelector('input').focus(); });
}

// ---------- sigiliu ----------
function sealHTML() {
  return `<div class="seal" aria-hidden="true">
    <svg viewBox="0 0 118 118"><defs><path id="circ" d="M59,59 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs>
    <text style="font-family:'JetBrains Mono';font-size:9.5px;letter-spacing:2.5px;fill:#F59E0B">
    <textPath href="#circ">GARANȚIE 2 ANI · TESTAT BUCATĂ CU BUCATĂ · YZZY ·</textPath></text></svg>
    <span class="core">2<small style="font-size:9px">ANI</small></span>
  </div>`;
}
