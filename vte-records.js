/* PRANAVYOM ZERO-GRAM · vte-records.js (part 2 of the VTE Monitor)
   Medical investigation records (D-dimer, Doppler, CBC), history timeline and
   trend chart, and links into the Action Center and the report to Earth.
   Values are stored exactly as entered: the app never interprets or diagnoses. */
'use strict';
const INV = {
dd: { title: 'A · D-dimer', f: [['date', 'Test date', 'date'], ['result', 'Result', 'number'], ['unit', 'Unit', 'text', 'e.g. ng/mL FEU'], ['range', 'Laboratory reference range', 'text', 'e.g. < 500 ng/mL FEU'], ['interp', 'Medical officer\'s interpretation', 'text'], ['by', 'Entered by (medical officer)', 'text']] },
dop: { title: 'B · Venous Doppler ultrasound', f: [['date', 'Test date', 'date'], ['loc', 'Examination location', 'text', 'e.g. left popliteal vein'], ['find', 'Clinician-entered findings', 'text'], ['status', 'Report status', 'select', 'Preliminary|Final|Awaiting specialist review'], ['notes', 'Medical officer\'s notes', 'text'], ['by', 'Entered by (medical officer)', 'text']] },
cbc: { title: 'C · Complete blood count', f: [['date', 'Test date', 'date'], ['plt', 'Platelet count (×10⁹/L)', 'number'], ['hb', 'Haemoglobin (g/dL)', 'number'], ['hct', 'Haematocrit (%)', 'number'], ['range', 'Laboratory reference ranges', 'text', 'e.g. Plt 150–400 · Hb 13–17 · Hct 39–50'], ['by', 'Entered by (medical officer)', 'text']] }
};
function vteInvestigations(d) {
return '<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">Medical investigation records <small>(entered by authorised medical personnel only · not daily tests)</small></h2>' +
Object.keys(INV).map(k => { const t = INV[k], rows = d.inv[k];
return '<details style="margin:10px 0;border:1px solid #262626;border-radius:12px;padding:10px 14px"><summary style="cursor:pointer;font-weight:700">' + t.title + ' <span class="m-small">(' + rows.length + ' record' + (rows.length === 1 ? '' : 's') + ')</span></summary>' +
'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin-top:10px">' + t.f.map(f => '<label class="m-small">' + f[1] +
(f[2] === 'select' ? '<select class="m-select" style="width:100%;margin-top:4px" data-inv="' + k + '.' + f[0] + '">' + f[3].split('|').map(o => '<option>' + o + '</option>').join('') + '</select>' :
'<input class="m-select" style="width:100%;margin-top:4px" type="' + f[2] + '" step="any" data-inv="' + k + '.' + f[0] + '" placeholder="' + (f[3] || '') + '">') + '</label>').join('') +
'</div><button class="pill-btn small" type="button" data-invsave="' + k + '" style="margin-top:10px">Save record</button>' +
(rows.length ? '<div class="m-table-wrap"><table class="m-table"><tr>' + t.f.map(f => '<th>' + f[1] + '</th>').join('') + '</tr>' + rows.slice().reverse().map(r => '<tr>' + t.f.map(f => '<td>' + esc(r[f[0]] || '—') + '</td>').join('') + '</tr>').join('') + '</table></div>' : '<p class="m-small">No records yet.</p>') + '</details>'; }).join('') +
'<p class="m-small">Values are stored exactly as entered. The app does not interpret them: an elevated D-dimer does not confirm a clot, and Doppler findings are interpreted only by qualified medical personnel.</p></section>';
}
function vteHistory(d) {
const list = d.assessments.slice().reverse(), max = 6, W = 860, H = 140;
const bars = d.assessments.slice(-10), bw = W / Math.max(10, bars.length);
let chart = '<div class="m-chart"><svg viewBox="0 0 ' + W + ' ' + (H + 24) + '" role="img" aria-label="Number of symptoms reported per questionnaire">' +
bars.map((a, i) => { const n = yesList(a).length, hgt = Math.max(3, n / max * H); return '<rect x="' + (i * bw + 8) + '" y="' + (H - hgt) + '" width="' + (bw - 16) + '" height="' + hgt + '" rx="4" fill="' + (a.level === 'emergency' ? '#e5484d' : a.level === 'review' ? '#F5C518' : '#3fbf5f') + '"><title>' + fmtD(a.at) + ': ' + n + ' symptom(s)</title></rect><text x="' + (i * bw + bw / 2) + '" y="' + (H + 16) + '" text-anchor="middle">' + fmtD(a.at).slice(0, 6) + '</text>'; }).join('') +
'</svg><div class="m-legend"><span>Bar height = number of symptoms reported</span><span><i class="l-band"></i>none</span><span><i class="l-target"></i>review</span><span><i class="l-red"></i>emergency</span></div></div>';
return '<section class="m-card glow-card"><h2 class="m-h2" style="margin-top:0">VTE history &amp; trend</h2>' + chart +
'<div style="border-left:2px solid #F5C518;margin:14px 0 0 6px;padding-left:16px">' + list.map(a => { const ys = yesList(a);
return '<div style="margin-bottom:14px"><p><b>' + fmtDT(a.at) + '</b> ' + badge(LEVEL[a.level][0]).replace(WORD[LEVEL[a.level][0]], LEVEL[a.level][1]) + (a.demo ? ' <span class="chip">demo</span>' : '') + '</p>' +
'<p class="m-small">Symptoms: ' + (ys.length ? esc(ys.join(', ')) : 'none reported') + ' · Review: ' + esc(a.review) + (a.revNote ? ' — "' + esc(a.revNote) + '"' : '') + (a.notes ? ' · Notes: "' + esc(a.notes) + '"' : '') + '</p>' +
'<p class="m-small">Follow-up: ' + (a.level === 'emergency' ? 'Emergency protocol; medical officer and Earth flight surgeon review.' : a.level === 'review' ? 'Prompt flight medical officer assessment; repeat questionnaire after review.' : 'Continue 15-day questionnaire; report new symptoms at once.') + '</p></div>'; }).join('') + '</div>' +
(d.alerts.length ? '<h3 class="m-h2" style="font-size:1rem">Alert history</h3><table class="m-table"><tr><th>Time</th><th>Priority</th><th>Symptoms</th></tr>' + d.alerts.slice().reverse().map(a => '<tr><td>' + fmtDT(a.at) + '</td><td class="m-' + (a.priority === 'EMERGENCY' ? 'red' : 'yellow') + '-text">' + a.priority + '</td><td>' + esc(a.symptoms.join(', ')) + '</td></tr>').join('') + '</table>' : '') + '</section>';
}

