import { solveBeam } from '../solvers/beam-core.js';
import { solveTruss } from '../solvers/truss-core.js';
import { MATERIALS, materialSI } from '../data/materials.js';
import { toSI, fromSI } from '../core/units.js';
import { fmt, num, esc, toast, debounce } from '../core/format.js';
import { plotSVG } from '../core/plot.js';
import { settings, getProjects, createProject, addToProject } from '../core/store.js';
import { crumbs, pageHead, linkTile, SOLVERS } from './common.js';
import { encodeState, decodeState } from './calc.js';

export function index(main) {
  main.innerHTML = `${crumbs([['Tools', '#/tools'], ['Solvers']])}${pageHead('06 / TLS / SOLVE', 'Solvers', 'A calculator handles one relation (torque + rpm → power). A solver handles a whole system. Live solvers are interactive and export calculation sheets; the rest are on the roadmap.')}
    <div class="grid auto">${Object.entries(SOLVERS).map(([id, s]) => s.live ? linkTile(`#/solvers/${id}`, 'Solver · live', s.title, s.d, 'Open solver →') : `<div class="tile" style="opacity:.6"><span class="k"><span>Solver · planned</span><span class="badge plan">Roadmap</span></span><span class="t">${esc(s.title)}</span><span class="d">${esc(s.d)}</span></div>`).join('')}</div>`;
}
export function planned(main, [id]) {
  const s = SOLVERS[id];
  main.innerHTML = `${crumbs([['Solvers', '#/solvers'], [s?.title || id]])}${pageHead('SOLVER / PLANNED', s?.title || 'Solver', esc(s?.d || ''))}<div class="msg info">This solver is on the roadmap. Related calculators are available now — try search.</div>`;
}

const UNITSETS = {
  si: { len: 'm', force: 'kN', line: 'kN/m', mom: 'kN·m', defl: 'mm', stress: 'MPa', E: 'GPa', I: 'cm⁴', sec: 'mm' },
  metric: { len: 'm', force: 'kN', line: 'kN/m', mom: 'kN·m', defl: 'mm', stress: 'MPa', E: 'GPa', I: 'cm⁴', sec: 'mm' },
  imperial: { len: 'ft', force: 'kip', line: 'kip/ft', mom: 'kip·ft', defl: 'in', stress: 'ksi', E: 'Msi', I: 'in⁴', sec: 'in' },
};
const DIM = { len: 'length', force: 'force', line: 'stiffness', mom: 'torque', defl: 'length', stress: 'pressure', E: 'pressure', I: 'areamoment', sec: 'length' };

function saveSheet(title, payload) {
  window.__physengReport = payload;
  try { sessionStorage.setItem('physeng.report', JSON.stringify(payload)); } catch (e) { /* ignore */ }
  location.hash = '#/report';
}
function saveToProject(kind, title, stateObj, summary) {
  const ps = getProjects();
  const name = ps.length ? prompt(`Save to which project?\n${ps.map((p, i) => `${i + 1}. ${p.name}`).join('\n')}\n\nEnter a number, or a new project name:`, '1') : prompt('New project name:', 'My project');
  if (name === null) return;
  const idx = parseInt(name, 10);
  const pid = ps[idx - 1]?.id ?? createProject(name || 'Untitled project').id;
  addToProject(pid, { kind, title, state: stateObj, result: summary });
  toast('Saved to project');
}

// ── Beam solver ─────────────────────────────────────────────────
const BEAM_PRESETS = {
  ss: { name: 'Simply supported, point load', L: 6, supports: [{ x: 0, type: 'pin' }, { x: 6, type: 'roller' }], loads: [{ type: 'point', x: 3, P: 20e3 }] },
  udl: { name: 'Simply supported, UDL', L: 6, supports: [{ x: 0, type: 'pin' }, { x: 6, type: 'roller' }], loads: [{ type: 'udl', x1: 0, x2: 6, w1: 10e3, w2: 10e3 }] },
  cant: { name: 'Cantilever, end load + UDL', L: 3, supports: [{ x: 0, type: 'fixed' }], loads: [{ type: 'point', x: 3, P: 5e3 }, { type: 'udl', x1: 0, x2: 3, w1: 2e3, w2: 2e3 }] },
  over: { name: 'Overhanging beam', L: 8, supports: [{ x: 0, type: 'pin' }, { x: 6, type: 'roller' }], loads: [{ type: 'udl', x1: 0, x2: 6, w1: 8e3, w2: 8e3 }, { type: 'point', x: 8, P: 15e3 }] },
  cont: { name: '2-span continuous (indeterminate)', L: 10, supports: [{ x: 0, type: 'pin' }, { x: 5, type: 'roller' }, { x: 10, type: 'roller' }], loads: [{ type: 'udl', x1: 0, x2: 10, w1: 12e3, w2: 12e3 }] },
  ff: { name: 'Fixed–fixed, triangular load', L: 6, supports: [{ x: 0, type: 'fixed' }, { x: 6, type: 'fixed' }], loads: [{ type: 'udl', x1: 0, x2: 6, w1: 0, w2: 15e3 }] },
  couple: { name: 'Applied couple', L: 5, supports: [{ x: 0, type: 'pin' }, { x: 5, type: 'roller' }], loads: [{ type: 'moment', x: 2, M: 20e3 }] },
};

