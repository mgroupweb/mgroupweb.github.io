// =============================================================================
// Mgroup prototype — main behavior bundle
// 1) Mobile nav toggle
// 2) Credentials reveal observer (IntersectionObserver)
// 3) 3D-distorted hero (WebGL via Three.js, lazy-loaded module)
//
// All work guarded by feature checks and `prefers-reduced-motion`.
// =============================================================================

// ---- 0) Resize transition stopper -------------------------------------------
// While the window is being dragged across breakpoints, elements that switch
// state via CSS transitions (mobile menu panel, dropdowns, banners) play their
// enter/leave animations mid-resize and visibly flash. `html.is-resizing`
// kills ALL transitions for the duration of the drag (removed 200ms after the
// last resize event) — see the matching rule in base/_global.scss.
(() => {
  let t = 0;
  window.addEventListener('resize', () => {
    document.documentElement.classList.add('is-resizing');
    clearTimeout(t);
    t = setTimeout(() => document.documentElement.classList.remove('is-resizing'), 200);
  }, { passive: true });
})();

// ---- 1) Unified nav — burger toggle + Services dropdown (mobile accordion)
(() => {
  const burger = document.getElementById('nav-burger');
  const menu   = document.getElementById('nav-menu');
  if (!burger || !menu) return;

  const mqDesktop = window.matchMedia('(min-width: 992px)');

  function setOpen(open) {
    document.body.classList.toggle('is-menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open && !mqDesktop.matches));
  }

  burger.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('is-menu-open'));
  });

  // Close on regular link click (so anchor jumps work cleanly).
  // Skip the Services dropdown TRIGGER button — that one only toggles the
  // accordion on mobile, doesn't navigate.
  menu.querySelectorAll('a[href]').forEach(a => {
    a.addEventListener('click', () => {
      if (mqDesktop.matches) return;
      setOpen(false);
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('is-menu-open')) {
      setOpen(false);
    }
  });

  // Auto-close + reset accordion state when viewport crosses the desktop
  // breakpoint (in either direction). Belt-and-braces: on every resize,
  // wipe any stale state we picked up at the other breakpoint.
  function syncToBreakpoint() {
    if (mqDesktop.matches) {
      // Desktop — make sure the mobile fullscreen panel is dismissed
      setOpen(false);
      menu.querySelectorAll('.nav-item--dropdown.is-open').forEach(item => item.classList.remove('is-open'));
    } else {
      // Mobile — desktop hover dropdown shouldn't be sticky
      menu.querySelectorAll('.nav-item--dropdown.is-open').forEach(item => item.classList.remove('is-open'));
    }
  }
  mqDesktop.addEventListener('change', syncToBreakpoint);
  // Some browsers (older Safari, embedded webviews) don't fire `change` on
  // resize when the bar collapses. Belt: also listen to plain resize and
  // debounce via rAF.
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(syncToBreakpoint);
  }, { passive: true });

  // Services trigger: click toggles .is-open on every viewport. CSS :hover
  // and :focus-within still open the dropdown as fallback on desktop with a
  // pointer device. Click ensures the dropdown also works on touch devices
  // (no hover) and in browsers where clicking a button doesn't retain focus
  // (Safari, Firefox) — which used to leave the dropdown unreachable.
  const dropdownItems = menu.querySelectorAll('.nav-item--dropdown');
  menu.querySelectorAll('.nav-link-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const item = btn.closest('.nav-item--dropdown');
      // Close any sibling dropdowns first so only one is open at a time.
      dropdownItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          const otherBtn = other.querySelector('.nav-link-btn');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  // Click outside any open dropdown closes it.
  document.addEventListener('click', (e) => {
    dropdownItems.forEach(item => {
      if (!item.classList.contains('is-open')) return;
      if (item.contains(e.target)) return;
      item.classList.remove('is-open');
      const btn = item.querySelector('.nav-link-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  });

  // Escape closes any open dropdown.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    dropdownItems.forEach(item => {
      if (!item.classList.contains('is-open')) return;
      item.classList.remove('is-open');
      const btn = item.querySelector('.nav-link-btn');
      if (btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  });

  // Legacy support: keep old .site-header__toggle working if present
  const legacyToggle = document.querySelector('.site-header__toggle');
  if (legacyToggle) {
    legacyToggle.addEventListener('click', () => {
      const expanded = legacyToggle.getAttribute('aria-expanded') === 'true';
      legacyToggle.setAttribute('aria-expanded', String(!expanded));
      document.body.classList.toggle('is-menu-open');
    });
  }
})();

// ---- 1a) Hero nav scroll behaviour ----------------------------------------
//   - y < THRESHOLD-BUFFER → default nav (full-bleed transparent, in flow)
//   - y crosses THRESHOLD  → enter pill state HIDDEN (snap, no transition flash)
//   - any downward motion  → stay hidden
//   - sustained up motion (≥ REVEAL_COMMIT_PX) → reveal pill smoothly
(() => {
  const nav = document.querySelector('.hero-nav');
  if (!nav) return;

  const SCROLL_THRESHOLD   = 830;  // pill activates here
  const SCROLL_BUFFER      = 40;   // hysteresis for leaving pill state
  const REVEAL_COMMIT_PX   = 30;   // upward scroll required to reveal

  let lastY = window.scrollY;
  let ticking = false;
  let isScrolledNow = false;
  let isHiddenNow = false;
  let upAccum = 0;

  // Hover dropdown only exists on desktop with a real pointer — skip the
  // `:hover` recalc work elsewhere.
  const dropdownItems = document.querySelectorAll('.nav-item--dropdown');
  const mqHasHover    = window.matchMedia('(hover: hover) and (min-width: 992px)');

  const setHidden = (next) => {
    if (next === isHiddenNow) return;
    isHiddenNow = next;
    nav.classList.toggle('is-hidden', next);
  };
  const setScrolled = (next) => {
    if (next === isScrolledNow) return;
    isScrolledNow = next;
    nav.classList.toggle('is-scrolled', next);
    if (!next) setHidden(false);    // clear any lingering hidden state
  };

  // Snap into pill+hidden without animating. Without this, the moment
  // `.is-scrolled` lands the nav sits at transform 0 (visible pill at top)
  // and the CSS transition animates a 250ms slide up to translateY(-100%)
  // — that's the appear-then-hide flicker users see on scroll-down.
  const snapToScrolledHidden = () => {
    nav.style.transition = 'none';
    setScrolled(true);
    setHidden(true);
    // double-rAF: перший кадр рендериться з transition:none, другий повертає
    // анімації — без синхронного reflow (void offsetHeight коштував ~77ms TBT)
    requestAnimationFrame(() => requestAnimationFrame(() => { nav.style.transition = ''; }));
  };

  const closeOpenDesktopDropdowns = () => {
    if (!mqHasHover.matches) return;
    for (let i = 0; i < dropdownItems.length; i++) {
      const item = dropdownItems[i];
      if (item.matches(':hover, :focus-within')) {
        const btn = item.querySelector('.nav-link-btn');
        if (btn) btn.blur();
      }
    }
  };

  function update() {
    const y = window.scrollY;
    const diff = y - lastY;
    lastY = y;
    ticking = false;

    if (document.body.classList.contains('is-menu-open')) {
      setHidden(false);
      upAccum = 0;
      return;
    }

    if (y < SCROLL_THRESHOLD - SCROLL_BUFFER) {
      setScrolled(false);
      upAccum = 0;
      return;
    }

    if (!isScrolledNow) {
      snapToScrolledHidden();
      upAccum = 0;
      return;
    }

    if (diff > 0) {
      setHidden(true);
      upAccum = 0;
    } else if (diff < 0) {
      upAccum += -diff;
      if (upAccum >= REVEAL_COMMIT_PX) setHidden(false);
    }

    closeOpenDesktopDropdowns();
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  // Initial sync — also re-runs after `load` because browsers restore
  // scroll position AFTER module scripts run, with no scroll event fired.
  const init = () => { lastY = window.scrollY; update(); };
  init();
  if (document.readyState !== 'complete') {
    window.addEventListener('load', init, { once: true });
  }
})();

// ---- 1b) Case Studies tabs (Stores / Apps) ---------------------------------
//
// CSS-driven smooth fade between active/inactive states. Each tab has its
// own ::before pill — toggling .is-active fades + scales it. Pure CSS
// transitions; this handler only manages the active class + ARIA + panel
// switch.
(() => {
  const tabs = document.querySelectorAll('.mg-cases__tab');
  if (!tabs.length) return;
  const panels = document.querySelectorAll('.mg-cases__panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.mgTab;
      tabs.forEach(t => {
        const active = t.dataset.mgTab === target;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      panels.forEach(p => p.classList.toggle('is-active', p.dataset.mgPanel === target));
    });
  });
})();

// ---- 2) Credentials reveal-on-scroll ---------------------------------------
(() => {
  const cred = document.querySelector('.credentials');
  if (!cred || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        cred.classList.add('is-visible');
        io.disconnect();
      }
    });
  }, { threshold: 0.18 });
  io.observe(cred);
})();


