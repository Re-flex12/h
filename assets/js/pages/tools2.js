// Quantum circuit simulator, FFT/signal analysis, matrix tool, numerical methods lab, psychrometric chart, Ask.
import { compile, solveRoot } from '../core/expr.js';
import { fmt, num, esc, T, debounce, renderTex } from '../core/format.js';
import { plotSVG, legend, COLORS, linspace } from '../core/plot.js';
import { fft, det, inverse, eigSym, eigGeneral } from '../core/numeric.js';
import { DIMS, toSI, fromSI, defaultUnit } from '../core/units.js';
import { CALCS, CALC } from '../calcs/index.js';
import { pickerRecord } from '../calcs/_h.js';
import { MATERIALS } from '../data/materials.js';
import { psychro } from '../calcs/thermo.js';
import { settings } from '../core/store.js';
import { search } from '../search.js';
import { crumbs, pageHead } from './common.js';
import { encodeState } from './calc.js';

// ── Quantum circuit simulator ──────────────────────────────────
const S2 = Math.SQRT1_2;
const GATES = {
  H: [[[S2, 0], [S2, 0]], [[S2, 0], [-S2, 0]]], X: [[[0, 0], [1, 0]], [[1, 0], [0, 0]]], Y: [[[0, 0], [0, -1]], [[0, 1], [0, 0]]], Z: [[[1, 0], [0, 0]], [[0, 0], [-1, 0]]],
  S: [[[1, 0], [0, 0]], [[0, 0], [0, 1]]], Sdg: [[[1, 0], [0, 0]], [[0, 0], [0, -1]]], T: [[[1, 0], [0, 0]], [[0, 0], [S2, S2]]], Tdg: [[[1, 0], [0, 0]], [[0, 0], [S2, -S2]]],
  SX: [[[0.5, 0.5], [0.5, -0.5]], [[0.5, -0.5], [0.5, 0.5]]],
};
const cm = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export function simulateQC(n, cols) {
  let psi = Array.from({ length: 1 << n }, (_, i) => (i === 0 ? [1, 0] : [0, 0]));
  cols.forEach(col => {
    const ctrls = col.map((g, q) => (g === '●' ? q : -1)).filter(q => q >= 0);
    col.forEach((g, q) => {
      if (!GATES[g]) return;
      const U = GATES[g], bit = 1 << (n - 1 - q), next = psi.map(a => [...a]);
      for (let i = 0; i < psi.length; i++) {
        if (i & bit) continue;
        if (!ctrls.every(c => i & (1 << (n - 1 - c)))) continue;
        const a = psi[i], b = psi[i | bit];
        next[i] = [cm(U[0][0], a)[0] + cm(U[0][1], b)[0], cm(U[0][0], a)[1] + cm(U[0][1], b)[1]];
        next[i | bit] = [cm(U[1][0], a)[0] + cm(U[1][1], b)[0], cm(U[1][0], a)[1] + cm(U[1][1], b)[1]];
      }
      psi = next;
    });
    // SWAP pairs marked with ×
    const sw = col.map((g, q) => (g === '×' ? q : -1)).filter(q => q >= 0);
    if (sw.length === 2) {
      const [a, b] = sw.map(q => 1 << (n - 1 - q)), next = psi.map(x => [...x]);
      for (let i = 0; i < psi.length; i++) { const ba = !!(i & a), bb = !!(i & b); if (ba !== bb) next[i ^ a ^ b] = psi[i]; }
      psi = next;
    }
  });
  return psi;
}
export function blochVector(psi, n, q) {
  const bit = 1 << (n - 1 - q);
  let r00 = 0, r11 = 0, r01 = [0, 0];
  for (let i = 0; i < psi.length; i++) {
    if (i & bit) continue;
    const a = psi[i], b = psi[i | bit];
    r00 += a[0] ** 2 + a[1] ** 2; r11 += b[0] ** 2 + b[1] ** 2;
    r01 = [r01[0] + a[0] * b[0] + a[1] * b[1], r01[1] + a[1] * b[0] - a[0] * b[1]]; // a · conj(b)
  }
  return [2 * r01[0], -2 * r01[1], r00 - r11];
}
const QC_PRESETS = {
  bell: { name: 'Bell state |Φ⁺⟩', n: 2, cols: [['H', '—'], ['●', 'X']] },
  ghz: { name: 'GHZ state (3 qubits)', n: 3, cols: [['H', '—', '—'], ['●', 'X', '—'], ['—', '●', 'X']] },
  super: { name: 'Uniform superposition', n: 3, cols: [['H', 'H', 'H']] },
  grover: { name: "Grover search for |11⟩ (2 qubits)", n: 2, cols: [['H', 'H'], ['●', 'Z'], ['H', 'H'], ['X', 'X'], ['●', 'Z'], ['X', 'X'], ['H', 'H']] },
  deutsch: { name: 'Deutsch–Jozsa (balanced oracle, 2+1 qubits)', n: 3, cols: [['—', '—', 'X'], ['H', 'H', 'H'], ['●', '—', 'X'], ['—', '●', 'X'], ['H', 'H', '—']] },
  phase: { name: 'Phase kickback (T gates)', n: 1, cols: [['H'], ['T'], ['T'], ['H']] },
};
export function quantumCircuit(main) {
  const st = structuredClone(QC_PRESETS.bell);
  main.innerHTML = `${crumbs([['Quantum & Relativity', '#/quantum'], ['Quantum circuit simulator']])}${pageHead('Q&R / QUANTUM INFORMATION', 'Quantum Circuit Simulator', 'Build circuits of up to 5 qubits with H, Pauli, phase, √X, controlled gates (● on the control qubit) and SWAP (× on two qubits). Exact state-vector simulation shows amplitudes, measurement probabilities and each qubit\'s Bloch vector.', true)}
    <div class="toolbar"><select class="plain" id="pre" style="max-width:320px"><option value="">Load a circuit…</option>${Object.entries(QC_PRESETS).map(([k, c]) => `<option value="${k}">${esc(c.name)}</option>`).join('')}</select><label class="ctl" style="flex-direction:row;gap:8px;align-items:center">Qubits <select class="plain" id="nq" style="width:70px">${[1, 2, 3, 4, 5].map(i => `<option>${i}</option>`).join('')}</select></label><button class="btn ghost sm" id="addc">+ Column</button><button class="btn ghost sm" id="delc">− Column</button></div>
    <div class="panel tick" style="overflow-x:auto"><div id="grid"></div></div>
    <div class="grid g2 mt"><div class="panel"><h4>Measurement probabilities</h4><div id="probs"></div></div><div class="panel"><h4>Bloch vectors (reduced single-qubit states)</h4><div id="bloch"></div></div></div>
    <div class="panel mt"><h4>State vector</h4><div id="amps"></div><p class="small muted">Basis order |q₀q₁…⟩ with q₀ the most significant bit. A Bloch vector shorter than 1 means the qubit is entangled with the others.</p></div>`;
  const $ = s => main.querySelector(s);
  const OPTS = ['—', 'H', 'X', 'Y', 'Z', 'S', 'Sdg', 'T', 'Tdg', 'SX', '●', '×'];
  const draw = () => {
    $('#nq').value = st.n;
    let g = '<table class="tbl" style="width:auto"><tbody>';
    for (let q = 0; q < st.n; q++) g += `<tr><td class="mono">q${q} |0⟩</td>${st.cols.map((c, j) => `<td><select class="plain" data-q="${q}" data-c="${j}" style="width:70px;${c[q] !== '—' ? 'border-color:var(--qr);color:var(--qr)' : ''}">${OPTS.map(o => `<option${o === c[q] ? ' selected' : ''}>${o}</option>`).join('')}</select></td>`).join('')}<td class="mono">—M</td></tr>`;
    $('#grid').innerHTML = g + '</tbody></table>';
    main.querySelectorAll('[data-q]').forEach(s => s.onchange = () => { st.cols[+s.dataset.c][+s.dataset.q] = s.value; draw(); });
    const psi = simulateQC(st.n, st.cols), N = psi.length, lab = i => i.toString(2).padStart(st.n, '0');
    const P = psi.map(a => a[0] ** 2 + a[1] ** 2);
    $('#probs').innerHTML = psi.map((_, i) => `<div class="bar-row"><span class="bl mono">|${lab(i)}⟩</span><div class="bar-track"><div class="bar" style="width:${P[i] * 100}%;background:var(--qr)"></div></div><span class="bv">${(P[i] * 100).toFixed(2)} %</span></div>`).join('');
    $('#amps').innerHTML = `<div class="tbl-wrap" style="max-height:300px"><table class="tbl"><thead><tr><th>Basis</th><th class="num">Re</th><th class="num">Im</th><th class="num">|a|</th><th class="num">Phase</th></tr></thead><tbody>${psi.map((a, i) => P[i] > 1e-12 ? `<tr><td class="mono">|${lab(i)}⟩</td><td class="num">${a[0].toFixed(4)}</td><td class="num">${a[1].toFixed(4)}</td><td class="num">${Math.sqrt(P[i]).toFixed(4)}</td><td class="num">${(Math.atan2(a[1], a[0]) * 180 / Math.PI).toFixed(1)}°</td></tr>` : '').join('')}</tbody></table></div>`;
    $('#bloch').innerHTML = `<div class="grid g3">${Array.from({ length: st.n }, (_, q) => {
      const [x, y, z] = blochVector(psi, st.n, q), R = 60, cx = 75, cy = 75, px = cx + R * (x * 0.8 - y * 0.45), py = cy - R * (z * 0.9 - y * 0.25), len = Math.hypot(x, y, z);
      return `<div><svg viewBox="0 0 150 160" class="plot" style="border:0"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--line2)"/><ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R * 0.3}" fill="none" stroke="var(--line2)" stroke-dasharray="3 3"/><line x1="${cx}" y1="${cy - R}" x2="${cx}" y2="${cy + R}" stroke="var(--line2)"/><text x="${cx + 4}" y="${cy - R - 3}">|0⟩</text><text x="${cx + 4}" y="${cy + R + 11}">|1⟩</text><line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="var(--qr)" stroke-width="3"/><circle cx="${px}" cy="${py}" r="4" fill="var(--qr)"/><text x="4" y="156">q${q}: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}) ${len < 0.99 ? '· mixed' : ''}</text></svg></div>`;
    }).join('')}</div>`;
  };
  $('#nq').onchange = () => { const n = +$('#nq').value; st.cols = st.cols.map(c => Array.from({ length: n }, (_, q) => c[q] || '—')); st.n = n; draw(); };
  $('#addc').onclick = () => { st.cols.push(Array(st.n).fill('—')); draw(); };
  $('#delc').onclick = () => { if (st.cols.length > 1) st.cols.pop(); draw(); };
  $('#pre').onchange = () => { const c = QC_PRESETS[$('#pre').value]; if (c) Object.assign(st, structuredClone(c)); $('#pre').value = ''; draw(); };
  draw();
}

