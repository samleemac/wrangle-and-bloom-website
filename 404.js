/* =============================================
   404 — hoofprints and the lucky horseshoe
   - A trail of prints walks across the paddock, on a loop (CSS).
   - Prints follow the pointer, turned the way it moves.
   - The horseshoe spins for luck, throws sparks and a fresh pun.
   Runs again on each visit when page transitions (site.js) bring it in.
   ============================================= */
(() => {
  const root = document.getElementById('hoof');
  if (!root) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PRINT = '<svg viewBox="0 0 40 46"><use href="#hoofPrint"></use></svg>';
  const cleanups = [];

  function makePrint(x, y, angle, unit) {
    const el = document.createElement('span');
    el.className = 'hoof-print';
    el.innerHTML = PRINT;
    el.style.left = x + unit;
    el.style.top = y + (unit === '%' ? '%' : 'px');
    el.style.setProperty('--turn', `rotate(${angle}deg)`);
    el.style.transform = `rotate(${angle}deg)`;
    return el;
  }

  /* ---------- Trail across the paddock ---------- */
  const trail = document.getElementById('hoofTrail');
  if (trail) {
    const steps = window.innerWidth < 600 ? 12 : 22;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const x = -4 + t * 108;                         // % across, off both edges
      const wave = Math.sin(t * Math.PI * 1.6);        // gentle meander
      const y = 64 + wave * 10 + (i % 2 ? 7 : -7);     // left / right hoof
      const slope = Math.cos(t * Math.PI * 1.6) * 10;  // turn with the meander
      const print = makePrint(x, y, 90 - slope, '%');
      // Walking gait: prints land in pairs
      print.style.animationDelay = `${(Math.floor(i / 2) * 0.62 + (i % 2) * 0.16).toFixed(2)}s`;
      trail.appendChild(print);
    }
  }

  /* ---------- Prints that follow the pointer ---------- */
  const layer = document.getElementById('hoofCursor');
  if (layer && !calm) {
    let lastX = null, lastY = null, travelled = 0, side = 1;
    const STRIDE = 46;
    const onMove = (e) => {
      if (lastX === null) { lastX = e.clientX; lastY = e.clientY; return; }
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      travelled += Math.hypot(dx, dy);
      if (travelled < STRIDE) return;
      travelled = 0;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      const len = Math.hypot(dx, dy) || 1;
      side = -side;
      const ox = (-dy / len) * 9 * side, oy = (dx / len) * 9 * side;
      const print = makePrint(e.clientX + ox, e.clientY + oy, angle, 'px');
      print.addEventListener('animationend', () => print.remove(), { once: true });
      layer.appendChild(print);
      while (layer.childElementCount > 40) layer.firstElementChild.remove();
      lastX = e.clientX; lastY = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    cleanups.push(() => window.removeEventListener('pointermove', onMove));
  }

  /* ---------- Lucky horseshoe ---------- */
  const shoe = document.getElementById('hoofShoe');
  const luck = document.getElementById('hoofLuck');
  const lines = [
    'Hold your horses, it still isn’t here.',
    'Mane-ly bad luck so far.',
    'Stable condition: still lost.',
    'Neigh luck this time. Try the stable?',
    'Straight from the horse’s mouth: it’s gone.',
    'You’ve spun it {n} times. That’s a lot of luck.',
  ];
  let spins = 0;
  if (shoe) {
    shoe.addEventListener('animationend', (e) => {
      if (e.animationName === 'hoofSwingIn') shoe.classList.add('is-settled');
      if (e.animationName === 'hoofSpin') shoe.classList.remove('is-spinning');
    });
    if (calm) shoe.classList.add('is-settled');

    shoe.addEventListener('click', () => {
      spins += 1;
      shoe.classList.add('is-settled');
      if (!calm) {
        shoe.classList.remove('is-spinning');
        void shoe.offsetWidth;
        shoe.classList.add('is-spinning');
        burst();
      }
      const line = lines[Math.min(spins, lines.length) - 1].replace('{n}', spins);
      luck.classList.add('is-changing');
      setTimeout(() => { luck.textContent = line; luck.classList.remove('is-changing'); }, calm ? 0 : 200);
    });
  }

  function burst() {
    if (!shoe.animate) return;
    for (let i = 0; i < 14; i++) {
      const spark = document.createElement('span');
      spark.className = 'hoof__spark';
      shoe.parentElement.appendChild(spark);
      const box = shoe.getBoundingClientRect(), host = shoe.parentElement.getBoundingClientRect();
      spark.style.left = (box.left - host.left + box.width / 2) + 'px';
      spark.style.top = (box.top - host.top + box.height * 0.55) + 'px';
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
      const d = 70 + Math.random() * 70;
      spark.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(0.2)`, opacity: 0 }
      ], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
        .finished.then(() => spark.remove(), () => spark.remove());
    }
  }

  if (window.WB) WB.onLeave(() => cleanups.forEach((fn) => fn()));
})();