// =============================================================================
// Marquee — reusable horizontal scroller with auto-loop AND manual prev/next.
//
// Markup:
//   <div class="marquee" data-marquee
//        data-marquee-speed="40"            (px/s; default 40, set 0 to disable autoplay)
//        data-marquee-gap="1.25rem"         (sets --marquee-gap css var)
//        data-marquee-pause-on-hover="true|false" (default true)
//        data-marquee-direction="left|right" (default left)>
//     <button data-marquee-prev>‹</button>
//     <button data-marquee-next>›</button>
//     <div class="marquee__viewport" data-marquee-viewport>
//       <div class="marquee__track" data-marquee-track>
//         <article>...</article>
//       </div>
//     </div>
//   </div>
//
// Behavior:
//   - Clones every original card ONCE so the loop is seamless when scrollLeft
//     hits the half-way point we wrap back without visible jump.
//   - Auto-scroll uses requestAnimationFrame to add `speed * dt` px to scrollLeft.
//   - Arrows scroll by exactly one card width (with smooth behavior).
//   - Native overflow-x scroll → free touch swipe / trackpad / keyboard a11y.
//   - Pauses when the marquee leaves the viewport (IntersectionObserver) —
//     saves CPU and battery.
//   - Pauses on hover, focus, and during user touch/wheel/pointer interaction.
//   - Respects `prefers-reduced-motion: reduce` (no autoplay).
//
// Core Web Vitals:
//   - Native browser scroll (no transform animation that fights with user input)
//   - `content-visibility: auto` on cards skips offscreen rendering
//   - Cloned video gets `removeAttribute('autoplay')` so we don't pay the
//     decode cost twice
//   - Cloned nodes get `aria-hidden="true"` and their focusables `tabindex=-1`
//     so AT/keyboard only reach the originals — but clones stay mouse/touch
//     clickable (NOT `inert`), since they're visible cards in the loop
//   - Animation loop runs ONLY when marquee is visible AND not paused
// =============================================================================
class Marquee {
  constructor(el) {
    this.el = el;
    this.viewport = el.querySelector('[data-marquee-viewport]') || el;
    this.track = el.querySelector('[data-marquee-track]');
    if (!this.track) return;

    this.speed = parseFloat(el.dataset.marqueeSpeed ?? '40'); // px / second
    this.gap = el.dataset.marqueeGap || '1.25rem';
    this.direction = el.dataset.marqueeDirection || 'left'; // left = forward, right = backward
    this.pauseOnHover = el.dataset.marqueePauseOnHover !== 'false';
    this.reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

    this._clones = [];
    this._userPaused = false;
    this._inView = true;
    this._raf = 0;
    this._lastT = 0;
    this._userInteractTimer = 0;

    el.style.setProperty('--marquee-gap', this.gap);

    this.refresh();
    this._bindEvents();
    this._startLoop();

    // If the track contains images that aren't fully loaded yet, scrollWidth
    // may have been wrong at clone time. Re-run refresh once each one loads
    // so the seamless wrap math is based on the final track size.
    const imgs = this.track.querySelectorAll('img');
    let pending = 0;
    imgs.forEach(img => {
      if (img.complete && img.naturalWidth > 0) return;
      pending++;
      const done = () => {
        pending--;
        if (pending === 0) this.refresh();
      };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }

  refresh() {
    // Read FIRST, while layout is clean: with clones present the track is 3x
    // the block; without — 1x. Reading after the writes below would force a
    // synchronous reflow (~35ms on a throttled phone).
    const measured = this.track.scrollWidth;
    this._blockWidth = this._clones.length ? measured / 3 : measured;

    // Remove existing clones
    this._clones.forEach(n => n.remove());
    this._clones = [];

    const originals = Array.from(this.track.children).filter(n => !n.dataset.marqueeClone);

    const cloneSet = (where) => {
      originals.forEach(child => {
        const clone = child.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.dataset.marqueeClone = '';
        // Clones are on-screen in the infinite loop, so their links MUST stay
        // clickable (mouse/touch). `inert` would kill those clicks — instead we
        // just drop clone focusables out of the tab order + AT tree so keyboard
        // and screen-reader users only ever reach the originals.
        clone.querySelectorAll('a, button, [tabindex], input, select, textarea').forEach(el => el.setAttribute('tabindex', '-1'));
        clone.querySelectorAll('video').forEach(v => { v.removeAttribute('autoplay'); v.muted = true; });
        if (where === 'before') this.track.insertBefore(clone, this.track.firstChild);
        else this.track.appendChild(clone);
        this._clones.push(clone);
      });
    };

    // Triple-duplicate so the user can infinite-scroll in BOTH directions:
    //   [clones-before] [originals] [clones-after]
    // Initial scroll position will be the start of the middle copy. Going
    // left or right past the middle wraps back into the middle by adding
    // or subtracting the block width — visually identical because the three
    // copies are byte-for-byte the same.
    cloneSet('after');
    cloneSet('before');

    // Block-width = exactly one third of the full track (3 identical copies)

    // Start centered on the middle copy so there's a full cycle of buffer
    // available in either direction. Deferred to rAF: writing scrollLeft into
    // a dirty layout forces a synchronous reflow.
    requestAnimationFrame(() => { this.viewport.scrollLeft = this._blockWidth; });
  }

  _cardWidth() {
    const card = this.track.children[0];
    if (!card) return 360;
    const gapPx = parseFloat(getComputedStyle(this.track).gap || '0') || 0;
    return card.offsetWidth + gapPx;
  }

  next() { this._scrollByAmount(this._cardWidth()); }
  prev() { this._scrollByAmount(-this._cardWidth()); }

  _scrollByAmount(delta) {
    this._userPause();
    // rAF-based smooth scroll — works in every browser regardless of
    // CSS `scroll-behavior` support / honoring.
    const start = this.viewport.scrollLeft;
    const target = start + delta;
    const duration = 450;
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      this.viewport.scrollLeft = start + (target - start) * ease(t);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _wrapScroll() {
    // Track has 3 identical copies side-by-side. We keep scrollLeft in the
    // [blockWidth, 2 * blockWidth] window — i.e. always inside the middle copy.
    // When the user (or autoplay) scrolls outside, jump by blockWidth in
    // the appropriate direction; the visual result is unchanged because the
    // three copies are identical, but we now have a full cycle of buffer
    // available again on each side.
    const block = this._blockWidth;
    if (!block) return;
    const sl = this.viewport.scrollLeft;
    if (sl < block) this.viewport.scrollLeft = sl + block;
    else if (sl >= block * 2) this.viewport.scrollLeft = sl - block;
  }

  _userPause() {
    this._userPaused = true;
    clearTimeout(this._userInteractTimer);
    this._userInteractTimer = setTimeout(() => { this._userPaused = false; }, 1500);
  }

  _bindEvents() {
    const prev = this.el.querySelector('[data-marquee-prev]');
    const next = this.el.querySelector('[data-marquee-next]');
    if (prev) prev.addEventListener('click', () => this.prev());
    if (next) next.addEventListener('click', () => this.next());

    // Pause loop when off-screen
    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver(([entry]) => {
        this._inView = entry.isIntersecting;
      }, { threshold: 0 });
      this._io.observe(this.el);
    }

    if (this.pauseOnHover) {
      this.el.addEventListener('mouseenter', () => { this._hoverPaused = true; });
      this.el.addEventListener('mouseleave', () => { this._hoverPaused = false; });
      this.el.addEventListener('focusin',  () => { this._hoverPaused = true; });
      this.el.addEventListener('focusout', () => { this._hoverPaused = false; });
    }

    // User scroll / touch / wheel pauses autoplay briefly so we don't fight with them
    this.viewport.addEventListener('wheel',     () => this._userPause(), { passive: true });
    this.viewport.addEventListener('touchstart', () => this._userPause(), { passive: true });
    this.viewport.addEventListener('pointerdown', () => this._userPause());

    // Wrap-around on every native scroll (covers touch swipe past the halfway)
    this.viewport.addEventListener('scroll', () => this._wrapScroll(), { passive: true });
  }

  _startLoop() {
    if (this.speed === 0) return; // explicit autoplay-off
    const tick = (t) => {
      this._raf = requestAnimationFrame(tick);
      if (!this._lastT) { this._lastT = t; return; }
      const dt = (t - this._lastT) / 1000;
      this._lastT = t;
      const reduce = this.reducedMotionMQ.matches;
      if (!this._inView || this._hoverPaused || this._userPaused || reduce) return;
      const dir = this.direction === 'right' ? -1 : 1;
      this.viewport.scrollLeft += this.speed * dt * dir;
      this._wrapScroll();
    };
    this._raf = requestAnimationFrame(tick);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._io?.disconnect();
    this._clones.forEach(n => n.remove());
  }
}

// Auto-init every [data-marquee] once the layout has settled (so scrollWidth
// is correct after lazy-loaded images / fonts swap in).
function initMarquees() {
  document.querySelectorAll('[data-marquee]').forEach(el => {
    if (!el._marquee) el._marquee = new Marquee(el);
  });
}
if (document.readyState === 'complete') initMarquees();
else window.addEventListener('load', initMarquees, { once: true });


// ---- Contact modal ----------------------------------------------------------
// Wires every link with href="#contact" (plus any [data-modal-open="contact"])
// to open the modal. Implements: focus trap, ESC to close, click-outside,
// scroll lock, basic form validation, simulated submit.
(() => {
  const modal = document.getElementById('contact-modal');
  if (!modal) return;

  const panel = modal.querySelector('.mg-modal__panel');
  const form = modal.querySelector('[data-contact-form]');
  const successBox = modal.querySelector('[data-modal-success]');
  const submitBtn = modal.querySelector('.mg-modal__submit');

  let lastFocused = null;

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openModal(e) {
    if (e) e.preventDefault();
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-modal-open');
    // Focus the first input on next paint so the transition can start.
    setTimeout(() => {
      const first = panel.querySelector('input, textarea, button:not([data-modal-close])');
      if (first) first.focus();
    }, 50);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') {
      try { lastFocused.focus(); } catch (_) {}
    }
  }

  function isOpen() { return modal.classList.contains('is-open'); }

  // Open triggers — every #contact link plus explicit data-modal-open.
  // Editors choose the behavior per button in wp-admin: href "#contact"
  // opens this modal, a Calendly/any URL navigates normally.
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('a[href="#contact"], [data-modal-open="contact"]');
    if (!trigger) return;
    // Allow modifier-clicks (cmd/ctrl) and middle-click to fall through (open in new tab)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    openModal(e);
  });