// ── FFT / signal analysis ──────────────────────────────────────
export function fftTool(main) {
  main.innerHTML = `${crumbs([['Tools', '#/tools'], ['Signal analysis (FFT)']])}${pageHead('06 / TLS / FFT', 'Signal Analysis — FFT', 'Generate or paste a sampled signal, apply a window and get the single-sided amplitude spectrum, peak frequencies, RMS and THD.')}
    <div class="calc"><div class="panel tick"><div class="field"><label>Source</label><select class="plain" id="src"><option value="gen">Generate: sum of sines + noise</option><option value="data">Paste samples</option></select></div>
      <div id="gen"><div class="field"><label>Components — frequency (Hz), amplitude per line</label><textarea class="plain" id="comp" style="min-height:90px">50, 1
150, 0.3
250, 0.1</textarea></div><div class="grid g3"><div class="field"><label>Sample rate (Hz)</label><div class="in"><input id="fs" value="2000"></div></div><div class="field"><label>Samples N</label><div class="in"><input id="N" value="1024"></div></div><div class="field"><label>Noise RMS</label><div class="in"><input id="noise" value="0.05"></div></div></div></div>
      <div id="dat" hidden><div class="field"><label>Samples (one per line or comma separated)</label><textarea class="plain" id="samples" style="min-height:120px"></textarea></div><div class="field"><label>Sample rate (Hz)</label><div class="in"><input id="fs2" value="1000"></div></div></div>
      <div class="field"><label>Window</label><select class="plain" id="win"><option value="rect">Rectangular</option><option value="hann" selected>Hann</option><option value="hamming">Hamming</option><option value="blackman">Blackman</option></select></div></div>
    <div class="panel"><div id="stats"></div></div></div>
    <div class="grid g2 mt"><div class="panel"><h4>Time domain</h4><div id="tp"></div></div><div class="panel"><h4>Amplitude spectrum</h4><div id="fp"></div></div></div>`;
  const $ = s => main.querySelector(s);
  const run = () => {
    const gen = $('#src').value === 'gen';
    $('#gen').hidden = !gen; $('#dat').hidden = gen;
    let x, fs;
    if (gen) {
      fs = +$('#fs').value; const N = Math.min(65536, Math.max(16, +$('#N').value)), noise = +$('#noise').value;
      const comps = $('#comp').value.split('\n').map(l => l.split(/[,\s]+/).map(Number)).filter(c => c.length >= 2 && c.every(Number.isFinite));
      x = Array.from({ length: N }, (_, i) => { const t = i / fs; let s = comps.reduce((a, [f, A]) => a + A * Math.sin(2 * Math.PI * f * t), 0); if (noise) { let u = 0, v = 0; while (!u) u = Math.random(); v = Math.random(); s += noise * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); } return s; });
    } else { fs = +$('#fs2').value; x = $('#samples').value.split(/[,\s]+/).map(Number).filter(Number.isFinite); }
    if (x.length < 8 || !(fs > 0)) { $('#stats').innerHTML = '<div class="msg warn">Need at least 8 samples and a positive sample rate.</div>'; return; }
    const N = x.length, w = $('#win').value;
    const win = i => w === 'hann' ? 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)) : w === 'hamming' ? 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1)) : w === 'blackman' ? 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (N - 1)) : 1;
    const ws = x.map((_, i) => win(i)), cg = ws.reduce((a, b) => a + b, 0) / N, mean = x.reduce((a, b) => a + b, 0) / N;
    const F = fft(x.map((v, i) => (v - mean) * ws[i])), M = F.n;
    const fr = [], amp = [];
    for (let k = 0; k <= M / 2; k++) { fr.push(k * fs / M); amp.push((k === 0 ? 1 : 2) * Math.hypot(F.re[k], F.im[k]) / (N * cg)); }
    const peaks = [];
    for (let k = 1; k < amp.length - 1; k++) if (amp[k] > amp[k - 1] && amp[k] >= amp[k + 1] && amp[k] > 0.02 * Math.max(...amp)) peaks.push([fr[k], amp[k]]);
    peaks.sort((a, b) => b[1] - a[1]);
    const rms = Math.sqrt(x.reduce((a, b) => a + (b - mean) ** 2, 0) / N), f1 = peaks[0];
    const harm = f1 ? [2, 3, 4, 5, 6, 7, 8, 9].map(h => { const k = Math.round(h * f1[0] / (fs / M)); return k < amp.length ? Math.max(amp[k - 1] || 0, amp[k], amp[k + 1] || 0) : 0; }) : [];
    const thd = f1 ? Math.sqrt(harm.reduce((a, b) => a + b * b, 0)) / f1[1] : NaN;
    $('#stats').innerHTML = `<div class="readouts"><div class="readout primary"><div class="rl">Dominant frequency</div><div class="rv">${f1 ? fmt(f1[0], 5) : '—'}<span class="u">Hz</span></div></div><div class="readout"><div class="rl">Frequency resolution fs/N</div><div class="rv">${fmt(fs / M, 4)}<span class="u">Hz</span></div></div><div class="readout"><div class="rl">RMS (AC)</div><div class="rv">${fmt(rms, 5)}</div></div><div class="readout"><div class="rl">DC offset</div><div class="rv">${fmt(mean, 4)}</div></div><div class="readout"><div class="rl">THD (harmonics 2–9)</div><div class="rv">${Number.isFinite(thd) ? (thd * 100).toFixed(2) + ' %' : '—'}</div></div></div>
      <h4 class="mt">Peaks</h4><table class="tbl"><tbody>${peaks.slice(0, 8).map(p => `<tr><td class="num">${fmt(p[0], 5)} Hz</td><td class="num">${fmt(p[1], 4)}</td></tr>`).join('')}</tbody></table>${M !== N ? `<p class="small muted">Zero-padded from ${N} to ${M} points.</p>` : ''}`;
    const nt = Math.min(N, 600);
    $('#tp').innerHTML = plotSVG([{ x: x.slice(0, nt).map((_, i) => i / fs * 1e3), y: x.slice(0, nt), label: 'x(t)' }], { xlabel: 't (ms)', ylabel: 'x', h: 240 });
    $('#fp').innerHTML = plotSVG([{ x: fr, y: amp, label: 'amplitude', type: 'area' }], { xlabel: 'f (Hz)', ylabel: 'amplitude', h: 240 });
  };
  main.querySelectorAll('input,textarea,select').forEach(el => el.addEventListener('input', debounce(run, 250)));
  run();
}

