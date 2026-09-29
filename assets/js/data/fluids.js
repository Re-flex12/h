// Fluid property data. Water and air tables at 1 atm; others single-point values at 20 °C.
// Water: IAPWS-95 based tabulations (rounded); air: ideal gas density + Sutherland-type viscosity tabulations
// (as in common heat-transfer texts, e.g. Incropera / Çengel appendices). Single-point fluids are approximate.

export const WATER_TABLE = {
  // T °C, rho kg/m³, mu mPa·s, k W/(m·K), cp kJ/(kg·K), pv kPa (saturation)
  cols: ['T', 'rho', 'mu', 'k', 'cp', 'pv'],
  rows: [
    [0.01, 999.8, 1.792, 0.561, 4.220, 0.6117],
    [10, 999.7, 1.307, 0.580, 4.195, 1.2282],
    [20, 998.2, 1.002, 0.598, 4.184, 2.3392],
    [30, 995.7, 0.798, 0.615, 4.180, 4.2467],
    [40, 992.2, 0.653, 0.631, 4.179, 7.3844],
    [50, 988.0, 0.547, 0.644, 4.181, 12.352],
    [60, 983.2, 0.467, 0.654, 4.185, 19.946],
    [70, 977.8, 0.404, 0.663, 4.190, 31.201],
    [80, 971.8, 0.355, 0.670, 4.197, 47.414],
    [90, 965.3, 0.315, 0.675, 4.205, 70.182],
    [100, 958.4, 0.282, 0.679, 4.216, 101.42],
  ],
};

export const AIR_TABLE = {
  // T °C, rho kg/m³, mu 1e-5 Pa·s, k W/(m·K), cp kJ/(kg·K), Pr
  cols: ['T', 'rho', 'mu', 'k', 'cp', 'Pr'],
  rows: [
    [-20, 1.395, 1.630, 0.02288, 1.006, 0.7362],
    [0, 1.292, 1.729, 0.02364, 1.006, 0.7362],
    [20, 1.204, 1.825, 0.02514, 1.007, 0.7309],
    [40, 1.127, 1.918, 0.02662, 1.007, 0.7255],
    [60, 1.059, 2.008, 0.02808, 1.007, 0.7202],
    [80, 0.9994, 2.096, 0.02953, 1.008, 0.7154],
    [100, 0.9458, 2.181, 0.03095, 1.009, 0.7111],
    [200, 0.7459, 2.577, 0.03779, 1.023, 0.6974],
    [300, 0.6158, 2.934, 0.04418, 1.044, 0.6935],
  ],
};

function interp(table, col, T) {
  const ci = table.cols.indexOf(col);
  const r = table.rows;
  if (T <= r[0][0]) return r[0][ci];
  if (T >= r[r.length - 1][0]) return r[r.length - 1][ci];
  for (let i = 0; i < r.length - 1; i++) {
    if (T >= r[i][0] && T <= r[i + 1][0]) {
      const f = (T - r[i][0]) / (r[i + 1][0] - r[i][0]);
      return r[i][ci] + f * (r[i + 1][ci] - r[i][ci]);
    }
  }
  return NaN;
}

export function water(Tc) {
  return { rho: interp(WATER_TABLE, 'rho', Tc), mu: interp(WATER_TABLE, 'mu', Tc) * 1e-3, k: interp(WATER_TABLE, 'k', Tc), cp: interp(WATER_TABLE, 'cp', Tc) * 1e3, pv: interp(WATER_TABLE, 'pv', Tc) * 1e3 };
}
export function air(Tc) {
  return { rho: interp(AIR_TABLE, 'rho', Tc), mu: interp(AIR_TABLE, 'mu', Tc) * 1e-5, k: interp(AIR_TABLE, 'k', Tc), cp: interp(AIR_TABLE, 'cp', Tc) * 1e3, Pr: interp(AIR_TABLE, 'Pr', Tc) };
}

