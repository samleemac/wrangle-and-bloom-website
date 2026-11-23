/* =============================================
   WRANGLE & BLOOM — smooth scroll and scroll choreography
   Lenis:  smooth, eased scrolling with a mouse or trackpad (not on touch
           screens, which scroll natively); also drives the parallax layers
           (parallax.js) on every frame so they glide with the page.
   GSAP:   - headlines rise line by line out of a mask (SplitText)
           - the at-a-glance numbers count up when they come into view
           - the testimonial lights up word by word as you scroll past it
   Nothing here runs for visitors who ask for reduced motion: the page then
   shows everything as plain text, exactly as written in the HTML.
   Runs again on each visit when page transitions (site.js) bring the page in.
   ============================================= */
(function () {
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText || !window.Lenis) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var SplitText = window.SplitText;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  var page = document.querySelector('main.wb');
  if (!page) return;

  var splits = [];
  var tweens = [];
  // Arriving through a page transition: wait for the curtain to lift first
  var arrive = window.WB && WB.arriving ? 0.55 : 0.15;

  /* ---------- Lenis smooth scroll (mouse and trackpad only) ----------
     Touch scrolling is already smooth and Lenis leaves it native anyway,
     so phones skip it and save the work it does on every frame. */
  var lenis = null;
  function raf(time) { lenis.raf(time * 1000); }
  if (!window.matchMedia('(pointer: coarse)').matches) {
    lenis = new window.Lenis({
      lerp: 0.09,
      anchors: { offset: -72 },
      autoRaf: false
    });
    lenis.on('scroll', function () {
      ScrollTrigger.update();
      if (window.WBParallax) window.WBParallax.update();
    });
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Headlines: lines rise out of a mask ---------- */
  var heads = page.querySelectorAll('.wb-hero__title, .home-heading, .wb-feature__title');
  heads.forEach(function (el) {
    var isHero = el.classList.contains('wb-hero__title');
    // The line animation replaces the plain fade-in on these headings
    el.classList.remove('reveal', 'reveal--d1', 'reveal--d2', 'reveal--d3');
    // Hidden until split, so the whole heading never flashes up first
    el.style.visibility = 'hidden';
    splits.push(SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: function (self) {
        el.style.visibility = '';
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: isHero ? 1.25 : 1.05,
          ease: 'expo.out',
          stagger: 0.12,
          delay: isHero ? arrive : 0,
          scrollTrigger: isHero ? null : { trigger: el, start: 'top 88%', once: true }
        });
      }
    }));
  });

  /* ---------- Numbers count up ---------- */
  page.querySelectorAll('.wb-fact__num').forEach(function (el, i) {
    var match = el.textContent.trim().match(/^(\d+)(.*)$/);
    if (!match) return;
    var target = parseInt(match[1], 10);
    var suffix = match[2];
    var counter = { value: 0 };
    // Screen readers get the real figure; the counting digits are for the eye only
    var shown = document.createElement('span');
    shown.setAttribute('aria-hidden', 'true');
    shown.textContent = '0' + suffix;
    var real = document.createElement('span');
    real.className = 'wb-sr';
    real.textContent = match[0];
    el.textContent = '';
    el.append(shown, real);
    tweens.push(gsap.to(counter, {
      value: target,
      duration: 1.6,
      delay: i * 0.12,
      ease: 'power3.out',
      onUpdate: function () { shown.textContent = Math.round(counter.value) + suffix; },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    }));
  });

  /* ---------- Testimonial lights up word by word ---------- */
  var quote = page.querySelector('.wb-scene blockquote p');
  if (quote) {
    var words = SplitText.create(quote, { type: 'words' });
    splits.push(words);
    tweens.push(gsap.fromTo(words.words, { opacity: 0.18 }, {
      opacity: 1,
      ease: 'none',
      stagger: 0.08,
      scrollTrigger: {
        trigger: '.wb-scene',
        start: 'top 65%',
        end: 'center 40%',
        scrub: 0.6
      }
    }));
  }

  // Images change the page height as they load; measure again once they have
  window.addEventListener('load', ScrollTrigger.refresh, { once: true });

  /* ---------- Let go when the page leaves (page transitions) ---------- */
  if (window.WB) WB.onLeave(function () {
    heads.forEach(function (el) { el.style.visibility = ''; });
    window.removeEventListener('load', ScrollTrigger.refresh);
    tweens.forEach(function (t) { t.kill(); });
    ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    splits.forEach(function (s) { s.revert(); });
    if (lenis) {
      gsap.ticker.remove(raf);
      lenis.destroy();
    }
  });
})();