export function beam(main, _, query) {
  const U = UNITSETS[settings.units];
  const c2 = (k, v) => fromSI(v, DIM[k], U[k]), s2 = (k, v) => toSI(v, DIM[k], U[k]);
  const shared = query.get('s') && decodeState(query.get('s'));
  const st = shared || { ...structuredClone(BEAM_PRESETS.over), mat: 'st-s355', E: 210e9, Sy: 355e6, sec: 'ibeam', b: 0.1, h: 0.2, tf: 0.0085, tw: 0.0056, I: 1.943e-5, c: 0.1 };
  const secProps = () => {
    const { b, h, tf, tw, D, t } = st;
    switch (st.sec) {
      case 'rect': return { I: b * h ** 3 / 12, c: h / 2 };
      case 'tube': { const d = D - 2 * t; return { I: Math.PI * (D ** 4 - d ** 4) / 64, c: D / 2 }; }
      case 'ibeam': { const hw = h - 2 * tf; return { I: (b * h ** 3 - (b - tw) * hw ** 3) / 12, c: h / 2 }; }
      default: return { I: st.I, c: st.c };
    }
  };
  main.innerHTML = `${crumbs([['Solvers', '#/solvers'], ['Beam solver']])}${pageHead('SOLVER / BEAM', 'Beam Solver', 'Drag supports and loads along the beam, or edit the tables. Reactions, shear force, bending moment, deflection and stress update instantly. Handles statically indeterminate beams (continuous, propped, fixed–fixed).')}
  <div class="toolbar noprint"><select class="plain" id="preset" style="max-width:300px"><option value="">Load a preset…</option>${Object.entries(BEAM_PRESETS).map(([k, p]) => `<option value="${k}">${esc(p.name)}</option>`).join('')}</select><span class="grow"></span><button class="btn ghost sm" id="bShare">Share link</button><button class="btn ghost sm" id="bSave">Save to project</button><button class="btn sm" id="bSheet">Calculation sheet / PDF</button></div>
  <div class="panel tick" style="padding:10px"><svg id="bsvg" viewBox="0 0 800 190" style="width:100%;height:auto;display:block;touch-action:none;user-select:none"></svg><div class="small muted mono" style="padding:0 6px">Drag ▲ supports and ↓ loads · positions snap to ${U.len === 'm' ? '0.05 m' : '0.25 ft'}</div></div>
  <div class="calc mt">
    <div class="panel">
      <h4>Beam, material & section</h4>
      <div class="grid g2 mt"><div class="field"><label>Length L</label><div class="in"><input id="bL"><span class="unit-fixed">${U.len}</span></div></div>
      <div class="field"><label>Material</label><div class="in"><select id="bMat">${MATERIALS.filter(m => m.E > 1).map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}<option value="__custom">Custom</option></select></div></div>
      <div class="field"><label>E</label><div class="in"><input id="bE"><span class="unit-fixed">${U.E}</span></div></div><div class="field"><label>Yield / strength</label><div class="in"><input id="bSy"><span class="unit-fixed">${U.stress}</span></div></div>
      <div class="field"><label>Section</label><div class="in"><select id="bSec"><option value="ibeam">I-section</option><option value="rect">Rectangle</option><option value="tube">Circular tube</option><option value="custom">Custom (enter I, c)</option></select></div></div><div></div></div>
      <div class="grid g2" id="secF"></div>
      <div id="secOut" class="small mono muted"></div>
      <div class="panel-title mt2"><h4>Supports</h4><button class="btn ghost sm" id="addS">+ Support</button></div><div id="supT"></div>
      <div class="panel-title mt2"><h4>Loads</h4><span><button class="btn ghost sm" id="addP">+ Point</button> <button class="btn ghost sm" id="addW">+ Distributed</button> <button class="btn ghost sm" id="addM">+ Couple</button></span></div><div id="ldT"></div>
      <p class="small muted mt">Signs: loads positive downward; couples positive clockwise; reactions positive upward. Distributed loads may vary linearly (w₁ → w₂) for triangular/trapezoidal loading.</p>
    </div>
    <div class="panel"><h4>Results</h4><div id="bRes" class="mt"></div></div>
  </div>
  <div class="grid g3 mt" id="bPlots"></div>`;

  const $ = s => main.querySelector(s);
  let res = null;
  const snap = x => { const q = U.len === 'm' ? 0.05 : toSI(0.25, 'length', 'ft'); return Math.min(st.L, Math.max(0, Math.round(x / q) * q)); };

  function drawForms() {
    $('#bL').value = num(c2('len', st.L));
    $('#bMat').value = st.mat; $('#bE').value = num(c2('E', st.E)); $('#bSy').value = num(c2('stress', st.Sy)); $('#bSec').value = st.sec;
    const fields = { ibeam: [['b', 'Flange width b'], ['h', 'Depth h'], ['tf', 'Flange t_f'], ['tw', 'Web t_w']], rect: [['b', 'Width b'], ['h', 'Depth h']], tube: [['D', 'Outer diameter D'], ['t', 'Wall t']], custom: [['I', 'I'], ['c', 'Extreme fibre c']] }[st.sec];
    st.D ??= 0.1; st.t ??= 0.005;
    $('#secF').innerHTML = fields.map(([k, l]) => `<div class="field"><label>${l}</label><div class="in"><input data-sec="${k}" value="${num(k === 'I' ? c2('I', st.I) : c2('sec', st[k]))}"><span class="unit-fixed">${k === 'I' ? U.I : U.sec}</span></div></div>`).join('');
    $('#secF').querySelectorAll('[data-sec]').forEach(i => i.oninput = () => { const v = Number(i.value); if (v > 0) { st[i.dataset.sec] = i.dataset.sec === 'I' ? s2('I', v) : s2('sec', v); solve(); } });
    const typeSel = t => ['pin', 'roller', 'fixed'].map(o => `<option${o === t ? ' selected' : ''}>${o}</option>`).join('');
    $('#supT').innerHTML = `<table class="tbl"><thead><tr><th>Type</th><th>x (${U.len})</th><th></th></tr></thead><tbody>${st.supports.map((s, i) => `<tr><td><select class="plain" data-st="${i}">${typeSel(s.type)}</select></td><td><input class="plain" data-sx="${i}" value="${num(c2('len', s.x), 4)}"></td><td><button class="btn ghost sm" data-sd="${i}">✕</button></td></tr>`).join('')}</tbody></table>`;
    $('#ldT').innerHTML = `<table class="tbl"><thead><tr><th>Type</th><th>Position (${U.len})</th><th>Magnitude</th><th></th></tr></thead><tbody>${st.loads.map((l, i) => {
      if (l.type === 'point') return `<tr><td>Point</td><td><input class="plain" data-lx="${i}" value="${num(c2('len', l.x), 4)}"></td><td><div class="in"><input data-lp="${i}" value="${num(c2('force', l.P), 4)}"><span class="unit-fixed">${U.force}</span></div></td><td><button class="btn ghost sm" data-ld="${i}">✕</button></td></tr>`;
      if (l.type === 'moment') return `<tr><td>Couple ↻</td><td><input class="plain" data-lx="${i}" value="${num(c2('len', l.x), 4)}"></td><td><div class="in"><input data-lm="${i}" value="${num(c2('mom', l.M), 4)}"><span class="unit-fixed">${U.mom}</span></div></td><td><button class="btn ghost sm" data-ld="${i}">✕</button></td></tr>`;
      return `<tr><td>Distributed</td><td><div class="in"><input data-lx1="${i}" value="${num(c2('len', l.x1), 4)}"><span class="unit-fixed">→</span><input data-lx2="${i}" value="${num(c2('len', l.x2), 4)}"></div></td><td><div class="in"><input data-lw1="${i}" value="${num(c2('line', l.w1), 4)}"><span class="unit-fixed">→</span><input data-lw2="${i}" value="${num(c2('line', l.w2), 4)}"><span class="unit-fixed">${U.line}</span></div></td><td><button class="btn ghost sm" data-ld="${i}">✕</button></td></tr>`;
    }).join('')}</tbody></table>`;
    const bind = (attr, fn) => main.querySelectorAll(`[${attr}]`).forEach(el => { el.oninput = el.onchange = () => { const i = +el.getAttribute(attr); fn(i, el); solve(); }; });
    bind('data-st', (i, el) => { st.supports[i].type = el.value; });
    bind('data-sx', (i, el) => { const v = Number(el.value); if (Number.isFinite(v)) st.supports[i].x = Math.min(st.L, Math.max(0, s2('len', v))); });
    bind('data-lx', (i, el) => { const v = Number(el.value); if (Number.isFinite(v)) st.loads[i].x = Math.min(st.L, Math.max(0, s2('len', v))); });
    bind('data-lp', (i, el) => { const v = Number(el.value); if (Number.isFinite(v)) st.loads[i].P = s2('force', v); });
    bind('data-lm', (i, el) => { const v = Number(el.value); if (Number.isFinite(v)) st.loads[i].M = s2('mom', v); });
    ['x1', 'x2'].forEach(k => bind(`data-l${k}`, (i, el) => { const v = Number(el.value); if (Number.isFinite(v)) st.loads[i][k] = Math.min(st.L, Math.max(0, s2('len', v))); }));
    ['w1', 'w2'].forEach(k => bind(`data-l${k}`, (i, el) => { const v = Number(el.value); if (Number.isFinite(v)) st.loads[i][k] = s2('line', v); }));
    main.querySelectorAll('[data-sd]').forEach(b => b.onclick = () => { st.supports.splice(+b.dataset.sd, 1); drawForms(); solve(); });
    main.querySelectorAll('[data-ld]').forEach(b => b.onclick = () => { st.loads.splice(+b.dataset.ld, 1); drawForms(); solve(); });
  }

  const X0 = 50, X1 = 750, BY = 100;
  const sx = x => X0 + x / st.L * (X1 - X0);
  function drawBeam() {
    const svg = $('#bsvg');
    let g = `<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8z" fill="var(--c4)"/></marker><marker id="ahp" markerWidth="12" markerHeight="12" refX="12" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L12 6L0 12z" fill="var(--c3)"/></marker></defs>`;
    g += `<line x1="${X0}" x2="${X1}" y1="${BY}" y2="${BY}" stroke="var(--ink)" stroke-width="6"/>`;
    for (let i = 0; i <= 10; i++) { const x = st.L * i / 10; g += `<line x1="${sx(x)}" x2="${sx(x)}" y1="172" y2="178" stroke="var(--line2)"/><text x="${sx(x)}" y="188" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--ink3)">${fmt(c2('len', x), 3)}</text>`; }
    st.loads.forEach((l, i) => {
      if (l.type === 'udl') {
        const a = Math.min(l.x1, l.x2), b = Math.max(l.x1, l.x2), wm = Math.max(Math.abs(l.w1), Math.abs(l.w2)) || 1;
        const ht = w => 12 + 38 * Math.abs(w) / wm;
        g += `<path d="M${sx(a)} ${BY - 8 - ht(l.w1)}L${sx(b)} ${BY - 8 - ht(l.w2)}" stroke="var(--c4)" stroke-width="1.5"/>`;
        const n = Math.max(2, Math.round((sx(b) - sx(a)) / 30));
        for (let k = 0; k <= n; k++) { const x = a + (b - a) * k / n, w = l.w1 + (l.w2 - l.w1) * k / n; g += `<line x1="${sx(x)}" x2="${sx(x)}" y1="${BY - 8 - ht(w)}" y2="${BY - 6}" stroke="var(--c4)" stroke-width="1.2" marker-end="url(#ah)"/>`; }
        g += `<text x="${(sx(a) + sx(b)) / 2}" y="${BY - 14 - ht(Math.max(l.w1, l.w2))}" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--c4)">${fmt(c2('line', l.w1), 3)}${l.w1 !== l.w2 ? `→${fmt(c2('line', l.w2), 3)}` : ''} ${U.line}</text>`;
      } else if (l.type === 'point') {
        g += `<g data-drag="l${i}" style="cursor:ew-resize"><rect x="${sx(l.x) - 14}" y="${BY - 78}" width="28" height="74" fill="transparent"/><line x1="${sx(l.x)}" x2="${sx(l.x)}" y1="${BY - 70}" y2="${BY - 6}" stroke="var(--c3)" stroke-width="3" marker-end="url(#ahp)"/><text x="${sx(l.x) + 7}" y="${BY - 62}" font-family="var(--mono)" font-size="11" fill="var(--c3)">${fmt(c2('force', l.P), 3)} ${U.force}</text></g>`;
      } else {
        g += `<g data-drag="l${i}" style="cursor:ew-resize"><path d="M${sx(l.x) - 16} ${BY - 4}A16 16 0 1 1 ${sx(l.x) + 16} ${BY - 4}" fill="none" stroke="var(--qr)" stroke-width="2.5"/><path d="M${sx(l.x) + 16} ${BY - 4}l-5 -7m5 7l6 -5" stroke="var(--qr)" stroke-width="2.5"/><text x="${sx(l.x)}" y="${BY - 28}" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--qr)">${fmt(c2('mom', l.M), 3)} ${U.mom}</text></g>`;
      }
    });
    st.supports.forEach((s, i) => {
      const x = sx(s.x);
      let shape;
      if (s.type === 'fixed') { const dir = s.x < st.L / 2 ? -1 : 1; shape = `<rect x="${dir < 0 ? x - 10 : x}" y="${BY - 26}" width="10" height="52" fill="var(--line2)"/>${[0, 1, 2, 3, 4].map(k => `<line x1="${x + dir * 10}" x2="${x + dir * 18}" y1="${BY - 22 + k * 11}" y2="${BY - 30 + k * 11}" stroke="var(--ink3)"/>`).join('')}`; }
      else shape = `<path d="M${x} ${BY + 3}l-13 22h26z" fill="none" stroke="var(--acc)" stroke-width="2.5"/>${s.type === 'roller' ? `<circle cx="${x - 7}" cy="${BY + 30}" r="4" fill="none" stroke="var(--acc)" stroke-width="2"/><circle cx="${x + 7}" cy="${BY + 30}" r="4" fill="none" stroke="var(--acc)" stroke-width="2"/>` : `<line x1="${x - 16}" x2="${x + 16}" y1="${BY + 27}" y2="${BY + 27}" stroke="var(--acc)" stroke-width="2"/>`}`;
      const r = res?.reactions?.[i];
      const lbl = r ? `<text x="${x}" y="${BY + 52}" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--acc)">R=${fmt(c2('force', r.R), 3)}${r.M ? ` M=${fmt(c2('mom', r.M), 3)}` : ''}</text>` : '';
      g += `<g data-drag="s${i}" style="cursor:ew-resize"><rect x="${x - 18}" y="${BY}" width="36" height="42" fill="transparent"/>${shape}${lbl}</g>`;
    });
    svg.innerHTML = g;
  }

  let drag = null;
  const svg = $('#bsvg');
  const toX = ev => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return (p.x - X0) / (X1 - X0) * st.L; };
  svg.addEventListener('pointerdown', ev => { const t = ev.target.closest('[data-drag]'); if (!t) return; drag = t.dataset.drag; svg.setPointerCapture(ev.pointerId); ev.preventDefault(); });
  svg.addEventListener('pointermove', ev => {
    if (!drag) return;
    const x = snap(toX(ev)), i = +drag.slice(1);
    if (drag[0] === 's') st.supports[i].x = x; else st.loads[i].x = x;
    solve(false);
  });
  const end = () => { if (drag) { drag = null; drawForms(); } };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);

  function solve(forms = false) {
    const { I, c } = secProps();
    st.Iu = I; st.cu = c;
    $('#secOut').textContent = `I = ${fmt(c2('I', I), 5)} ${U.I} · c = ${fmt(c2('sec', c), 4)} ${U.sec}`;
    res = solveBeam({ L: st.L, E: st.E, I, supports: st.supports, loads: st.loads });
    drawBeam();
    const out = $('#bRes'), plots = $('#bPlots');
    if (res.error) { out.innerHTML = `<div class="msg bad">${esc(res.error)}</div>`; plots.innerHTML = ''; return; }
    const sig = Math.abs(res.maxM.v) * c / I, n = st.Sy / sig;
    const ratio = st.L / Math.abs(res.maxDefl.v);
    out.innerHTML = `<div class="readouts">
      <div class="readout primary"><div class="rl">Max bending moment</div><div class="rv">${fmt(c2('mom', res.maxM.v), 4)}<span class="u">${U.mom} @ ${fmt(c2('len', res.maxM.x), 3)} ${U.len}</span></div></div>
      <div class="readout"><div class="rl">Max shear force</div><div class="rv">${fmt(c2('force', res.maxV.v), 4)}<span class="u">${U.force}</span></div></div>
      <div class="readout"><div class="rl">Max deflection</div><div class="rv">${fmt(c2('defl', res.maxDefl.v), 4)}<span class="u">${U.defl} @ ${fmt(c2('len', res.maxDefl.x), 3)} ${U.len}</span></div></div>
      <div class="readout"><div class="rl">Span / deflection</div><div class="rv">L/${Number.isFinite(ratio) ? Math.round(ratio) : '∞'}</div></div>
      <div class="readout"><div class="rl">Max bending stress (Mc/I)</div><div class="rv">${fmt(c2('stress', sig), 4)}<span class="u">${U.stress}</span></div></div>
      <div class="readout"><div class="rl">Factor of safety vs yield</div><div class="rv">${fmt(n, 3)}</div></div></div>
      <table class="tbl mt"><thead><tr><th>Support</th><th class="num">x (${U.len})</th><th class="num">R (${U.force}) ↑</th><th class="num">M (${U.mom}) ↻</th></tr></thead><tbody>${res.reactions.map(r => `<tr><td>${r.type}</td><td class="num">${fmt(c2('len', r.x), 4)}</td><td class="num">${fmt(c2('force', r.R), 5)}</td><td class="num">${r.type === 'fixed' ? fmt(c2('mom', r.M), 5) : '—'}</td></tr>`).join('')}</tbody></table>
      <div class="check ${res.equilibriumError < 1e-6 ? 'pass' : 'fail'}"><span class="st">${res.equilibriumError < 1e-6 ? 'PASS' : 'CHECK'}</span><span>ΣFy = 0: loads ${fmt(c2('force', res.totalLoad), 5)} vs reactions ${fmt(c2('force', res.totalR), 5)} ${U.force}</span></div>
      <div class="check ${n >= 1 ? 'pass' : 'fail'}"><span class="st">${n >= 1 ? 'PASS' : 'FAIL'}</span><span>Bending stress below yield (n = ${fmt(n, 3)})</span></div>
      <p class="small muted mt">${res.determinate ? 'Statically determinate.' : 'Statically indeterminate — solved with Euler–Bernoulli stiffness (compatibility included).'} Deflection-based checks (e.g. L/360) and lateral-torsional buckling must be verified separately.</p>`;
    const mk = (xs, ys, k, label, col) => plotSVG([{ x: xs.map(x => c2('len', x)), y: ys.map(y => c2(k, y)), type: 'area', color: col }], { xlabel: `x (${U.len})`, ylabel: label, h: 230, zero: true });
    plots.innerHTML = `<div class="panel"><h4>Shear force V (${U.force})</h4>${mk(res.sx, res.V, 'force', 'V', 'var(--c2)')}</div><div class="panel"><h4>Bending moment M (${U.mom}, sagging +)</h4>${mk(res.sx, res.M, 'mom', 'M', 'var(--acc)')}</div><div class="panel"><h4>Deflection v (${U.defl})</h4>${mk(res.x, res.defl, 'defl', 'v', 'var(--c3)')}</div>`;
    if (forms) drawForms();
  }

  $('#bL').oninput = () => { const v = Number($('#bL').value); if (v > 0) { const L = s2('len', v); st.supports.forEach(s => { s.x = Math.min(s.x, L); }); st.loads.forEach(l => { if ('x' in l) l.x = Math.min(l.x, L); if ('x1' in l) { l.x1 = Math.min(l.x1, L); l.x2 = Math.min(l.x2, L); } }); st.L = L; solve(); } };
  $('#bMat').onchange = () => { st.mat = $('#bMat').value; const m = materialSI(st.mat); if (m) { st.E = m.E; st.Sy = m.Sy ?? m.Su; $('#bE').value = num(c2('E', st.E)); $('#bSy').value = num(c2('stress', st.Sy)); } solve(); };
  $('#bE').oninput = () => { const v = Number($('#bE').value); if (v > 0) { st.E = s2('E', v); st.mat = '__custom'; $('#bMat').value = '__custom'; solve(); } };
  $('#bSy').oninput = () => { const v = Number($('#bSy').value); if (v > 0) { st.Sy = s2('stress', v); solve(); } };
  $('#bSec').onchange = () => { st.sec = $('#bSec').value; if (st.sec === 'custom') { const p = secProps(); st.I = st.Iu || p.I; st.c = st.cu || p.c; } drawForms(); solve(); };
  $('#addS').onclick = () => { st.supports.push({ x: st.L, type: 'roller' }); drawForms(); solve(); };
  $('#addP').onclick = () => { st.loads.push({ type: 'point', x: st.L / 2, P: 10e3 }); drawForms(); solve(); };
  $('#addW').onclick = () => { st.loads.push({ type: 'udl', x1: 0, x2: st.L, w1: 5e3, w2: 5e3 }); drawForms(); solve(); };
  $('#addM').onclick = () => { st.loads.push({ type: 'moment', x: st.L / 2, M: 10e3 }); drawForms(); solve(); };
  $('#preset').onchange = () => { const p = BEAM_PRESETS[$('#preset').value]; if (p) { Object.assign(st, structuredClone(p)); drawForms(); solve(); } $('#preset').value = ''; };
  const shareUrl = () => `${location.origin}${location.pathname}#/solvers/beam?s=${encodeState(st)}`;
  $('#bShare').onclick = () => navigator.clipboard?.writeText(shareUrl()).then(() => toast('Share link copied'), () => prompt('Copy:', shareUrl()));
  $('#bSave').onclick = () => saveToProject('beam', `Beam: L = ${fmt(c2('len', st.L), 3)} ${U.len}, ${st.supports.length} supports, ${st.loads.length} loads`, st, res && !res.error ? `|M|max = ${fmt(c2('mom', Math.abs(res.maxM.v)), 4)} ${U.mom}; δmax = ${fmt(c2('defl', Math.abs(res.maxDefl.v)), 4)} ${U.defl}` : '');
  $('#bSheet').onclick = () => {
    if (!res || res.error) return;
    const sig = Math.abs(res.maxM.v) * st.cu / st.Iu;
    saveSheet('Beam', {
      id: 'beam', title: 'Beam Analysis', disc: 'Structural — Beam Solver', version: '1.0', date: new Date().toISOString(), units: settings.units, share: shareUrl(),
      inputs: [{ label: 'Span L', value: fmt(c2('len', st.L), 5), unit: U.len }, { label: 'Material', value: MATERIALS.find(m => m.id === st.mat)?.name || 'Custom' }, { label: "Young's modulus E", value: fmt(c2('E', st.E), 5), unit: U.E }, { label: 'Yield strength', value: fmt(c2('stress', st.Sy), 5), unit: U.stress }, { label: 'Second moment I', value: fmt(c2('I', st.Iu), 5), unit: U.I }, { label: 'Extreme fibre c', value: fmt(c2('sec', st.cu), 5), unit: U.sec },
        ...st.supports.map((s, i) => ({ label: `Support ${i + 1}`, value: `${s.type} at x = ${fmt(c2('len', s.x), 4)} ${U.len}` })),
        ...st.loads.map((l, i) => ({ label: `Load ${i + 1}`, value: l.type === 'point' ? `Point ${fmt(c2('force', l.P), 4)} ${U.force} at x = ${fmt(c2('len', l.x), 4)} ${U.len}` : l.type === 'moment' ? `Couple ${fmt(c2('mom', l.M), 4)} ${U.mom} (cw) at x = ${fmt(c2('len', l.x), 4)} ${U.len}` : `Distributed ${fmt(c2('line', l.w1), 4)}→${fmt(c2('line', l.w2), 4)} ${U.line} from ${fmt(c2('len', l.x1), 4)} to ${fmt(c2('len', l.x2), 4)} ${U.len}` }))],
      outputs: [...res.reactions.map((r, i) => ({ label: `Reaction ${i + 1} (${r.type}, x = ${fmt(c2('len', r.x), 4)})`, value: `${fmt(c2('force', r.R), 5)}${r.type === 'fixed' ? ` ${U.force}; M = ${fmt(c2('mom', r.M), 5)} ${U.mom}` : ''}`, unit: r.type === 'fixed' ? '' : U.force })),
        { label: 'Maximum bending moment', value: fmt(c2('mom', res.maxM.v), 5), unit: `${U.mom} at x = ${fmt(c2('len', res.maxM.x), 4)} ${U.len}`, primary: true }, { label: 'Maximum shear force', value: fmt(c2('force', res.maxV.v), 5), unit: U.force },
        { label: 'Maximum deflection', value: fmt(c2('defl', res.maxDefl.v), 5), unit: `${U.defl} at x = ${fmt(c2('len', res.maxDefl.x), 4)} ${U.len}` }, { label: 'Maximum bending stress', value: fmt(c2('stress', sig), 5), unit: U.stress }, { label: 'Factor of safety vs yield', value: fmt(st.Sy / sig, 4), unit: '' }],
      eq: ['EI\\frac{d^4v}{dx^4} = -w(x)', 'EI\\frac{d^2v}{dx^2} = M(x)', '\\frac{dM}{dx} = V,\\quad \\frac{dV}{dx} = -w', '\\sigma = \\frac{Mc}{I}'],
      assume: ['Euler–Bernoulli beam: plane sections remain plane, small deflections, shear deformation neglected.', 'Prismatic beam, linear-elastic homogeneous material.', 'Supports are rigid; pins/rollers resist vertical force only; fixed supports also resist rotation.', 'Self-weight not included unless entered as a distributed load.'],
      limits: ['Lateral-torsional buckling, local buckling, web bearing and shear capacity are not checked.', 'Serviceability limits (e.g. L/250–L/360) and load combinations/partial factors per the governing code (EN 1990/1993, AISC 360) must be applied by the user.'],
      refs: ['Hermite cubic beam finite elements with consistent nodal loads (exact nodal deflections for polynomial loads).', 'Shear force and moment from exact equilibrium of the solved reactions.', 'Validated in the test suite against Roark\'s closed-form cases (SS, cantilever, fixed–fixed, propped, continuous, triangular).'],
      warn: [], info: [], checks: [{ label: 'Global vertical equilibrium', pass: res.equilibriumError < 1e-6, detail: `ΣR = ${fmt(c2('force', res.totalR), 6)} ${U.force}` }, { label: 'Bending stress below yield', pass: st.Sy / sig >= 1, detail: `n = ${fmt(st.Sy / sig, 3)}` }],
      validation: ['Roark closed-form beam cases (automated tests)'],
      viz: $('#bsvg').outerHTML.replace('id="bsvg"', '') + [...$('#bPlots').querySelectorAll('svg')].map(s => s.outerHTML).join(''),
    });
  };

  drawForms();
  solve();
}

