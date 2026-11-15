/* ==========================================================
   PRANAVYOM ZERO-GRAM — who can see whose health data
   · Picking an astronaut in the crew portal = signing in as them.
   · A crew member can see only their OWN health data.
   · 4 mission officials can open every crew member's record:
     CREW-01 Mission Commander, CREW-04 Medical Officer,
     CREW-10 Communications Specialist (sends reports to Earth),
     CREW-13 Space Medicine Researcher.
   · Cabin sensors and the medicine kit stock are shared, so everyone sees them.
   Prototype only: there are no passwords.
   ========================================================== */
(function () {
'use strict';
const OFFICIALS = ['CREW-01', 'CREW-04', 'CREW-10', 'CREW-13'];
const VKEY = 'pranavyom.viewer';
const isOfficial = id => OFFICIALS.indexOf(id) !== -1;
const ss = {
get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
del: k => { try { sessionStorage.removeItem(k); } catch (e) { /* ignore */ } }
};
const byId = id => D.crewList.find(c => c.id === id);

/* 1. Who is signed in? */
let nav = 'navigate';
try { nav = performance.getEntriesByType('navigation')[0].type; } catch (e) { /* ignore */ }
let viewer = ss.get(VKEY);
const fromPortal = /crew\.html/.test(document.referrer) && nav === 'navigate';
if (fromPortal || !viewer || !byId(viewer)) { viewer = crew.id; ss.set(VKEY, viewer); }
const official = isOfficial(viewer);
const me = byId(viewer);

/* 2. Not allowed to see this record? Go back to your own. */
if (!official && crew.id !== viewer) {
document.body.style.visibility = 'hidden';
ss.set('pranavyom.denied', crew.id);
location.replace('astronaut.html?crew=' + viewer + '#home');
return;
}
const denied = ss.get('pranavyom.denied');
if (denied) {
ss.del('pranavyom.denied');
const who = byId(denied);
setTimeout(function () {
D.openModal('🔒 Access restricted',
'<p>' + esc(who ? who.name + ' (' + who.id + ')' : denied) + '\'s health data is private. Only that crew member and the ' +
'<b style="color:#F5C518">4 mission officials</b> can open it:</p><ul style="margin:10px 0 0 18px">' +
OFFICIALS.map(id => '<li>' + id + ' · ' + esc(byId(id).name) + ' · ' + esc(byId(id).designation) + '</li>').join('') +
'</ul><p style="margin-top:10px">You are back on your own dashboard.</p>');
}, 400);
}

/* 3. "Signed in as" card in the sidebar */
const brand = document.querySelector('.side__brand');
if (brand) {
const card = document.createElement('div');
card.style.cssText = 'margin:12px 0;padding:10px 12px;border:1px solid rgba(245,197,24,.45);border-radius:12px;background:#0f0f0f;font-size:.78rem;line-height:1.45;color:#A1A1A1';
card.innerHTML = 'Signed in as<br><b style="color:#fff">' + esc(me.id + ' · ' + me.name) + '</b><br>' +
(official ? '<span style="color:#F5C518;font-weight:700">🛡 Mission official · can view all crew</span>'
: '<span>Crew member · own data only</span>') +
(crew.id !== viewer ? '<br><span style="color:#F5C518">Viewing ' + esc(crew.name) + ' (official access)</span>' : '') +
'<br><a href="crew.html" style="color:#F5C518">Switch user</a>';
brand.insertAdjacentElement('afterend', card);
}

/* 4. Astronaut switcher at the top */
const sw = document.getElementById('crewSwitch');
if (sw) {
Array.prototype.forEach.call(sw.options, function (o) {
if (isOfficial(o.value)) o.textContent += ' · 🛡';
if (!official && o.value !== viewer) { o.disabled = true; o.textContent += ' · 🔒'; }
});
sw.title = official ? 'Mission official: you can open any crew member' : 'Only the 4 mission officials can open other crew members';
}

/* 5. Crew & Buddy screen */
const crewScreen = SCREENS.crew;
SCREENS.crew = function () {
let html = crewScreen();
html = html.replace('Choose what the commander can see about', 'Choose what the crew overview shows mission officials about');
html = html.replace(/(<span class="m-mate__id">)(CREW-\d\d)/g, (m, a, id) => a + (isOfficial(id) ? '🛡 ' : '') + id);
if (official) {
return html.replace('<div class="m-crew">', '<p class="m-small" style="margin-bottom:10px">🛡 You are a mission official: you can open any crew member\'s record.</p><div class="m-crew">');
}
const start = html.indexOf('<div class="m-crew">'), end = html.indexOf('<div class="m-grid2">');
if (start === -1 || end === -1) return html;
const ev = evaluate(crew.id);
const cards = D.crewList.map(function (c) {
const tag = '<span class="m-mate__id">' + (isOfficial(c.id) ? '🛡 ' : '') + c.id + (c.id === crew.id ? ' · you' : '') + '</span>' +
'<b>' + esc(c.name) + '</b><small>' + esc(c.designation) + '</small>';
if (c.id === crew.id) return '<a class="m-mate is-me" href="#home">' + tag + '<span class="m-mate__score">' + ev.score + ' · ' + badge(ev.overall) + '</span></a>';
return '<div class="m-mate" style="opacity:.75">' + tag + '<span class="chip">🔒 Officials only</span></div>';
}).join('');
return html.slice(0, start) +
'<p class="m-small" style="margin-bottom:10px">🔒 You can see only your own health data. Crew members marked 🛡 are the 4 mission officials who can view everyone\'s record.</p>' +
'<div class="m-crew">' + cards + '</div>' + html.slice(end);
};

/* 6. Tables on Home and Reports that list the whole crew */
function ownRowOnly(fn) {
const all = D.crewList;
D.crewList = [crew];
try { return fn(); } finally { D.crewList = all; }
}
const reminders = reminderTable;
reminderTable = function () {
if (official) return reminders().replace('Other crew members\' rows are fictional demo data.', '🛡 Official view: all crew shown. Other crew members\' rows are fictional demo data.');
return ownRowOnly(reminders)
.replace(/\(\d+ of 16 still have tasks left\)/, '(your tasks only)')
.replace('Other crew members\' rows are fictional demo data.', '🔒 Other crew members\' rows are visible only to the 4 mission officials.');
};
const readinessAll = readinessTable;
readinessTable = function () {
if (official) return readinessAll();
return ownRowOnly(readinessAll).replace('</table></div>', '</table></div><p class="m-small">🔒 Other crew members\' readiness is visible only to the 4 mission officials.</p>');
};
})();