/* Hub hero: full-screen brand-recoloured video scrubbed by horizontal pointer movement, typewriter H1, copy-email pill, fx nav. */
(function () {
  'use strict';
  var hero = document.querySelector('.fx-hero'); if (!hero) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- background video, scrubbed by horizontal pointer movement (no autoplay) ---------- */
  var video = hero.querySelector('.fx-hero__video'), SENS = 0.8, targetTime = 0, seeking = false;
  function seek() {
    if (!video || !video.duration) return;
    if (Math.abs(video.currentTime - targetTime) < 0.001) return;
    seeking = true; video.currentTime = targetTime;
  }
  if (video && video.dataset.src) {
    /* Load as a blob so every frame is seekable instantly, whatever the host's Range support. */
    fetch(video.dataset.src).then(function (r) { return r.ok ? r.blob() : Promise.reject(r.status); })
      .then(function (b) { video.src = URL.createObjectURL(b); video.load(); })
      .catch(function () { video.src = video.dataset.src; });
  }
  if (video) {
    video.addEventListener('seeked', function () { seeking = false; if (Math.abs(video.currentTime - targetTime) > 0.001) seek(); });
    var nudge = function (dx) {
      if (reduce || !video.duration) return;
      targetTime = Math.max(0, Math.min(video.duration, targetTime + (dx / window.innerWidth) * SENS * video.duration));
      if (!seeking) seek();
    };
    var prevX = null;
    window.addEventListener('mousemove', function (e) { if (prevX !== null) nudge(e.clientX - prevX); prevX = e.clientX; }, { passive: true });
    var tx = null;
    hero.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchmove', function (e) { var x = e.touches[0].clientX; if (tx !== null) nudge(x - tx); tx = x; }, { passive: true });
  }

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
