/* ==========================================================
   PRANAVYOM ZERO-GRAM — Wearable Monitoring (add-on screen)
   · Adds one sidebar item "Wearable Monitoring" and its screen.
   · Shows wearable-compatible vital signs with connection status and timestamps.
   · ALL VALUES ARE SIMULATED: there is no connection to the Canadian Space
     Agency's Bio-Monitor hardware in this prototype.
   · Does not change any existing screen or sidebar item.
   ========================================================== */
const WEAR = { started: new Date(), n: 0 };
function wearSeed() { return parseInt(crew.id.slice(5), 10); }
function wearValues() {
const k = wearSeed(), t = WEAR.n, j = (a, p) => Math.sin((t + k) * p) * a;   // small, smooth simulated changes
let hr = 64 + (k * 3) % 14, spo2 = 98;
try { const d = evaluate(crew.id).today || {}; if (d.hr) hr = d.hr; if (d.spo2) spo2 = d.spo2; } catch (e) { /* use defaults */ }
return {
hr: Math.round(hr + j(3, 0.9)),
sys: Math.round(112 + (k * 5) % 14 + j(3, 0.7)), dia: Math.round(72 + (k * 3) % 9 + j(2, 0.5)),
ecg: 'Normal sinus rhythm', qt: Math.round(390 + (k * 7) % 30),
spo2: Math.round(Math.min(100, spo2 + j(0.6, 1.3)) * 10) / 10,
rr: Math.round(14 + (k % 4) + j(1, 0.6)),
skin: Math.round((33.6 + (k % 5) * 0.15 + j(0.15, 0.4)) * 10) / 10,
steps: 2400 + k * 310 + t * 12, active: 38 + (k * 7) % 40, kcal: Math.round(520 + k * 23 + t * 0.6)
};
}
function wearLevel(name, v) {
if (name === 'hr') return v > 100 || v < 45 ? 'red' : v > 90 ? 'yellow' : 'green';
if (name === 'bp') return v.sys >= 140 || v.dia >= 90 ? 'red' : v.sys >= 130 || v.dia >= 85 ? 'yellow' : 'green';
if (name === 'spo2') return v < 92 ? 'red' : v < 94 ? 'yellow' : 'green';
if (name === 'rr') return v > 24 || v < 10 ? 'red' : v > 20 ? 'yellow' : 'green';
if (name === 'skin') return v > 37 || v < 31 ? 'yellow' : 'green';
return 'green';
}
function wearEcg() {   /* simulated ECG trace, drawn as SVG */
const beats = 6, w = 600, h = 90, mid = 55, step = w / beats;
let p = 'M0 ' + mid;
for (let i = 0; i < beats; i++) {
const x = i * step;
p += ' L' + (x + step * .30) + ' ' + mid + ' Q' + (x + step * .36) + ' ' + (mid - 8) + ' ' + (x + step * .42) + ' ' + mid +
' L' + (x + step * .50) + ' ' + mid + ' L' + (x + step * .53) + ' ' + (mid + 8) + ' L' + (x + step * .57) + ' 8 L' + (x + step * .61) + ' ' + (mid + 14) +
' L' + (x + step * .65) + ' ' + mid + ' L' + (x + step * .75) + ' ' + mid + ' Q' + (x + step * .83) + ' ' + (mid - 14) + ' ' + (x + step * .91) + ' ' + mid + ' L' + (x + step) + ' ' + mid;
}
return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:90px;display:block;margin-top:8px" role="img" aria-label="Simulated ECG trace">' +
'<path d="' + p + '" fill="none" stroke="#F5C518" stroke-width="2"/></svg>';
}
function wearTile(label, value, unit, note, level, extra) {
return '<div class="m-card glow-card"><p class="m-label">' + label + '</p><p class="m-big" style="font-size:2rem">' + value +
' <span style="font-size:1rem">' + unit + '</span></p>' + badge(level) + '<p class="m-small" style="margin-top:6px">' + note + '</p>' + (extra || '') + '</div>';
}
function wearTiles() {
const v = wearValues(), now = new Date(), ts = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const grid = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;margin-top:12px">';
return grid +
wearTile('❤ Heart rate', v.hr, 'bpm', 'Chest strap · updated ' + ts, wearLevel('hr', v.hr)) +
wearTile('🩸 Blood pressure', v.sys + '/' + v.dia, 'mmHg', 'Cuff reading · updated ' + ts, wearLevel('bp', v)) +
wearTile('🫀 SpO₂', v.spo2, '%', 'Finger / wrist sensor · updated ' + ts, wearLevel('spo2', v.spo2)) +
wearTile('🌬 Respiratory rate', v.rr, 'breaths/min', 'Chest band · updated ' + ts, wearLevel('rr', v.rr)) +
wearTile('🌡 Skin temperature', v.skin.toFixed(1), '°C', 'Skin patch · updated ' + ts, wearLevel('skin', v.skin)) +
wearTile('🏃 Physical activity', v.steps.toLocaleString(), 'steps', v.active + ' active min · ' + v.kcal + ' kcal today · updated ' + ts, 'green') +
'</div>' +
'<section class="m-card glow-card" style="margin-top:12px"><div class="m-row"><p class="m-label" style="margin:0">📈 ECG · single lead (simulated)</p>' + badge('green') + '</div>' +
wearEcg() + '<p class="m-small">' + v.ecg + ' · HR ' + v.hr + ' bpm · QTc ' + v.qt + ' ms · updated ' + ts + '</p></section>';
}
function wearScreen() {
const fmtT = d => d.toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const status = '<section class="m-card glow-card"><div class="m-row"><h2 class="m-h2" style="margin:0">⌚ Wearable connection</h2>' +
'<span class="m-status m-green"><i></i>Connected · simulated</span></div>' +
'<div class="m-table-wrap"><table class="m-table"><tr><th>Device</th><th>Status</th><th>Connected since</th><th>Last sync</th><th>Battery</th></tr>' +
'<tr><td>Bio-Monitor style smart shirt + headband (simulated)</td><td class="m-green-text">● Streaming</td><td>' + fmtT(WEAR.started) + '</td><td id="pzWearSync">' + fmtT(new Date()) + '</td><td>' + (86 - (WEAR.n % 20)) + '%</td></tr>' +
'<tr><td>Blood-pressure cuff (simulated)</td><td class="m-green-text">● Paired</td><td>' + fmtT(WEAR.started) + '</td><td>' + fmtT(new Date()) + '</td><td>72%</td></tr>' +
'</table></div><p class="m-small">Values refresh every 5 seconds while this screen is open.</p></section>';
return identity('Wearable Monitoring', 'Vital signs from wearable sensors for ' + esc(crew.name) + '. Simulated data: no live hardware connected.') +
'<p class="note" style="border-left:4px solid #F5C518;padding:10px 14px;background:#0f0f0f;border-radius:8px;margin:0 0 14px">⚠ <b>Simulated data.</b> This prototype has no direct connection to the Canadian Space Agency\'s Bio-Monitor hardware. All readings below are generated for demonstration only and are not real medical measurements.</p>' +
status + '<div id="pzWearTiles">' + wearTiles() + '</div>' + DEMO_NOTE;
}
/* Register the screen and add the sidebar item (after VTE Monitor, before Crew & Buddy) */
SCREENS.wearable = wearScreen;
if (NAMES.indexOf('wearable') === -1) NAMES.push('wearable');
(function () {
const nav = document.querySelector('.side__nav'); if (!nav || nav.querySelector('[data-view="wearable"]')) return;
const b = document.createElement('button');
b.className = 'side__item'; b.type = 'button'; b.dataset.view = 'wearable';
b.innerHTML = '<span aria-hidden="true">⌚</span> Wearable Monitoring';
nav.insertBefore(b, nav.querySelector('[data-view="crew"]'));
b.addEventListener('click', function () { go('wearable'); });
})();
setInterval(function () {   /* live refresh only while the Wearable screen is open */
const box = document.getElementById('pzWearTiles'); if (!box) return;
WEAR.n++;
box.innerHTML = wearTiles();
const s = document.getElementById('pzWearSync'); if (s) s.textContent = new Date().toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}, 5000);