  // Close triggers
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-modal-close]')) closeModal();
  });

  // ESC
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    if (e.key === 'Tab') {
      // Focus trap inside the panel
      const focusables = [...panel.querySelectorAll(FOCUSABLE)].filter(el => !el.hasAttribute('hidden'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Form submit (no backend yet — simulate success). Replace the simulated
  // setTimeout below with a real fetch to your endpoint.
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    // TODO: real submit — fetch('/api/contact', { method:'POST', body: new FormData(form) })
    await new Promise(r => setTimeout(r, 900));

    form.querySelectorAll('.mg-modal__row, .mg-modal__field, .mg-modal__legal, .mg-modal__actions').forEach(el => el.hidden = true);
    successBox.hidden = false;
    submitBtn.classList.remove('is-loading');
    submitBtn.disabled = false;

    // Reset back to the form when the user reopens the modal next time
    modal.addEventListener('transitionend', function once() {
      modal.removeEventListener('transitionend', once);
      // We reset on close instead — see below.
    }, { once: true });
  });

  // Reset form state every time the modal closes so a re-open is fresh.
  const observer = new MutationObserver(() => {
    if (modal.classList.contains('is-open')) return;
    if (successBox.hidden) return;
    setTimeout(() => {
      form.reset();
      form.querySelectorAll('.mg-modal__row, .mg-modal__field, .mg-modal__legal, .mg-modal__actions, .mg-modal__topic').forEach(el => el.hidden = false);
      successBox.hidden = true;
    }, 300);
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });

  // ---------------------------------------------------------------------------
  // Topic quick-picks — clicking a chip updates the Message textarea
  // placeholder with a tailored starter template. Solves the blank-page
  // paralysis: visitors see a concrete shape of what to write.
  // ---------------------------------------------------------------------------
  const chipGroup = form.querySelector('[data-topic-chips]');
  const messageEl = form.querySelector('textarea[name="message"]');
  // Track what we last filled via chip — switching chips replaces it, but
  // anything the visitor TYPED (or audit-prefilled) stays sacred.
  let lastFilledByChip = null;
  if (chipGroup && messageEl) {
    chipGroup.addEventListener('change', (e) => {
      const input = e.target.closest('input[type="radio"][name="topic"]');
      if (!input) return;
      const chipLabel = input.closest('.mg-modal__topic-chip');
      const template = chipLabel?.dataset.topicPlaceholder;
      if (!template) return;

      const current = messageEl.value;
      // Safe to overwrite when:
      //  - Field is empty, OR
      //  - Field still holds the previous chip's template verbatim, OR
      //  - Field was prefilled by another source that opted-in to chip
      //    replacement (e.g. the CWV audit CTA — see data-replaceable).
      const canOverwrite = !current.trim()
        || current === lastFilledByChip
        || messageEl.dataset.replaceable === 'audit';

      if (canOverwrite) {
        messageEl.value = template;
        lastFilledByChip = template;
        delete messageEl.dataset.replaceable;       // consumed
        // Intentionally do NOT dispatch an `input` event — chip-fill (and
        // audit-prefill that piggybacks on it) is auto-content, not user
        // input. Saving it as a draft would surface a confusing "restore
        // it?" banner on the next open when the user never actually typed
        // anything. The draft-save listener only catches real (isTrusted)
        // input from now on.
        try { messageEl.setSelectionRange(template.length, template.length); } catch (_) {}
        messageEl.focus({ preventScroll: true });
      }
    });

    // User typing invalidates BOTH the "chip-filled" tracker AND any
    // external "replaceable" marker — once they edit even one character
    // the message is theirs and we stop overwriting.
    messageEl.addEventListener('input', (e) => {
      if (!e.isTrusted) return;
      if (messageEl.value !== lastFilledByChip) lastFilledByChip = null;
      delete messageEl.dataset.replaceable;
    });
  }

  // Clean up any prior draft that may have been written by older versions
  // of this script — we no longer persist drafts.
  try { localStorage.removeItem('mg_contact_draft_v1'); } catch (_) {}
})();


