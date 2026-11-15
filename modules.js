/* ==========================================================
   PRANAVYOM ZERO-GRAM — sidebar modules loader
   1. Loads modules-1.js, modules-2.js, modules-3.js in order
   2. Shows any problem in a yellow box on the page itself
   3. Extra views: health-score graph, Earth-return readiness table,
      today's reminders table, end-of-day buzzer and tap sounds
      (these run later, once modules-1/2/3 have loaded)
   ========================================================== */
(function () {
'use strict';
function problem(msg) {
let box = document.getElementById('pzProblem');
if (!box) {
box = document.createElement('div');
box.id = 'pzProblem';
box.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;background:#151515;color:#fff;' +
'border:2px solid #F5C518;border-radius:12px;padding:14px 16px;font:14px/1.5 Inter,Arial,sans-serif';
document.body.appendChild(box);
}
box.innerHTML += '<div>⚠ ' + String(msg).replace(/</g, '&lt;') + '</div>';
}
window.addEventListener('error', function (e) {
problem((e.filename ? e.filename.split('/').pop() + ' line ' + e.lineno + ': ' : '') + e.message);
});
const v = Date.now();
['modules-1.js', 'modules-2.js', 'modules-3.js'].reduce(function (ready, src) {
return ready.then(function () {
return new Promise(function (done, fail) {
const s = document.createElement('script');
s.src = src + '?v=' + v;
s.onload = done;
s.onerror = function () { problem('Could not find ' + src + '. It must be in the same folder as astronaut.html, named exactly ' + src); fail(); };
document.body.appendChild(s);
});
});
}, Promise.resolve()).then(function () { addExtras(); }).catch(function () { /* already shown on screen */ });
})();
function scoreHistory(id) {
const full = series, out = [];
try {
for (let i = 0; i < 30; i++) { series = function (x) { return full(x).slice(0, i + 1); }; out.push({ day: FIRST + i, score: evaluate(id).score }); }
} finally { series = full; }
return out;
}
function healthChart(id) {
const pts = scoreHistory(id), W = 860, H = 240, L = 46, R = 18, T = 14, B = 30;
const X = i => L + i / (pts.length - 1) * (W - L - R), Y = v => T + (1 - v / 100) * (H - T - B);
const lvl = v => v >= 80 ? 'green' : v >= 50 ? 'yellow' : 'red';
let s = '<div class="m-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Overall health score over 30 days">' +
'<rect x="' + L + '" width="' + (W - L - R) + '" y="' + Y(100) + '" height="' + (Y(80) - Y(100)) + '" class="band"/>' +
'<rect x="' + L + '" width="' + (W - L - R) + '" y="' + Y(80) + '" height="' + (Y(50) - Y(80)) + '" style="fill:rgba(245,197,24,.08)"/>' +
'<rect x="' + L + '" width="' + (W - L - R) + '" y="' + Y(50) + '" height="' + (Y(0) - Y(50)) + '" style="fill:rgba(229,72,77,.08)"/>';
[0, 25, 50, 75, 100].forEach(v => { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="g"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>'; });
pts.forEach((p, i) => { if (i % 5 === 0 || i === pts.length - 1) s += '<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle">D' + p.day + '</text>'; });
s += '<polyline points="' + pts.map((p, i) => X(i) + ',' + Y(p.score)).join(' ') + '" class="line" style="stroke:#F5C518"/>';
pts.forEach((p, i) => { s += '<circle cx="' + X(i) + '" cy="' + Y(p.score) + '" r="' + (i === pts.length - 1 ? 6 : 3.5) + '" class="pt pt--' + lvl(p.score) + '"><title>Day ' + p.day + ': score ' + p.score + '</title></circle>'; });
const first = pts[0].score, last = pts[pts.length - 1].score, diff = last - first;
const wk = a => Math.round(a.reduce((s, p) => s + p.score, 0) / a.length), thisWk = wk(pts.slice(-7)), lastWk = wk(pts.slice(-14, -7)), early = wk(pts.slice(0, 7));
return s + '</svg><div class="m-legend"><span><i class="l-band"></i>80–100 All good</span><span><i class="l-target"></i>50–79 Keep an eye</span><span><i class="l-red"></i>Below 50 Act now</span></div>' +
'<table class="m-table"><tr><th>Compared with past</th><th>Average score</th><th>Change</th></tr>' +
'<tr><td>This week (last 7 days)</td><td><b>' + thisWk + '</b></td><td>—</td></tr>' +
'<tr><td>Previous week</td><td>' + lastWk + '</td><td class="m-' + (thisWk >= lastWk ? 'green' : 'red') + '-text">' + (thisWk - lastWk >= 0 ? '▲ +' : '▼ ') + (thisWk - lastWk) + '</td></tr>' +
'<tr><td>First week of this 30-day window</td><td>' + early + '</td><td class="m-' + (thisWk >= early ? 'green' : 'red') + '-text">' + (thisWk - early >= 0 ? '▲ +' : '▼ ') + (thisWk - early) + '</td></tr></table>' +
'<p class="m-small">Day ' + pts[0].day + ': <b>' + first + '</b> → today: <b>' + last + '</b> (' + (diff >= 0 ? '+' : '') + diff + ' points over 30 days)</p></div>';
}
function readiness(id) {
const rows = series(id), last7 = rows.slice(-7), b = baseFor(id), t = rows[rows.length - 1], ev = evaluate(id);
const avg = k => last7.reduce((a, r) => a + r[k], 0) / last7.length;
const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
const bone = clamp(avg('ared'));
const muscle = clamp(100 - Math.max(0, (avg('drift') - b.drift[0]) / b.drift[1]) * 25);
const heart = clamp(100 - Math.max(0, (avg('hr') - b.hr[0]) / b.hr[1]) * 22 - Math.max(0, (b.spo2[0] - t.spo2) / b.spo2[1]) * 12);
const eyes = clamp(100 - t.amsler * 20 - (t.contrast >= 50 ? 25 : 0));
const rad = clamp(100 - ev.cumDose / 6);
const total = clamp(bone * .3 + muscle * .2 + heart * .25 + eyes * .15 + rad * .1);
const status = total >= 92 ? ['green', 'Ready'] : total >= 80 ? ['yellow', 'Recondition 2–3 weeks'] : ['red', 'Medical review'];
return { bone, muscle, heart, eyes, rad, total, status };
}
function readinessTable() {
const cell = v => '<td class="m-' + (v >= 85 ? 'green' : v >= 70 ? 'yellow' : 'red') + '-text">' + v + '%</td>';
return '<div class="m-table-wrap"><table class="m-table"><thead><tr><th>Astronaut</th><th>Bones</th><th>Muscle</th><th>Heart</th><th>Eyes</th><th>Radiation</th><th>Readiness</th><th>Status</th></tr></thead><tbody>' +
D.crewList.map(c => { const r = readiness(c.id); return '<tr' + (c.id === crew.id ? ' style="background:rgba(245,197,24,.08)"' : '') + '><td><b>' + esc(c.name) + '</b><br><small>' + c.id + '</small></td>' +
cell(r.bone) + cell(r.muscle) + cell(r.heart) + cell(r.eyes) + cell(r.rad) + '<td><b>' + r.total + '%</b></td><td>' + badge(r.status[0]).replace(WORD[r.status[0]], r.status[1]) + '</td></tr>'; }).join('') +
'</tbody></table></div><p class="m-small">Bones = ARED workouts (7-day average) · Muscle = grip steadiness · Heart = resting heart rate and oxygen (fainting risk when standing in gravity) · Eyes = SANS checks · Radiation = career dose left. Fictional demo values.</p>';
}
function addExtras() {
const trends = SCREENS.trends, reports = SCREENS.reports;
SCREENS.trends = function () {
return trends().replace(DEMO_NOTE, '<section class="m-card glow-card"><h2 class="m-h2" style="margin:0 0 6px">Overall health score <small>(0–100 · all 7 body systems, compared with past weeks)</small></h2>' + healthChart(crew.id) + '</section>' + DEMO_NOTE);
};
const home = SCREENS.home;
SCREENS.home = function () { return home().replace(DEMO_NOTE, reminderTable() + DEMO_NOTE); };
const wired = wire;
wire = function (name) { wired(name); if (name === 'home') wireReminders(); };
SCREENS.reports = function () {
return reports().replace(DEMO_NOTE, '<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">Earth-return readiness <small>(how ready each body is for gravity again)</small></h2>' + readinessTable() + '</section>' + DEMO_NOTE);
};
show(location.hash.slice(1) || 'checkin');
}
const PZSound = (function () {
let ctx = null, muted = false;
try { muted = localStorage.getItem('pranavyom.muted') === '1'; } catch (e) { /* ignore */ }
function ac() { if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (A) ctx = new A(); } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; }
let alarmBus = null;
function tone(freq, start, len, type, vol, alarm) {
const c = ac(); if (!c || muted) return;
if (alarm && !alarmBus) { alarmBus = c.createGain(); alarmBus.connect(c.destination); }
const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + start;
o.type = type; o.frequency.value = freq;
g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
o.connect(g); g.connect(alarm ? alarmBus : c.destination); o.start(t); o.stop(t + len + 0.02);
}
return {
tap: function () { tone(1250, 0, 0.05, 'sine', 0.05); },
ok: function () { tone(880, 0, 0.09, 'sine', 0.08); tone(1320, 0.09, 0.14, 'sine', 0.08); },
buzzer: function () { for (let i = 0; i < 3; i++) { tone(620, i * 0.42, 0.18, 'triangle', 0.12, true); tone(830, i * 0.42 + 0.2, 0.18, 'triangle', 0.12, true); } },
silence: function () { if (alarmBus && ctx) { alarmBus.gain.setTargetAtTime(0, ctx.currentTime, 0.02); const old = alarmBus; setTimeout(function () { old.disconnect(); }, 200); alarmBus = null; } },
isMuted: function () { return muted; },
toggle: function () { muted = !muted; try { localStorage.setItem('pranavyom.muted', muted ? '1' : '0'); } catch (e) { /* ignore */ } if (!muted) this.ok(); return muted; }
};
})();
document.addEventListener('pointerdown', function (e) {
if (e.target.closest('button, a, input, select, label, [role="button"], [role="radio"]')) PZSound.tap();
}, true);
document.addEventListener('deck:submitted', function () { PZSound.ok(); });
(function () {
const b = document.createElement('button');
b.type = 'button'; b.id = 'pzMute';
b.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9000;width:42px;height:42px;border-radius:50%;border:1px solid #F5C518;background:#151515;color:#F5C518;font-size:18px;cursor:pointer';
const label = function () { b.textContent = PZSound.isMuted() ? '🔇' : '🔊'; b.title = PZSound.isMuted() ? 'Sounds off: tap to turn on' : 'Sounds on: tap to mute'; b.setAttribute('aria-label', b.title); };
b.addEventListener('click', function () { PZSound.toggle(); label(); });
label(); document.body.appendChild(b);
})();
const REMIND_KEY = 'pranavyom.remindAt';
function remindTime() { try { return localStorage.getItem(REMIND_KEY) || '21:00'; } catch (e) { return '21:00'; } }
function todayRecord() { const r = latestRecord(crew.id); return r && new Date(r.recordedAt).toDateString() === new Date().toDateString() ? r : null; }
function dayTasks(id) {
if (id === crew.id) { const r = todayRecord(), t = r ? r.results : {}; return { checkin: !!r, water: !!t.test5, ared: !!t.test4, time: r ? new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' }; }
const n = parseInt(id.slice(5), 10), seed = (n * 7 + new Date().getDate() * 3) % 10;
return { checkin: seed > 2, water: seed > 1, ared: seed % 4 !== 0, time: seed > 2 ? (7 + seed) + ':' + (seed * 6 % 60 < 10 ? '0' : '') + (seed * 6 % 60) : '' };
}
function reminderTable() {
const tick = v => v ? '<td class="m-green-text">✓ Done</td>' : '<td class="m-red-text">✗ Missing</td>';
let missing = 0;
const rows = D.crewList.map(c => {
const d = dayTasks(c.id), all = d.checkin && d.water && d.ared; if (!all) missing++;
return '<tr' + (c.id === crew.id ? ' style="background:rgba(245,197,24,.08)"' : '') + '><td><b>' + esc(c.name) + '</b><br><small>' + c.id + (c.id === crew.id ? ' · you' : '') + '</small></td>' +
tick(d.checkin) + tick(d.water) + tick(d.ared) + '<td>' + (d.time || '—') + '</td><td>' + (all ? badge('green').replace('All good', 'Complete') : badge('red').replace('Act now', 'Buzzer at ' + remindTime())) + '</td></tr>';
}).join('');
return '<section class="m-card glow-card"><div class="m-row"><h2 class="m-h2" style="margin:0">Today\'s reminders <small>(' + missing + ' of 16 still have tasks left)</small></h2>' +
'<span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label class="m-small" for="remindAt">End-of-day buzzer</label><input type="time" id="remindAt" class="m-select" value="' + remindTime() + '">' +
'<button class="pill-btn" type="button" id="testBuzzer">🔔 Test buzzer</button></span></div>' +
'<div class="m-table-wrap"><table class="m-table"><thead><tr><th>Astronaut</th><th>Daily check-in</th><th>Water log</th><th>ARED workout</th><th>Done at</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
'<p class="m-small">If your tasks are not done by the buzzer time, an alarm sounds for up to a minute with a banner: do it now, snooze 10 minutes, or dismiss (Esc also works). Other crew members\' rows are fictional demo data.</p></section>';
}
function wireReminders() {
const t = document.getElementById('remindAt'), b = document.getElementById('testBuzzer');
if (t) t.addEventListener('change', function () { try { localStorage.setItem(REMIND_KEY, t.value); } catch (e) { /* ignore */ } buzzedToday = false; toast('Buzzer set for ' + t.value); show('home'); });
if (b) b.addEventListener('click', function () { buzz(true); });
}
let buzzedToday = false, snoozeUntil = 0, buzzLoop = null, buzzAuto = null;
function stopBuzz() {
clearInterval(buzzLoop); clearTimeout(buzzAuto); buzzLoop = null; PZSound.silence();
const bar = document.getElementById('pzBuzzer');
if (bar) { bar.style.opacity = '0'; bar.style.transform = 'translate(-50%, -16px)'; setTimeout(function () { bar.remove(); }, 250); }
}
function buzz(test) {
stopBuzz();
const bar = document.createElement('div'); bar.id = 'pzBuzzer'; bar.setAttribute('role', 'alertdialog'); bar.setAttribute('aria-label', 'Reminder');
bar.style.cssText = 'position:fixed;left:50%;top:18px;transform:translate(-50%,-16px);opacity:0;transition:opacity .25s ease,transform .25s ease;z-index:9500;max-width:92vw;background:#151515;color:#fff;border:2px solid #e5484d;border-radius:14px;padding:14px 18px;box-shadow:0 0 30px rgba(229,72,77,.6);display:flex;gap:12px;align-items:center;flex-wrap:wrap;font:15px/1.4 Inter,Arial,sans-serif';
bar.innerHTML = '<b style="color:#ff7b7b">🔔 ' + (test ? 'Buzzer test' : 'End-of-day reminder') + '</b><span>' + esc(crew.name) + ', today\'s check-in is not complete yet.</span>' +
'<button class="cta" type="button" data-bz="go">Do it now</button><button class="pill-btn" type="button" data-bz="snooze">Snooze 10 min</button><button class="ghost-btn" type="button" data-bz="off">✕ Dismiss</button>';
document.body.appendChild(bar);
requestAnimationFrame(function () { bar.style.opacity = '1'; bar.style.transform = 'translate(-50%, 0)'; });
bar.addEventListener('click', function (e) {
const btn = e.target.closest('[data-bz]'); if (!btn) return;
const what = btn.dataset.bz; stopBuzz();
if (what === 'go') go('checkin');
if (what === 'snooze') { snoozeUntil = Date.now() + 10 * 60 * 1000; buzzedToday = false; toast('Snoozed for 10 minutes'); }
});
bar.querySelector('[data-bz="off"]').focus();
PZSound.buzzer();
buzzLoop = setInterval(PZSound.buzzer, 2600);
buzzAuto = setTimeout(stopBuzz, test ? 6000 : 60000);
}
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.getElementById('pzBuzzer')) stopBuzz(); });
setInterval(function () {
if (typeof latestRecord !== 'function' || typeof crew === 'undefined') return;
const now = new Date(), hm = remindTime().split(':'), due = new Date(); due.setHours(+hm[0], +hm[1], 0, 0);
const d = dayTasks(crew.id);
if (!buzzedToday && now >= due && Date.now() > snoozeUntil && !(d.checkin && d.water && d.ared)) { buzzedToday = true; buzz(false); }
}, 20000);