// ── Matrix tool ────────────────────────────────────────────────
export function matrix(main) {
  main.innerHTML = `${crumbs([['Mathematics', '#/maths'], ['Matrix tool']])}${pageHead('05 / MTH / LINALG', 'Matrix Tool', 'Determinant, inverse, transpose, eigenvalues/eigenvectors and linear systems Ax = b. Rows on separate lines, entries separated by spaces or commas.')}
    <div class="calc"><div class="panel tick"><div class="field"><label>Matrix A</label><textarea class="plain" id="A" style="min-height:130px">4 -2 1
-2 4 -2
1 -2 4</textarea></div><div class="field"><label>Right-hand side b (optional)</label><div class="in"><input id="b" value="11 -16 17"></div></div></div>
    <div class="panel"><div id="out"></div></div></div>`;
  const $ = s => main.querySelector(s);
  const mt = M => `<table class="tbl" style="width:auto">${M.map(r => `<tr>${r.map(v => `<td class="num">${fmt(Math.abs(v) < 1e-12 ? 0 : v, 5)}</td>`).join('')}</tr>`).join('')}</table>`;
  const run = () => {
    const A = $('#A').value.trim().split('\n').map(l => l.trim().split(/[,\s]+/).map(Number)).filter(r => r.length && r.every(Number.isFinite));
    const n = A.length;
    if (!n || A.some(r => r.length !== A[0].length)) { $('#out').innerHTML = '<div class="msg bad">Rows must have equal length.</div>'; return; }
    const square = A[0].length === n, At = A[0].map((_, j) => A.map(r => r[j]));
    let h = `<h4>Transpose Aᵀ</h4>${mt(At)}`;
    if (square) {
      const D = det(A), inv = inverse(A), sym = A.every((r, i) => r.every((v, j) => Math.abs(v - A[j][i]) < 1e-12));
      h += `<div class="readout primary"><div class="rl">Determinant</div><div class="rv">${fmt(D, 8)}</div></div>`;
      h += inv ? `<h4 class="mt">Inverse A⁻¹</h4>${mt(inv)}` : '<div class="msg warn">Singular — no inverse.</div>';
      if (sym) { const e = eigSym(A); h += `<h4 class="mt">Eigenvalues (symmetric: Jacobi)</h4><p class="mono">${e.values.map(v => fmt(v, 7)).join(', ')}</p><h4>Eigenvectors (columns)</h4>${mt(A.map((_, i) => e.vectors.map(v => v[i])))}<p class="small muted">Condition number (2-norm) ≈ ${fmt(Math.max(...e.values.map(Math.abs)) / Math.min(...e.values.map(Math.abs)), 4)}</p>`; }
      else if (n <= 8) { const ev = eigGeneral(A); h += `<h4 class="mt">Eigenvalues</h4><p class="mono">${ev.map(r => r[1] ? `${fmt(r[0], 6)} ${r[1] > 0 ? '+' : '−'} ${fmt(Math.abs(r[1]), 6)}i` : fmt(r[0], 7)).join(', ')}</p>`; }
      const b = $('#b').value.trim().split(/[,\s]+/).map(Number).filter(Number.isFinite);
      if (inv && b.length === n) { const x = inv.map(r => r.reduce((s, v, j) => s + v * b[j], 0)); h += `<h4 class="mt">Solution of Ax = b</h4><p class="mono">x = (${x.map(v => fmt(Math.abs(v) < 1e-12 ? 0 : v, 7)).join(', ')})</p>`; }
    } else h += '<p class="muted mt">Non-square: determinant, inverse and eigenvalues need a square matrix.</p>';
    $('#out').innerHTML = h;
  };
  $('#A').oninput = debounce(run, 250); $('#b').oninput = debounce(run, 250);
  run();
}

