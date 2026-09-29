// Solver cores: circuit (complex MNA), pipe network (nodal Newton), ideal-gas cycles, MDOF vibration, gear trains.
import { eigSym } from '../core/numeric.js';
import { colebrook } from '../calcs/fluids.js';

// ── Complex linear solve ───────────────────────────────────────
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]], csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cabs = a => Math.hypot(a[0], a[1]);
export function solveComplex(A, b) {
  const n = b.length, M = A.map((r, i) => [...r.map(c => [...c]), [...b[i]]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (cabs(M[r][c]) > cabs(M[p][c])) p = r;
    if (cabs(M[p][c]) < 1e-15) return null;
    [M[p], M[c]] = [M[c], M[p]];
    for (let r = c + 1; r < n; r++) { const f = cdiv(M[r][c], M[c][c]); for (let k = c; k <= n; k++) M[r][k] = csub(M[r][k], cmul(f, M[c][k])); }
  }
  const x = new Array(n);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s = csub(s, cmul(M[r][k], x[k])); x[r] = cdiv(s, M[r][r]); }
  return x;
}

// ── Circuit: modified nodal analysis ───────────────────────────
// parts: [{type:'R'|'C'|'L'|'V'|'I', a, b, value, phase?}] nodes are integers, 0 = ground. f = 0 → DC.
export function solveCircuit(parts, f) {
  const w = 2 * Math.PI * f;
  const nodes = [...new Set(parts.flatMap(p => [p.a, p.b]))].filter(n => n !== 0).sort((x, y) => x - y);
  const idx = Object.fromEntries(nodes.map((n, i) => [n, i]));
  // In DC, inductors are shorts (0 V sources) and capacitors are open.
  const vsrc = parts.filter(p => p.type === 'V' || (f === 0 && p.type === 'L'));
  const N = nodes.length + vsrc.length;
  if (!nodes.length) return { error: 'No nodes besides ground.' };
  const A = Array.from({ length: N }, () => Array.from({ length: N }, () => [0, 0])), z = Array.from({ length: N }, () => [0, 0]);
  const stamp = (a, b, y) => {
    const ia = idx[a], ib = idx[b];
    if (ia !== undefined) A[ia][ia] = cadd(A[ia][ia], y);
    if (ib !== undefined) A[ib][ib] = cadd(A[ib][ib], y);
    if (ia !== undefined && ib !== undefined) { A[ia][ib] = csub(A[ia][ib], y); A[ib][ia] = csub(A[ib][ia], y); }
  };
  const Y = p => p.type === 'R' ? [1 / p.value, 0] : p.type === 'C' ? [0, w * p.value] : p.type === 'L' ? cdiv([1, 0], [0, w * p.value]) : null;
  parts.forEach(p => {
    if (p.type === 'R' || (p.type === 'C' && f > 0) || (p.type === 'L' && f > 0)) stamp(p.a, p.b, Y(p));
    if (p.type === 'I') { const ph = (p.phase || 0) * Math.PI / 180, I = [p.value * Math.cos(ph), p.value * Math.sin(ph)]; if (idx[p.a] !== undefined) z[idx[p.a]] = csub(z[idx[p.a]], I); if (idx[p.b] !== undefined) z[idx[p.b]] = cadd(z[idx[p.b]], I); }
  });
  // Tiny conductance to ground keeps floating nodes (e.g. behind a DC capacitor) solvable.
  nodes.forEach((_, i) => { A[i][i] = cadd(A[i][i], [1e-12, 0]); });
  vsrc.forEach((p, k) => {
    const r = nodes.length + k, ia = idx[p.a], ib = idx[p.b];
    if (ia !== undefined) { A[ia][r] = cadd(A[ia][r], [1, 0]); A[r][ia] = cadd(A[r][ia], [1, 0]); }
    if (ib !== undefined) { A[ib][r] = csub(A[ib][r], [1, 0]); A[r][ib] = csub(A[r][ib], [1, 0]); }
    const ph = (p.phase || 0) * Math.PI / 180;
    z[r] = p.type === 'L' ? [0, 0] : [p.value * Math.cos(ph), p.value * Math.sin(ph)];
  });
  const x = solveComplex(A, z);
  if (!x) return { error: 'Circuit is singular (e.g. a loop of voltage sources, or a current source into an open node).' };
  const V = n => (n === 0 ? [0, 0] : x[idx[n]]);
  const out = parts.map(p => {
    const vab = csub(V(p.a), V(p.b));
    let I;
    if (p.type === 'V' || (f === 0 && p.type === 'L')) I = x[nodes.length + vsrc.indexOf(p)]; // MNA branch current, a→b through the element (negative P = delivering)
    else if (p.type === 'I') { const ph = (p.phase || 0) * Math.PI / 180; I = [p.value * Math.cos(ph), p.value * Math.sin(ph)]; }
    else if (p.type === 'C' && f === 0) I = [0, 0];
    else I = cmul(vab, Y(p));
    // Complex power S = V·I* (with passive sign convention: I flows a→b through the element)
    const S = cmul(vab, [I[0], -I[1]]);
    return { ...p, V: vab, I, P: f > 0 ? S[0] / 2 : S[0], Q: f > 0 ? S[1] / 2 : 0 };
  });
  return { nodes: nodes.map(n => ({ n, V: V(n) })), parts: out, dc: f === 0 };
}

