/* Layered parallax for wrangle-and-bloom.html
   data-parallax="0.2"        speed: moves 0.2px per px of scroll relative to the
                              viewport centre. Positive drifts behind (slower),
                              negative floats in front (faster).
   data-parallax-range="0.1"  progress based: travels ±10% of its reference box's
                              height between entering and leaving the screen.
                              Used for photos inside a cropped frame.
   Reference box: closest [data-parallax-root], otherwise the parent element, so
   an element's own transform never feeds back into its measurement. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var items = Array.prototype.slice.call(
    document.querySelectorAll('[data-parallax], [data-parallax-range]')
  ).map(function (el) {
    return {
      el: el,
      ref: el.closest('[data-parallax-root]') || el.parentElement,
      speed: parseFloat(el.dataset.parallax || '0'),
      range: parseFloat(el.dataset.parallaxRange || '0'),
      visible: true
    };
  });
  if (!items.length) return;

  var ticking = false;

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var vc = vh / 2;
    var narrow = window.innerWidth < 800 ? 0.5 : 1;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it.visible) continue;
      var r = it.ref.getBoundingClientRect();
      var centre = r.top + r.height / 2;
      var y;
      if (it.range) {
        var p = (vc - centre) / (vh / 2 + r.height / 2);
        p = Math.max(-1, Math.min(1, p));
        y = p * it.range * r.height;
      } else {
        y = (vc - centre) * it.speed * narrow;
      }
      it.el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    }
  }

  function request() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      items.forEach(function (it) {
        if (it.ref === entry.target) it.visible = entry.isIntersecting;
      });
    });
    request();
  }, { rootMargin: '25% 0px' });

  function start() {
    document.documentElement.classList.add('has-parallax');
    var refs = [];
    items.forEach(function (it) {
      if (refs.indexOf(it.ref) === -1) { refs.push(it.ref); io.observe(it.ref); }
    });
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }

  function stop() {
    document.documentElement.classList.remove('has-parallax');
    io.disconnect();
    window.removeEventListener('scroll', request);
    window.removeEventListener('resize', request);
    items.forEach(function (it) { it.el.style.transform = ''; });
  }

  function apply() { reduce.matches ? stop() : start(); }
  if (reduce.addEventListener) reduce.addEventListener('change', apply);
  apply();
})();