// ── Numerical methods lab ──────────────────────────────────────
export function numerics(main) {
  main.innerHTML = `${crumbs([['Mathematics', '#/maths'], ['Numerical methods']])}${pageHead('05 / MTH / NUM', 'Numerical Methods Lab', 'See the algorithms work: root finding iteration by iteration, integration rules compared, finite-difference error vs step size, and ODE integrators side by side.')}
    <div class="tabs" style="margin-top:0">${[['root', 'Root finding'], ['int', 'Integration'], ['diff', 'Differentiation'], ['ode', 'ODEs']].map(([k, n], i) => `<button data-t="${k}" class="${i ? '' : 'on'}">${n}</button>`).join('')}</div><div id="pane" class="mt"></div>`;
  const pane = main.querySelector('#pane');
  const F = (src, vars) => { const c = compile(src); return v => c.f({ ...vars, ...v }); };
  const views = {
    root() {
      pane.innerHTML = `<div class="calc"><div class="panel tick"><div class="field"><label>f(x) = 0</label><div class="in"><input id="f" value="x^3 - 2*x - 5"></div></div><div class="grid g3"><div class="field"><label>x₀ (Newton/secant)</label><div class="in"><input id="x0" value="2"></div></div><div class="field"><label>a (bisection)</label><div class="in"><input id="a" value="2"></div></div><div class="field"><label>b (bisection)</label><div class="in"><input id="b" value="3"></div></div></div></div><div class="panel"><div id="o"></div></div></div><div class="panel mt"><div id="p"></div></div>`;
      const run = () => {
        let f; try { f = F(pane.querySelector('#f').value); f({ x: 1 }); } catch (e) { pane.querySelector('#o').innerHTML = `<div class="msg bad">${esc(e.message)}</div>`; return; }
        const g = x => f({ x }), x0 = +pane.querySelector('#x0').value; let a = +pane.querySelector('#a').value, b = +pane.querySelector('#b').value;
        const nt = [], sc = [], bi = [];
        let x = x0; for (let i = 0; i < 30; i++) { const h = 1e-7 * Math.max(1, Math.abs(x)), d = (g(x + h) - g(x - h)) / (2 * h); const xn = x - g(x) / d; nt.push(xn); if (Math.abs(xn - x) < 1e-15) break; x = xn; }
        let p = x0, q = x0 + 0.1; for (let i = 0; i < 40; i++) { const r = q - g(q) * (q - p) / (g(q) - g(p)); sc.push(r); if (!Number.isFinite(r) || Math.abs(r - q) < 1e-15) break; p = q; q = r; }
        if (g(a) * g(b) < 0) for (let i = 0; i < 50; i++) { const m = (a + b) / 2; bi.push(m); if (g(a) * g(m) <= 0) b = m; else a = m; }
        const root = nt[nt.length - 1];
        const err = arr => arr.map(v => Math.max(Math.abs(v - root), 1e-17));
        pane.querySelector('#o').innerHTML = `<div class="readout primary"><div class="rl">Root (Newton)</div><div class="rv">${fmt(root, 12)}</div></div><table class="tbl mt"><thead><tr><th>Iter</th><th class="num">Newton</th><th class="num">Secant</th><th class="num">Bisection</th></tr></thead><tbody>${Array.from({ length: Math.min(12, Math.max(nt.length, sc.length)) }, (_, i) => `<tr><td>${i + 1}</td><td class="num mono">${nt[i] !== undefined ? nt[i].toPrecision(14) : ''}</td><td class="num mono">${sc[i] !== undefined ? sc[i].toPrecision(14) : ''}</td><td class="num mono">${bi[i] !== undefined ? bi[i].toPrecision(10) : ''}</td></tr>`).join('')}</tbody></table>${bi.length ? '' : '<p class="small muted">Bisection needs f(a) and f(b) of opposite sign.</p>'}`;
        const s = [{ x: nt.map((_, i) => i + 1), y: err(nt), label: 'Newton (quadratic)' }, { x: sc.map((_, i) => i + 1), y: err(sc), label: 'Secant (order 1.618)' }, { x: bi.map((_, i) => i + 1), y: err(bi), label: 'Bisection (linear)' }].filter(z => z.x.length);
        pane.querySelector('#p').innerHTML = `<h4>Error vs iteration</h4>${plotSVG(s, { logy: true, xlabel: 'iteration', ylabel: '|x − root|', h: 260 })}${legend(s)}`;
      };
      pane.querySelectorAll('input').forEach(i => i.oninput = debounce(run, 250)); run();
    },
    int() {
      pane.innerHTML = `<div class="calc"><div class="panel tick"><div class="field"><label>f(x)</label><div class="in"><input id="f" value="exp(-x^2)"></div></div><div class="grid g3"><div class="field"><label>a</label><div class="in"><input id="a" value="0"></div></div><div class="field"><label>b</label><div class="in"><input id="b" value="2"></div></div><div class="field"><label>Intervals n</label><div class="in"><input id="n" value="10"></div></div></div></div><div class="panel"><div id="o"></div></div></div><div class="panel mt"><div id="p"></div></div>`;
      const run = () => {
        let f; try { f = F(pane.querySelector('#f').value); } catch (e) { return; }
        const g = x => f({ x }), a = +pane.querySelector('#a').value, b = +pane.querySelector('#b').value, n = Math.max(2, Math.round(+pane.querySelector('#n').value / 2) * 2);
        const trap = m => { const h = (b - a) / m; let s = (g(a) + g(b)) / 2; for (let i = 1; i < m; i++) s += g(a + i * h); return s * h; };
        const simp = m => { const h = (b - a) / m; let s = g(a) + g(b); for (let i = 1; i < m; i++) s += (i % 2 ? 4 : 2) * g(a + i * h); return s * h / 3; };
        const mid = m => { const h = (b - a) / m; let s = 0; for (let i = 0; i < m; i++) s += g(a + (i + 0.5) * h); return s * h; };
        const GL = [[-0.9061798459386640, 0.2369268850561891], [-0.5384693101056831, 0.4786286704993665], [0, 0.5688888888888889], [0.5384693101056831, 0.4786286704993665], [0.9061798459386640, 0.2369268850561891]];
        const gauss = m => { const h = (b - a) / m; let s = 0; for (let i = 0; i < m; i++) { const c = a + (i + 0.5) * h; GL.forEach(([t, w]) => { s += w * g(c + t * h / 2) * h / 2; }); } return s; };
        const ref = gauss(400);
        const rows = [['Midpoint', mid(n), 'O(h²)'], ['Trapezoid', trap(n), 'O(h²)'], ["Simpson's 1/3", simp(n), 'O(h⁴)'], ['Gauss–Legendre 5-pt per panel', gauss(n / 2), 'O(h¹⁰)']];
        pane.querySelector('#o').innerHTML = `<table class="tbl"><thead><tr><th>Rule</th><th class="num">Result</th><th class="num">|Error|</th><th>Order</th></tr></thead><tbody>${rows.map(([nm, v, o]) => `<tr><td>${nm}</td><td class="num mono">${v.toPrecision(12)}</td><td class="num">${fmt(Math.abs(v - ref), 3)}</td><td>${o}</td></tr>`).join('')}</tbody></table><p class="small muted">Reference: composite Gauss–Legendre with 400 panels = ${ref.toPrecision(14)}</p>`;
        const ns = [2, 4, 8, 16, 32, 64, 128, 256, 512];
        const s = [{ x: ns, y: ns.map(m => Math.max(Math.abs(trap(m) - ref), 1e-17)), label: 'trapezoid' }, { x: ns, y: ns.map(m => Math.max(Math.abs(simp(m) - ref), 1e-17)), label: 'Simpson' }, { x: ns, y: ns.map(m => Math.max(Math.abs(mid(m) - ref), 1e-17)), label: 'midpoint' }];
        pane.querySelector('#p').innerHTML = `<h4>Convergence</h4>${plotSVG(s, { logx: true, logy: true, xlabel: 'intervals n', ylabel: '|error|', h: 260 })}${legend(s)}`;
      };
      pane.querySelectorAll('input').forEach(i => i.oninput = debounce(run, 250)); run();
    },
    diff() {
      pane.innerHTML = `<div class="calc"><div class="panel tick"><div class="field"><label>f(x)</label><div class="in"><input id="f" value="sin(x)"></div></div><div class="grid g2"><div class="field"><label>x</label><div class="in"><input id="x" value="1"></div></div><div class="field"><label>Exact f′(x) (optional)</label><div class="in"><input id="d" value="cos(1)"></div></div></div></div><div class="panel"><div id="p"></div></div></div>`;
      const run = () => {
        let f, exact; try { f = F(pane.querySelector('#f').value); exact = compile(pane.querySelector('#d').value).f({}); } catch (e) { return; }
        const x = +pane.querySelector('#x').value, g = t => f({ x: t });
        const hs = Array.from({ length: 30 }, (_, i) => Math.pow(10, -0.5 * i));
        const s = [{ x: hs, y: hs.map(h => Math.abs((g(x + h) - g(x)) / h - exact) || 1e-17), label: 'forward O(h)' }, { x: hs, y: hs.map(h => Math.abs((g(x + h) - g(x - h)) / (2 * h) - exact) || 1e-17), label: 'central O(h²)' }, { x: hs, y: hs.map(h => Math.abs((-g(x + 2 * h) + 8 * g(x + h) - 8 * g(x - h) + g(x - 2 * h)) / (12 * h) - exact) || 1e-17), label: 'five-point O(h⁴)' }];
        pane.querySelector('#p').innerHTML = `<h4>Error vs step size h</h4>${plotSVG(s, { logx: true, logy: true, xlabel: 'h', ylabel: '|error|', h: 300 })}${legend(s)}<p class="small muted">Truncation error falls with h until round-off (~ε/h) takes over — the V-shape shows the optimal step.</p>`;
      };
      pane.querySelectorAll('input').forEach(i => i.oninput = debounce(run, 250)); run();
    },
    ode() {
      pane.innerHTML = `<div class="calc"><div class="panel tick"><div class="field"><label>dy/dx = f(x, y)</label><div class="in"><input id="f" value="-2*x*y"></div></div><div class="grid g2"><div class="field"><label>x₀</label><div class="in"><input id="x0" value="0"></div></div><div class="field"><label>y₀</label><div class="in"><input id="y0" value="1"></div></div><div class="field"><label>x end</label><div class="in"><input id="x1" value="2"></div></div><div class="field"><label>Step h</label><div class="in"><input id="h" value="0.2"></div></div></div><div class="field"><label>Exact solution y(x) (optional)</label><div class="in"><input id="ex" value="exp(-x^2)"></div></div></div><div class="panel"><div id="o"></div></div></div><div class="panel mt"><div id="p"></div></div>`;
      const run = () => {
        let f, ex = null; try { f = F(pane.querySelector('#f').value); } catch (e) { return; }
        try { const c = compile(pane.querySelector('#ex').value); ex = x => c.f({ x }); } catch (e) { ex = null; }
        const x0 = +pane.querySelector('#x0').value, y0 = +pane.querySelector('#y0').value, x1 = +pane.querySelector('#x1').value, h = +pane.querySelector('#h').value;
        const n = Math.max(1, Math.round((x1 - x0) / h));
        const d = (x, y) => f({ x, y });
        const step = { Euler: (x, y) => y + h * d(x, y), Heun: (x, y) => { const k1 = d(x, y), k2 = d(x + h, y + h * k1); return y + h / 2 * (k1 + k2); }, RK4: (x, y) => { const k1 = d(x, y), k2 = d(x + h / 2, y + h / 2 * k1), k3 = d(x + h / 2, y + h / 2 * k2), k4 = d(x + h, y + h * k3); return y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); } };
        const sols = Object.entries(step).map(([nm, fn]) => { const xs = [x0], ys = [y0]; for (let i = 0; i < n; i++) { ys.push(fn(xs[i], ys[i])); xs.push(x0 + (i + 1) * h); } return { nm, xs, ys }; });
        const s = sols.map((q, i) => ({ x: q.xs, y: q.ys, label: q.nm, type: 'line', color: COLORS[i] }));
        if (ex) { const xx = linspace(x0, x0 + n * h, 200); s.push({ x: xx, y: xx.map(ex), label: 'exact', dash: '5 4', color: 'var(--ink3)' }); }
        pane.querySelector('#p').innerHTML = plotSVG(s, { xlabel: 'x', ylabel: 'y', h: 300 }) + legend(s);
        pane.querySelector('#o').innerHTML = `<table class="tbl"><thead><tr><th>Method</th><th class="num">y(x_end)</th><th class="num">Error</th><th>Order</th></tr></thead><tbody>${sols.map((q, i) => `<tr><td>${q.nm}</td><td class="num mono">${q.ys[n].toPrecision(10)}</td><td class="num">${ex ? fmt(Math.abs(q.ys[n] - ex(q.xs[n])), 3) : '—'}</td><td>${['1', '2', '4'][i]}</td></tr>`).join('')}</tbody></table>`;
      };
      pane.querySelectorAll('input').forEach(i => i.oninput = debounce(run, 250)); run();
    },
  };
  main.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { main.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); views[b.dataset.t](); });
  views.root();
}

