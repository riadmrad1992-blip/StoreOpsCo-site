/* StoreOpsCo page script: links from config.js, SEO, 3D loader, small page effects. Classic script, no libraries. */
(function () {
  'use strict';
  var CFG = window.CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var val = function (k) { return (typeof CFG[k] === 'string' ? CFG[k] : '').trim(); };
  var isUrl = function (u) { return /^https?:\/\/\S+$/i.test(u); };

  /* ---------- 1. Links: empty value = hidden ---------- */
  $$('[data-link]').forEach(function (a) {
    var u = val(a.getAttribute('data-link')), ok = isUrl(u);
    if (ok) a.setAttribute('href', u);
    a.hidden = !ok;
    var li = a.closest('li');
    if (li && li.parentNode.id === 'social') li.hidden = !ok;
  });
  var shop = isUrl(val('ETSY_SHOP_URL'));
  $$('[data-soon],[data-soon-note]').forEach(function (el) { el.hidden = shop; });
  if (isUrl(val('EMAIL_SIGNUP_URL'))) $('#join').hidden = false;
  var mail = val('CONTACT_EMAIL');
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    var cl = $('#contact-link'); cl.href = 'mailto:' + mail; cl.textContent = mail; cl.parentNode.hidden = false;
  }

  /* ---------- 2. Share tags and structured data ---------- */
  var site = val('SITE_URL');
  if (isUrl(site)) {
    if (site.slice(-1) !== '/') site += '/';
    var head = document.head;
    var add = function (tag, attrs) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); head.appendChild(e); };
    add('link', { rel: 'canonical', href: site });
    add('meta', { property: 'og:url', content: site });
    $$('meta[property="og:image"],meta[name="twitter:image"]').forEach(function (m) { m.setAttribute('content', site + 'og-image.png'); });
  }
  try {
    var ld = $('#ld-org'), data = JSON.parse(ld.textContent);
    if (isUrl(site)) { data.url = site; data.logo = site + 'favicon.svg'; }
    var same = ['YOUTUBE_URL', 'TIKTOK_URL', 'INSTAGRAM_URL', 'LINKEDIN_URL'].map(val).filter(isUrl);
    if (same.length) data.sameAs = same;
    ld.textContent = JSON.stringify(data);
  } catch (e) { /* leave the static block */ }

  /* ---------- 3. Optional analytics (only when set) ---------- */
  var src = val('ANALYTICS_SCRIPT_SRC');
  if (isUrl(src)) {
    var s = document.createElement('script'); s.defer = true; s.src = src;
    var at = CFG.ANALYTICS_ATTRS || {};
    for (var k in at) if (Object.prototype.hasOwnProperty.call(at, k)) s.setAttribute(k, String(at[k]));
    document.head.appendChild(s);
  }

  /* ---------- 4. Section reveals ---------- */
  var reveals = $$('.reveal');
  if (!('IntersectionObserver' in window) || reduced) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el, i) {
      var sib = el.parentNode.children, idx = Array.prototype.indexOf.call(sib, el);
      if (el.classList.contains('card') && sib.length > 1) el.style.transitionDelay = Math.min(idx, 4) * 90 + 'ms';
      ro.observe(el);
    });
  }

  /* ---------- 5. Scroll progress line ---------- */
  var line = $('#progress-line'), ticking = false;
  function updLine() {
    ticking = false;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    line.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
  }
  if (!reduced) {
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(updLine); } }, { passive: true });
    updLine();
  }

  /* ---------- 6. Card tilt (max 8 degrees) ---------- */
  if (!reduced) {
    $$('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(900px) rotateX(' + (-y * 8).toFixed(2) + 'deg) rotateY(' + (x * 8).toFixed(2) + 'deg)';
      });
      var rest = function () { el.style.transform = ''; };
      el.addEventListener('pointerleave', rest);
      el.addEventListener('pointercancel', rest);
      el.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') rest(); });
    });
  }

  /* ---------- 7. Profit Pilot price flip: runs once ---------- */
  var flip = $('#flip');
  if (flip && !reduced && 'IntersectionObserver' in window) {
    var fo = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { flip.classList.add('run'); fo.disconnect(); }
    }, { threshold: 0.6 });
    fo.observe(flip);
  } else if (flip) { flip.classList.add('run'); }

  /* ---------- 8. The 3D hero ---------- */
  var hero = $('#top'), canvas = $('#scene'), copy = $('#hero-copy'), story = $('#story'), flash = $('#flash');
  if (reduced || !hero || !canvas) return;          // reduced motion: keep the static hero, load nothing

  var ovs = $$('#story [data-in]').map(function (el) {
    var out = el.getAttribute('data-out');
    return { el: el, a: +el.getAttribute('data-in'), b: out ? +out : +el.parentNode.getAttribute('data-out') };
  });
  function onProgress(p) {
    for (var i = 0; i < ovs.length; i++) {
      var o = ovs[i], on = p >= o.a && p < o.b;
      if (on !== o.el.classList.contains('on')) o.el.classList.toggle('on', on);
    }
    var bump = Math.max(0, 1 - Math.abs(p - 0.19) / 0.012);
    flash.style.opacity = (0.35 * bump).toFixed(3);
    story.style.setProperty('--scrim', Math.max(0, Math.min(1, 1 - (p - 0.8) / 0.05)).toFixed(2));
    var showCopy = p >= 0.86;
    if (showCopy !== copy.classList.contains('on')) copy.classList.toggle('on', showCopy);
  }

  function webglOk() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return false;
      var x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext();
      return true;
    } catch (e) { return false; }
  }
  function fallBack() {
    hero.classList.remove('is-3d');
    copy.classList.remove('on');
  }
  function loadScript(src, cb, err) {
    var s = document.createElement('script'); s.src = src; s.onload = cb; s.onerror = err; document.head.appendChild(s);
  }
  function begin() {
    if (!webglOk()) return;
    loadScript('vendor/three.min.js', function () {
      try {
        hero.classList.add('is-3d');
        var mouse = { x: 0, y: 0 };
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          window.addEventListener('pointermove', function (e) {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
          }, { passive: true });
        }
        window.StoreOpsScene.start({ hero: hero, canvas: canvas, onProgress: onProgress, onFail: fallBack, mouse: mouse });
      } catch (e) { fallBack(); }
    }, fallBack);
  }
  // start after first paint, when the browser is idle
  function schedule() {
    if ('requestIdleCallback' in window) requestIdleCallback(begin, { timeout: 2000 });
    else setTimeout(begin, 300);
  }
  if (document.readyState === 'complete') schedule(); else window.addEventListener('load', schedule);
})();
