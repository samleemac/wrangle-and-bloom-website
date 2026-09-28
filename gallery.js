/* =============================================
   PORTFOLIO GALLERY — pinned index / photo / description
   On larger screens the section pins while you scroll: photos move up
   the middle one step at a time, the active one sits in red brackets,
   the index (left) highlights it and its description (right) decodes
   in. Phones, reduced motion and no-JS get the plain stacked list.
   ============================================= */
(() => {
  const gl = document.getElementById('portfolio');
  if (!gl) return;

  const stage = document.getElementById('glStage');
  const sticky = stage.querySelector('.gl__sticky');
  const track = document.getElementById('glTrack');
  const index = document.getElementById('glIndex');
  const panel = document.getElementById('glPanel');
  const items = [...track.querySelectorAll('.gl-item')];
  const count = items.length;

  const wide = window.matchMedia('(min-width: 900px) and (min-height: 560px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const STEP_VH = 70; // scroll distance per photo
  const GLYPHS = '!<>-_\\/[]{}=+*^?#%&$@';

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (a, b, v) => {
    const t = clamp01((v - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  // ---------- Build the index and the description panel ----------
  const data = items.map((item) => ({
    title: item.querySelector('.gl-item__title').textContent.trim(),
    meta: item.querySelector('.gl-item__meta').textContent.trim(),
    text: item.querySelector('.gl-item__text').textContent.trim(),
    links: [...item.querySelectorAll('.gl-item__links a')],
  }));

  const buttons = data.map((d, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '<span></span><span></span>';
    btn.children[0].textContent = d.title;
    btn.children[1].textContent = d.meta === 'Custom' ? '' : d.meta;
    btn.addEventListener('click', () => scrollToItem(i));
    li.appendChild(btn);
    index.appendChild(li);
    return btn;
  });

  const panelText = document.createElement('p');
  panelText.className = 'gl__panel-text';
  panelText.setAttribute('aria-hidden', 'true'); // visual only; the live text is below
  const panelLive = document.createElement('p');
  panelLive.className = 'gl__sr';
  const panelLinks = document.createElement('p');
  panelLinks.className = 'gl__panel-links';
  panel.append(panelText, panelLive, panelLinks);
  panel.removeAttribute('aria-live');
  panelLive.setAttribute('aria-live', 'polite');

  // ---------- Text decode effect ----------
  let scrambleFrame = null;

  function decode(text) {
    cancelAnimationFrame(scrambleFrame);
    const duration = Math.min(700, 250 + text.length * 5);
    let t0 = null;
    const done = document.createTextNode('');
    const noise = document.createElement('span');
    noise.className = 'gl__scramble';
    panelText.replaceChildren(done, noise);

    const frame = (now) => {
      if (t0 === null) t0 = now;
      const t = clamp01((now - t0) / duration);
      const shown = Math.floor(text.length * t);
      done.data = text.slice(0, shown);
      let rest = '';
      for (let i = shown; i < text.length; i++) {
        rest += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      noise.textContent = rest;
      if (t < 1) scrambleFrame = requestAnimationFrame(frame);
    };
    scrambleFrame = requestAnimationFrame(frame);
  }

  // ---------- Active item ----------
  let active = -1;

  function setActive(i) {
    if (i === active) return;
    active = i;
    buttons.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));

    const d = data[i];
    decode(d.text);
    panelLive.textContent = `${d.title}. ${d.text}`;

    // Panel links forward to the item's own link, so existing handlers (e.g. contact modal) still fire
    panelLinks.replaceChildren(...d.links.map((orig) => {
      const a = document.createElement('a');
      a.href = orig.getAttribute('href');
      a.textContent = orig.textContent;
      if (orig.classList.contains('js-contact-trigger')) {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          orig.click();
        });
      }
      return a;
    }));
  }

  // ---------- Scroll mapping ----------
  let enabled = false;
  let ticking = false;

  function run() {
    return stage.offsetHeight - window.innerHeight;
  }

  function progress() {
    const r = stage.getBoundingClientRect();
    const total = run();
    return total > 0 ? clamp01(-r.top / total) : 0;
  }

  function scrollToItem(i) {
    const top = stage.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (run() * i) / (count - 1) + 1, behavior: 'smooth' });
  }

  function render() {
    ticking = false;
    if (!enabled) return;
    const p = progress();
    const raw = p * (count - 1);
    const step = Math.min(count - 1, Math.floor(raw));
    // Hold on each photo, then glide to the next
    const pos = Math.min(count - 1, step + smooth(0.3, 0.85, raw - step));

    sticky.style.setProperty('--gl-pos', pos.toFixed(4));
    sticky.style.setProperty('--gl-progress', p.toFixed(4));
    items.forEach((item, k) => {
      item.querySelector('.gl-item__frame').style.setProperty('--gl-fade', (Math.min(1, Math.abs(k - pos)) * 0.8).toFixed(3));
    });
    setActive(Math.round(pos));
  }

  function requestRender() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  function setMode() {
    enabled = wide.matches && !reduceMotion.matches;
    gl.classList.toggle('gl--sticky', enabled);
    stage.style.height = enabled ? `calc(100vh + ${(count - 1) * STEP_VH}vh)` : '';
    if (enabled) {
      active = -1;
      render();
    }
  }

  setMode();
  wide.addEventListener('change', setMode);
  reduceMotion.addEventListener('change', setMode);
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender);
})();