// ── Pipe network ───────────────────────────────────────────────
// nodes: [{id, type:'res'|'junc', H? (m, reservoirs), z (m), demand (m³/s out)}]
// pipes: [{from, to, L, D, eps, K?, pumpH0?, pumpA?}] (pump curve H = H0 − A·Q², acting from→to)
export function solvePipeNetwork({ nodes, pipes, rho = 998.2, mu = 1.002e-3 }) {
  const g = 9.80665;
  const unk = nodes.map((n, i) => (n.type === 'res' ? -1 : i)).filter(i => i >= 0);
  if (!nodes.some(n => n.type === 'res')) return { error: 'At least one fixed-head node (reservoir/tank) is required.' };
  const H = nodes.map(n => (n.type === 'res' ? n.H : 0));
  const resH = nodes.filter(n => n.type === 'res').map(n => n.H);
  const mean = resH.reduce((a, b) => a + b, 0) / resH.length;
  unk.forEach(i => { H[i] = mean; });
  const pipeQ = (p, dH, Q0) => {
    // Solve r(Q)·Q|Q| + minor − pump(Q) = dH for Q by Newton, dH = H_from − H_to.
    const A = Math.PI * p.D ** 2 / 4;
    const loss = Q => {
      const v = Q / A, Re = Math.max(rho * Math.abs(v) * p.D / mu, 1e-6);
      const f = Re < 1 ? 64 : colebrook(Re, p.eps / p.D);
      const h = (f * p.L / p.D + (p.K || 0)) * v * Math.abs(v) / (2 * g);
      const pump = p.pumpH0 ? Math.max(0, p.pumpH0 - (p.pumpA || 0) * Q * Math.abs(Q)) : 0;
      return h - pump;
    };
    let Q = Q0 || 1e-4 * Math.sign(dH || 1);
    for (let it = 0; it < 60; it++) {
      const F = loss(Q) - dH, dq = Math.max(1e-9, Math.abs(Q) * 1e-6), d = (loss(Q + dq) - loss(Q - dq)) / (2 * dq);
      let step = F / (d || 1e-9);
      if (!Number.isFinite(step)) break;
      if (Math.abs(step) > Math.abs(Q) + 0.01) step = Math.sign(step) * (Math.abs(Q) + 0.01);
      Q -= step;
      if (Math.abs(step) < 1e-12) break;
    }
    return Q;
  };
  let Qs = pipes.map(() => 1e-3);
  let converged = false, iters = 0;
  for (iters = 0; iters < 200; iters++) {
    Qs = pipes.map((p, k) => pipeQ(p, H[p.from] - H[p.to], Qs[k]));
    const res = unk.map(i => pipes.reduce((s, p, k) => s + (p.to === i ? Qs[k] : 0) - (p.from === i ? Qs[k] : 0), 0) - (nodes[i].demand || 0));
    if (Math.max(...res.map(Math.abs), 0) < 1e-9) { converged = true; break; }
    // Jacobian from per-pipe conductances dQ/d(ΔH).
    const G = pipes.map((p, k) => { const e = 1e-5 * Math.max(1, Math.abs(H[p.from] - H[p.to])); return (pipeQ(p, H[p.from] - H[p.to] + e, Qs[k]) - pipeQ(p, H[p.from] - H[p.to] - e, Qs[k])) / (2 * e); });
    const n = unk.length, J = Array.from({ length: n }, () => new Array(n).fill(0));
    const ui = Object.fromEntries(unk.map((i, r) => [i, r]));
    pipes.forEach((p, k) => {
      const a = ui[p.from], b = ui[p.to], gk = Math.max(G[k], 1e-12);
      if (a !== undefined) { J[a][a] -= gk; if (b !== undefined) J[a][b] += gk; }
      if (b !== undefined) { J[b][b] -= gk; if (a !== undefined) J[b][a] += gk; }
    });
    const dx = gauss(J, res.map(r => -r));
    if (!dx) return { error: 'Network is singular — check that every junction connects to a fixed-head node.' };
    const lim = Math.max(...dx.map(Math.abs)), scale = lim > 20 ? 20 / lim : 1;
    unk.forEach((i, r) => { H[i] += dx[r] * scale; });
  }
  return {
    converged, iters,
    nodes: nodes.map((n, i) => ({ ...n, H: H[i], p: rho * g * (H[i] - (n.z || 0)) })),
    pipes: pipes.map((p, k) => { const A = Math.PI * p.D ** 2 / 4, v = Qs[k] / A; return { ...p, Q: Qs[k], v, Re: rho * Math.abs(v) * p.D / mu, hf: H[p.from] - H[p.to] + (p.pumpH0 ? Math.max(0, p.pumpH0 - (p.pumpA || 0) * Qs[k] * Math.abs(Qs[k])) : 0), pumpHead: p.pumpH0 ? Math.max(0, p.pumpH0 - (p.pumpA || 0) * Qs[k] * Math.abs(Qs[k])) : 0 }; }),
  };
}
function gauss(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-300) return null;
    [M[p], M[c]] = [M[c], M[p]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}