// ── Psychrometric chart ────────────────────────────────────────
export function psychroChart(main) {
  main.innerHTML = `${crumbs([['Engineering', '#/engineering/hvac'], ['Psychrometric chart']])}${pageHead('HVC / PSYCHRO', 'Interactive Psychrometric Chart', 'Click the chart to place state points. Relative-humidity curves, enthalpy lines and a process line between two states with sensible/latent split.')}
    <div class="calc"><div class="panel tick"><div class="grid g2"><div class="field"><label>Pressure (kPa)</label><div class="in"><input id="p" value="101.325"></div></div><div class="field"><label>Click sets</label><select class="plain" id="which"><option value="0">State 1</option><option value="1">State 2</option></select></div>
      <div class="field"><label>State 1: T (°C), RH (%)</label><div class="in"><input id="t1" value="30"><input id="r1" value="60"></div></div><div class="field"><label>State 2: T (°C), RH (%)</label><div class="in"><input id="t2" value="14"><input id="r2" value="90"></div></div>
      <div class="field"><label>Airflow (m³/s, for process loads)</label><div class="in"><input id="V" value="1"></div></div></div><div id="props"></div></div>
    <div class="panel" style="padding:8px"><svg id="ch" viewBox="0 0 640 440" style="width:100%;height:auto;cursor:crosshair"></svg></div></div>`;
  const $ = s => main.querySelector(s);
  const X0 = 50, X1 = 600, Y0 = 400, Y1 = 20, Tmin = -10, Tmax = 50, Wmax = 30;
  const sx = t => X0 + (t - Tmin) / (Tmax - Tmin) * (X1 - X0), sy = w => Y0 - w / Wmax * (Y0 - Y1);
  const draw = () => {
    const p = +$('#p').value * 1e3, P = [[+$('#t1').value, +$('#r1').value / 100], [+$('#t2').value, +$('#r2').value / 100]].map(([t, r]) => ({ t, r, ...psychro(t, r, p) }));
    const Wof = (t, r) => { const es = 610.94 * Math.exp(17.625 * t / (t + 243.04)); return 0.621945 * r * es / (p - r * es) * 1e3; };
    let g = '';
    for (let t = Tmin; t <= Tmax; t += 5) g += `<line x1="${sx(t)}" x2="${sx(t)}" y1="${Y1}" y2="${Y0}" class="gl"/><text x="${sx(t)}" y="${Y0 + 16}" text-anchor="middle">${t}</text>`;
    for (let w = 0; w <= Wmax; w += 5) g += `<line x1="${X0}" x2="${X1}" y1="${sy(w)}" y2="${sy(w)}" class="gl"/><text x="${X1 + 6}" y="${sy(w) + 4}">${w}</text>`;
    for (let h = 0; h <= 120; h += 10) { const pts = []; for (let t = Tmin; t <= Tmax; t += 1) { const W = (h - 1.006 * t) / (2501 + 1.86 * t) * 1e3; if (W >= 0 && W <= Wof(t, 1)) pts.push(`${sx(t)},${sy(W)}`); } if (pts.length > 1) g += `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--c4)" stroke-opacity=".35" stroke-dasharray="3 4"/><text x="${pts[0].split(',')[0] - 4}" y="${+pts[0].split(',')[1] - 4}" text-anchor="end" style="fill:var(--c4);font-size:9px">${h}</text>`; }
    for (let r = 0.1; r <= 1.0001; r += 0.1) { const pts = []; for (let t = Tmin; t <= Tmax; t += 0.5) { const W = Wof(t, r); if (W <= Wmax) pts.push(`${sx(t)},${sy(W)}`); } g += `<polyline points="${pts.join(' ')}" fill="none" stroke="${r > 0.99 ? 'var(--acc)' : 'var(--c2)'}" stroke-width="${r > 0.99 ? 2.5 : 1}" stroke-opacity="${r > 0.99 ? 1 : 0.55}"/>`; const last = pts[pts.length - 1]; if (last) g += `<text x="${last.split(',')[0]}" y="${+last.split(',')[1] - 3}" style="fill:var(--c2);font-size:9px">${Math.round(r * 100)}%</text>`; }
    g += `<line x1="${sx(P[0].t)}" y1="${sy(P[0].W * 1e3)}" x2="${sx(P[1].t)}" y2="${sy(P[1].W * 1e3)}" stroke="var(--c3)" stroke-width="2" stroke-dasharray="6 3"/>`;
    P.forEach((s, i) => { g += `<circle cx="${sx(s.t)}" cy="${sy(s.W * 1e3)}" r="6" fill="${i ? 'var(--c3)' : 'var(--acc)'}"/><text x="${sx(s.t) + 9}" y="${sy(s.W * 1e3) - 8}" style="fill:var(--ink);font-size:12px">${i + 1}</text>`; });
    g += `<text x="${(X0 + X1) / 2}" y="${Y0 + 34}" text-anchor="middle" class="ttl">Dry-bulb temperature (°C)</text><text x="${X1 + 30}" y="${Y1 + 4}" class="ttl" text-anchor="end">W g/kg</text>`;
    $('#ch').innerHTML = `<g class="plot">${g}</g>`;
    $('#ch').classList.add('plot');
    const V = +$('#V').value, m = 1.2 * V / 1, dh = P[0].h - P[1].h, dW = P[0].W - P[1].W, Qs = m * (1006 + 1860 * (P[0].W + P[1].W) / 2) * (P[0].t - P[1].t), Ql = m * 2501e3 * dW;
    $('#props').innerHTML = `<table class="tbl mt"><thead><tr><th></th><th class="num">State 1</th><th class="num">State 2</th></tr></thead><tbody>${[['Dry bulb °C', s => s.t.toFixed(1)], ['RH %', s => (s.r * 100).toFixed(1)], ['W g/kg', s => (s.W * 1e3).toFixed(2)], ['Dew point °C', s => s.Td.toFixed(1)], ['Wet bulb °C', s => s.Tw.toFixed(1)], ['h kJ/kg', s => (s.h / 1e3).toFixed(1)], ['v m³/kg', s => s.v.toFixed(3)]].map(([l, f]) => `<tr><td>${l}</td><td class="num">${f(P[0])}</td><td class="num">${f(P[1])}</td></tr>`).join('')}</tbody></table>
      <div class="readouts mt"><div class="readout primary"><div class="rl">Total load 1→2</div><div class="rv">${fmt(m * dh / 1e3, 4)}<span class="u">kW</span></div></div><div class="readout"><div class="rl">Sensible / latent</div><div class="rv">${fmt(Qs / 1e3, 3)} / ${fmt(Ql / 1e3, 3)}<span class="u">kW</span></div></div><div class="readout"><div class="rl">SHR</div><div class="rv">${fmt(Qs / (Qs + Ql), 3)}</div></div></div>`;
  };
  $('#ch').addEventListener('click', ev => {
    const svg = $('#ch'), pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const q = pt.matrixTransform(svg.getScreenCTM().inverse());
    const t = Tmin + (q.x - X0) / (X1 - X0) * (Tmax - Tmin), W = (Y0 - q.y) / (Y0 - Y1) * Wmax / 1e3, p = +$('#p').value * 1e3;
    const es = 610.94 * Math.exp(17.625 * t / (t + 243.04)), pv = W * p / (0.621945 + W), r = Math.min(1, Math.max(0.01, pv / es));
    const i = +$('#which').value + 1;
    $(`#t${i}`).value = t.toFixed(1); $(`#r${i}`).value = (r * 100).toFixed(0);
    $('#which').value = String(1 - (+$('#which').value));
    draw();
  });
  main.querySelectorAll('input').forEach(i => i.oninput = debounce(draw, 200));
  draw();
}

