/* PRANAVYOM ZERO-GRAM · cabin.js
   Tap sounds, the alarm buzzer, and the "Cabin Sensors" sidebar screen:
   the tablet's built-in CO2 sensor and radiation dosimeter. Values are SIMULATED. */
'use strict';
const PZSound = (function () {
let ctx = null, muted = false, alarmBus = null;
try { muted = localStorage.getItem('pranavyom.muted') === '1'; } catch (e) { /* ignore */ }
function ac() { if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (A) ctx = new A(); } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; }
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

/* ---------- BUZZER (one alarm banner for reminders and sensor alarms) ---------- */
let buzzLoop = null, buzzAuto = null;
function stopBuzz() {
clearInterval(buzzLoop); clearTimeout(buzzAuto); buzzLoop = null; PZSound.silence();
const bar = document.getElementById('pzBuzzer');
if (bar) { bar.id = ''; bar.style.opacity = '0'; bar.style.transform = 'translate(-50%, -16px)'; setTimeout(function () { bar.remove(); }, 250); }
}
function alarm(title, message, goTo, seconds, onSnooze) {
stopBuzz();
const bar = document.createElement('div'); bar.id = 'pzBuzzer'; bar.setAttribute('role', 'alertdialog'); bar.setAttribute('aria-label', title);
bar.style.cssText = 'position:fixed;left:50%;top:18px;transform:translate(-50%,-16px);opacity:0;transition:opacity .25s ease,transform .25s ease;z-index:9500;max-width:92vw;background:#151515;color:#fff;border:2px solid #e5484d;border-radius:14px;padding:14px 18px;box-shadow:0 0 30px rgba(229,72,77,.6);display:flex;gap:12px;align-items:center;flex-wrap:wrap;font:15px/1.4 Inter,Arial,sans-serif';
bar.innerHTML = '<b style="color:#ff7b7b">🔔 ' + esc(title) + '</b><span>' + esc(message) + '</span>' +
'<button class="cta" type="button" data-bz="go">Do it now</button>' + (onSnooze ? '<button class="pill-btn" type="button" data-bz="snooze">Snooze 10 min</button>' : '') +
'<button class="ghost-btn" type="button" data-bz="off">✕ Dismiss</button>';
document.body.appendChild(bar);
requestAnimationFrame(function () { bar.style.opacity = '1'; bar.style.transform = 'translate(-50%, 0)'; });
bar.addEventListener('click', function (e) {
const btn = e.target.closest('[data-bz]'); if (!btn) return;
const what = btn.dataset.bz; stopBuzz();
if (what === 'go') go(goTo);
if (what === 'snooze' && onSnooze) onSnooze();
});
bar.querySelector('[data-bz="off"]').focus();
PZSound.buzzer();
buzzLoop = setInterval(PZSound.buzzer, 2600);
buzzAuto = setTimeout(stopBuzz, (seconds || 60) * 1000);
}
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.getElementById('pzBuzzer')) stopBuzz(); });

/* ---------- CABIN SENSORS built into the tablet (hypothetical, simulated) ----------
   CO2: NDIR infrared sensor · Radiation: silicon-diode dosimeter.
   Limits: CO2 green < 2.5 mmHg, yellow 2.5–4, red > 4 mmHg (≈5,260 ppm).
   Dose-equivalent rate green < 125 µSv/h (3 mSv/day), yellow < 417 µSv/h (10 mSv/day), red above. */
