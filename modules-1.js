/* ==========================================================
   PRANAVYOM ZERO-GRAM — sidebar modules, part 1 of 3
   Data, fictional history and the traffic-light evaluation
   Loaded by modules.js in this order: modules-1.js,
   modules-2.js, modules-3.js. All history is FICTIONAL demo data.
   ========================================================== */

'use strict';

const D = window.PZDeck;
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
/* Each astronaut's own fictional "normal" (pre-flight baseline: mean, spread) */
function baseFor(id) {
  const n = parseInt(id.slice(5), 10);
  const pick = (list) => list[(n - 1) % list.length];
  return {
    hr:     [pick([58, 64, 55, 61, 67, 59, 52, 63, 57, 66, 60, 62, 54, 65, 56, 68]), 2.5],
    spo2:   [pick([98.2, 97.9, 98.4, 98.0, 97.6, 98.3, 98.1, 98.5, 97.8, 98.2, 97.7, 98.0, 98.4, 97.9, 98.3, 97.8]), 0.4],
    sleep:  [pick([7.2, 6.9, 7.5, 7.0, 7.7, 7.1, 6.8, 7.4, 7.3, 6.9, 7.6, 7.0, 7.2, 7.5, 6.8, 7.1]), 0.5],
    energy: [pick([4.1, 3.8, 4.2, 3.9, 4.3, 3.7, 4.0, 4.4, 3.9, 4.0, 4.2, 3.8, 4.1, 3.6, 4.3, 3.9]), 0.35],
    rt:     [pick([242, 268, 251, 285, 233, 259, 247, 226, 271, 255, 238, 262, 279, 244, 230, 266]), 22],
    span:   [pick([7, 6, 7, 6, 7, 6, 6, 7, 6, 7, 6, 6, 7, 6, 7, 6]), 0.8],
    mood:   [pick([4.2, 3.9, 4.0, 4.3, 4.1, 3.8, 4.4, 4.0, 3.9, 4.2, 4.1, 3.7, 4.3, 4.0, 4.2, 3.9]), 0.35],
    stress: [pick([2.0, 2.3, 1.8, 2.1, 1.7, 2.4, 1.9, 1.6, 2.2, 2.0, 1.8, 2.3, 2.1, 1.9, 1.7, 2.2]), 0.35],
    drift:  [pick([2.2, 2.6, 1.9, 2.4, 2.0, 2.8, 2.3, 1.8, 2.5, 2.1, 2.7, 2.4, 2.0, 2.9, 2.2, 2.5]), 0.7]
  };
}

/* A different fictional health story for every astronaut.
   metric: [day it starts, where it ends up by day 34]
   (for heart rate, sleep etc. the second number is σ away from their normal) */
