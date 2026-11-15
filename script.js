/* ==========================================================
   PRANAVYOM ZERO-GRAM — Welcome screen behaviour
   1. Marks the page as loaded
   2. "Enter mission" fades out and opens the next interface
   3. Keeps the giant title inside the frame on every screen size
   4. Moves the astronaut gently with the mouse (desktop only)
   5. Top-bar links: Mission and Crew open the crew portal, About opens about.html
   ========================================================== */

(function () {
  'use strict';

  const body = document.body;
  const fade = document.getElementById('screenFade');
  const welcome = document.getElementById('welcomeScreen');
  const nextScreen = document.getElementById('nextScreen');
  const backBtn = document.getElementById('backBtn');
  const astronaut = document.getElementById('astronaut');

  /* ---------- 1. Page loaded (the entrance animation itself is in style.css) ---------- */
  window.addEventListener('load', function () {
    requestAnimationFrame(function () { body.classList.remove('is-loading'); });
  });

  /* ---------- 2. Navigation ----------
     One place decides where "Enter mission" goes.
     LATER: when the profiles page exists, change NEXT_PAGE to its
     file name (for example 'profiles.html') and it will open that file. */
  const NEXT_PAGE = 'crew.html'; // Interface 2: crew selection portal

  function fadeThen(action) {
    fade.classList.add('is-active');
    setTimeout(function () {
      action();
      fade.classList.remove('is-active');
    }, 450);
  }

  function goToProfileSelection() {
    if (NEXT_PAGE) {
      fade.classList.add('is-active');
      setTimeout(function () { window.location.href = NEXT_PAGE; }, 450);
      return;
    }
    fadeThen(function () {
      welcome.hidden = true;
      nextScreen.hidden = false;
      backBtn.focus();
    });
  }

  function backToWelcome() {
    fadeThen(function () {
      nextScreen.hidden = true;
      welcome.hidden = false;
      fitTitle();
      document.getElementById('enterMissionBtn').focus();
    });
  }

  // Every element marked data-enter-mission (main button + top-bar button)
  document.querySelectorAll('[data-enter-mission]').forEach(function (btn) {
    btn.addEventListener('click', goToProfileSelection);
  });
  backBtn.addEventListener('click', backToWelcome);

  // Keyboard: Escape returns from the placeholder
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !nextScreen.hidden) backToWelcome();
  });

  // Make the function available to future interfaces
  window.PranavyomNav = { goToProfileSelection: goToProfileSelection, backToWelcome: backToWelcome };

  /* ---------- 3. Keep the giant words inside the frame ----------
     If the title font cannot load (no internet), a wider fallback font is
     used. This shrinks each word just enough so it never gets cut off. */
  function fitTitle() {
    const hero = document.getElementById('welcomeScreen');
    if (hero.hidden || hero.clientWidth === 0) return;         // screen not visible right now
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    document.querySelectorAll('.hero__word').forEach(function (word) {
      word.style.fontSize = '';                                  // back to the CSS size
      const room = hero.clientWidth * (mobile ? 0.9 : 0.93);
      const used = word.scrollWidth;
      if (used > room) {
        const size = parseFloat(getComputedStyle(word).fontSize);
        word.style.fontSize = Math.floor(size * room / used) + 'px';
      }
    });
  }
  fitTitle();
  window.addEventListener('resize', fitTitle);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);

  /* ---------- 4. Gentle parallax on the astronaut ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!reduceMotion && finePointer && astronaut) {
    window.addEventListener('mousemove', function (e) {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;  // at most 7px each way
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      astronaut.style.translate = x + 'px ' + y + 'px';
    });
  }

  /* ---------- 5. Top-bar links (Mission, Crew, About) ---------- */
  const LINKS = { Mission: 'crew.html', Crew: 'crew.html', About: 'about.html' };
  document.querySelectorAll('.topbar__item').forEach(function (item) {
    const page = LINKS[item.textContent.trim()];
    if (!page) return;
    item.setAttribute('role', 'link');
    item.setAttribute('tabindex', '0');
    item.style.cursor = 'pointer';
    const open = function () { fade.classList.add('is-active'); setTimeout(function () { window.location.href = page; }, 300); };
    item.addEventListener('click', open);
    item.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
})();