// Fluid presets used by calculators (SI). Water/air at 20 °C; others approximate at ~20 °C.
export const FLUIDS = [
  { id: 'water20', name: 'Water, 20 °C', rho: 998.2, mu: 1.002e-3, pv: 2339 },
  { id: 'water60', name: 'Water, 60 °C', rho: 983.2, mu: 0.467e-3, pv: 19946 },
  { id: 'seawater', name: 'Seawater, 20 °C (35 g/kg)', rho: 1024.8, mu: 1.08e-3, pv: 2300 },
  { id: 'air20', name: 'Air, 20 °C, 1 atm', rho: 1.204, mu: 1.825e-5, pv: null },
  { id: 'glycerin', name: 'Glycerin, 20 °C', rho: 1261, mu: 1.412, pv: null },
  { id: 'eg50', name: 'Ethylene glycol / water 50 %, 20 °C (approx.)', rho: 1070, mu: 3.8e-3, pv: null },
  { id: 'oil-iso46', name: 'Hydraulic oil ISO VG 46, 40 °C (approx.)', rho: 870, mu: 0.040, pv: null },
  { id: 'diesel', name: 'Diesel fuel, 20 °C (approx.)', rho: 835, mu: 3.0e-3, pv: null },
  { id: 'gasoline', name: 'Gasoline, 20 °C (approx.)', rho: 740, mu: 0.6e-3, pv: null },
  { id: 'mercury', name: 'Mercury, 20 °C', rho: 13534, mu: 1.526e-3, pv: 0.17 },
];

// Specific gases for ideal-gas calculations: R J/(kg·K), cp J/(kg·K) at ~300 K, M g/mol.
export const GASES = [
  { id: 'air', name: 'Air', M: 28.965, R: 287.05, cp: 1005, gamma: 1.4 },
  { id: 'n2', name: 'Nitrogen N₂', M: 28.013, R: 296.8, cp: 1040, gamma: 1.4 },
  { id: 'o2', name: 'Oxygen O₂', M: 31.999, R: 259.8, cp: 918, gamma: 1.395 },
  { id: 'co2', name: 'Carbon dioxide CO₂', M: 44.01, R: 188.9, cp: 846, gamma: 1.289 },
  { id: 'h2', name: 'Hydrogen H₂', M: 2.016, R: 4124.2, cp: 14307, gamma: 1.405 },
  { id: 'he', name: 'Helium He', M: 4.003, R: 2077.1, cp: 5193, gamma: 1.667 },
  { id: 'ar', name: 'Argon Ar', M: 39.948, R: 208.1, cp: 520, gamma: 1.667 },
  { id: 'ch4', name: 'Methane CH₄', M: 16.043, R: 518.3, cp: 2226, gamma: 1.304 },
  { id: 'steam', name: 'Steam (ideal-gas approx., low p)', M: 18.015, R: 461.5, cp: 1872, gamma: 1.327 },
];

// Absolute pipe roughness ε (mm) — typical new-pipe values (Moody 1944; Crane TP-410; White).
export const ROUGHNESS = [
  { id: 'drawn', name: 'Drawn tubing (copper, brass, glass)', eps: 0.0015 },
  { id: 'pvc', name: 'PVC / plastic', eps: 0.0015 },
  { id: 'steel', name: 'Commercial steel / wrought iron', eps: 0.045 },
  { id: 'ss', name: 'Stainless steel (new)', eps: 0.015 },
  { id: 'galv', name: 'Galvanised iron', eps: 0.15 },
  { id: 'castiron', name: 'Cast iron', eps: 0.26 },
  { id: 'concrete', name: 'Concrete (smooth–rough)', eps: 1.0 },
  { id: 'riveted', name: 'Riveted steel', eps: 3.0 },
];

// IAPWS-IF97 Region 4 — saturation pressure/temperature. Valid 273.15 K ≤ T ≤ 647.096 K.
const N = [0.11670521452767e4, -0.72421316703206e6, -0.17073846940092e2, 0.12020824702470e5, -0.32325550322333e7,
  0.14915108613530e2, -0.48232657361591e4, 0.40511340542057e6, -0.23855557567849, 0.65017534844798e3];

export function psatIF97(T) {
  const th = T + N[8] / (T - N[9]);
  const A = th * th + N[0] * th + N[1], B = N[2] * th * th + N[3] * th + N[4], Cc = N[5] * th * th + N[6] * th + N[7];
  const p = Math.pow(2 * Cc / (-B + Math.sqrt(B * B - 4 * A * Cc)), 4);
  return p * 1e6; // Pa
}
export function tsatIF97(p) {
  const beta = Math.pow(p / 1e6, 0.25);
  const E = beta * beta + N[2] * beta + N[5], F = N[0] * beta * beta + N[3] * beta + N[6], G = N[1] * beta * beta + N[4] * beta + N[7];
  const D = 2 * G / (-F - Math.sqrt(F * F - 4 * E * G));
  return (N[9] + D - Math.sqrt((N[9] + D) ** 2 - 4 * (N[8] + N[9] * D))) / 2; // K
}
