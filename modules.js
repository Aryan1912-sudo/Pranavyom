/* ==========================================================
   PRANAVYOM ZERO-GRAM — sidebar modules loader
   1. Makes sure the crew details are available (even if
      astronaut.js is an older version)
   2. Loads modules-1.js, modules-2.js, modules-3.js in order
   3. Shows any problem in a yellow box on the page itself
   4. Extra views: health-score graph, Earth-return readiness table
      (these run later, once modules-1/2/3 have loaded)
   ========================================================== */
(function () {
  'use strict';

  /* Show problems on screen, so no Console is needed */
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

  /* Backup crew details if astronaut.js did not share them */
  if (!window.PZDeck) {
    const NAMES = ['Arjun Mehta', 'Elena Vasquez', 'Priya Nair', 'Dr. Kwame Mensah', 'Sofia Lindqvist', 'Hiroshi Tanaka', 'Amara Okafor', 'Lucas Moreau',
      'Zara Haddad', 'Daniel Kim', 'Inês Carvalho', 'Rohan Iyer', 'Dr. Grace Whitfield', 'Mateo Rossi', 'Naledi Dlamini', 'Samuel Brooks'];
    const ROLES = ['Mission Commander', 'Spacecraft Pilot', 'Flight Engineer', 'Medical Officer', 'Mission Scientist', 'Research Specialist', 'Life Support Engineer',
      'Robotics Specialist', 'Navigation Officer', 'Communications Specialist', 'Biologist', 'Systems Engineer', 'Space Medicine Researcher', 'Geologist',
      'Environmental Systems Specialist', 'Mission Operations Specialist'];
    const list = NAMES.map(function (n, i) { return { id: 'CREW-' + String(i + 1).padStart(2, '0'), name: n, designation: ROLES[i] }; });
    const wanted = new URLSearchParams(location.search).get('crew') || sessionStorage.getItem('pranavyom.selectedCrewId') || 'CREW-01';
    const crew = list.find(function (c) { return c.id === wanted; }) || list[0];
    window.PZDeck = {
      crew: crew, crewList: list, missionDay: 34,
      esc: function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); },
      toast: function (msg) {
        const t = document.getElementById('toast'); if (!t) return;
        t.textContent = msg; t.hidden = false; clearTimeout(t._timer); t._timer = setTimeout(function () { t.hidden = true; }, 2400);
      }
    };
  }

  /* Load the three parts in order (?v= stops the browser using an old copy) */
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

/* ---------- EXTRA VIEWS (used by Health Trends and Reports to Earth) ---------- */
/* Health score for each of the last 30 days (re-runs the evaluation day by day) */
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
/* Earth-return readiness: how ready each astronaut's body is for gravity again */
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

/* Add the extra sections to Health Trends and Reports to Earth, then redraw */
function addExtras() {
  const trends = SCREENS.trends, reports = SCREENS.reports;
  SCREENS.trends = function () {
    return trends().replace(DEMO_NOTE, '<section class="m-card glow-card"><h2 class="m-h2" style="margin:0 0 6px">Overall health score <small>(0–100 · all 7 body systems, compared with past weeks)</small></h2>' + healthChart(crew.id) + '</section>' + DEMO_NOTE);
  };
  SCREENS.reports = function () {
    return reports().replace(DEMO_NOTE, '<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">Earth-return readiness <small>(how ready each body is for gravity again)</small></h2>' + readinessTable() + '</section>' + DEMO_NOTE);
  };
  show(location.hash.slice(1) || 'checkin');
}