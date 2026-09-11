// =============================================================================
// Hero ribbons — flowing neon bezier curves on the right side of the hero,
// layered above .hero-aura. 7 ribbons with bezier control points drifting
// along independent Lissajous orbits + a soft mouse parallax. Brand cyan +
// indigo only.
// Performance:
//   - dpr capped at 1.5 on desktop, 1 on mobile
//   - paused via IntersectionObserver when offscreen
//   - prefers-reduced-motion → 1 static frame, no RAF
//   - RGB tuples cached on palette refresh (no hex→rgb in render hot path)
//   - scroll-driven transform/opacity computed INSIDE the RAF tick rather
//     than on every scroll event — eliminates style-write thrash on fast
//     scroll (the freeze user reported)
// =============================================================================
(() => {
  const canvas = document.querySelector('.hero-ribbons');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dprCap = window.matchMedia('(min-width: 992px)').matches ? 1.5 : 1;
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.documentElement;
  const cssVar = (name, fb) =>
    getComputedStyle(root).getPropertyValue(name).trim() || fb;

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // Pre-parsed RGB tuples; refreshed on token change. Render reads them
  // directly — no per-frame hex parsing.
  let cyanRGB, indigoRGB;
  function refreshPalette() {
    cyanRGB   = hexToRgb(cssVar('--c-cyan',   '#40D0FF'));
    indigoRGB = hexToRgb(cssVar('--c-indigo', '#5A58E2'));
  }
  refreshPalette();
  new MutationObserver(refreshPalette)
    .observe(root, { attributes: true, attributeFilter: ['style', 'class'] });

  // 7 ribbons. Each starts on the right half (sx 0.3+) and exits the right
  // edge (ex 1.05). Control-point amplitudes/frequencies are deliberately
  // distinct + phase-offset so the bundle never lines up.
  const N = 7;
  const ribbons = [];
  for (let i = 0; i < N; i++) {
    ribbons.push({
      rgb: () => (i % 2 === 0 ? cyanRGB : indigoRGB),
      sx: 0.32,
      sy: 0.05 + (i / (N - 1)) * 0.9,
      ex: 1.08,
      ey: 0.05 + ((i + 0.6) / (N - 1)) * 0.85,
      c1ax: 0.12, c1ay: 0.18,
      c2ax: 0.14, c2ay: 0.20,
      f1x: 0.00018 + i * 0.000045,
      f1y: 0.00029 - i * 0.000022,
      f2x: 0.00024 - i * 0.000020,
      f2y: 0.00021 + i * 0.000040,
      ph: i * (Math.PI * 2 / N),
      width: 1.4 + (i % 3) * 0.8,
      alpha: 0.55 - (i % 3) * 0.10
    });
  }

  // Mouse parallax — small offset (~10px max), eased toward target each
  // frame. Listener only writes targets, render eases.
  let mxTarget = 0, myTarget = 0;
  let mx = 0, my = 0;
  window.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    if (r.width === 0) return;
    mxTarget = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    myTarget = ((e.clientY - r.top)  / r.height - 0.5) * 2;
  }, { passive: true });

  // Host element used to compute scrollProgress. Cached so getBoundingClientRect
  // (the only layout read) happens inside RAF, not on every scroll event.
  const host = canvas.closest('.hero-aura-host');
  let lastTransform = '';
  let lastOpacity   = '';

  let W = 0, H = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!W || !H) return;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Compute scrollProgress + sync the canvas transform/opacity. Cheap:
  // one layout read + at most two style writes (skipped when value is
  // unchanged via the `last*` cache). Called every frame, even while the
  // user is scrolling, so the canvas position never lags behind.
  function syncScrollState() {
    let scrollProgress = 0;
    if (host) {
      const r = host.getBoundingClientRect();
      const total = Math.max(1, r.height);
      scrollProgress = Math.max(0, Math.min(1, Math.max(0, -r.top) / total));
    }
    const nextTransform = `translate3d(0, ${scrollProgress * 80}px, 0)`;
    const nextOpacity   = String(Math.max(0, 1 - scrollProgress * 0.7));
    if (nextTransform !== lastTransform) {
      canvas.style.transform = nextTransform;
      lastTransform = nextTransform;
    }
    if (nextOpacity !== lastOpacity) {
      // `important` defeats the CSS `heroRibbonsFade forwards` fill mode.
      canvas.style.setProperty('opacity', nextOpacity, 'important');
      lastOpacity = nextOpacity;
    }
    return scrollProgress;
  }

  function render(t) {
    if (!W || !H) return;
    const scrollProgress = syncScrollState();

    // ---- Mouse parallax easing -------------------------------------------
    mx += (mxTarget - mx) * 0.05;
    my += (myTarget - my) * 0.05;
    const parX = mx * 14;
    const parY = my *  8;

    // ---- Funnel lerp (towards bottom-right focal point) ------------------
    const fp = scrollProgress * 0.6;
    const lerpX = (v) => v * (1 - fp) + 1.00 * fp;
    const lerpY = (v) => v * (1 - fp) + 0.92 * fp;

    ctx.clearRect(0, 0, W, H);
    // `lighter` accumulates colour where ribbons cross — same trick as
    // hero-aura, gives the neon-bloom look without a real bloom pass.
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    for (let i = 0; i < ribbons.length; i++) {
      const r = ribbons[i];
      const lsx = lerpX(r.sx), lsy = lerpY(r.sy);
      const lex = lerpX(r.ex), ley = lerpY(r.ey);
      const sx = W * lsx + parX;
      const sy = H * lsy + parY;
      const ex = W * lex + parX;
      const ey = H * ley + parY;
      const c1x = W * (lerpX(r.sx + 0.25) + r.c1ax * Math.sin(t * r.f1x + r.ph))     + parX;
      const c1y = H * (lerpY(r.sy)        + r.c1ay * Math.cos(t * r.f1y + r.ph))     + parY;
      const c2x = W * (lerpX(r.sx + 0.65) + r.c2ax * Math.sin(t * r.f2x + r.ph + 1)) + parX;
      const c2y = H * (lerpY(r.sy)        + r.c2ay * Math.cos(t * r.f2y + r.ph + 1)) + parY;

      const [rr, gg, bb] = r.rgb();
      const grad = ctx.createLinearGradient(sx, sy, ex, ey);
      grad.addColorStop(0,   `rgba(${rr},${gg},${bb},0)`);
      grad.addColorStop(0.5, `rgba(${rr},${gg},${bb},${r.alpha})`);
      grad.addColorStop(1,   `rgba(${rr},${gg},${bb},0)`);

      ctx.strokeStyle = grad;
      ctx.lineWidth   = r.width;
      ctx.shadowBlur  = 14;
      ctx.shadowColor = `rgba(${rr},${gg},${bb},0.55)`;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  let raf = 0;
  let visible = false;
  let firstT = 0;
  let lastNow = 0;
  // Target ~30fps. ShadowBlur on 7 bezier strokes is the dominant cost
  // per frame (~8–10ms); halving render frequency doubles the budget and
  // hands the rest back to the main thread for scroll paint. Visual is
  // essentially identical — the lissajous drift moves at sub-pixel speeds.
  const FRAME_INTERVAL = 33;
  let lastFrameAt = 0;

  function tick(now) {
    if (!firstT) firstT = now;
    lastNow = now;
    if (now - lastFrameAt >= FRAME_INTERVAL) {
      lastFrameAt = now;
      render(now - firstT);
    } else {
      // Off-frame: still sync scroll-driven transform/opacity so parallax
      // doesn't visibly lag behind scroll. Layout read + cached compare —
      // ~µs, negligible.
      syncScrollState();
    }
    if (visible) raf = requestAnimationFrame(tick);
    else raf = 0;
  }

  resize();

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      resize();
      render(firstT && lastNow ? lastNow - firstT : 0);
    });
    ro.observe(canvas);
  }
  window.addEventListener('resize', () => {
    resize();
    render(firstT && lastNow ? lastNow - firstT : 0);
  }, { passive: true });

  if (reduceMotion) {
    render(0);
    return;
  }

  // Mobile: one static frame, no RAF loop — continuous canvas repaints on a
  // throttled phone turn every frame into a long task and wreck TBT/INP.
  // The breakpoint is live: crossing 992px starts/stops the loop, so a
  // desktop↔mobile resize never leaves a dead (unanimated) canvas.
  const mqMobile = window.matchMedia('(max-width: 991px)');
  let io = null;

  function startLoop() {
    if (io || raf) return;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(tick);
      }, { threshold: 0 });
      io.observe(canvas);
    } else {
      visible = true;
      raf = requestAnimationFrame(tick);
    }
  }

  function stopLoop() {
    if (io) { io.disconnect(); io = null; }
    visible = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    render(0);
  }

  function applyMode() {
    if (mqMobile.matches) stopLoop();
    else startLoop();
  }
  applyMode();
  if (mqMobile.addEventListener) mqMobile.addEventListener('change', applyMode);
  else if (mqMobile.addListener) mqMobile.addListener(applyMode);
})();
