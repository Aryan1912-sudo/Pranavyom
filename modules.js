/* ==========================================================
   PRANAVYOM ZERO-GRAM — Interface 3: sidebar modules
   Home (Profile) · Daily Check-In · Action Center · Health Trends
   Smart Pharmacy · Crew & Buddy · Reports to Earth
   ----------------------------------------------------------
   Uses window.PZDeck from astronaut.js (the selected astronaut).
   All history here is FICTIONAL DEMONSTRATION DATA, generated
   the same way every time for each Crew ID.
   ========================================================== */

(function () {
  'use strict';

  const D = window.PZDeck;
  if (!D) return;                                    // astronaut.js must load first
  const crew = D.crew, esc = D.esc, toast = D.toast;
  const DAY = D.missionDay;                          // today = mission day 34
  const FIRST = DAY - 29;                            // 30 days of history
  const view = document.getElementById('view-module');
  const checkinView = document.getElementById('view-checkin');
  const fmt = (x, dp) => Number(x).toFixed(dp);
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  };

  /* ==========================================================
     1. METRICS: what we track, which body system it belongs to
     ========================================================== */
  const SYSTEMS = [
    { id: 'heart',     name: 'Heart & Circulation',      icon: '♥', weight: .20 },
    { id: 'radiation', name: 'Radiation',                icon: '☢', weight: .20 },
    { id: 'mind',      name: 'Mind & Neuro',             icon: '◉', weight: .15 },
    { id: 'eyes',      name: 'Eyes (SANS)',              icon: '◎', weight: .15 },
    { id: 'immune',    name: 'Immune',                   icon: '✚', weight: .10 },
    { id: 'sleep',     name: 'Sleep & Circadian',        icon: '☾', weight: .10 },
    { id: 'bone',      name: 'Bones, Muscle & Nutrition',icon: '▲', weight: .10 }
  ];
  // bad: which direction is unhealthy · kind 'z' = vs personal normal · 'rule' = fixed limits
  const METRICS = {
    hr:       { label: 'Resting heart rate',  unit: 'bpm',  sys: 'heart',  bad: 'high', dp: 0, kind: 'z', src: 'wearable (simulated)',
                friendly: 'Your resting heart rate is higher than your normal' },
    spo2:     { label: 'Blood oxygen (SpO₂)', unit: '%',    sys: 'heart',  bad: 'low',  dp: 1, kind: 'z', src: 'wearable (simulated)', floor: [94, 92],
                friendly: 'Your blood oxygen is lower than usual' },
    sleep:    { label: 'Sleep',               unit: 'h',    sys: 'sleep',  bad: 'low',  dp: 1, kind: 'z', src: 'wearable (simulated)',
                friendly: 'You have been sleeping less than usual' },
    energy:   { label: 'Energy',              unit: '/5',   sys: 'sleep',  bad: 'low',  dp: 1, kind: 'z', src: 'Test 06',
                friendly: 'Your energy is lower than usual' },
    rt:       { label: 'Reaction time',       unit: 'ms',   sys: 'mind',   bad: 'high', dp: 0, kind: 'z', src: 'Test 01',
                friendly: 'Your reactions are slower than your normal' },
    span:     { label: 'Memory span',         unit: 'tiles',sys: 'mind',   bad: 'low',  dp: 0, kind: 'z', src: 'Test 03',
                friendly: 'Your memory score dipped' },
    mood:     { label: 'Mood',                unit: '/5',   sys: 'mind',   bad: 'low',  dp: 1, kind: 'z', src: 'Test 06',
                friendly: 'Your mood is lower than usual' },
    stress:   { label: 'Stress',              unit: '/5',   sys: 'mind',   bad: 'high', dp: 1, kind: 'z', src: 'Test 06',
                friendly: 'You are more stressed than usual' },
    contrast: { label: 'Lowest readable contrast', unit: '%', sys: 'eyes', bad: 'high', dp: 0, kind: 'rule', yellowAtLeast: 50, src: 'Test 02',
                friendly: 'Your contrast vision dipped' },
    amsler:   { label: 'Amsler grid marks',   unit: 'areas',sys: 'eyes',   dp: 0, kind: 'rule', yellowAtLeast: 1, redAtLeast: 4, src: 'Test 02',
                friendly: 'You saw wavy or missing lines on the eye grid' },
    drift:    { label: 'Grip-hold drift',     unit: 'px',   sys: 'bone',   bad: 'high', dp: 1, kind: 'z', src: 'Test 04',
                friendly: 'Your grip is less steady than usual' },
    ared:     { label: 'ARED workout',        unit: '% of plan', sys: 'bone', dp: 0, kind: 'rule', yellowBelow: 80, src: 'Test 04',
                friendly: 'You have missed some resistance workouts' },
    water:    { label: 'Water intake',        unit: 'L',    sys: 'bone',   dp: 2, kind: 'rule', yellowBelow: 2.0, src: 'Test 05',
                friendly: 'You are drinking less water than your body needs' },
    urine:    { label: 'Urine colour',        unit: '/5',   sys: 'bone',   dp: 0, kind: 'rule', yellowAtLeast: 4, src: 'Test 05',
                friendly: 'Your urine is dark, so you may be dehydrated' },
    dose:     { label: 'Daily radiation dose',unit: 'mSv',  sys: 'radiation', dp: 2, kind: 'rule', yellowAbove: 3, redAbove: 10, src: 'dosimeter (simulated)',
                friendly: 'Radiation is higher than normal today' }
  };

  /* ==========================================================
     2. FICTIONAL HISTORY for any astronaut (seeded by Crew ID)
     ========================================================== */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function baseFor(id) {
    const n = parseInt(id.slice(5), 10);
    return {
      hr: [56 + n % 9, 2.5], spo2: [98.1, 0.4], sleep: [7.2 + (n % 3) * 0.15, 0.5], energy: [4, 0.35],
      rt: [235 + (n * 7) % 35, 22], span: [6 + n % 2, 0.8], mood: [4.1, 0.35], stress: [2, 0.35],
      drift: [2.2 + (n % 3) * 0.3, 0.7]
    };
  }
  /* Planted demo stories (σ offsets) so some astronauts need attention */
  function story(id, day, key) {
    const after = (d0, steps) => day >= d0 ? Math.min(steps.length - 1, day - d0) : -1;
    if (id === 'CREW-03') {                                     // Priya: sleep debt → slower reactions
      const i = after(29, [0, 1, 2, 3, 4, 5]);
      if (i < 0) return 0;
      return { sleep: -[0.6, 1.2, 1.7, 2.0, 2.1, 2.2][i], rt: [0.5, 0.9, 1.3, 1.6, 1.9, 2.1][i], energy: -[0.4, .8, 1.1, 1.4, 1.6, 1.7][i], stress: [0.4, .8, 1.1, 1.4, 1.7, 1.9][i] }[key] || 0;
    }
    if (id === 'CREW-12') {                                     // Rohan: missed workouts → heart rate creeping up
      const i = after(29, [0, 1, 2, 3, 4, 5]);
      if (i < 0) return 0;
      return { hr: [0.4, 0.7, 1.0, 1.2, 1.4, 1.7][i], drift: [0.3, .6, .9, 1.1, 1.3, 1.5][i] }[key] || 0;
    }
    if (id === 'CREW-06' && key === 'spo2' && day >= 32) return -[1.2, 1.8, 2.3][day - 32];   // Hiroshi: oxygen dipping
    return 0;
  }
  const historyCache = {};
  function history(id) {
    if (historyCache[id]) return historyCache[id];
    const r = rng(parseInt(id.slice(5), 10) * 9973), g = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const b = baseFor(id), rows = [];
    for (let d = FIRST; d <= DAY; d++) {
      const row = { day: d, demo: true, symptoms: [] };
      Object.keys(b).forEach(k => { const off = story(id, d, k); row[k] = b[k][0] + b[k][1] * ((off ? 0.25 : 0.45) * g() + off); });
      row.rt = Math.round(row.rt); row.span = Math.round(row.span);
      row.mood = Math.min(5, Math.max(1, row.mood)); row.stress = Math.min(5, Math.max(1, row.stress)); row.energy = Math.min(5, Math.max(1, row.energy));
      row.contrast = 10; row.amsler = 0;
      row.ared = id === 'CREW-12' && d >= 29 ? 20 + r() * 25 : 88 + r() * 14;
      row.water = id === 'CREW-12' && d >= 31 ? 1.5 + r() * 0.2 : 2.4 + r() * 0.5;
      row.urine = id === 'CREW-12' && d >= 32 ? 4 : r() < .8 ? 2 : 1;
      row.dose = 1.7 + r() * 0.2;
      rows.push(row);
    }
    historyCache[id] = rows;
    return rows;
  }
  /* Today's live check-in (if submitted) replaces the demo values for day 34 */
  function latestRecord(id) { const list = store.get('pranavyom.records.' + id, []); return list.length ? list[list.length - 1] : null; }
  function liveRow(id) {
    const rec = latestRecord(id); if (!rec) return null;
    const t = rec.results || {}, row = { live: true };
    if (t.test1) row.rt = t.test1.latencyMs;
    if (t.test2) { row.amsler = t.test2.amslerMarks; row.contrast = t.test2.lowestContrastPct; }
    if (t.test3) row.span = t.test3.memorySpan;
    if (t.test4) { row.drift = t.test4.holdTremorPx; row.ared = t.test4.aredPct; }
    if (t.test5) { row.water = t.test5.waterL; row.urine = t.test5.urineColour; }
    if (t.test6) { row.mood = t.test6.mood; row.stress = t.test6.stress; row.energy = t.test6.energy; row.symptoms = t.test6.symptoms; row.journal = t.test6.journal; }
    return row;
  }
  function series(id) {
    const rows = history(id).map(r => Object.assign({}, r));
    const live = liveRow(id);
    if (live) Object.assign(rows[rows.length - 1], live);
    return rows;
  }

  /* ==========================================================
     3. EVALUATION: traffic light per body system + score
     ========================================================== */
  const RANK = { green: 0, yellow: 1, red: 2 };
  const worse = (a, b) => RANK[b] > RANK[a] ? b : a;
  function metricStatus(id, rows, key, i) {
    const m = METRICS[key], row = rows[i === undefined ? rows.length - 1 : i], v = row[key], b = baseFor(id)[key];
    const out = { key: key, value: v, level: 'green', text: '' };
    if (v === undefined || v === null) return out;
    if (m.kind === 'z') {
      const z = (v - b[0]) / b[1], bz = m.bad === 'high' ? z : -z;
      out.z = z; out.level = bz >= 2.5 ? 'red' : bz >= 1.5 ? 'yellow' : 'green';
      out.text = m.label + ' ' + fmt(v, m.dp) + ' ' + m.unit + ' (' + (z >= 0 ? '+' : '−') + fmt(Math.abs(z), 1) + 'σ vs normal ' + fmt(b[0], m.dp) + ')';
      if (m.floor) { if (v < m.floor[1]) out.level = 'red'; else if (v < m.floor[0]) out.level = worse(out.level, 'yellow'); }
    } else {
      if (m.redAtLeast !== undefined && v >= m.redAtLeast) out.level = 'red';
      else if (m.yellowAtLeast !== undefined && v >= m.yellowAtLeast) out.level = 'yellow';
      if (m.yellowBelow !== undefined && v < m.yellowBelow) out.level = 'yellow';
      if (m.redAbove !== undefined && v > m.redAbove) out.level = 'red';
      else if (m.yellowAbove !== undefined && v > m.yellowAbove) out.level = worse(out.level, 'yellow');
      out.text = m.label + ' ' + fmt(v, m.dp) + ' ' + m.unit;
    }
    return out;
  }
  function buddyFlags(id) { return store.get('pranavyom.buddy', []).filter(f => f.about === id); }
  function evaluate(id) {
    const rows = series(id), today = rows[rows.length - 1];
    const sys = {}; SYSTEMS.forEach(s => { sys[s.id] = { level: 'green', reasons: [] }; });
    const raise = (s, level, friendly, detail) => { sys[s].level = worse(sys[s].level, level); if (level !== 'green') sys[s].reasons.push({ level, friendly, detail }); };
    Object.keys(METRICS).forEach(k => {
      const st = metricStatus(id, rows, k);
      if (st.level !== 'green') raise(METRICS[k].sys, st.level, METRICS[k].friendly, st.text);
    });
    (today.symptoms || []).forEach(sym => {
      const map = { 'Headache': 'mind', 'Blurred vision': 'eyes', 'Head fullness': 'eyes', 'Space sickness': 'mind', 'Lumbar ache': 'bone' };
      raise(map[sym] || 'immune', 'yellow', 'You mentioned: ' + sym.toLowerCase(), 'Symptom logged in Test 06');
    });
    if (buddyFlags(id).length) raise('mind', 'yellow', 'A crewmate is a little worried about you', 'Private buddy-check flag');
    const cum = rows.reduce((a, r) => a + r.dose, 0) + 40 + parseInt(id.slice(5), 10) * 6;   // incl. earlier missions
    let raw = 0; const pts = { green: 100, yellow: 60, red: 20 };
    SYSTEMS.forEach(s => { raw += s.weight * pts[sys[s.id].level]; });
    raw = Math.round(raw);
    const levels = SYSTEMS.map(s => sys[s.id].level);
    const cap = levels.includes('red') ? 49 : levels.includes('yellow') ? 79 : 100;
    return { rows, today, sys, score: Math.min(raw, cap), raw, cap, overall: levels.reduce(worse, 'green'), cumDose: cum, live: !!today.live };
  }

  /* ==========================================================
     4. SHARED BITS: words, badges, identity strip, pharmacy
     ========================================================== */
  const WORD = { green: 'All good', yellow: 'Keep an eye', red: 'Act now' };
  const badge = l => '<span class="m-status m-' + l + '"><i></i>' + WORD[l] + '</span>';
  const cmo = crew.id === 'CREW-04' ? 'Commander Arjun Mehta' : 'Dr. Kwame Mensah, Medical Officer';
  function identity(title, sub) {
    return '<section class="m-hero glow-card"><div><p class="battery__id">' + crew.id + '</p>' +
      '<h1 class="battery__name">' + esc(crew.name) + '</h1><p class="battery__role">' + esc(crew.designation) + '</p></div>' +
      '<div class="m-hero__title"><p class="battery__kicker">' + title + '</p><p class="m-hero__sub">' + sub + '</p></div></section>';
  }
  const DEMO_NOTE = '<p class="demo-note">Fictional demonstration data for ' + esc(crew.name) + '. Not real medical measurements.</p>';

  const ALLERGIES = { 'CREW-04': ['NSAID'], 'CREW-11': ['NSAID'] };
  const KIT = [
    { id: 'melatonin',    name: 'Melatonin',               use: 'Sleep / body-clock reset',          qty: 90,  shelf: 540,  card: 'S-1' },
    { id: 'promethazine', name: 'Promethazine',            use: 'Space motion sickness',             qty: 24,  shelf: 420,  card: 'N-1' },
    { id: 'ibuprofen',    name: 'Ibuprofen',               use: 'Back pain, inflammation',           qty: 120, shelf: 720,  card: 'P-1', tags: ['NSAID'] },
    { id: 'paracetamol',  name: 'Paracetamol',             use: 'Pain, fever',                       qty: 120, shelf: 720,  card: 'P-2' },
    { id: 'valacyclovir', name: 'Valacyclovir',            use: 'Cold sores, shingles (antiviral)',  qty: 42,  shelf: 600,  card: 'I-1' },
    { id: 'salt',         name: 'Electrolyte / salt tablets', use: 'Hydration, dizziness on standing', qty: 150, shelf: 900, card: 'C-2' },
    { id: 'kcitrate',     name: 'Potassium citrate',       use: 'Kidney-stone prevention',           qty: 60,  shelf: 720,  card: 'R-1' },
    { id: 'alendronate',  name: 'Alendronate',             use: 'Bone loss (weekly, with exercise)', qty: 80,  shelf: 720,  card: 'B-1' },
    { id: 'oxygen',       name: 'Supplemental oxygen mask',use: 'Low blood oxygen emergency',        qty: 4,   shelf: 1800, card: 'C-4' }
  ];
  const PLANNED_DAYS = 450;
  function medLog() {
    const seeded = [];
    [30, 31, 32, 33].forEach(d => seeded.push({ day: d, crew: 'CREW-03', med: 'melatonin' }));
    [8, 15, 22, 29].forEach(d => seeded.push({ day: d, crew: 'ALL', med: 'alendronate', count: 16 }));
    [12, 26].forEach(d => seeded.push({ day: d, crew: 'CREW-01', med: 'ibuprofen' }));
    return seeded.concat(store.get('pranavyom.medlog', []));
  }
  function stock() {
    const log = medLog();
    return KIT.map(k => {
      const used = log.filter(l => l.med === k.id).reduce((a, l) => a + (l.count || 1), 0);
      const recent = log.filter(l => l.med === k.id && l.day > DAY - 14).reduce((a, l) => a + (l.count || 1), 0);
      const left = Math.max(0, k.qty - used), usable = Math.floor(k.shelf * 0.8), rate = recent / 14;
      const runsOut = rate > 0 ? Math.floor(DAY + left / rate) : null;
      const warn = [];
      if (left === 0) warn.push('Out of stock');
      if (usable < PLANNED_DAYS) warn.push('Expires (radiation-adjusted) on day ' + usable + ', before mission end');
      if (runsOut !== null && runsOut < PLANNED_DAYS) warn.push('At current use, runs out by day ' + runsOut);
      return Object.assign({}, k, { left, usable, runsOut, warn });
    });
  }
  function safety(medId) {
    const k = KIT.find(x => x.id === medId), s = stock().find(x => x.id === medId), ev = evaluate(crew.id), t = ev.today;
    const today = medLog().filter(l => l.crew === crew.id && l.day === DAY).map(l => l.med);
    const out = { blocked: false, notes: [] };
    (k.tags || []).forEach(tag => { if ((ALLERGIES[crew.id] || []).includes(tag)) { out.blocked = true; out.notes.push('Allergy on file (' + tag + '). Do not use: choose an alternative.'); } });
    if (s.left === 0) { out.blocked = true; out.notes.push('None left in the kit.'); }
    if (['melatonin', 'promethazine'].includes(medId)) out.notes.push('Causes drowsiness: no spacewalk or precision tasks until it wears off.');
    if (medId === 'ibuprofen' && (t.water < 2 || t.urine >= 4)) out.notes.push('Low fluids: ibuprofen can strain the kidneys. Paracetamol is the safer choice.');
    if (today.includes(medId)) out.notes.push('Already logged today: check protocol card ' + k.card + ' before another dose.');
    return out;
  }

  /* What to do for each body system: steps first, then kit medicines */
  const PLAN = {
    heart:     { steps: ['Drink 500 ml of water now; aim for 2.5 L today', 'Skip caffeine for 24 hours', 'Stand up slowly; do your aerobic session', 'Re-measure tomorrow morning'], meds: ['salt', 'oxygen'],
                 help: 'Chest pain, fainting, or blood oxygen under 92 %: start protocol C-4 and alert ' + cmo + ' now.' },
    radiation: { steps: ['Go to the shielded storm shelter', 'Close the hatch until the all-clear', 'Keep your dosimeter on', 'Log any nausea or skin redness'], meds: [],
                 none: 'No proven anti-radiation pill is in routine use. Shielding and time are the protection.', help: 'Nausea or skin burns after a solar storm: alert ' + cmo + ' and the Flight Surgeon.' },
    mind:      { steps: ['Take a 20-minute break from screens and workload', 'Book a private call or message home', 'Do an aerobic session to lift mood', 'Move precision or spacewalk tasks to later'], meds: [],
                 none: 'Behavioural support first. Any mental-health medicine only on Flight Surgeon advice.', help: 'Feeling very low or unsafe: talk to ' + cmo + ' now and request a private call with Earth.' },
    eyes:      { steps: ['Repeat the Amsler grid tonight', 'Use adjustable-focus glasses if reading is blurry', 'Do the thigh-cuff session as scheduled', 'Avoid long head-down posture'], meds: [],
                 none: 'There is no routine drug treatment for SANS: monitoring and fluid-shift countermeasures.', help: 'Sudden vision loss or a worsening grid: eye exam by ' + cmo + ' and report to Earth today.' },
    immune:    { steps: ['Sleep 8 hours tonight', 'Lower workload and stress today', 'Wash hands; clean shared surfaces', 'Check temperature twice today'], meds: ['valacyclovir', 'paracetamol'],
                 help: 'Fever over 38 °C for a day or a spreading rash: exam by ' + cmo + ' and report to Earth.' },
    sleep:     { steps: ['Fixed lights-out tonight; aim for 8 hours', 'Amber cabin light 2 hours before sleep', 'Eye mask and earplugs; check fan noise', 'Do demanding tasks in the afternoon'], meds: ['melatonin'],
                 help: 'Under 5 hours for 3 nights or reaction time at Red: schedule review with ' + cmo + '.' },
    bone:      { steps: ['Complete today\'s ARED resistance session', 'Water target 2.5–3 L', 'Take vitamin D and calcium', 'Protein with every meal'], meds: ['kcitrate', 'alendronate', 'paracetamol'],
                 help: 'Flank pain with blood in urine, or a fall with bone pain: exam by ' + cmo + ' and report to Earth.' }
  };

  /* ==========================================================
     5. THE SCREENS
     ========================================================== */
  const SCREENS = {

    /* ---------- HOME (PROFILE) ---------- */
    home: function () {
      const ev = evaluate(crew.id), rec = latestRecord(crew.id);
      const n = SYSTEMS.filter(s => ev.sys[s.id].level !== 'green').length;
      const hour = new Date().getHours(), hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const summary = { green: 'All seven body systems look normal for you. Keep up your routine.',
        yellow: (n === 1 ? 'One thing needs' : n + ' things need') + ' a little attention today. Nothing urgent: the Action Center has simple next steps.',
        red: 'Something needs action now. Open the Action Center and let ' + cmo + ' know.' }[ev.overall];
      const radPct = Math.min(100, ev.cumDose / 600 * 100);
      let html = identity('Home · Personal health profile', esc(hello) + ', ' + esc(crew.name.replace(/^Dr\.\s*/, '').split(' ')[0]) + '. Day ' + DAY + ' of the journey. ' + summary);
      html += '<div class="m-grid3">' +
        '<div class="m-card glow-card"><p class="m-label">Mission health score</p><p class="m-big m-' + ev.overall + '-text">' + ev.score + '</p>' + badge(ev.overall) +
          '<p class="m-small">' + (ev.raw > ev.cap ? 'Capped at ' + ev.cap + ' because a system is ' + (ev.cap === 49 ? 'Red' : 'Yellow') + ' (weighted ' + ev.raw + ').' : 'Weighted across 7 body systems.') + '</p></div>' +
        '<div class="m-card glow-card"><p class="m-label">Career radiation dose</p><p class="m-big">' + fmt(ev.cumDose, 0) + '<span> / 600 mSv</span></p>' +
          '<div class="bar"><span style="width:' + radPct + '%"></span></div><p class="m-small">Today ' + fmt(ev.today.dose, 2) + ' mSv · NASA career limit 600 mSv</p></div>' +
        '<div class="m-card glow-card"><p class="m-label">Last check-in</p><p class="m-big" style="font-size:1.6rem">' + (rec ? new Date(rec.recordedAt).toLocaleString() : 'Not yet today') + '</p>' +
          '<p class="m-small">' + (rec ? Object.keys(rec.results).length + ' of 6 tests submitted.' : 'Today\'s numbers use demonstration data until you submit.') + '</p>' +
          '<button class="cta" data-go="checkin" type="button">' + (rec ? 'Redo check-in' : 'Start daily check-in') + ' →</button></div></div>';
      html += '<h2 class="m-h2">How your body is doing</h2><div class="m-systems">';
      SYSTEMS.forEach(s => {
        const st = ev.sys[s.id], r0 = st.reasons[0];
        html += '<button class="m-sys m-sys--' + st.level + '" type="button" data-go="' + (st.level === 'green' ? 'trends' : 'action') + '">' +
          '<span class="m-sys__top"><b>' + s.icon + ' ' + s.name + '</b>' + badge(st.level) + '</span>' +
          '<span class="m-sys__why">' + (r0 ? '<strong>' + esc(r0.friendly) + '.</strong><small>' + esc(r0.detail) + (st.reasons.length > 1 ? ' · +' + (st.reasons.length - 1) + ' more' : '') + '</small>' : 'Everything is within your personal normal.') + '</span></button>';
      });
      html += '</div>' + DEMO_NOTE;
      return html;
    },

    /* ---------- ACTION CENTER ---------- */
    action: function () {
      const ev = evaluate(crew.id);
      const bad = SYSTEMS.filter(s => ev.sys[s.id].level !== 'green');
      let html = identity('Action Center', 'What will help today. Simple steps first, then approved kit medicines, then when to get help.');
      html += '<p class="m-safety">Decision support only, not medical diagnosis. Shows only pre-approved medicines from the onboard kit under Flight Surgeon protocols. Doses are as printed on each protocol card.</p>';
      if (!bad.length) return html + '<div class="m-card glow-card m-allclear"><h2>Nothing to do today ✓</h2><p>All seven body systems are within ' + esc(crew.name) + '\'s normal. Keep the routine and check in again tomorrow.</p></div>' + DEMO_NOTE;
      bad.forEach(s => {
        const st = ev.sys[s.id], p = PLAN[s.id];
        html += '<section class="m-action glow-card m-action--' + st.level + '"><div class="m-action__head"><h2>' + s.icon + ' ' + s.name + '</h2>' + badge(st.level) + '</div>' +
          '<h3>What we noticed</h3><ul>' + st.reasons.map(r => '<li><b>' + esc(r.friendly) + '.</b> <small>' + esc(r.detail) + '</small></li>').join('') + '</ul>' +
          '<h3>1 · Start with these simple steps</h3><div class="m-checks">' + p.steps.map(x => '<label><input type="checkbox"> ' + esc(x) + '</label>').join('') + '</div>' +
          '<h3>2 · If you need it: approved kit medicines</h3>' + (p.none ? '<p class="m-small">' + p.none + '</p>' : '');
        p.meds.filter(id => id !== 'oxygen' || ev.today.spo2 < 94).forEach(id => {
          const k = KIT.find(x => x.id === id), chk = safety(id);
          html += '<div class="m-med"><div><b>' + k.name + '</b> <span class="chip">Card ' + k.card + '</span><p class="m-small">' + k.use + '</p>' +
            (chk.notes.length ? '<ul class="m-notes">' + chk.notes.map(x => '<li>' + (chk.blocked ? '⛔ ' : '⚠ ') + esc(x) + '</li>').join('') + '</ul>' : '<p class="m-ok">✓ Safety check passed</p>') + '</div>' +
            '<button class="pill-btn" type="button" data-take="' + id + '"' + (chk.blocked ? ' disabled' : '') + '>Log as taken</button></div>';
        });
        html += '<h3>3 · When to get help</h3><p>' + esc(p.help) + '</p></section>';
      });
      return html + DEMO_NOTE;
    },

    /* ---------- HEALTH TRENDS ---------- */
    trends: function () {
      const key = SCREENS.trendKey || 'rt';
      const opts = SYSTEMS.map(s => '<optgroup label="' + s.name + '">' + Object.keys(METRICS).filter(k => METRICS[k].sys === s.id)
        .map(k => '<option value="' + k + '"' + (k === key ? ' selected' : '') + '>' + METRICS[k].label + '</option>').join('') + '</optgroup>').join('');
      const m = METRICS[key], rows = series(crew.id);
      let html = identity('Health Trends', 'The last 30 days for ' + esc(crew.name) + ', compared with their own normal range.');
      html += '<section class="m-card glow-card"><div class="m-row"><h2 class="m-h2" style="margin:0">' + m.label + ' <small>(' + m.unit + ' · ' + m.src + ')</small></h2>' +
        '<select class="m-select" id="trendSel" aria-label="Choose a measure">' + opts + '</select></div>' + chart(key, rows) + '</section>';
      return html + DEMO_NOTE;
    },

    /* ---------- SMART PHARMACY ---------- */
    pharmacy: function () {
      const st = stock();
      let html = identity('Smart Pharmacy', 'Onboard kit stock, radiation-adjusted expiry and a safety check for ' + esc(crew.name) + '.');
      html += '<section class="m-card glow-card"><p class="m-small">Usable life = label shelf life × 0.8 (20 % buffer for space radiation). Run-out day uses the last 14 days of crew use. Planned mission: ' + PLANNED_DAYS + ' days.' +
        ((ALLERGIES[crew.id] || []).length ? ' <b class="m-yellow-text">Allergy on file: ' + ALLERGIES[crew.id].join(', ') + '.</b>' : '') + '</p>' +
        '<div class="m-table-wrap"><table class="m-table"><thead><tr><th>Medicine</th><th>Use</th><th>Left</th><th>Usable until</th><th>Runs out</th><th>Alerts</th><th></th></tr></thead><tbody>' +
        st.map(k => '<tr><td><b>' + k.name + '</b><br><small>Card ' + k.card + '</small></td><td>' + k.use + '</td><td>' + k.left + ' / ' + k.qty + '</td><td>Day ' + k.usable + '</td><td>' +
          (k.runsOut ? 'Day ' + k.runsOut : '—') + '</td><td>' + (k.warn.length ? k.warn.map(w => '⚠ ' + esc(w)).join('<br>') : '<span class="m-ok">OK</span>') +
          '</td><td><button class="pill-btn small" type="button" data-check="' + k.id + '">Safety check</button></td></tr>').join('') +
        '</tbody></table></div><div id="safetyOut"></div></section>';
      const mine = medLog().filter(l => l.crew === crew.id && l.day > DAY - 14).sort((a, b) => b.day - a.day);
      html += '<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">' + esc(crew.name) + '\'s medicine log (last 14 days)</h2>' +
        (mine.length ? '<table class="m-table"><tr><th>Day</th><th>Medicine</th></tr>' + mine.map(l => '<tr><td>' + l.day + '</td><td>' + KIT.find(k => k.id === l.med).name + (l.live ? ' <span class="chip">logged today</span>' : '') + '</td></tr>').join('') + '</table>' : '<p class="m-small">Nothing logged.</p>') + '</section>';
      return html + DEMO_NOTE;
    },

    /* ---------- CREW & BUDDY ---------- */
    crew: function () {
      const privacy = store.get('pranavyom.privacy', {}), mine = privacy[crew.id] || 'full';
      let html = identity('Crew & Buddy', 'How the crew is doing, your privacy choice, and a private way to look out for each other.');
      html += '<div class="m-crew">';
      D.crewList.forEach(c => {
        const ev = evaluate(c.id), p = privacy[c.id] || 'full', hidden = p === 'private' && ev.overall !== 'red', me = c.id === crew.id;
        const flags = buddyFlags(c.id).length;
        html += '<a class="m-mate' + (me ? ' is-me' : '') + '" href="astronaut.html?crew=' + c.id + '#home"><span class="m-mate__id">' + c.id + (me ? ' · you' : '') + '</span>' +
          '<b>' + esc(c.name) + '</b><small>' + esc(c.designation) + '</small>' +
          (hidden ? '<span class="chip">🔒 Private</span>' : '<span class="m-mate__score">' + (p === 'full' ? ev.score + ' · ' : '') + badge(ev.overall) + '</span>') +
          (flags ? '<span class="m-small m-yellow-text">● ' + flags + ' buddy flag' + (flags > 1 ? 's' : '') + '</span>' : '') + '</a>';
      });
      html += '</div><div class="m-grid2">' +
        '<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">My privacy</h2><p class="m-small">Choose what the commander can see about ' + esc(crew.name) + '. A Red status is always shared for safety.</p>' +
        [['full', 'Everything: score and status'], ['summary', 'Summary: status only'], ['private', 'Private: share only if something turns Red']]
          .map(o => '<label class="m-radio"><input type="radio" name="priv" value="' + o[0] + '"' + (mine === o[0] ? ' checked' : '') + '> ' + o[1] + '</label>').join('') + '</section>' +
        '<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">Buddy check</h2><p class="m-small">Worried about a crewmate? Flag it privately. They get a gentle "keep an eye" on Mind & Neuro; your name is not shown.</p>' +
        '<select class="m-select" id="buddyWho" aria-label="Crewmate">' + D.crewList.filter(c => c.id !== crew.id).map(c => '<option value="' + c.id + '">' + c.id + ' · ' + esc(c.name) + '</option>').join('') + '</select>' +
        '<input class="journal" id="buddyNote" maxlength="140" placeholder="What did you notice? (optional)" style="margin:10px 0">' +
        '<button class="cta" type="button" id="buddyGo">Send private flag</button></section></div>';
      return html + DEMO_NOTE;
    },

    /* ---------- REPORTS TO EARTH ---------- */
    reports: function () {
      const text = report(), bytes = new Blob([text]).size, outbox = store.get('pranavyom.outbox', []).filter(o => o.crew === crew.id);
      let html = identity('Reports to Earth', 'A short text brief for the Flight Surgeon. One-way signal delay today: about 8.5 minutes (simulated).');
      html += '<section class="m-card glow-card"><p class="m-small">Size: <b>' + bytes + ' bytes</b>, tiny enough for a deep-space link.</p>' +
        '<pre class="m-report" id="reportText">' + esc(text) + '</pre><div class="m-row" style="justify-content:flex-start;gap:10px">' +
        '<button class="pill-btn" type="button" id="copyReport">Copy</button><button class="cta" type="button" id="queueReport">☁ Queue for next comms window</button></div></section>' +
        '<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">Outbox</h2>' + (outbox.length ? '<table class="m-table"><tr><th>Queued</th><th>Size</th></tr>' +
          outbox.slice().reverse().map(o => '<tr><td>' + esc(o.at) + '</td><td>' + o.bytes + ' B</td></tr>').join('') + '</table>' : '<p class="m-small">Nothing queued yet.</p>') + '</section>';
      return html + DEMO_NOTE;
    }
  };

  /* Text report for Earth */
  function report() {
    const ev = evaluate(crew.id), rows = ev.rows.slice(-7);
    const avg = k => rows.reduce((a, r) => a + r[k], 0) / rows.length;
    const L = [];
    L.push('PRANAVYOM ZERO-GRAM · CLINICAL BRIEF (DEMONSTRATION DATA)');
    L.push(crew.id + ' · ' + crew.name + ' (' + crew.designation + ') · Mission day ' + DAY);
    L.push('Health score ' + ev.score + '/100 · ' + WORD[ev.overall] + (ev.live ? ' · includes today\'s live check-in' : ''));
    L.push('');
    L.push('BODY SYSTEMS');
    SYSTEMS.forEach(s => { const st = ev.sys[s.id]; L.push('- ' + s.name + ': ' + WORD[st.level] + (st.reasons.length ? ' — ' + st.reasons.map(r => r.detail).join('; ') : '')); });
    L.push('');
    L.push('7-DAY AVERAGES');
    L.push('- Sleep ' + fmt(avg('sleep'), 1) + ' h · Resting HR ' + fmt(avg('hr'), 0) + ' bpm · Reaction ' + fmt(avg('rt'), 0) + ' ms');
    L.push('- ARED ' + fmt(avg('ared'), 0) + '% of plan · Water ' + fmt(avg('water'), 1) + ' L · Mood ' + fmt(avg('mood'), 1) + '/5');
    L.push('- Career radiation ' + fmt(ev.cumDose, 0) + ' / 600 mSv');
    const meds = medLog().filter(l => l.crew === crew.id && l.day > DAY - 7);
    L.push('- Kit medicines: ' + (meds.length ? meds.map(l => 'D' + l.day + ' ' + KIT.find(k => k.id === l.med).name).join(', ') : 'none'));
    if (buddyFlags(crew.id).length) L.push('- Buddy-check flags: ' + buddyFlags(crew.id).length);
    if (ev.today.journal) L.push('- Journal: "' + ev.today.journal + '"');
    L.push('');
    L.push('Decision support only. Kit medicines per Flight Surgeon protocols.');
    return L.join('\n');
  }

  /* Hand-drawn SVG line chart with the personal normal band */
  function chart(key, rows) {
    const m = METRICS[key], b = baseFor(crew.id)[key];
    const vals = rows.map(r => r[key]);
    let band = null, redLine = null, target = m.yellowBelow !== undefined ? m.yellowBelow : m.yellowAtLeast !== undefined ? m.yellowAtLeast : m.yellowAbove;
    if (m.kind === 'z') { band = [b[0] - 1.5 * b[1], b[0] + 1.5 * b[1]]; redLine = m.bad === 'high' ? b[0] + 2.5 * b[1] : b[0] - 2.5 * b[1]; }
    const all = vals.concat(band || [], redLine !== null ? [redLine] : [], target !== undefined ? [target] : []);
    let lo = Math.min.apply(null, all), hi = Math.max.apply(null, all); const pad = (hi - lo) * .1 || 1; lo -= pad; hi += pad;
    const W = 860, H = 300, L = 56, R = 18, T = 16, B = 34;
    const X = i => L + i / (rows.length - 1) * (W - L - R), Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    let s = '<div class="m-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + m.label + ' over 30 days">';
    for (let i = 0; i <= 4; i++) { const v = lo + (hi - lo) * i / 4; s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="g"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + fmt(v, m.dp) + '</text>'; }
    rows.forEach((r, i) => { if (i % 5 === 0 || i === rows.length - 1) s += '<text x="' + X(i) + '" y="' + (H - 10) + '" text-anchor="middle">D' + r.day + '</text>'; });
    if (band) s += '<rect x="' + L + '" width="' + (W - L - R) + '" y="' + Y(band[1]) + '" height="' + (Y(band[0]) - Y(band[1])) + '" class="band"/>';
    if (redLine !== null) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(redLine) + '" y2="' + Y(redLine) + '" class="red"/>';
    if (target !== undefined) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(target) + '" y2="' + Y(target) + '" class="target"/>';
    s += '<polyline points="' + vals.map((v, i) => X(i) + ',' + Y(v)).join(' ') + '" class="line"/>';
    rows.forEach((r, i) => {
      const lv = metricStatus(crew.id, rows, key, i).level;
      s += '<circle cx="' + X(i) + '" cy="' + Y(r[key]) + '" r="' + (i === rows.length - 1 ? 6 : 3.5) + '" class="pt pt--' + lv + '"><title>Day ' + r.day + ': ' + fmt(r[key], m.dp) + ' ' + m.unit + ' · ' + WORD[lv] + '</title></circle>';
    });
    s += '</svg><div class="m-legend"><span><i class="l-line"></i>Daily value</span>' + (band ? '<span><i class="l-band"></i>Normal range (±1.5σ)</span><span><i class="l-red"></i>Red line (2.5σ)</span>' : '') +
      (target !== undefined ? '<span><i class="l-target"></i>Target / watch line</span>' : '') + '<span>● Today = big dot · hover a dot for its value</span></div>';
    const today = metricStatus(crew.id, rows, key);
    s += '<p class="m-small">Today: <b>' + fmt(today.value, m.dp) + ' ' + m.unit + '</b> ' + badge(today.level) + (band ? ' · Normal for ' + esc(crew.name) + ': ' + fmt(b[0], m.dp) + ' ± ' + fmt(b[1], m.dp) + ' ' + m.unit : '') + '</p></div>';
    return s;
  }

  /* ==========================================================
     6. NAVIGATION between screens (uses #home, #action …)
     ========================================================== */
  const NAMES = ['home', 'checkin', 'action', 'trends', 'pharmacy', 'crew', 'reports'];
  function show(name) {
    if (!NAMES.includes(name)) name = 'checkin';
    document.querySelectorAll('.side__item[data-view]').forEach(b => {
      const on = b.dataset.view === name;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (name === 'checkin') { checkinView.hidden = false; view.hidden = true; }
    else {
      checkinView.hidden = true; view.hidden = false;
      view.innerHTML = SCREENS[name]();
      wire(name);
    }
    window.scrollTo(0, 0);
  }
  function go(name) { if (location.hash === '#' + name) show(name); else location.hash = name; }
  document.querySelectorAll('.side__item[data-view]').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));

  /* Buttons inside the screens */
  function wire(name) {
    view.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    if (name === 'trends') document.getElementById('trendSel').addEventListener('change', e => { SCREENS.trendKey = e.target.value; show('trends'); });
    view.querySelectorAll('[data-take]').forEach(b => b.addEventListener('click', () => {
      const log = store.get('pranavyom.medlog', []); log.push({ day: DAY, crew: crew.id, med: b.dataset.take, live: true });
      store.set('pranavyom.medlog', log); toast('Logged. Pharmacy stock updated.'); show(name);
    }));
    view.querySelectorAll('[data-check]').forEach(b => b.addEventListener('click', () => {
      const k = KIT.find(x => x.id === b.dataset.check), chk = safety(k.id);
      document.getElementById('safetyOut').innerHTML = '<div class="m-safebox m-safebox--' + (chk.blocked ? 'red' : chk.notes.length ? 'yellow' : 'green') + '"><b>' + k.name + ' for ' + esc(crew.name) + ':</b> ' +
        (chk.blocked ? 'Do not use.' : chk.notes.length ? 'Use with caution.' : 'No allergies or interactions found.') +
        (chk.notes.length ? '<ul>' + chk.notes.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul>' : '') + '<small>Dose as printed on protocol card ' + k.card + '. Decision support only.</small></div>';
    }));
    view.querySelectorAll('input[name=priv]').forEach(r => r.addEventListener('change', () => {
      const p = store.get('pranavyom.privacy', {}); p[crew.id] = r.value; store.set('pranavyom.privacy', p); toast('Privacy saved'); show('crew');
    }));
    const bg = document.getElementById('buddyGo');
    if (bg) bg.addEventListener('click', () => {
      const flags = store.get('pranavyom.buddy', []);
      flags.push({ day: DAY, about: document.getElementById('buddyWho').value, note: document.getElementById('buddyNote').value.trim() });
      store.set('pranavyom.buddy', flags); toast('Flag sent privately'); show('crew');
    });
    const cp = document.getElementById('copyReport');
    if (cp) cp.addEventListener('click', () => {
      const text = document.getElementById('reportText').textContent;
      const fallback = () => { const r = document.createRange(); r.selectNodeContents(document.getElementById('reportText')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Selected: press Ctrl+C'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast('Copied'), fallback); else fallback();
    });
    const qr = document.getElementById('queueReport');
    if (qr) qr.addEventListener('click', () => {
      const o = store.get('pranavyom.outbox', []); o.push({ crew: crew.id, at: new Date().toLocaleString(), bytes: new Blob([report()]).size });
      store.set('pranavyom.outbox', o); toast('Queued for the next comms window'); show('reports');
    });
  }

  show(location.hash.slice(1) || 'checkin');
})();