// ── Ideal-gas cycles ───────────────────────────────────────────
// Returns states [{p, v, T, s}] and processes [{from, to, kind, q, w}] per kg.
export function solveCycle(o) {
  const { R, g } = o, cv = R / (g - 1), cp = g * cv;
  const T1 = o.T1, p1 = o.p1, v1 = R * T1 / p1;
  const S = (T, v) => ({ T, v, p: R * T / v });
  const st = [S(T1, v1)];
  const pr = [];
  const add = (kind, s) => { pr.push({ from: st.length - 1, to: st.length, kind }); st.push(s); };
  switch (o.cycle) {
    case 'otto': { const v2 = v1 / o.r, T2 = T1 * o.r ** (g - 1); add('isentropic', S(T2, v2)); add('isochoric', S(o.Tmax, v2)); add('isentropic', S(o.Tmax * (v2 / v1) ** (g - 1), v1)); add('isochoric', st[0]); break; }
    case 'diesel': { const v2 = v1 / o.r, T2 = T1 * o.r ** (g - 1), v3 = v2 * o.Tmax / T2; add('isentropic', S(T2, v2)); add('isobaric', S(o.Tmax, v3)); add('isentropic', S(o.Tmax * (v3 / v1) ** (g - 1), v1)); add('isochoric', st[0]); break; }
    case 'dual': { const v2 = v1 / o.r, T2 = T1 * o.r ** (g - 1), T3 = T2 * o.alpha, v4 = v2 * o.Tmax / T3; add('isentropic', S(T2, v2)); add('isochoric', S(T3, v2)); add('isobaric', S(o.Tmax, v4)); add('isentropic', S(o.Tmax * (v4 / v1) ** (g - 1), v1)); add('isochoric', st[0]); break; }
    case 'brayton': {
      const k = (g - 1) / g, p2 = p1 * o.rp, T2s = T1 * o.rp ** k, T2 = T1 + (T2s - T1) / o.etac, T4s = o.Tmax / o.rp ** k, T4 = o.Tmax - o.etat * (o.Tmax - T4s);
      add(o.etac < 1 ? 'adiabatic' : 'isentropic', S(T2, R * T2 / p2)); add('isobaric', S(o.Tmax, R * o.Tmax / p2)); add(o.etat < 1 ? 'adiabatic' : 'isentropic', S(T4, R * T4 / p1)); add('isobaric', st[0]); break;
    }
    case 'carnot': { const TH = o.Tmax, v2 = v1 / o.r, v3 = v2 * Math.pow(T1 / TH, 1 / (g - 1)); add('isothermal', S(T1, v2)); add('isentropic', S(TH, v3)); add('isothermal', S(TH, v3 * o.r)); add('isentropic', st[0]); break; }
    case 'stirling': { const v2 = v1 / o.r; add('isothermal', S(T1, v2)); add('isochoric', S(o.Tmax, v2)); add('isothermal', S(o.Tmax, v1)); add('isochoric', st[0]); break; }
  }
  st.pop(); pr[pr.length - 1].to = 0;
  st.forEach(s => { s.s = cv * Math.log(s.T / T1) + R * Math.log(s.v / v1); });
  pr.forEach(p => {
    const A = st[p.from], B = st[p.to], dU = cv * (B.T - A.T);
    p.w = p.kind === 'isochoric' ? 0 : p.kind === 'isobaric' ? R * (B.T - A.T) : p.kind === 'isothermal' ? R * A.T * Math.log(B.v / A.v) : -dU;
    p.q = dU + p.w;
    if (o.cycle === 'brayton' && p.kind === 'adiabatic') p.q = 0;
  });
  const qin = pr.filter(p => p.q > 0).reduce((s, p) => s + p.q, 0);
  // Ideal regeneration in Stirling recovers the isochoric heat internally.
  const qinEff = o.cycle === 'stirling' && o.regen ? pr.filter(p => p.q > 0 && p.kind === 'isothermal').reduce((s, p) => s + p.q, 0) : qin;
  const wnet = pr.reduce((s, p) => s + p.w, 0);
  const vs = st.map(s => s.v), mep = wnet / (Math.max(...vs) - Math.min(...vs));
  const Tmin = Math.min(...st.map(s => s.T)), Tmax = Math.max(...st.map(s => s.T));
  // Curves for plotting
  const curves = pr.map(p => {
    const A = st[p.from], B = st[p.to], pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40; let v, T;
      if (p.kind === 'isochoric') { v = A.v; T = A.T + (B.T - A.T) * t; }
      else if (p.kind === 'isobaric') { v = A.v + (B.v - A.v) * t; T = A.T * v / A.v; }
      else if (p.kind === 'isothermal') { v = A.v * Math.pow(B.v / A.v, t); T = A.T; }
      else if (p.kind === 'isentropic') { v = A.v * Math.pow(B.v / A.v, t); T = A.T * Math.pow(A.v / v, g - 1); }
      else { const lp = Math.log(A.p) + (Math.log(B.p) - Math.log(A.p)) * t; v = A.v * Math.pow(B.v / A.v, t); T = Math.exp(lp) * v / R; }
      pts.push({ v, T, p: R * T / v, s: cv * Math.log(T / T1) + R * Math.log(v / v1) });
    }
    return pts;
  });
  return { states: st, processes: pr, qin: qinEff, wnet, eta: wnet / qinEff, etaCarnot: 1 - Tmin / Tmax, mep, curves, cp, cv };
}

