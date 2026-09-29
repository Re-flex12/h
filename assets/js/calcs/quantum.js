import { I, O, SEL, PI, deg, rad } from './_h.js';
import { C } from '../data/constants.js';

const eV = C.e, hbar = C.hbar, h = C.h, c = C.c;
const PARTICLES = [['e', 'Electron'], ['p', 'Proton'], ['n', 'Neutron'], ['a', 'Alpha particle'], ['mu', 'Muon'], ['custom', 'Custom mass']];
const pmass = (id, m) => ({ e: C.me, p: C.mp, n: C.mn, a: 6.6446573357e-27, mu: 1.883531627e-28 }[id] ?? m);
const PART = (x = {}) => [SEL('part', 'Particle', PARTICLES, 'e', x), I('m', 'Mass', 'm', 'mass', C.me, { showIf: v => v.part === 'custom', u: { si: 'kg' } })];
const SERIES = { 1: 'Lyman (UV)', 2: 'Balmer (visible)', 3: 'Paschen (IR)', 4: 'Brackett (IR)', 5: 'Pfund (IR)', 6: 'Humphreys (IR)' };

export function hermite(n, x) { let h0 = 1, h1 = 2 * x; if (n === 0) return h0; for (let k = 1; k < n; k++) { const h2 = 2 * x * h1 - 2 * k * h0; h0 = h1; h1 = h2; } return h1; }

export function tunnelT(E, V0, a, m) {
  if (Math.abs(E - V0) < 1e-12 * V0) return 1 / (1 + m * a * a * V0 / (2 * hbar * hbar));
  if (E < V0) { const k = Math.sqrt(2 * m * (V0 - E)) / hbar; return 1 / (1 + V0 * V0 * Math.sinh(k * a) ** 2 / (4 * E * (V0 - E))); }
  const k = Math.sqrt(2 * m * (E - V0)) / hbar; return 1 / (1 + V0 * V0 * Math.sin(k * a) ** 2 / (4 * E * (E - V0)));
}

