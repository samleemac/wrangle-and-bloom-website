/* =============================================
   SITE — shared page setup and page transitions (swup)

   Loaded in the <head> of every editorial page (not photography.html).
   - Nav menu, scrolled nav and .reveal fade-ins, set up again on every page.
   - swup swaps the #swup container between pages instead of a full reload,
     behind a green arch curtain that rises and lifts away.
   - Page scripts inside #swup run again after each swap. Library scripts
     marked data-once only ever load once.
   - Scripts that start loops or window listeners register a clean-up with
     WB.onLeave(fn); it runs just before the page is swapped out.
   - photography.html (the camera viewfinder), downloads, new-tab links and
     non-page files always load normally.
   ============================================= */
(function () {
  var leaving = [];
  window.WB = {
    onLeave: function (fn) { leaving.push(fn); },
    leave: function () {
      var fns = leaving;
      leaving = [];
      fns.forEach(function (fn) {
        try { fn(); } catch (err) { console.error(err); }
      });
    }
  };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Shared page setup ---------- */
  function setUpPage() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('navMenu');

    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        var open = menu.classList.toggle('nav__right--open');
        toggle.classList.toggle('nav__toggle--active', open);
        toggle.setAttribute('aria-expanded', open);
      });
      menu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          menu.classList.remove('nav__right--open');
          toggle.classList.remove('nav__toggle--active');
          toggle.setAttribute('aria-expanded', false);
        });
      });
    }

    if (nav) {
      var onScroll = function () { nav.classList.toggle('nav--scrolled', window.scrollY > 20); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      WB.onLeave(function () { window.removeEventListener('scroll', onScroll); });
    }

    var reveals = document.querySelectorAll('.reveal');
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(function (el) { revealObserver.observe(el); });
    WB.onLeave(function () { revealObserver.disconnect(); });
  }

  /* ---------- Curtain: a green arch that covers the swap ---------- */
  var curtain;
  var EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

  function makeCurtain() {
    curtain = document.createElement('div');
    curtain.className = 'wb-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    curtain.innerHTML = '<span class="wb-curtain__mark">&amp;</span>';
    document.body.appendChild(curtain);
  }

  function play(keyframes, duration) {
    if (reduce.matches || !curtain.animate) return Promise.resolve();
    var anim = curtain.animate(keyframes, { duration: duration, easing: EASE, fill: 'forwards' });
    return anim.finished.catch(function () {});
  }

  // Off screen below -> arch rises until its flat body fills the screen
  function cover() {
    curtain.classList.add('is-active');
    return play([
      { transform: 'translateY(100%)' },
      { transform: 'translateY(calc(-1 * var(--arch)))' }
    ], 620);
  }

  // Lifts on up and away, revealing the new page from the bottom
  function uncover() {
    return play([
      { transform: 'translateY(calc(-1 * var(--arch)))' },
      { transform: 'translateY(-100%)' }
    ], 720).then(function () {
      curtain.classList.remove('is-active');
      curtain.getAnimations().forEach(function (a) { a.cancel(); });
    });
  }

  /* ---------- Head: page stylesheets and description ---------- */
  function syncHead(nextDoc) {
    var head = document.head;
    var current = {};
    head.querySelectorAll('link[rel="stylesheet"]').forEach(function (link) {
      current[link.href] = link;
    });
    var wanted = Array.prototype.slice.call(nextDoc.head.querySelectorAll('link[rel="stylesheet"]'));
    var keep = {};
    var loads = [];

    // Same order as the next page, so the cascade matches a full load
    wanted.forEach(function (next) {
      var href = new URL(next.getAttribute('href'), location.href).href;
      keep[href] = true;
      var link = current[href];
      if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        loads.push(new Promise(function (done) { link.onload = link.onerror = done; }));
      }
      head.appendChild(link);
    });

    var nextDesc = nextDoc.head.querySelector('meta[name="description"]');
    var desc = head.querySelector('meta[name="description"]');
    if (nextDesc && desc) desc.setAttribute('content', nextDesc.getAttribute('content'));

    return Promise.all(loads).then(function () {
      Object.keys(current).forEach(function (href) {
        if (!keep[href]) current[href].remove();
      });
    });
  }

  /* ---------- Scripts inside #swup run again after each swap ---------- */
  var loadedOnce = {};

  function runScripts(root) {
    var scripts = Array.prototype.slice.call(root.querySelectorAll('script'));
    return scripts.reduce(function (chain, old) {
      return chain.then(function () {
        var type = old.getAttribute('type');
        if (type && type !== 'text/javascript' && type !== 'module') return;
        var once = old.hasAttribute('data-once');
        if (old.src && once && loadedOnce[old.src]) return;

        var fresh = document.createElement('script');
        Array.prototype.forEach.call(old.attributes, function (attr) {
          if (attr.name !== 'defer' && attr.name !== 'async') fresh.setAttribute(attr.name, attr.value);
        });
        if (!old.src) {
          fresh.textContent = old.textContent;
          old.replaceWith(fresh);
          return;
        }
        return new Promise(function (done) {
          fresh.async = false;
          fresh.onload = fresh.onerror = done;
          old.replaceWith(fresh);
        }).then(function () {
          if (once) loadedOnce[fresh.src] = true;
        });
      });
    }, Promise.resolve());
  }

  /* ---------- Which links get a transition ---------- */
  function ignoreVisit(url, ctx) {
    var el = ctx && ctx.el;
    if (el && (el.closest('[data-no-swup]') || el.hasAttribute('download') ||
        (el.target && el.target !== '_self'))) return true;
    var next = new URL(url, location.href);
    // Jumps within the same page scroll natively (or smoothly where Lenis runs)
    if (next.pathname === location.pathname && next.search === location.search && next.hash) return true;
    // The photography viewfinder keeps its own page, and files (PDFs, images) open as they are
    if (/photography\.html$/.test(next.pathname)) return true;
    if (!/(\.html|\/)$/.test(next.pathname)) return true;
    return false;
  }

  /* ---------- Start ---------- */
  function start() {
    document.querySelectorAll('script[src][data-once]').forEach(function (s) { loadedOnce[s.src] = true; });
    setUpPage();
    if (!window.Swup || !document.getElementById('swup')) return;

    makeCurtain();
    var swup = new window.Swup({
      containers: ['#swup'],
      animationSelector: false,
      ignoreVisit: ignoreVisit
    });

    swup.hooks.replace('animation:out:await', cover);
    swup.hooks.replace('animation:in:await', uncover);

    swup.hooks.before('content:replace', function (visit) {
      WB.leave();
      return syncHead(visit.to.document);
    });

    swup.hooks.on('content:replace', function () {
      WB.arriving = true; // page scripts can wait for the curtain before animating in
      setUpPage();
      return runScripts(document.getElementById('swup'));
    });

    // Move focus to the new page for keyboard and screen reader users
    swup.hooks.on('page:view', function () {
      WB.arriving = false;
      var main = document.querySelector('#swup main') || document.getElementById('swup');
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
