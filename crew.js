/* ==========================================================
   PRANAVYOM ZERO-GRAM — Interface 2: Crew Selection Portal
   1. Crew data: 16 fictional astronauts with permanent IDs
   2. Builds one card per astronaut (8 per page)
   3. Arrows switch between CREW-01–08 and CREW-09–16
   4. Clicking a card selects that astronaut and opens their flight deck
   ========================================================== */

(function () {
  'use strict';

  /* ---------- 1. CREW DATA (fictional demonstration crew) ---------- */
  const CREW = [
    { id: 'CREW-01', name: 'Arjun Mehta',        designation: 'Mission Commander',              specialisation: 'Long-duration mission leadership and crisis decisions', quote: 'A crew is only as strong as the person having the hardest day.' },
    { id: 'CREW-02', name: 'Elena Vasquez',      designation: 'Spacecraft Pilot',               specialisation: 'Orbital insertion and manual docking',                 quote: 'Smooth hands and a calm mind, every single time.' },
    { id: 'CREW-03', name: 'Priya Nair',         designation: 'Flight Engineer',                specialisation: 'Propulsion and power systems',                          quote: 'If it hums, I can fix it.' },
    { id: 'CREW-04', name: 'Dr. Kwame Mensah',   designation: 'Medical Officer',                specialisation: 'Emergency and space medicine',                          quote: 'Your health is part of the mission plan, not a footnote.' },
    { id: 'CREW-05', name: 'Sofia Lindqvist',    designation: 'Mission Scientist',              specialisation: 'Planetary atmospheres',                                 quote: 'Every answer we find out here is a gift back to Earth.' },
    { id: 'CREW-06', name: 'Hiroshi Tanaka',     designation: 'Research Specialist',            specialisation: 'Materials science in microgravity',                     quote: 'Patience is the most precise instrument on board.' },
    { id: 'CREW-07', name: 'Amara Okafor',       designation: 'Life Support Engineer',          specialisation: 'Air revitalisation and water recovery',                 quote: 'Every breath on this ship is my responsibility.' },
    { id: 'CREW-08', name: 'Lucas Moreau',       designation: 'Robotics Specialist',            specialisation: 'Robotic arm operations and spacewalk support',          quote: 'The robot does the heavy lifting. I do the worrying.' },
    { id: 'CREW-09', name: 'Zara Haddad',        designation: 'Navigation Officer',             specialisation: 'Deep-space trajectory planning',                        quote: 'Know exactly where you are, and you will always find home.' },
    { id: 'CREW-10', name: 'Daniel Kim',         designation: 'Communications Specialist',      specialisation: 'Deep-space network and signal-delay operations',        quote: 'A twenty-minute delay teaches you to say only what matters.' },
    { id: 'CREW-11', name: 'Inês Carvalho',      designation: 'Biologist',                      specialisation: 'Plant growth in closed ecosystems',                     quote: 'Growing lettuce in space still makes me smile.' },
    { id: 'CREW-12', name: 'Rohan Iyer',         designation: 'Systems Engineer',               specialisation: 'Avionics and fault diagnosis',                          quote: 'Small warnings caught early prevent big emergencies.' },
    { id: 'CREW-13', name: 'Dr. Grace Whitfield',designation: 'Space Medicine Researcher',      specialisation: 'Bone and muscle countermeasures',                       quote: 'We study the body so the next crew can go further.' },
    { id: 'CREW-14', name: 'Mateo Rossi',        designation: 'Geologist',                      specialisation: 'Martian surface sampling',                              quote: 'Every rock is a page from a planet\'s diary.' },
    { id: 'CREW-15', name: 'Naledi Dlamini',     designation: 'Environmental Systems Specialist', specialisation: 'Radiation and cabin environment monitoring',          quote: 'I listen to the ship so the crew can rest.' },
    { id: 'CREW-16', name: 'Samuel Brooks',      designation: 'Mission Operations Specialist',  specialisation: 'Crew scheduling and workload planning',                 quote: 'A good plan always leaves room for rest.' }
  ].map(function (c) {
    const slug = c.id.toLowerCase();                                   // "crew-01"
    return Object.assign({}, c, {
      photo: 'assets/crew/' + slug + '.jpg',
      dashboard: 'astronaut.html?crew=' + c.id,                       // this astronaut's flight deck
      fictional: true
    });
  });

  const PER_PAGE = 8;
  const STORAGE_KEY = 'pranavyom.selectedCrewId';

  /* ---------- page elements ---------- */
  const track = document.getElementById('rosterTrack');
  const pages = [document.getElementById('page1'), document.getElementById('page2')];
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const rangeText = document.getElementById('crewRange');
  const pageText = document.getElementById('crewPage');
  const selectedText = document.getElementById('crewSelected');
  const template = document.getElementById('crewCardTemplate');

  const pad = n => String(n).padStart(2, '0');
  const findCrew = id => CREW.find(c => c.id === id) || null;

  /* ---------- backup portrait (shown when a photo file is missing) ---------- */
  function backupPortrait(c) {
    const initials = c.name.replace(/^Dr\.\s*/, '').split(' ').map(w => w[0]).join('').slice(0, 2);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 420">' +
      '<defs><radialGradient id="g" cx="0.5" cy="0.35" r="0.7"><stop offset="0" stop-color="#2a2a28"/><stop offset="1" stop-color="#101010"/></radialGradient>' +
      '<linearGradient id="v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f1f1e"/><stop offset="1" stop-color="#000"/></linearGradient></defs>' +
      '<rect width="400" height="420" fill="url(#g)"/>' +
      '<path d="M40 420 C 50 330 120 290 200 288 C 280 290 350 330 360 420 Z" fill="#2c2c2a"/>' +
      '<ellipse cx="200" cy="290" rx="92" ry="20" fill="#3a3a38"/>' +
      '<circle cx="200" cy="180" r="112" fill="#323230"/>' +
      '<rect x="112" y="128" width="176" height="104" rx="50" fill="url(#v)" stroke="#444" stroke-width="3"/>' +
      '<rect x="140" y="174" width="120" height="8" rx="4" fill="#F5C518" opacity="0.9"/>' +
      '<text x="200" y="395" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#F5C518" letter-spacing="4">' + initials + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* ---------- 2. Build the 16 cards ---------- */
  CREW.forEach(function (c, i) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.crewId = c.id;
    card.setAttribute('aria-label', c.id + ', ' + c.name + ', ' + c.designation);
    card.style.animationDelay = (i % PER_PAGE) * 60 + 'ms';

    const img = card.querySelector('.crew-card__img');
    img.alt = 'Portrait of ' + c.name + ', ' + c.designation + ' (fictional crew member)';
    img.addEventListener('error', function onError() {
      img.removeEventListener('error', onError);
      img.src = backupPortrait(c);
      card.classList.add('has-backup-photo');
    });
    img.src = c.photo;

    card.querySelector('.crew-card__id').textContent = c.id;
    card.querySelector('.crew-card__name').textContent = c.name;
    card.querySelector('.crew-card__role').textContent = c.designation;
    card.querySelector('.crew-card__spec').textContent = c.specialisation;
    card.querySelector('.crew-card__quote').textContent = '“' + c.quote + '”';

    // Click: highlight the astronaut, then open their own flight deck
    card.addEventListener('click', function () { selectAndOpen(c.id); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAndOpen(c.id); }
    });

    pages[Math.floor(i / PER_PAGE)].appendChild(card);
  });
  document.getElementById('crewCount').textContent = CREW.length;

  /* ---------- 3. Paging: 8 at a time ---------- */
  let current = 0;
  function showPage(n) {
    current = Math.max(0, Math.min(pages.length - 1, n));
    track.style.transform = 'translateX(' + (-100 * current) + '%)';
    pages.forEach(function (p, i) {
      const hidden = i !== current;
      p.inert = hidden;
      p.setAttribute('aria-hidden', hidden);
    });
    const from = current * PER_PAGE + 1, to = Math.min(CREW.length, from + PER_PAGE - 1);
    rangeText.textContent = 'Viewing ' + pad(from) + '–' + pad(to) + ' of ' + CREW.length;
    pageText.textContent = pad(current + 1) + ' / ' + pad(pages.length);
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === pages.length - 1;
  }
  prevBtn.addEventListener('click', function () { showPage(current - 1); });
  nextBtn.addEventListener('click', function () { showPage(current + 1); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') showPage(current + 1);
    if (e.key === 'ArrowLeft') showPage(current - 1);
  });

  let startX = null;
  track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', function (e) {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 60) showPage(current + (dx < 0 ? 1 : -1));
    startX = null;
  });

  /* ---------- 4. Selecting and opening an astronaut ---------- */
  let selectedId = null;
  function selectCrew(id) {
    const crew = findCrew(id);
    if (!crew) return;
    selectedId = id;
    document.querySelectorAll('.crew-card').forEach(function (card) {
      const on = card.dataset.crewId === id;
      card.classList.toggle('is-selected', on);
      card.setAttribute('aria-pressed', on);
    });
    selectedText.textContent = 'Selected: ' + crew.id + ' · ' + crew.name;
    selectedText.classList.add('is-active');
    try { sessionStorage.setItem(STORAGE_KEY, id); } catch (e) { /* storage blocked */ }
    document.dispatchEvent(new CustomEvent('crew:selected', { detail: crew }));
  }

  function openDashboard(id) {
    const crew = findCrew(id);
    if (crew) window.location.href = crew.dashboard;
  }
  function selectAndOpen(id) {
    selectCrew(id);
    setTimeout(function () { openDashboard(id); }, 350);   // short pause so the yellow highlight is seen
  }

  window.PranavyomCrew = {
    list: CREW,
    getById: findCrew,
    getSelected: function () { return findCrew(selectedId); },
    select: selectCrew,
    openDashboard: openDashboard
  };

  /* ---------- start ---------- */
  let remembered = null;
  try { remembered = sessionStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  if (remembered && findCrew(remembered)) {
    selectCrew(remembered);
    showPage(Math.floor(CREW.findIndex(c => c.id === remembered) / PER_PAGE));
  } else {
    showPage(0);
  }
})();