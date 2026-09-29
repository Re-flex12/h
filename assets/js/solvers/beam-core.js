// Beam solver core — Euler–Bernoulli finite elements for reactions and deflection (exact at nodes for
// polynomial loads with consistent nodal forces), then exact statics for shear force and bending moment.
//
// Units: SI. Loads positive DOWNWARD. Applied couples positive CLOCKWISE.
// Reactions positive UPWARD; reaction moments positive CLOCKWISE (acting on the beam).
// Shear V(x): sum of upward forces left of x. Moment M(x): sagging positive.
import { solveLinear } from './linalg.js';

const GAUSS = [[-Math.sqrt(3 / 5), 5 / 9], [0, 8 / 9], [Math.sqrt(3 / 5), 5 / 9]];

function udlAt(l, s) { return l.w1 + (l.w2 - l.w1) * (s - l.x1) / ((l.x2 - l.x1) || 1); }

export function solveBeam({ L, E, I, supports, loads, elements = 160 }) {
  if (!(L > 0) || !(E > 0) || !(I > 0)) return { error: 'Length, E and I must be positive.' };
  if (!supports.length) return { error: 'Add at least one support.' };
  // Mesh: uniform nodes + all key points.
  const keys = new Set([0, L]);
  for (let i = 1; i < elements; i++) keys.add(L * i / elements);
  supports.forEach(s => keys.add(clamp(s.x, 0, L)));
  loads.forEach(l => { if (l.type === 'udl') { keys.add(clamp(l.x1, 0, L)); keys.add(clamp(l.x2, 0, L)); } else keys.add(clamp(l.x, 0, L)); });
  const xs = [...keys].sort((a, b) => a - b).filter((x, i, a) => i === 0 || x - a[i - 1] > L * 1e-9);
  const n = xs.length, ndof = 2 * n;
  const nodeOf = x => { let best = 0; for (let i = 1; i < n; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i; return best; };

  const K = Array.from({ length: ndof }, () => new Float64Array(ndof));
  const F = new Float64Array(ndof);
  const EI = E * I;
  for (let e = 0; e < n - 1; e++) {
    const l = xs[e + 1] - xs[e], k = EI / l ** 3;
    const ke = [[12, 6 * l, -12, 6 * l], [6 * l, 4 * l * l, -6 * l, 2 * l * l], [-12, -6 * l, 12, -6 * l], [6 * l, 2 * l * l, -6 * l, 4 * l * l]];
    const d = [2 * e, 2 * e + 1, 2 * e + 2, 2 * e + 3];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) K[d[i]][d[j]] += k * ke[i][j];
    // Consistent loads from distributed loads (linear within each element because UDL ends are nodes).
    const xa = xs[e], xb = xs[e + 1], xm = (xa + xb) / 2;
    let wa = 0, wb = 0;
    loads.forEach(ld => {
      if (ld.type !== 'udl') return;
      const lo = Math.min(ld.x1, ld.x2), hi = Math.max(ld.x1, ld.x2);
      if (xm > lo && xm < hi) { wa += udlAt(ld, xa); wb += udlAt(ld, xb); }
    });
    if (wa || wb) {
      F[d[0]] += -(l / 20) * (7 * wa + 3 * wb);
      F[d[1]] += -(l * l / 60) * (3 * wa + 2 * wb);
      F[d[2]] += -(l / 20) * (3 * wa + 7 * wb);
      F[d[3]] += (l * l / 60) * (2 * wa + 3 * wb);
    }
  }
  loads.forEach(ld => {
    if (ld.type === 'point') F[2 * nodeOf(ld.x)] += -ld.P;
    if (ld.type === 'moment') F[2 * nodeOf(ld.x) + 1] += -ld.M; // clockwise positive → FE ccw positive
  });
  const fixed = new Set();
  supports.forEach(s => { const i = nodeOf(s.x); fixed.add(2 * i); if (s.type === 'fixed') fixed.add(2 * i + 1); });
  const free = [];
  for (let i = 0; i < ndof; i++) if (!fixed.has(i)) free.push(i);
  const Kr = free.map(i => free.map(j => K[i][j]));
  const Fr = free.map(i => F[i]);
  const ur = free.length ? solveLinear(Kr, Fr) : [];
  if (!ur) return { error: 'The beam is unstable (a mechanism). Add or change supports — e.g. a cantilever needs a fixed support; a simply supported beam needs two.' };
  const u = new Float64Array(ndof);
  free.forEach((d, k) => { u[d] = ur[k]; });

  // Reactions R = K u − F at restrained DOFs.
  const reactions = supports.map(s => {
    const i = nodeOf(s.x);
    const rv = row(K, 2 * i, u) - F[2 * i];
    const rm = s.type === 'fixed' ? -(row(K, 2 * i + 1, u) - F[2 * i + 1]) : 0;
    return { ...s, x: xs[i], R: rv, M: rm };
  });
  // Merge reactions of supports placed at the same node (avoid double counting).
  const seen = new Map();
  reactions.forEach(r => { const k = r.x.toFixed(9); if (seen.has(k)) { r.R = 0; r.M = 0; } else seen.set(k, r); });

  // Exact statics for V and M.
  const pointForces = [...reactions.map(r => ({ x: r.x, F: r.R })), ...loads.filter(l => l.type === 'point').map(l => ({ x: l.x, F: -l.P }))];
  const couples = [...reactions.filter(r => r.M).map(r => ({ x: r.x, C: r.M })), ...loads.filter(l => l.type === 'moment').map(l => ({ x: l.x, C: l.M }))];
  const udls = loads.filter(l => l.type === 'udl').map(l => ({ ...l, lo: Math.min(l.x1, l.x2), hi: Math.max(l.x1, l.x2) }));
  const VM = (x, side) => {
    const left = p => side < 0 ? p < x - 1e-12 : p <= x + 1e-12;
    let V = 0, M = 0;
    pointForces.forEach(p => { if (left(p.x)) { V += p.F; M += p.F * (x - p.x); } });
    couples.forEach(c => { if (left(c.x)) M += c.C; });
    udls.forEach(d => {
      const a = d.lo, b = Math.min(d.hi, x);
      if (b <= a) return;
      const h = (b - a) / 2, m = (a + b) / 2;
      GAUSS.forEach(([t, w]) => { const s = m + h * t, q = udlAt(d, s) * w * h; V -= q; M -= q * (x - s); });
    });
    return [V, M];
  };
  // Sample points (with left/right values at discontinuities).
  const samples = [];
  const disc = new Set([...pointForces.map(p => p.x), ...couples.map(c => c.x)]);
  const N = 600;
  for (let i = 0; i <= N; i++) samples.push(L * i / N);
  disc.forEach(x => samples.push(x));
  const pts = [...new Set(samples)].sort((a, b) => a - b);
  const sx = [], sV = [], sM = [];
  pts.forEach(x => {
    const [Vl, Ml] = VM(x, -1), [Vr, Mr] = VM(x, 1);
    if (x > 0) { sx.push(x); sV.push(Vl); sM.push(Ml); }
    if (x < L || x === 0) { sx.push(x); sV.push(Vr); sM.push(Mr); }
  });
  const defl = xs.map((_, i) => u[2 * i]);
  const rot = xs.map((_, i) => u[2 * i + 1]);
  const iMaxD = argmaxAbs(defl), iMaxM = argmaxAbs(sM), iMaxV = argmaxAbs(sV);
  // Equilibrium check
  const totalLoad = loads.reduce((s, l) => s + (l.type === 'point' ? l.P : l.type === 'udl' ? (l.w1 + l.w2) / 2 * Math.abs(l.x2 - l.x1) : 0), 0);
  const totalR = reactions.reduce((s, r) => s + r.R, 0);
  return {
    x: xs, defl, rot, reactions, sx, V: sV, M: sM,
    maxDefl: { x: xs[iMaxD], v: defl[iMaxD] }, maxM: { x: sx[iMaxM], v: sM[iMaxM] }, maxV: { x: sx[iMaxV], v: sV[iMaxV] },
    totalLoad, totalR, equilibriumError: Math.abs(totalLoad - totalR) / Math.max(1, Math.abs(totalLoad)),
    determinate: countUnknowns(supports) <= 2,
  };
}

function countUnknowns(s) { return s.reduce((n, x) => n + (x.type === 'fixed' ? 2 : 1), 0); }
function row(K, i, u) { let s = 0; const r = K[i]; for (let j = 0; j < u.length; j++) s += r[j] * u[j]; return s; }
function argmaxAbs(a) { let k = 0; for (let i = 1; i < a.length; i++) if (Math.abs(a[i]) > Math.abs(a[k])) k = i; return k; }
function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
