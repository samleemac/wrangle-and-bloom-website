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
   - Phones and tablets (touch, or narrow screens) skip swup: swapping a page
     in JavaScript stalls slower phones mid-animation. They load pages
     normally and the browser's own view transition (styles.css) fades them.
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
  // Keep in step with the @view-transition media query in styles.css
  var handheld = window.matchMedia('(pointer: coarse), (max-width: 820px)');

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

  // The curtain's own styles. They live here, not in home.css, so nothing
  // that happens to the page's stylesheets mid-swap can unstyle the curtain.
  var CURTAIN_CSS =
    '.wb-curtain{--arch:38vw;position:fixed;z-index:10000;top:0;left:-12vw;width:124vw;' +
    'height:calc(100vh + var(--arch));height:calc(100lvh + var(--arch));background:#334f40;' +
    'border-radius:50% 50% 0 0/var(--arch) var(--arch) 0 0;transform:translateY(100%);' +
    'visibility:hidden;pointer-events:none;will-change:transform;contain:strict}' +
    '.wb-curtain.is-active{visibility:visible;pointer-events:auto}' +
    '.wb-curtain__mark{position:absolute;left:50%;top:calc(var(--arch) + 50vh);' +
    'top:calc(var(--arch) + 50svh);transform:translate(-50%,-50%);' +
    'font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;' +
    'font-size:clamp(4rem,9vw,7rem);line-height:1;color:#f4efe7;opacity:.9}' +
    '@media (max-width:800px){.wb-curtain{--arch:60vw}}';

  function makeCurtain() {
    var style = document.createElement('style');
    style.id = 'wb-curtain-style';
    style.textContent = CURTAIN_CSS;
    document.head.appendChild(style);
    curtain = document.createElement('div');
    curtain.className = 'wb-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    curtain.innerHTML = '<span class="wb-curtain__mark">&amp;</span>';
    document.body.appendChild(curtain);
  }

  // The curtain always moves on from wherever it is, so a second click
  // mid-transition carries on smoothly instead of snapping back to the start.
  var state = 'idle';   // idle | covering | covered | uncovering
  var moving = null;

  function moveTo(target, duration) {
    var from = curtain.classList.contains('is-active')
      ? getComputedStyle(curtain).transform
      : 'translateY(100%)';
    curtain.getAnimations().forEach(function (a) { a.cancel(); });
    curtain.classList.add('is-active');
    if (reduce.matches || !curtain.animate) {
      curtain.style.transform = target;
      return Promise.resolve();
    }
    curtain.style.transform = from === 'none' ? '' : from;
    var anim = curtain.animate([{ transform: from === 'none' ? 'translateY(100%)' : from }, { transform: target }],
      { duration: duration, easing: EASE, fill: 'forwards' });
    return anim.finished.then(function () { curtain.style.transform = target; }, function () {});
  }

  // Off screen below -> arch rises until its flat body fills the screen
  function cover() {
    if (state === 'covered') return Promise.resolve();
    if (state === 'covering') return moving;
    state = 'covering';
    moving = moveTo('translateY(calc(-1 * var(--arch)))', 620).then(function () {
      if (state === 'covering') state = 'covered';
    });
    return moving;
  }

  // Lifts on up and away, revealing the new page from the bottom
  function uncover() {
    state = 'uncovering';
    moving = moveTo('translateY(-100%)', 720).then(function () {
      if (state !== 'uncovering') return; // a new visit took over mid-lift
      state = 'idle';
      curtain.getAnimations().forEach(function (a) { a.cancel(); });
      curtain.style.transform = '';
      curtain.classList.remove('is-active');
    });
    return moving;
  }

  /* ---------- Head: page stylesheets and description ----------
     Stylesheets that both pages share are never moved or re-added: a moved
     <link> is dropped and fetched again (Vercel makes the browser re-check
     it), which unstyles the page for a few frames. New ones go in at the
     same place as on the next page; old ones go once the new ones load. */
  function syncHead(nextDoc) {
    var head = document.head;
    var current = {};
    head.querySelectorAll('link[rel="stylesheet"]').forEach(function (link) {
      current[link.href] = link;
    });
    var wanted = Array.prototype.slice.call(nextDoc.head.querySelectorAll('link[rel="stylesheet"]'))
      .map(function (link) { return new URL(link.getAttribute('href'), location.href).href; });
    var keep = {};
    var loads = [];

    wanted.forEach(function (href, i) {
      keep[href] = true;
      if (current[href]) return;
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      loads.push(new Promise(function (done) { link.onload = link.onerror = done; }));
      // Before the next stylesheet in the new page's order that is already here,
      // otherwise straight after the last stylesheet currently in the head
      var before = null;
      for (var k = i + 1; k < wanted.length && !before; k++) before = current[wanted[k]] || null;
      if (before) {
        head.insertBefore(link, before);
      } else {
        var sheets = head.querySelectorAll('link[rel="stylesheet"]');
        var last = sheets[sheets.length - 1];
        head.insertBefore(link, last ? last.nextSibling : null);
      }
      current[href] = link;
    });

    // Keep the description and canonical address in step with the page shown
    [['meta[name="description"]', 'content'], ['link[rel="canonical"]', 'href']].forEach(function (pair) {
      var next = nextDoc.head.querySelector(pair[0]);
      var here = head.querySelector(pair[0]);
      if (next && here) here.setAttribute(pair[1], next.getAttribute(pair[1]));
    });

    return Promise.all(loads).then(function () {
      Object.keys(current).forEach(function (href) {
        if (!keep[href]) current[href].remove();
      });
    });
  }

  /* ---------- Hold the curtain until the new page is ready to show ----------
     Fonts and the first images on screen, capped so a slow image
     never keeps the curtain down for long. */
  function pageReady() {
    var waits = [];
    if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
    var fold = window.innerHeight * 1.2;
    document.querySelectorAll('#swup img').forEach(function (img) {
      if (img.loading === 'lazy' || img.getBoundingClientRect().top > fold) return;
      if (img.decode) waits.push(img.decode().catch(function () {}));
    });
    var cap = new Promise(function (done) { setTimeout(done, 700); });
    return Promise.race([Promise.all(waits), cap]);
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
    if (handheld.matches || !window.Swup || !document.getElementById('swup')) return;

    makeCurtain();
    var swup = new window.Swup({
      containers: ['#swup'],
      animationSelector: false,
      ignoreVisit: ignoreVisit
    });

    swup.hooks.replace('animation:out:await', cover);
    swup.hooks.replace('animation:in:await', function () { return pageReady().then(uncover); });

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
