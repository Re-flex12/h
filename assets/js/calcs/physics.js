// General physics (waves, optics, nuclear) and energy engineering calculators.
import { I, O, SEL, PI, g0, deg, rad, check } from './_h.js';

export default [
  {
    id: 'snell', title: "Refraction — Snell's Law", disc: 'waves', level: 'school', tags: ['refraction', 'refractive index', 'critical angle', 'total internal reflection', 'optics'],
    summary: 'Refraction angle, critical angle and total internal reflection at an interface.',
    inputs: [I('n1', 'Refractive index, medium 1', 'n_1', 'none', 1.5, { hint: 'air 1.000, water 1.333, glass ≈ 1.5, diamond 2.42' }), I('n2', 'Refractive index, medium 2', 'n_2', 'none', 1.0), I('th1', 'Angle of incidence', '\\theta_1', 'angle', rad(30))],
    outputs: [O('th2', 'Angle of refraction', '\\theta_2', 'angle', { primary: true }), O('thc', 'Critical angle', '\\theta_c', 'angle'), O('tir', 'Result', '', 'none', { type: 'text' }), O('v', 'Speed in medium 2', 'v_2', 'velocity', { u: { si: 'km/s' } })],
    compute({ n1, n2, th1 }) {
      const s = n1 * Math.sin(th1) / n2, tir = s > 1;
      return { th2: tir ? NaN : Math.asin(s), thc: n1 > n2 ? Math.asin(n2 / n1) : NaN, tir: tir ? 'Total internal reflection' : 'Refracted', v: 299792458 / n2 };
    },
    eq: ['n_1\\sin\\theta_1 = n_2\\sin\\theta_2', '\\sin\\theta_c = \\frac{n_2}{n_1}\\;(n_1 > n_2)', 'v = c/n'], assume: ['Isotropic media, sharp planar interface.'], limits: ['n depends on wavelength (dispersion).'], refs: ['Hecht, Optics, ch. 4.'],
  },
  {
    id: 'lens', title: 'Thin Lens / Mirror Equation', disc: 'waves', level: 'school', tags: ['lens equation', 'magnification', 'focal length', 'image distance', 'converging', 'diverging'],
    summary: 'Image distance, magnification and image nature for a thin lens (real-is-positive convention).',
    inputs: [I('f', 'Focal length (− for diverging)', 'f', 'length', 0.1, { u: { si: 'cm' } }), I('u', 'Object distance', 'u', 'length', 0.3, { u: { si: 'cm' } }), I('ho', 'Object height', 'h_o', 'length', 0.02, { u: { si: 'cm' }, adv: true })],
    outputs: [O('v', 'Image distance', 'v', 'length', { primary: true, u: { si: 'cm' } }), O('m', 'Magnification', 'm', 'none'), O('hi', 'Image height', 'h_i', 'length', { u: { si: 'cm' } }), O('nat', 'Image', '', 'none', { type: 'text' }), O('P', 'Lens power', 'P', 'none', { note: 'dioptres' })],
    compute({ f, u, ho }) {
      const v = 1 / (1 / f - 1 / u), m = -v / u;
      return { v, m, hi: m * ho, P: 1 / f, nat: `${v > 0 ? 'Real' : 'Virtual'}, ${m < 0 ? 'inverted' : 'upright'}, ${Math.abs(m) > 1 ? 'magnified' : 'diminished'}` };
    },
    eq: ['\\frac{1}{f} = \\frac{1}{u} + \\frac{1}{v}', 'm = -\\frac{v}{u}', 'P = \\frac1f'], assume: ['Thin lens, paraxial rays. Real-is-positive sign convention.'], limits: [], refs: ['Hecht, Optics, ch. 5.'],
  },
  {
    id: 'doppler-sound', title: 'Doppler Effect (sound)', disc: 'waves', level: 'school', tags: ['doppler', 'frequency shift', 'sound', 'siren'],
    summary: 'Observed frequency when source and/or observer move along the line joining them.',
    inputs: [I('f', 'Source frequency', 'f_s', 'frequency', 500), I('c', 'Speed of sound', 'c', 'velocity', 343), I('vs', 'Source speed (+ towards observer)', 'v_s', 'velocity', 30), I('vo', 'Observer speed (+ towards source)', 'v_o', 'velocity', 0)],
    outputs: [O('fo', 'Observed frequency', "f'", 'frequency', { primary: true }), O('df', 'Shift', '\\Delta f', 'frequency'), O('lam', 'Wavelength ahead of source', "\\lambda'", 'length')],
    compute({ f, c, vs, vo }) { const fo = f * (c + vo) / (c - vs); return { fo, df: fo - f, lam: (c - vs) / f, _warn: vs >= c ? ['Source at/above the speed of sound — shock wave (sonic boom), formula invalid.'] : [] }; },
    eq: ["f' = f_s\\frac{c + v_o}{c - v_s}"], assume: ['Still medium; motion along the line of sight.'], limits: [], refs: ['Young & Freedman §16.8.'],
  },
  {
    id: 'double-slit', title: 'Double Slit & Diffraction Grating', disc: 'waves', level: 'school', tags: ['interference', 'fringe spacing', 'young double slit', 'diffraction grating', 'wavelength'],
    summary: 'Fringe spacing for Young\'s double slit and diffraction angles for a grating.',
    inputs: [I('lam', 'Wavelength', '\\lambda', 'length', 632.8e-9, { u: { si: 'nm' } }), I('d', 'Slit separation', 'd', 'length', 0.25e-3, { u: { si: 'mm' } }), I('D', 'Screen distance', 'D', 'length', 1.5), I('N', 'Grating lines per mm (optional)', 'N', 'none', 600, { adv: true })],
    outputs: [O('w', 'Fringe spacing', 'w', 'length', { primary: true, u: { si: 'mm' } }), O('th1', 'First-order angle (double slit)', '\\theta_1', 'angle'), O('g1', 'Grating 1st-order angle', '\\theta_{g1}', 'angle'), O('nmax', 'Grating max order', 'n_{max}', 'none')],
    compute({ lam, d, D, N }) { const dg = 1e-3 / N; return { w: lam * D / d, th1: Math.asin(lam / d), g1: lam / dg <= 1 ? Math.asin(lam / dg) : NaN, nmax: Math.floor(dg / lam) }; },
    eq: ['w = \\frac{\\lambda D}{d}', 'd\\sin\\theta = n\\lambda'], assume: ['Small-angle approximation for w (D ≫ d); monochromatic, coherent light.'], limits: [], refs: ['Hecht §9.3, §10.2.'], related: { sim: 'double-slit' },
  },
  {
    id: 'decay', title: 'Radioactive Decay & Half-Life', disc: 'nuclear', level: 'school', tags: ['half-life', 'decay constant', 'activity', 'radioactivity', 'exponential decay', 'carbon dating'],
    summary: 'Remaining nuclei, activity and fraction remaining after time t.',
    inputs: [I('T', 'Half-life', 't_{1/2}', 'time', 5730 * 31557600, { u: { si: 'yr' } }), I('N0', 'Initial number of nuclei', 'N_0', 'none', 1e20), I('t', 'Elapsed time', 't', 'time', 10000 * 31557600, { u: { si: 'yr' } })],
    outputs: [O('lam', 'Decay constant', '\\lambda', 'rate', { u: { si: '1/yr' } }), O('N', 'Nuclei remaining', 'N', 'none'), O('frac', 'Fraction remaining', 'N/N_0', 'none', { u: { si: '%' } }), O('A0', 'Initial activity', 'A_0', 'activity'), O('A', 'Activity at t', 'A', 'activity', { primary: true }), O('tau', 'Mean lifetime', '\\tau', 'time', { u: { si: 'yr' } })],
    compute({ T, N0, t }) { const lam = Math.LN2 / T, N = N0 * Math.exp(-lam * t); return { lam, N, frac: N / N0, A0: lam * N0, A: lam * N, tau: 1 / lam }; },
    eq: ['N = N_0 e^{-\\lambda t}', '\\lambda = \\frac{\\ln 2}{t_{1/2}}', 'A = \\lambda N'], assume: ['Single-step decay; large N (statistical).'], limits: [], refs: ['Krane, Introductory Nuclear Physics, ch. 6.'],
  },
  {
    id: 'binding', title: 'Mass Defect & Binding Energy', disc: 'nuclear', level: 'uni', tags: ['binding energy', 'mass defect', 'nuclear stability', 'e=mc2', 'nucleon'],
    summary: 'Mass defect, total binding energy and binding energy per nucleon from an atomic mass.',
    inputs: [I('Z', 'Proton number', 'Z', 'none', 26), I('A', 'Mass number', 'A', 'none', 56), I('M', 'Atomic mass', 'M', 'mass', 55.934936 * 1.66053906660e-27, { u: { si: 'u', metric: 'u', imperial: 'u' } })],
    outputs: [O('dm', 'Mass defect', '\\Delta m', 'mass', { u: { si: 'u', metric: 'u', imperial: 'u' } }), O('B', 'Binding energy', 'B', 'energy', { u: { si: 'MeV', metric: 'MeV', imperial: 'MeV' } }), O('BA', 'Binding energy per nucleon', 'B/A', 'energy', { primary: true, u: { si: 'MeV', metric: 'MeV', imperial: 'MeV' } })],
    compute({ Z, A, M }) { const u = 1.66053906660e-27, mH = 1.00782503223 * u, mn = 1.00866491595 * u; const dm = Z * mH + (A - Z) * mn - M, B = dm * 299792458 ** 2; return { dm, B, BA: B / A }; },
    eq: ['\\Delta m = Z m_H + (A - Z)m_n - M_{atom}', 'B = \\Delta m\\, c^2'], assume: ['Atomic masses (electron masses cancel using m_H).'], limits: [], refs: ['AME2020 atomic mass evaluation.'],
  },
  {
    id: 'solar-pv', title: 'Solar PV Array Yield', disc: 'energy', level: 'uni', tags: ['solar', 'photovoltaic', 'pv', 'peak sun hours', 'performance ratio', 'kwp'],
    summary: 'Daily and annual energy from a PV array using peak sun hours and a performance ratio, with temperature derating.',
    inputs: [I('P', 'Array rating (STC)', 'P_{STC}', 'power', 5e3, { u: { si: 'kW' } }), I('psh', 'Peak sun hours (kWh/m²/day)', 'PSH', 'none', 4.2), I('PR', 'Performance ratio', 'PR', 'none', 0.8, { hint: 'typical 0.75–0.85 (inverter, wiring, soiling, mismatch)' }),
      I('gT', 'Power temperature coefficient', '\\gamma', 'none', -0.0035, { adv: true, hint: 'per °C, typically −0.3…−0.45 %/°C' }), I('Tc', 'Mean cell temperature', 'T_c', 'temperature', 318.15, { u: { si: '°C' }, adv: true })],
    outputs: [O('Ed', 'Daily energy', 'E_d', 'energy', { u: { si: 'kWh', metric: 'kWh', imperial: 'kWh' } }), O('Ey', 'Annual energy', 'E_y', 'energy', { primary: true, u: { si: 'MWh', metric: 'MWh', imperial: 'MWh' } }), O('sy', 'Specific yield (kWh/kWp/yr)', 'Y', 'none'), O('ft', 'Temperature factor', 'f_T', 'none'), O('CF', 'Capacity factor', 'CF', 'none', { u: { si: '%' } })],
    compute({ P, psh, PR, gT, Tc }) { const ft = 1 + gT * (Tc - 298.15), Ed = P * psh * PR * ft * 3600; return { Ed, Ey: Ed * 365, sy: psh * PR * ft * 365, ft, CF: psh * PR * ft / 24 }; },
    eq: ['E_d = P_{STC}\\cdot PSH\\cdot PR\\cdot f_T', 'f_T = 1 + \\gamma(T_c - 25^\\circ\\text{C})'], assume: ['PSH already accounts for tilt/orientation.'], limits: ['Use hourly simulation (e.g. PVGIS, SAM) for design.'], refs: ['IEC 61724-1 (performance ratio).', 'PVGIS (EU JRC) for irradiation data.'],
  },
  {
    id: 'wind', title: 'Wind Turbine Power', disc: 'energy', level: 'uni', tags: ['wind power', 'betz limit', 'power coefficient', 'tip speed ratio', 'renewable'],
    summary: 'Power in the wind, extracted power, Betz limit and tip-speed ratio.',
    inputs: [I('rho', 'Air density', '\\rho', 'density', 1.225), I('D', 'Rotor diameter', 'D', 'length', 120), I('v', 'Wind speed', 'v', 'velocity', 10), I('Cp', 'Power coefficient', 'C_p', 'none', 0.45), I('eta', 'Drivetrain/generator efficiency', '\\eta', 'none', 0.94, { adv: true }), I('n', 'Rotor speed', '\\omega', 'angvel', 12 * 2 * PI / 60, { adv: true })],
    outputs: [O('Pw', 'Power in the wind', 'P_w', 'power', { u: { si: 'MW' } }), O('P', 'Electrical power', 'P_e', 'power', { primary: true, u: { si: 'MW' } }), O('Pb', 'Betz-limit power', 'P_{Betz}', 'power', { u: { si: 'MW' } }), O('tsr', 'Tip-speed ratio', '\\lambda', 'none'), O('vt', 'Tip speed', 'v_{tip}', 'velocity')],
    compute({ rho, D, v, Cp, eta, n }) { const A = PI * D * D / 4, Pw = 0.5 * rho * A * v ** 3; return { Pw, P: Pw * Cp * eta, Pb: Pw * 16 / 27, tsr: n * D / 2 / v, vt: n * D / 2, _warn: Cp > 16 / 27 ? ['C_p above the Betz limit (0.593) is physically impossible.'] : [] }; },
    eq: ['P_w = \\tfrac12\\rho A v^3', 'P_e = C_p\\,\\eta\\,P_w', 'C_{p,max} = \\frac{16}{27}', '\\lambda = \\frac{\\omega R}{v}'], assume: ['Uniform steady wind over the rotor.'], limits: ['Rated power caps output above rated wind speed.'], refs: ['Burton et al., Wind Energy Handbook.'],
  },
  {
    id: 'hydro', title: 'Hydropower', disc: 'energy', level: 'school', tags: ['hydroelectric', 'head', 'turbine', 'dam', 'micro hydro'],
    summary: 'Electrical power from water flow through a head.',
    inputs: [I('Q', 'Flow rate', 'Q', 'flow', 2), I('H', 'Net head', 'H', 'length', 50), I('eta', 'Overall efficiency', '\\eta', 'none', 0.85), I('rho', 'Water density', '\\rho', 'density', 998.2, { adv: true })],
    outputs: [O('P', 'Electrical power', 'P', 'power', { primary: true, u: { si: 'kW' } }), O('E', 'Annual energy at this output', 'E', 'energy', { u: { si: 'MWh', metric: 'MWh', imperial: 'MWh' } })],
    compute({ Q, H, eta, rho }) { const P = rho * g0 * Q * H * eta; return { P, E: P * 8766 * 3600 }; },
    eq: ['P = \\eta\\rho g Q H'], assume: ['Steady flow at net head (after penstock losses).'], limits: [], refs: [],
  },
];
