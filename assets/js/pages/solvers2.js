// Circuit, pipe network, thermodynamic cycle, MDOF vibration and drive-train solver pages.
import { solveCircuit, solvePipeNetwork, solveCycle, chainMatrices, modal, frf, solveDrive, stageRatio } from '../solvers/cores2.js';
import { FLUIDS, GASES } from '../data/fluids.js';
import { fmt, num, esc, toast } from '../core/format.js';
import { plotSVG, legend, COLORS } from '../core/plot.js';
import { crumbs, pageHead } from './common.js';
import { encodeState, decodeState } from './calc.js';

const shareBtn = (main, path, st) => { main.querySelector('#share').onclick = () => { const u = `${location.href.split('#')[0]}#/solvers/${path}?s=${encodeState(st)}`; (navigator.clipboard?.writeText(u) || Promise.reject()).then(() => toast('Share link copied'), () => prompt('Copy:', u)); }; };
const tbl = (head, rows) => `<div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
const numIn = (attr, i, v, w = 90) => `<input class="plain" style="min-width:${w}px" ${attr}="${i}" value="${esc(v)}">`;
function bindTable(root, attr, arr, key, parse = Number, after) {
  root.querySelectorAll(`[${attr}]`).forEach(el => { el.oninput = el.onchange = () => { const v = parse(el.value); if (parse === Number && !Number.isFinite(v)) return; arr[+el.getAttribute(attr)][key] = v; after(); }; });
}

// ── Circuit solver ─────────────────────────────────────────────
const UNIT = { R: 'Ω', C: 'F', L: 'H', V: 'V', I: 'A' };
const CIRCUITS = {
  bridge: { name: 'Wheatstone bridge (DC)', f: 0, probe: 2, parts: [{ type: 'V', a: 1, b: 0, value: 10, phase: 0 }, { type: 'R', a: 1, b: 2, value: 1000 }, { type: 'R', a: 2, b: 0, value: 1000 }, { type: 'R', a: 1, b: 3, value: 1200 }, { type: 'R', a: 3, b: 0, value: 800 }, { type: 'R', a: 2, b: 3, value: 500 }] },
  twosrc: { name: 'Two sources + resistor network (DC)', f: 0, probe: 2, parts: [{ type: 'V', a: 1, b: 0, value: 12, phase: 0 }, { type: 'R', a: 1, b: 2, value: 4 }, { type: 'R', a: 2, b: 0, value: 6 }, { type: 'R', a: 2, b: 3, value: 3 }, { type: 'V', a: 3, b: 0, value: 5, phase: 0 }, { type: 'I', a: 0, b: 2, value: 0.5, phase: 0 }] },
  rc: { name: 'RC low-pass filter (AC)', f: 1000, probe: 2, parts: [{ type: 'V', a: 1, b: 0, value: 1, phase: 0 }, { type: 'R', a: 1, b: 2, value: 1600 }, { type: 'C', a: 2, b: 0, value: 100e-9 }] },
  rlc: { name: 'Series RLC band-pass (AC)', f: 1591.5, probe: 3, parts: [{ type: 'V', a: 1, b: 0, value: 1, phase: 0 }, { type: 'L', a: 1, b: 2, value: 0.01 }, { type: 'C', a: 2, b: 3, value: 1e-6 }, { type: 'R', a: 3, b: 0, value: 10 }] },
  pi: { name: 'LC π low-pass filter (AC)', f: 5000, probe: 3, parts: [{ type: 'V', a: 1, b: 0, value: 1, phase: 0 }, { type: 'R', a: 1, b: 2, value: 50 }, { type: 'C', a: 2, b: 0, value: 318e-9 }, { type: 'L', a: 2, b: 3, value: 2.5e-3 }, { type: 'C', a: 3, b: 0, value: 318e-9 }, { type: 'R', a: 3, b: 0, value: 50 }] },
};
export function circuit(main, _, query) {
  const st = (query.get('s') && decodeState(query.get('s'))) || structuredClone(CIRCUITS.bridge);
  main.innerHTML = `${crumbs([['Solvers', '#/solvers'], ['Circuit solver']])}${pageHead('SOLVER / CIRCUIT', 'Circuit Solver', 'Modified nodal analysis for DC and AC (phasor) circuits with resistors, capacitors, inductors, voltage and current sources. Node 0 is ground. Values in SI (Ω, F, H, V, A); AC sources are peak phasors.')}
    <div class="toolbar"><select class="plain" id="pre" style="max-width:320px"><option value="">Load a preset…</option>${Object.entries(CIRCUITS).map(([k, c]) => `<option value="${k}">${esc(c.name)}</option>`).join('')}</select><div class="field" style="margin:0"><div class="in"><input id="f" style="width:120px"><span class="unit-fixed">Hz (0 = DC)</span></div></div><span class="grow"></span><button class="btn ghost sm" id="share">Share link</button></div>
    <div class="calc"><div class="panel tick"><div class="panel-title"><h4>Netlist</h4><span><button class="btn ghost sm" data-add="R">+R</button> <button class="btn ghost sm" data-add="C">+C</button> <button class="btn ghost sm" data-add="L">+L</button> <button class="btn ghost sm" data-add="V">+V</button> <button class="btn ghost sm" data-add="I">+I</button></span></div><div id="net"></div>
      <p class="small muted mt">Voltage source: + at node a. Current source: current flows from a to b through the source. Passive sign convention for power: positive = absorbed.</p><div id="graph" class="mt"></div></div>
    <div class="panel"><h4>Results</h4><div id="res" class="mt"></div></div></div>
    <div class="panel mt" id="sweepP"><div class="panel-title"><h4>Frequency response</h4><span>probe node <select class="plain" id="probe" style="width:80px"></select></span></div><div id="sweep"></div></div>`;
  const $ = s => main.querySelector(s);
  const drawNet = () => {
    $('#net').innerHTML = tbl(['#', 'Type', 'a', 'b', 'Value', 'Phase °', ''], st.parts.map((p, i) => `<tr><td>${p.type}${i + 1}</td><td><select class="plain" data-ty="${i}">${Object.keys(UNIT).map(t => `<option${t === p.type ? ' selected' : ''}>${t}</option>`).join('')}</select></td><td>${numIn('data-a', i, p.a, 50)}</td><td>${numIn('data-b', i, p.b, 50)}</td><td><div class="in">${numIn('data-v', i, num(p.value), 90)}<span class="unit-fixed">${UNIT[p.type]}</span></div></td><td>${p.type === 'V' || p.type === 'I' ? numIn('data-ph', i, p.phase || 0, 50) : ''}</td><td><button class="btn ghost sm" data-del="${i}">✕</button></td></tr>`).join(''));
    bindTable(main, 'data-a', st.parts, 'a', Number, solve); bindTable(main, 'data-b', st.parts, 'b', Number, solve); bindTable(main, 'data-v', st.parts, 'value', Number, solve); bindTable(main, 'data-ph', st.parts, 'phase', Number, solve);
    bindTable(main, 'data-ty', st.parts, 'type', String, () => { drawNet(); solve(); });
    main.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { st.parts.splice(+b.dataset.del, 1); drawNet(); solve(); });
  };
  const graph = r => {
    const ns = [0, ...r.nodes.map(n => n.n)], N = ns.length, pos = {};
    ns.forEach((n, i) => { const a = Math.PI / 2 + 2 * Math.PI * i / N; pos[n] = [200 + 140 * Math.cos(a), 170 + 130 * Math.sin(a)]; });
    let g = '';
    st.parts.forEach((p, i) => {
      const A = pos[p.a], B = pos[p.b]; if (!A || !B) return;
      const same = st.parts.filter((q, j) => j < i && ((q.a === p.a && q.b === p.b) || (q.a === p.b && q.b === p.a))).length, off = same * 18;
      const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[1] - A[1], dy = A[0] - B[0], L = Math.hypot(dx, dy) || 1, cx = mx + dx / L * off, cy = my + dy / L * off;
      const col = { R: 'var(--ink2)', C: 'var(--c2)', L: 'var(--c3)', V: 'var(--acc)', I: 'var(--c4)' }[p.type];
      g += `<path d="M${A[0]} ${A[1]}Q${cx} ${cy} ${B[0]} ${B[1]}" fill="none" stroke="${col}" stroke-width="2"/><text x="${cx}" y="${cy}" text-anchor="middle" style="fill:${col};font-size:11px" paint-order="stroke" stroke="var(--bg2)" stroke-width="3">${p.type}${i + 1}</text>`;
    });
    ns.forEach(n => { g += `<circle cx="${pos[n][0]}" cy="${pos[n][1]}" r="11" fill="var(--panel)" stroke="${n === 0 ? 'var(--acc)' : 'var(--ink)'}" stroke-width="2"/><text x="${pos[n][0]}" y="${pos[n][1] + 4}" text-anchor="middle" style="fill:var(--ink);font-size:11px">${n === 0 ? '⏚' : n}</text>`; });
    $('#graph').innerHTML = `<svg class="plot" viewBox="0 0 400 340">${g}</svg><div class="small muted">Topology view (nodes on a ring, not a schematic).</div>`;
  };
  function solve() {
    const r = solveCircuit(st.parts.map(p => ({ ...p, a: +p.a, b: +p.b })), +st.f);
    if (r.error) { $('#res').innerHTML = `<div class="msg bad">${esc(r.error)}</div>`; return; }
    const ac = !r.dc, mag = c => Math.hypot(c[0], c[1]), ph = c => Math.atan2(c[1], c[0]) * 180 / Math.PI;
    const pb = r.parts.reduce((s, p) => s + p.P, 0), pmax = Math.max(...r.parts.map(p => Math.abs(p.P)), 1e-30);
    $('#res').innerHTML = `${tbl(['Node', ac ? '|V| (peak)' : 'V', ac ? 'Phase °' : ''], r.nodes.map(n => `<tr><td>${n.n}</td><td class="num">${fmt(ac ? mag(n.V) : n.V[0], 6)} V</td><td class="num">${ac ? fmt(ph(n.V), 4) : ''}</td></tr>`).join(''))}
      <div class="mt">${tbl(['Part', 'V (a−b)', 'I (a→b)', ac ? 'P avg (W)' : 'P (W)', ac ? 'Q (var)' : ''], r.parts.map((p, i) => `<tr><td>${p.type}${i + 1}</td><td class="num">${fmt(ac ? mag(p.V) : p.V[0], 5)}${ac ? ` ∠${fmt(ph(p.V), 3)}°` : ''}</td><td class="num">${fmt(ac ? mag(p.I) : p.I[0], 5)}${ac ? ` ∠${fmt(ph(p.I), 3)}°` : ''}</td><td class="num">${fmt(p.P, 5)}</td><td class="num">${ac ? fmt(p.Q, 5) : ''}</td></tr>`).join(''))}</div>
      <div class="check ${Math.abs(pb) < 1e-9 * pmax + 1e-15 ? 'pass' : 'fail'}"><span class="st">${Math.abs(pb) < 1e-9 * pmax + 1e-15 ? 'PASS' : 'CHECK'}</span><span>Tellegen power balance ΣP = ${fmt(pb, 3)} W</span></div>`;
    graph(r);
    const pr = $('#probe'), cur = +pr.value || st.probe || r.nodes[r.nodes.length - 1]?.n;
    pr.innerHTML = r.nodes.map(n => `<option${n.n === cur ? ' selected' : ''}>${n.n}</option>`).join('');
    const f0 = +st.f || 1000, fs = [], vs = [], phs = [];
    for (let i = 0; i <= 160; i++) { const f = f0 * Math.pow(10, -2 + 4 * i / 160); const rr = solveCircuit(st.parts.map(p => ({ ...p, a: +p.a, b: +p.b })), f); const v = rr.nodes?.find(n => n.n === +pr.value)?.V; if (!v) continue; fs.push(f); vs.push(20 * Math.log10(Math.max(mag(v), 1e-12))); phs.push(ph(v)); }
    $('#sweep').innerHTML = `<div class="split">${plotSVG([{ x: fs, y: vs, label: `|V${pr.value}| dB re 1 V` }], { logx: true, xlabel: 'f (Hz)', ylabel: 'dB', h: 240, marks: st.f > 0 ? [{ x: +st.f, label: 'f' }] : [] })}${plotSVG([{ x: fs, y: phs, label: 'phase °', color: 'var(--c2)' }], { logx: true, xlabel: 'f (Hz)', ylabel: 'deg', h: 240 })}</div><p class="small muted">Sources keep their amplitude at every frequency (AC sweep).</p>`;
  }
  $('#f').value = st.f; $('#f').oninput = () => { const v = Number($('#f').value); if (v >= 0) { st.f = v; solve(); } };
  $('#probe').onchange = solve;
  $('#pre').onchange = () => { const c = CIRCUITS[$('#pre').value]; if (c) { Object.assign(st, structuredClone(c)); $('#f').value = st.f; $('#probe').innerHTML = ''; drawNet(); solve(); } $('#pre').value = ''; };
  main.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const t = b.dataset.add; st.parts.push({ type: t, a: 1, b: 0, value: { R: 1000, C: 1e-6, L: 1e-3, V: 1, I: 0.001 }[t], phase: 0 }); drawNet(); solve(); });
  shareBtn(main, 'circuit', st);
  drawNet(); solve();
}

// ── Pipe network solver ────────────────────────────────────────
const NETS = {
  three: { name: 'Three-reservoir problem', fluid: 'water20', nodes: [{ type: 'res', H: 100, z: 100, demand: 0, x: 0, y: 1 }, { type: 'res', H: 80, z: 80, demand: 0, x: 4, y: 1.4 }, { type: 'res', H: 40, z: 40, demand: 0, x: 3, y: -1 }, { type: 'junc', H: 0, z: 30, demand: 0, x: 2, y: 0.4 }], pipes: [{ from: 0, to: 3, L: 1000, D: 300, eps: 0.045, K: 0 }, { from: 3, to: 1, L: 800, D: 250, eps: 0.045, K: 0 }, { from: 3, to: 2, L: 1200, D: 250, eps: 0.045, K: 0 }] },
  loop: { name: 'Looped distribution network', fluid: 'water20', nodes: [{ type: 'res', H: 60, z: 60, demand: 0, x: 0, y: 1 }, { type: 'junc', z: 10, demand: 0.02, x: 1, y: 1 }, { type: 'junc', z: 8, demand: 0.03, x: 2, y: 1 }, { type: 'junc', z: 12, demand: 0.025, x: 2, y: 0 }, { type: 'junc', z: 9, demand: 0.015, x: 1, y: 0 }], pipes: [{ from: 0, to: 1, L: 500, D: 300, eps: 0.1, K: 1 }, { from: 1, to: 2, L: 400, D: 200, eps: 0.1, K: 0 }, { from: 2, to: 3, L: 300, D: 150, eps: 0.1, K: 0 }, { from: 3, to: 4, L: 400, D: 150, eps: 0.1, K: 0 }, { from: 4, to: 1, L: 300, D: 200, eps: 0.1, K: 0 }, { from: 1, to: 3, L: 500, D: 150, eps: 0.1, K: 0 }] },
  pump: { name: 'Pump lifting from sump to tank', fluid: 'water20', nodes: [{ type: 'res', H: 0, z: 0, demand: 0, x: 0, y: 0 }, { type: 'res', H: 25, z: 25, demand: 0, x: 3, y: 1.5 }], pipes: [{ from: 0, to: 1, L: 150, D: 100, eps: 0.045, K: 6, pumpH0: 40, pumpA: 60000 }] },
};
export function pipes(main, _, query) {
  const st = (query.get('s') && decodeState(query.get('s'))) || structuredClone(NETS.loop);
  main.innerHTML = `${crumbs([['Solvers', '#/solvers'], ['Pipe network solver']])}${pageHead('SOLVER / PIPE NETWORK', 'Pipe Network Solver', 'Nodal Newton solution of steady flow in pipe networks: reservoirs/tanks (fixed head), junctions with demands, Darcy–Weisbach/Colebrook friction, minor losses and pumps (H = H₀ − A·Q|Q|).')}
    <div class="toolbar"><select class="plain" id="pre" style="max-width:300px"><option value="">Load a preset…</option>${Object.entries(NETS).map(([k, c]) => `<option value="${k}">${esc(c.name)}</option>`).join('')}</select><select class="plain" id="fl" style="max-width:280px">${FLUIDS.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select><span class="grow"></span><button class="btn ghost sm" id="share">Share link</button></div>
    <div class="panel tick"><div id="dia"></div></div>
    <div class="calc mt"><div class="panel"><div class="panel-title"><h4>Nodes</h4><button class="btn ghost sm" id="an">+ Node</button></div><div id="nt"></div><div class="panel-title mt"><h4>Pipes</h4><button class="btn ghost sm" id="ap">+ Pipe</button></div><div id="pt"></div><p class="small muted">Units: H, z, x, y in m · demand in m³/s (out of node) · L in m · D and ε in mm · pump H₀ in m, A in s²/m⁵.</p></div>
    <div class="panel"><h4>Results</h4><div id="res" class="mt"></div></div></div>`;
  const $ = s => main.querySelector(s);
  let res = null;
  const forms = () => {
    $('#nt').innerHTML = tbl(['#', 'Type', 'Head H', 'Elev. z', 'Demand', 'x', 'y', ''], st.nodes.map((n, i) => `<tr><td>${i}</td><td><select class="plain" style="min-width:110px" data-nty="${i}"><option value="res"${n.type === 'res' ? ' selected' : ''}>Reservoir</option><option value="junc"${n.type === 'junc' ? ' selected' : ''}>Junction</option></select></td><td>${n.type === 'res' ? numIn('data-nh', i, n.H, 60) : '—'}</td><td>${numIn('data-nz', i, n.z ?? 0, 60)}</td><td>${n.type === 'junc' ? numIn('data-nd', i, n.demand ?? 0, 70) : '—'}</td><td>${numIn('data-nx', i, n.x ?? 0, 45)}</td><td>${numIn('data-ny', i, n.y ?? 0, 45)}</td><td><button class="btn ghost sm" data-ndel="${i}">✕</button></td></tr>`).join(''));
    $('#pt').innerHTML = tbl(['#', 'From', 'To', 'L', 'D', 'ε', 'ΣK', 'Pump H₀', 'Pump A', ''], st.pipes.map((p, i) => `<tr><td>${i}</td>${['from', 'to', 'L', 'D', 'eps', 'K', 'pumpH0', 'pumpA'].map(k => `<td>${numIn(`data-p${k}`, i, p[k] ?? 0, 55)}</td>`).join('')}<td><button class="btn ghost sm" data-pdel="${i}">✕</button></td></tr>`).join(''));
    bindTable(main, 'data-nty', st.nodes, 'type', String, () => { forms(); solve(); });
    [['data-nh', 'H'], ['data-nz', 'z'], ['data-nd', 'demand'], ['data-nx', 'x'], ['data-ny', 'y']].forEach(([a, k]) => bindTable(main, a, st.nodes, k, Number, solve));
    ['from', 'to', 'L', 'D', 'eps', 'K', 'pumpH0', 'pumpA'].forEach(k => bindTable(main, `data-p${k}`, st.pipes, k, Number, solve));
    main.querySelectorAll('[data-ndel]').forEach(b => b.onclick = () => { const k = +b.dataset.ndel; st.nodes.splice(k, 1); st.pipes = st.pipes.filter(p => p.from !== k && p.to !== k).map(p => ({ ...p, from: p.from > k ? p.from - 1 : p.from, to: p.to > k ? p.to - 1 : p.to })); forms(); solve(); });
    main.querySelectorAll('[data-pdel]').forEach(b => b.onclick = () => { st.pipes.splice(+b.dataset.pdel, 1); forms(); solve(); });
  };
  function diagram() {
    const xs = st.nodes.map(n => +n.x || 0), ys = st.nodes.map(n => +n.y || 0), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min(640 / (x1 - x0 || 1), 220 / (y1 - y0 || 1)), P = n => [60 + ((+n.x || 0) - x0) * s, 260 - ((+n.y || 0) - y0) * s];
    const qmax = res && !res.error ? Math.max(...res.pipes.map(p => Math.abs(p.Q)), 1e-9) : 1;
    let g = '';
    st.pipes.forEach((p, i) => {
      const a = st.nodes[p.from], b = st.nodes[p.to]; if (!a || !b) return;
      const [x1p, y1p] = P(a), [x2p, y2p] = P(b), q = res && !res.error ? res.pipes[i].Q : 0, w = 2 + 8 * Math.abs(q) / qmax;
      g += `<line x1="${x1p}" y1="${y1p}" x2="${x2p}" y2="${y2p}" stroke="${p.pumpH0 ? 'var(--c4)' : 'var(--c2)'}" stroke-width="${w}" stroke-linecap="round" opacity=".85"/>`;
      const mx = (x1p + x2p) / 2, my = (y1p + y2p) / 2, dir = Math.sign(q) || 1, ang = Math.atan2(y2p - y1p, x2p - x1p) + (dir < 0 ? Math.PI : 0);
      g += `<path d="M${mx + 9 * Math.cos(ang)} ${my + 9 * Math.sin(ang)}L${mx - 7 * Math.cos(ang) + 6 * Math.sin(ang)} ${my - 7 * Math.sin(ang) - 6 * Math.cos(ang)}L${mx - 7 * Math.cos(ang) - 6 * Math.sin(ang)} ${my - 7 * Math.sin(ang) + 6 * Math.cos(ang)}Z" fill="var(--ink)"/>`;
      if (res && !res.error) g += `<text x="${mx}" y="${my - 12}" text-anchor="middle" paint-order="stroke" stroke="var(--bg2)" stroke-width="3" style="fill:var(--ink)">${p.pumpH0 ? 'PUMP ' : ''}${fmt(Math.abs(q) * 1e3, 3)} L/s</text>`;
    });
    st.nodes.forEach((n, i) => { const [x, y] = P(n); g += n.type === 'res' ? `<rect x="${x - 14}" y="${y - 12}" width="28" height="24" fill="var(--panel)" stroke="var(--acc)" stroke-width="2"/>` : `<circle cx="${x}" cy="${y}" r="9" fill="var(--panel)" stroke="var(--ink)" stroke-width="2"/>`; g += `<text x="${x}" y="${y + 4}" text-anchor="middle" style="fill:var(--ink)">${i}</text>`; if (res && !res.error) g += `<text x="${x}" y="${y + 28}" text-anchor="middle" style="fill:var(--acc)">H ${fmt(res.nodes[i].H, 4)} m</text>`; });
    $('#dia').innerHTML = `<svg class="plot" viewBox="0 0 760 300" style="border:0">${g}</svg>`;
  }
  function solve() {
    const f = FLUIDS.find(x => x.id === st.fluid) || FLUIDS[0];
    res = solvePipeNetwork({ nodes: st.nodes.map(n => ({ ...n, H: +n.H, z: +n.z, demand: +n.demand || 0 })), pipes: st.pipes.map(p => ({ ...p, from: +p.from, to: +p.to, L: +p.L, D: p.D / 1e3, eps: p.eps / 1e3, K: +p.K || 0, pumpH0: +p.pumpH0 || 0, pumpA: +p.pumpA || 0 })), rho: f.rho, mu: f.mu });
    diagram();
    if (res.error) { $('#res').innerHTML = `<div class="msg bad">${esc(res.error)}</div>`; return; }
    const g = 9.80665;
    const netIn = res.nodes.map((n, i) => res.pipes.reduce((s, p) => s + (p.to === i ? p.Q : 0) - (p.from === i ? p.Q : 0), 0));
    $('#res').innerHTML = `<div class="check ${res.converged ? 'pass' : 'fail'}"><span class="st">${res.converged ? 'CONVERGED' : 'NOT CONVERGED'}</span><span>${res.iters} Newton iterations · continuity residual &lt; 10⁻⁹ m³/s</span></div>
      ${tbl(['Pipe', 'Q (L/s)', 'v (m/s)', 'Re', 'Head loss (m)', 'Pump head (m)'], res.pipes.map((p, i) => `<tr><td>${i} (${p.from}→${p.to})</td><td class="num">${fmt(p.Q * 1e3, 5)}</td><td class="num">${fmt(p.v, 4)}</td><td class="num">${fmt(p.Re, 3)}</td><td class="num">${fmt(p.hf, 4)}</td><td class="num">${p.pumpH0 ? `${fmt(p.pumpHead, 4)} · ${fmt(f.rho * g * p.Q * p.pumpHead / 1e3, 3)} kW hyd.` : '—'}</td></tr>`).join(''))}
      <div class="mt">${tbl(['Node', 'Head (m)', 'Pressure (kPa)', 'Net inflow (L/s)'], res.nodes.map((n, i) => `<tr><td>${i} ${n.type === 'res' ? '(reservoir)' : ''}</td><td class="num">${fmt(n.H, 5)}</td><td class="num">${fmt(n.p / 1e3, 4)}</td><td class="num">${fmt(netIn[i] * 1e3, 4)}</td></tr>`).join(''))}</div>
      ${res.pipes.some(p => p.v > 3) ? '<div class="msg warn">Some velocities exceed 3 m/s.</div>' : ''}${res.nodes.some(n => n.type === 'junc' && n.p < 0) ? '<div class="msg warn">Negative gauge pressure at a junction — risk of cavitation/air ingress.</div>' : ''}`;
  }
  $('#fl').value = st.fluid; $('#fl').onchange = () => { st.fluid = $('#fl').value; solve(); };
  $('#an').onclick = () => { st.nodes.push({ type: 'junc', H: 0, z: 0, demand: 0, x: (st.nodes.length % 3), y: -1 }); forms(); solve(); };
  $('#ap').onclick = () => { st.pipes.push({ from: 0, to: Math.max(1, st.nodes.length - 1), L: 100, D: 100, eps: 0.045, K: 0, pumpH0: 0, pumpA: 0 }); forms(); solve(); };
  $('#pre').onchange = () => { const c = NETS[$('#pre').value]; if (c) { Object.assign(st, structuredClone(c)); $('#fl').value = st.fluid; forms(); solve(); } $('#pre').value = ''; };
  shareBtn(main, 'pipe-network', st);
  forms(); solve();
}

// ── Thermodynamic cycle solver ─────────────────────────────────
export function cycle(main, _, query) {
  const st = (query.get('s') && decodeState(query.get('s'))) || { cycle: 'otto', gas: 'air', T1: 300, p1: 100, r: 9, rp: 12, alpha: 1.5, Tmax: 1900, etac: 0.86, etat: 0.89, regen: true };
  const F = { otto: ['r'], diesel: ['r'], dual: ['r', 'alpha'], brayton: ['rp', 'etac', 'etat'], carnot: ['r'], stirling: ['r', 'regen'] };
  const LBL = { r: 'Compression / volume ratio r', rp: 'Pressure ratio r_p', alpha: 'Constant-volume pressure ratio α', etac: 'Compressor efficiency η_c', etat: 'Turbine efficiency η_t', regen: 'Ideal regenerator' };
  main.innerHTML = `${crumbs([['Solvers', '#/solvers'], ['Thermodynamic cycle solver']])}${pageHead('SOLVER / CYCLE', 'Thermodynamic Cycle Solver', 'Air-standard gas cycles with every state point, process heat and work, efficiency against Carnot, and true P–v and T–s diagrams.')}
    <div class="calc"><div class="panel tick"><div class="grid g2"><div class="field"><label>Cycle</label><select class="plain" id="cy">${[['otto', 'Otto (spark ignition)'], ['diesel', 'Diesel'], ['dual', 'Dual (Sabathé)'], ['brayton', 'Brayton (gas turbine)'], ['carnot', 'Carnot'], ['stirling', 'Stirling']].map(([k, n]) => `<option value="${k}"${k === st.cycle ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Working gas</label><select class="plain" id="gas">${GASES.filter(g => g.id !== 'steam').map(g => `<option value="${g.id}"${g.id === st.gas ? ' selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
      <div class="field"><label>T₁ (K)</label><div class="in"><input id="T1"></div></div><div class="field"><label>p₁ (kPa)</label><div class="in"><input id="p1"></div></div>
      <div class="field"><label>Maximum temperature (K)</label><div class="in"><input id="Tmax"></div></div><div></div></div><div id="extra" class="grid g2"></div></div>
    <div class="panel"><h4>Performance</h4><div id="perf" class="mt"></div></div></div>
    <div class="grid g2 mt"><div class="panel"><h4>P–v diagram (log–log)</h4><div id="pv"></div></div><div class="panel"><h4>T–s diagram</h4><div id="ts"></div></div></div>
    <div class="grid g2 mt"><div class="panel"><h4>State points</h4><div id="states"></div></div><div class="panel"><h4>Processes (per kg)</h4><div id="procs"></div></div></div>`;
  const $ = s => main.querySelector(s);
  const extra = () => {
    $('#extra').innerHTML = F[st.cycle].map(k => k === 'regen' ? `<label class="chip"><input type="checkbox" id="x-regen" ${st.regen ? 'checked' : ''}> ${LBL[k]}</label>` : `<div class="field"><label>${LBL[k]}</label><div class="in"><input id="x-${k}" value="${st[k]}"></div></div>`).join('');
    F[st.cycle].forEach(k => { const el = $(`#x-${k}`); el.oninput = el.onchange = () => { st[k] = k === 'regen' ? el.checked : Number(el.value); solve(); }; });
  };
  function solve() {
    const g = GASES.find(x => x.id === st.gas), gam = g.cp / (g.cp - g.R);
    const r = solveCycle({ ...st, R: g.R, g: gam, p1: st.p1 * 1e3 });
    const bad = r.states.some(s => !(s.T > 0 && s.v > 0)) || (st.cycle !== 'carnot' && st.cycle !== 'stirling' && r.states.some((s, i) => i > 0 && s.T > st.Tmax + 1e-6));
    const hot = r.states[st.cycle === 'brayton' ? 1 : 1];
    const warn = [];
    if (['otto', 'diesel', 'dual'].includes(st.cycle) && hot.T >= st.Tmax) warn.push('T_max must exceed the end-of-compression temperature.');
    if (bad) warn.push('Inconsistent inputs — check T_max against the compression temperature.');
    $('#perf').innerHTML = `<div class="readouts"><div class="readout primary"><div class="rl">Thermal efficiency</div><div class="rv">${(r.eta * 100).toFixed(2)}<span class="u">%</span></div></div><div class="readout"><div class="rl">Carnot limit (T_min–T_max)</div><div class="rv">${(r.etaCarnot * 100).toFixed(2)}<span class="u">%</span></div></div><div class="readout"><div class="rl">Net work</div><div class="rv">${fmt(r.wnet / 1e3, 5)}<span class="u">kJ/kg</span></div></div><div class="readout"><div class="rl">Heat input</div><div class="rv">${fmt(r.qin / 1e3, 5)}<span class="u">kJ/kg</span></div></div><div class="readout"><div class="rl">Mean effective pressure</div><div class="rv">${fmt(r.mep / 1e3, 5)}<span class="u">kPa</span></div></div></div>${warn.map(w => `<div class="msg warn">${esc(w)}</div>`).join('')}<p class="small muted">Cold-air standard: ${esc(g.name)}, γ = ${gam.toFixed(3)}, constant specific heats.</p>`;
    const series = key => r.curves.map((c, i) => ({ x: c.map(p => key === 'pv' ? p.v : p.s / 1e3), y: c.map(p => key === 'pv' ? p.p / 1e3 : p.T), label: `${r.processes[i].from + 1}→${r.processes[i].to + 1} ${r.processes[i].kind}`, color: COLORS[i % COLORS.length] }));
    const pts = key => ({ x: r.states.map(s => key === 'pv' ? s.v : s.s / 1e3), y: r.states.map(s => key === 'pv' ? s.p / 1e3 : s.T), type: 'scatter', color: 'var(--ink)' });
    $('#pv').innerHTML = plotSVG([...series('pv'), pts('pv')], { logx: true, logy: true, xlabel: 'v (m³/kg)', ylabel: 'p (kPa)', h: 300 }) + legend(series('pv'));
    $('#ts').innerHTML = plotSVG([...series('ts'), pts('ts')], { xlabel: 's − s₁ (kJ/kg·K)', ylabel: 'T (K)', h: 300 }) + legend(series('ts'));
    $('#states').innerHTML = tbl(['State', 'p (kPa)', 'v (m³/kg)', 'T (K)', 's − s₁ (kJ/kg·K)'], r.states.map((s, i) => `<tr><td>${i + 1}</td><td class="num">${fmt(s.p / 1e3, 5)}</td><td class="num">${fmt(s.v, 4)}</td><td class="num">${fmt(s.T, 5)}</td><td class="num">${fmt(Math.abs(s.s) < 1e-9 ? 0 : s.s / 1e3, 4)}</td></tr>`).join(''));
    $('#procs').innerHTML = tbl(['Process', 'Type', 'q (kJ/kg)', 'w (kJ/kg)'], r.processes.map(p => `<tr><td>${p.from + 1}→${p.to + 1}</td><td>${p.kind}</td><td class="num">${fmt(p.q / 1e3, 5)}</td><td class="num">${fmt(p.w / 1e3, 5)}</td></tr>`).join(''));
  }
  ['T1', 'p1', 'Tmax'].forEach(k => { const el = $(`#${k}`); el.value = st[k]; el.oninput = () => { const v = Number(el.value); if (v > 0) { st[k] = v; solve(); } }; });
  $('#cy').onchange = () => { st.cycle = $('#cy').value; extra(); solve(); };
  $('#gas').onchange = () => { st.gas = $('#gas').value; solve(); };
  extra(); solve();
}

// ── MDOF vibration solver ──────────────────────────────────────
export function vibration(main, _, query) {
  const st = (query.get('s') && decodeState(query.get('s'))) || { m: '10, 8, 6', k: '40000, 30000, 20000, 0', zeta: 0.02, dof: 3, F: 100 };
  main.innerHTML = `${crumbs([['Solvers', '#/solvers'], ['Vibration solver']])}${pageHead('SOLVER / VIBRATION', 'Multi-Degree-of-Freedom Vibration Solver', 'Spring–mass chains: natural frequencies and mode shapes from the generalised eigenproblem Kφ = ω²Mφ, and the forced frequency response by modal superposition.')}
    <div class="calc"><div class="panel tick"><div class="field"><label>Masses m₁…mₙ (kg)</label><div class="in"><input id="m"></div></div><div class="field"><label>Springs k₀…kₙ (N/m): ground–m₁, m₁–m₂, …, mₙ–ground (0 = none)</label><div class="in"><input id="k"></div></div>
      <div class="grid g3"><div class="field"><label>Modal damping ζ</label><div class="in"><input id="zeta"></div></div><div class="field"><label>Force on mass #</label><div class="in"><input id="dof"></div></div><div class="field"><label>Force amplitude (N)</label><div class="in"><input id="F"></div></div></div><div id="chain" class="mt"></div></div>
    <div class="panel"><h4>Modes</h4><div id="modes" class="mt"></div></div></div>
    <div class="grid g2 mt"><div class="panel"><h4>Mode shapes</h4><div id="shapes"></div></div><div class="panel"><h4>Frequency response |X| (mm)</h4><div id="frf"></div></div></div>`;
  const $ = s => main.querySelector(s);
  const L = s => String(s).split(/[,;\s]+/).map(Number).filter(Number.isFinite);
  function solve() {
    const m = L(st.m), k = L(st.k);
    while (k.length < m.length + 1) k.push(0);
    if (!m.length || m.some(v => v <= 0)) { $('#modes').innerHTML = '<div class="msg bad">Enter positive masses.</div>'; return; }
    const K = chainMatrices(m, k), md = modal(m, K), n = m.length;
    const rigid = md.filter(x => x.f < 1e-6).length;
    $('#chain').innerHTML = `<svg class="plot" viewBox="0 0 ${80 + n * 110} 90">${k[0] ? '<rect x="4" y="20" width="8" height="50" fill="var(--line2)"/>' : ''}${m.map((mm, i) => `${(k[i] || 0) ? `<path d="M${i ? 30 + i * 110 : 12} 45 ${Array.from({ length: 6 }, (_, j) => `l7 ${j % 2 ? 10 : -10}`).join(' ')} L${60 + i * 110} 45" fill="none" stroke="var(--c2)" stroke-width="2"/>` : ''}<rect x="${60 + i * 110}" y="25" width="50" height="40" fill="var(--panel2)" stroke="var(--acc)" stroke-width="2"/><text x="${85 + i * 110}" y="50" text-anchor="middle" style="fill:var(--ink)">m${i + 1}</text>`).join('')}${k[n] ? `<path d="M${110 + (n - 1) * 110} 45 l14 0 ${Array.from({ length: 4 }, (_, j) => `l7 ${j % 2 ? 10 : -10}`).join(' ')}" fill="none" stroke="var(--c2)" stroke-width="2"/><rect x="${n * 110 + 70}" y="20" width="8" height="50" fill="var(--line2)"/>` : ''}</svg>`;
    $('#modes').innerHTML = tbl(['Mode', 'f (Hz)', 'ω (rad/s)', 'Shape (normalised)'], md.map((x, i) => `<tr><td>${i + 1}</td><td class="num">${fmt(x.f, 5)}</td><td class="num">${fmt(x.w, 5)}</td><td class="mono small">${x.shape.map(v => v.toFixed(3)).join(', ')}</td></tr>`).join('')) + (rigid ? `<div class="msg info">${rigid} rigid-body mode(s) at 0 Hz (unrestrained chain).</div>` : '');
    const xs = m.map((_, i) => i + 1);
    const sh = md.map((x, i) => ({ x: xs, y: x.shape, label: `mode ${i + 1} · ${fmt(x.f, 3)} Hz`, color: COLORS[i % COLORS.length] }));
    $('#shapes').innerHTML = plotSVG(sh, { xlabel: 'mass #', ylabel: 'relative amplitude', h: 260, zero: true }) + legend(sh);
    const fmax = Math.max(...md.map(x => x.f), 1) * 1.8, fmin = Math.max(Math.min(...md.filter(x => x.f > 0).map(x => x.f), fmax) * 0.2, fmax / 500);
    const fs = []; for (let i = 0; i <= 400; i++) fs.push(fmin + (fmax - fmin) * i / 400);
    const j = Math.min(n, Math.max(1, Math.round(st.dof))) - 1, X = frf(m, K, j, st.F, st.zeta, fs);
    const fr = m.map((_, i) => ({ x: fs, y: X.map(r => r[i] * 1e3), label: `m${i + 1}`, color: COLORS[i % COLORS.length] }));
    $('#frf').innerHTML = plotSVG(fr, { logy: true, xlabel: 'f (Hz)', ylabel: '|X| (mm)', h: 260, marks: md.filter(x => x.f > 0).map((x, i) => ({ x: x.f, label: `f${i + 1}` })) }) + legend(fr);
  }
  ['m', 'k', 'zeta', 'dof', 'F'].forEach(key => { const el = $(`#${key}`); el.value = st[key]; el.oninput = () => { st[key] = ['m', 'k'].includes(key) ? el.value : Number(el.value); solve(); }; });
  solve();
}

// ── Drive train (gear system) solver ───────────────────────────
const STAGE_T = { gear: ['Spur/helical gear pair', 'Driver teeth', 'Driven teeth', 0.98], belt: ['Belt drive', 'Driver Ø (mm)', 'Driven Ø (mm)', 0.95], chain: ['Chain drive', 'Driver sprocket teeth', 'Driven sprocket teeth', 0.97], worm: ['Worm gear', 'Worm starts', 'Wheel teeth', 0.7], planet: ['Planetary (ring fixed)', 'Sun teeth', 'Ring teeth', 0.97] };
export function gear(main, _, query) {
  const st = (query.get('s') && decodeState(query.get('s'))) || { rpm: 1450, kw: 5.5, tau: 40, Tload: 1500, rpmLoad: 30, stages: [{ type: 'belt', a: 100, b: 200, eta: 0.95 }, { type: 'gear', a: 18, b: 72, eta: 0.98 }, { type: 'planet', a: 20, b: 64, eta: 0.97 }] };
  main.innerHTML = `${crumbs([['Solvers', '#/solvers'], ['Drive train solver']])}${pageHead('SOLVER / DRIVE', 'Gear System & Drive Train Solver', 'Build Motor → stages → Load. Speed, torque, power and a minimum solid-shaft diameter are computed on every shaft, and checked against the load requirement.')}
    <div class="calc"><div class="panel tick"><div class="grid g3"><div class="field"><label>Motor speed (rpm)</label><div class="in"><input id="rpm"></div></div><div class="field"><label>Motor power (kW)</label><div class="in"><input id="kw"></div></div><div class="field"><label>Allowable shaft shear (MPa)</label><div class="in"><input id="tau"></div></div>
      <div class="field"><label>Load torque required (N·m)</label><div class="in"><input id="Tload"></div></div><div class="field"><label>Load speed required (rpm)</label><div class="in"><input id="rpmLoad"></div></div></div>
      <div class="panel-title mt"><h4>Stages</h4><select class="plain" id="add" style="max-width:220px"><option value="">+ Add stage…</option>${Object.entries(STAGE_T).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></div><div id="stg"></div></div>
    <div class="panel"><h4>Results</h4><div id="res" class="mt"></div></div></div><div class="panel mt"><div id="dia"></div></div>`;
  const $ = s => main.querySelector(s);
  const forms = () => {
    $('#stg').innerHTML = tbl(['#', 'Type', 'a', 'b', 'η', 'Ratio', ''], st.stages.map((s, i) => `<tr><td>${i + 1}</td><td>${STAGE_T[s.type][0]}</td><td title="${STAGE_T[s.type][1]}">${numIn('data-sa', i, s.a, 60)}</td><td title="${STAGE_T[s.type][2]}">${numIn('data-sb', i, s.b, 60)}</td><td>${numIn('data-se', i, s.eta, 55)}</td><td class="num">${fmt(stageRatio(s), 4)}</td><td><button class="btn ghost sm" data-sd="${i}">✕</button></td></tr>`).join('')) + '<p class="small muted">a/b: teeth for gears, chains and planetary (sun/ring); diameters for belts; starts/teeth for worms.</p>';
    [['data-sa', 'a'], ['data-sb', 'b'], ['data-se', 'eta']].forEach(([a, k]) => bindTable(main, a, st.stages, k, Number, () => { forms(); solve(); }));
    main.querySelectorAll('[data-sd]').forEach(b => b.onclick = () => { st.stages.splice(+b.dataset.sd, 1); forms(); solve(); });
  };
  function solve() {
    const w = st.rpm * 2 * Math.PI / 60, T = st.kw * 1e3 / w;
    const r = solveDrive({ n: w, T, stages: st.stages, tauAllow: st.tau * 1e6 });
    const out = r.shafts[r.shafts.length - 1], rpmOut = out.w * 60 / (2 * Math.PI);
    const okT = out.T >= st.Tload, okN = Math.abs(rpmOut - st.rpmLoad) / st.rpmLoad < 0.05;
    $('#res').innerHTML = `<div class="readouts"><div class="readout primary"><div class="rl">Overall ratio</div><div class="rv">${fmt(r.ratio, 5)}</div></div><div class="readout"><div class="rl">Output speed</div><div class="rv">${fmt(rpmOut, 5)}<span class="u">rpm</span></div></div><div class="readout"><div class="rl">Output torque</div><div class="rv">${fmt(out.T, 5)}<span class="u">N·m</span></div></div><div class="readout"><div class="rl">Overall efficiency</div><div class="rv">${(r.eta * 100).toFixed(1)}<span class="u">%</span></div></div></div>
      <div class="check ${okT ? 'pass' : 'fail'}"><span class="st">${okT ? 'PASS' : 'FAIL'}</span><span>Output torque ≥ load torque (${fmt(st.Tload, 4)} N·m)</span></div><div class="check ${okN ? 'pass' : 'fail'}"><span class="st">${okN ? 'PASS' : 'CHECK'}</span><span>Output speed within 5 % of ${fmt(st.rpmLoad, 4)} rpm</span></div>
      <div class="mt">${tbl(['Shaft', 'Speed (rpm)', 'Torque (N·m)', 'Power (kW)', 'Min. Ø (mm)'], r.shafts.map(s => `<tr><td>${s.label}</td><td class="num">${fmt(s.w * 60 / (2 * Math.PI), 5)}</td><td class="num">${fmt(s.T, 5)}</td><td class="num">${fmt(s.P / 1e3, 4)}</td><td class="num">${fmt(s.d * 1e3, 3)}</td></tr>`).join(''))}</div>
      <p class="small muted">Minimum diameter from pure torsion d = (16T/πτ)^(1/3). Add bending, keyways and fatigue for final design (Shaft Sizing & Fatigue calculators).</p>`;
    const n = r.shafts.length;
    $('#dia').innerHTML = `<svg class="plot" viewBox="0 0 ${n * 170 + 20} 120" style="border:0">${r.shafts.map((s, i) => `<rect x="${10 + i * 170}" y="30" width="120" height="56" fill="var(--panel2)" stroke="${i ? 'var(--c2)' : 'var(--acc)'}" stroke-width="2"/><text x="${70 + i * 170}" y="52" text-anchor="middle" style="fill:var(--ink)">${esc(i ? `${STAGE_T[st.stages[i - 1].type][0].split(' ')[0]} ×${fmt(s.ratio, 3)}` : 'Motor')}</text><text x="${70 + i * 170}" y="72" text-anchor="middle">${fmt(s.w * 60 / (2 * Math.PI), 4)} rpm · ${fmt(s.T, 4)} N·m</text>${i < n - 1 ? `<path d="M${132 + i * 170} 58h34m-8-6 8 6-8 6" stroke="var(--ink3)" fill="none" stroke-width="2"/>` : ''}`).join('')}</svg>`;
  }
  ['rpm', 'kw', 'tau', 'Tload', 'rpmLoad'].forEach(k => { const el = $(`#${k}`); el.value = st[k]; el.oninput = () => { const v = Number(el.value); if (v > 0) { st[k] = v; solve(); } }; });
  $('#add').onchange = () => { const t = $('#add').value; if (t) { st.stages.push({ type: t, a: t === 'belt' ? 100 : t === 'worm' ? 1 : 20, b: t === 'belt' ? 200 : t === 'worm' ? 40 : 60, eta: STAGE_T[t][3] }); forms(); solve(); } $('#add').value = ''; };
  forms(); solve();
}
