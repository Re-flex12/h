// Refrigerant property look-ups: interpolation over tables generated from reference equations of state.
// Units at this interface: T in K, p in Pa, h in J/kg, s in J/(kg·K), ρ in kg/m³.
import { REFRIGERANTS, SUP_DT } from './refrigerant-data.js';

export { REFRIGERANTS, SUP_DT };
export const REFRIGERANT_LIST = Object.entries(REFRIGERANTS).map(([id, r]) => ({ id, ...r }));
const K0 = 273.15;

// Fractional row index for a temperature (°C) or a pressure (log-interpolated on column col).
function idxT(r, Tc) {
  const s = r.sat, n = s.length;
  if (Tc <= s[0][0]) return 0;
  if (Tc >= s[n - 1][0]) return n - 1;
  let i = 0; while (s[i + 1][0] < Tc) i++;
  return i + (Tc - s[i][0]) / (s[i + 1][0] - s[i][0]);
}
function idxP(r, p, col) {
  const s = r.sat, n = s.length, L = Math.log(p);
  if (p <= s[0][col]) return 0;
  if (p >= s[n - 1][col]) return n - 1;
  let i = 0; while (s[i + 1][col] < p) i++;
  return i + (L - Math.log(s[i][col])) / (Math.log(s[i + 1][col]) - Math.log(s[i][col]));
}
// Interpolate a sat-table column at fractional index (pressures and vapour density in log space).
function satCol(r, f, col) {
  const s = r.sat, i = Math.min(Math.floor(f), s.length - 2), t = f - i;
  const a = s[i][col], b = s[i + 1][col];
  if (col === 1 || col === 2 || col === 4) return Math.exp(Math.log(a) + t * (Math.log(b) - Math.log(a)));
  return a + t * (b - a);
}
function satAt(r, f) {
  const c = k => satCol(r, f, k);
  return { T: c(0) + K0, pb: c(1), pd: c(2), rf: c(3), rg: c(4), hf: c(5) * 1e3, hg: c(6) * 1e3, sf: c(7) * 1e3, sg: c(8) * 1e3 };
}
export const inRange = (id, Tc) => { const r = REFRIGERANTS[id]; return Tc >= r.sat[0][0] && Tc <= r.sat[r.sat.length - 1][0]; };

// Saturation state by temperature (K). For zeotropic blends p_bubble ≠ p_dew.
export function refSatT(id, T) { const r = REFRIGERANTS[id]; return { id, ...satAt(r, idxT(r, T - K0)) }; }
// Saturation by pressure: T_dew (vapour side) and T_bubble (liquid side).
export function refSatP(id, p) {
  const r = REFRIGERANTS[id];
  const fd = idxP(r, p, 2), fb = idxP(r, p, 1);
  const dew = satAt(r, fd), bub = satAt(r, fb);
  return { id, p, Tdew: dew.T, Tbub: bub.T, hg: dew.hg, sg: dew.sg, rg: dew.rg, hf: bub.hf, sf: bub.sf, rf: bub.rf };
}

