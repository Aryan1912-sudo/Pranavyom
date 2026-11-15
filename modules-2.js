/* PRANAVYOM ZERO-GRAM · sidebar modules, part 2 of 3
   Shared pieces: badges, pharmacy kit, action plans, report, charts,
   health-score history and Earth-return readiness. FICTIONAL demo data. */
'use strict';
const WORD = { green: 'All good', yellow: 'Keep an eye', red: 'Act now' };
const badge = l => '<span class="m-status m-' + l + '"><i></i>' + WORD[l] + '</span>';
const cmo = crew.id === 'CREW-04' ? 'Commander Arjun Mehta' : 'Dr. Kwame Mensah, Medical Officer';
function identity(title, sub) {
return '<section class="m-hero glow-card"><div><p class="battery__id">' + crew.id + '</p>' +
'<h1 class="battery__name">' + esc(crew.name) + '</h1><p class="battery__role">' + esc(crew.designation) + '</p></div>' +
'<div class="m-hero__title"><p class="battery__kicker">' + title + '</p><p class="m-hero__sub">' + sub + '</p></div></section>';
}
const DEMO_NOTE = '<p class="demo-note">Fictional demonstration data for ' + esc(crew.name) + '. Not real medical measurements.</p>';
const ALLERGIES = { 'CREW-04': ['NSAID'], 'CREW-11': ['NSAID'], 'CREW-07': ['Penicillin'] };
const KIT = [
{ id: 'melatonin',    name: 'Melatonin',               use: 'Sleep / body-clock reset',          qty: 90,  shelf: 540,  card: 'S-1' },
{ id: 'promethazine', name: 'Promethazine',            use: 'Space motion sickness',             qty: 24,  shelf: 420,  card: 'N-1' },
{ id: 'ibuprofen',    name: 'Ibuprofen',               use: 'Back pain, inflammation',           qty: 120, shelf: 720,  card: 'P-1', tags: ['NSAID'] },
{ id: 'paracetamol',  name: 'Paracetamol',             use: 'Pain, fever',                       qty: 120, shelf: 720,  card: 'P-2' },
{ id: 'valacyclovir', name: 'Valacyclovir',            use: 'Cold sores, shingles (antiviral)',  qty: 42,  shelf: 600,  card: 'I-1' },
{ id: 'salt',         name: 'Electrolyte / salt tablets', use: 'Hydration, dizziness on standing', qty: 150, shelf: 900, card: 'C-2' },
{ id: 'kcitrate',     name: 'Potassium citrate',       use: 'Kidney-stone prevention',           qty: 60,  shelf: 720,  card: 'R-1' },
{ id: 'alendronate',  name: 'Alendronate',             use: 'Bone loss (weekly, with exercise)', qty: 80,  shelf: 720,  card: 'B-1' },
{ id: 'oxygen',       name: 'Supplemental oxygen mask',use: 'Low blood oxygen emergency',        qty: 4,   shelf: 1800, card: 'C-4' },
{ id: 'ondansetron',  name: 'Ondansetron',             use: 'Nausea, vomiting',                  qty: 30,  shelf: 540,  card: 'N-2' },
{ id: 'pseudoephedrine', name: 'Pseudoephedrine',      use: 'Stuffy nose, head fullness',        qty: 40,  shelf: 600,  card: 'C-3' },
{ id: 'loratadine',   name: 'Loratadine',              use: 'Allergy, itchy eyes, rash',         qty: 60,  shelf: 720,  card: 'I-2' },
{ id: 'amoxicillin',  name: 'Amoxicillin',             use: 'Bacterial infection (antibiotic)',  qty: 42,  shelf: 400,  card: 'I-3', tags: ['Penicillin'] },
{ id: 'zolpidem',     name: 'Zolpidem',                use: 'Short-term sleep aid',              qty: 30,  shelf: 720,  card: 'S-2' },
{ id: 'eyedrops',     name: 'Lubricating eye drops',   use: 'Dry or tired eyes',                 qty: 20,  shelf: 365,  card: 'E-1' }
];
const PLANNED_DAYS = 450;
function medLog() {
const seeded = [];
[30, 31, 32, 33].forEach(d => seeded.push({ day: d, crew: 'CREW-03', med: 'melatonin' }));
[8, 15, 22, 29].forEach(d => seeded.push({ day: d, crew: 'ALL', med: 'alendronate', count: 16 }));
[12, 26].forEach(d => seeded.push({ day: d, crew: 'CREW-01', med: 'ibuprofen' }));
[31, 32, 33].forEach(d => seeded.push({ day: d, crew: 'CREW-10', med: 'zolpidem' }));
[20, 27, 33].forEach(d => seeded.push({ day: d, crew: 'CREW-05', med: 'eyedrops', count: 2 }));
return seeded.concat(store.get('pranavyom.medlog', []).filter(l => l && KIT.some(k => k.id === l.med)));
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
if (['melatonin', 'promethazine', 'zolpidem'].includes(medId)) out.notes.push('Causes drowsiness: no spacewalk or precision tasks until it wears off.');
if (medId === 'ibuprofen' && (t.water < 2 || t.urine >= 4)) out.notes.push('Low fluids: ibuprofen can strain the kidneys. Paracetamol is the safer choice.');
if (medId === 'pseudoephedrine' && evaluate(crew.id).sys.heart.level !== 'green') out.notes.push('Raises heart rate and blood pressure: heart is not at All good today, so ask the Medical Officer first.');
if (medId === 'zolpidem') out.notes.push('Short-term use only (max 3 nights in a row). Not within 8 hours of waking duty.');
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
eyes:      { steps: ['Repeat the Amsler grid tonight', 'Use adjustable-focus glasses if reading is blurry', 'Do the thigh-cuff session as scheduled', 'Avoid long head-down posture'], meds: ['eyedrops', 'pseudoephedrine'],
none: 'No drug treats SANS itself: these only ease symptoms. Monitoring and fluid-shift countermeasures come first.', help: 'Sudden vision loss or a worsening grid: eye exam by ' + cmo + ' and report to Earth today.' },
immune:    { steps: ['Sleep 8 hours tonight', 'Lower workload and stress today', 'Wash hands; clean shared surfaces', 'Check temperature twice today'], meds: ['valacyclovir', 'paracetamol', 'amoxicillin'],
help: 'Fever over 38 °C for a day or a spreading rash: exam by ' + cmo + ' and report to Earth.' },
sleep:     { steps: ['Fixed lights-out tonight; aim for 8 hours', 'Amber cabin light 2 hours before sleep', 'Eye mask and earplugs; check fan noise', 'Do demanding tasks in the afternoon'], meds: ['melatonin', 'zolpidem'],
help: 'Under 5 hours for 3 nights or reaction time at Red: schedule review with ' + cmo + '.' },
bone:      { steps: ['Complete today\'s ARED resistance session', 'Water target 2.5–3 L', 'Take vitamin D and calcium', 'Protein with every meal'], meds: ['kcitrate', 'alendronate', 'paracetamol'],
help: 'Flank pain with blood in urine, or a fall with bone pain: exam by ' + cmo + ' and report to Earth.' }
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