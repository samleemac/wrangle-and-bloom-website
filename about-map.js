/* =============================================
   ABOUT — "Where I've been" globe
   A dotted globe drawn on a canvas (land dots come from about/globe-dots.js).
   Picking a stop turns the globe to face it, flies a line there from the
   last stop, and keeps every leg flown so far as a trail. Visitors can also
   drag the globe round, or zoom with the + and − buttons.
   Without the script (or the dots) the flat map image and the plain list
   of places in about.html are shown instead.
   To add a place or a story link, edit PLACES (lat/lon in degrees).
   Stops play in this order.
   ============================================= */
(() => {
  const PLACES = [
    { id: 'curacao', name: 'Curaçao & Aruba', region: 'The Caribbean', tag: 'Born here',
      lat: 12.3, lon: -69.5,
      text: 'Where it all began. I was born in Curaçao, in the Caribbean.' },
    { id: 'miami', name: 'Miami', region: 'Florida, USA',
      lat: 25.8, lon: -80.2,
      text: 'Part of the years I spent across the Americas, Europe, Asia and Oceania.' },
    { id: 'guatemala', name: 'Ciudad Vieja', region: 'Guatemala',
      lat: 14.5, lon: -90.7,
      text: 'Part of the years I spent across the Americas, Europe, Asia and Oceania.' },
    { id: 'texas', name: 'Texas', region: 'USA',
      lat: 31.0, lon: -99.0,
      text: 'Part of the years I spent across the Americas, Europe, Asia and Oceania.' },
    { id: 'arizona', name: 'Arizona', region: 'USA',
      lat: 34.2, lon: -111.6,
      text: 'Part of the years I spent across the Americas, Europe, Asia and Oceania.' },
    { id: 'sequim', name: 'Sequim', region: 'Washington State, USA',
      lat: 48.1, lon: -123.1,
      text: 'Part of the years I spent across the Americas, Europe, Asia and Oceania.' },
    { id: 'lanaken', name: 'Lanaken & Valkenburg', region: 'Belgium & the Netherlands',
      lat: 50.9, lon: 5.7,
      text: 'Either side of the Belgian–Dutch border. Before Hanoi I worked with horses around the world, from Belgium to the USA to Australia.' },
    { id: 'australia', name: 'Yarramalong & Amby', region: 'Australia',
      lat: -29.9, lon: 149.7,
      text: 'Before Hanoi I worked with horses around the world, from Belgium to the USA to Australia.' },
    { id: 'hanoi', name: 'Hanoi', region: 'Vietnam', when: '2014', tag: 'Story',
      lat: 21.0, lon: 105.9, img: 'projects/vietnam-arena.png',
      text: 'At 19 I set up the first riding school in Hanoi: three months, no Vietnamese, and a few horses bought from the circus. It is still going today.',
      link: { href: 'vietnam-riding-school.html', label: 'Read the story' } },
    { id: 'gloucestershire', name: 'Gloucestershire', region: 'United Kingdom', when: '2017 to now',
      lat: 51.8, lon: -2.2,
      text: 'Yard manager at Barton End Equestrian Centre, with 60+ horses and 20+ staff a day, then Programme Manager and Lecturer at Hartpury University. I also manage horses and staff for competitors up to Olympic standard.',
      link: { href: 'sara-de-jong-cv-2026.pdf', label: 'Download my CV', download: 'Sara MacKinley-de Jong CV 2026.pdf' } },
    { id: 'rome', name: 'Rome', region: 'Italy', when: '8 months', tag: 'Project',
      lat: 41.9, lon: 12.5, img: 'projects/sports-horse-foal.jpg',
      text: 'Eight months in Italy as project manager, setting up a sports horse breeding business that runs across Italy and the UK: moving horses between countries and keeping every rule and regulation in order.',
      link: { href: 'wrangle-and-bloom.html#italy', label: 'See the project' } },
    { id: 'galicia', name: 'Galicia', region: 'Spain', when: 'Now', tag: 'Home turf',
      lat: 42.8, lon: -7.9,
      text: 'Home turf, for now. Equine Freedomplicity is based here, with sessions ridden or non-ridden, for first-timers through to elite riders.',
      link: { href: 'equine.html', label: 'Meet Equine Freedomplicity' } },
  ];

  // The last card brings the trip back to what is on offer today
  const FINALE = {
    id: 'next', name: 'You’ve caught up with me', region: 'Galicia, Spain', tag: 'Now',
    text: 'That’s the trip so far. These days you’ll find me in Galicia with the horses, running Equine Freedomplicity sessions for first-timers through to elite riders. New clients can start with a half-price taster.',
    link: { href: 'contact.html?service=taster', label: 'Book a half-price taster', primary: true },
  };

  const root = document.getElementById('aboutMap');
  const DOTS = window.ABOUT_GLOBE_DOTS;
  if (!root || !DOTS) return;
  const map = root.querySelector('.about-map__map');
  const canvas = root.querySelector('.about-map__globe');
  const ctx = canvas.getContext('2d');
  const card = root.querySelector('.about-map__card');
  const list = root.querySelector('.about-map__list');
  const stampsEl = root.querySelector('[data-stamps]');
  const kmEl = root.querySelector('[data-km]');
  const tourBtn = root.querySelector('.about-map__tour');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sphere maths ---------- */
  const RAD = Math.PI / 180;
  const vec = (lat, lon) => {
    const c = Math.cos(lat * RAD);
    return [c * Math.sin(lon * RAD), Math.sin(lat * RAD), c * Math.cos(lon * RAD)];
  };
  const angle = (a, b) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));

  const dots = new Float32Array((DOTS.length / 2) * 3);
  for (let i = 0; i < DOTS.length / 2; i++) dots.set(vec(DOTS[i * 2] / 10, DOTS[i * 2 + 1] / 10), i * 3);
  PLACES.forEach(p => { p.v = vec(p.lat, p.lon); });

  const START = { lon: -42, lat: 22, zoom: 1 };
  const view = { ...START };       // where the globe is facing now
  let size = 0, dpr = 1;           // canvas box in CSS pixels
  let tween = null;                // the turn in progress
  let spinning = !reduce;          // slow idle turn until someone touches it
  let onScreen = false;
  let dragging = null;
  let frame = 0, lastTime = 0;

  const legs = [];                 // every leg flown so far: { a, b, km }
  let legT = 1;                    // how much of the newest leg is drawn
  let flown = 0, shownKm = 0;

  // Turn a point on the unit sphere into canvas pixels for the current view
  let sinL = 0, cosL = 1, sinP = 0, cosP = 1, R = 0, C = 0;
  function aim() {
    sinL = Math.sin(view.lon * RAD); cosL = Math.cos(view.lon * RAD);
    sinP = Math.sin(view.lat * RAD); cosP = Math.cos(view.lat * RAD);
    R = (size / 2) * view.zoom; C = size / 2;
  }
  function project(v, lift = 1) {
    const x = (v[0] * cosL - v[2] * sinL) * lift;
    const z1 = (v[0] * sinL + v[2] * cosL) * lift;
    const y = v[1] * lift * cosP - z1 * sinP;
    const z = v[1] * lift * sinP + z1 * cosP;
    return [C + R * x, C - R * y, z, x * x + y * y];
  }

  function drawLeg(leg, upTo, color, width) {
    const total = angle(leg.a, leg.b);
    if (total < 0.001) return;
    const steps = Math.max(12, Math.ceil(total / RAD / 2));
    const height = 0.05 + 0.22 * (total / Math.PI);
    const sin = Math.sin(total);
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i <= steps * upTo; i++) {
      const t = i / steps;
      const wa = Math.sin((1 - t) * total) / sin, wb = Math.sin(t * total) / sin;
      const p = project([leg.a[0] * wa + leg.b[0] * wb, leg.a[1] * wa + leg.b[1] * wb, leg.a[2] * wa + leg.b[2] * wb],
        1 + height * Math.sin(Math.PI * t));
      // Seen when on the near side, or when it rises above the far horizon
      if (p[2] > 0 || p[3] > 1) { pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; } else pen = false;
    }
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke();
  }

  function draw() {
    aim();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath(); ctx.arc(C, C, size / 2 - 0.5, 0, Math.PI * 2); ctx.clip();

    const shade = ctx.createRadialGradient(C - R * 0.3, C - R * 0.35, R * 0.1, C, C, R);
    shade.addColorStop(0, '#fdfbf7'); shade.addColorStop(0.75, '#f1eadf'); shade.addColorStop(1, '#e2d8c8');
    ctx.fillStyle = shade;
    ctx.beginPath(); ctx.arc(C, C, R, 0, Math.PI * 2); ctx.fill();

    // Land
    const dot = Math.max(0.9, R * 0.0105);
    ctx.fillStyle = '#b9a88c';
    ctx.beginPath();
    for (let i = 0; i < dots.length; i += 3) {
      const x = dots[i] * cosL - dots[i + 2] * sinL;
      const z1 = dots[i] * sinL + dots[i + 2] * cosL;
      const z = dots[i + 1] * sinP + z1 * cosP;
      if (z <= 0.02) continue;
      const px = C + R * x, py = C - R * (dots[i + 1] * cosP - z1 * sinP);
      if (px < -4 || py < -4 || px > size + 4 || py > size + 4) continue;
      const r = dot * (0.45 + 0.55 * z);
      ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, Math.PI * 2);
    }
    ctx.fill();

    // The trail so far, then the leg being flown
    legs.forEach((leg, n) => {
      const newest = n === legs.length - 1;
      drawLeg(leg, newest ? legT : 1, newest ? '#2a2521' : 'rgba(51, 79, 64, 0.55)', newest ? 1.9 : 1.2);
    });
    ctx.restore();

    ctx.strokeStyle = 'rgba(42, 37, 33, 0.16)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(C, C, size / 2 - 0.5, 0, Math.PI * 2); ctx.stroke();

    // Pins ride on top as real buttons
    const edge = (size / 2 - 6) ** 2;
    PLACES.forEach((p, n) => {
      const s = project(p.v);
      const seen = s[2] > 0.12 && (s[0] - C) ** 2 + (s[1] - C) ** 2 < edge;
      pins[n].classList.toggle('is-behind', !seen);
      if (seen) { pins[n].style.left = `${s[0]}px`; pins[n].style.top = `${s[1]}px`; }
    });
  }

  function tick(now) {
    frame = 0;
    const dt = Math.min(64, now - (lastTime || now));
    lastTime = now;
    let busy = false;

    if (tween) {
      const t = Math.min(1, (now - tween.start) / tween.time);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      view.lon = tween.from.lon + tween.dLon * e;
      view.lat = tween.from.lat + (tween.to.lat - tween.from.lat) * e;
      // Pull back a little mid-flight on long hops
      view.zoom = tween.from.zoom + (tween.to.zoom - tween.from.zoom) * e - tween.dip * Math.sin(Math.PI * e);
      if (tween.leg) legT = e;
      if (t >= 1) tween = null; else busy = true;
    } else if (spinning && onScreen && !dragging) {
      view.lon += dt * 0.006;
      busy = true;
    }
    if (shownKm !== flown) {
      shownKm += (flown - shownKm) * Math.min(1, dt / 160);
      if (Math.abs(flown - shownKm) < 6) shownKm = flown;
      kmEl.textContent = `${(Math.round(shownKm / 10) * 10).toLocaleString('en-GB')} km`;
      busy = true;
    }
    draw();
    if (busy || dragging) request();
    else lastTime = 0;
  }
  const request = () => { if (!frame) frame = requestAnimationFrame(tick); };

  function turnTo(to, withLeg) {
    spinning = false;
    let dLon = ((to.lon - view.lon) % 360 + 540) % 360 - 180;
    const far = Math.hypot(dLon * Math.cos(to.lat * RAD), to.lat - view.lat);
    if (reduce) {
      Object.assign(view, { lon: view.lon + dLon, lat: to.lat, zoom: to.zoom });
      legT = 1; tween = null;
    } else {
      tween = {
        start: performance.now(), time: 650 + Math.min(1100, far * 11),
        from: { ...view }, to, dLon, leg: withLeg,
        dip: far > 40 ? Math.min(0.45, Math.min(view.zoom, to.zoom) - 1) : 0,
      };
      if (withLeg) legT = 0;
    }
    request();
  }

  function fit() {
    const box = map.clientWidth;
    if (!box || box === size) return;
    size = box; dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = canvas.height = Math.round(size * dpr);
    request();
  }

  const visited = new Set();
  let current = -1;

  // Pins
  const pins = PLACES.map((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'about-map__pin is-behind' + (p.link && p.img ? ' about-map__pin--story' : '');
    b.setAttribute('aria-label', `${p.name}, ${p.region}`);
    b.innerHTML = `<span class="about-map__dot" aria-hidden="true"></span><span class="about-map__label" aria-hidden="true">${p.name}</span>`;
    b.addEventListener('click', () => go(i));
    map.appendChild(b);
    return b;
  });

  // Index of places (also the way to reach stops on the far side)
  list.innerHTML = '';
  const chips = PLACES.map((p, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'about-map__chip';
    b.innerHTML = `<span aria-hidden="true">${String(i + 1).padStart(2, '0')}</span> ${p.name}`;
    b.addEventListener('click', () => go(i));
    li.appendChild(b);
    list.appendChild(li);
    return b;
  });

  function render(p, i) {
    const total = PLACES.length;
    const stop = i < total ? `Stop ${i + 1} of ${total}` : 'End of the trip';
    const trip = flown ? `${(Math.round(flown / 10) * 10).toLocaleString('en-GB')} km flown together` : '';
    const meta = (i < total ? [p.region, p.when] : [p.region, trip]).filter(Boolean).join(' · ');
    const link = p.link
      ? `<a class="about-map__go${p.link.primary ? ' about-map__go--primary' : ''}" href="${p.link.href}"${p.link.download ? ` download="${p.link.download}"` : ''}>${p.link.label}<span aria-hidden="true"> →</span></a>`
      : '<p class="about-map__soon">Story coming soon</p>';
    const prev = i > 0 ? '<button type="button" class="about-map__step" data-step="-1">← Back</button>' : '';
    const next = i < total ? `<button type="button" class="about-map__step about-map__step--next" data-step="1">${i === total - 1 ? 'End of the trip' : 'Next stop'} →</button>` : '';
    card.innerHTML = `
      ${p.img ? `<img class="about-map__photo" src="${p.img}" alt="">` : ''}
      <div class="about-map__card-body">
        <p class="about-map__stop">${stop}${p.tag ? `<span class="about-map__tag">${p.tag}</span>` : ''}</p>
        <h3 class="about-map__place">${p.name}</h3>
        <p class="about-map__meta">${meta}</p>
        <p class="about-map__text">${p.text}</p>
        ${link}
        <div class="about-map__steps">${prev}${next}</div>
      </div>`;
    card.classList.toggle('about-map__card--finale', i >= total);
    card.querySelectorAll('[data-step]').forEach(btn =>
      btn.addEventListener('click', () => go(current + Number(btn.dataset.step), true)));
    if (!reduce) { card.classList.remove('is-in'); void card.offsetWidth; card.classList.add('is-in'); }
  }

  function go(i, fromStep) {
    const total = PLACES.length;
    i = Math.max(0, Math.min(total, i));
    const from = current >= 0 && current < total ? PLACES[current] : null;
    const p = i < total ? PLACES[i] : FINALE;
    const moved = i !== current;
    current = i;
    root.classList.add('is-touched');

    if (i < total) {
      visited.add(p.id);
      const leg = from && moved ? { a: from.v, b: p.v, km: angle(from.v, p.v) * 6371 } : null;
      if (leg) { legs.push(leg); flown += leg.km; }
      turnTo({ lon: p.lon, lat: Math.max(-50, Math.min(50, p.lat - 4)), zoom: Math.max(view.zoom, 1.55) }, Boolean(leg));
    } else {
      // Step back and take in the whole trail
      turnTo({ lon: -20, lat: 24, zoom: 1 }, false);
    }
    pins.forEach((pin, n) => {
      pin.classList.toggle('is-active', n === i);
      pin.classList.toggle('is-visited', visited.has(PLACES[n].id));
      pin.setAttribute('aria-pressed', String(n === i));
    });
    chips.forEach((c, n) => {
      c.setAttribute('aria-pressed', String(n === i));
      c.classList.toggle('is-visited', visited.has(PLACES[n].id));
    });
    stampsEl.textContent = `${visited.size} of ${total}`;
    root.classList.toggle('is-complete', visited.size === total);
    render(p, i);
    if (fromStep) card.querySelector('.about-map__step--next, .about-map__go')?.focus({ preventScroll: true });
  }

  tourBtn.addEventListener('click', () => {
    go(0, true);
    if (matchMedia('(max-width: 900px)').matches) map.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- Spin it by hand ---------- */
  map.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    dragging = { id: e.pointerId, x: e.clientX, y: e.clientY };
    map.setPointerCapture(e.pointerId);
    map.classList.add('is-dragging');
    root.classList.add('is-touched');
    spinning = false; tween = null; legT = 1;
    request();
  });
  map.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== dragging.id) return;
    const perPx = 1 / (R * RAD);
    view.lon -= (e.clientX - dragging.x) * perPx;
    view.lat = Math.max(-60, Math.min(70, view.lat + (e.clientY - dragging.y) * perPx));
    dragging.x = e.clientX; dragging.y = e.clientY;
  });
  const release = e => {
    if (!dragging || e.pointerId !== dragging.id) return;
    dragging = null;
    map.classList.remove('is-dragging');
  };
  map.addEventListener('pointerup', release);
  map.addEventListener('pointercancel', release);

  // Zoom buttons and a nudge to have a go
  const tools = document.createElement('div');
  tools.className = 'about-map__zoom';
  tools.innerHTML = '<button type="button" data-zoom="1.4" aria-label="Zoom in">+</button><button type="button" data-zoom="0.714" aria-label="Zoom out">−</button>';
  tools.addEventListener('click', e => {
    const by = Number(e.target.dataset.zoom);
    if (!by) return;
    root.classList.add('is-touched');
    turnTo({ lon: view.lon, lat: view.lat, zoom: Math.max(1, Math.min(2.8, view.zoom * by)) }, false);
  });
  map.appendChild(tools);

  const hint = document.createElement('p');
  hint.className = 'about-map__hint';
  hint.textContent = 'Drag to spin';
  map.appendChild(hint);

  new ResizeObserver(fit).observe(map);
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; if (onScreen) request(); }).observe(map);

  root.classList.add('is-ready');
  fit();
})();
