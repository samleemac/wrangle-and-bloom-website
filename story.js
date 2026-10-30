/* =============================================
   STORY PAGES — reading time and progress line
   Reading time comes from the words in .story__column; the green line
   under the nav tracks progress through the writing, not the footer.
   ============================================= */
(() => {
  // A story can have several .story-body blocks (split by the big quote and gallery)
  const bodies = [...document.querySelectorAll('.story-body')];
  if (!bodies.length) return;

  const read = document.querySelector('[data-read-time]');
  if (read) {
    const words = bodies.reduce((n, b) => n + b.innerText.trim().split(/\s+/).length, 0);
    read.textContent = ` · ${Math.max(1, Math.round(words / 220))} min read`;
  }

  const bar = document.querySelector('.story-progress span');
  if (!bar) return;
  const first = bodies[0];
  const last = bodies[bodies.length - 1];
  let ticking = false;
  function update() {
    ticking = false;
    const top = first.getBoundingClientRect().top;
    const height = last.getBoundingClientRect().bottom - top;
    const total = height - innerHeight * 0.6;
    const done = Math.min(1, Math.max(0, (innerHeight * 0.4 - top) / Math.max(1, total)));
    bar.style.transform = `scaleX(${done})`;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

/* =============================================
   STORY CLOSE — fire triage
   The visitor picks what is burning. The reply changes, the embers die
   down, and the contact button carries their choice into the form as a
   pre-filled note. Each story supplies its own choices in the HTML
   (data-reply, data-note); this code is shared.
   ============================================= */
(() => {
  document.querySelectorAll('[data-fire]').forEach(panel => {
    const ask = panel.querySelector('.fire__ask');
    const group = panel.querySelector('.fire__choices');
    const reply = panel.querySelector('.fire__reply');
    const btn = panel.querySelector('[data-fire-btn]');
    const choices = [...panel.querySelectorAll('.fire__choice')];
    if (!group || !reply || !btn || !choices.length) return;

    // Choices only appear when the script can run them
    ask.hidden = false;
    group.hidden = false;

    const baseHref = btn.getAttribute('href');
    const baseLabel = btn.textContent;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setReply(text) {
      if (reduce) { reply.innerHTML = text; return; }
      reply.classList.add('is-swapping');
      setTimeout(() => { reply.innerHTML = text; reply.classList.remove('is-swapping'); }, 220);
    }

    function pick(choice) {
      const already = choice.getAttribute('aria-pressed') === 'true';
      choices.forEach(c => c.setAttribute('aria-pressed', String(c === choice && !already)));

      if (already) {
        // Pressing the same choice again resets the panel
        panel.classList.remove('is-calm');
        setReply(reply.dataset.default);
        btn.setAttribute('href', baseHref);
        btn.textContent = baseLabel;
        return;
      }

      panel.classList.add('is-calm');
      setReply(choice.dataset.reply);
      const url = new URL(baseHref, location.href);
      url.searchParams.set('note', choice.dataset.note);
      btn.setAttribute('href', url.pathname.split('/').pop() + url.search);
      btn.textContent = btn.dataset.fireLabel || baseLabel;
    }

    choices.forEach(c => c.addEventListener('click', () => pick(c)));
  });
})();