// =============================================================================
// Cookie consent banner — Framer-style "advanced" pattern
//
// Behaviour:
//   - First visit: banner appears after a small delay (lets the page settle).
//   - User picks: Accept all / Reject all / Customize → choose per-category.
//   - Choice is saved to localStorage with a 6-month TTL.
//   - On subsequent visits: banner stays hidden if a fresh choice exists.
//   - "Cookie Settings" footer link reopens via [data-cookie-open].
//
// Public API: window.MgroupCookies.{ open, close, get, hasConsent, on }.
// Custom event "mg:cookieconsent" fires on save with the choice payload —
// hook your analytics / pixel loaders to that.
// =============================================================================
(() => {
  const banner = document.querySelector('[data-cookie-banner]');
  if (!banner) return;

  const STORAGE_KEY = 'mg.cookie-consent';
  const TTL_MS = 1000 * 60 * 60 * 24 * 180; // 6 months

  const compactView = banner.querySelector('[data-cookie-view="compact"]');
  const advancedView = banner.querySelector('[data-cookie-view="advanced"]');
  const catInputs = banner.querySelectorAll('input[data-cookie-cat]');

  const safeStorage = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode, etc. */ } },
    remove(k) { try { localStorage.removeItem(k); } catch {} }
  };

  function readConsent() {
    const raw = safeStorage.get(STORAGE_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;
      // Expire after TTL
      if (data.timestamp && (Date.now() - data.timestamp) > TTL_MS) {
        safeStorage.remove(STORAGE_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  function writeConsent(choice) {
    const payload = {
      necessary: true,
      analytics: !!choice.analytics,
      marketing: !!choice.marketing,
      preferences: !!choice.preferences,
      timestamp: Date.now()
    };
    safeStorage.set(STORAGE_KEY, JSON.stringify(payload));
    // Notify the rest of the app (analytics loaders etc.) — composable.
    document.dispatchEvent(new CustomEvent('mg:cookieconsent', { detail: payload }));
    return payload;
  }

  function setView(name) {
    const isAdvanced = name === 'advanced';
    compactView.hidden = isAdvanced;
    advancedView.hidden = !isAdvanced;
    // Move focus to the heading of the visible view for screen readers
    const heading = (isAdvanced ? advancedView : compactView).querySelector('.cookie-banner__title');
    if (heading) heading.setAttribute('tabindex', '-1');
  }

  function reflectChoice(choice) {
    catInputs.forEach(input => {
      const key = input.dataset.cookieCat;
      input.checked = !!(choice && choice[key]);
    });
  }

  function openBanner({ withSavedChoice = null } = {}) {
    banner.hidden = false;
    // Force layout so the transition runs
    void banner.offsetHeight;
    setView('compact');
    if (withSavedChoice) reflectChoice(withSavedChoice);
    // Chat bubble shares the bottom-right corner — hide it while we're open
    document.body.classList.add('mg-cookie-open');
    requestAnimationFrame(() => banner.classList.add('is-open'));
  }

  function closeBanner() {
    banner.classList.remove('is-open');
    // Bubble fades back in while the banner fades out
    document.body.classList.remove('mg-cookie-open');
    // Wait for fade-out before unmounting
    setTimeout(() => { banner.hidden = true; }, 450);
  }

  function getCheckedCats() {
    const out = {};
    catInputs.forEach(i => { out[i.dataset.cookieCat] = i.checked; });
    return out;
  }

  // ---- Action wiring -------------------------------------------------------
  banner.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-cookie-action]');
    if (!trigger) return;
    const action = trigger.dataset.cookieAction;

    if (action === 'accept-all') {
      writeConsent({ analytics: true, marketing: true, preferences: true });
      closeBanner();
      return;
    }
    if (action === 'reject-all') {
      writeConsent({ analytics: false, marketing: false, preferences: false });
      closeBanner();
      return;
    }
    if (action === 'customize') {
      // Reflect any saved partial choice into the toggles when reopening
      const saved = readConsent();
      if (saved) reflectChoice(saved);
      setView('advanced');
      return;
    }
    if (action === 'back') {
      setView('compact');
      return;
    }
    if (action === 'save') {
      writeConsent(getCheckedCats());
      closeBanner();
      return;
    }
  });

  // Keyboard: ESC dismisses the banner only if a choice already exists.
  // Otherwise we keep it on screen — soft GDPR pattern.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (banner.hidden) return;
    if (readConsent()) closeBanner();
  });

  // ---- Footer / external reopen --------------------------------------------
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-cookie-open]');
    if (!trigger) return;
    e.preventDefault();
    openBanner({ withSavedChoice: readConsent() });
  });

  // ---- Initial mount -------------------------------------------------------
  // The banner is NOT shown on load — it mounts on the user's first real
  // interaction (scroll / click / key / touch), so a fresh visit sees the
  // hero clean and the consent UI never competes with LCP.
  const existing = readConsent();
  if (!existing) {
    const events = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
    let armed = true;
    const onFirstInteraction = () => {
      if (!armed) return;
      armed = false;
      // No `capture` — element-level scrolls (marquee, code blocks) pass
      // through window's capture phase and would fire this instantly.
      events.forEach(ev => window.removeEventListener(ev, onFirstInteraction));
      // Small pause so the banner doesn't pop right under the tap/click.
      setTimeout(() => { if (!readConsent()) openBanner(); }, 500);
    };
    events.forEach(ev => window.addEventListener(ev, onFirstInteraction, { passive: true }));
  }

  // ---- Public API ----------------------------------------------------------
  window.MgroupCookies = {
    open: () => openBanner({ withSavedChoice: readConsent() }),
    close: () => closeBanner(),
    get: () => readConsent(),
    hasConsent: (cat) => {
      const c = readConsent();
      return !!(c && c[cat]);
    },
    on: (cb) => document.addEventListener('mg:cookieconsent', (e) => cb(e.detail))
  };
})();