// ── Ask: rule-based question interpreter ───────────────────────
// Aliases are case-sensitive where case matters (nm = nanometre, Nm = newton-metre; kN = force, kn = knots).
const ALIASES = { meters: 'm', metres: 'm', meter: 'm', metre: 'm', millimetres: 'mm', millimeters: 'mm', inches: 'in', inch: 'in', feet: 'ft', foot: 'ft', seconds: 's', sec: 's', minutes: 'min', hours: 'h', hrs: 'h', kilograms: 'kg', tonnes: 't', pounds: 'lb', lbs: 'lb', newtons: 'N', Nm: 'N·m', 'N.m': 'N·m', 'N m': 'N·m', 'lb-ft': 'lbf·ft', 'ft-lb': 'lbf·ft', 'ft·lb': 'lbf·ft', kph: 'km/h', kmh: 'km/h', celsius: '°C', degC: '°C', 'deg C': '°C', fahrenheit: '°F', kelvin: 'K', 'solar masses': 'M☉', 'solar mass': 'M☉', Msun: 'M☉', volts: 'V', volt: 'V', amps: 'A', amp: 'A', ohms: 'Ω', ohm: 'Ω', kohm: 'kΩ', watts: 'W', watt: 'W', 'l/min': 'L/min', lpm: 'L/min', 'l/s': 'L/s', m3: 'm³', 'm3/s': 'm³/s', 'm3/h': 'm³/h', mm2: 'mm²', 'mm^2': 'mm²', m2: 'm²', degrees: 'deg', degree: 'deg', '°': 'deg', uF: 'µF', uH: 'µH', nanometres: 'nm', nanometers: 'nm', 'light years': 'ly', 'light-years': 'ly', kW: 'kW', MPa: 'MPa', GPa: 'GPa' };
function unitIndex() {
  const exact = new Map(), lower = new Map();
  const put = (k, v) => { if (!exact.has(k)) exact.set(k, []); exact.get(k).push(...v); const l = k.toLowerCase(); if (!lower.has(l)) lower.set(l, []); lower.get(l).push(...v); };
  Object.entries(DIMS).forEach(([dim, d]) => Object.keys(d.units).forEach(u => { if (u && u !== '%') put(u, [[dim, u]]); }));
  Object.entries(ALIASES).forEach(([a, u]) => { const hit = exact.get(u); if (hit) put(a, hit); });
  return { exact, lower, keys: [...exact.keys()] };
}
export function interpret(q) {
  const idx = unitIndex();
  const keys = [...new Set(idx.keys)].sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(-?\\d+(?:\\.\\d+)?(?:e-?\\d+)?)\\s*(?:x\\s*10\\^?(-?\\d+))?\\s*(${keys.join('|')})(?![a-z²³])`, 'gi');
  const qs = [];
  let m;
  while ((m = re.exec(q))) {
    const v = parseFloat(m[1]) * (m[2] ? Math.pow(10, +m[2]) : 1), cands = idx.exact.get(m[3]) || idx.lower.get(m[3].toLowerCase()) || [];
    qs.push({ v, unit: m[3], cands, ctx: q.slice(Math.max(0, m.index - 40), m.index).toLowerCase(), after: q.slice(m.index + m[0].length, m.index + m[0].length + 25).toLowerCase(), text: m[0] });
  }
  // Unitless numbers (e.g. "0.85 power factor", "ratio of 10") become dimensionless candidates.
  const taken = qs.map(x => [q.indexOf(x.text), q.indexOf(x.text) + x.text.length]);
  const reN = /(-?\d+(?:\.\d+)?(?:e-?\d+)?)/g;
  while ((m = reN.exec(q))) { const at = m.index; if (taken.some(([a, b]) => at >= a && at < b)) continue; qs.push({ v: parseFloat(m[1]), unit: '', cands: [['none', '']], ctx: q.slice(Math.max(0, at - 30), at).toLowerCase(), after: q.slice(at + m[0].length, at + m[0].length + 25).toLowerCase(), text: m[0], bare: true }); }
  const ql = q.toLowerCase();
  const hits = search(q.replace(/\d+(\.\d+)?/g, ' ')).filter(h => h.type === 'Calculator').slice(0, 10).map(h => h.url.split('/').pop());
  const spec = {};
  CALCS.forEach(c => { const sc = c.tags.concat([c.title.toLowerCase()]).filter(t => ql.includes(t.toLowerCase())).reduce((s, t) => s + t.length, 0); if (sc) spec[c.id] = sc; });
  const wordHits = Object.keys(spec);
  const candIds = [...new Set([...hits, ...wordHits])];
  let best = null;
  candIds.forEach((id, rank) => {
    const c = CALC[id]; if (!c) return;
    const assign = assignInputs(c, qs);
    const score = (assign.n - assign.mapping.filter(x => x.bare).length * 0.5) * 3 - rank * 0.3 + Math.min(6, (spec[id] || 0) * 0.25) + (hits[0] === id ? 1.5 : 0);
    if (!best || score > best.score) best = { id, c, score, ...assign };
  });
  if (!best) return { quantities: qs, error: 'No matching calculator found — try naming the quantity (e.g. "Reynolds number", "bending stress", "time dilation").' };
  // Pickers by keyword
  best.c.inputs.filter(i => i.type === 'fluid').forEach(i => { if (/sea ?water/.test(ql)) best.values[i.k] = 'seawater'; else if (/\bwater\b/.test(ql)) best.values[i.k] = /hot|60/.test(ql) ? 'water60' : 'water20'; else if (/\bair\b/.test(ql)) best.values[i.k] = 'air20'; else if (/oil/.test(ql)) best.values[i.k] = 'oil-iso46'; else if (/glycerin/.test(ql)) best.values[i.k] = 'glycerin'; });
  best.c.inputs.filter(i => i.type === 'material').forEach(i => { const mm = MATERIALS.find(x => { const key = x.name.toLowerCase().match(/\d{3,4}(-t\d+)?|ti-6al-4v|a36|s355|abs|pla|peek|nylon|copper|brass/); return key && ql.includes(key[0]); }) || (/\bsteel\b/.test(ql) && MATERIALS.find(x => x.id === 'st-1045-cd')) || (/alumin/.test(ql) && MATERIALS.find(x => x.id === 'al-6061-t6')) || (/titanium/.test(ql) && MATERIALS.find(x => x.id === 'ti-6al4v')); if (mm) best.values[i.k] = mm.id; });
  return { quantities: qs, ...best };
}
function assignInputs(c, qs) {
  const values = {}, used = new Set(), mapping = [];
  const nums = c.inputs.filter(i => i.type === 'number');
  qs.forEach(q => {
    let opts = nums.filter(i => !used.has(i.k) && q.cands.some(([d]) => d === i.dim));
    const words = `${q.ctx} ${q.after}`;
    if (q.bare) opts = opts.filter(i => i.label.toLowerCase().split(/[^a-z]+/).some(w => w.length > 3 && words.includes(w)));
    if (!opts.length) return;
    const scoreOf = i => i.label.toLowerCase().split(/[^a-z]+/).filter(w => w.length > 2).reduce((s, w) => s + (words.includes(w) ? 2 : 0), 0) + (i.sym && words.includes(` ${i.sym.toLowerCase()} `) ? 1 : 0) - (i.adv ? 0.5 : 0);
    opts.sort((a, b) => scoreOf(b) - scoreOf(a));
    const inp = opts[0], [dim, u] = q.cands.find(([d]) => d === inp.dim);
    values[inp.k] = toSI(q.v, dim, u); used.add(inp.k);
    mapping.push({ q, inp, unit: u, bare: q.bare });
  });
  // Choose a mode option that makes the assigned inputs visible.
  c.inputs.filter(i => i.type === 'select' && /mode|known/i.test(i.k + i.label)).forEach(sel => {
    let bestOpt = null, bestN = -1;
    sel.options.forEach(([o]) => { const v = { ...Object.fromEntries(c.inputs.map(i => [i.k, i.def])), ...values, [sel.k]: o }; const n = mapping.filter(mp => !mp.inp.showIf || mp.inp.showIf(v)).length; if (n > bestN) { bestN = n; bestOpt = o; } });
    if (bestOpt !== null) values[sel.k] = bestOpt;
  });
  return { values, mapping, n: mapping.length };
}
export function ask(main, _, query) {
  const EX = ['Water flowing through a 25 mm pipe at 2 m/s — is it turbulent?', 'Shear stress in a 35 mm 4140 steel shaft carrying 450 N·m', 'Schwarzschild radius of a 10 solar mass black hole', 'What power is 250 N·m at 3000 rpm?', 'Time dilation at 0.9 c', 'Three phase 400 V motor drawing 22 kW at 0.85 power factor', 'Pressure at 30 m depth in seawater', 'Photon energy of 532 nm light', 'Euler buckling of a 3 m column', 'Current through a 220 ohm resistor on 5 V'];
  main.innerHTML = `${crumbs([['Tools', '#/tools'], ['Ask']])}${pageHead('06 / TLS / ASK', 'Ask a Question', 'Type an engineering or physics question in plain English. The interpreter finds the right calculator, extracts quantities and units, runs the real calculation engine and shows exactly how it read your question. It is rule-based (no AI model) — so it never invents numbers, but always check the interpretation.')}
    <div class="hero-search" style="cursor:auto"><span>?</span><input id="q" class="plain" style="border:0;background:transparent;font-size:16px;flex:1;padding:14px 0" placeholder="e.g. water in a 25 mm pipe at 2 m/s — turbulent?" value="${esc(query.get('q') || EX[0])}"><button class="btn" id="go" style="margin:6px">Ask</button></div>
    <div class="chips mt">${EX.map(e => `<button class="chip" data-ex="${esc(e)}" style="text-transform:none">${esc(e)}</button>`).join('')}</div><div id="ans" class="mt2"></div>`;
  const $ = s => main.querySelector(s);
  const run = () => {
    const q = $('#q').value, r = interpret(q), out = $('#ans');
    if (r.error) { out.innerHTML = `<div class="msg warn">${esc(r.error)}</div>${r.quantities.length ? `<p class="small muted">Quantities found: ${r.quantities.map(x => esc(x.text)).join(', ')}</p>` : ''}`; return; }
    const c = r.c, v = Object.fromEntries(c.inputs.map(i => [i.k, i.def]));
    c.inputs.filter(i => i.fill).forEach(i => { const rec = pickerRecord(i.type, r.values[i.k] ?? i.def); if (rec) Object.entries(i.fill).forEach(([k, pk]) => { if (rec[pk] != null) v[k] = rec[pk]; }); });
    Object.assign(v, r.values);
    let res; try { res = c.compute({ ...v }); } catch (e) { res = { _warn: [e.message] }; }
    const outs = c.outputs.filter(o => o.primary || !o.adv).slice(0, 6);
    const u = settings.units;
    const unitsState = Object.fromEntries(c.inputs.filter(i => i.type === 'number').map(i => [i.k, defaultUnit(i.dim, u, i.u)]));
    const link = `#/calc/${c.id}?s=${encodeState({ v, u: unitsState, m: 'advanced' })}`;
    out.innerHTML = `<div class="split"><div class="panel tick"><h4>Interpreted as</h4><h2 style="margin:8px 0">${esc(c.title)}</h2><table class="tbl mt"><thead><tr><th>From your text</th><th>Used as</th></tr></thead><tbody>${r.mapping.map(mp => `<tr><td class="mono">${esc(mp.q.text)}</td><td>${esc(mp.inp.label)}</td></tr>`).join('') || '<tr><td colspan="2" class="muted">No quantities matched — defaults used.</td></tr>'}${c.inputs.filter(i => i.fill && r.values[i.k]).map(i => `<tr><td class="mono">keyword</td><td>${esc(i.label)}: ${esc(r.values[i.k])}</td></tr>`).join('')}</tbody></table>
      <p class="small muted mt">All other inputs use the calculator defaults. <a href="${link}">Open the full calculator →</a> to check them, see equations and assumptions, or export a calculation sheet.</p></div>
      <div class="panel"><h4>Result</h4><div class="readouts mt">${outs.map(o => { const val = res[o.k]; const unit = o.type === 'text' ? '' : defaultUnit(o.dim, u, o.u); return `<div class="readout${o.primary ? ' primary' : ''}"><div class="rl">${esc(o.label)}</div><div class="rv${o.type === 'text' ? ' txt' : ''}">${o.type === 'text' ? esc(val ?? '—') : typeof val === 'number' ? esc(fmt(fromSI(val, o.dim, unit), 5)) : '—'}<span class="u">${esc(o.type === 'text' ? '' : (o.dim === 'none' ? (unit === '%' ? '%' : o.note || '') : unit))}</span></div></div>`; }).join('')}</div>${(res._warn || []).map(w => `<div class="msg warn">${esc(w)}</div>`).join('')}${(res._checks || []).map(ch => `<div class="check ${ch.pass ? 'pass' : 'fail'}"><span class="st">${ch.pass ? 'PASS' : 'FAIL'}</span><span>${esc(ch.label)}</span></div>`).join('')}
      <h4 class="mt">Equations used</h4>${c.eq.slice(0, 3).map(e => `<div class="eqblock">${T(e, true)}</div>`).join('')}</div></div>`;
  };
  $('#go').onclick = run; $('#q').onkeydown = e => { if (e.key === 'Enter') run(); };
  main.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => { $('#q').value = b.dataset.ex; run(); });
  run();
}