export default [
  {
    id: 'photon', title: 'Photon Energy, Frequency & Momentum', disc: 'quantum', sub: 'Quantum foundations', level: 'school', tags: ['photon', 'e=hf', 'planck', 'wavelength', 'electronvolt', 'photon momentum'],
    summary: 'Convert between photon wavelength, frequency, energy and momentum; photon rate for a given beam power.',
    inputs: [SEL('mode', 'Known', [['lam', 'Wavelength'], ['f', 'Frequency'], ['E', 'Energy']], 'lam'), I('lam', 'Wavelength', '\\lambda', 'length', 532e-9, { u: { si: 'nm' }, showIf: v => v.mode === 'lam' }), I('f', 'Frequency', 'f', 'frequency', 5e14, { u: { si: 'THz' }, showIf: v => v.mode === 'f' }), I('E', 'Energy', 'E', 'energy', 2 * eV, { u: { si: 'eV' }, showIf: v => v.mode === 'E' }), I('P', 'Beam power', 'P', 'power', 1e-3, { u: { si: 'mW' }, adv: true })],
    outputs: [O('E', 'Photon energy', 'E', 'energy', { primary: true, u: { si: 'eV' } }), O('EJ', 'Photon energy', 'E', 'energy', { u: { si: 'J' } }), O('lam', 'Wavelength', '\\lambda', 'length', { u: { si: 'nm' } }), O('f', 'Frequency', 'f', 'frequency', { u: { si: 'THz' } }), O('p', 'Momentum', 'p', 'momentum', { u: { si: 'eV/c' } }), O('band', 'Band', '', 'none', { type: 'text' }), O('N', 'Photons per second at P', '\\dot N', 'rate')],
    compute(x) {
      const E = x.mode === 'lam' ? h * c / x.lam : x.mode === 'f' ? h * x.f : x.E;
      const lam = h * c / E;
      const band = lam < 1e-11 ? 'Gamma ray' : lam < 1e-8 ? 'X-ray' : lam < 380e-9 ? 'Ultraviolet' : lam < 750e-9 ? 'Visible' : lam < 1e-3 ? 'Infrared' : lam < 1 ? 'Microwave' : 'Radio';
      return { E, EJ: E, lam, f: E / h, p: E / c, band, N: x.P / E };
    },
    eq: ['E = hf = \\frac{hc}{\\lambda}', 'p = \\frac{h}{\\lambda} = \\frac{E}{c}', '\\dot N = P/E'], assume: ['Photons in vacuum.'], limits: [], refs: ['CODATA 2018 h, c (exact).'], related: { learn: 'photoelectric' },
  },
  {
    id: 'photoelectric', title: 'Photoelectric Effect', disc: 'quantum', sub: 'Quantum foundations', level: 'school', tags: ['work function', 'threshold frequency', 'stopping potential', 'einstein', 'photoelectrons'],
    summary: 'Maximum photoelectron kinetic energy, stopping potential and threshold frequency for a metal surface.',
    inputs: [SEL('metal', 'Metal', [['2.14', 'Caesium (≈2.14 eV)'], ['2.30', 'Potassium (≈2.30 eV)'], ['2.36', 'Sodium (≈2.36 eV)'], ['2.87', 'Calcium (≈2.87 eV)'], ['3.66', 'Magnesium (≈3.66 eV)'], ['4.26', 'Silver (≈4.26 eV)'], ['4.28', 'Aluminium (≈4.28 eV)'], ['4.33', 'Zinc (≈4.33 eV)'], ['4.65', 'Copper (≈4.65 eV)'], ['5.1', 'Gold (≈5.1 eV)'], ['5.65', 'Platinum (≈5.65 eV)'], ['custom', 'Custom']], '2.36'),
      I('phi', 'Work function', '\\phi', 'energy', 2.36 * eV, { u: { si: 'eV' }, showIf: v => v.metal === 'custom' }), I('lam', 'Light wavelength', '\\lambda', 'length', 400e-9, { u: { si: 'nm' } })],
    outputs: [O('Kmax', 'Max kinetic energy', 'K_{max}', 'energy', { primary: true, u: { si: 'eV' } }), O('Vs', 'Stopping potential', 'V_s', 'voltage'), O('vmax', 'Max electron speed', 'v_{max}', 'velocity', { u: { si: 'km/s' } }), O('f0', 'Threshold frequency', 'f_0', 'frequency', { u: { si: 'THz' } }), O('lam0', 'Threshold wavelength', '\\lambda_0', 'length', { u: { si: 'nm' } }), O('Eph', 'Photon energy', 'hf', 'energy', { u: { si: 'eV' } })],
    compute(x) {
      const phi = x.metal === 'custom' ? x.phi : parseFloat(x.metal) * eV, E = h * c / x.lam, K = E - phi;
      return { Eph: E, Kmax: Math.max(K, 0), Vs: Math.max(K, 0) / eV, vmax: Math.sqrt(2 * Math.max(K, 0) / C.me), f0: phi / h, lam0: h * c / phi, _warn: K < 0 ? ['Photon energy below the work function — no photoemission, whatever the intensity.'] : [] };
    },
    eq: ['hf = \\phi + K_{max}', 'eV_s = K_{max}', 'f_0 = \\phi/h'], assume: ['One photon ejects at most one electron; electrons from the Fermi level have K_max.'], limits: ['Work functions depend on crystal face and surface cleanliness (values ±0.2 eV).'], refs: ['Einstein, Ann. Phys. 17 (1905).', 'CRC Handbook of Chemistry and Physics — electron work functions.'], related: { learn: 'photoelectric' },
  },
  {
    id: 'debroglie', title: 'de Broglie Wavelength (relativistic)', disc: 'quantum', sub: 'Wave–particle duality', level: 'school', tags: ['matter waves', 'wave-particle duality', 'electron diffraction', 'accelerating voltage'],
    summary: 'Matter wavelength of a particle from its kinetic energy or accelerating voltage, using the relativistic momentum.',
    inputs: [...PART(), SEL('mode', 'Energy given as', [['K', 'Kinetic energy'], ['V', 'Accelerating voltage (charge e or 2e)'], ['v', 'Speed']], 'V'), I('K', 'Kinetic energy', 'K', 'energy', 100 * eV, { u: { si: 'eV' }, showIf: v => v.mode === 'K' }), I('V', 'Accelerating voltage', 'V', 'voltage', 54, { showIf: v => v.mode === 'V' }), I('v', 'Speed', 'v', 'velocity', 1e6, { u: { si: 'km/s' }, showIf: v => v.mode === 'v' })],
    outputs: [O('lam', 'de Broglie wavelength', '\\lambda', 'length', { primary: true, u: { si: 'pm' } }), O('p', 'Momentum', 'p', 'momentum', { u: { si: 'keV/c' } }), O('K', 'Kinetic energy', 'K', 'energy', { u: { si: 'eV' } }), O('vv', 'Speed', 'v', 'velocity', { u: { si: 'km/s' } }), O('lamNR', 'Non-relativistic λ (for comparison)', '\\lambda_{NR}', 'length', { u: { si: 'pm' } })],
    compute(x) {
      const m = pmass(x.part, x.m), mc2 = m * c * c, q = x.part === 'a' ? 2 * eV : eV;
      let K;
      if (x.mode === 'K') K = x.K; else if (x.mode === 'V') K = q * x.V; else { const g = 1 / Math.sqrt(1 - (x.v / c) ** 2); K = (g - 1) * mc2; }
      const p = Math.sqrt(K * K + 2 * K * mc2) / c, g = 1 + K / mc2;
      return { lam: h / p, p, K, vv: c * Math.sqrt(1 - 1 / (g * g)), lamNR: h / Math.sqrt(2 * m * K), _warn: (x.part === 'n' && x.mode === 'V') ? ['Neutrons are uncharged — accelerating voltage is not meaningful.'] : [] };
    },
    eq: ['\\lambda = \\frac{h}{p}', 'pc = \\sqrt{K^2 + 2Kmc^2}', '\\lambda_{NR} = \\frac{h}{\\sqrt{2mK}}'], assume: ['Free particle.'], limits: [], refs: ['de Broglie (1924); Davisson & Germer, Phys. Rev. 30 (1927) — 54 V electrons.'],
  },
  {
    id: 'compton', title: 'Compton Scattering', disc: 'quantum', sub: 'Quantum foundations', level: 'uni', tags: ['compton effect', 'x-ray scattering', 'wavelength shift', 'compton wavelength'],
    summary: 'Scattered photon wavelength and energy, and recoil electron energy, for Compton scattering off a free electron.',
    inputs: [I('lam', 'Incident wavelength', '\\lambda', 'length', 71.1e-12, { u: { si: 'pm' } }), I('th', 'Scattering angle', '\\theta', 'angle', rad(90))],
    outputs: [O('lam2', 'Scattered wavelength', "\\lambda'", 'length', { primary: true, u: { si: 'pm' } }), O('dl', 'Wavelength shift', '\\Delta\\lambda', 'length', { u: { si: 'pm' } }), O('E1', 'Incident photon energy', 'E', 'energy', { u: { si: 'keV' } }), O('E2', 'Scattered photon energy', "E'", 'energy', { u: { si: 'keV' } }), O('Ke', 'Electron recoil energy', 'K_e', 'energy', { u: { si: 'keV' } })],
    compute({ lam, th }) { const dl = C.lambdaC * (1 - Math.cos(th)), lam2 = lam + dl, E1 = h * c / lam, E2 = h * c / lam2; return { lam2, dl, E1, E2, Ke: E1 - E2 }; },
    eq: ["\\lambda' - \\lambda = \\frac{h}{m_ec}(1 - \\cos\\theta)"], assume: ['Scattering from a free electron at rest.'], limits: ['Bound electrons (low photon energies) show Rayleigh scattering and Doppler broadening.'], refs: ['Compton, Phys. Rev. 21 (1923).'],
  },
  {
    id: 'uncertainty', title: 'Heisenberg Uncertainty', disc: 'quantum', sub: 'Quantum mechanics', level: 'uni', tags: ['uncertainty principle', 'position momentum', 'energy time', 'heisenberg'],
    summary: 'Minimum momentum/velocity uncertainty for a given position uncertainty, and energy uncertainty for a lifetime.',
    inputs: [...PART(), I('dx', 'Position uncertainty', '\\Delta x', 'length', 1e-10, { u: { si: 'pm' } }), I('dt', 'Lifetime / time uncertainty', '\\Delta t', 'time', 1e-8, { u: { si: 'ns' }, adv: true })],
    outputs: [O('dp', 'Minimum momentum uncertainty', '\\Delta p', 'momentum', { u: { si: 'keV/c' } }), O('dv', 'Minimum velocity uncertainty', '\\Delta v', 'velocity', { primary: true, u: { si: 'km/s' } }), O('Ek', 'Kinetic energy scale Δp²/2m', 'E', 'energy', { u: { si: 'eV' } }), O('dE', 'Energy width for Δt', '\\Delta E', 'energy', { u: { si: 'eV' } }), O('df', 'Natural linewidth', '\\Delta f', 'frequency', { u: { si: 'MHz' } })],
    compute(x) { const m = pmass(x.part, x.m), dp = hbar / (2 * x.dx), dE = hbar / (2 * x.dt); return { dp, dv: dp / m, Ek: dp * dp / (2 * m), dE, df: dE / h }; },
    eq: ['\\Delta x\\,\\Delta p \\ge \\frac{\\hbar}{2}', '\\Delta E\\,\\Delta t \\gtrsim \\frac{\\hbar}{2}'], assume: ['Minimum-uncertainty (Gaussian) states achieve equality.'], limits: [], refs: ['Griffiths, Introduction to Quantum Mechanics, §3.5.'],
  },
  {
    id: 'box', title: 'Particle in a Box (infinite well)', disc: 'quantum', sub: 'Quantum systems', level: 'uni', tags: ['infinite square well', 'energy levels', 'quantum confinement', 'wavefunction', 'quantum dot'],
    summary: 'Energy levels, transition photon and wavefunction of a particle in a 1D infinite square well.',
    inputs: [...PART(), I('L', 'Box width', 'L', 'length', 1e-9, { u: { si: 'nm' } }), I('n', 'Quantum number n', 'n', 'none', 1, { min: 1 }), I('n2', 'Upper level (for transition)', "n'", 'none', 2, { min: 1 })],
    outputs: [O('E', 'Energy of level n', 'E_n', 'energy', { primary: true, u: { si: 'eV' } }), O('E1', 'Ground-state energy', 'E_1', 'energy', { u: { si: 'eV' } }), O('dE', "Transition n' → n", '\\Delta E', 'energy', { u: { si: 'eV' } }), O('lam', 'Photon wavelength', '\\lambda', 'length', { u: { si: 'nm' } })],
    compute(x) {
      const m = pmass(x.part, x.m), n = Math.max(1, Math.round(x.n)), n2 = Math.max(1, Math.round(x.n2));
      const E1 = h * h / (8 * m * x.L * x.L), dE = Math.abs(n2 * n2 - n * n) * E1;
      const xs = [], ps = [], ds = [];
      for (let i = 0; i <= 200; i++) { const X = i / 200; xs.push(X); const p = Math.sqrt(2) * Math.sin(n * PI * X); ps.push(p); ds.push(p * p); }
      return { E: n * n * E1, E1, dE, lam: dE > 0 ? h * c / dE : NaN, _plot: { series: [{ x: xs, y: ps, label: `ψ_${n}(x)·√L` }, { x: xs, y: ds, label: `|ψ_${n}|²·L`, type: 'area' }], opts: { xlabel: 'x / L', ylabel: '' } } };
    },
    eq: ['E_n = \\frac{n^2 h^2}{8 m L^2}', '\\psi_n(x) = \\sqrt{\\frac{2}{L}}\\sin\\frac{n\\pi x}{L}'], assume: ['Infinite potential walls; non-relativistic.'], limits: [], refs: ['Griffiths §2.2.'], related: { sim: 'wavefunction' },
  },
  {
    id: 'tunnel', title: 'Quantum Tunnelling (rectangular barrier)', disc: 'quantum', sub: 'Quantum systems', level: 'uni', tags: ['tunnelling', 'transmission coefficient', 'potential barrier', 'stm', 'alpha decay'],
    summary: 'Exact transmission probability through a 1D rectangular barrier, with T vs E.',
    inputs: [...PART(), I('E', 'Particle energy', 'E', 'energy', 5 * eV, { u: { si: 'eV' } }), I('V0', 'Barrier height', 'V_0', 'energy', 10 * eV, { u: { si: 'eV' } }), I('a', 'Barrier width', 'a', 'length', 0.3e-9, { u: { si: 'nm' } })],
    outputs: [O('T', 'Transmission probability', 'T', 'none', { primary: true }), O('R', 'Reflection probability', 'R', 'none'), O('kappa', 'Decay length 1/κ (if E < V₀)', '1/\\kappa', 'length', { u: { si: 'nm' } }), O('Twkb', 'Thick-barrier estimate', 'T \\approx 16\\frac{E}{V_0}\\left(1-\\frac{E}{V_0}\\right)e^{-2\\kappa a}', 'none')],
    compute(x) {
      const m = pmass(x.part, x.m), T = tunnelT(x.E, x.V0, x.a, m);
      const k = x.E < x.V0 ? Math.sqrt(2 * m * (x.V0 - x.E)) / hbar : NaN;
      const Es = [], Ts = [];
      for (let i = 1; i <= 240; i++) { const E = x.V0 * 3 * i / 240; Es.push(E / x.V0); Ts.push(tunnelT(E, x.V0, x.a, m)); }
      return { T, R: 1 - T, kappa: 1 / k, Twkb: x.E < x.V0 ? 16 * (x.E / x.V0) * (1 - x.E / x.V0) * Math.exp(-2 * k * x.a) : NaN,
        _plot: { series: [{ x: Es, y: Ts, label: 'T(E)' }], opts: { xlabel: 'E / V₀', ylabel: 'T', ymin: 0, ymax: 1.02, marks: [{ x: x.E / x.V0, label: 'E' }] } } };
    },
    eq: ['T = \\left[1 + \\frac{V_0^2\\sinh^2(\\kappa a)}{4E(V_0 - E)}\\right]^{-1},\\; \\kappa = \\frac{\\sqrt{2m(V_0-E)}}{\\hbar}', 'T = \\left[1 + \\frac{V_0^2\\sin^2(k a)}{4E(E - V_0)}\\right]^{-1}\\;(E > V_0)'], assume: ['1D time-independent scattering; same potential on both sides.'], limits: [], refs: ['Griffiths, Problem 2.33.'],
  },
  {
    id: 'hydrogen', title: 'Hydrogen Atom — Bohr Levels & Spectral Lines', disc: 'quantum', sub: 'Atomic physics', level: 'school', tags: ['bohr model', 'energy levels', 'rydberg', 'balmer series', 'lyman', 'spectral lines', 'hydrogen-like'],
    summary: 'Energy levels, orbit radius and emitted wavelength for transitions in hydrogen-like atoms.',
    inputs: [I('Z', 'Nuclear charge Z', 'Z', 'none', 1), I('nl', 'Lower level', 'n_1', 'none', 2, { min: 1 }), I('nu', 'Upper level', 'n_2', 'none', 3, { min: 2 }), SEL('red', 'Nuclear mass', [['H', 'Hydrogen (reduced mass)'], ['inf', 'Infinite (R∞)']], 'H', { adv: true })],
    outputs: [O('lam', 'Emitted wavelength (vacuum)', '\\lambda', 'length', { primary: true, u: { si: 'nm' } }), O('dE', 'Photon energy', '\\Delta E', 'energy', { u: { si: 'eV' } }), O('E1', 'Energy of lower level', 'E_{n_1}', 'energy', { u: { si: 'eV' } }), O('E2', 'Energy of upper level', 'E_{n_2}', 'energy', { u: { si: 'eV' } }), O('r', 'Bohr radius of upper orbit', 'r_{n_2}', 'length', { u: { si: 'pm' } }), O('series', 'Series', '', 'none', { type: 'text' }), O('Ei', 'Ionisation energy from ground', 'E_{ion}', 'energy', { u: { si: 'eV' } })],
    compute(x) {
      const mu = x.red === 'H' ? 1 / (1 + C.me / C.mp) : 1, Ry = 13.605693122994 * eV * mu, n1 = Math.round(x.nl), n2 = Math.round(x.nu);
      const E = n => -Ry * x.Z * x.Z / (n * n), dE = E(n2) - E(n1);
      return { E1: E(n1), E2: E(n2), dE, lam: h * c / dE, r: n2 * n2 * C.a0 / (x.Z * mu), series: SERIES[n1] || `n₁ = ${n1}`, Ei: -E(1), _warn: n2 <= n1 ? ['Upper level must be above the lower level.'] : [] };
    },
    eq: ['E_n = -\\frac{13.606\\text{ eV}\\,Z^2}{n^2}\\frac{\\mu}{m_e}', '\\frac{1}{\\lambda} = R Z^2\\left(\\frac{1}{n_1^2} - \\frac{1}{n_2^2}\\right)', 'r_n = \\frac{n^2 a_0}{Z}\\frac{m_e}{\\mu}'], assume: ['Bohr/Schrödinger energies without fine structure.'], limits: ['Fine structure, Lamb shift and hyperfine splitting shift lines at the 10⁻⁵ level.'], refs: ['CODATA 2018 Rydberg energy; NIST Atomic Spectra Database.'],
  },
  {
    id: 'qho', title: 'Quantum Harmonic Oscillator', disc: 'quantum', sub: 'Quantum systems', level: 'uni', tags: ['harmonic oscillator', 'zero-point energy', 'hermite', 'vibrational levels', 'ladder operators'],
    summary: 'Energy levels, zero-point energy and wavefunction of the 1D quantum harmonic oscillator.',
    inputs: [...PART(), I('f', 'Classical frequency', 'f', 'frequency', 1e14, { u: { si: 'THz' } }), I('n', 'Quantum number n', 'n', 'none', 2, { min: 0 })],
    outputs: [O('En', 'Energy of level n', 'E_n', 'energy', { primary: true, u: { si: 'eV' } }), O('E0', 'Zero-point energy', 'E_0', 'energy', { u: { si: 'eV' } }), O('dE', 'Level spacing', '\\hbar\\omega', 'energy', { u: { si: 'eV' } }), O('lam', 'Transition wavelength', '\\lambda', 'length', { u: { si: 'µm' } }), O('x0', 'Length scale √(ħ/mω)', 'x_0', 'length', { u: { si: 'pm' } })],
    compute(x) {
      const m = pmass(x.part, x.m), w = 2 * PI * x.f, n = Math.max(0, Math.round(x.n)), x0 = Math.sqrt(hbar / (m * w));
      let norm = 1 / Math.sqrt(Math.pow(2, n) * Math.sqrt(PI)); for (let k = 2; k <= n; k++) norm /= Math.sqrt(k);
      const xs = [], ps = [], V = [];
      const lim = Math.sqrt(2 * n + 1) + 2.5;
      for (let i = 0; i <= 240; i++) { const X = -lim + 2 * lim * i / 240; xs.push(X); const p = norm * hermite(n, X) * Math.exp(-X * X / 2); ps.push(p * p); V.push(X * X / 2 / (n + 0.5) * 0.5); }
      return { En: (n + 0.5) * hbar * w, E0: 0.5 * hbar * w, dE: hbar * w, lam: c / x.f, x0,
        _plot: { series: [{ x: xs, y: ps, label: `|ψ_${n}|² (x in units of x₀)`, type: 'area' }], opts: { xlabel: 'x / x₀', ylabel: '|ψ|²', marks: [{ x: -Math.sqrt(2 * n + 1), label: 'classical turning point' }, { x: Math.sqrt(2 * n + 1), label: '' }] } } };
    },
    eq: ['E_n = \\left(n + \\tfrac12\\right)\\hbar\\omega', '\\psi_n(\\xi) = \\frac{1}{\\sqrt{2^n n!}}\\left(\\frac{m\\omega}{\\pi\\hbar}\\right)^{1/4} H_n(\\xi)e^{-\\xi^2/2}'], assume: ['Ideal quadratic potential V = ½mω²x².'], limits: ['Real molecular bonds are anharmonic.'], refs: ['Griffiths §2.3.'], related: { sim: 'wavefunction' },
  },
  {
    id: 'blackbody', title: 'Blackbody Radiation (Planck, Wien, Stefan)', disc: 'quantum', sub: 'Quantum foundations', level: 'school', tags: ['planck law', 'wien displacement', 'stefan-boltzmann', 'thermal radiation', 'star temperature'],
    summary: 'Peak wavelength, radiant exitance and the full Planck spectrum of a blackbody at temperature T.',
    inputs: [I('T', 'Temperature', 'T', 'temperature', 5772, { u: { si: 'K', metric: 'K', imperial: 'K' } }), I('A', 'Surface area', 'A', 'area', 1, { adv: true })],
    outputs: [O('lmax', 'Peak wavelength (Wien)', '\\lambda_{max}', 'length', { primary: true, u: { si: 'nm' } }), O('fmax', 'Peak frequency', 'f_{max}', 'frequency', { u: { si: 'THz' } }), O('M', 'Radiant exitance', 'M = \\sigma T^4', 'heatflux', { u: { si: 'MW/m²' } }), O('P', 'Total power from A', 'P', 'power')],
    compute({ T, A }) {
      const lmax = C.b / T, B = l => 2 * h * c * c / l ** 5 / (Math.exp(h * c / (l * C.kB * T)) - 1);
      const ls = [], Bs = [];
      for (let i = 1; i <= 200; i++) { const l = lmax * 5 * i / 200; ls.push(l * 1e9); Bs.push(B(l) * 1e-9); }
      return { lmax, fmax: 5.878925757e10 * T, M: C.sigma * T ** 4, P: C.sigma * T ** 4 * A,
        _plot: { series: [{ x: ls, y: Bs, label: 'B_λ(T) W/(m²·sr·nm)', type: 'area' }], opts: { xlabel: 'λ (nm)', ylabel: 'B_λ', marks: [{ x: lmax * 1e9, label: 'λ_max' }, { x: 380, label: 'visible' }, { x: 750, label: '' }] } } };
    },
    eq: ['B_\\lambda(T) = \\frac{2hc^2}{\\lambda^5}\\frac{1}{e^{hc/\\lambda k_BT} - 1}', '\\lambda_{max}T = b = 2.898\\times10^{-3}\\text{ m·K}', 'M = \\sigma T^4'], assume: ['Ideal blackbody (ε = 1).'], limits: [], refs: ['Planck (1901); CODATA 2018 b, σ.'],
  },
];
