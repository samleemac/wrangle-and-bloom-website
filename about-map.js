/* =============================================
   ABOUT — "Where I've been" map
   Pins sit on a dotted world map (about/world-dots.svg, equirectangular,
   viewBox 0 0 295 129.6). x/y below are in those viewBox units:
   x = longitude + 130, y = (62 - latitude) * 1.2.
   To add a place or a story link, edit PLACES. Stops play in this order.

   "Your pin": visitors can tap the map (or use the Drop your pin button)
   to put themselves on it. The card then tells them how close Sara has
   been and hands the spot over to the contact form as a ?note=.
   ============================================= */
(() => {
  const VB_W = 295, VB_H = 129.6;

  const PLACES = [
    { id: 'curacao', name: 'Curaçao & Aruba', region: 'The Caribbean', tag: 'Born here',
      x: 60.5, y: 59.6,
      text: 'Where it all began. I was born in Curaçao, in the Caribbean.' },
    { id: 'miami', name: 'Miami', region: 'Florida, USA',
      x: 49.8, y: 43.5,
      text: 'Part of the years I spent across the Americas, Europe, Asia and Oceania.' },
    { id: 'guatemala', name: 'Ciudad Vieja', region: 'Guatemala',
      x: 39.3, y: 57.0,
      text: 'Part of the years I spent across the Americas, Europe, Asia and Oceania.' },
    { id: 'texas', name: 'Texas', region: 'USA',
      x: 31.0, y: 37.2,
      text: 'Part of the years I spent across the Americas, Europe, Asia and Oceania.' },
    { id: 'arizona', name: 'Arizona', region: 'USA',
      x: 18.4, y: 33.4,
      text: 'Part of the years I spent across the Americas, Europe, Asia and Oceania.' },
    { id: 'sequim', name: 'Sequim', region: 'Washington State, USA',
      x: 6.9, y: 16.7,
      text: 'Part of the years I spent across the Americas, Europe, Asia and Oceania.' },
    { id: 'lanaken', name: 'Lanaken & Valkenburg', region: 'Belgium & the Netherlands',
      x: 135.7, y: 13.3,
      text: 'Either side of the Belgian–Dutch border. Before Hanoi I worked with horses around the world, from Belgium to the USA to Australia.' },
    { id: 'australia', name: 'Yarramalong & Amby', region: 'Australia',
      x: 279.7, y: 110.3,
      text: 'Before Hanoi I worked with horses around the world, from Belgium to the USA to Australia.' },
    { id: 'hanoi', name: 'Hanoi', region: 'Vietnam', when: '2014', tag: 'Story',
      x: 235.9, y: 49.2, img: 'projects/vietnam-arena.png',
      text: 'At 19 I set up the first riding school in Hanoi: three months, no Vietnamese, and a few horses bought from the circus. It is still going today.',
      link: { href: 'vietnam-riding-school.html', label: 'Read the story' } },
    { id: 'gloucestershire', name: 'Gloucestershire', region: 'United Kingdom', when: '2017 to now',
      x: 127.8, y: 12.2,
      text: 'Yard manager at Barton End Equestrian Centre, with 60+ horses and 20+ staff a day, then Programme Manager and Lecturer at Hartpury University. I also manage horses and staff for competitors up to Olympic standard.',
      link: { href: 'sara-de-jong-cv-2026.pdf', label: 'Download my CV', download: 'Sara MacKinley-de Jong CV 2026.pdf' } },
    { id: 'rome', name: 'Rome', region: 'Italy', when: '8 months', tag: 'Project',
      x: 142.5, y: 24.1, img: 'projects/sports-horse-foal.jpg',
      text: 'Eight months in Italy as project manager, setting up a sports horse breeding business that runs across Italy and the UK: moving horses between countries and keeping every rule and regulation in order.',
      link: { href: 'wrangle-and-bloom.html#italy', label: 'See the project' } },
    { id: 'galicia', name: 'Galicia', region: 'Spain', when: 'Now', tag: 'Home turf',
      x: 122.1, y: 23.1,
      text: 'Home turf, for now. Equine Freedomplicity is based here, with sessions ridden or non-ridden, for first-timers through to elite riders.',
      link: { href: 'equine.html', label: 'Meet Equine Freedomplicity' } },
  ];

  const FINALE = {
    id: 'next', name: 'Where next?', region: 'Your yard, your team, your idea', tag: 'Your turn',
    text: 'Everywhere is a possibility. A business to set up, a team to train, or a crazy idea that needs wrangling: tell me where, and I’ll bring the calm.',
    link: { href: 'contact.html?service=project&note=I%20found%20you%20through%20the%20map%20on%20your%20About%20page.', label: 'Bring me a project', primary: true },
  };

  const root = document.getElementById('aboutMap');
  if (!root) return;
  const map = root.querySelector('.about-map__map');
  const route = root.querySelector('.about-map__route path');
  const card = root.querySelector('.about-map__card');
  const list = root.querySelector('.about-map__list');
  const stampsEl = root.querySelector('[data-stamps]');
  const tourBtn = root.querySelector('.about-map__tour');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const visited = new Set();
  let current = -1;

  // Pins
  const pins = PLACES.map((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'about-map__pin' + (p.link && p.img ? ' about-map__pin--story' : '');
    b.style.left = `${(p.x / VB_W) * 100}%`;
    b.style.top = `${(p.y / VB_H) * 100}%`;
    if (p.x / VB_W < 0.1) b.dataset.align = 'start';
    if (p.x / VB_W > 0.9) b.dataset.align = 'end';
    b.setAttribute('aria-label', `${p.name}, ${p.region}`);
    b.innerHTML = `<span class="about-map__dot" aria-hidden="true"></span><span class="about-map__label" aria-hidden="true">${p.name}</span>`;
    b.addEventListener('click', () => go(i));
    map.appendChild(b);
    return b;
  });

  // Index of places (the main control on phones)
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

  function arc(a, b) {
    // A gentle curve that bows upwards, like a flight path
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    return `M${a.x} ${a.y} Q${mx} ${my - Math.min(40, dist * 0.35)} ${b.x} ${b.y}`;
  }

  function draw(from, to) {
    if (!from || !to) { route.setAttribute('d', ''); return; }
    route.setAttribute('d', arc(from, to));
    route.classList.remove('is-drawing');
    if (!reduce) { void route.getBoundingClientRect(); route.classList.add('is-drawing'); }
  }

  function render(p, i) {
    const total = PLACES.length;
    const stop = i < total ? `Stop ${i + 1} of ${total}` : 'Final stop';
    const meta = [p.region, p.when].filter(Boolean).join(' · ');
    const link = p.link
      ? `<a class="about-map__go${p.link.primary ? ' about-map__go--primary' : ''}" href="${p.link.href}"${p.link.download ? ` download="${p.link.download}"` : ''}>${p.link.label}<span aria-hidden="true"> →</span></a>`
      : '<p class="about-map__soon">Story coming soon</p>';
    const prev = i > 0 ? '<button type="button" class="about-map__step" data-step="-1">← Back</button>' : '';
    const next = i < total
      ? `<button type="button" class="about-map__step about-map__step--next" data-step="1">${i === total - 1 ? 'Where next?' : 'Next stop'} →</button>`
      : '<button type="button" class="about-map__step about-map__step--next" data-drop>Show me where →</button>';
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
    card.querySelector('[data-drop]')?.addEventListener('click', dropFromButton);
    if (!reduce) { card.classList.remove('is-in'); void card.offsetWidth; card.classList.add('is-in'); }
  }

  function go(i, fromStep) {
    const total = PLACES.length;
    i = Math.max(0, Math.min(total, i));
    const from = current >= 0 && current < total ? PLACES[current] : null;
    const p = i < total ? PLACES[i] : FINALE;
    current = i;

    if (i < total) {
      visited.add(p.id);
      draw(from, p);
    } else {
      draw(null, null);
    }
    leaveYou();
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

  /* ---------- Your pin: the visitor puts themselves on the map ---------- */
  const R_KM = 6371;
  const toGeo = (x, y) => ({ lat: 62 - y / 1.2, lon: x - 130 });
  const toXY = (lat, lon) => ({ x: lon + 130, y: (62 - lat) * 1.2 });
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rad = d => d * Math.PI / 180;

  function km(a, b) {
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R_KM * Math.asin(Math.sqrt(h));
  }

  function distance(d) {
    const round = (v, step) => Math.max(step, Math.round(v / step) * step);
    const step = d < 100 ? 5 : d < 1000 ? 10 : 50;
    const fmt = v => round(v, step).toLocaleString('en-GB');
    return `${fmt(d)} km (${fmt(d * 0.6214)} miles)`;
  }

  const coords = g =>
    `${Math.abs(Math.round(g.lat))}°${g.lat >= 0 ? 'N' : 'S'}, ${Math.abs(Math.round(g.lon))}°${g.lon >= 0 ? 'E' : 'W'}`;

  const GEO = PLACES.map(p => toGeo(p.x, p.y));
  const HOME = PLACES.findIndex(p => p.id === 'galicia');

  // Land or sea? Read the dots of the map itself (best effort: without them we just skip the sea line).
  let land = null;
  fetch('about/world-dots.svg').then(r => r.ok ? r.text() : '').then(svg => {
    const pts = [...svg.matchAll(/M([\d.]+) ([\d.]+)h0/g)].map(m => [Number(m[1]), Number(m[2])]);
    if (pts.length) land = pts;
  }).catch(() => {});

  function onLand(x, y) {
    if (!land) return true;
    const reach = 2.4 * 2.4; // about two degrees, so coastal towns still count
    return land.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 <= reach);
  }

  // A first guess for the Drop your pin button, from the visitor's clock. Nothing is sent anywhere.
  const ZONES = {
    'Europe/London': [52.5, -1.5], 'Europe/Dublin': [53.3, -7.5], 'Europe/Madrid': [40.4, -3.7], 'Europe/Lisbon': [39.5, -8.5],
    'Europe/Paris': [47, 2.5], 'Europe/Amsterdam': [52.2, 5.3], 'Europe/Brussels': [50.7, 4.5], 'Europe/Berlin': [51, 10.5],
    'Europe/Rome': [42.5, 12.5], 'Europe/Zurich': [47, 8.2], 'Europe/Vienna': [47.6, 14.5], 'Europe/Stockholm': [59.5, 16],
    'Europe/Oslo': [60, 10.5], 'Europe/Copenhagen': [55.8, 10.5], 'Europe/Helsinki': [61, 25], 'Europe/Warsaw': [52, 19.5],
    'Europe/Prague': [49.8, 15.5], 'Europe/Budapest': [47.2, 19.5], 'Europe/Athens': [38.5, 23], 'Europe/Istanbul': [39.5, 32],
    'America/New_York': [41, -75], 'America/Toronto': [44, -79.5], 'America/Chicago': [39.5, -91], 'America/Denver': [39.5, -105.5],
    'America/Phoenix': [33.8, -112], 'America/Los_Angeles': [37, -120], 'America/Vancouver': [50, -122], 'America/Anchorage': [61, -150],
    'America/Mexico_City': [20, -100], 'America/Guatemala': [15, -90.5], 'America/Bogota': [4.5, -74], 'America/Lima': [-11, -76],
    'America/Curacao': [12.2, -69], 'America/Aruba': [12.5, -70], 'America/Sao_Paulo': [-22, -48], 'America/Santiago': [-34, -71],
    'America/Argentina/Buenos_Aires': [-35, -60], 'America/Buenos_Aires': [-35, -60],
    'Africa/Johannesburg': [-27, 27], 'Africa/Nairobi': [0, 37.5], 'Africa/Lagos': [9, 8], 'Africa/Cairo': [28, 30.5], 'Africa/Casablanca': [32, -6.5],
    'Asia/Dubai': [24, 54.5], 'Asia/Riyadh': [24.5, 45.5], 'Asia/Kolkata': [22, 79], 'Asia/Calcutta': [22, 79], 'Asia/Bangkok': [15, 101],
    'Asia/Ho_Chi_Minh': [16, 107], 'Asia/Saigon': [16, 107], 'Asia/Singapore': [2.5, 103], 'Asia/Jakarta': [-7, 109],
    'Asia/Hong_Kong': [23.5, 113.5], 'Asia/Shanghai': [33, 113], 'Asia/Tokyo': [36, 138.5], 'Asia/Seoul': [36.5, 127.8], 'Asia/Manila': [15, 121],
    'Australia/Sydney': [-33, 149], 'Australia/Melbourne': [-37, 145], 'Australia/Brisbane': [-25, 149], 'Australia/Adelaide': [-32, 137],
    'Australia/Perth': [-30, 118], 'Pacific/Auckland': [-39, 175.5], 'Pacific/Honolulu': [20.5, -157],
  };
  const AREAS = { Europe: [49, 9], Africa: [6, 20], Asia: [32, 95], Australia: [-26, 134], America: [39, -98] };

  function guess() {
    let zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* no guess */ }
    const hit = ZONES[zone] || AREAS[zone.split('/')[0]];
    return hit ? { ...toXY(hit[0], hit[1]), guessed: true } : { ...toXY(49, 9), guessed: false };
  }

  const you = { x: 0, y: 0, placed: false, active: false, guessed: false, name: '' };
  let nearPin = null;

  const youPin = document.createElement('button');
  youPin.type = 'button';
  youPin.className = 'about-map__you';
  youPin.hidden = true;
  youPin.setAttribute('aria-label', 'Your pin. Drag it, or use the arrow keys, to move it.');
  youPin.innerHTML = '<span class="about-map__you-mark" aria-hidden="true"></span><span class="about-map__you-label" aria-hidden="true">You</span>';
  map.appendChild(youPin);

  const hint = document.createElement('p');
  hint.className = 'about-map__hint';
  hint.innerHTML = '<span aria-hidden="true">+</span> Tap the map to drop your own pin';
  map.appendChild(hint);

  function nearest(g) {
    let best = 0, bestKm = Infinity;
    GEO.forEach((pg, n) => { const d = km(g, pg); if (d < bestKm) { bestKm = d; best = n; } });
    return { index: best, km: bestKm };
  }

  function leaveYou() {
    you.active = false;
    root.classList.remove('is-you');
    youPin.classList.remove('is-active');
    nearPin?.classList.remove('is-near');
    nearPin = null;
  }

  // Move the pin and its flight path. The card only updates once the pin has settled.
  function moveYou(x, y, animate) {
    you.x = clamp(x, 2, VB_W - 2);
    you.y = clamp(y, 3, VB_H - 2);
    you.placed = true;
    youPin.hidden = false;
    youPin.style.left = `${(you.x / VB_W) * 100}%`;
    youPin.style.top = `${(you.y / VB_H) * 100}%`;
    youPin.dataset.align = you.x / VB_W > 0.9 ? 'end' : you.x / VB_W < 0.1 ? 'start' : '';

    const near = nearest(toGeo(you.x, you.y));
    if (nearPin !== pins[near.index]) {
      nearPin?.classList.remove('is-near');
      nearPin = pins[near.index];
      nearPin.classList.add('is-near');
    }
    route.setAttribute('d', arc(PLACES[near.index], you));
    route.classList.remove('is-drawing');
    if (animate && !reduce) { void route.getBoundingClientRect(); route.classList.add('is-drawing'); }
    return near;
  }

  function contactHref(g, near) {
    const where = you.name.trim() ? `${you.name.trim()} (around ${coords(g)})` : `around ${coords(g)}`;
    const note = `I dropped my pin on the map on your About page: ${where}, about ${distance(near.km)} from ${PLACES[near.index].name}.`;
    return `contact.html?service=project&note=${encodeURIComponent(note)}`;
  }

  function showYou(x, y, opts = {}) {
    const near = moveYou(x, y, true);
    const g = toGeo(you.x, you.y);
    const place = PLACES[near.index];
    const dist = distance(near.km);
    const dry = onLand(you.x, you.y);
    you.active = true;
    you.guessed = Boolean(opts.guessed);

    pins.forEach(pin => { pin.classList.remove('is-active'); pin.setAttribute('aria-pressed', 'false'); });
    chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
    youPin.classList.add('is-active');
    root.classList.add('is-you', 'has-you');

    let title, text;
    if (!dry) {
      title = 'Off the map?';
      text = `My map shows only sea under this pin, or an island too small for its dots. I was born on one of those, so it doesn’t put me off. The closest stop on my map is ${place.name}, about ${dist} away.`;
    } else if (near.km < 200) {
      title = 'Practically neighbours';
      text = `Your pin is about ${dist} from ${place.name}, one of the stops on my map. Chances are I already know your corner of the world.`;
    } else if (near.km < 1500) {
      title = 'I’ve been close';
      text = `The closest stop on my map is ${place.name}, about ${dist} from your pin. Near enough to feel familiar.`;
    } else {
      title = 'New ground';
      text = `The closest I’ve been is ${place.name}, about ${dist} away. That makes your pin new ground for me, which is exactly how the riding school in Hanoi started.`;
    }
    const base = near.index === HOME ? '' : ` · ${distance(km(g, GEO[HOME]))} from my base in Galicia`;
    const nudge = you.guessed
      ? 'A rough guess from your clock. Drag the pin, or tap the map, to put it right.'
      : 'Drag the pin, or tap the map, to move it.';

    card.innerHTML = `
      <div class="about-map__card-body">
        <p class="about-map__stop">Your pin<span class="about-map__tag">You</span></p>
        <h3 class="about-map__place">${title}</h3>
        <p class="about-map__meta">${coords(g)}${base}</p>
        <p class="about-map__text">${text} Everywhere is a possibility: tell me what needs setting up, training or wrangling here.</p>
        <label class="about-map__name">
          <span>What’s this place called?</span>
          <input type="text" maxlength="60" autocomplete="off" placeholder="Town, yard or country">
        </label>
        <a class="about-map__go about-map__go--primary" href="${contactHref(g, near)}">Bring me here<span aria-hidden="true"> →</span></a>
        <p class="about-map__nudge">${nudge}</p>
        <div class="about-map__steps"><button type="button" class="about-map__step" data-back>← Back to my stops</button></div>
      </div>`;
    card.classList.add('about-map__card--finale');

    const input = card.querySelector('.about-map__name input');
    const cta = card.querySelector('.about-map__go');
    input.value = you.name;
    input.addEventListener('input', () => { you.name = input.value; cta.href = contactHref(g, near); });
    card.querySelector('[data-back]').addEventListener('click', () => go(current >= 0 ? current : 0, true));
    if (!reduce) { card.classList.remove('is-in'); void card.offsetWidth; card.classList.add('is-in'); }
  }

  function fromEvent(e) {
    const r = map.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * VB_W, y: ((e.clientY - r.top) / r.height) * VB_H };
  }

  // Tap anywhere that is not one of Sara's pins
  map.addEventListener('click', e => {
    if (e.target.closest('.about-map__pin, .about-map__you')) return;
    const at = fromEvent(e);
    showYou(at.x, at.y);
  });

  // Drag
  let drag = null;
  youPin.addEventListener('pointerdown', e => {
    drag = { id: e.pointerId, moved: false, dx: fromEvent(e).x - you.x, dy: fromEvent(e).y - you.y };
    youPin.setPointerCapture(e.pointerId);
  });
  youPin.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const at = fromEvent(e);
    if (!drag.moved && Math.hypot(at.x - drag.dx - you.x, at.y - drag.dy - you.y) < 0.6) return;
    drag.moved = true;
    youPin.classList.add('is-dragging');
    moveYou(at.x - drag.dx, at.y - drag.dy, false);
  });
  const drop = e => {
    if (!drag || e.pointerId !== drag.id) return;
    youPin.classList.remove('is-dragging');
    drag = null;
    showYou(you.x, you.y);
  };
  youPin.addEventListener('pointerup', drop);
  youPin.addEventListener('pointercancel', drop);

  // Arrow keys
  youPin.addEventListener('keydown', e => {
    const step = e.shiftKey ? 6 : 1.5;
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!move) return;
    e.preventDefault();
    showYou(you.x + move[0], you.y + move[1]);
  });

  function dropFromButton() {
    if (you.placed) {
      showYou(you.x, you.y, { guessed: you.guessed });
    } else {
      const g = guess();
      showYou(g.x, g.y, { guessed: g.guessed });
    }
    if (matchMedia('(max-width: 900px)').matches) map.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    youPin.focus({ preventScroll: true });
  }

  root.querySelector('.about-map__drop')?.addEventListener('click', dropFromButton);

  root.classList.add('is-ready');
})();
