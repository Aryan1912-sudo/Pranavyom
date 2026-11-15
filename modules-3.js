/* PRANAVYOM ZERO-GRAM · sidebar modules, part 3 of 3 (last file)
   All six screens + sidebar navigation. FICTIONAL demo data. */
'use strict';
const SCREENS = {
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
'<p class="m-small">' + 'Weighted across 7 body systems' + (n ? ', lowered because ' + n + (n === 1 ? ' needs' : ' need') + ' attention.' : '.') + '</p></div>' +
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
trends: function () {
const key = SCREENS.trendKey || mostNotable();
const opts = SYSTEMS.map(s => '<optgroup label="' + s.name + '">' + Object.keys(METRICS).filter(k => METRICS[k].sys === s.id)
.map(k => '<option value="' + k + '"' + (k === key ? ' selected' : '') + '>' + METRICS[k].label + '</option>').join('') + '</optgroup>').join('');
const m = METRICS[key], rows = series(crew.id);
let html = identity('Health Trends', 'The last 30 days for ' + esc(crew.name) + ', compared with their own normal range.');
html += '<section class="m-card glow-card"><div class="m-row"><h2 class="m-h2" style="margin:0">' + m.label + ' <small>(' + m.unit + ' · ' + m.src + ')</small></h2>' +
'<select class="m-select" id="trendSel" aria-label="Choose a measure">' + opts + '</select></div>' + chart(key, rows) + '</section>';
return html + DEMO_NOTE;
}
};
SCREENS.pharmacy = function () {
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
};
SCREENS.crew = function () {
const privacy = store.get('pranavyom.privacy', {}), mine = privacy[crew.id] || 'full';
let html = identity('Crew & Buddy', 'How the crew is doing, your privacy choice, and a private way to look out for each other.');
html += '<div class="m-crew">';
D.crewList.forEach(c => {
const ev = evaluate(c.id), p = privacy[c.id] || 'full', hidden = p === 'private' && ev.overall !== 'red', me = c.id === crew.id;
const flags = buddyFlags(c.id).length;
html += '<a class="m-mate' + (me ? ' is-me' : '') + '" href="astronaut.html?crew=' + c.id + '#' + 'home"><span class="m-mate__id">' + c.id + (me ? ' · you' : '') + '</span>' +
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
};
SCREENS.reports = function () {
const text = report(), bytes = new Blob([text]).size, outbox = store.get('pranavyom.outbox', []).filter(o => o.crew === crew.id);
let html = identity('Reports to Earth', 'A short text brief for the Flight Surgeon. One-way signal delay today: about 8.5 minutes (simulated).');
html += '<section class="m-card glow-card"><p class="m-small">Size: <b>' + bytes + ' bytes</b>, tiny enough for a deep-space link.</p>' +
'<pre class="m-report" id="reportText">' + esc(text) + '</pre><div class="m-row" style="justify-content:flex-start;gap:10px">' +
'<button class="pill-btn" type="button" id="copyReport">Copy</button><button class="cta" type="button" id="queueReport">☁ Queue for next comms window</button></div></section>' +
'<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">Outbox</h2>' + (outbox.length ? '<table class="m-table"><tr><th>Queued</th><th>Size</th></tr>' +
outbox.slice().reverse().map(o => '<tr><td>' + esc(o.at) + '</td><td>' + o.bytes + ' B</td></tr>').join('') + '</table>' : '<p class="m-small">Nothing queued yet.</p>') + '</section>';
return html + DEMO_NOTE;
};
function mostNotable() {
const rows = series(crew.id); let best = 'rt', bestScore = -1;
Object.keys(METRICS).forEach(k => {
const st = metricStatus(crew.id, rows, k), m = METRICS[k];
let s = st.level === 'red' ? 10 : st.level === 'yellow' ? 5 : 0;
if (st.z !== undefined) s += Math.max(0, m.bad === 'high' ? st.z : -st.z);
if (s > bestScore) { bestScore = s; best = k; }
});
return best;
}
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
document.addEventListener('deck:submitted', () => { /* fresh results are used next time a screen opens */ });
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