// Numerical helpers: complex arithmetic, polynomial roots, special functions, statistics, linear algebra.

// ── Complex numbers as [re, im] ──
export const C = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
  div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
  abs: a => Math.hypot(a[0], a[1]),
  arg: a => Math.atan2(a[1], a[0]),
};

// Evaluate polynomial with real coefficients (descending powers) at complex s.
export function polyval(coef, s) {
  let r = [0, 0];
  for (const c of coef) r = C.add(C.mul(r, s), [c, 0]);
  return r;
}

// All roots of a real polynomial (descending coefficients) by Durand–Kerner iteration.
export function polyRoots(coef) {
  let a = [...coef];
  while (a.length && Math.abs(a[0]) < 1e-300) a.shift();
  const n = a.length - 1;
  if (n < 1) return [];
  a = a.map(c => c / a[0]);
  let z = Array.from({ length: n }, (_, k) => { const r = 1 + Math.max(...a.slice(1).map(Math.abs)); const t = 2 * Math.PI * k / n + 0.4; return [r * 0.9 * Math.cos(t), r * 0.9 * Math.sin(t)]; });
  for (let it = 0; it < 2000; it++) {
    let delta = 0;
    z = z.map((zi, i) => {
      let den = [1, 0];
      z.forEach((zj, j) => { if (i !== j) den = C.mul(den, C.sub(zi, zj)); });
      const step = C.div(polyval(a, zi), den);
      delta = Math.max(delta, C.abs(step));
      return C.sub(zi, step);
    });
    if (delta < 1e-14) break;
  }
  return z.map(r => [r[0], Math.abs(r[1]) < 1e-9 * Math.max(1, Math.abs(r[0])) ? 0 : r[1]]);
}

// Routh array for a real polynomial (descending). Returns { rows, signChanges }.
export function routh(coef) {
  const n = coef.length;
  const w = Math.ceil(n / 2);
  const rows = [coef.filter((_, i) => i % 2 === 0), coef.filter((_, i) => i % 2 === 1)].map(r => { const x = [...r]; while (x.length < w) x.push(0); return x; });
  for (let k = 2; k < n; k++) {
    const a = rows[k - 2], b = [...rows[k - 1]];
    if (b.every(v => Math.abs(v) < 1e-12)) { // row of zeros → auxiliary polynomial derivative
      const p = n - k + 1;
      rows[k - 1] = a.map((v, i) => v * (p - 2 * i)).map(v => v || 0);
    }
    const bb = rows[k - 1];
    if (Math.abs(bb[0]) < 1e-12) bb[0] = 1e-9; // ε method
    const r = [];
    for (let i = 0; i < w; i++) r.push(((bb[0] * (a[i + 1] ?? 0)) - (a[0] * (bb[i + 1] ?? 0))) / bb[0]);
    rows.push(r);
  }
  const first = rows.slice(0, n).map(r => r[0]);
  let changes = 0;
  for (let i = 1; i < first.length; i++) if (Math.sign(first[i]) !== Math.sign(first[i - 1]) && first[i] !== 0) changes++;
  return { rows: rows.slice(0, n), signChanges: changes };
}

// ── Special functions ──
export function erf(x) {
  // Abramowitz & Stegun 7.1.26 refined with a series for small |x|; |error| < 1.2e-7.
  const s = Math.sign(x); x = Math.abs(x);
  if (x < 0.5) { let sum = x, term = x; for (let n = 1; n < 30; n++) { term *= -x * x / n; sum += term / (2 * n + 1); } return s * 2 / Math.sqrt(Math.PI) * sum; }
  const t = 1 / (1 + 0.5 * x);
  const y = 1 - t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return s * y;
}
export const erfc = x => 1 - erf(x);
export const normPdf = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
export const normCdf = z => 0.5 * (1 + erf(z / Math.SQRT2));

// ln Γ(z) — Lanczos approximation as in Numerical Recipes (gammln), |ε| < 2e-10.
const NRC = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
export function lnGamma(z) {
  if (z < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - lnGamma(1 - z);
  let y = z, tmp = z + 5.5, ser = 1.000000000190015;
  tmp -= (z + 0.5) * Math.log(tmp);
  for (const c of NRC) ser += c / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / z);
}

function simpson(f, a, b, n = 2000) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}
export { simpson };

export function tPdf(t, nu) { return Math.exp(lnGamma((nu + 1) / 2) - lnGamma(nu / 2)) / Math.sqrt(nu * Math.PI) * Math.pow(1 + t * t / nu, -(nu + 1) / 2); }
export function tCdf(t, nu) { if (t === 0) return 0.5; const I = simpson(x => tPdf(x, nu), 0, Math.abs(t), 4000); return 0.5 + Math.sign(t) * I; }
export function invert(cdf, p, lo = -50, hi = 50) { for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (cdf(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
export const tInv = (p, nu) => invert(x => tCdf(x, nu), p);
export const normInv = p => invert(normCdf, p, -40, 40);

export function binomPmf(k, n, p) { return Math.exp(lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p)); }
export function poissonPmf(k, lam) { return Math.exp(k * Math.log(lam) - lam - lnGamma(k + 1)); }

// ── Linear algebra ──
export function det(A) {
  const n = A.length, M = A.map(r => [...r]);
  let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (M[p][c] === 0) return 0;
    if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; d = -d; }
    d *= M[c][c];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k < n; k++) M[r][k] -= f * M[c][k]; }
  }
  return d;
}
export function inverse(A) {
  const n = A.length, M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-14) return null;
    [M[p], M[c]] = [M[c], M[p]];
    const pv = M[c][c];
    for (let k = 0; k < 2 * n; k++) M[c][k] /= pv;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let k = 0; k < 2 * n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map(r => r.slice(n));
}
export const matmul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));

// Symmetric eigenproblem (cyclic Jacobi). Returns { values (ascending), vectors (columns) }.
export function eigSym(Ain) {
  const n = Ain.length, A = Ain.map(r => [...r]);
  const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2;
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  const idx = [...Array(n).keys()].sort((a, b) => A[a][a] - A[b][b]);
  return { values: idx.map(i => A[i][i]), vectors: idx.map(i => V.map(r => r[i])) };
}

// General real eigenvalues via characteristic polynomial (Faddeev–LeVerrier) + polynomial roots. Fine for n ≤ ~8.
export function eigGeneral(A) {
  const n = A.length;
  let M = A.map(r => r.map(() => 0));
  const c = [1];
  for (let k = 1; k <= n; k++) {
    const AM = matmul(A, M);
    M = AM.map((r, i) => r.map((v, j) => v + (i === j ? c[k - 1] : 0)));
    const AMk = matmul(A, M);
    c.push(-AMk.reduce((s, r, i) => s + r[i], 0) / k);
  }
  return polyRoots(c);
}

// Radix-2 FFT (in place on copies). Input length padded to a power of two.
export function fft(re, im = null) {
  let n = 1; while (n < re.length) n <<= 1;
  const R = new Float64Array(n), I = new Float64Array(n);
  re.forEach((v, i) => { R[i] = v; }); if (im) im.forEach((v, i) => { I[i] = v; });
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [R[i], R[j]] = [R[j], R[i]]; [I[i], I[j]] = [I[j], I[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = R[i + k], ui = I[i + k], vr = R[i + k + len / 2] * cr - I[i + k + len / 2] * ci, vi = R[i + k + len / 2] * ci + I[i + k + len / 2] * cr;
        R[i + k] = ur + vr; I[i + k] = ui + vi; R[i + k + len / 2] = ur - vr; I[i + k + len / 2] = ui - vi;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  return { re: R, im: I, n };
}
