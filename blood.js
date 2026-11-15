/* PRANAVYOM ZERO-GRAM · blood.js
   "Blood Tests" sidebar screen. Space anaemia: the body destroys more red
   blood cells in weightlessness, so the crew does a blood test every 30 days.
   Reminds when a test is due and keeps each astronaut's reports.
   All reports are FICTIONAL demo data unless the astronaut adds their own. */
'use strict';
const BLOOD_EVERY = 30;
const BLOOD_KEY = 'pranavyom.blood.' + crew.id;
const BLOOD_FIELDS = [
{ k: 'hb', label: 'Haemoglobin', unit: 'g/dL', dp: 1, normal: '13.0–17.0', lvl: v => v < 12 ? 'red' : v < 13 ? 'yellow' : 'green' },
{ k: 'hct', label: 'Haematocrit', unit: '%', dp: 1, normal: '39–50', lvl: v => v < 36 ? 'red' : v < 39 ? 'yellow' : 'green' },
{ k: 'rbc', label: 'Red blood cells', unit: '×10¹²/L', dp: 2, normal: '4.2–5.8', lvl: v => v < 3.9 ? 'red' : v < 4.2 ? 'yellow' : 'green' },
{ k: 'retic', label: 'Reticulocytes', unit: '%', dp: 1, normal: '0.5–2.5', lvl: v => v > 3.5 ? 'red' : (v > 2.5 || v < 0.5) ? 'yellow' : 'green' },
{ k: 'ferritin', label: 'Ferritin (iron store)', unit: 'ng/mL', dp: 0, normal: '30–300', lvl: v => (v < 15 || v > 500) ? 'red' : (v < 30 || v > 300) ? 'yellow' : 'green' }
];
/* Fictional history: pre-flight test, then every 30 days. Some crew are overdue, some develop anaemia. */
function bloodHistory(id) {
const n = parseInt(id.slice(5), 10), overdue = n % 4 === 1, anaemic = ['CREW-03', 'CREW-07', 'CREW-14'].includes(id);
const hb0 = 13.4 + (n * 37 % 21) / 10, days = overdue ? [-30, 2] : [-30, 4, 32];
return days.map((d, i) => {
const drop = i === 0 ? 0 : (anaemic ? 0.9 : 0.35) * i + (n % 3) * 0.1;
const hb = hb0 - drop;
return { day: d, demo: true, hb: hb, hct: hb * 2.95, rbc: hb / 3.05, retic: 1.1 + i * (anaemic ? 0.7 : 0.25), ferritin: 90 + n * 6 + i * (anaemic ? 70 : 35) };
});
}
function bloodReports(id) {
let own = [];
if (id === crew.id) { try { own = JSON.parse(localStorage.getItem(BLOOD_KEY) || '[]'); } catch (e) { own = []; } }
return bloodHistory(id).concat(own).sort((a, b) => a.day - b.day);
}
function bloodStatus(id) {
const list = bloodReports(id), last = list[list.length - 1], since = DAY - last.day, next = last.day + BLOOD_EVERY;
const flags = BLOOD_FIELDS.map(f => f.lvl(last[f.k])), level = flags.reduce(worse, 'green');
return { list, last, since, next, due: since >= BLOOD_EVERY, level };
}
function bloodChart(list) {
const W = 860, H = 220, L = 46, R = 18, T = 14, B = 30, lo = 10, hi = 18;
const X = i => L + (list.length === 1 ? 0.5 : i / (list.length - 1)) * (W - L - R), Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
let s = '<div class="m-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Haemoglobin at each blood test">' +
'<rect x="' + L + '" width="' + (W - L - R) + '" y="' + Y(17) + '" height="' + (Y(13) - Y(17)) + '" class="band"/>' +
'<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(12) + '" y2="' + Y(12) + '" class="red"/>';
[10, 12, 14, 16, 18].forEach(v => { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="g"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>'; });
s += '<polyline points="' + list.map((r, i) => X(i) + ',' + Y(r.hb)).join(' ') + '" class="line"/>';
list.forEach((r, i) => { s += '<circle cx="' + X(i) + '" cy="' + Y(r.hb) + '" r="6" class="pt pt--' + BLOOD_FIELDS[0].lvl(r.hb) + '"><title>' + (r.day < 0 ? 'Pre-flight' : 'Day ' + r.day) + ': ' + r.hb.toFixed(1) + ' g/dL</title></circle>' +
'<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + (r.day < 0 ? 'Pre-flight' : 'D' + r.day) + '</text>'; });
return s + '</svg><div class="m-legend"><span><i class="l-line"></i>Haemoglobin (g/dL)</span><span><i class="l-band"></i>Normal 13–17</span><span><i class="l-red"></i>Anaemia line 12</span></div></div>';
}
SCREENS.blood = function () {
const st = bloodStatus(crew.id), first = st.list[0];
const when = st.due ? '<b class="m-red-text">Overdue by ' + (st.since - BLOOD_EVERY) + ' day' + (st.since - BLOOD_EVERY === 1 ? '' : 's') + '</b>' : 'Next test on <b>day ' + st.next + '</b> (in ' + (st.next - DAY) + ' days)';
let html = identity('Blood Tests', 'Space anaemia check every ' + BLOOD_EVERY + ' days. Weightlessness destroys red blood cells faster, so we watch haemoglobin closely.');
html += '<div class="m-grid3">' +
'<div class="m-card glow-card"><p class="m-label">Blood test schedule</p><p class="m-big" style="font-size:2rem">' + (st.due ? 'Due now' : 'On track') + '</p>' + badge(st.due ? 'red' : 'green').replace(st.due ? 'Act now' : 'All good', st.due ? 'Test due' : 'Up to date') +
'<p class="m-small">Last test: ' + (st.last.day < 0 ? 'pre-flight' : 'day ' + st.last.day) + ' (' + st.since + ' days ago). ' + when + '.</p><button class="cta" type="button" id="bloodAddBtn">+ Add today\'s report</button></div>' +
'<div class="m-card glow-card"><p class="m-label">Latest haemoglobin</p><p class="m-big m-' + BLOOD_FIELDS[0].lvl(st.last.hb) + '-text">' + st.last.hb.toFixed(1) + '<span> g/dL</span></p>' + badge(BLOOD_FIELDS[0].lvl(st.last.hb)) +
'<p class="m-small">Pre-flight ' + first.hb.toFixed(1) + ' g/dL · change ' + (st.last.hb - first.hb).toFixed(1) + ' g/dL</p></div>' +
'<div class="m-card glow-card"><p class="m-label">Anaemia risk</p><p class="m-big" style="font-size:2rem">' + { green: 'Low', yellow: 'Watch', red: 'High' }[st.level] + '</p>' + badge(st.level) +
'<p class="m-small">Based on all five values of the latest report.</p></div></div>';
html += '<section class="m-card glow-card" id="bloodForm" hidden><h2 class="m-h2" style="margin-top:0">Add a blood report <small>(onboard blood analyser · day ' + DAY + ')</small></h2>' +
'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">' +
BLOOD_FIELDS.map(f => '<label class="m-small">' + f.label + ' (' + f.unit + ')<input class="m-select" style="width:100%;margin-top:4px" type="number" step="any" data-blood="' + f.k + '" placeholder="normal ' + f.normal + '"></label>').join('') +
'</div><div class="m-row" style="justify-content:flex-start;gap:10px;margin-top:12px"><button class="cta" type="button" id="bloodSave">Save report</button><button class="ghost-btn" type="button" id="bloodCancel">Cancel</button></div></section>';
html += '<section class="m-card glow-card"><h2 class="m-h2" style="margin:0 0 6px">Haemoglobin trend</h2>' + bloodChart(st.list) + '</section>';
html += '<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">All reports</h2><div class="m-table-wrap"><table class="m-table"><thead><tr><th>Test</th>' +
BLOOD_FIELDS.map(f => '<th>' + f.label + '<br><small>' + f.unit + ' · normal ' + f.normal + '</small></th>').join('') + '</tr></thead><tbody>' +
st.list.slice().reverse().map(r => '<tr><td><b>' + (r.day < 0 ? 'Pre-flight' : 'Day ' + r.day) + '</b>' + (r.demo ? '' : ' <span class="chip">added</span>') + '</td>' +
BLOOD_FIELDS.map(f => '<td class="m-' + f.lvl(r[f.k]) + '-text">' + Number(r[f.k]).toFixed(f.dp) + '</td>').join('') + '</tr>').join('') +
'</tbody></table></div><p class="m-small">Low haemoglobin, haematocrit or red cells = anaemia. High reticulocytes = the body is making new red cells to catch up. Ferritin often rises in space as iron from destroyed cells is stored. Decision support only: the Medical Officer reviews every report.</p></section>';
html += '<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">If anaemia is found</h2><ul class="m-notes" style="font-size:.9rem">' +
'<li>Eat iron- and protein-rich meals; vitamin C with meals helps iron absorption.</li><li>Avoid hard exercise or a spacewalk until the Medical Officer agrees.</li>' +
'<li>Report dizziness, breathlessness or a fast heartbeat straight away.</li><li>Repeat the blood test in 7 days instead of 30.</li></ul></section>';
return html + DEMO_NOTE;
};
function wireBlood() {
const form = document.getElementById('bloodForm'), add = document.getElementById('bloodAddBtn');
if (!form) return;
add.addEventListener('click', function () { form.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
document.getElementById('bloodCancel').addEventListener('click', function () { form.hidden = true; });
document.getElementById('bloodSave').addEventListener('click', function () {
const rec = { day: DAY, demo: false };
for (const f of BLOOD_FIELDS) {
const v = parseFloat(form.querySelector('[data-blood="' + f.k + '"]').value);
if (isNaN(v) || v <= 0) { toast('Please fill in ' + f.label); return; }
rec[f.k] = v;
}
let own = []; try { own = JSON.parse(localStorage.getItem(BLOOD_KEY) || '[]'); } catch (e) { own = []; }
own.push(rec); try { localStorage.setItem(BLOOD_KEY, JSON.stringify(own)); } catch (e) { /* ignore */ }
toast('Blood report saved'); markBloodSidebar(); show('blood');
});
}
/* Sidebar item (after Smart Pharmacy) with a red "due" dot when a test is due */
NAMES.push('blood');
function markBloodSidebar() {
const b = document.querySelector('[data-view="blood"]'); if (!b) return;
const due = bloodStatus(crew.id).due;
b.innerHTML = '<span aria-hidden="true">🩸</span> Blood Tests' + (due ? ' <span style="margin-left:auto;background:#e5484d;color:#fff;border-radius:999px;padding:1px 8px;font-size:.7rem;font-weight:700">DUE</span>' : '');
}
(function () {
const nav = document.querySelector('.side__nav'); if (!nav || nav.querySelector('[data-view="blood"]')) return;
const b = document.createElement('button');
b.className = 'side__item'; b.type = 'button'; b.dataset.view = 'blood';
nav.insertBefore(b, nav.querySelector('[data-view="crew"]'));
b.addEventListener('click', function () { go('blood'); });
markBloodSidebar();
})();
const bloodWire = wire;
wire = function (name) { bloodWire(name); if (name === 'blood') wireBlood(); };
/* Reminder: once a day, if the 30-day blood test is due */
setTimeout(function () {
const st = bloodStatus(crew.id), key = 'pranavyom.bloodReminded.' + crew.id, today = new Date().toDateString();
let seen = ''; try { seen = localStorage.getItem(key) || ''; } catch (e) { /* ignore */ }
if (!st.due || seen === today || typeof alarm !== 'function') return;
try { localStorage.setItem(key, today); } catch (e) { /* ignore */ }
alarm('Blood test due', crew.name + ', your 30-day anaemia check is ' + (st.since - BLOOD_EVERY) + ' day(s) overdue. Last test: day ' + st.last.day + '.', 'blood', 20);
}, 4000);
/* Add the latest blood result to the Action Center and the report to Earth */
const actionScreen = SCREENS.action;
SCREENS.action = function () {
const st = bloodStatus(crew.id);
if (st.level === 'green' && !st.due) return actionScreen();
const extra = '<section class="m-action glow-card m-action--' + (st.level === 'red' ? 'red' : 'yellow') + '"><div class="m-action__head"><h2>🩸 Blood (anaemia watch)</h2>' + badge(st.level === 'green' ? 'yellow' : st.level) + '</div>' +
'<h3>What we noticed</h3><ul><li>' + (st.due ? '<b>Your 30-day blood test is due.</b> ' : '') + 'Latest haemoglobin ' + st.last.hb.toFixed(1) + ' g/dL (normal 13–17).</li></ul>' +
'<h3>What to do</h3><ul><li>' + (st.due ? 'Do the blood test today and add the report in Blood Tests.' : 'Iron- and protein-rich meals; repeat the test in 7 days.') + '</li><li>Tell the Medical Officer about dizziness or breathlessness.</li></ul>' +
'<button class="cta" type="button" data-go="blood">Open Blood Tests →</button></section>';
return actionScreen().replace(DEMO_NOTE, extra + DEMO_NOTE);
};
const reportText = report;
report = function () {
const st = bloodStatus(crew.id);
return reportText().replace('\n\nDecision support only', '\n- Blood (' + (st.last.day < 0 ? 'pre-flight' : 'day ' + st.last.day) + '): Hb ' + st.last.hb.toFixed(1) + ' g/dL, Hct ' + st.last.hct.toFixed(1) + ' %, ferritin ' + Math.round(st.last.ferritin) + ' ng/mL' + (st.due ? ' · NEXT TEST OVERDUE' : '') + '\n\nDecision support only');
};