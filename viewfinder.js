/* =============================================
   VIEWFINDER LANDING — scroll timeline
   progress 0 → 1 across the tall .vf section:
     0.00–0.07  intro copy fades
     0.03–0.45  camera zooms into the eyepiece
     0.43–0.49  hand-off: camera → viewfinder
     0.50–0.62  focus pulls sharp (AF point confirms)
     0.68       shutter fires + flash
     0.72–0.86  frame opens to the full photograph
     0.88–0.96  caption + CTAs arrive
   Pressing the camera's shutter button (or the intro button) plays
   the sequence by scrolling for the visitor; any input hands back control.
   ============================================= */
(() => {
  const section = document.getElementById('viewfinder');
  if (!section) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return; // static, fully revealed layout from CSS

  const stage = document.getElementById('vfStage');
  const camera = document.getElementById('vfCamera');
  const target = document.getElementById('vfTarget');
  const photo = document.getElementById('vfPhoto');
  const shutter = document.getElementById('vfShutter');
  const flash = document.getElementById('vfFlash');
  const count = document.getElementById('vfCount');
  const caption = document.getElementById('vfCaption');
  const afGrid = document.getElementById('vfAfGrid');
  const nav = document.getElementById('nav');
  const release = document.getElementById('vfRelease');

  const SHUTTER_AT = 0.68;
  const FRAMES_LEFT = 42;
  const AUTOPLAY_MS = 7000; // full sequence, top to reveal

  for (let i = 0; i < 55; i++) afGrid.appendChild(document.createElement('span'));

  section.classList.add('vf--scroll');

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (a, b, v) => {
    const t = clamp01((v - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const lerp = (a, b, t) => a + (b - a) * t;

  let geo = null;
  let lastProgress = -1;
  let ticking = false;

  // Work out where the viewfinder window sits, and the camera transform that
  // lands the eyepiece's view exactly on it.
  function measure() {
    camera.style.transform = 'none';

    const vw = stage.clientWidth;
    const vh = stage.clientHeight;
    const s = stage.getBoundingClientRect();
    const c = camera.getBoundingClientRect();
    const t = target.getBoundingClientRect();

    const ww = Math.min(vw * (vw < 640 ? 0.9 : 0.72), (vh - 250) * 1.5);
    const wh = ww / 1.5;
    const wx = (vw - ww) / 2;
    const wy = Math.max(80, (vh - wh) / 2 - 16);

    const tcx = t.left + t.width / 2 - s.left;
    const tcy = t.top + t.height / 2 - s.top;

    geo = {
      vw, vh, ww, wh, wx, wy,
      scaleEnd: ww / t.width,
      dx: wx + ww / 2 - tcx,
      dy: wy + wh / 2 - tcy,
    };

    camera.style.transformOrigin = `${t.left + t.width / 2 - c.left}px ${t.top + t.height / 2 - c.top}px`;
    stage.style.setProperty('--vf-win-x', `${wx}px`);
    stage.style.setProperty('--vf-win-y', `${wy}px`);
    stage.style.setProperty('--vf-win-w', `${ww}px`);
    stage.style.setProperty('--vf-win-h', `${wh}px`);

    // Anchor the "press the shutter" callout to the button's top-centre
    const r = release.getBoundingClientRect();
    stage.style.setProperty('--vf-tip-x', `${r.left + r.width / 2 - s.left}px`);
    stage.style.setProperty('--vf-tip-y', `${r.top + r.height * 0.35 - s.top}px`);
  }

  function progress() {
    const r = section.getBoundingClientRect();
    const run = r.height - stage.clientHeight;
    return run > 0 ? clamp01(-r.top / run) : 1;
  }

  function render(p) {
    const g = geo;
    const st = stage.style;

    // Camera zoom — exponential so the approach feels like a constant dolly
    const z = smooth(0.03, 0.45, p);
    const scale = Math.pow(g.scaleEnd, z);
    camera.style.transform = `translate(${g.dx * z}px, ${g.dy * z}px) scale(${scale})`;
    st.setProperty('--vf-camera', 1 - smooth(0.45, 0.49, p));
    st.setProperty('--vf-eyepiece-shade', lerp(0.6, 0.2, smooth(0.12, 0.42, p)));
    st.setProperty('--vf-eyepiece-glare', 1 - smooth(0.2, 0.38, p));
    st.setProperty('--vf-grain', 1 - smooth(0.12, 0.3, p));
    st.setProperty('--vf-backdrop-scale', 1.08 + 0.35 * z);
    st.setProperty('--vf-backdrop-light', lerp(0.85, 0.35, z));
    st.setProperty('--vf-intro', 1 - smooth(0, 0.07, p));

    // Viewfinder
    st.setProperty('--vf-finder', smooth(0.43, 0.48, p));
    const focus = smooth(0.5, 0.62, p);
    st.setProperty('--vf-focus-blur', `${(1 - focus) * 14}px`);
    st.setProperty('--vf-photo-light', lerp(0.8, 1, focus));
    section.classList.toggle('is-focused', p >= 0.62 && p < 0.72);
    st.setProperty('--vf-hud', 1 - smooth(0.7, 0.76, p));

    // Shutter + flash — fire once each time the threshold is crossed going forward
    if (lastProgress >= 0 && lastProgress < SHUTTER_AT && p >= SHUTTER_AT) {
      [shutter, flash].forEach((el) => {
        el.classList.remove('is-firing');
        void el.offsetWidth; // restart the animation
        el.classList.add('is-firing');
      });
    }
    count.textContent = p >= SHUTTER_AT ? FRAMES_LEFT - 1 : FRAMES_LEFT;

    // Open the frame out to the full photograph
    const open = smooth(0.72, 0.86, p);
    photo.style.left = `${lerp(g.wx, 0, open)}px`;
    photo.style.top = `${lerp(g.wy, 0, open)}px`;
    photo.style.width = `${lerp(g.ww, g.vw, open)}px`;
    photo.style.height = `${lerp(g.wh, g.vh, open)}px`;
    photo.style.clipPath = `inset(0 round ${lerp(6, 0, open)}px)`; // also trims the focus-blur halo

    // Caption + CTAs
    const cap = smooth(0.88, 0.96, p);
    st.setProperty('--vf-caption', cap);
    caption.classList.toggle('is-hidden', cap < 0.02);

    // Keep the nav transparent over the stage, solid once we scroll past it
    nav.classList.toggle('nav--scrolled', section.getBoundingClientRect().bottom <= nav.offsetHeight);

    lastProgress = p;
  }

  function update() {
    ticking = false;
    render(progress());
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  measure();
  render(progress());

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    requestUpdate();
  });

  // ---------- Auto-play ----------
  const endScroll = () =>
    section.getBoundingClientRect().top + window.scrollY + section.offsetHeight - stage.clientHeight;

  // Constant pace with a short ease in and out (trapezoid velocity profile)
  const EASE = 0.1;
  const pace = (t) => {
    const v = 1 / (1 - EASE);
    if (t < EASE) return (v * t * t) / (2 * EASE);
    if (t > 1 - EASE) return 1 - (v * (1 - t) * (1 - t)) / (2 * EASE);
    return v * (t - EASE / 2);
  };

  let autoFrame = null;

  function stopAutoplay() {
    if (autoFrame === null) return;
    cancelAnimationFrame(autoFrame);
    autoFrame = null;
    section.classList.remove('is-autoplaying');
  }

  function startAutoplay() {
    if (autoFrame !== null) return;
    const from = window.scrollY;
    const to = endScroll();
    if (to - from < 2) return;

    const run = section.offsetHeight - stage.clientHeight;
    const duration = Math.max(1200, AUTOPLAY_MS * ((to - from) / run));
    let t0 = null;

    section.classList.add('is-autoplaying', 'is-pressed');
    setTimeout(() => section.classList.remove('is-pressed'), 180);

    const step = (now) => {
      if (t0 === null) t0 = now + 250; // let the button press land first
      const t = clamp01((now - t0) / duration);
      window.scrollTo({ top: from + (to - from) * pace(t), behavior: 'instant' });
      if (t < 1) {
        autoFrame = requestAnimationFrame(step);
      } else {
        autoFrame = null;
        section.classList.remove('is-autoplaying');
      }
    };
    autoFrame = requestAnimationFrame(step);
  }

  document.querySelectorAll('.js-vf-autoplay').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      startAutoplay();
    });
  });

  // Visitor takes over: any deliberate input stops the auto-play
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((type) => {
    window.addEventListener(type, (e) => {
      if (e.target.closest && e.target.closest('.js-vf-autoplay')) return;
      stopAutoplay();
    }, { passive: true });
  });

  // "Skip" jumps straight to the revealed photo
  document.querySelectorAll('.js-vf-skip').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      stopAutoplay();
      window.scrollTo({ top: endScroll(), behavior: 'smooth' });
    });
  });
})();
