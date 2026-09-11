// =============================================================================
// Hero aurora — soft drifting blobs to the right of the hero text.
// 4 radial gradients move along independent lissajous orbits and composite
// with `lighter` blending for a cheap aurora feel. Brand cyan + indigo only.
// Performance:
//   - dpr capped at 1.5 on desktop, 1 on mobile
//   - paused via IntersectionObserver when offscreen
//   - exits early on prefers-reduced-motion (renders one static frame)
//   - RGB tuples cached on palette refresh so the hex→RGB parse doesn't
//     re-run for every blob every frame
// =============================================================================
(() => {
  const canvas = document.querySelector('.hero-aura');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dprCap = window.matchMedia('(min-width: 992px)').matches ? 1.5 : 1;
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.documentElement;
  const cssVar = (name, fallback) =>
    getComputedStyle(root).getPropertyValue(name).trim() || fallback;

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // Live palette — re-read on token changes (design-system playground).
  // Pre-parse hex→RGB tuples so render() doesn't redo it 4× per frame.
  let cyanRGB, indigoRGB;
  function refreshPalette() {
    cyanRGB   = hexToRgb(cssVar('--c-cyan',   '#40D0FF'));
    indigoRGB = hexToRgb(cssVar('--c-indigo', '#5A58E2'));
  }
  refreshPalette();
  new MutationObserver(refreshPalette)
    .observe(root, { attributes: true, attributeFilter: ['style', 'class'] });

  // 4 blobs with independent x/y frequencies and phase offsets so the
  // composite never settles into a noticeable repeat. Centres bias to
  // the right half (cx ~0.55–0.85) — left side stays clean for text.
  const blobs = [
    { rgb: () => cyanRGB,   ax: 0.18, ay: 0.22, fx: 0.00021, fy: 0.00031, ph: 0.0,  cx: 0.62, cy: 0.45, radius: 0.55, alpha: 0.42 },
    { rgb: () => indigoRGB, ax: 0.20, ay: 0.18, fx: 0.00029, fy: 0.00017, ph: 1.2,  cx: 0.78, cy: 0.55, radius: 0.55, alpha: 0.45 },
    { rgb: () => cyanRGB,   ax: 0.14, ay: 0.20, fx: 0.00015, fy: 0.00027, ph: 2.6,  cx: 0.85, cy: 0.30, radius: 0.45, alpha: 0.32 },
    { rgb: () => indigoRGB, ax: 0.22, ay: 0.16, fx: 0.00033, fy: 0.00023, ph: 4.1,  cx: 0.55, cy: 0.70, radius: 0.50, alpha: 0.35 }
  ];

  let W = 0, H = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!W || !H) return;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function render(t) {
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);
    // `lighter` (additive) accumulates colour where blobs overlap — that's
    // what gives the aurora its bright core. Cheaper than `screen` and
    // visually similar on dark backgrounds.
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const cx = W * (b.cx + b.ax * Math.sin(t * b.fx + b.ph));
      const cy = H * (b.cy + b.ay * Math.cos(t * b.fy + b.ph));
      const r  = Math.max(W, H) * b.radius;
      const [rr, gg, bb] = b.rgb();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0,    `rgba(${rr},${gg},${bb},${b.alpha})`);
      grad.addColorStop(0.45, `rgba(${rr},${gg},${bb},${b.alpha * 0.25})`);
      grad.addColorStop(1,    `rgba(${rr},${gg},${bb},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  let raf = 0;
  let visible = false;
  let firstT = 0;
  let lastNow = 0;
  // Target ~30fps so we leave half of every 16ms frame to the main thread
  // (scroll paint, layout, other canvases). Animation stays smooth — the
  // aurora blobs drift at sub-pixel speeds, doubled frame-time is invisible.
  const FRAME_INTERVAL = 33;
  let lastFrameAt = 0;

  function tick(now) {
    if (!firstT) firstT = now;
    lastNow = now;
    if (now - lastFrameAt >= FRAME_INTERVAL) {
      lastFrameAt = now;
      render(now - firstT);
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