// ── MDOF spring–mass chain ─────────────────────────────────────
// masses m[0..n-1]; springs k[0..n] where k[0] connects ground–m1, k[i] m_i–m_{i+1}, k[n] m_n–ground (0 = none).
export function chainMatrices(m, k) {
  const n = m.length, K = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) { K[i][i] += (k[i] || 0) + (k[i + 1] || 0); if (i < n - 1) { K[i][i + 1] -= k[i + 1] || 0; K[i + 1][i] -= k[i + 1] || 0; } }
  return K;
}
export function modal(m, K) {
  const n = m.length, s = m.map(Math.sqrt);
  const A = K.map((r, i) => r.map((v, j) => v / (s[i] * s[j])));
  const { values, vectors } = eigSym(A);
  return values.map((lam, i) => {
    const phi = vectors[i].map((v, j) => v / s[j]), mx = phi.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0);
    return { w: Math.sqrt(Math.max(0, lam)), f: Math.sqrt(Math.max(0, lam)) / (2 * Math.PI), shape: phi.map(v => v / mx) };
  });
}
// Harmonic response amplitudes (modal superposition with modal damping ζ) to force F at DOF j.
export function frf(m, K, j, F, zeta, freqs) {
  const modes = modal(m, K), n = m.length;
  const norm = modes.map(md => md.shape.reduce((s, v, i) => s + m[i] * v * v, 0));
  return freqs.map(f => {
    const w = 2 * Math.PI * f;
    const X = new Array(n).fill(0).map(() => [0, 0]);
    modes.forEach((md, r) => {
      const qn = F * md.shape[j] / norm[r], den = [md.w ** 2 - w * w, 2 * zeta * md.w * w], q = cdiv([qn, 0], den);
      for (let i = 0; i < n; i++) X[i] = cadd(X[i], [q[0] * md.shape[i], q[1] * md.shape[i]]);
    });
    return X.map(cabs);
  });
}

// ── Gear / drive train ─────────────────────────────────────────
// stages: [{type, a, b, eta}] ratio i = speed_in / speed_out
export function stageRatio(s) {
  switch (s.type) {
    case 'gear': case 'chain': return s.b / s.a; // teeth driven/driver
    case 'belt': return s.b / s.a; // pulley diameters
    case 'worm': return s.b / s.a; // wheel teeth / worm starts
    case 'planet': return 1 + s.b / s.a; // ring fixed, sun in, carrier out
  }
  return 1;
}
export function solveDrive({ n, T, stages, tauAllow = 40e6 }) {
  const shafts = [{ label: 'Motor', w: n, T, P: n * T }];
  stages.forEach((s, i) => {
    const prev = shafts[shafts.length - 1], r = stageRatio(s), w = prev.w / r, P = prev.P * s.eta;
    shafts.push({ label: `Shaft ${i + 1}`, w, T: P / w, P, ratio: r });
  });
  shafts.forEach(s => { s.d = Math.cbrt(16 * s.T / (Math.PI * tauAllow)); });
  const last = shafts[shafts.length - 1];
  return { shafts, ratio: n / last.w, eta: last.P / shafts[0].P };
}
