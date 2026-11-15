/* PRANAVYOM ZERO-GRAM · sounds.js
   A different sound for each of the six daily tests, played while they run.
   Sounds are made by the browser (no audio files); the 🔊 button mutes them. */
'use strict';
const TS = (function () {
let ctx = null, hum = null, lastTap = 0;
function c() { if (typeof PZSound !== 'undefined' && PZSound.isMuted()) return null; if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); } if (ctx.state === 'suspended') ctx.resume(); return ctx; }
function note(f, at, len, vol, type, f2) {
const a = c(); if (!a) return; lastTap = Date.now();
const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (at || 0);
o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + len);
g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + len + 0.03);
}
const SCALE = [262, 294, 330, 392, 440, 523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760, 2093];
return {
recent: function () { return Date.now() - lastTap < 80; },
mark: function () { lastTap = Date.now(); },
start: function () { note(300, 0, 0.25, 0.08, 'sine', 900); },
ping: function () { note(1600, 0, 0.08, 0.06, 'sine'); },
pop: function () { note(700, 0, 0.09, 0.12, 'triangle', 1500); },
grid: function (on) { note(on ? 420 : 300, 0, 0.06, 0.1, 'square'); },
bell: function (row) { note(990 - row * 110, 0, 0.5, 0.08, 'triangle'); },
tile: function (i) { note(SCALE[i % 16], 0, 0.28, 0.1, 'sine'); },
wrong: function () { note(140, 0, 0.35, 0.12, 'sawtooth', 90); },
humStart: function () { const a = c(); if (!a || hum) return; const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, a.currentTime); o.frequency.linearRampToValueAtTime(420, a.currentTime + 15); g.gain.value = 0.05; o.connect(g); g.connect(a.destination); o.start(); hum = { o: o, g: g }; },
humStop: function () { if (!hum || !ctx) return; hum.g.gain.setTargetAtTime(0, ctx.currentTime, 0.03); const h = hum; setTimeout(function () { h.o.stop(); }, 150); hum = null; },
slide: function (v, max) { note(300 + v / max * 900, 0, 0.05, 0.06, 'triangle'); },
drop: function (up) { note(up ? 380 : 900, 0, 0.16, 0.12, 'sine', up ? 1100 : 350); },
colour: function (i) { note(520 - i * 60, 0, 0.18, 0.08, 'sine'); },
chip: function () { note(1200, 0, 0.05, 0.07, 'triangle'); },
mood: function (v) { note([262, 330, 392, 494, 587][v - 1] || 392, 0, 0.22, 0.09, 'sine'); },
done: function () { [523, 659, 784, 1047].forEach(function (f, i) { note(f, i * 0.09, 0.3, 0.07, 'triangle'); }); }
};
})();
(function () {
const $ = id => document.getElementById(id);
const on = (el, ev, fn) => { if (el) el.addEventListener(ev, fn, true); };
const watch = (el, opts, fn) => { if (el) new MutationObserver(fn).observe(el, opts); };
/* Test 01 reaction: start sweep, ping when a target appears, pop when tapped */
on($('rtStart'), 'pointerdown', TS.start);
watch($('reticle'), { attributes: true, attributeFilter: ['hidden'] }, function () { if (!$('reticle').hidden) TS.ping(); });
on($('reticle'), 'pointerdown', TS.pop);
/* Test 02 eyes: grid clicks, a bell for each contrast row */
on($('amsler'), 'pointerdown', function (e) { const b = e.target.closest('button'); if (b) TS.grid(!b.classList.contains('is-marked')); });
on($('contrastChart'), 'pointerdown', function (e) { const b = e.target.closest('button'); if (b) TS.bell(Array.from(b.parentNode.children).indexOf(b)); });
/* Test 03 memory: a musical note for every tile, low buzz for a mistake */
on($('memStart'), 'pointerdown', TS.start);
watch($('memTiles'), { attributes: true, subtree: true, attributeOldValue: true, attributeFilter: ['class'] }, function (list) {
list.forEach(function (m) { const t = m.target, i = Array.from(t.parentNode.children).indexOf(t);
if (t.classList.contains('is-lit') && !(m.oldValue || '').includes('is-lit')) TS.tile(i);
if (t.classList.contains('is-miss')) TS.wrong(); });
});
on($('memTiles'), 'pointerdown', function (e) { const b = e.target.closest('button'); if (b) TS.tile(Array.from(b.parentNode.children).indexOf(b)); });
/* Test 04 grip: a rising hum while holding, slider ticks for ARED */
on($('holdBtn'), 'pointerdown', TS.humStart);
['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { on($('holdBtn'), ev, TS.humStop); });
watch($('holdLabel'), { childList: true, characterData: true, subtree: true }, function () { if (/complete|early/i.test($('holdLabel').textContent)) TS.humStop(); });
let lastSlide = 0;
on($('aredInput'), 'input', function () { if (Date.now() - lastSlide > 60) { lastSlide = Date.now(); TS.slide(+this.value, 120); } });
/* Test 05 hydration: water drops, colour tones, supplement pops */
on($('waterPlus'), 'pointerdown', function () { TS.drop(true); });
on($('waterMinus'), 'pointerdown', function () { TS.drop(false); });
on($('urine'), 'pointerdown', function (e) { const b = e.target.closest('button'); if (b) TS.colour(Array.from(b.parentNode.children).indexOf(b)); });
on($('suppChips'), 'pointerdown', function (e) { if (e.target.closest('button')) TS.chip(); });
/* Test 06 mood: each slider value has its own note */
['mood', 'stress', 'energy'].forEach(function (id) { on($(id), 'input', function () { TS.mood(+this.value); }); });
on($('symptomChips'), 'pointerdown', function (e) { if (e.target.closest('button')) TS.chip(); });
/* Any test finished: a short rising "complete" chime */
document.querySelectorAll('.test').forEach(function (card) {
let was = card.classList.contains('is-done');
watch(card, { attributes: true, attributeFilter: ['class'] }, function () { const now = card.classList.contains('is-done'); if (now && !was) setTimeout(TS.done, 120); was = now; });
});
})();
/* Keep the general tap sound quiet when a test sound has just played */
/* Inside a test card the test's own sound replaces the general tap */
window.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('.test')) TS.mark(); }, true);
(function () { const tap = PZSound.tap; PZSound.tap = function () { if (!TS.recent()) tap(); }; })();