// ---- Logo loop — auto-scroll (transform, sub-pixel smooth) + drag to swipe --
// The section markup (render.php) prints the logo set TWICE, so translating the
// flex track by exactly one copy width loops seamlessly. Auto-scroll runs off a
// float offset via rAF (no scrollLeft rounding = no jitter); pointer events add
// grab-and-swipe left/right on both mouse and touch, with light inertia.
(() => {
  const loops = document.querySelectorAll('.logoloop');
  if (!loops.length) return;
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  loops.forEach((loop) => {
    const track = loop.querySelector('.logoloop__track');
    if (!track) return;
    loop.classList.add('is-draggable'); // CSS drops the @keyframes fallback

    const SPEED = parseFloat(loop.dataset.logoloopSpeed || '55'); // px/s (leftward)
    let half = track.scrollWidth / 2;   // one copy width (logos are duplicated)
    let offset = 0;                     // current translateX (<= 0), float
    let lastT = 0, raf = 0;
    let hover = false, dragging = false;
    let startX = 0, startOffset = 0, lastMoveX = 0, lastMoveT = 0, velocity = 0;

    const measure = () => { const h = track.scrollWidth / 2; if (h) half = h; };
    const wrap = (v) => {
      if (!half) return v;
      v = v % half;            // keep offset within (-half, 0]
      if (v > 0) v -= half;
      return v;
    };
    const apply = () => { track.style.transform = 'translate3d(' + offset + 'px,0,0)'; };

    const tick = (t) => {
      raf = requestAnimationFrame(tick);
      if (!lastT) { lastT = t; return; }
      const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
      if (dragging) return;
      if (velocity) {                                  // inertia after release
        offset = wrap(offset + velocity * dt);
        velocity *= 0.92;
        if (Math.abs(velocity) < 6) velocity = 0;
        apply(); return;
      }
      if (hover || reduceMQ.matches) return;           // auto-scroll
      offset = wrap(offset - SPEED * dt);
      apply();
    };

    const down = (e) => {
      dragging = true; velocity = 0;
      startX = e.clientX; startOffset = offset;
      lastMoveX = e.clientX; lastMoveT = performance.now();
      if (track.setPointerCapture) { try { track.setPointerCapture(e.pointerId); } catch (_) {} }
      loop.classList.add('is-dragging');
    };
    const move = (e) => {
      if (!dragging) return;
      offset = wrap(startOffset + (e.clientX - startX));
      apply();
      const now = performance.now(), d = now - lastMoveT;
      if (d > 0) velocity = (e.clientX - lastMoveX) / (d / 1000);
      lastMoveX = e.clientX; lastMoveT = now;
    };
    const up = (e) => {
      if (!dragging) return;
      dragging = false;
      loop.classList.remove('is-dragging');
      velocity = Math.max(-2600, Math.min(2600, velocity)); // cap fling
    };

    track.addEventListener('pointerdown', down);
    track.addEventListener('pointermove', move);
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
    track.addEventListener('dragstart', (e) => e.preventDefault());
    loop.addEventListener('mouseenter', () => { hover = true; });
    loop.addEventListener('mouseleave', () => { hover = false; });
    window.addEventListener('resize', measure, { passive: true });
    track.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', measure, { once: true });
    });

    requestAnimationFrame(() => { measure(); raf = requestAnimationFrame(tick); });
  });
})();
