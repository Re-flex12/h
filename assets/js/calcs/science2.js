// Mathematics & statistics, plus further physics, quantum and relativity calculators.
import { I, O, SEL, PI, deg, rad, check } from './_h.js';
import { C } from '../data/constants.js';
import { polyRoots, normCdf, normPdf, normInv, tInv, binomPmf, poissonPmf } from '../core/numeric.js';

const list = s => String(s).split(/[,;\s]+/).map(Number).filter(Number.isFinite);
const fc = r => r[1] ? `${+r[0].toPrecision(6)} ${r[1] > 0 ? '+' : '−'} ${+Math.abs(r[1]).toPrecision(6)}i` : `${+r[0].toPrecision(8)}`;

export default [
  // ── Mathematics ────────────────────────────────────────
  {
    id: 'poly-roots', title: 'Polynomial Roots (quadratic, cubic, any degree)', disc: 'maths', level: 'school', tags: ['quadratic formula', 'cubic', 'roots', 'complex roots', 'discriminant', 'zeros'],
    summary: 'All real and complex roots of a polynomial, with the discriminant for quadratics and a graph.',
    inputs: [{ k: 'c', label: 'Coefficients, highest power first', type: 'text', def: '1 -3 -4 12', dim: 'none', hint: '"1 -5 6" = x² − 5x + 6' }],
    outputs: [O('roots', 'Roots', '', 'none', { type: 'text', primary: true }), O('deg', 'Degree', 'n', 'none'), O('disc', 'Discriminant (quadratic)', 'b^2 - 4ac', 'none', { optional: true })],
    compute({ c }) {
      const a = list(c); while (a.length && a[0] === 0) a.shift();
      if (a.length < 2) return { _warn: ['Enter at least two coefficients.'] };
      const r = polyRoots(a), real = r.filter(x => !x[1]).map(x => x[0]);
      const lo = Math.min(-5, ...real) - 1, hi = Math.max(5, ...real) + 1, xs = [], ys = [];
      for (let i = 0; i <= 300; i++) { const x = lo + (hi - lo) * i / 300; xs.push(x); ys.push(a.reduce((s, k) => s * x + k, 0)); }
      return { roots: r.map(fc).join(',  '), deg: a.length - 1, disc: a.length === 3 ? a[1] ** 2 - 4 * a[0] * a[2] : NaN, _plot: { series: [{ x: xs, y: ys, label: 'p(x)' }, { x: real, y: real.map(() => 0), type: 'scatter', label: 'real roots' }], opts: { xlabel: 'x', ylabel: 'p(x)', zero: true } } };
    },
    eq: ['x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', 'p(x) = a_nx^n + \\dots + a_0 = a_n\\prod(x - r_i)'], assume: ['Real coefficients. Numerical roots (Durand–Kerner) to ~1e-12.'], limits: ['Repeated roots are found to reduced precision (~1e-6).'], refs: [],
  },
  {
    id: 'vectors', title: '3D Vector Operations', disc: 'maths', level: 'school', tags: ['vector', 'dot product', 'cross product', 'magnitude', 'angle between vectors', 'projection'],
    summary: 'Magnitudes, dot and cross products, angle between vectors and projection of a onto b.',
    inputs: [{ k: 'a', label: 'Vector a (x y z)', type: 'text', def: '3 -2 5', dim: 'none' }, { k: 'b', label: 'Vector b (x y z)', type: 'text', def: '1 4 2', dim: 'none' }],
    outputs: [O('ma', '|a|', '|\\mathbf a|', 'none'), O('mb', '|b|', '|\\mathbf b|', 'none'), O('dot', 'a · b', '\\mathbf a\\cdot\\mathbf b', 'none', { primary: true }), O('cross', 'a × b', '\\mathbf a\\times\\mathbf b', 'none', { type: 'text' }), O('ang', 'Angle between', '\\theta', 'angle'), O('proj', 'Projection of a on b', '', 'none', { type: 'text' }), O('area', 'Parallelogram area |a × b|', '', 'none')],
    compute({ a, b }) {
      const A = list(a), B = list(b); while (A.length < 3) A.push(0); while (B.length < 3) B.push(0);
      const dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2], ma = Math.hypot(...A), mb = Math.hypot(...B);
      const cr = [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]], k = dot / (mb * mb);
      const f = v => `(${v.map(x => +x.toPrecision(6)).join(', ')})`;
      return { ma, mb, dot, cross: f(cr), ang: Math.acos(Math.max(-1, Math.min(1, dot / (ma * mb)))), proj: f(B.map(x => x * k)), area: Math.hypot(...cr) };
    },
    eq: ['\\mathbf a\\cdot\\mathbf b = |\\mathbf a||\\mathbf b|\\cos\\theta', '\\mathbf a\\times\\mathbf b = (a_yb_z - a_zb_y,\\; a_zb_x - a_xb_z,\\; a_xb_y - a_yb_x)'], assume: [], limits: [], refs: [],
  },
  {
    id: 'normal-dist', title: 'Normal Distribution', disc: 'maths', level: 'school', tags: ['normal distribution', 'gaussian', 'z-score', 'probability', 'cdf', 'bell curve', 'percentile'],
    summary: 'z-score, probabilities below/above/between values and percentiles of a normal distribution.',
    inputs: [I('mu', 'Mean μ', '\\mu', 'none', 100), I('s', 'Standard deviation σ', '\\sigma', 'none', 15), I('x1', 'Value x₁', 'x_1', 'none', 115), I('x2', 'Value x₂ (for between)', 'x_2', 'none', 85), I('p', 'Percentile (for inverse)', 'p', 'none', 0.95, { u: { si: '%' } })],
    outputs: [O('z', 'z-score of x₁', 'z', 'none'), O('below', 'P(X < x₁)', '', 'none', { u: { si: '%' }, primary: true }), O('above', 'P(X > x₁)', '', 'none', { u: { si: '%' } }), O('between', 'P(x₂ < X < x₁)', '', 'none', { u: { si: '%' } }), O('xp', 'Value at percentile p', 'x_p', 'none')],
    compute({ mu, s, x1, x2, p }) {
      const z = (x1 - mu) / s, lo = Math.min(x1, x2), hi = Math.max(x1, x2);
      const xs = [], ys = [], sh = [], shy = [];
      for (let i = 0; i <= 300; i++) { const x = mu - 4 * s + 8 * s * i / 300; xs.push(x); ys.push(normPdf((x - mu) / s) / s); if (x >= lo && x <= hi) { sh.push(x); shy.push(normPdf((x - mu) / s) / s); } }
      return { z, below: normCdf(z), above: 1 - normCdf(z), between: normCdf((hi - mu) / s) - normCdf((lo - mu) / s), xp: mu + s * normInv(p), _plot: { series: [{ x: xs, y: ys, label: 'pdf' }, { x: sh, y: shy, type: 'area', label: 'P(x₂ < X < x₁)', color: 'var(--c2)' }], opts: { xlabel: 'x', ylabel: 'f(x)' } } };
    },
    eq: ['z = \\frac{x - \\mu}{\\sigma}', '\\Phi(z) = \\tfrac12\\left[1 + \\operatorname{erf}(z/\\sqrt2)\\right]'], assume: [], limits: [], refs: [],
  },
  {
    id: 'binomial', title: 'Binomial & Poisson Probabilities', disc: 'maths', level: 'school', tags: ['binomial distribution', 'poisson distribution', 'discrete probability', 'defects', 'reliability'],
    summary: 'Probability of exactly / at most k events for binomial and Poisson distributions.',
    inputs: [SEL('dist', 'Distribution', [['b', 'Binomial (n trials, probability p)'], ['p', 'Poisson (mean λ)']], 'b'), I('n', 'Trials n', 'n', 'none', 20, { showIf: v => v.dist === 'b' }), I('p', 'Success probability p', 'p', 'none', 0.1, { showIf: v => v.dist === 'b' }), I('lam', 'Mean λ', '\\lambda', 'none', 3, { showIf: v => v.dist === 'p' }), I('k', 'k', 'k', 'none', 2)],
    outputs: [O('pk', 'P(X = k)', '', 'none', { u: { si: '%' }, primary: true }), O('cdf', 'P(X ≤ k)', '', 'none', { u: { si: '%' } }), O('gt', 'P(X > k)', '', 'none', { u: { si: '%' } }), O('mean', 'Mean', '', 'none'), O('sd', 'Standard deviation', '', 'none')],
    compute(x) {
      const k = Math.round(x.k), pmf = x.dist === 'b' ? j => binomPmf(j, x.n, x.p) : j => poissonPmf(j, x.lam);
      const kmax = x.dist === 'b' ? x.n : Math.ceil(x.lam + 6 * Math.sqrt(x.lam) + 5);
      const ks = [], ps = []; let cdf = 0;
      for (let j = 0; j <= kmax; j++) { const v = pmf(j); ks.push(j); ps.push(v); if (j <= k) cdf += v; }
      const mean = x.dist === 'b' ? x.n * x.p : x.lam, sd = Math.sqrt(x.dist === 'b' ? x.n * x.p * (1 - x.p) : x.lam);
      return { pk: pmf(k), cdf, gt: 1 - cdf, mean, sd, _plot: { series: [{ x: ks, y: ps, type: 'scatter', label: 'P(X = k)' }], opts: { xlabel: 'k', ylabel: 'P', marks: [{ x: k, label: 'k' }] } } };
    },
    eq: ['P(X = k) = \\binom{n}{k}p^k(1-p)^{n-k}', 'P(X = k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}'], assume: ['Independent trials/events.'], limits: [], refs: [],
  },
  {
    id: 'conf-int', title: 'Confidence Interval for a Mean', disc: 'maths', level: 'uni', tags: ['confidence interval', 't distribution', 'standard error', 'sample mean', 'statistics', 'lab data'],
    summary: 'Confidence interval for a population mean from a sample (Student t), from raw data or summary statistics.',
    inputs: [SEL('mode', 'Input', [['data', 'Raw data'], ['sum', 'Summary statistics']], 'data'), { k: 'data', label: 'Data values', type: 'text', def: '9.79 9.83 9.81 9.76 9.85 9.80 9.82 9.78', dim: 'none', showIf: v => v.mode === 'data' },
      I('xbar', 'Sample mean', '\\bar x', 'none', 9.8, { showIf: v => v.mode === 'sum' }), I('s', 'Sample SD', 's', 'none', 0.03, { showIf: v => v.mode === 'sum' }), I('n', 'Sample size', 'n', 'none', 8, { showIf: v => v.mode === 'sum' }), I('cl', 'Confidence level', 'CL', 'none', 0.95, { u: { si: '%' } })],
    outputs: [O('mean', 'Mean', '\\bar x', 'none'), O('sd', 'SD', 's', 'none'), O('se', 'Standard error', 's/\\sqrt n', 'none'), O('t', 't critical', 't^*', 'none'), O('hw', 'Half-width ±', '', 'none', { primary: true }), O('ci', 'Interval', '', 'none', { type: 'text' })],
    compute(x) {
      let m, s, n;
      if (x.mode === 'data') { const d = list(x.data); n = d.length; m = d.reduce((a, b) => a + b, 0) / n; s = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)); } else { m = x.xbar; s = x.s; n = Math.round(x.n); }
      if (n < 2) return { _warn: ['Need n ≥ 2.'] };
      const t = tInv(1 - (1 - x.cl) / 2, n - 1), se = s / Math.sqrt(n), hw = t * se;
      return { mean: m, sd: s, se, t, hw, ci: `${+(m - hw).toPrecision(6)} … ${+(m + hw).toPrecision(6)}` };
    },
    eq: ['\\bar x \\pm t^*_{n-1}\\frac{s}{\\sqrt n}'], assume: ['Independent, approximately normal observations.'], limits: [], refs: ['Montgomery & Runger, Applied Statistics and Probability for Engineers, ch. 8.'],
  },
  {
    id: 'triangle', title: 'Triangle Solver (SSS, SAS, ASA)', disc: 'maths', level: 'school', tags: ['trigonometry', 'sine rule', 'cosine rule', 'triangle', 'area'],
    summary: 'All sides, angles and area of a triangle from three known values.',
    inputs: [SEL('mode', 'Known', [['sss', 'Three sides (SSS)'], ['sas', 'Two sides + included angle (SAS)'], ['asa', 'Two angles + included side (ASA)']], 'sas'),
      I('a', 'Side a', 'a', 'length', 5, { showIf: v => v.mode !== 'asa' }), I('b', 'Side b', 'b', 'length', 7, { showIf: v => v.mode !== 'asa' }), I('c', 'Side c', 'c', 'length', 6, { showIf: v => v.mode === 'sss' || v.mode === 'asa' }),
      I('C', 'Angle C (between a and b)', 'C', 'angle', rad(40), { showIf: v => v.mode === 'sas' }), I('A', 'Angle A', 'A', 'angle', rad(50), { showIf: v => v.mode === 'asa' }), I('B', 'Angle B', 'B', 'angle', rad(60), { showIf: v => v.mode === 'asa' })],
    outputs: [O('ao', 'a', 'a', 'length'), O('bo', 'b', 'b', 'length'), O('co', 'c', 'c', 'length'), O('Ao', 'A', 'A', 'angle'), O('Bo', 'B', 'B', 'angle'), O('Co', 'C', 'C', 'angle'), O('area', 'Area', 'K', 'area', { primary: true })],
    compute(x) {
      let a, b, c, A, B, Cc;
      if (x.mode === 'sss') { [a, b, c] = [x.a, x.b, x.c]; if (a + b <= c || a + c <= b || b + c <= a) return { _warn: ['Triangle inequality violated.'] }; A = Math.acos((b * b + c * c - a * a) / (2 * b * c)); B = Math.acos((a * a + c * c - b * b) / (2 * a * c)); Cc = PI - A - B; }
      else if (x.mode === 'sas') { [a, b, Cc] = [x.a, x.b, x.C]; c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(Cc)); A = Math.acos((b * b + c * c - a * a) / (2 * b * c)); B = PI - A - Cc; }
      else { [A, B, c] = [x.A, x.B, x.c]; Cc = PI - A - B; if (Cc <= 0) return { _warn: ['Angles sum to ≥ 180°.'] }; a = c * Math.sin(A) / Math.sin(Cc); b = c * Math.sin(B) / Math.sin(Cc); }
      return { ao: a, bo: b, co: c, Ao: A, Bo: B, Co: Cc, area: 0.5 * a * b * Math.sin(Cc) };
    },
    eq: ['\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}', 'c^2 = a^2 + b^2 - 2ab\\cos C', 'K = \\tfrac12 ab\\sin C'], assume: [], limits: [], refs: [],
  },
  // ── Waves, thermal, nuclear ────────────────────────────
  {
    id: 'standing-wave', title: 'Standing Waves on a String / in a Pipe', disc: 'waves', level: 'school', tags: ['standing waves', 'harmonics', 'resonance', 'string tension', 'organ pipe', 'fundamental frequency'],
    summary: 'Wave speed and harmonic frequencies for a stretched string or an air column.',
    inputs: [SEL('sys', 'System', [['string', 'String fixed at both ends'], ['open', 'Pipe open at both ends'], ['closed', 'Pipe closed at one end']], 'string'), I('L', 'Length', 'L', 'length', 0.65), I('T', 'Tension', 'T', 'force', 70, { showIf: v => v.sys === 'string' }), I('mu', 'Linear density', '\\mu', 'massperlen', 1.1e-3, { u: { si: 'g/m' }, showIf: v => v.sys === 'string' }), I('c', 'Speed of sound', 'c', 'velocity', 343, { showIf: v => v.sys !== 'string' })],
    outputs: [O('v', 'Wave speed', 'v', 'velocity'), O('f1', 'Fundamental', 'f_1', 'frequency', { primary: true }), O('h', 'Harmonics present', '', 'none', { type: 'text' })],
    compute({ sys, L, T, mu, c }) {
      const v = sys === 'string' ? Math.sqrt(T / mu) : c, f1 = sys === 'closed' ? v / (4 * L) : v / (2 * L);
      const hs = sys === 'closed' ? [1, 3, 5, 7, 9] : [1, 2, 3, 4, 5];
      return { v, f1, h: hs.map(n => `${n}f₁ = ${(n * f1).toFixed(1)} Hz`).join(' · ') };
    },
    eq: ['v = \\sqrt{T/\\mu}', 'f_n = \\frac{nv}{2L}\\;\\text{(string, open pipe)}', 'f_n = \\frac{nv}{4L},\\; n\\text{ odd (closed pipe)}'], assume: ['Ideal flexible string; end corrections neglected for pipes.'], limits: [], refs: ['Young & Freedman §15.8.'],
  },
  {
    id: 'kinetic-theory', title: 'Kinetic Theory of Gases', disc: 'thermo', level: 'school', tags: ['rms speed', 'maxwell-boltzmann', 'molecular speed', 'mean kinetic energy', 'kinetic theory'],
    summary: 'RMS, mean and most-probable molecular speeds and mean kinetic energy, with the Maxwell–Boltzmann distribution.',
    inputs: [I('M', 'Molar mass (g/mol)', 'M', 'none', 28.013, { hint: 'N₂ 28.01, O₂ 32.00, He 4.003, H₂ 2.016' }), I('T', 'Temperature', 'T', 'temperature', 300, { u: { si: 'K' } })],
    outputs: [O('vrms', 'RMS speed', 'v_{rms}', 'velocity', { primary: true }), O('vmean', 'Mean speed', '\\bar v', 'velocity'), O('vp', 'Most probable speed', 'v_p', 'velocity'), O('Ek', 'Mean KE per molecule', '\\tfrac32 k_BT', 'energy', { u: { si: 'eV' } })],
    compute({ M, T }) {
      const m = M * 1e-3 / C.NA, kT = C.kB * T, vp = Math.sqrt(2 * kT / m);
      const vs = [], fs = []; for (let i = 0; i <= 200; i++) { const v = 4 * vp * i / 200; vs.push(v); fs.push(4 * PI * v * v * Math.pow(m / (2 * PI * kT), 1.5) * Math.exp(-m * v * v / (2 * kT))); }
      return { vrms: Math.sqrt(3 * kT / m), vmean: Math.sqrt(8 * kT / (PI * m)), vp, Ek: 1.5 * kT, _plot: { series: [{ x: vs, y: fs, type: 'area', label: 'f(v) Maxwell–Boltzmann' }], opts: { xlabel: 'v (m/s)', ylabel: 'f(v)' } } };
    },
    eq: ['v_{rms} = \\sqrt{\\frac{3k_BT}{m}}', '\\bar v = \\sqrt{\\frac{8k_BT}{\\pi m}}', 'v_p = \\sqrt{\\frac{2k_BT}{m}}'], assume: ['Ideal gas in equilibrium.'], limits: [], refs: ['Young & Freedman §18.3–18.5.'],
  },
  {
    id: 'nuclear-energy', title: 'Fission & Fusion Energy', disc: 'nuclear', level: 'school', tags: ['fission', 'fusion', 'q value', 'energy per kg', 'nuclear reactor', 'd-t fusion'],
    summary: 'Energy per reaction and per kilogram of fuel for common fission and fusion reactions.',
    inputs: [SEL('rx', 'Reaction', [['u235', 'U-235 fission (≈ 200 MeV, typical)'], ['dt', 'D + T → ⁴He + n (17.59 MeV)'], ['dd', 'D + D (average of both branches, ≈ 3.65 MeV)'], ['dhe3', 'D + ³He → ⁴He + p (18.35 MeV)'], ['pp', 'Solar pp chain, 4p → ⁴He (26.73 MeV)']], 'dt'), I('m', 'Fuel mass', 'm', 'mass', 1e-3, { u: { si: 'g' } }), I('eta', 'Conversion efficiency to electricity', '\\eta', 'none', 0.35, { adv: true })],
    outputs: [O('Q', 'Energy per reaction', 'Q', 'energy', { u: { si: 'MeV', metric: 'MeV', imperial: 'MeV' } }), O('Ekg', 'Energy per kg of fuel', 'E/m', 'specenergy', { u: { si: 'MJ/kg' } }), O('E', 'Energy from fuel mass', 'E', 'energy', { u: { si: 'GJ' }, primary: true }), O('Ee', 'Electrical energy', 'E_e', 'energy', { u: { si: 'MWh', metric: 'MWh', imperial: 'MWh' } }), O('coal', 'Coal equivalent (29 MJ/kg)', '', 'mass', { u: { si: 't' } })],
    compute({ rx, m, eta }) {
      const u = C.u, [Q, mass] = { u235: [200, 235.0439 * u], dt: [17.59, (2.014102 + 3.016049) * u], dd: [3.65, 2 * 2.014102 * u], dhe3: [18.35, (2.014102 + 3.016029) * u], pp: [26.73, 4 * 1.007825 * u] }[rx];
      const QJ = Q * 1.602176634e-13, Ekg = QJ / mass;
      return { Q: QJ, Ekg, E: Ekg * m, Ee: Ekg * m * eta, coal: Ekg * m / 29e6 };
    },
    eq: ['Q = (m_{initial} - m_{final})c^2', 'E/m = Q/m_{reactants}'], assume: ['Complete burn-up of the fuel mass.'], limits: ['Real reactors burn a few % of fissile fuel per cycle; fusion fuel mass excludes breeding blanket.'], refs: ['AME2020 masses; NNDC reaction Q-values.'],
  },
  // ── Quantum & relativity extras ────────────────────────
  {
    id: 'fermi', title: 'Free-Electron Fermi Gas', disc: 'quantum', sub: 'Quantum systems', level: 'uni', tags: ['fermi energy', 'fermi temperature', 'free electron model', 'metals', 'fermi velocity', 'degenerate'],
    summary: 'Fermi energy, temperature, velocity and wavelength from the conduction-electron density of a metal.',
    inputs: [SEL('metal', 'Metal', [['8.47e28', 'Copper (8.47×10²⁸ m⁻³)'], ['5.86e28', 'Silver'], ['5.90e28', 'Gold'], ['18.1e28', 'Aluminium'], ['2.65e28', 'Sodium'], ['custom', 'Custom']], '8.47e28'), I('n', 'Electron density', 'n', 'moldensity', 8.47e28, { showIf: v => v.metal === 'custom' })],
    outputs: [O('EF', 'Fermi energy', 'E_F', 'energy', { u: { si: 'eV' }, primary: true }), O('TF', 'Fermi temperature', 'T_F', 'temperature', { u: { si: 'K', metric: 'K', imperial: 'K' } }), O('vF', 'Fermi velocity', 'v_F', 'velocity', { u: { si: 'km/s' } }), O('lF', 'Fermi wavelength', '\\lambda_F', 'length', { u: { si: 'nm' } })],
    compute(x) { const n = x.metal === 'custom' ? x.n : +x.metal, kF = Math.cbrt(3 * PI * PI * n), EF = C.hbar ** 2 * kF * kF / (2 * C.me); return { EF, TF: EF / C.kB, vF: C.hbar * kF / C.me, lF: 2 * PI / kF }; },
    eq: ['k_F = (3\\pi^2 n)^{1/3}', 'E_F = \\frac{\\hbar^2k_F^2}{2m_e}', 'T_F = E_F/k_B'], assume: ['Free-electron (Sommerfeld) model, T ≪ T_F.'], limits: [], refs: ['Ashcroft & Mermin, Solid State Physics, Table 2.1.'],
  },
  {
    id: 'zeeman', title: 'Zeeman Splitting, ESR & NMR Frequencies', disc: 'quantum', sub: 'Atomic physics', level: 'uni', tags: ['zeeman effect', 'spin', 'larmor frequency', 'esr', 'epr', 'nmr', 'mri', 'magnetic resonance'],
    summary: 'Spin energy splitting and resonance (Larmor) frequency of electrons and nuclei in a magnetic field.',
    inputs: [I('B', 'Magnetic field', 'B', 'bfield', 1.5), SEL('sp', 'Spin', [['e', 'Free electron (g = 2.00232)'], ['p', 'Proton ¹H (γ/2π = 42.577 MHz/T)'], ['c13', '¹³C (10.708 MHz/T)'], ['f19', '¹⁹F (40.078 MHz/T)']], 'p')],
    outputs: [O('f', 'Resonance frequency', 'f', 'frequency', { u: { si: 'MHz' }, primary: true }), O('dE', 'Energy splitting', '\\Delta E', 'energy', { u: { si: 'eV' } }), O('lam', 'Wavelength', '\\lambda', 'length'), O('pop', 'Population excess at 300 K', '\\Delta N/N', 'none')],
    compute({ B, sp }) {
      const f = sp === 'e' ? 2.00231930436 * 9.2740100783e-24 * B / C.h : { p: 42.57747892e6, c13: 10.7084e6, f19: 40.078e6 }[sp] * B;
      const dE = C.h * f;
      return { f, dE, lam: C.c / f, pop: Math.tanh(dE / (2 * C.kB * 300)) };
    },
    eq: ['\\Delta E = g\\mu_B B\\;\\text{(electron)},\\quad f = \\frac{\\gamma}{2\\pi}B\\;\\text{(nuclei)}', '\\frac{\\Delta N}{N} = \\tanh\\frac{\\Delta E}{2k_BT}'], assume: ['Spin-½, isolated spins.'], limits: ['Chemical shifts and hyperfine structure not included.'], refs: ['CODATA 2018 g_e, μ_B, γ_p.'],
  },
  {
    id: 'bec', title: 'Bose–Einstein Condensation Temperature', disc: 'quantum', sub: 'Quantum systems', level: 'pro', tags: ['bose-einstein condensate', 'critical temperature', 'thermal de broglie wavelength', 'bosons', 'cold atoms'],
    summary: 'Critical temperature and thermal de Broglie wavelength of an ideal uniform Bose gas.',
    inputs: [I('A', 'Atomic mass (u)', 'A', 'none', 87, { hint: '⁸⁷Rb = 86.909, ²³Na = 22.99, ⁴He = 4.003' }), I('n', 'Number density', 'n', 'moldensity', 1e20, { u: { si: '1/cm³' } }), I('T', 'Temperature', 'T', 'temperature', 100e-9, { u: { si: 'K', metric: 'K', imperial: 'K' } })],
    outputs: [O('Tc', 'Critical temperature', 'T_c', 'temperature', { u: { si: 'K', metric: 'K', imperial: 'K' }, primary: true }), O('lam', 'Thermal de Broglie wavelength at T', '\\lambda_{dB}', 'length', { u: { si: 'µm' } }), O('psd', 'Phase-space density nλ³', 'n\\lambda^3', 'none'), O('frac', 'Condensate fraction at T', 'N_0/N', 'none', { u: { si: '%' } })],
    compute({ A, n, T }) { const m = A * C.u, Tc = 2 * PI * C.hbar ** 2 / (m * C.kB) * Math.pow(n / 2.612, 2 / 3), lam = C.h / Math.sqrt(2 * PI * m * C.kB * T); return { Tc, lam, psd: n * lam ** 3, frac: T < Tc ? 1 - Math.pow(T / Tc, 1.5) : 0 }; },
    eq: ['T_c = \\frac{2\\pi\\hbar^2}{mk_B}\\left(\\frac{n}{\\zeta(3/2)}\\right)^{2/3}', 'n\\lambda_{dB}^3 = 2.612 \\text{ at } T_c'], assume: ['Ideal, uniform (box) Bose gas. Harmonic traps use a different formula.'], limits: [], refs: ['Pethick & Smith, Bose–Einstein Condensation in Dilute Gases, ch. 2.'],
  },
  {
    id: 'threshold', title: 'Relativistic Threshold Energy (fixed target)', disc: 'relativity', sub: 'Special relativity', level: 'pro', tags: ['threshold energy', 'particle production', 'invariant mass', 'fixed target', 'collider', 'centre of mass energy'],
    summary: 'Minimum beam kinetic energy to create final-state particles on a fixed target, and the collider comparison.',
    inputs: [I('mb', 'Beam particle mass (MeV/c²)', 'm_b', 'none', 938.272), I('mt', 'Target mass (MeV/c²)', 'm_t', 'none', 938.272), I('mf', 'Total final-state mass (MeV/c²)', '\\Sigma m_f', 'none', 4 * 938.272, { hint: 'p + p → p + p + p + p̄: 4 m_p' })],
    outputs: [O('K', 'Threshold beam kinetic energy', 'K_{th}', 'none', { note: 'MeV', primary: true }), O('E', 'Threshold beam total energy', 'E_{th}', 'none', { note: 'MeV' }), O('Kcm', 'Symmetric collider: KE per beam', '', 'none', { note: 'MeV' })],
    compute({ mb, mt, mf }) { const E = (mf * mf - mb * mb - mt * mt) / (2 * mt); return { E, K: E - mb, Kcm: mb === mt ? mf / 2 - mb : NaN }; },
    eq: ['s = m_b^2 + m_t^2 + 2E_bm_t \\ge \\left(\\sum m_f\\right)^2', 'E_{th} = \\frac{(\\Sigma m_f)^2 - m_b^2 - m_t^2}{2m_t}'], assume: ['Natural units c = 1; target at rest.'], limits: [], refs: ['PDG Review of Particle Physics, "Kinematics".'],
  },
];