// Quadratic Lagrange interpolation on the non-uniform superheat grid.
function alongDT(row, dT, k) {
  const n = SUP_DT.length;
  let j = 0; while (j < n - 2 && SUP_DT[j + 1] < dT) j++;
  let i0 = Math.max(0, Math.min(j - (dT - SUP_DT[j] < SUP_DT[j + 1] - dT ? 1 : 0), n - 3));
  const xs = [SUP_DT[i0], SUP_DT[i0 + 1], SUP_DT[i0 + 2]], ys = [row[i0][k], row[i0 + 1][k], row[i0 + 2][k]];
  if (ys.some(v => v == null)) return NaN;
  let y = 0;
  for (let a = 0; a < 3; a++) { let L = 1; for (let b = 0; b < 3; b++) if (b !== a) L *= (dT - xs[b]) / (xs[a] - xs[b]); y += L * ys[a]; }
  return y;
}
// Superheated vapour at pressure p and superheat dT above the dew point.
function supAt(r, fd, dT) {
  const i = Math.min(Math.floor(fd), r.sup.length - 2), t = fd - i;
  const g = k => { const a = alongDT(r.sup[i], dT, k), b = alongDT(r.sup[i + 1], dT, k); return k === 2 ? Math.exp(Math.log(a) + t * (Math.log(b) - Math.log(a))) : a + t * (b - a); };
  return { h: g(0) * 1e3, s: g(1) * 1e3, rho: g(2) };
}
export function refPT(id, p, T) {
  const r = REFRIGERANTS[id], fd = idxP(r, p, 2), Tdew = satAt(r, fd).T, dT = T - Tdew;
  if (dT < 0) {
    // Subcooled liquid: saturated-liquid properties at T (incompressible approximation); h corrected by v·Δp.
    const L = refSatT(id, T);
    return { phase: 'liquid', p, T, h: L.hf + (p - L.pb) / L.rf, s: L.sf, rho: L.rf, x: 0, sub: -dT };
  }
  if (dT > SUP_DT[SUP_DT.length - 1]) return null;
  const v = supAt(r, fd, dT);
  return { phase: 'vapour', p, T, ...v, x: 1, sup: dT };
}
// State from pressure and entropy or enthalpy (vapour, two-phase or subcooled).
function fromPK(id, p, key, val) {
  const sat = refSatP(id, p), r = REFRIGERANTS[id], fd = idxP(r, p, 2);
  const f = key === 'h' ? sat.hf : sat.sf, g = key === 'h' ? sat.hg : sat.sg;
  if (val >= f && val <= g) {
    const x = (val - f) / (g - f);
    const other = key === 'h' ? sat.sf + x * (sat.sg - sat.sf) : sat.hf + x * (sat.hg - sat.hf);
    return { phase: 'two-phase', p, T: sat.Tbub + x * (sat.Tdew - sat.Tbub), x, [key]: val, [key === 'h' ? 's' : 'h']: other, rho: 1 / (x / sat.rg + (1 - x) / sat.rf) };
  }
  if (val < f) return { phase: 'liquid', p, T: sat.Tbub, x: 0, h: sat.hf, s: sat.sf, rho: sat.rf, approx: true };
  let lo = 0, hi = SUP_DT[SUP_DT.length - 1];
  const F = d => supAt(r, fd, d)[key] - val;
  if (F(hi) < 0) return null;
  for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (F(m) < 0) lo = m; else hi = m; }
  const dT = (lo + hi) / 2, v = supAt(r, fd, dT);
  return { phase: 'vapour', p, T: sat.Tdew + dT, x: 1, sup: dT, ...v };
}
export const refPS = (id, p, s) => fromPK(id, p, 's', s);
export const refPH = (id, p, h) => fromPK(id, p, 'h', h);

// Single-stage vapour-compression cycle. Temperatures in K; returns the four states and performance.
export function vcrCycle(id, { Te, Tc, sh = 5, sc = 3, etaC = 0.75, Qe = 10e3, etaV = 1, disp = null }) {
  const e = refSatT(id, Te), c = refSatT(id, Tc);
  const pe = e.pd, pc = c.pb;
  // Te is the evaporator dew temperature, Tc the condenser bubble temperature.
  const st1 = sh > 0 ? refPT(id, pe, e.T + sh) : { phase: 'vapour', p: pe, T: e.T, h: e.hg, s: e.sg, rho: e.rg, x: 1 };
  const st2s = refPS(id, pc, st1.s);
  if (!st2s) return null;
  const h2 = st1.h + (st2s.h - st1.h) / etaC;
  const st2 = refPH(id, pc, h2);
  if (!st2) return null;
  const cb = refSatP(id, pc);
  const T3 = cb.Tbub - sc;
  const st3 = sc > 0 ? { phase: 'liquid', p: pc, T: T3, h: refSatT(id, T3).hf, s: refSatT(id, T3).sf, x: 0 } : { phase: 'liquid', p: pc, T: cb.Tbub, h: cb.hf, s: cb.sf, x: 0 };
  const st4 = refPH(id, pe, st3.h);
  const qe = st1.h - st4.h, w = h2 - st1.h, qc = h2 - st3.h;
  const m = Qe / qe;
  return { pe, pc, st1, st2s, st2, st3, st4, qe, w, qc, m, Wc: m * w, Qc: m * qc, COP: qe / w, COPhp: qc / w, COPcarnot: e.T / (c.T - e.T), rp: pc / pe, VCC: st1.rho * qe * etaV, Vdot: m / st1.rho / etaV };
}
