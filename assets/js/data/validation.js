// Reference cases that calculators are checked against — by the automated test suite (tests/validation.test.mjs)
// and shown on each calculator page as its validation record.
// inputs: overrides on defaults (SI). expect: { outputKey: [value (SI), relativeTolerance] }.

const d = Math.PI / 180;
export const VALIDATION = {
  'shaft-torsion': [{ inputs: { T: 450, d: 0.035, di: 0 }, expect: { tau: [16 * 450 / (Math.PI * 0.035 ** 3), 1e-9] }, source: 'Closed form τ = 16T/πd³' }],
  'beam-cases': [
    { inputs: { case: 'ss_p', L: 4, P: 10e3, E: 210e9, I: 8.36e-6 }, expect: { dmax: [10e3 * 64 / (48 * 210e9 * 8.36e-6), 1e-9], Mmax: [10e3, 1e-9] }, source: 'Roark Table 8.1 case 1e' },
    { inputs: { case: 'ff_w', L: 4, w: 5e3, E: 210e9, I: 8.36e-6 }, expect: { Mmax: [5e3 * 16 / 12, 1e-9] }, source: 'Roark Table 8.1 case 2e' },
  ],
  buckling: [{ inputs: { L: 3, K: '1', E: 200e9, Sy: 250e6, A: 1e-3, I: 1e-7 }, expect: { Pcr: [Math.PI ** 2 * 200e9 * 1e-7 / 9, 1e-9] }, source: 'Euler: P = π²EI/L² (slender column)' }],
  isa: [
    { inputs: { h: 0 }, expect: { T: [288.15, 1e-6], p: [101325, 1e-6], rho: [1.2250, 2e-4], a: [340.294, 1e-5] }, source: 'ICAO Doc 7488 / ISO 2533 sea level' },
    { inputs: { h: 11000 }, expect: { T: [216.65, 1e-6], p: [22632.1, 2e-5], rho: [0.36392, 5e-4] }, source: 'ICAO Doc 7488 tropopause' },
  ],
  'steam-sat': [
    { inputs: { mode: 'p', T: 300 }, expect: { psat: [3536.58941, 1e-8] }, source: 'IAPWS-IF97 verification table (T = 300 K)' },
    { inputs: { mode: 'p', T: 500 }, expect: { psat: [0.263889776e7, 1e-8] }, source: 'IAPWS-IF97 verification table (T = 500 K)' },
    { inputs: { mode: 'T', p: 0.1e6 }, expect: { Tsat: [372.755919, 1e-8] }, source: 'IAPWS-IF97 verification table (p = 0.1 MPa)' },
    { inputs: { mode: 'T', p: 10e6 }, expect: { Tsat: [584.149488, 1e-8] }, source: 'IAPWS-IF97 verification table (p = 10 MPa)' },
  ],
  psychro: [{ inputs: { T: 298.15, RH: 0.5, p: 101325 }, expect: { W: [0.00988, 0.01], Td: [287.0, 0.001] }, source: 'ASHRAE psychrometric chart No. 1 (25 °C, 50 % RH)' }],
  bolt: [
    { inputs: { size: '10,1.5' }, expect: { As: [58.0e-6, 0.005] }, source: 'ISO 898-1 Table 4 (A_s = 58.0 mm²)' },
    { inputs: { size: '20,2.5' }, expect: { As: [245e-6, 0.005] }, source: 'ISO 898-1 Table 4 (A_s = 245 mm²)' },
  ],
  'iso-fit': [{ inputs: { D: 0.025, hIT: '7', sh: 'g', sIT: '6' }, expect: { cmax: [41e-6, 0.03], cmin: [7e-6, 0.06] }, source: 'ISO 286-2: Ø25 H7 (0/+21) / g6 (−7/−20)' }],
  pendulum: [{ inputs: { L: 1, th: 90 * d, g: 9.80665 }, expect: { T: [2 * Math.PI * Math.sqrt(1 / 9.80665) * 1.1803405990161, 1e-9] }, source: 'Exact T/T₀ = 1.18034 at θ₀ = 90° (complete elliptic integral)' }],
  lorentz: [{ inputs: { v: 0.8 * 299792458 }, expect: { g: [5 / 3, 1e-12] }, source: 'γ(0.8c) = 5/3' }],
  debroglie: [{ inputs: { part: 'e', mode: 'V', V: 54 }, expect: { lam: [1.6689e-10, 1e-3] }, source: 'Davisson & Germer (1927): 54 eV electrons, λ ≈ 0.167 nm' }],
  hydrogen: [{ inputs: { Z: 1, nl: 2, nu: 3, red: 'H' }, expect: { lam: [656.47e-9, 5e-5] }, source: 'NIST ASD: H-α 656.46 nm (vacuum)' }],
  'black-hole': [{ inputs: { M: 1.98847e30, a: 0 }, expect: { rs: [2953.25, 1e-4], TH: [6.17e-8, 0.005] }, source: 'Schwarzschild radius and Hawking temperature of 1 M☉' }],
  gps: [{ inputs: { h: 20184e3 }, expect: { gr: [45.7e-6, 0.01], sr: [7.2e-6, 0.02], net: [38.5e-6, 0.01] }, source: 'Ashby, Living Rev. Relativ. 6 (2003): +45.7 µs, −7.2 µs ≈ +38.5 µs/day' }],
  cosmology: [{ inputs: { H0: 67.4, Om: 0.315, z: 0 }, expect: { t0: [13.8e9 * 31557600, 0.005] }, source: 'Planck 2018 ΛCDM age ≈ 13.8 Gyr' }],
  chirp: [{ inputs: { m1: 36 * 1.98847e30, m2: 29 * 1.98847e30 }, expect: { Mc: [28.1 * 1.98847e30, 0.01] }, source: 'GW150914 source-frame chirp mass ≈ 28 M☉' }],
  otto: [{ inputs: { r: 8, g: 1.4 }, expect: { eta: [1 - Math.pow(8, -0.4), 1e-12] }, source: 'η = 1 − r^(1−γ) = 56.47 %' }],
  carnot: [{ inputs: { TH: 600, TC: 300 }, expect: { eta: [0.5, 1e-12], copR: [1, 1e-12] }, source: 'Carnot relations' }],
  entu: [{ inputs: { arr: 'counter', mh: 1, cph: 1000, mc: 1, cpc: 1000, U: 100, A: 10 }, expect: { eps: [0.5, 1e-9] }, source: 'Counterflow, C_r = 1, NTU = 1 → ε = NTU/(1+NTU)' }],
  fatigue: [{ inputs: { Su: 520e6, surf: 'machined' }, expect: { ka: [0.860, 0.005] }, source: 'Shigley Example 6-3 (machined, S_ut = 520 MPa → k_a ≈ 0.86)' }],
  rlc: [{ inputs: { L: 10e-3, C: 1e-6 }, expect: { f0: [1 / (2 * Math.PI * Math.sqrt(1e-8)), 1e-12] }, source: 'f₀ = 1/(2π√LC)' }],
  'three-phase': [{ inputs: { mode: 'P', VL: 400, P: 22e3, pf: 0.85 }, expect: { IL: [22e3 / (Math.sqrt(3) * 400 * 0.85), 1e-12] }, source: 'I = P/(√3 V cos φ)' }],
  orbit: [{ inputs: { body: 'earth', h: 400e3 }, expect: { T: [92.4 * 60, 0.01] }, source: 'ISS orbital period ≈ 92–93 min' }],
  blackbody: [{ inputs: { T: 5772 }, expect: { lmax: [502e-9, 0.002] }, source: 'Wien: λ_max(Sun, 5772 K) ≈ 502 nm' }],
  'pipe-flow': [{ inputs: { rho: 1000, mu: 1e-3, Q: Math.PI / 4 * 0.1 ** 2 * 1, D: 0.1, eps: 1e-5, L: 1, K: 0, dz: 0 }, expect: { Re: [1e5, 1e-9], f: [0.01852, 0.005] }, source: 'Moody chart / Colebrook: Re = 10⁵, ε/D = 10⁻⁴ → f ≈ 0.0185' }],
  reynolds: [{ inputs: { rho: 998.2, mu: 1.002e-3, v: 2, D: 0.025 }, expect: { Re: [998.2 * 2 * 0.025 / 1.002e-3, 1e-12] }, source: 'Definition' }],
};