const QF = 3.6;   // average quality factor of deep-space radiation (Sv per Gy)
const S = { co2: 2.2, rate: 21, o2: 20.9, kPa: 101.2, temp: 22.6, rh: 46, storm: 0, fault: false, extra: 0, hist: { co2: [], rate: [] }, warned: {} };
const r1 = (a, b) => a + Math.random() * (b - a);
function sensorTick() {
S.co2 += S.fault ? r1(0.06, 0.12) : (2.2 - S.co2) * 0.15 + r1(-0.04, 0.04);
const target = S.storm > 0 ? 520 : 21;
S.rate += (target - S.rate) * 0.25 + r1(-0.8, 0.8); if (S.storm > 0) S.storm--;
S.o2 = 20.9 - (S.co2 - 2.2) * 0.05 + r1(-0.03, 0.03); S.kPa = 101.2 + r1(-0.1, 0.1); S.temp = 22.6 + r1(-0.15, 0.15); S.rh = 46 + r1(-0.6, 0.6);
S.extra += Math.max(0, S.rate - 21) * QF / 1000 * (2 / 3600);
['co2', 'rate'].forEach(k => { S.hist[k].push(S[k]); if (S.hist[k].length > 40) S.hist[k].shift(); });
const c = co2Level(), r = rateLevel();
if (c === 'red' && !S.warned.co2) { S.warned.co2 = true; alarm('CO₂ alarm', 'Cabin CO₂ is ' + S.co2.toFixed(1) + ' mmHg. Check the CO₂ scrubber, increase airflow and avoid hard exercise.', 'sensors', 30); }
if (r === 'red' && !S.warned.rad) { S.warned.rad = true; alarm('Radiation alarm', 'Solar particle event: dose rate ' + Math.round(S.rate * QF) + ' µSv/h. Go to the storm shelter now.', 'action', 30); }
if (c === 'green') S.warned.co2 = false; if (r === 'green') S.warned.rad = false;
paintSensors();
}
function co2Level() { return S.co2 > 4 ? 'red' : S.co2 >= 2.5 ? 'yellow' : 'green'; }
function rateLevel() { const e = S.rate * QF; return e >= 417 ? 'red' : e >= 125 ? 'yellow' : 'green'; }
function spark(list, max) {
if (list.length < 2) return '';
return '<svg viewBox="0 0 120 30" style="width:100%;height:30px;display:block;margin-top:6px" aria-hidden="true"><polyline fill="none" stroke="#F5C518" stroke-width="1.6" points="' +
list.map((v, i) => (i * 120 / 39).toFixed(1) + ',' + (28 - Math.min(1, v / max) * 26).toFixed(1)).join(' ') + '"/></svg>';
}
function tile(label, big, unit, small, level, sp) {
return '<div class="m-card" style="padding:14px;background:#111;border:1px solid #262626;border-radius:14px"><p class="m-label">' + label + '</p>' +
'<p style="font-family:var(--font-label);font-size:1.9rem;font-weight:700;line-height:1.1;margin:4px 0">' + big + ' <span style="font-size:.85rem;color:#A1A1A1">' + unit + '</span></p>' +
'<p class="m-small" style="margin:2px 0">' + small + '</p>' + badge(level) + (sp || '') + '</div>';
}
function sensorTiles() {
const ppm = Math.round(S.co2 / 760 * 1e6), eq = S.rate * QF, day = (new Date().getHours() + new Date().getMinutes() / 60) / 24;
const today = 1.8 * day + S.extra, ev = evaluate(crew.id), career = ev.cumDose + S.extra;
const ok = (v, lo, hi) => v >= lo && v <= hi ? 'green' : 'yellow';
const grid = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:12px">';
return '<h3 class="m-h2" style="margin:4px 0 0">🫁 Air quality · CO₂ sensor</h3>' + grid +
tile('Cabin CO₂', S.co2.toFixed(2), 'mmHg', ppm.toLocaleString() + ' ppm · ' + (S.co2 / 7.6).toFixed(2) + ' % · limit 2.5 mmHg', co2Level(), spark(S.hist.co2, 6)) +
tile('Oxygen', S.o2.toFixed(1), '% O₂', 'Partial pressure ' + (S.o2 / 100 * S.kPa).toFixed(1) + ' kPa', ok(S.o2, 19.5, 23.5)) +
tile('Cabin pressure', S.kPa.toFixed(1), 'kPa', (S.kPa * 0.14504).toFixed(2) + ' psi · ' + Math.round(S.kPa * 7.5006) + ' mmHg', ok(S.kPa, 97, 103)) +
tile('Temperature · humidity', S.temp.toFixed(1), '°C', S.rh.toFixed(0) + ' % relative humidity', S.temp >= 18 && S.temp <= 27 && S.rh >= 25 && S.rh <= 75 ? 'green' : 'yellow') +
'</div><h3 class="m-h2" style="margin:18px 0 0">☢ Radiation · dosimeter</h3>' + grid +
tile('Dose rate', eq.toFixed(0), 'µSv/h', S.rate.toFixed(1) + ' µGy/h absorbed × quality factor ' + QF, rateLevel(), spark(S.hist.rate, 600)) +
tile('Dose today', today.toFixed(2), 'mSv', 'Normal day in deep space ≈ 1.8 mSv', today > 10 ? 'red' : today > 3 ? 'yellow' : 'green') +
tile('Career dose', Math.round(career), 'mSv', (career / 6).toFixed(0) + ' % of the 600 mSv NASA career limit', career > 540 ? 'red' : career > 450 ? 'yellow' : 'green') +
tile('Storm shelter', S.storm > 0 || rateLevel() === 'red' ? 'GO NOW' : 'Standby', '', S.storm > 0 ? 'Solar particle event in progress' : 'No solar particle event detected', S.storm > 0 || rateLevel() === 'red' ? 'red' : 'green') +
'</div>';
}
function sensorPanel() {
return '<section class="m-card glow-card" id="pzSensors"><div class="m-row"><h2 class="m-h2" style="margin:0">Live readings <small>(built into this tablet · every 2 s)</small></h2>' +
'<span style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill-btn small" type="button" id="simStorm">☀ Simulate solar storm</button>' +
'<button class="pill-btn small" type="button" id="simCo2">⚠ Simulate CO₂ scrubber fault</button><button class="ghost-btn" type="button" id="simReset">Reset</button></span></div>' +
'<div id="pzSensorTiles">' + sensorTiles() + '</div></section>' +
'<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">Safe limits used</h2><div class="m-table-wrap"><table class="m-table">' +
'<tr><th>Reading</th><th>All good</th><th>Keep an eye</th><th>Act now (alarm)</th></tr>' +
'<tr><td>Cabin CO₂</td><td>below 2.5 mmHg (≈3,300 ppm)</td><td>2.5–4 mmHg</td><td>above 4 mmHg (≈5,260 ppm)</td></tr>' +
'<tr><td>Radiation dose rate</td><td>below 125 µSv/h (3 mSv/day)</td><td>125–417 µSv/h</td><td>417 µSv/h or more (10 mSv/day)</td></tr>' +
'<tr><td>Oxygen</td><td>19.5–23.5 %</td><td>outside that range</td><td>—</td></tr>' +
'<tr><td>Pressure · temperature · humidity</td><td>97–103 kPa · 18–27 °C · 25–75 %</td><td>outside those ranges</td><td>—</td></tr>' +
'</table></div><p class="m-small">Hypothetical sensor pod built into the tablet: NDIR infrared CO₂ sensor and silicon-diode radiation dosimeter. All values are simulated for this demo. High CO₂ can cause headaches and slower thinking (also shown in Test 03).</p></section>';
}
/* Add "Cabin Sensors" to the sidebar and as its own screen */
SCREENS.sensors = function () { return identity('Cabin Sensors', 'Air quality and radiation around ' + esc(crew.name) + ', measured by the tablet itself.') + sensorPanel() + DEMO_NOTE; };
NAMES.push('sensors');
(function () {
const nav = document.querySelector('.side__nav'); if (!nav || nav.querySelector('[data-view="sensors"]')) return;
const b = document.createElement('button');
b.className = 'side__item'; b.type = 'button'; b.dataset.view = 'sensors';
b.innerHTML = '<span aria-hidden="true">📡</span> Cabin Sensors';
const before = nav.querySelector('[data-view="pharmacy"]');
nav.insertBefore(b, before);
b.addEventListener('click', function () { go('sensors'); });
})();
function paintSensors() {
const box = document.getElementById('pzSensorTiles'); if (box) box.innerHTML = sensorTiles();
const co2 = document.getElementById('cabinCo2');
if (co2) co2.textContent = (S.co2 / 7.6).toFixed(2) + '% (' + S.co2.toFixed(1) + ' mmHg) · ' + { green: 'normal', yellow: 'elevated', red: 'too high' }[co2Level()];
}
function wireSensors() {
const s = document.getElementById('simStorm'), c = document.getElementById('simCo2'), r = document.getElementById('simReset');
if (s) s.addEventListener('click', function () { S.storm = 15; toast('Solar particle event starting…'); });
if (c) c.addEventListener('click', function () { S.fault = true; toast('CO₂ scrubber fault: CO₂ is rising…'); });
if (r) r.addEventListener('click', function () { S.fault = false; S.storm = 0; S.co2 = 2.2; S.rate = 21; stopBuzz(); toast('Sensors back to normal'); });
}
setInterval(sensorTick, 2000);
sensorTick();