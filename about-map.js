/* =============================================
   ABOUT — "Where I've been" map
   Pins sit on a dotted world map (about/world-dots.svg, equirectangular,
   viewBox 0 0 295 129.6). x/y below are in those viewBox units:
   x = longitude + 130, y = (62 - latitude) * 1.2.
   To add a place or a story link, edit PLACES. Stops play in this order.
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
    const next = i < total ? `<button type="button" class="about-map__step about-map__step--next" data-step="1">${i === total - 1 ? 'Where next?' : 'Next stop'} →</button>` : '';
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
    current = i;

    if (i < total) {
      visited.add(p.id);
      draw(from, p);
    } else {
      draw(null, null);
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

  root.classList.add('is-ready');
})();