/* Health overview: Action Center card and Reports to Earth line */
const vteAction = SCREENS.action;
SCREENS.action = function () { const s = vteState(), l = s.last; if (l.level === 'none' || l.review === 'Reviewed') return vteAction();
return vteAction().replace(DEMO_NOTE, '<section class="m-action glow-card m-action--' + (l.level === 'emergency' ? 'red' : 'yellow') + '"><div class="m-action__head"><h2>💓 Venous health (VTE)</h2>' + badge(LEVEL[l.level][0]).replace(WORD[LEVEL[l.level][0]], LEVEL[l.level][1]) + '</div><p>Reported ' + fmtDT(l.at) + ': ' + esc(yesList(l).join(', ')) + '. ' + (l.level === 'emergency' ? '<b>Seek immediate emergency medical assessment and follow the spacecraft emergency protocol.</b>' : 'Prompt assessment by the flight medical officer.') + '</p><button class="cta" type="button" data-go="vte">Open VTE Monitor →</button></section>' + DEMO_NOTE); };
const vteReport = report;
report = function () { const s = vteState(), l = s.last, ys = yesList(l);
return vteReport().replace('\n\nDecision support only', '\n- VTE questionnaire (' + fmtD(l.at) + '): ' + (ys.length ? ys.join(', ') : 'no symptoms reported') + ' · review: ' + l.review + (s.overdue ? ' · NEXT QUESTIONNAIRE OVERDUE' : '') + '\n\nDecision support only'); };