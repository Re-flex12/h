import { TOPICS } from '../data/topics.js';
import { esc, fmt, T } from '../core/format.js';
import { settings } from '../core/store.js';
import { CALCS, CALC, DISCIPLINES } from '../calcs/index.js';
import { EQUATIONS } from '../data/equations.js';
import { LESSONS } from '../data/lessons.js';
import { MATERIALS } from '../data/materials.js';
import { CONSTANTS } from '../data/constants.js';
import { VALIDATION } from '../data/validation.js';
import { PHYSICS, QUANTUM, MATHS, ENGINEERING, TOOLS_LIST, REFERENCE_LIST, PLATFORM, FEATURE_STATUS } from '../data/taxonomy.js';
import { solveBeam } from '../solvers/beam-core.js';
import { crumbs, calcTile, linkTile, pageHead, taxGroups, SIMS, SOLVERS, toolHref, parseItem, LEVEL_NAME } from './common.js';

function countTopics() {
  let n = 0, live = 0;
  const walk = gs => gs.forEach(g => g.items.forEach(i => { n++; if (i.includes('>')) live++; }));
  walk(PHYSICS.groups); QUANTUM.areas.forEach(a => walk(a.groups)); walk(MATHS.groups); ENGINEERING.disciplines.forEach(d => walk(d.groups));
  return { n, live };
}

