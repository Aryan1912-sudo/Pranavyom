/* ==========================================================
   PRANAVYOM ZERO-GRAM — Interface 3: Astronaut Flight Deck
   1. Finds which astronaut was clicked (from ?crew=CREW-xx)
   2. Shows that astronaut's identity
   3. Runs the six daily tests
   4. Compares results with that astronaut's own (fictional) baseline
   5. Saves the check-in to that astronaut's record and "transmits" it
   ========================================================== */

(function () {
  'use strict';

  /* ---------- 1. Crew list (same IDs and names as crew.js) ---------- */
  const CREW = [
    { id: 'CREW-01', name: 'Arjun Mehta',         designation: 'Mission Commander' },
    { id: 'CREW-02', name: 'Elena Vasquez',       designation: 'Spacecraft Pilot' },
    { id: 'CREW-03', name: 'Priya Nair',          designation: 'Flight Engineer' },
    { id: 'CREW-04', name: 'Dr. Kwame Mensah',    designation: 'Medical Officer' },
    { id: 'CREW-05', name: 'Sofia Lindqvist',     designation: 'Mission Scientist' },
    { id: 'CREW-06', name: 'Hiroshi Tanaka',      designation: 'Research Specialist' },
    { id: 'CREW-07', name: 'Amara Okafor',        designation: 'Life Support Engineer' },
    { id: 'CREW-08', name: 'Lucas Moreau',        designation: 'Robotics Specialist' },
    { id: 'CREW-09', name: 'Zara Haddad',         designation: 'Navigation Officer' },
    { id: 'CREW-10', name: 'Daniel Kim',          designation: 'Communications Specialist' },
    { id: 'CREW-11', name: 'Inês Carvalho',       designation: 'Biologist' },
    { id: 'CREW-12', name: 'Rohan Iyer',          designation: 'Systems Engineer' },
    { id: 'CREW-13', name: 'Dr. Grace Whitfield', designation: 'Space Medicine Researcher' },
    { id: 'CREW-14', name: 'Mateo Rossi',         designation: 'Geologist' },
    { id: 'CREW-15', name: 'Naledi Dlamini',      designation: 'Environmental Systems Specialist' },
    { id: 'CREW-16', name: 'Samuel Brooks',       designation: 'Mission Operations Specialist' }
  ];
  const MISSION_DAY = 34;
  const $ = id => document.getElementById(id);
  const fmt = (x, dp) => Number(x).toFixed(dp);

  /* Which astronaut? ?crew=CREW-05 in the address, else the last one selected */
  function currentCrewId() {
    const fromUrl = new URLSearchParams(location.search).get('crew');
    let remembered = null;
    try { remembered = sessionStorage.getItem('pranavyom.selectedCrewId'); } catch (e) { /* ignore */ }
    const id = [fromUrl, remembered, 'CREW-01'].find(x => x && CREW.some(c => c.id === x));
    try { sessionStorage.setItem('pranavyom.selectedCrewId', id); } catch (e) { /* ignore */ }
    return id;
  }
  const crew = CREW.find(c => c.id === currentCrewId());
  const crewNo = parseInt(crew.id.slice(5), 10);   // 1 … 16

  /* Each astronaut's fictional pre-flight baseline (mean and spread) */
  const BASE = {
    rt:      { mu: 235 + (crewNo * 7) % 35, sd: 22 },        // reaction time, ms
    span:    { mu: 6 + (crewNo % 2),        sd: 0.8 },       // memory span, tiles
    contrast:{ mu: 5,                       sd: 0.6 },       // lowest readable row (1–5)
    tremor:  { mu: 2.2 + (crewNo % 3) * 0.3, sd: 0.7 }       // hold steadiness, px
  };

  /* ---------- 2. Identity ---------- */
  function backupPortrait(c) {
    const initials = c.name.replace(/^Dr\.\s*/, '').split(' ').map(w => w[0]).join('').slice(0, 2);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#151515"/>' +
      '<circle cx="100" cy="88" r="58" fill="#323230"/><rect x="56" y="62" width="88" height="52" rx="25" fill="#050505" stroke="#444" stroke-width="2"/>' +
      '<rect x="70" y="85" width="60" height="5" rx="2.5" fill="#F5C518"/>' +
      '<path d="M30 200 C 36 160 66 146 100 146 C 134 146 164 160 170 200 Z" fill="#2c2c2a"/>' +
      '<text x="100" y="188" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#F5C518">' + initials + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  document.title = crew.name + ' · ' + crew.id + ' · PRANAVYOM ZERO-GRAM';
  $('crewId').textContent = crew.id;
  $('crewName').textContent = crew.name;
  $('crewRole').textContent = crew.designation;
  const avatar = $('crewAvatar');
  avatar.alt = 'Portrait of ' + crew.name + ' (fictional crew member)';
  avatar.addEventListener('error', function onErr() { avatar.removeEventListener('error', onErr); avatar.src = backupPortrait(crew); });
  avatar.src = 'assets/crew/' + crew.id.toLowerCase() + '.jpg';

  const sw = $('crewSwitch');
  CREW.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = c.id + ' · ' + c.name;
    if (c.id === crew.id) o.selected = true;
    sw.appendChild(o);
  });
  sw.addEventListener('change', () => { location.href = 'astronaut.html?crew=' + sw.value; });

  /* ---------- small helpers ---------- */
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 2400);
  }
  document.querySelectorAll('[data-soon]').forEach(b => b.addEventListener('click', () => toast('This module is built in a later interface.')));

  /* Results of today's battery, one entry per test */
  const results = {};
  function markDone(n, data, tagText) {
    results['test' + n] = data;
    $('test' + n).classList.add('is-done');
    const tag = $('tag' + n); tag.textContent = tagText || '✓ Complete'; tag.classList.add('is-done');
    const done = Object.keys(results).length;
    $('testsDone').textContent = done + ' of 6';
    $('timeLeft').textContent = done === 6 ? 'all tests complete' : '~' + fmt((6 - done) * 0.6, 1) + ' min remaining';
    updatePayload();
  }
  function bundle() {
    return { crewId: crew.id, name: crew.name, missionDay: MISSION_DAY, recordedAt: new Date().toISOString(), demoData: true, results: results };
  }
  function updatePayload() {
    const kb = new Blob([JSON.stringify(bundle())]).size / 1024;
    $('payloadSize').textContent = fmt(kb, 1) + ' KB JSON bundle';
  }
  updatePayload();
  const median = xs => { const s = xs.slice().sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const mean = xs => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const sd = xs => { const m = mean(xs); return Math.sqrt(mean(xs.map(x => (x - m) * (x - m)))); };
  const PX_TO_MM = 25.4 / 96;   // standard screen: 96 px per inch

  /* ---------- TEST 01: reaction tap ---------- */
  (function () {
    const pad = $('reactionPad'), reticle = $('reticle'), startBtn = $('rtStart');
    const DURATION = 20;
    let running = false, shownAt = 0, downAt = 0, endAt = 0, timer = null, tick = null;
    let rts = [], offsets = [], dwells = [], lapses = 0, falseStarts = 0;

    function place() {
      if (Date.now() >= endAt) return finish();
      timer = setTimeout(function () {
        const x = 40 + Math.random() * (pad.clientWidth - 80), y = 40 + Math.random() * (pad.clientHeight - 80);
        reticle.style.left = x + 'px'; reticle.style.top = y + 'px';
        reticle.hidden = false; shownAt = performance.now();
        timer = setTimeout(function () { lapses++; reticle.hidden = true; place(); }, 1200);   // no tap in 1.2 s = lapse
      }, 700 + Math.random() * 1500);
    }
    reticle.addEventListener('pointerdown', function (e) {
      if (!running) return;
      e.stopPropagation();
      clearTimeout(timer);
      const r = reticle.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      rts.push(performance.now() - shownAt);
      offsets.push(Math.sqrt(dx * dx + dy * dy) * PX_TO_MM);
      downAt = performance.now();
    });
    reticle.addEventListener('pointerup', function () {
      if (!running || !downAt) return;
      dwells.push(performance.now() - downAt); downAt = 0;
      reticle.hidden = true; place();
    });
    pad.addEventListener('pointerdown', function () { if (running && reticle.hidden) falseStarts++; });

    startBtn.addEventListener('click', function () {
      running = true; startBtn.hidden = true;
      rts = []; offsets = []; dwells = []; lapses = 0; falseStarts = 0;
      endAt = Date.now() + DURATION * 1000;
      $('tag1').textContent = 'Active target';
      tick = setInterval(function () { $('rtCountdown').textContent = fmt(Math.max(0, (endAt - Date.now()) / 1000), 1) + 's'; }, 100);
      place();
    });

    function finish() {
      running = false; clearTimeout(timer); clearInterval(tick); reticle.hidden = true;
      $('rtCountdown').textContent = '0.0s';
      if (rts.length < 3) { startBtn.hidden = false; startBtn.textContent = '↻ Too few taps · try again'; return; }
      const res = {
        latencyMs: Math.round(median(rts)), offsetMm: +fmt(mean(offsets), 1),
        dwellMs: Math.round(median(dwells.length ? dwells : [0])), scatterMm: +fmt(sd(offsets), 2),
        lapses: lapses, falseStarts: falseStarts, taps: rts.length
      };
      $('rtLatency').textContent = res.latencyMs + ' ms';
      const z = (res.latencyMs - BASE.rt.mu) / BASE.rt.sd;
      $('rtLatencyNote').textContent = z >= 2.5 ? 'slow' : z >= 1.5 ? 'watch' : 'nominal';
      $('rtOffset').textContent = res.offsetMm + ' mm';
      $('rtDwell').textContent = res.dwellMs + ' ms';
      $('rtScatter').textContent = res.scatterMm + ' mm';
      $('rtScatterNote').textContent = res.scatterMm < 2 ? 'stable' : 'variable';
      startBtn.hidden = false; startBtn.textContent = '↻ Run again';
      markDone(1, res);
    }
  })();

  /* ---------- TEST 02: Amsler grid + contrast chart ---------- */
  (function () {
    const grid = $('amsler');
    for (let i = 0; i < 100; i++) {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Grid square ' + (i + 1));
      b.addEventListener('click', function () {
        b.classList.toggle('is-marked');
        const n = grid.querySelectorAll('.is-marked').length;
        $('amslerStatus').textContent = n ? n + ' area' + (n > 1 ? 's' : '') + ' marked' : 'Grid clear';
        if (results.test2) finish(results.test2.lowestRow);
      });
      grid.appendChild(b);
    }
    const ROWS = [['H V Z D', 100], ['N R K C', 75], ['O S Z K', 50], ['V D C N', 25], ['R H S D', 10]];
    const chart = $('contrastChart');
    ROWS.forEach(function (row, i) {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = '<span style="opacity:' + Math.max(0.12, row[1] / 100) + '">' + row[0] + '</span><small>' + row[1] + '%</small>';
      b.setAttribute('aria-label', 'Row ' + (i + 1) + ', ' + row[1] + '% contrast: the lowest row I can read');
      b.addEventListener('click', function () {
        chart.querySelectorAll('button').forEach(x => x.classList.toggle('is-picked', x === b));
        finish(i + 1);
      });
      chart.appendChild(b);
    });
    function finish(row) {
      const marks = grid.querySelectorAll('.is-marked').length;
      $('lowestRow').textContent = 'Row ' + row + ' (' + ROWS[row - 1][1] + '%)';
      $('contrastScore').textContent = ROWS[row - 1][1] + '%';
      const flag = marks >= 4 ? 'High-priority review' : (marks >= 1 || row <= BASE.contrast.mu - 2) ? 'Review with CMO' : 'Normal';
      $('sansResult').textContent = flag;
      markDone(2, { amslerMarks: marks, lowestRow: row, lowestContrastPct: ROWS[row - 1][1] }, '✓ Complete');
    }
  })();

  /* ---------- TEST 03: spatial memory tiles ---------- */
  (function () {
    const box = $('memTiles'), startBtn = $('memStart');
    for (let i = 0; i < 16; i++) {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Tile ' + (i + 1));
      box.appendChild(b);
    }
    const tiles = box.querySelectorAll('button');
    const MAX = 7;
    let seq = [], pos = 0, len = 3, best = 0, accepting = false, retries = 1, taps = 0, errors = 0;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    async function flash(i, cls, ms) { tiles[i].classList.add(cls); await wait(ms); tiles[i].classList.remove(cls); await wait(120); }

    async function play() {
      accepting = false; startBtn.disabled = true;
      $('tag3').textContent = 'Stage ' + (len - 2) + ' / ' + (MAX - 2);
      seq = Array.from({ length: len }, () => Math.floor(Math.random() * 16));
      await wait(400);
      for (const i of seq) await flash(i, 'is-lit', 520);
      pos = 0; accepting = true;
    }
    tiles.forEach(function (t, i) {
      t.addEventListener('click', async function () {
        if (!accepting) return;
        taps++;
        if (i === seq[pos]) {
          flash(i, 'is-hit', 160); pos++;
          if (pos === seq.length) {
            best = len; update();
            if (len >= MAX) return finish();
            len++; accepting = false; setTimeout(play, 450);
          }
        } else {
          errors++; accepting = false; await flash(i, 'is-miss', 380); update();
          if (retries > 0) { retries--; startBtn.textContent = 'Replay pattern (0 left)'; setTimeout(play, 600); }
          else finish();
        }
      });
    });
    function update() {
      $('memSeq').textContent = best + ' / ' + MAX + ' tiles';
      $('memBar').style.width = (best / MAX * 100) + '%';
      $('memErr').textContent = taps ? fmt(errors / taps * 100, 1) + '%' : '—';
      $('memSpan').textContent = best ? best + ' tiles' : '—';
    }
    function finish() {
      accepting = false; update();
      startBtn.disabled = false; startBtn.textContent = '↻ Run again';
      markDone(3, { memorySpan: best, errorRatePct: +fmt(taps ? errors / taps * 100 : 0, 1) }, '✓ Span ' + best);
    }
    startBtn.addEventListener('click', function () {
      len = 3; best = 0; retries = 1; taps = 0; errors = 0;
      startBtn.textContent = 'Replay pattern (1 left)'; update(); play();
    });
  })();

  /* ---------- TEST 04: grip hold + ARED ---------- */
  (function () {
    const btn = $('holdBtn'), HOLD = 15;
    let holding = false, t0 = 0, pts = [], tick = null;
    btn.addEventListener('pointerdown', function (e) {
      btn.setPointerCapture(e.pointerId);
      holding = true; pts = [[e.clientX, e.clientY]]; t0 = performance.now();
      btn.classList.add('is-holding'); $('holdLabel').textContent = 'Hold steady…';
      tick = setInterval(function () {
        const left = HOLD - (performance.now() - t0) / 1000;
        $('holdTime').textContent = fmt(Math.max(0, left), 1) + 's left';
        if (left <= 0) finish(true);
      }, 100);
    });
    btn.addEventListener('pointermove', function (e) { if (holding) pts.push([e.clientX, e.clientY]); });
    ['pointerup', 'pointercancel'].forEach(ev => btn.addEventListener(ev, function () { if (holding) finish(false); }));

    function finish(complete) {
      holding = false; clearInterval(tick); btn.classList.remove('is-holding');
      if (!complete) { $('holdLabel').textContent = 'Released early'; $('holdTime').textContent = 'press & hold again'; return; }
      const mx = mean(pts.map(p => p[0])), my = mean(pts.map(p => p[1]));
      const dist = pts.map(p => Math.hypot(p[0] - mx, p[1] - my));
      const tremor = +fmt(Math.sqrt(mean(dist.map(d => d * d))) || 0.3, 1);
      const step = 200 / Math.max(1, dist.length - 1), maxD = Math.max(4, Math.max.apply(null, dist));
      $('gripLine').setAttribute('points', dist.map((d, i) => fmt(i * step, 1) + ',' + fmt(36 - d / maxD * 32, 1)).join(' '));
      const z = (tremor - BASE.tremor.mu) / BASE.tremor.sd;
      $('gripTremor').textContent = tremor + ' px drift';
      $('gripStability').textContent = z >= 2.5 ? 'Low' : z >= 1.5 ? 'Moderate' : 'High';
      $('holdLabel').textContent = 'Hold complete'; $('holdTime').textContent = '15.0s sustained';
      markDone(4, { holdTremorPx: tremor, aredPct: +$('aredInput').value }, 'ARED synced ✓');
    }
    $('aredInput').addEventListener('input', function () {
      const v = +this.value;
      $('aredValue').textContent = v + '%';
      $('boneLoad').textContent = v >= 80 ? 'on target' : v >= 50 ? 'below target' : 'very low: resume ARED';
      if (results.test4) results.test4.aredPct = v;
      updatePayload();
    });
  })();

  /* ---------- TEST 05: hydration & kidney-stone shield ---------- */
  (function () {
    let water = 0, urine = 0;
    const COLOURS = ['#f7f3c9', '#f5e27a', '#e8c34a', '#c98f22', '#8a5a14'];
    const urineBox = $('urine');
    COLOURS.forEach(function (c, i) {
      const b = document.createElement('button');
      b.type = 'button'; b.style.background = c;
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-label', 'Urine colour ' + (i + 1) + ' of 5');
      b.addEventListener('click', function () {
        urine = i + 1;
        urineBox.querySelectorAll('button').forEach(x => { x.classList.toggle('is-picked', x === b); x.setAttribute('aria-checked', x === b); });
        save();
      });
      urineBox.appendChild(b);
    });
    function show() {
      $('waterNow').textContent = fmt(water, 2).replace(/0$/, '') + ' L';
      $('waterBar').style.width = Math.min(100, water / 2.5 * 100) + '%';
    }
    $('waterPlus').addEventListener('click', () => { water = Math.min(5, water + 0.25); show(); if (urine) save(); });
    $('waterMinus').addEventListener('click', () => { water = Math.max(0, water - 0.25); show(); if (urine) save(); });
    document.querySelectorAll('#suppChips .chip-btn').forEach(b => b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); if (urine) save();
    }));
    function save() {
      const supp = Array.from(document.querySelectorAll('#suppChips [aria-pressed="true"]')).map(b => b.dataset.supp);
      const stages = ['', 'Stage 1 · well hydrated', 'Stage 2 · normal', 'Stage 3 · drink more', 'Stage 4 · dehydrated', 'Stage 5 · very dehydrated'];
      $('urineLabel').textContent = stages[urine];
      const risky = water < 2.0 || urine >= 4;
      $('stoneRisk').textContent = risky ? 'WATCH: raise water to 3 L today' : 'OPTIMAL';
      markDone(5, { waterL: water, urineColour: urine, supplements: supp });
    }
    show();
  })();

  /* ---------- TEST 06: mood, symptoms, journal ---------- */
  (function () {
    ['mood', 'stress', 'energy'].forEach(id => $(id).addEventListener('input', function () { $(id + 'V').textContent = this.value + '/5'; }));
    document.querySelectorAll('#symptomChips .chip-btn').forEach(b => b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    }));
    $('moodSave').addEventListener('click', function () {
      markDone(6, {
        mood: +$('mood').value, stress: +$('stress').value, energy: +$('energy').value,
        symptoms: Array.from(document.querySelectorAll('#symptomChips [aria-pressed="true"]')).map(b => b.dataset.sym),
        journal: $('journal').value.trim()
      });
      this.textContent = '✓ Logged · tap to update';
    });
  })();

  /* ---------- 4. Evaluate today's results against the baseline ---------- */
  function evaluate() {
    const out = [];
    const add = (area, level, text) => out.push({ area: area, level: level, text: text });
    const zLevel = z => z >= 2.5 ? 'red' : z >= 1.5 ? 'yellow' : 'green';
    const r = results;

    if (r.test1) {
      const z = (r.test1.latencyMs - BASE.rt.mu) / BASE.rt.sd;
      add('Reaction', zLevel(z), r.test1.latencyMs + ' ms vs your normal ' + BASE.rt.mu + ' ± ' + BASE.rt.sd + ' ms (' + (z >= 0 ? '+' : '') + fmt(z, 1) + 'σ). A mouse is slower than a finger on a tablet.');
    } else add('Reaction', 'none', 'Not completed today.');

    if (r.test2) {
      const m = r.test2.amslerMarks, row = r.test2.lowestRow;
      const lvl = m >= 4 ? 'red' : (m >= 1 || row <= BASE.contrast.mu - 2) ? 'yellow' : 'green';
      add('Eyes (SANS)', lvl, (m ? m + ' grid area(s) looked wavy or missing. ' : 'Amsler grid clear. ') + 'Lowest readable contrast: ' + r.test2.lowestContrastPct + '%.');
    } else add('Eyes (SANS)', 'none', 'Not completed today.');

    if (r.test3) {
      const z = (BASE.span.mu - r.test3.memorySpan) / BASE.span.sd;
      add('Memory', zLevel(z), 'Span ' + r.test3.memorySpan + ' tiles vs your normal ' + BASE.span.mu + ' (error rate ' + r.test3.errorRatePct + '%).');
    } else add('Memory', 'none', 'Not completed today.');

    if (r.test4) {
      const z = (r.test4.holdTremorPx - BASE.tremor.mu) / BASE.tremor.sd;
      let lvl = zLevel(z);
      if (r.test4.aredPct < 80 && lvl === 'green') lvl = 'yellow';
      add('Muscle & bone', lvl, 'Hold drift ' + r.test4.holdTremorPx + ' px vs your normal ' + fmt(BASE.tremor.mu, 1) + ' px. ARED workout ' + r.test4.aredPct + '% of plan.');
    } else add('Muscle & bone', 'none', 'Not completed today.');

    if (r.test5) {
      const lvl = (r.test5.waterL < 2.0 || r.test5.urineColour >= 4) ? 'yellow' : 'green';
      add('Hydration', lvl, fmt(r.test5.waterL, 2) + ' L water (target 2.5 L), urine colour ' + r.test5.urineColour + ' of 5.' + (lvl === 'yellow' ? ' Raise water to 3 L today.' : ''));
    } else add('Hydration', 'none', 'Not completed today.');

    if (r.test6) {
      const t = r.test6;
      let lvl = (t.mood <= 2 || t.stress >= 4) ? 'yellow' : 'green';
      if (t.symptoms.length && lvl === 'green') lvl = 'yellow';
      add('Mind & mood', lvl, 'Mood ' + t.mood + '/5, stress ' + t.stress + '/5, energy ' + t.energy + '/5.' + (t.symptoms.length ? ' Symptoms: ' + t.symptoms.join(', ') + '.' : ' No symptoms.'));
    } else add('Mind & mood', 'none', 'Not completed today.');
    return out;
  }

  /* ---------- pop-up ---------- */
  function openModal(title, html) {
    $('modalTitle').textContent = title; $('modalBody').innerHTML = html;
    $('modal').hidden = false; $('modalClose').focus();
  }
  $('modalClose').addEventListener('click', () => { $('modal').hidden = true; });
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal') $('modal').hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('modal').hidden = true; });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- 5. Submit, transmit, reset ---------- */
  const RECORD_KEY = 'pranavyom.records.' + crew.id;   // each astronaut has their own record
  $('submitBtn').addEventListener('click', function () {
    if (!Object.keys(results).length) return toast('Complete at least one test first.');
    const evals = evaluate();
    const record = Object.assign(bundle(), { evaluation: evals });
    try {
      const list = JSON.parse(localStorage.getItem(RECORD_KEY) || '[]');
      list.push(record); localStorage.setItem(RECORD_KEY, JSON.stringify(list));
    } catch (e) { /* storage blocked: results still shown */ }
    const WORD = { green: 'All good', yellow: 'Keep an eye', red: 'Act now', none: 'Not done' };
    const html = '<p style="color:#A1A1A1;margin-bottom:8px">' + esc(crew.name) + ' · ' + crew.id + ' · Mission day ' + MISSION_DAY +
      '. Saved to this astronaut\'s record on this device. Demonstration data only.</p>' +
      evals.map(e => '<div class="result"><b class="lvl-' + (e.level === 'none' ? 'none' : e.level) + '" style="' + (e.level === 'none' ? 'color:#A1A1A1' : '') + '">' + WORD[e.level] +
        '</b><span><strong>' + e.area + ':</strong> ' + esc(e.text) + '</span></div>').join('');
    openModal('Today\'s biomarkers', html);
  });

  $('transmitBtn').addEventListener('click', function () {
    if (!Object.keys(results).length) return toast('Nothing to transmit yet: complete a test first.');
    const json = JSON.stringify(bundle(), null, 2);
    const kb = fmt(new Blob([json]).size / 1024, 1);
    openModal('Queued for Earth',
      '<p>' + esc(crew.name) + '\'s check-in (' + kb + ' KB) is queued for the next deep-space comms window. ' +
      'One-way signal delay today: about <b style="color:#F5C518">8.5 minutes</b> (simulated).</p>' +
      '<pre style="margin-top:12px;max-height:240px;overflow:auto;background:#151515;padding:12px;border-radius:10px;font-size:.75rem;white-space:pre-wrap">' + esc(json) + '</pre>');
  });

  $('resetBtn').addEventListener('click', function () {
    if (this.dataset.confirm) { location.reload(); return; }
    this.dataset.confirm = '1'; this.textContent = 'Tap again to reset';
    setTimeout(() => { delete this.dataset.confirm; this.textContent = 'Reset battery'; }, 3000);
  });
})();