// ── Truss solver ────────────────────────────────────────────────
const PRATT = (() => {
  const n = 6, w = 2, hgt = 2, nodes = [], members = [];
  for (let i = 0; i <= n; i++) nodes.push({ x: i * w, y: 0 });
  for (let i = 1; i < n; i++) nodes.push({ x: i * w, y: hgt });
  const top = i => n + i; // top node index for panel point i (1..n-1)
  for (let i = 0; i < n; i++) members.push({ i, j: i + 1 });
  for (let i = 1; i < n - 1; i++) members.push({ i: top(i), j: top(i + 1) });
  for (let i = 1; i < n; i++) members.push({ i, j: top(i) });
  members.push({ i: 0, j: top(1) }, { i: n, j: top(n - 1) });
  for (let i = 1; i < n / 2; i++) members.push({ i: top(i), j: i + 1 });
  for (let i = n / 2 + 1; i < n; i++) members.push({ i: top(i), j: i - 1 });
  return { name: 'Pratt truss (12 m, 6 panels)', nodes, members, supports: [{ node: 0, type: 'pin' }, { node: n, type: 'rollerY' }], loads: [1, 2, 3, 4, 5].map(i => ({ node: i, Fx: 0, Fy: -20e3 })) };
})();
const TRUSS_PRESETS = {
  pratt: PRATT,
  tri: { name: 'Simple triangle', nodes: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 2, y: 3 }], members: [{ i: 0, j: 1 }, { i: 0, j: 2 }, { i: 1, j: 2 }], supports: [{ node: 0, type: 'pin' }, { node: 1, type: 'rollerY' }], loads: [{ node: 2, Fx: 5e3, Fy: -10e3 }] },
  cant: { name: 'Wall-mounted cantilever bracket', nodes: [{ x: 0, y: 0 }, { x: 0, y: 1.5 }, { x: 2, y: 0.75 }, { x: 4, y: 0.75 }, { x: 2, y: 1.5 }], members: [{ i: 0, j: 2 }, { i: 1, j: 4 }, { i: 2, j: 3 }, { i: 4, j: 3 }, { i: 2, j: 4 }, { i: 1, j: 2 }], supports: [{ node: 0, type: 'pin' }, { node: 1, type: 'pin' }], loads: [{ node: 3, Fx: 0, Fy: -8e3 }] },
};