function heroFigure() {
  const L = 10, r = solveBeam({ L, E: 210e9, I: 2.3e-5, supports: [{ x: 0, type: 'pin' }, { x: 6, type: 'roller' }, { x: 10, type: 'roller' }], loads: [{ type: 'udl', x1: 0, x2: 6, w1: 8e3, w2: 8e3 }, { type: 'point', x: 8, P: 30e3 }] });
  const W = 560, X = x => 30 + x / L * (W - 60);
  const mMax = Math.max(...r.M.map(Math.abs)), vMax = Math.max(...r.V.map(Math.abs)), dMax = Math.max(...r.defl.map(Math.abs));
  const path = (xs, ys, y0, s) => xs.map((x, i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${(y0 - ys[i] * s).toFixed(1)}`).join('');
  const arrows = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5].map(x => `<path d="M${X(x)} 20v18m-4-6 4 6 4-6" class="ld"/>`).join('');
  return `<svg viewBox="0 0 ${W} 330" role="img" aria-label="Live beam analysis">
    <style>.bm{stroke:var(--ink);stroke-width:4}.ld{stroke:var(--c4);stroke-width:1.6;fill:none}.sp{fill:none;stroke:var(--ink2);stroke-width:1.5}.ax2{stroke:var(--line2);stroke-dasharray:3 4}.lbl{font-family:var(--mono);font-size:10.5px;fill:var(--ink3)}</style>
    <text class="lbl" x="${X(0)}" y="12">8 kN/m</text><path d="M${X(0)} 20H${X(6)}" class="ld"/>${arrows}
    <text class="lbl" x="${X(8) + 6}" y="24">30 kN</text><path d="M${X(8)} 6v34m-5-8 5 8 5-8" class="ld" style="stroke-width:2.2"/>
    <line class="bm" x1="${X(0)}" x2="${X(10)}" y1="46" y2="46"/>
    ${[0, 6, 10].map((x, i) => `<path class="sp" d="M${X(x)} 48l-8 12h16z"/>${i ? `<circle class="sp" cx="${X(x)}" cy="63" r="2.5"/>` : ''}`).join('')}
    <text class="lbl" x="${X(0)}" y="92">SHEAR V(x)</text><line class="ax2" x1="${X(0)}" x2="${X(10)}" y1="125" y2="125"/>
    <path d="${path(r.sx, r.V, 125, 28 / vMax)}" fill="none" stroke="var(--c2)" stroke-width="2"/>
    <text class="lbl" x="${X(0)}" y="178">MOMENT M(x)</text><line class="ax2" x1="${X(0)}" x2="${X(10)}" y1="215" y2="215"/>
    <path d="${path(r.sx, r.M, 215, 32 / mMax)}L${X(10)} 215L${X(0)} 215Z" fill="var(--acc)" fill-opacity=".14" stroke="var(--acc)" stroke-width="2"/>
    <text class="lbl" x="${X(0)}" y="270">DEFLECTION v(x)</text><line class="ax2" x1="${X(0)}" x2="${X(10)}" y1="290" y2="290"/>
    <path d="${path(r.x, r.defl, 290, 24 / dMax)}" fill="none" stroke="var(--c3)" stroke-width="2"/>
    <text class="lbl" x="${X(10)}" y="325" text-anchor="end">R = ${r.reactions.map(x => (x.R / 1e3).toFixed(1)).join(' / ')} kN · |M|max = ${(mMax / 1e3).toFixed(1)} kN·m</text>
  </svg>`;
}

export function home(main) {
  const t = countTopics();
  const validated = Object.values(VALIDATION).reduce((s, c) => s + c.length, 0);
  const popular = ['pipe-flow', 'shaft-torsion', 'beam-cases', 'reynolds', 'three-phase', 'psychro', 'bolt', 'black-hole', 'mohr', 'lmtd', 'iso-fit', 'lorentz'].map(id => CALC[id]);
  const eng = ENGINEERING.disciplines;
  main.innerHTML = `
  <section class="hero">
    <div>
      <span class="mono small" style="color:var(--acc);letter-spacing:.12em">PHYSICS + ENGINEERING TOOLKIT</span>
      <h1 style="margin-top:12px">Learn it.<br>Calculate it.<br><em>Simulate</em> it.<br>Apply it.</h1>
      <p class="lede">One platform that grows with you: from A-level moments, through a degree’s beam theory, to a professional calculation sheet with equations, assumptions, units and sources.</p>
      <div class="hero-search" onclick="physengSearch()" role="button" tabindex="0" onkeydown="if(event.key==='Enter')physengSearch()"><span>⌕</span><div>Search: reynolds · 4140 · FL³/48EI · three-phase · black hole</div></div>
      <p class="small mt"><a href="#/tools/ask">Or ask a question in plain English →</a> <span class="muted">e.g. “water in a 25 mm pipe at 2 m/s — turbulent?”</span></p>
      <div class="pipeline">
        <a href="#/learn"><span class="n">01 / LEARN</span><span class="w">Learn</span><span class="s">Theory at three depths</span></a>
        <a href="#/calculators"><span class="n">02 / CALCULATE</span><span class="w">Calculate</span><span class="s">${CALCS.length} calculators</span></a>
        <a href="#/sims"><span class="n">03 / SIMULATE</span><span class="w">Simulate</span><span class="s">Solvers & simulations</span></a>
        <a href="#/workspace"><span class="n">04 / APPLY</span><span class="w">Apply</span><span class="s">Projects & reports</span></a>
      </div>
    </div>
    <figure class="hero-fig" style="margin:0">${heroFigure()}<figcaption class="cap"><span>LIVE · 2-span continuous beam solved in your browser</span><a href="#/solvers/beam">Open solver →</a></figcaption></figure>
  </section>
  <div class="stats">
    <div><b>${CALCS.length}</b><span>Calculators</span></div><div><b>${EQUATIONS.length}</b><span>Equations</span></div><div><b>${t.n}</b><span>Topics mapped</span></div>
    <div><b>${MATERIALS.length}</b><span>Materials</span></div><div><b>${CONSTANTS.length}</b><span>Constants</span></div><div><b>${Object.keys(SIMS).length + Object.values(SOLVERS).filter(s => s.live).length}</b><span>Sims & solvers</span></div><div><b>${validated}</b><span>Validation checks</span></div>
  </div>

  <div class="sec-head"><div><span class="code">02 / CALCULATE</span><h2>Popular tools</h2></div><a class="btn ghost sm" href="#/calculators">All ${CALCS.length} calculators →</a></div>
  <div class="grid auto">${popular.map(calcTile).join('')}</div>

  <div class="sec-head"><div><span class="code">ENG / DISCIPLINES</span><h2>Explore engineering</h2></div><a class="btn ghost sm" href="#/engineering">Engineering →</a></div>
  <div class="disc">${eng.map(d => `<a href="#/engineering/${d.id}"><code>${d.code}</code><b>${esc(d.name)}</b><span>${d.groups.reduce((s, g) => s + g.items.length, 0)} topics · ${CALCS.filter(c => d.calc.includes(c.disc)).length} calcs</span></a>`).join('')}
    <a href="#/physics"><code>PHY</code><b>Physics</b><span>Mechanics → nuclear</span></a><a href="#/maths"><code>MTH</code><b>Mathematics</b><span>Algebra → numerics</span></a></div>

  <div class="mt2 qr-band">
    <div><span class="code">SEPARATE SECTION · Q&amp;R</span><h2 style="margin:8px 0 10px">Quantum &amp; Relativity</h2><p class="muted">Its own top-level area — not a “modern physics” footnote. Quantum mechanics, atomic physics, quantum information, special and general relativity, black holes, gravitational waves, cosmology and particle physics.</p>
    <div class="btns"><a class="btn" style="background:var(--qr);border-color:var(--qr)" href="#/quantum">Enter Quantum &amp; Relativity →</a><a class="btn ghost" href="#/sims/minkowski">Minkowski diagram</a><a class="btn ghost" href="#/sims/bh-orbit">Black-hole orbits</a></div></div>
    <div class="rows">${['black-hole', 'lorentz', 'tunnel', 'hydrogen', 'cosmology', 'gps'].map((id, i) => `<a href="#/calc/${id}"><span class="ri">Q${String(i + 1).padStart(2, '0')}</span><span class="rt">${esc(CALC[id].title)}</span><span class="rd">${CALC[id].sub || ''}</span></a>`).join('')}</div>
  </div>

  <div class="sec-head"><div><span class="code">ONE TOPIC · THREE DEPTHS</span><h2>Same physics, different depth</h2></div><span class="muted small">Your level: <b>${LEVEL_NAME[settings.level]}</b> — change it in the header</span></div>
  <div class="grid g3">
    <div class="panel tick"><span class="badge lv-school">School</span><h3 style="margin:10px 0 6px">What is a moment?</h3><p class="muted small">Turning effect of a force, principle of moments, balancing a see-saw.</p><a class="btn ghost sm" href="#/learn/moments">Lesson →</a></div>
    <div class="panel tick"><span class="badge lv-uni">University</span><h3 style="margin:10px 0 6px">Reactions, SFD &amp; BMD</h3><p class="muted small">Equilibrium of a simply supported beam; dM/dx = V; the flexure formula.</p><a class="btn ghost sm" href="#/learn/beam-bending">Lesson →</a></div>
    <div class="panel tick"><span class="badge lv-pro">Professional</span><h3 style="margin:10px 0 6px">Beam analysis &amp; checks</h3><p class="muted small">Indeterminate beams, deflection limits, stress vs material, calculation sheet.</p><a class="btn ghost sm" href="#/solvers/beam">Beam solver →</a></div>
  </div>

  <div class="sec-head"><div><span class="code">REF / RELIABILITY</span><h2>Built to be checked</h2></div><a class="btn ghost sm" href="#/about">Method &amp; reliability →</a></div>
  <div class="grid g4">
    ${[['Stated equations', 'Every result shows the equations used, rendered and exportable.'], ['Assumptions & limits', 'Validity range, simplifications and what the tool does not check.'], ['Sources', 'Material/property data and methods cite handbooks, standards or papers.'], ['Automated validation', `${validated} reference cases (IAPWS-IF97, ICAO, ISO 898, ISO 286, Roark…) run in the test suite.`]].map(([a, b], i) => `<div class="panel"><span class="mono small" style="color:var(--acc)">0${i + 1}</span><h3 style="margin:6px 0">${a}</h3><p class="muted small" style="margin:0">${b}</p></div>`).join('')}
  </div>`;
}

export function physics(main) {
  main.innerHTML = `${crumbs([['Physics']])}${pageHead('02 / PHY', 'Physics', esc(PHYSICS.blurb))}
    <div class="toc">${PHYSICS.groups.map(g => `<a class="chip" href="#/physics#g-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${esc(g.name)}</a>`).join('')}<a class="chip" href="#/quantum" style="border-color:var(--qr);color:var(--qr)">Quantum &amp; Relativity →</a></div>
    <div class="sec-head"><h2>Calculators</h2></div><div class="grid auto">${CALCS.filter(c => DISCIPLINES[c.disc]?.section === 'physics').map(calcTile).join('')}</div>
    <div class="sec-head"><h2>Topic guides</h2><a class="btn ghost sm" href="#/topics">All topic guides →</a></div><div class="grid auto">${TOPICS.filter(t => t.sec === 'physics').slice(0, 8).map(t => linkTile(`#/topic/${t.id}`, t.group, t.title, t.summary.split('. ')[0] + '.', 'Read →')).join('')}</div>
    <div class="sec-head"><h2>Lessons &amp; simulations</h2></div><div class="grid auto">${LESSONS.filter(l => l.section === 'physics').map(l => linkTile(`#/learn/${l.id}`, `Learn · ${l.topic}`, l.title, l.intro, 'Learn →')).join('')}${['projectile', 'pendulum'].map(id => linkTile(`#/sims/${id}`, 'Simulation', SIMS[id].title, SIMS[id].d, 'Run →')).join('')}</div>
    <div class="sec-head"><h2>Topic map</h2><span class="muted small">Linked topics open a live lesson, calculator, equation or simulation</span></div>${taxGroups(PHYSICS.groups)}`;
}

export function quantum(main) {
  const calcs = CALCS.filter(c => DISCIPLINES[c.disc]?.section === 'quantum');
  main.innerHTML = `${crumbs([['Quantum & Relativity']])}${pageHead('03 / Q&R — SEPARATE SECTION', 'Quantum & Relativity', 'Explore physics beyond the classical world. Quantum Mechanics · Special Relativity · General Relativity · Atomic Physics · Particle Physics · Quantum Field Theory.', true)}
    <div class="toc">${QUANTUM.areas.map(a => `<a class="chip" href="#/quantum#a-${a.id}">${esc(a.name)}</a>`).join('')}</div>
    <div class="grid g4">${linkTile('#/quantum/circuit', 'Quantum information', 'Quantum Circuit Simulator', 'Up to 5 qubits: gates, entanglement, Bloch vectors, Grover and Deutsch–Jozsa.', 'Build →', 'qr')}${['wavefunction', 'minkowski', 'bh-orbit'].map(id => linkTile(`#/sims/${id}`, 'Simulation', SIMS[id].title, SIMS[id].d, 'Run →', 'qr')).join('')}</div>
    <div class="sec-head"><div><span class="code" style="color:var(--qr)">Q&amp;R CALCULATOR LIBRARY</span><h2>Calculators</h2></div></div>
    ${['Quantum foundations', 'Wave–particle duality', 'Quantum mechanics', 'Quantum systems', 'Atomic physics', 'Quantum information', 'Special relativity', 'General relativity', 'Black holes', 'Gravitational waves', 'Cosmology', 'Particle physics'].map(sub => {
      const cs = calcs.filter(c => c.sub === sub);
      return cs.length ? `<h4 style="margin:18px 0 8px">${esc(sub)}</h4><div class="grid auto">${cs.map(calcTile).join('')}</div>` : '';
    }).join('')}
    <div class="sec-head"><h2>Lessons</h2></div><div class="grid auto">${LESSONS.filter(l => l.section === 'quantum').map(l => linkTile(`#/learn/${l.id}`, `Learn · ${l.topic}`, l.title, l.intro, 'Learn →', 'qr')).join('')}</div>
    ${QUANTUM.areas.map(a => `<div class="sec-head" id="a-${a.id}"><div><span class="code" style="color:var(--qr)">Q&amp;R / ${a.id.toUpperCase()}</span><h2>${esc(a.name)}</h2></div></div>${taxGroups(a.groups)}`).join('')}`;
}

export function engineering(main) {
  main.innerHTML = `${crumbs([['Engineering']])}${pageHead('04 / ENG', 'Engineering', esc(ENGINEERING.blurb))}
    <div class="disc">${ENGINEERING.disciplines.map(d => `<a href="#/engineering/${d.id}"><code>${d.code}</code><b>${esc(d.name)}</b><span>${d.groups.reduce((s, g) => s + g.items.length, 0)} topics · ${CALCS.filter(c => d.calc.includes(c.disc)).length} calcs</span></a>`).join('')}</div>
    <div class="sec-head"><h2>Solvers</h2></div><div class="grid g2">${['beam', 'truss'].map(id => linkTile(`#/solvers/${id}`, 'Solver', SOLVERS[id].title, SOLVERS[id].d, 'Solve →')).join('')}</div>
    <div class="sec-head"><h2>Connected system example: pump → motor → supply</h2></div>
    <div class="rows">${[['FLU', 'pipe-flow', 'Pipe network → required head & pump shaft power'], ['FLU', 'pump-power', 'Pump → shaft power → suggested motor size'], ['ELE', 'motor', 'Motor → line current, torque, losses'], ['ELE', 'three-phase', 'Three-phase supply → currents & kVA'], ['ELE', 'voltage-drop', 'Cable → voltage drop & power loss'], ['THM', 'radiation', 'Motor losses → surface heat rejection']].map(([c, id, d], i) => `<a href="#/calc/${id}"><span class="ri">${String(i + 1).padStart(2, '0')} ${c}</span><span class="rt">${esc(CALC[id].title)}</span><span class="rd">${esc(d)}</span></a>`).join('')}</div>`;
}

export function discipline(main, [id]) {
  const d = ENGINEERING.disciplines.find(x => x.id === id);
  const extraTools = { hvac: [['#/tools/psychro', 'Tool', 'Interactive Psychrometric Chart', 'Place states, see RH/enthalpy lines and process loads.']], signals: [['#/tools/fft', 'Tool', 'Signal Analysis (FFT)', 'Spectra, windows, peaks and THD.']], fluids: [['#/solvers/pipe-network', 'Solver', 'Pipe Network Solver', 'Loops, reservoirs, demands and pumps.']], thermo: [['#/solvers/cycle', 'Solver', 'Thermodynamic Cycle Solver', 'P–v and T–s diagrams for gas cycles.']], electrical: [['#/solvers/circuit', 'Solver', 'Circuit Solver', 'DC/AC nodal analysis and frequency sweeps.']], vibrations: [['#/solvers/vibration', 'Solver', 'MDOF Vibration Solver', 'Modes and frequency response.']], mechanical: [['#/solvers/gear', 'Solver', 'Drive Train Solver', 'Motor → gears → load.']], structural: [['#/solvers/beam', 'Solver', 'Beam Solver', 'Reactions, SFD, BMD, deflection.'], ['#/solvers/truss', 'Solver', 'Truss Solver', 'Member forces by direct stiffness.']], controls: [['#/calc/pid', 'Solver', 'PID Simulator', 'Closed-loop response.'], ['#/calc/bode', 'Solver', 'Bode / Nyquist', 'Margins and stability.']], computational: [['#/tools/numerics', 'Tool', 'Numerical Methods Lab', 'Algorithms step by step.'], ['#/tools/matrix', 'Tool', 'Matrix Tool', 'Linear algebra.']], experimental: [['#/tools/data', 'Tool', 'Data Analysis', 'CSV statistics and regression.'], ['#/tools/uncertainty', 'Tool', 'Uncertainty', 'GUM + Monte Carlo.']] }[id] || [];
  if (!d) { main.innerHTML = '<p>Unknown discipline.</p>'; return; }
  const calcs = CALCS.filter(c => d.calc.includes(c.disc));
  main.innerHTML = `${crumbs([['Engineering', '#/engineering'], [d.name]])}${pageHead(`ENG / ${d.code}`, d.name, '')}
    ${extraTools.length ? `<div class="grid auto mb">${extraTools.map(t => linkTile(...t, 'Open →')).join('')}</div>` : ''}
    ${calcs.length ? `<div class="sec-head"><h2>Calculators</h2><span class="muted small">${calcs.length}</span></div><div class="grid auto">${calcs.map(calcTile).join('')}</div>` : `<div class="msg info">No dedicated calculators yet for ${esc(d.name)} — the topic map below shows what is planned and what already links to live tools elsewhere on the site.</div>`}
    <div class="sec-head"><h2>Topic map</h2></div>${taxGroups(d.groups)}`;
}

export function maths(main) {
  main.innerHTML = `${crumbs([['Mathematics']])}${pageHead('05 / MTH', 'Mathematics', esc(MATHS.blurb))}
    <div class="grid g4">${[['solver', 'Equation Solver', 'Solve any equation for any variable.'], ['matrix', 'Matrix Tool', 'Determinants, inverses, eigenvalues, Ax = b.'], ['numerics', 'Numerical Methods Lab', 'Roots, integration, differentiation, ODEs.'], ['graph', 'Graphing', 'Functions, data, log axes, regression.'], ['data', 'Data Analysis', 'Statistics and least squares.'], ['uncertainty', 'Uncertainty', 'Error propagation, Monte Carlo.'], ['fft', 'Signal Analysis', 'FFT spectra, windows, THD.'], ['dimensions', 'Dimensional Analysis', 'Check any equation.']].map(([id, t, dd]) => linkTile(toolHref(id), 'Tool', t, dd, 'Open →')).join('')}</div>
    <div class="sec-head"><h2>Calculators</h2></div><div class="grid auto">${CALCS.filter(c => c.disc === 'maths').map(calcTile).join('')}</div>
    <div class="sec-head"><h2>Topic guides</h2><a class="btn ghost sm" href="#/topics">All topic guides →</a></div><div class="grid auto">${TOPICS.filter(t => t.sec === 'maths').slice(0, 8).map(t => linkTile(`#/topic/${t.id}`, t.group, t.title, t.summary.split('. ')[0] + '.', 'Read →')).join('')}</div>
    <div class="sec-head"><h2>Topic map</h2></div>${taxGroups(MATHS.groups)}`;
}

export function tools(main) {
  main.innerHTML = `${crumbs([['Tools']])}${pageHead('06 / TLS', 'Tools', 'Calculators, solvers, simulations and analysis tools. Everything computes in coherent SI internally and displays in the unit system you choose.')}
    <div class="grid auto">${TOOLS_LIST.map(([id, t, dd]) => linkTile(id === 'calculators' ? '#/calculators' : id === 'solvers' ? '#/solvers' : id === 'sims' ? '#/sims' : toolHref(id), 'Tool', t, dd, 'Open →')).join('')}</div>`;
}

export function reference(main) {
  main.innerHTML = `${crumbs([['Reference']])}${pageHead('07 / REF', 'Reference', 'A digital engineering handbook: equations, constants, materials, fluid & property tables, engineering tables and a standards guide.')}
    <div class="grid auto">${REFERENCE_LIST.map(([id, t, dd]) => linkTile(`#/reference/${id}`, 'Reference', t, dd, 'Open →')).join('')}</div>`;
}

export function contentMap(main) {
  const t = countTopics();
  const plat = (name, s) => { const items = s.split('|'); return `<div class="grp"><h3>${esc(name)} <small>${items.filter(i => FEATURE_STATUS.live.includes(i)).length}/${items.length} live</small></h3><ul>${items.map(i => FEATURE_STATUS.live.includes(i) ? `<li class="live"><a href="#/workspace">${esc(i)}</a></li>` : `<li>${esc(i)}</li>`).join('')}</ul></div>`; };
  main.innerHTML = `${crumbs([['Content map']])}${pageHead('MAP', 'Full content map', `Everything the platform covers — <b>${t.n}</b> topics, of which <b>${t.live}</b> already link to a live lesson, calculator, equation, simulation or solver. Unlinked items are planned.`)}
    <div class="toc">${['Physics', 'Quantum & Relativity', 'Engineering', 'Mathematics', 'Tools & Reference', 'Platform'].map((s, i) => `<a class="chip" href="#/content-map#m-${i}">${esc(s)}</a>`).join('')}</div>
    <div class="sec-head" id="m-0"><h2>Physics</h2></div>${taxGroups(PHYSICS.groups)}
    <div class="sec-head" id="m-1"><div><span class="code" style="color:var(--qr)">SEPARATE TOP-LEVEL SECTION</span><h2>Quantum &amp; Relativity</h2></div></div>${QUANTUM.areas.map(a => `<h4 style="margin:10px 0">${esc(a.name)}</h4>${taxGroups(a.groups)}`).join('')}
    <div class="sec-head" id="m-2"><h2>Engineering</h2></div>${ENGINEERING.disciplines.map(d => `<h4 style="margin:10px 0"><a href="#/engineering/${d.id}" style="color:inherit">${d.code} · ${esc(d.name)}</a></h4>${taxGroups(d.groups)}`).join('')}
    <div class="sec-head" id="m-3"><h2>Mathematics</h2></div>${taxGroups(MATHS.groups)}
    <div class="sec-head" id="m-4"><h2>Tools &amp; Reference</h2></div>
    <div class="tax"><div class="grp"><h3>Tools</h3><ul>${TOOLS_LIST.map(([id, tt]) => `<li class="live"><a href="${id === 'calculators' ? '#/calculators' : id === 'solvers' ? '#/solvers' : id === 'sims' ? '#/sims' : toolHref(id)}">${esc(tt)}</a></li>`).join('')}</ul></div>
      <div class="grp"><h3>Solvers</h3><ul>${Object.entries(SOLVERS).map(([id, s]) => s.live ? `<li class="live"><a href="${s.href || `#/solvers/${id}`}">${esc(s.title)}</a></li>` : `<li>${esc(s.title)}</li>`).join('')}</ul></div>
      <div class="grp"><h3>Simulations</h3><ul>${Object.entries(SIMS).map(([id, s]) => `<li class="live"><a href="#/sims/${id}">${esc(s.title)}</a></li>`).join('')}</ul></div>
      <div class="grp"><h3>Reference</h3><ul>${REFERENCE_LIST.map(([id, tt]) => `<li class="live"><a href="#/reference/${id}">${esc(tt)}</a></li>`).join('')}</ul></div></div>
    <div class="sec-head" id="m-5"><h2>Platform features</h2></div><div class="tax">${plat('Student features', PLATFORM.student)}${plat('Professional features', PLATFORM.professional)}${plat('Personal workspace', PLATFORM.workspace)}</div>`;
}

export function about(main) {
  const validated = Object.entries(VALIDATION);
  main.innerHTML = `${crumbs([['Method & reliability']])}${pageHead('REF / METHOD', 'Method & reliability', 'How calculations are made, what they assume, and how they are checked.')}
  <div class="split">
    <div class="panel tick"><h3>Calculation engine</h3>
      <ul class="list"><li>All inputs are converted to coherent SI before calculation; results are converted back to your chosen units. Temperature conversions handle offsets; temperature <i>differences</i> are a separate quantity.</li>
      <li>Every calculator declares: equations, assumptions, applicable range/limitations, data sources and a version. These are shown on the page and included in exported calculation sheets.</li>
      <li>Iterative results (Colebrook friction factor, IF97 saturation, numerical solving) iterate to machine precision and report non-convergence.</li>
      <li>Materials are labelled <i>typical</i> or <i>specification minimum</i>, with condition/temper. They are not design allowables.</li></ul></div>
    <div class="panel tick"><h3>What this is — and is not</h3>
      <p>PHYSENG is for education, preliminary design and checking. Results are <b>not certified engineering analysis</b>. Code-governed work — pressure equipment, structures, electrical installations, lifting — must follow the governing standard (edition cited) and be checked by a qualified engineer.</p>
      <p class="muted small">Standards are described and referenced, never reproduced. See the <a href="#/reference/standards">standards guide</a>.</p></div>
  </div>
  <div class="sec-head"><div><span class="code">AUTOMATED VALIDATION</span><h2>Reference cases in the test suite</h2></div><span class="mono small muted">npm test</span></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Calculator</th><th>Reference</th><th class="num">Checks</th></tr></thead><tbody>
    ${validated.map(([id, cs]) => cs.map((c, i) => `<tr><td>${i ? '' : `<a href="#/calc/${id}">${esc(CALC[id].title)}</a>`}</td><td>${esc(c.source)}</td><td class="num">${Object.keys(c.expect).length}</td></tr>`).join('')).join('')}
  </tbody></table></div>
  <p class="muted small mt">The suite also runs every calculator with its defaults (finite results), checks every library equation can be solved for every variable, verifies unit-conversion factors against exact definitions, and checks the beam and truss solvers against closed-form solutions for determinate and indeterminate cases.</p>`;
}
