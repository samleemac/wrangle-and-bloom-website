/* =============================================
   STORY PAGES — reading time and progress line
   Reading time comes from the words in .story__column; the green line
   under the nav tracks progress through the writing, not the footer.
   ============================================= */
(() => {
  const column = document.querySelector('.story__column');
  if (!column) return;

  const read = document.querySelector('[data-read-time]');
  if (read) {
    const words = column.innerText.trim().split(/\s+/).length;
    read.textContent = ` · ${Math.max(1, Math.round(words / 220))} min read`;
  }

  const bar = document.querySelector('.story-progress span');
  if (!bar) return;
  let ticking = false;
  function update() {
    ticking = false;
    const rect = column.getBoundingClientRect();
    const total = rect.height - innerHeight * 0.6;
    const done = Math.min(1, Math.max(0, (innerHeight * 0.4 - rect.top) / Math.max(1, total)));
    bar.style.transform = `scaleX(${done})`;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();
