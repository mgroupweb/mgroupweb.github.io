// =============================================================================
// Hero globe — rotating wireframe earth visualization.
// ~300 fibonacci-distributed points on a sphere, connected by lines to
// nearest neighbours within an angular threshold. Slow Y-axis rotation,
// depth-based alpha for 3D feel. Brand cyan only.
//
// Performance:
//   - dpr capped at 1.5 on desktop, 1 on mobile
//   - links precomputed once at init
//   - paused via IntersectionObserver when offscreen
//   - prefers-reduced-motion → single static frame
//   - 1 canvas only — no other layers
// =============================================================================
(() => {
  const canvas = document.querySelector('.hero-globe');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dprCap = window.matchMedia('(min-width: 992px)').matches ? 1.5 : 1;
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.documentElement;
  const cssVar = (name, fallback) =>
    getComputedStyle(root).getPropertyValue(name).trim() || fallback;
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  let cyanRGB = hexToRgb(cssVar('--c-cyan', '#40D0FF'));
  let indigoRGB = hexToRgb(cssVar('--c-indigo', '#5A58E2'));

  // ---- Fibonacci sphere -----------------------------------------------------
  const N = 320;
  const points = new Array(N);
  const goldenAngle = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2; // y from 1 to -1
    const ringRadius = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points[i] = {
      x: Math.cos(theta) * ringRadius,
      y: y,
      z: Math.sin(theta) * ringRadius,
    };
  }

  // ---- Precompute neighbour links -------------------------------------------
  // Link two points if their euclidean distance on the unit sphere is below
  // a threshold — that gives the triangulated mesh look.
  const links = [];
  const LINK_THRESHOLD = 0.32; // chord length, ~0.32 = ~18° great-circle
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dz = points[i].z - points[j].z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < LINK_THRESHOLD * LINK_THRESHOLD) links.push([i, j]);
    }
  }

  // ---- Sizing ---------------------------------------------------------------
  let W = 0, H = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!W || !H) return;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---- Render ---------------------------------------------------------------
  // Scratch buffers reused per frame.
  const projX = new Float32Array(N);
  const projY = new Float32Array(N);
  const projA = new Float32Array(N); // alpha 0..1 (front=1)
  const projZ = new Float32Array(N);

  // ---- Order packets ---------------------------------------------------------
  // Animated dots that travel from point to point along the wireframe links,
  // suggesting orders / data flowing across the global network.
  const packets = [];
  const MAX_PACKETS = 7;
  let lastSpawn = 0;
  const SPAWN_INTERVAL = 520; // ms between spawn attempts
  function spawnPacket() {
    // Try up to 40 times to pick a link with both endpoints on the front.
    for (let attempt = 0; attempt < 40; attempt++) {
      const idx = (Math.random() * links.length) | 0;
      const [a, b] = links[idx];
      if (projA[a] > 0.45 && projA[b] > 0.45) {
        packets.push({
          link: idx,
          t: 0,
          speed: 0.009 + Math.random() * 0.014, // ~0.009–0.023 per frame
          white: Math.random() < 0.35,           // 35% chance of bright white head
        });
        return;
      }
    }
  }

  function render(t) {
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.46;
    const focal = 2.6;

    // Rotation: continuous around Y, gentle tilt around X.
    const angY = t * 0.00012;
    const angX = Math.sin(t * 0.00007) * 0.18 + 0.22; // mostly look-down ~12°
    const cY = Math.cos(angY), sY = Math.sin(angY);
    const cX = Math.cos(angX), sX = Math.sin(angX);

    // Project once.
    for (let i = 0; i < N; i++) {
      const p = points[i];
      // Rotate around Y
      const x1 = p.x * cY - p.z * sY;
      const z1 = p.x * sY + p.z * cY;
      // Rotate around X
      const y2 = p.y * cX - z1 * sX;
      const z2 = p.y * sX + z1 * cX;
      // Perspective project
      const scale = focal / (focal + z2);
      projX[i] = cx + x1 * scale * R;
      projY[i] = cy + y2 * scale * R;
      projZ[i] = z2;
      projA[i] = Math.max(0, Math.min(1, (z2 + 1) * 0.5));
    }

    // NO halo / background fill — keep the canvas fully transparent so the
    // hero's own background (and any hero-aura behind) shows through cleanly.
    // The globe must not introduce its own background tint.

    // Lines — back to front (avoid drawing front-occluded lines on back).
    ctx.lineWidth = 0.7;
    for (let k = 0; k < links.length; k++) {
      const [i, j] = links[k];
      const avgA = (projA[i] + projA[j]) * 0.5;
      if (avgA < 0.18) continue; // skip far-back lines
      const alpha = 0.10 + 0.32 * avgA;
      ctx.strokeStyle = `rgba(${cyanRGB[0]},${cyanRGB[1]},${cyanRGB[2]},${alpha})`;
      ctx.beginPath();
      ctx.moveTo(projX[i], projY[i]);
      ctx.lineTo(projX[j], projY[j]);
      ctx.stroke();
    }

    // Dots — drawn after lines so they pop. Brighter on the front.
    for (let i = 0; i < N; i++) {
      const a = projA[i];
      if (a < 0.15) continue; // skip very back dots
      const r = 0.8 + a * 1.6;
      ctx.fillStyle = `rgba(${cyanRGB[0]},${cyanRGB[1]},${cyanRGB[2]},${0.35 + a * 0.55})`;
      ctx.beginPath();
      ctx.arc(projX[i], projY[i], r, 0, Math.PI * 2);
      ctx.fill();
    }

    // A few "bright" stars at the very front (top 12 by z) for sparkle.
    for (let i = 0; i < N; i++) {
      const a = projA[i];
      if (a < 0.88) continue;
      ctx.fillStyle = `rgba(255,255,255,${(a - 0.88) * 3.0})`;
      ctx.beginPath();
      ctx.arc(projX[i], projY[i], 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- Order packets — travel along links from point A to point B ----
    // Spawn periodically (only when projection data is fresh).
    if (t - lastSpawn > SPAWN_INTERVAL && packets.length < MAX_PACKETS) {
      spawnPacket();
      lastSpawn = t;
    }

    // Update + draw active packets.
    for (let p = packets.length - 1; p >= 0; p--) {
      const pkt = packets[p];
      pkt.t += pkt.speed;
      if (pkt.t >= 1) { packets.splice(p, 1); continue; }

      const [a, b] = links[pkt.link];
      // Hide if the link rotated to the back since spawn.
      if (projA[a] < 0.30 || projA[b] < 0.30) continue;

      const ax = projX[a], ay = projY[a];
      const bx = projX[b], by = projY[b];
      const headX = ax + (bx - ax) * pkt.t;
      const headY = ay + (by - ay) * pkt.t;

      // Trail — segment from t-0.18 to t along the link with cyan gradient.
      const tailT = Math.max(0, pkt.t - 0.20);
      const tailX = ax + (bx - ax) * tailT;
      const tailY = ay + (by - ay) * tailT;

      const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
      grad.addColorStop(0,    `rgba(${cyanRGB[0]},${cyanRGB[1]},${cyanRGB[2]},0)`);
      grad.addColorStop(1,    `rgba(${cyanRGB[0]},${cyanRGB[1]},${cyanRGB[2]},0.85)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();

      // Head — bright dot with subtle outer glow.
      const headColor = pkt.white
        ? '255,255,255'
        : `${cyanRGB[0]},${cyanRGB[1]},${cyanRGB[2]}`;
      // Outer glow
      ctx.fillStyle = `rgba(${headColor},0.30)`;
      ctx.beginPath();
      ctx.arc(headX, headY, 5, 0, Math.PI * 2);
      ctx.fill();
      // Core
      ctx.fillStyle = `rgba(${headColor},1)`;
      ctx.beginPath();
      ctx.arc(headX, headY, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (running) rafId = requestAnimationFrame(render);
  }

  // ---- Lifecycle ------------------------------------------------------------
  let running = false;
  let rafId = 0;
  function start() {
    if (running || reduce) {
      if (reduce) render(0);
      return;
    }
    running = true;
    rafId = requestAnimationFrame(render);
  }
  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  // IntersectionObserver — only animate when in view.
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) start();
    else stop();
  }, { threshold: 0.01 });

  resize();
  window.addEventListener('resize', () => { resize(); }, { passive: true });
  io.observe(canvas);

  // First static paint so the globe is visible before scroll triggers IO
  render(0);
})();