export function truss(main, _, query) {
  const U = UNITSETS[settings.units];
  const c2 = (k, v) => fromSI(v, DIM[k], U[k]), s2 = (k, v) => toSI(v, DIM[k], U[k]);
  const shared = query.get('s') && decodeState(query.get('s'));
  const st = shared || { ...structuredClone(PRATT), E: 200e9, A: 2e-3, Sy: 250e6, showDef: true };
  main.innerHTML = `${crumbs([['Solvers', '#/solvers'], ['Truss solver']])}${pageHead('SOLVER / TRUSS', 'Truss Solver', 'Pin-jointed plane truss by the direct stiffness method. Drag nodes to reshape the truss; member colour shows tension (blue) or compression (red), width shows force.')}
  <div class="toolbar noprint"><select class="plain" id="tp" style="max-width:300px"><option value="">Load a preset…</option>${Object.entries(TRUSS_PRESETS).map(([k, p]) => `<option value="${k}">${esc(p.name)}</option>`).join('')}</select><label class="chip"><input type="checkbox" id="tdef" ${st.showDef ? 'checked' : ''}> deformed shape</label><span class="grow"></span><button class="btn ghost sm" id="tShare">Share link</button><button class="btn ghost sm" id="tSave">Save to project</button></div>
  <div class="panel tick" style="padding:8px"><svg id="tsvg" viewBox="0 0 800 380" style="width:100%;height:auto;display:block;touch-action:none;user-select:none"></svg></div>
  <div class="calc mt"><div class="panel">
    <div class="grid g3"><div class="field"><label>E</label><div class="in"><input id="tE" value="${num(c2('E', st.E))}"><span class="unit-fixed">${U.E}</span></div></div><div class="field"><label>Member area A</label><div class="in"><input id="tA" value="${num(fromSI(st.A, 'area', U.len === 'm' ? 'mm²' : 'in²'))}"><span class="unit-fixed">${U.len === 'm' ? 'mm²' : 'in²'}</span></div></div><div class="field"><label>Yield</label><div class="in"><input id="tSy" value="${num(c2('stress', st.Sy))}"><span class="unit-fixed">${U.stress}</span></div></div></div>
    <div class="panel-title mt"><h4>Nodes</h4><button class="btn ghost sm" id="tAN">+ Node</button></div><div id="tN"></div>
    <div class="panel-title mt"><h4>Members</h4><button class="btn ghost sm" id="tAM">+ Member</button></div><div id="tM"></div>
    <div class="panel-title mt"><h4>Supports & loads</h4><span><button class="btn ghost sm" id="tAS">+ Support</button> <button class="btn ghost sm" id="tAL">+ Load</button></span></div><div id="tSL"></div>
  </div><div class="panel"><h4>Results</h4><div id="tR" class="mt"></div></div></div>`;
  const $ = s => main.querySelector(s);
  let res = null, drag = null;
  const aU = U.len === 'm' ? 'mm²' : 'in²';

  function forms() {
    $('#tN').innerHTML = `<table class="tbl"><thead><tr><th>#</th><th>x (${U.len})</th><th>y (${U.len})</th><th></th></tr></thead><tbody>${st.nodes.map((n, i) => `<tr><td>${i}</td><td><input class="plain" data-nx="${i}" value="${num(c2('len', n.x), 4)}"></td><td><input class="plain" data-ny="${i}" value="${num(c2('len', n.y), 4)}"></td><td><button class="btn ghost sm" data-nd="${i}">✕</button></td></tr>`).join('')}</tbody></table>`;
    $('#tM').innerHTML = `<table class="tbl"><thead><tr><th>#</th><th>Node i</th><th>Node j</th><th></th></tr></thead><tbody>${st.members.map((m, k) => `<tr><td>${k}</td><td><input class="plain" data-mi="${k}" value="${m.i}"></td><td><input class="plain" data-mj="${k}" value="${m.j}"></td><td><button class="btn ghost sm" data-md="${k}">✕</button></td></tr>`).join('')}</tbody></table>`;
    $('#tSL').innerHTML = `<table class="tbl"><tbody>${st.supports.map((s, k) => `<tr><td>Support</td><td>node <input class="plain" style="width:60px" data-sn="${k}" value="${s.node}"></td><td><select class="plain" data-sy="${k}">${[['pin', 'Pin (x & y)'], ['rollerY', 'Roller (y only)'], ['rollerX', 'Roller (x only)']].map(([v, l]) => `<option value="${v}"${v === s.type ? ' selected' : ''}>${l}</option>`).join('')}</select></td><td><button class="btn ghost sm" data-sdl="${k}">✕</button></td></tr>`).join('')}${st.loads.map((l, k) => `<tr><td>Load</td><td>node <input class="plain" style="width:60px" data-ln="${k}" value="${l.node}"></td><td><div class="in"><input data-lfx="${k}" value="${num(c2('force', l.Fx || 0), 4)}" title="Fx"><span class="unit-fixed">Fx</span><input data-lfy="${k}" value="${num(c2('force', l.Fy || 0), 4)}" title="Fy"><span class="unit-fixed">Fy ${U.force}</span></div></td><td><button class="btn ghost sm" data-ldl="${k}">✕</button></td></tr>`).join('')}</tbody></table>`;
    const bind = (attr, fn) => main.querySelectorAll(`[${attr}]`).forEach(el => { el.oninput = el.onchange = () => { const v = el.tagName === 'SELECT' ? el.value : Number(el.value); if (el.tagName !== 'SELECT' && !Number.isFinite(v)) return; fn(+el.getAttribute(attr), v); solve(); }; });
    bind('data-nx', (i, v) => { st.nodes[i].x = s2('len', v); }); bind('data-ny', (i, v) => { st.nodes[i].y = s2('len', v); });
    bind('data-mi', (k, v) => { st.members[k].i = v; }); bind('data-mj', (k, v) => { st.members[k].j = v; });
    bind('data-sn', (k, v) => { st.supports[k].node = v; }); bind('data-sy', (k, v) => { st.supports[k].type = v; });
    bind('data-ln', (k, v) => { st.loads[k].node = v; }); bind('data-lfx', (k, v) => { st.loads[k].Fx = s2('force', v); }); bind('data-lfy', (k, v) => { st.loads[k].Fy = s2('force', v); });
    const del = (attr, arr, after) => main.querySelectorAll(`[${attr}]`).forEach(b => b.onclick = () => { const k = +b.getAttribute(attr); arr.splice(k, 1); after?.(k); forms(); solve(); });
    del('data-md', st.members); del('data-sdl', st.supports); del('data-ldl', st.loads);
    del('data-nd', st.nodes, k => {
      st.members = st.members.filter(m => m.i !== k && m.j !== k).map(m => ({ ...m, i: m.i > k ? m.i - 1 : m.i, j: m.j > k ? m.j - 1 : m.j }));
      st.supports = st.supports.filter(s => s.node !== k).map(s => ({ ...s, node: s.node > k ? s.node - 1 : s.node }));
      st.loads = st.loads.filter(s => s.node !== k).map(s => ({ ...s, node: s.node > k ? s.node - 1 : s.node }));
    });
  }

  let view = null;
  function computeView() {
    const xs = st.nodes.map(n => n.x), ys = st.nodes.map(n => n.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min(680 / (x1 - x0 || 1), 260 / (y1 - y0 || 1));
    view = { s, ox: 400 - (x0 + x1) / 2 * s, oy: 200 + (y0 + y1) / 2 * s };
  }
  const P = (x, y) => [view.ox + x * view.s, view.oy - y * view.s];

  function draw() {
    if (!view) computeView();
    const svg = $('#tsvg');
    let g = '';
    const maxN = res && !res.error ? Math.max(...res.forces.map(f => Math.abs(f.N)), 1) : 1;
    const maxU = res && !res.error ? Math.max(...res.u.map(Math.abs), 1e-12) : 1;
    const dScale = 0.06 * Math.max(...st.nodes.map(n => Math.hypot(n.x, n.y)), 1) / maxU;
    st.members.forEach((m, k) => {
      const a = st.nodes[m.i], b = st.nodes[m.j];
      if (!a || !b) return;
      const f = res && !res.error ? res.forces[k] : null;
      const col = !f || Math.abs(f.N) < maxN * 1e-6 ? 'var(--ink3)' : f.N > 0 ? 'var(--c2)' : 'var(--c3)';
      const [x1, y1] = P(a.x, a.y), [x2, y2] = P(b.x, b.y);
      g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${f ? 1.5 + 6 * Math.abs(f.N) / maxN : 2}" stroke-linecap="round"/>`;
      if (f) g += `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 5}" text-anchor="middle" font-family="var(--mono)" font-size="10.5" fill="${col}" paint-order="stroke" stroke="var(--panel)" stroke-width="3">${fmt(c2('force', f.N), 3)}</text>`;
      if (st.showDef && res && !res.error) {
        const [dx1, dy1] = P(a.x + res.u[2 * m.i] * dScale, a.y + res.u[2 * m.i + 1] * dScale), [dx2, dy2] = P(b.x + res.u[2 * m.j] * dScale, b.y + res.u[2 * m.j + 1] * dScale);
        g += `<line x1="${dx1}" y1="${dy1}" x2="${dx2}" y2="${dy2}" stroke="var(--ink3)" stroke-dasharray="4 4" stroke-width="1"/>`;
      }
    });
    st.supports.forEach(s => {
      const n = st.nodes[s.node]; if (!n) return;
      const [x, y] = P(n.x, n.y);
      g += s.type === 'rollerX' ? `<path d="M${x - 3} ${y}l-20 -12v24z" fill="none" stroke="var(--acc)" stroke-width="2"/>` : `<path d="M${x} ${y + 4}l-12 20h24z" fill="none" stroke="var(--acc)" stroke-width="2"/>${s.type === 'rollerY' ? `<circle cx="${x - 6}" cy="${y + 29}" r="4" fill="none" stroke="var(--acc)" stroke-width="2"/><circle cx="${x + 6}" cy="${y + 29}" r="4" fill="none" stroke="var(--acc)" stroke-width="2"/>` : `<line x1="${x - 15}" x2="${x + 15}" y1="${y + 26}" y2="${y + 26}" stroke="var(--acc)" stroke-width="2"/>`}`;
    });
    st.loads.forEach(l => {
      const n = st.nodes[l.node]; if (!n) return;
      const [x, y] = P(n.x, n.y), F = Math.hypot(l.Fx || 0, l.Fy || 0); if (!F) return;
      const ux = (l.Fx || 0) / F, uy = -(l.Fy || 0) / F;
      g += `<line x1="${x - ux * 50}" y1="${y - uy * 50}" x2="${x - ux * 8}" y2="${y - uy * 8}" stroke="var(--c4)" stroke-width="2.5"/><circle cx="${x - ux * 8}" cy="${y - uy * 8}" r="3" fill="var(--c4)"/><text x="${x - ux * 56}" y="${y - uy * 56}" text-anchor="middle" font-family="var(--mono)" font-size="10.5" fill="var(--c4)">${fmt(c2('force', F), 3)} ${U.force}</text>`;
    });
    st.nodes.forEach((n, i) => { const [x, y] = P(n.x, n.y); g += `<g data-node="${i}" style="cursor:move"><circle cx="${x}" cy="${y}" r="11" fill="transparent"/><circle cx="${x}" cy="${y}" r="5" fill="var(--panel)" stroke="var(--ink)" stroke-width="2"/><text x="${x + 8}" y="${y + 16}" font-family="var(--mono)" font-size="10" fill="var(--ink3)">${i}</text></g>`; });
    svg.innerHTML = g;
  }

  const svg = $('#tsvg');
  const toXY = ev => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return [(p.x - view.ox) / view.s, (view.oy - p.y) / view.s]; };
  svg.addEventListener('pointerdown', ev => { const t = ev.target.closest('[data-node]'); if (!t) return; drag = +t.dataset.node; svg.setPointerCapture(ev.pointerId); ev.preventDefault(); });
  svg.addEventListener('pointermove', ev => { if (drag === null) return; const q = U.len === 'm' ? 0.1 : toSI(0.5, 'length', 'ft'); const [x, y] = toXY(ev); st.nodes[drag].x = Math.round(x / q) * q; st.nodes[drag].y = Math.round(y / q) * q; solve(); });
  const end = () => { if (drag !== null) { drag = null; computeView(); forms(); draw(); } };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);

  function solve() {
    res = solveTruss({ nodes: st.nodes, members: st.members.map(m => ({ i: +m.i, j: +m.j })), supports: st.supports.map(s => ({ ...s, node: +s.node })), loads: st.loads.map(l => ({ ...l, node: +l.node })), E: st.E, A: st.A });
    draw();
    const out = $('#tR');
    if (res.error) { out.innerHTML = `<div class="msg bad">${esc(res.error)}</div>`; return; }
    const maxT = Math.max(0, ...res.forces.map(f => f.N)), maxC = Math.min(0, ...res.forces.map(f => f.N));
    const umax = Math.max(...st.nodes.map((_, i) => Math.hypot(res.u[2 * i], res.u[2 * i + 1])));
    const smax = Math.max(...res.forces.map(f => Math.abs(f.stress)));
    out.innerHTML = `<div class="readouts"><div class="readout primary"><div class="rl">Max tension</div><div class="rv">${fmt(c2('force', maxT), 4)}<span class="u">${U.force}</span></div></div><div class="readout"><div class="rl">Max compression</div><div class="rv">${fmt(c2('force', maxC), 4)}<span class="u">${U.force}</span></div></div><div class="readout"><div class="rl">Max member stress</div><div class="rv">${fmt(c2('stress', smax), 4)}<span class="u">${U.stress}</span></div></div><div class="readout"><div class="rl">Max nodal displacement</div><div class="rv">${fmt(c2('defl', umax), 4)}<span class="u">${U.defl}</span></div></div><div class="readout"><div class="rl">Determinacy</div><div class="rv txt">${esc(res.determinacy)}</div></div></div>
      <div class="check ${smax < st.Sy ? 'pass' : 'fail'}"><span class="st">${smax < st.Sy ? 'PASS' : 'FAIL'}</span><span>Member stresses below yield (n = ${fmt(st.Sy / smax, 3)})</span></div>
      <div class="msg warn">Compression members must also be checked for buckling (Euler/Johnson — see the <a href="#/calc/buckling">buckling calculator</a>).</div>
      <div class="tbl-wrap mt"><table class="tbl"><thead><tr><th>Member</th><th class="num">L (${U.len})</th><th class="num">Force (${U.force})</th><th class="num">Stress (${U.stress})</th><th>State</th></tr></thead><tbody>${res.forces.map((f, k) => `<tr><td>${k} (${f.i}–${f.j})</td><td class="num">${fmt(c2('len', f.L), 4)}</td><td class="num">${fmt(c2('force', f.N), 5)}</td><td class="num">${fmt(c2('stress', f.stress), 4)}</td><td style="color:${Math.abs(f.N) < 1e-6 * Math.max(1, maxT, -maxC) ? 'var(--ink3)' : f.N > 0 ? 'var(--c2)' : 'var(--c3)'}">${Math.abs(f.N) < 1e-6 * Math.max(1, maxT, -maxC) ? 'zero-force' : f.N > 0 ? 'Tension' : 'Compression'}</td></tr>`).join('')}</tbody></table></div>
      <table class="tbl mt"><thead><tr><th>Support</th><th class="num">Rx (${U.force})</th><th class="num">Ry (${U.force})</th></tr></thead><tbody>${res.reactions.map(r => { const cl = x => Math.abs(x) < 1e-9 * Math.max(1, maxT, -maxC) ? 0 : x; return `<tr><td>node ${r.node} (${r.type})</td><td class="num">${fmt(c2('force', cl(r.Rx)), 5)}</td><td class="num">${fmt(c2('force', cl(r.Ry)), 5)}</td></tr>`; }).join('')}</tbody></table>`;
  }

  $('#tE').oninput = () => { const v = Number($('#tE').value); if (v > 0) { st.E = s2('E', v); solve(); } };
  $('#tA').oninput = () => { const v = Number($('#tA').value); if (v > 0) { st.A = toSI(v, 'area', aU); solve(); } };
  $('#tSy').oninput = () => { const v = Number($('#tSy').value); if (v > 0) { st.Sy = s2('stress', v); solve(); } };
  $('#tdef').onchange = () => { st.showDef = $('#tdef').checked; draw(); };
  $('#tAN').onclick = () => { const n = st.nodes[st.nodes.length - 1] || { x: 0, y: 0 }; st.nodes.push({ x: n.x + 1, y: n.y }); computeView(); forms(); solve(); };
  $('#tAM').onclick = () => { st.members.push({ i: 0, j: Math.max(1, st.nodes.length - 1) }); forms(); solve(); };
  $('#tAS').onclick = () => { st.supports.push({ node: 0, type: 'pin' }); forms(); solve(); };
  $('#tAL').onclick = () => { st.loads.push({ node: 0, Fx: 0, Fy: -10e3 }); forms(); solve(); };
  $('#tp').onchange = () => { const p = TRUSS_PRESETS[$('#tp').value]; if (p) { Object.assign(st, structuredClone(p)); computeView(); forms(); solve(); } $('#tp').value = ''; };
  const shareUrl = () => `${location.origin}${location.pathname}#/solvers/truss?s=${encodeState(st)}`;
  $('#tShare').onclick = () => navigator.clipboard?.writeText(shareUrl()).then(() => toast('Share link copied'), () => prompt('Copy:', shareUrl()));
  $('#tSave').onclick = () => saveToProject('truss', `Truss: ${st.nodes.length} nodes, ${st.members.length} members`, st, res && !res.error ? `Max |N| = ${fmt(c2('force', Math.max(...res.forces.map(f => Math.abs(f.N)))), 4)} ${U.force}` : '');
  computeView(); forms(); solve();
}
