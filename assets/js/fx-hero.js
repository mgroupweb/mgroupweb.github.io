/* Hub hero: full-screen brand canvas scrubbed by horizontal pointer movement, typewriter H1, copy-email pill, fx nav. */
(function () {
  'use strict';
  var hero = document.querySelector('.fx-hero'); if (!hero) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- canvas background (brand ribbons + halos), time t in [0,1] ---------- */
  var cv = hero.querySelector('.fx-hero__bg'), ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1, t = 0.4, target = 0.4, raf = 0;
  var SENS = 0.8, TAU = Math.PI * 2;
  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); draw(t);
  }
  var HALOS = [
    { c: '64,208,255', a: .26, fx: .9, fy: .6, px: 0, py: .3, r: .42, cx: .70, cy: .42 },
    { c: '90,88,226', a: .34, fx: .6, fy: 1.1, px: .4, py: .1, r: .5, cx: .78, cy: .62 },
    { c: '64,208,255', a: .18, fx: 1.3, fy: .8, px: .7, py: .6, r: .32, cx: .55, cy: .28 }
  ];
  var RIBBONS = [
    { y: .30, amp: .16, k: 1.0, ph: 0.00, w: .085, a: .55 },
    { y: .46, amp: .20, k: 0.8, ph: 0.35, w: .11, a: .5 },
    { y: .62, amp: .14, k: 1.25, ph: 0.62, w: .07, a: .42 },
    { y: .76, amp: .18, k: 0.65, ph: 0.15, w: .09, a: .34 }
  ];
  function draw(tt) {
    var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1F2544'); g.addColorStop(1, '#151A34');
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var R = Math.max(W, H);
    ctx.globalCompositeOperation = 'lighter';
    HALOS.forEach(function (h) {
      var x = W * (h.cx + .14 * Math.sin(TAU * (tt * h.fx + h.px))), y = H * (h.cy + .18 * Math.cos(TAU * (tt * h.fy + h.py))), r = R * h.r;
      var rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(' + h.c + ',' + h.a + ')'); rg.addColorStop(1, 'rgba(' + h.c + ',0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    });
    RIBBONS.forEach(function (rb) {
      var lines = 22, band = H * rb.w;
      for (var i = 0; i < lines; i++) {
        var f = i / (lines - 1), off = (f - .5) * band, s = TAU * (tt * rb.k + rb.ph);
        var x0 = W * .22, x3 = W * 1.08;
        var y0 = H * rb.y + off + H * rb.amp * .35 * Math.sin(s + f * .6);
        var y1 = H * rb.y + off - H * rb.amp * Math.cos(s * .9 + f * .8);
        var y2 = H * rb.y + off + H * rb.amp * Math.sin(s * 1.1 + 1.3 + f * .5);
        var y3 = H * rb.y + off - H * rb.amp * .4 * Math.cos(s + .7);
        var lg = ctx.createLinearGradient(x0, 0, x3, 0);
        var edge = 1 - Math.abs(f - .5) * 2, al = rb.a * (.25 + .75 * edge);
        lg.addColorStop(0, 'rgba(64,208,255,0)'); lg.addColorStop(.35, 'rgba(64,208,255,' + al + ')'); lg.addColorStop(.8, 'rgba(90,88,226,' + al + ')'); lg.addColorStop(1, 'rgba(90,88,226,0)');
        ctx.strokeStyle = lg; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(W * .5, y1, W * .8, y2, x3, y3); ctx.stroke();
      }
    });
    /* legibility veil: left on desktop, bottom on mobile */
    ctx.globalCompositeOperation = 'source-over';
    var mobile = W < 768, v = mobile ? ctx.createLinearGradient(0, H, 0, H * .35) : ctx.createLinearGradient(0, 0, W * .62, 0);
    v.addColorStop(0, 'rgba(31,37,68,.88)'); v.addColorStop(1, 'rgba(31,37,68,0)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  function tick() {
    var d = target - t;
    if (Math.abs(d) < 0.0004) { t = target; draw(t); raf = 0; return; }
    t += d * 0.14; draw(t); raf = requestAnimationFrame(tick);
  }
  function nudge(dx) {
    if (reduce) return;
    target = Math.max(0, Math.min(1, target + (dx / window.innerWidth) * SENS));
    if (!raf) raf = requestAnimationFrame(tick);
  }
  var prevX = null;
  window.addEventListener('mousemove', function (e) { if (prevX !== null) nudge(e.clientX - prevX); prevX = e.clientX; }, { passive: true });
  var tx = null;
  hero.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchmove', function (e) { var x = e.touches[0].clientX; if (tx !== null) nudge(x - tx); tx = x; }, { passive: true });
  var rs; window.addEventListener('resize', function () { clearTimeout(rs); rs = setTimeout(size, 120); }, { passive: true });
  size();

  /* ---------- typewriter H1 (full text stays in the DOM for crawlers and screen readers) ---------- */
  var h1 = hero.querySelector('.fx-type');
  if (h1 && !reduce) {
    var text = h1.textContent.trim(); h1.setAttribute('aria-label', text); h1.textContent = '';
    var chars = [];
    text.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { var sp = document.createElement('span'); sp.className = 'fx-ch'; sp.setAttribute('aria-hidden', 'true'); sp.textContent = ' '; h1.appendChild(sp); chars.push(sp); return; }
      var w = document.createElement('span'); w.className = 'fx-word'; w.setAttribute('aria-hidden', 'true');
      part.split('').forEach(function (c) { var s = document.createElement('span'); s.className = 'fx-ch'; s.textContent = c; w.appendChild(s); chars.push(s); });
      h1.appendChild(w);
    });
    var cur = document.createElement('span'); cur.className = 'fx-cursor'; cur.setAttribute('aria-hidden', 'true');
    h1.classList.add('is-typing'); if (chars[0]) chars[0].parentNode.insertBefore(cur, chars[0]);
    var i = 0;
    setTimeout(function () {
      var iv = setInterval(function () {
        if (i >= chars.length) { clearInterval(iv); cur.remove(); h1.classList.remove('is-typing'); return; }
        var c = chars[i++]; c.classList.add('on'); c.parentNode.insertBefore(cur, c.nextSibling);
      }, 38);
    }, 600);
  }

  /* ---------- pills reveal after 400ms ---------- */
  var pills = hero.querySelector('.fx-pills'); if (pills) setTimeout(function () { pills.classList.add('is-in'); }, reduce ? 0 : 400);

  /* ---------- copy email ---------- */
  var copyBtn = hero.querySelector('[data-copy]'), live = hero.querySelector('.fx-copy-status');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var v = copyBtn.getAttribute('data-copy');
    var done = function () { if (live) live.textContent = 'Email copied: ' + v; copyBtn.classList.add('is-copied'); setTimeout(function () { copyBtn.classList.remove('is-copied'); }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function () { window.location.href = 'mailto:' + v; });
    else window.location.href = 'mailto:' + v;
  });

  /* ---------- fx nav: burger + solid state past the hero ---------- */
  var nav = document.querySelector('.fx-nav'), burger = document.getElementById('fx-burger'), menu = document.getElementById('fx-menu');
  function setOpen(o) { document.body.classList.toggle('fx-menu-open', o); burger.setAttribute('aria-expanded', String(o)); burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); menu.setAttribute('aria-hidden', String(!o)); if (o) { var f = menu.querySelector('a'); f && f.focus(); } }
  if (burger && menu) {
    burger.addEventListener('click', function () { setOpen(!document.body.classList.contains('fx-menu-open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('fx-menu-open')) { setOpen(false); burger.focus(); } });
  }
  if (nav) { var onScroll = function () { nav.classList.toggle('is-solid', window.scrollY > hero.offsetHeight - 80); }; window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }
})();
