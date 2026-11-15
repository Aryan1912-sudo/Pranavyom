/* PRANAVYOM ZERO-GRAM · vte.js
   VENOUS HEALTH & VTE MONITOR (DVT / pulmonary embolism symptom watch).
   Health-monitoring and referral support only: it never diagnoses VTE.
   Records are saved per Crew ID in localStorage ('pranavyom.vte.CREW-xx').
   vte-records.js adds investigation records, history/trend and the overview links. */
'use strict';
const VTE_EVERY = 15, VTE_KEY = 'pranavyom.vte.' + crew.id, DAYMS = 86400000;
const VTE_Q = [
'Have you noticed any new or unusual swelling in either leg?', 'Have you experienced new or unusual pain or tenderness in your leg?',
'Have you noticed unusual warmth in either leg?', 'Have you noticed redness or unusual skin-colour changes in either leg?',
'Have you experienced sudden or unexplained shortness of breath?', 'Have you experienced sudden or unexplained chest pain or discomfort?'];
const VTE_SHORT = ['Leg swelling', 'Leg pain / tenderness', 'Leg warmth', 'Leg redness / colour change', 'Sudden shortness of breath', 'Sudden chest pain'];
const ANS = { yes: 'Yes', no: 'No', na: 'Prefer not to answer' };
function vteLoad() {
let d = null; try { d = JSON.parse(localStorage.getItem(VTE_KEY)); } catch (e) { d = null; }
if (!d) {   /* one fictional earlier questionnaire so the 15-day schedule can be shown */
const n = parseInt(crew.id.slice(5), 10), ago = n % 3 === 0 ? 18 : 6;
d = { assessments: [{ at: new Date(Date.now() - ago * DAYMS).toISOString(), answers: { 0: 'no', 1: 'no', 2: 'no', 3: 'no', 4: 'no', 5: 'no' }, notes: '', level: 'none', review: 'Not required', demo: true }], inv: { dd: [], dop: [], cbc: [] }, alerts: [] };
vteSave(d);
}
return d;
}
function vteSave(d) { try { localStorage.setItem(VTE_KEY, JSON.stringify(d)); } catch (e) { toast('Could not save on this device'); } }
const fmtDT = iso => new Date(iso).toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtD = t => new Date(t).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
function vteState() {
const d = vteLoad(), last = d.assessments[d.assessments.length - 1], due = new Date(last.at).getTime() + VTE_EVERY * DAYMS;
const left = Math.ceil((due - Date.now()) / DAYMS);
return { d, last, due, left, overdue: left < 0, isDue: left <= 0 };
}
function yesList(a) { return Object.keys(a.answers).filter(i => a.answers[i] === 'yes').map(i => VTE_SHORT[i]); }
const LEVEL = { none: ['green', 'No symptoms reported'], review: ['yellow', 'Priority medical review'], emergency: ['red', 'EMERGENCY'] };
function vteCard(label, big, small, lvl, word) { return '<div class="m-card glow-card"><p class="m-label">' + label + '</p><p class="m-big" style="font-size:1.7rem">' + big + '</p>' + badge(lvl).replace(WORD[lvl], word) + '<p class="m-small">' + small + '</p></div>'; }
SCREENS.vte = function () {
const s = vteState(), d = s.d, last = s.last, ys = yesList(last);
const dueTxt = s.overdue ? 'Overdue by ' + (-s.left) + ' day' + (s.left === -1 ? '' : 's') : s.left === 0 ? 'Due today' : 'In ' + s.left + ' day' + (s.left === 1 ? '' : 's');
let h = '<section class="m-hero glow-card"><div><p class="battery__id">' + crew.id + '</p><h1 class="battery__name">' + esc(crew.name) + '</h1><p class="battery__role">' + esc(crew.designation) + '</p></div>' +
'<div><p class="battery__kicker">Venous health &amp; VTE monitor</p><p class="m-hero__sub">Periodic Thrombosis Risk and Symptom Assessment · Last assessment <b>' + fmtDT(last.at) + '</b> · Next due <b>' + fmtD(s.due) + '</b></p></div></section>';
if (s.isDue) h += '<p class="m-safety" style="border-color:' + (s.overdue ? '#e5484d' : '#F5C518') + '">' + (s.overdue ? '⚠ Your 15-day VTE questionnaire is <b>overdue</b>. Please complete it now.' : '🔔 Your 15-day VTE questionnaire is <b>due today</b>.') + '</p>';
if (last.level === 'emergency') h += '<section class="m-card" style="border:2px solid #e5484d;background:#2a0d0f"><h2 class="m-h2" style="color:#ff7b7b;margin-top:0">🚨 Emergency warning</h2><p>Sudden shortness of breath or chest pain was reported on ' + fmtDT(last.at) + '. <b>Seek immediate emergency medical assessment and follow the spacecraft emergency medical protocol.</b> A simulated highest-priority notification was raised to Earth and the flight medical officer.</p></section>';
h += '<div class="m-grid2" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">' +
vteCard('Last questionnaire', last.demo ? 'Demo record' : 'Completed', fmtDT(last.at), s.overdue ? 'red' : 'green', s.overdue ? 'Out of date' : 'Up to date') +
vteCard('Next assessment due', fmtD(s.due), dueTxt + ' · every ' + VTE_EVERY + ' days', s.overdue ? 'red' : s.isDue ? 'yellow' : 'green', s.overdue ? 'Overdue' : s.isDue ? 'Due' : 'Scheduled') +
vteCard('Reported symptoms', ys.length ? ys.length + ' reported' : 'None reported', ys.length ? esc(ys.join(', ')) : 'No symptoms reported. This does not rule out a problem.', LEVEL[last.level][0], LEVEL[last.level][1]) +
vteCard('Medical review status', esc(last.review), last.level === 'none' ? 'No referral needed for this questionnaire.' : 'Flight medical officer to assess.', last.review === 'Reviewed' || last.level === 'none' ? 'green' : last.level === 'emergency' ? 'red' : 'yellow', last.review === 'Reviewed' ? 'Reviewed' : last.level === 'none' ? 'Not required' : 'Pending') + '</div>';
if (last.level !== 'none' && last.review !== 'Reviewed') h += '<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">Medical officer review</h2><input class="journal" id="vteRevNote" maxlength="200" placeholder="Medical officer notes (required)" style="margin:6px 0 10px"><button class="cta" type="button" id="vteReview">Mark as reviewed</button></section>';
h += '<section class="m-card glow-card" id="vteForm"><div class="m-row"><h2 class="m-h2" style="margin:0">VTE symptom questionnaire <small>(available any time, due every ' + VTE_EVERY + ' days)</small></h2><b id="vteProg" class="m-yellow-text">0 of 6 answered</b></div>' +
VTE_Q.map((q, i) => '<div style="padding:10px 0;border-bottom:1px solid #262626"><p style="margin-bottom:6px"><b>' + (i + 1) + '.</b> ' + q + '</p><div style="display:flex;gap:8px;flex-wrap:wrap">' +
Object.keys(ANS).map(k => '<label class="m-radio" style="margin:0"><input type="radio" name="vq' + i + '" value="' + k + '"> ' + ANS[k] + '</label>').join('') + '</div></div>').join('') +
'<label class="m-small" style="display:block;margin-top:12px">Additional symptoms or observations (optional)<textarea id="vteNotes" class="journal" rows="2" maxlength="300" style="width:100%;margin-top:4px"></textarea></label>' +
'<div id="vteConfirm"></div><div class="m-row" style="justify-content:flex-start;gap:10px;margin-top:12px"><button class="cta" type="button" id="vteSubmit">Review &amp; submit</button></div>' +
'<p class="m-small">This questionnaire supports medical referral. It does not diagnose a blood clot and gives no probability. Answering "No" to everything does not mean you are clot-free: report any new symptom at once.</p></section>';
h += vteInvestigations(d) + vteHistory(d) + '<p class="demo-note">The first questionnaire for each astronaut is a fictional demo record. Investigation records start empty and are entered by medical personnel.</p>';
return h;
};
function vteTransmit(a, emergency) {
const pkt = { label: 'SIMULATED TRANSMISSION TO EARTH', priority: emergency ? 'EMERGENCY (highest)' : 'PRIORITY MEDICAL REVIEW', to: ['Flight medical officer', 'Earth flight surgeon (simulated)'], crewId: crew.id, name: crew.name, time: a.at, symptoms: yesList(a), responses: VTE_Q.map((q, i) => ({ q: q, a: ANS[a.answers[i]] })), notes: a.notes };
const o = store.get('pranavyom.outbox', []); o.push({ crew: crew.id, at: new Date().toLocaleString() + ' · VTE ' + (emergency ? 'EMERGENCY' : 'review'), bytes: new Blob([JSON.stringify(pkt)]).size }); store.set('pranavyom.outbox', o);
D.openModal(emergency ? '🚨 Emergency: SIMULATED TRANSMISSION TO EARTH' : 'Priority review: SIMULATED TRANSMISSION TO EARTH',
(emergency ? '<p style="color:#ff7b7b;font-weight:700">Seek immediate emergency medical assessment now and follow the spacecraft emergency medical protocol.</p>' : '<p>Your answers were flagged for prompt assessment by the flight medical officer.</p>') +
'<p class="m-small">This prototype has no real link to Earth. The packet below is what would be queued (it is also listed in Reports to Earth → Outbox).</p><pre style="max-height:240px;overflow:auto;background:#151515;padding:12px;border-radius:10px;font-size:.75rem;white-space:pre-wrap">' + esc(JSON.stringify(pkt, null, 2)) + '</pre>');
if (emergency && typeof alarm === 'function') setTimeout(function () { if (document.getElementById('modal').hidden) return; PZSound.buzzer(); }, 300);
}
function wireVte() {
const form = document.getElementById('vteForm'); if (!form) return;
const answers = () => { const a = {}; VTE_Q.forEach((q, i) => { const r = form.querySelector('input[name="vq' + i + '"]:checked'); if (r) a[i] = r.value; }); return a; };
form.addEventListener('change', function () { const n = Object.keys(answers()).length; document.getElementById('vteProg').textContent = n + ' of 6 answered'; document.getElementById('vteConfirm').innerHTML = ''; document.getElementById('vteSubmit').textContent = 'Review & submit'; });
document.getElementById('vteSubmit').addEventListener('click', function () {
const a = answers(), box = document.getElementById('vteConfirm');
if (Object.keys(a).length < 6) { toast('Please answer all 6 questions (you may choose "Prefer not to answer").'); return; }
if (!box.innerHTML) { const ys = Object.keys(a).filter(i => a[i] === 'yes').map(i => VTE_SHORT[i]);
box.innerHTML = '<div class="m-safebox m-safebox--' + (ys.length ? 'yellow' : 'green') + '"><b>Please confirm:</b> ' + (ys.length ? 'you reported ' + esc(ys.join(', ')) + '.' : 'no symptoms reported.') + ' Press the button again to submit.</div>';
this.textContent = 'Confirm & submit'; return; }
const emergency = a[4] === 'yes' || a[5] === 'yes', flagged = Object.keys(a).some(i => a[i] === 'yes');
const rec = { at: new Date().toISOString(), answers: a, notes: document.getElementById('vteNotes').value.trim(), level: emergency ? 'emergency' : flagged ? 'review' : 'none', review: emergency ? 'EMERGENCY: immediate assessment' : flagged ? 'Pending medical review' : 'Not required' };
const d = vteLoad(); d.assessments.push(rec);
if (flagged) d.alerts.push({ at: rec.at, priority: emergency ? 'EMERGENCY' : 'PRIORITY', symptoms: yesList(rec) });
vteSave(d); markVteSidebar(); show('vte');
if (flagged) vteTransmit(rec, emergency); else toast('Questionnaire saved. Next one due in 15 days.');
});
const rv = document.getElementById('vteReview');
if (rv) rv.addEventListener('click', function () { const note = document.getElementById('vteRevNote').value.trim(); if (!note) { toast('Please add the medical officer\'s notes.'); return; }
const d = vteLoad(), l = d.assessments[d.assessments.length - 1]; l.review = 'Reviewed'; l.revNote = note; vteSave(d); toast('Marked as reviewed'); show('vte'); });
document.querySelectorAll('[data-invsave]').forEach(b => b.addEventListener('click', function () {
const k = b.dataset.invsave, rec = {}; let ok = true;
INV[k].f.forEach(f => { const el = document.querySelector('[data-inv="' + k + '.' + f[0] + '"]'); rec[f[0]] = el.value.trim(); if (!rec[f[0]] && ['date', 'by'].includes(f[0])) ok = false; });
if (!ok) { toast('Test date and "Entered by" are required.'); return; }
const d = vteLoad(); d.inv[k].push(rec); vteSave(d); toast('Record saved'); show('vte');
}));
}
/* Sidebar item after Blood Tests, with a DUE / OVERDUE tag */
NAMES.push('vte');
function markVteSidebar() {
const b = document.querySelector('[data-view="vte"]'); if (!b) return; const s = vteState();
b.innerHTML = '<span aria-hidden="true">💓</span> VTE Monitor' + (s.isDue ? ' <span style="margin-left:auto;background:' + (s.overdue ? '#e5484d' : '#F5C518') + ';color:#111;border-radius:999px;padding:1px 8px;font-size:.7rem;font-weight:700">' + (s.overdue ? 'OVERDUE' : 'DUE') + '</span>' : '');
}
(function () {
const nav = document.querySelector('.side__nav'); if (!nav || nav.querySelector('[data-view="vte"]')) return;
const b = document.createElement('button'); b.className = 'side__item'; b.type = 'button'; b.dataset.view = 'vte';
nav.insertBefore(b, nav.querySelector('[data-view="crew"]')); b.addEventListener('click', function () { go('vte'); }); markVteSidebar();
})();
const vteWire = wire; wire = function (name) { vteWire(name); if (name === 'vte') wireVte(); };
setTimeout(function () {   /* due / overdue notification, once a day */
const s = vteState(), key = 'pranavyom.vteReminded.' + crew.id, today = new Date().toDateString();
let seen = ''; try { seen = localStorage.getItem(key) || ''; } catch (e) { /* ignore */ }
if (!s.isDue || seen === today || document.getElementById('pzBuzzer')) return;
try { localStorage.setItem(key, today); } catch (e) { /* ignore */ }
alarm('VTE questionnaire ' + (s.overdue ? 'overdue' : 'due'), crew.name + ', your 15-day leg and breathing symptom check is ' + (s.overdue ? 'overdue by ' + (-s.left) + ' day(s)' : 'due today') + '.', 'vte', 20);
}, 9000);