const STORIES = {
  'CREW-01': { stress: [28, 1.0] },                                          // Arjun: commander's workload
  'CREW-02': { hr: [27, 1.9], sleep: [30, -0.9] },                           // Elena: heart rate creeping up
  'CREW-03': { sleep: [29, -2.2], rt: [29, 2.1], energy: [29, -1.7], stress: [29, 1.9] },   // Priya: sleep debt
  'CREW-04': { mood: [26, -1.8], stress: [28, 1.5] },                        // Kwame: low mood, isolation
  'CREW-05': { amsler: [33, 2], contrast: [31, 50] },                        // Sofia: early SANS signs
  'CREW-06': { spo2: [31, -2.8], hr: [31, 1.2] },                            // Hiroshi: oxygen dipping
  'CREW-07': { energy: [27, -1.6], sleep: [28, -1.1] },                      // Amara: tired
  'CREW-08': {},                                                            // Lucas: all good
  'CREW-09': { rt: [28, 1.8], span: [30, -1.3] },                            // Zara: slower thinking
  'CREW-10': { stress: [26, 2.7], mood: [29, -1.4], sleep: [30, -1.0] },     // Daniel: high stress
  'CREW-11': { span: [27, -1.7], energy: [31, -0.8] },                       // Inês: memory dip
  'CREW-12': { hr: [29, 1.7], drift: [29, 1.5], ared: [29, 32], water: [31, 1.6], urine: [32, 4] },   // Rohan: skipped workouts
  'CREW-13': { dose: [32, 3.6] },                                           // Grace: solar-particle event
  'CREW-14': { drift: [27, 1.9], ared: [28, 68] },                           // Mateo: muscle loss
  'CREW-15': { water: [29, 1.8], urine: [30, 4] },                           // Naledi: dehydrated
  'CREW-16': { hr: [30, 1.3], sleep: [29, -1.4], energy: [30, -1.0] }        // Samuel: slight fatigue
};
function story(id, day, key) {
  const s = (STORIES[id] || {})[key];
  if (!s || day < s[0]) return 0;
  return s[1] * Math.min(1, (day - s[0] + 1) / (DAY - s[0] + 1));          // grows a little each day
}
function ruleValue(id, day, key, normal) {
  const s = (STORIES[id] || {})[key];
  if (!s || day < s[0]) return normal;
  if (key === 'amsler' || key === 'urine') return s[1];
  return normal + (s[1] - normal) * Math.min(1, (day - s[0] + 1) / (DAY - s[0] + 1));
}
const historyCache = {};
function crewHistory(id) {
  if (historyCache[id]) return historyCache[id];
  const n = parseInt(id.slice(5), 10);
  const r = rng(n * 9973), g = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const wobble = 0.3 + (n % 5) * 0.08;                                       // some astronauts are steadier than others
  const b = baseFor(id), rows = [];
  for (let d = FIRST; d <= DAY; d++) {
    const row = { day: d, demo: true, symptoms: [] };
    Object.keys(b).forEach(k => { const off = story(id, d, k); row[k] = b[k][0] + b[k][1] * ((off ? 0.25 : wobble) * g() + off); });
    row.rt = Math.round(row.rt); row.span = Math.round(row.span);
    row.mood = Math.min(5, Math.max(1, row.mood)); row.stress = Math.min(5, Math.max(1, row.stress)); row.energy = Math.min(5, Math.max(1, row.energy));
    row.spo2 = Math.min(100, row.spo2);
    row.contrast = ruleValue(id, d, 'contrast', 10);
    row.amsler = ruleValue(id, d, 'amsler', 0);
    row.ared = ruleValue(id, d, 'ared', 86 + r() * 16);
    row.water = ruleValue(id, d, 'water', 2.3 + r() * 0.6);
    row.urine = ruleValue(id, d, 'urine', r() < .75 ? 2 : 1);
    row.dose = ruleValue(id, d, 'dose', 1.5 + (n % 4) * 0.12 + r() * 0.2);
    rows.push(row);
  }
  historyCache[id] = rows;
  return rows;
}
/* Today's live check-in (if submitted) replaces the demo values for day 34 */
function latestRecord(id) { const list = store.get('pranavyom.records.' + id, []).filter(r => r && r.results && r.recordedAt); return list.length ? list[list.length - 1] : null; }
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
  const rows = crewHistory(id).map(r => Object.assign({}, r));
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
  // each body system scores 0–100: the further its worst measure is from normal, the lower
  const sysPts = {}; SYSTEMS.forEach(s => { sysPts[s.id] = 100; });
  Object.keys(METRICS).forEach(k => {
    const st = metricStatus(id, rows, k), m = METRICS[k];
    let p;
    if (st.z !== undefined) {
      const bz = Math.max(0, m.bad === 'high' ? st.z : -st.z);
      p = st.level === 'red' ? 30 : bz < 1.5 ? 100 - bz * 12 : 82 - (bz - 1.5) * 40;   // smooth slide from 100 down
    } else p = st.level === 'red' ? 30 : st.level === 'yellow' ? 58 : 100;
    sysPts[m.sys] = Math.min(sysPts[m.sys], p);
  });
  SYSTEMS.forEach(s => { sysPts[s.id] -= Math.max(0, sys[s.id].reasons.length - 1) * 6; });   // several warnings = lower
  let raw = 0;
  SYSTEMS.forEach(s => { raw += s.weight * sysPts[s.id]; });
  raw = Math.round(raw);
  const levels = SYSTEMS.map(s => sys[s.id].level);
  const nYellow = levels.filter(l => l === 'yellow').length, nRed = levels.filter(l => l === 'red').length;
  const cap = nRed ? 49 : nYellow ? 89 : 100;                                // a Yellow or Red system always pulls the score down
  const score = Math.max(5, Math.min(Math.round(raw - nYellow * 9 - nRed * 15), cap));
  return { rows, today, sys, score: score, raw, cap, overall: levels.reduce(worse, 'green'), cumDose: cum, live: !!today.live };
}