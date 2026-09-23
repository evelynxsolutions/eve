// ============================================================
// EVELYNX — main.js (shared across all pages; everything guarded)
// ============================================================
(function () {
  'use strict';
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header scrolled state
  var hdr = document.getElementById('hdr');
  if (hdr) addEventListener('scroll', function () {
    hdr.classList.toggle('scrolled', scrollY > 30);
  }, { passive: true });

  // Full-screen mega menu
  var ham = document.getElementById('ham');
  var mega = document.getElementById('mega');
  function closeMega() {
    document.body.classList.remove('menu-open');
    if (ham) ham.setAttribute('aria-expanded', 'false');
    if (mega) mega.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  if (ham && mega) {
    ham.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      ham.setAttribute('aria-expanded', open);
      mega.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mega.querySelectorAll('.mega-row').forEach(function (a) {
      a.addEventListener('click', closeMega);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMega();
    });
  }

  // Scroll reveal
  var obs = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.rv').forEach(function (el) {
    reduceMotion ? el.classList.add('in') : obs.observe(el);
  });

  // Counters (supports optional suffix via data-s, e.g. "+")
  var cObs = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target,
          t = parseFloat(el.getAttribute('data-t')),
          s = el.getAttribute('data-s') || '';
      if (isNaN(t)) return;
      if (reduceMotion) { el.textContent = t + s; cObs.unobserve(el); return; }
      var cur = 0, step = t / 50;
      (function go() {
        cur = Math.min(cur + step, t);
        el.textContent = Math.ceil(cur) + s;
        if (cur < t) requestAnimationFrame(go);
      })();
      cObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.counter').forEach(function (el) { cObs.observe(el); });

  // Marquee seamless loop
  var track = document.getElementById('marqueeTrack');
  if (track) track.innerHTML += track.innerHTML;

  // Work page tag filters
  var wtags = document.querySelectorAll('.wtag');
  if (wtags.length) {
    var wcCards = document.querySelectorAll('.wcard'),
        wcEmpty = document.getElementById('workEmpty');
    wtags.forEach(function (t) {
      t.addEventListener('click', function () {
        wtags.forEach(function (x) { x.classList.remove('on'); });
        t.classList.add('on');
        var v = t.getAttribute('data-cat'), shown = 0;
        wcCards.forEach(function (c) {
          var show = v === 'all' || c.getAttribute('data-cat') === v;
          c.classList.toggle('hidden', !show);
          if (show) shown++;
        });
        if (wcEmpty) wcEmpty.classList.toggle('show', shown === 0);
      });
    });
  }

  // Fanned piles — scroll-driven on desktop (data-scroll), click/auto otherwise
  document.querySelectorAll('.pile').forEach(function (pile) {
    var cards = Array.prototype.slice.call(pile.children);
    var n = cards.length, active = 0, timer = null;
    var prev = document.getElementById(pile.dataset.prev),
        next = document.getElementById(pile.dataset.next),
        count = document.getElementById(pile.dataset.count);
    var section = pile.closest('section');
    var scrollMode = pile.hasAttribute('data-scroll') &&
                     matchMedia('(min-width: 900px)').matches &&
                     !reduceMotion;

    function pad(x) { return (x < 10 ? '0' : '') + x; }
    function render() {
      cards.forEach(function (c, i) {
        var pos = (i - active + n) % n;
        c.classList.remove('is-front', 'is-b1', 'is-b2', 'is-b3', 'is-back');
        if (pos === 0) c.classList.add('is-front');
        else if (pos === 1) c.classList.add('is-b1');
        else if (pos === 2) c.classList.add('is-b2');
        else if (pos === 3) c.classList.add('is-b3');
        else c.classList.add('is-back');
        c.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
      });
      if (count) count.textContent = pad(active + 1) + ' / ' + pad(n);
    }
    function setActive(i) { active = (i % n + n) % n; render(); }

    if (scrollMode) {
      // --- scroll is the driver (home "What we do") ---
      var ticking = false;
      function fromScroll() {
        var r = section.getBoundingClientRect();
        var total = r.height - innerHeight;
        var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
        setActive(Math.min(n - 1, Math.floor(p * n)));
      }
      addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(function () { fromScroll(); ticking = false; }); }
      }, { passive: true });
      fromScroll();

      // arrows / click scroll the page to the target card's progress point
      function scrollToCard(i) {
        i = Math.max(0, Math.min(n - 1, i));
        var r = section.getBoundingClientRect();
        var total = r.height - innerHeight;
        var y = window.scrollY + r.top + total * (i / Math.max(1, n - 1));
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      if (next) next.addEventListener('click', function () { scrollToCard(active + 1); });
      if (prev) prev.addEventListener('click', function () { scrollToCard(active - 1); });
      pile.addEventListener('click', function () { scrollToCard(active + 1); });

    } else {
      // --- click / auto-play mode (services page, mobile, reduced motion) ---
      function go(d) { setActive(active + d); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }
      function play() {
        if (reduceMotion) return;
        stop();
        timer = setInterval(function () { go(1); }, 4500);
      }
      if (next) next.addEventListener('click', function () { go(1); play(); });
      if (prev) prev.addEventListener('click', function () { go(-1); play(); });
      pile.addEventListener('click', function () { go(1); play(); });
      pile.addEventListener('mouseenter', stop);
      pile.addEventListener('mouseleave', play);
      play();
    }
    render();
  });

  // Case-study carousel (home)
  var csRail = document.getElementById('csRail');
  if (csRail) {
    var csPrev = document.getElementById('csPrev'), csNext = document.getElementById('csNext');
    var csStep = function () { return csRail.querySelector('.cscard').offsetWidth + 24; };
    var csUpdate = function () {
      csPrev.disabled = csRail.scrollLeft < 10;
      csNext.disabled = csRail.scrollLeft > csRail.scrollWidth - csRail.clientWidth - 10;
    };
    csPrev.addEventListener('click', function () { csRail.scrollBy({ left: -csStep(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    csNext.addEventListener('click', function () { csRail.scrollBy({ left: csStep(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    csRail.addEventListener('scroll', csUpdate, { passive: true });
    csUpdate();
  }

  // Contact form: consent gates the button; validate on submit
  var form = document.getElementById('contactForm');
  if (form) {
    var consent = document.getElementById('consent'),
        sendBtn = document.getElementById('sendBtn'),
        ok = document.getElementById('formOk');
    if (consent && sendBtn) consent.addEventListener('change', function () { sendBtn.disabled = !consent.checked; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
        f.style.borderColor = bad ? 'var(--red)' : '';
        f.style.boxShadow = bad ? '0 0 0 4px var(--red-faint)' : '';
        if (bad) valid = false;
      });
      if (!valid) return;
      // Static demo — wire to Formspree/backend for real delivery
      form.style.display = 'none';
      if (ok) ok.classList.add('show');
    });
  }

  // Custom cursor — desktop only
  if (matchMedia('(pointer: fine)').matches && !reduceMotion) {
    document.documentElement.classList.add('has-cursor');
    var dot = document.createElement('div'), ring = document.createElement('div');
    dot.className = 'cursor-dot'; ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    var mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    }, { passive: true });
    (function follow() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(follow);
    })();
    // updated to current card components (pile/pcard/vcard/wcard/cscard)
    var HOV = 'a, button, .pilecard, .pcard, .vcard, .wcard, .cscard, input, textarea, select, label';
    document.addEventListener('mouseover', function (e) { ring.classList.toggle('is-active', !!e.target.closest(HOV)); });
    document.addEventListener('mouseout', function (e) { if (e.target.closest(HOV)) ring.classList.remove('is-active'); });
    document.addEventListener('mouseleave', function () { dot.style.opacity = ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { dot.style.opacity = ring.style.opacity = '1'; });
  }
})();