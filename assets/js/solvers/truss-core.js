// 2D pin-jointed truss — direct stiffness method.
// nodes: [{x, y}] (m) · members: [{i, j, A?}] · supports: [{node, type: 'pin'|'rollerY'|'rollerX'}]
//   rollerY = restrained vertically (free to slide horizontally); rollerX = restrained horizontally.
// loads: [{node, Fx, Fy}] (N; +x right, +y up). Member force N > 0 = tension.
import { solveLinear } from './linalg.js';

export function solveTruss({ nodes, members, supports, loads, E, A }) {
  const n = nodes.length, ndof = 2 * n;
  if (n < 2 || !members.length) return { error: 'Define at least two nodes and one member.' };
  for (const m of members) if (m.i === m.j || !nodes[m.i] || !nodes[m.j]) return { error: 'A member references a missing node.' };
  const K = Array.from({ length: ndof }, () => new Float64Array(ndof));
  const F = new Float64Array(ndof);
  const geo = members.map(m => {
    const a = nodes[m.i], b = nodes[m.j], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    return { L, c: dx / L, s: dy / L, EA: E * (m.A ?? A) };
  });
  members.forEach((m, k) => {
    const { L, c, s, EA } = geo[k];
    if (!(L > 0)) return;
    const kk = EA / L, t = [c * c, c * s, s * s];
    const ke = [[t[0], t[1], -t[0], -t[1]], [t[1], t[2], -t[1], -t[2]], [-t[0], -t[1], t[0], t[1]], [-t[1], -t[2], t[1], t[2]]];
    const d = [2 * m.i, 2 * m.i + 1, 2 * m.j, 2 * m.j + 1];
    for (let p = 0; p < 4; p++) for (let q = 0; q < 4; q++) K[d[p]][d[q]] += kk * ke[p][q];
  });
  loads.forEach(l => { if (nodes[l.node]) { F[2 * l.node] += l.Fx || 0; F[2 * l.node + 1] += l.Fy || 0; } });
  const fixed = new Set();
  supports.forEach(s => { if (s.type === 'pin' || s.type === 'rollerX') fixed.add(2 * s.node); if (s.type === 'pin' || s.type === 'rollerY') fixed.add(2 * s.node + 1); });
  const free = [...Array(ndof).keys()].filter(i => !fixed.has(i));
  const u = new Float64Array(ndof);
  if (free.length) {
    const sol = solveLinear(free.map(i => free.map(j => K[i][j])), free.map(i => F[i]));
    if (!sol) return { error: 'The truss is a mechanism (unstable). Check supports (at least 3 independent restraints) and triangulation.' };
    free.forEach((d, k) => { u[d] = sol[k]; });
  }
  const forces = members.map((m, k) => {
    const { L, c, s, EA } = geo[k];
    const du = (u[2 * m.j] - u[2 * m.i]) * c + (u[2 * m.j + 1] - u[2 * m.i + 1]) * s;
    const N = EA / L * du;
    return { ...m, L, N, stress: N / (m.A ?? A), strain: du / L };
  });
  const reactions = supports.map(s => {
    const rx = (s.type === 'pin' || s.type === 'rollerX') ? rowDot(K, 2 * s.node, u) - F[2 * s.node] : 0;
    const ry = (s.type === 'pin' || s.type === 'rollerY') ? rowDot(K, 2 * s.node + 1, u) - F[2 * s.node + 1] : 0;
    return { ...s, Rx: rx, Ry: ry };
  });
  const r = fixed.size, m = members.length;
  return { u: [...u], forces, reactions, degree: m + r - 2 * n, determinacy: m + r === 2 * n ? 'Statically determinate' : m + r > 2 * n ? `Statically indeterminate (degree ${m + r - 2 * n})` : 'Unstable (m + r < 2j)' };
}

function rowDot(K, i, u) { let s = 0; for (let j = 0; j < u.length; j++) s += K[i][j] * u[j]; return s; }
