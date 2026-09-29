import { I, O, SEL, PI } from './_h.js';
import { C } from '../data/constants.js';

const c = C.c, G = C.G;
const PARTICLES = [['e', 'Electron'], ['p', 'Proton'], ['mu', 'Muon'], ['custom', 'Custom mass']];
const pmass = (id, m) => ({ e: C.me, p: C.mp, mu: 1.883531627e-28 }[id] ?? m);

export function cosmology(H0kms, Om, z) {
  const H0 = H0kms * 1e3 / 3.0856775814913673e22, OL = 1 - Om;
  const E = zz => Math.sqrt(Om * (1 + zz) ** 3 + OL);
  const t = zz => 2 / (3 * H0 * Math.sqrt(OL)) * Math.asinh(Math.sqrt(OL / Om) * Math.pow(1 + zz, -1.5));
  // Simpson integration of comoving distance
  const N = 2000; let s = 0;
  for (let i = 0; i <= N; i++) { const zz = z * i / N, w = (i === 0 || i === N) ? 1 : i % 2 ? 4 : 2; s += w / E(zz); }
  const Dc = c / H0 * s * z / (3 * N);
  return { H0, t0: t(0), tz: t(z), lookback: t(0) - t(z), Dc, DL: Dc * (1 + z), DA: Dc / (1 + z), rhoc: 3 * H0 * H0 / (8 * PI * G), DH: c / H0, tH: 1 / H0 };
}

export function kerr(a) {
  const Z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a)), Z2 = Math.sqrt(3 * a * a + Z1 * Z1);
  return { rplus: 1 + Math.sqrt(1 - a * a), isco: 3 + Z2 - Math.sqrt((3 - Z1) * (3 + Z1 + 2 * Z2)) };
}

export default [
  {
    id: 'lorentz', title: 'Lorentz Factor, Time Dilation & Length Contraction', disc: 'relativity', sub: 'Special relativity', level: 'school', tags: ['gamma factor', 'time dilation', 'length contraction', 'special relativity', 'rapidity', 'muon'],
    summary: 'γ, β and rapidity for a speed, with the dilated time and contracted length for given proper values.',
    inputs: [I('v', 'Speed', 'v', 'velocity', 0.8 * c, { u: { si: 'c', metric: 'c', imperial: 'c' } }), I('t0', 'Proper time interval', '\\Delta t_0', 'time', 2.197e-6, { u: { si: 'µs' } }), I('L0', 'Proper length', 'L_0', 'length', 100)],
    outputs: [O('g', 'Lorentz factor', '\\gamma', 'none', { primary: true }), O('b', 'β = v/c', '\\beta', 'none'), O('t', 'Dilated time (lab frame)', '\\Delta t', 'time', { u: { si: 'µs' } }), O('L', 'Contracted length', 'L', 'length'), O('phi', 'Rapidity', '\\varphi', 'none'), O('d', 'Distance travelled in Δt', 'd = v\\Delta t', 'length', { u: { si: 'km' } })],
    compute({ v, t0, L0 }) { const b = v / c; if (b >= 1) return { _warn: ['Massive objects cannot reach c.'], b, g: NaN }; const g = 1 / Math.sqrt(1 - b * b); return { g, b, t: g * t0, L: L0 / g, phi: Math.atanh(b), d: v * g * t0 }; },
    eq: ['\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}', '\\Delta t = \\gamma\\Delta t_0', 'L = L_0/\\gamma', '\\varphi = \\tanh^{-1}\\beta'], assume: ['Inertial frames; constant velocity.'], limits: [], refs: ['Taylor & Wheeler, Spacetime Physics; Rossi & Hall, Phys. Rev. 59 (1941) — muon lifetime.'], related: { sim: 'minkowski', learn: 'time-dilation' },
  },
  {
    id: 'velocity-add', title: 'Relativistic Velocity Addition', disc: 'relativity', sub: 'Special relativity', level: 'uni', tags: ['velocity addition', 'lorentz transformation', 'einstein velocity'],
    summary: 'Speed of an object in frame S when it moves at u′ in a frame S′ that itself moves at v.',
    inputs: [I('u', "Object speed in S′", "u'", 'velocity', 0.6 * c, { u: { si: 'c', metric: 'c', imperial: 'c' } }), I('v', 'Speed of S′ relative to S', 'v', 'velocity', 0.7 * c, { u: { si: 'c', metric: 'c', imperial: 'c' } })],
    outputs: [O('w', 'Speed in S', 'u', 'velocity', { primary: true, u: { si: 'c', metric: 'c', imperial: 'c' } }), O('wc', 'Galilean (wrong) sum', 'u_{Gal}', 'velocity', { u: { si: 'c', metric: 'c', imperial: 'c' } }), O('g', 'γ of result', '\\gamma_u', 'none')],
    compute({ u, v }) { const w = (u + v) / (1 + u * v / (c * c)); return { w, wc: u + v, g: 1 / Math.sqrt(1 - (w / c) ** 2) }; },
    eq: ["u = \\frac{u' + v}{1 + u'v/c^2}"], assume: ['Collinear motion.'], limits: [], refs: ['Einstein (1905).'],
  },
  {
    id: 'rel-energy', title: 'Relativistic Energy & Momentum', disc: 'relativity', sub: 'Special relativity', level: 'uni', tags: ['e=mc2', 'relativistic kinetic energy', 'energy-momentum relation', 'rest energy', 'particle physics'],
    summary: 'Total, rest and kinetic energy and momentum of a particle, compared with the classical result.',
    inputs: [SEL('part', 'Particle', PARTICLES, 'e'), I('m', 'Mass', 'm', 'mass', 1, { showIf: v => v.part === 'custom' }), SEL('mode', 'Given', [['v', 'Speed'], ['K', 'Kinetic energy']], 'v'),
      I('v', 'Speed', 'v', 'velocity', 0.9 * c, { u: { si: 'c', metric: 'c', imperial: 'c' }, showIf: v => v.mode === 'v' }), I('K', 'Kinetic energy', 'K', 'energy', 1e6 * C.eV, { u: { si: 'MeV' }, showIf: v => v.mode === 'K' })],
    outputs: [O('E0', 'Rest energy', 'E_0 = mc^2', 'energy', { u: { si: 'MeV' } }), O('E', 'Total energy', 'E = \\gamma mc^2', 'energy', { u: { si: 'MeV' } }), O('K', 'Kinetic energy', 'K', 'energy', { primary: true, u: { si: 'MeV' } }), O('p', 'Momentum', 'p', 'momentum', { u: { si: 'MeV/c' } }), O('g', 'Lorentz factor', '\\gamma', 'none'), O('b', 'β', '\\beta', 'none'), O('Kc', 'Classical ½mv² (for comparison)', 'K_{cl}', 'energy', { u: { si: 'MeV' } })],
    compute(x) {
      const m = pmass(x.part, x.m), E0 = m * c * c;
      const g = x.mode === 'v' ? 1 / Math.sqrt(1 - (x.v / c) ** 2) : 1 + x.K / E0;
      const b = Math.sqrt(1 - 1 / (g * g)), E = g * E0;
      return { E0, E, K: E - E0, p: g * m * b * c, g, b, Kc: 0.5 * m * (b * c) ** 2 };
    },
    eq: ['E = \\gamma mc^2,\\; K = (\\gamma - 1)mc^2', 'p = \\gamma m v', 'E^2 = (pc)^2 + (mc^2)^2'], assume: [], limits: [], refs: ['Taylor & Wheeler, Spacetime Physics, ch. 7.'],
  },
  {
    id: 'mass-energy', title: 'Mass–Energy Equivalence', disc: 'relativity', sub: 'Special relativity', level: 'school', tags: ['e=mc2', 'mass energy', 'nuclear energy', 'tnt equivalent'],
    summary: 'Energy equivalent of a mass, with everyday comparisons.',
    inputs: [I('m', 'Mass', 'm', 'mass', 1e-3, { u: { si: 'g' } })],
    outputs: [O('E', 'Energy', 'E', 'energy', { primary: true, u: { si: 'J' } }), O('kwh', 'Energy', 'E', 'energy', { u: { si: 'GWh', metric: 'GWh', imperial: 'GWh' } }), O('tnt', 'TNT equivalent', '', 'none', { type: 'text' })],
    compute({ m }) { const E = m * c * c, kt = E / 4.184e12; return { E, kwh: E, tnt: kt >= 1000 ? `${(kt / 1000).toPrecision(3)} megatonnes` : `${kt.toPrecision(3)} kilotonnes` }; },
    eq: ['E = mc^2'], assume: ['Complete conversion of rest mass.'], limits: ['Fission converts ~0.1 %, fusion ~0.4–0.7 % of rest mass.'], refs: [],
  },
  {
    id: 'rel-doppler', title: 'Relativistic Doppler Shift', disc: 'relativity', sub: 'Special relativity', level: 'uni', tags: ['redshift', 'blueshift', 'doppler', 'z'],
    summary: 'Observed wavelength/frequency for a source moving along the line of sight at relativistic speed.',
    inputs: [I('v', 'Speed', 'v', 'velocity', 0.1 * c, { u: { si: 'c', metric: 'c', imperial: 'c' } }), SEL('dir', 'Direction', [['rec', 'Receding'], ['app', 'Approaching']], 'rec'), I('l0', 'Emitted wavelength', '\\lambda_0', 'length', 656.28e-9, { u: { si: 'nm' } })],
    outputs: [O('l', 'Observed wavelength', '\\lambda', 'length', { primary: true, u: { si: 'nm' } }), O('z', 'Redshift', 'z', 'none'), O('ratio', 'Frequency ratio f/f₀', 'f/f_0', 'none')],
    compute({ v, dir, l0 }) { const b = (dir === 'rec' ? 1 : -1) * v / c, k = Math.sqrt((1 + b) / (1 - b)); return { l: l0 * k, z: k - 1, ratio: 1 / k }; },
    eq: ['\\frac{\\lambda}{\\lambda_0} = \\sqrt{\\frac{1+\\beta}{1-\\beta}}', 'z = \\frac{\\lambda - \\lambda_0}{\\lambda_0}'], assume: ['Motion along the line of sight.'], limits: ['Cosmological redshift is due to expansion, not this formula — see the Cosmology calculator.'], refs: [],
  },
  {
    id: 'interval', title: 'Spacetime Interval', disc: 'relativity', sub: 'Special relativity', level: 'uni', tags: ['minkowski', 'invariant interval', 'timelike', 'spacelike', 'lightlike', 'proper time', 'causality'],
    summary: 'Invariant interval between two events, its type (timelike/spacelike/lightlike) and proper time or proper distance.',
    inputs: [I('dt', 'Time separation', '\\Delta t', 'time', 5e-6, { u: { si: 'µs' } }), I('dx', 'Δx', '\\Delta x', 'length', 900, { u: { si: 'km' } }), I('dy', 'Δy', '\\Delta y', 'length', 0, { u: { si: 'km' }, adv: true }), I('dz', 'Δz', '\\Delta z', 'length', 0, { u: { si: 'km' }, adv: true })],
    outputs: [O('s2', 'Interval s² = c²Δt² − Δr²', 's^2', 'area', { u: { si: 'km²' } }), O('type', 'Type', '', 'none', { type: 'text', primary: true }), O('tau', 'Proper time (if timelike)', '\\Delta\\tau', 'time', { u: { si: 'µs' } }), O('sig', 'Proper distance (if spacelike)', '\\Delta\\sigma', 'length', { u: { si: 'km' } }), O('vmin', 'Speed needed to connect events', 'v = \\Delta r/\\Delta t', 'velocity', { u: { si: 'c', metric: 'c', imperial: 'c' } })],
    compute({ dt, dx, dy, dz }) {
      const r2 = dx * dx + dy * dy + dz * dz, s2 = (c * dt) ** 2 - r2;
      const type = Math.abs(s2) < 1e-9 * (c * dt) ** 2 ? 'Lightlike (null) — connected by a light signal' : s2 > 0 ? 'Timelike — causally connected' : 'Spacelike — no causal connection; time order is frame-dependent';
      return { s2, type, tau: s2 > 0 ? Math.sqrt(s2) / c : NaN, sig: s2 < 0 ? Math.sqrt(-s2) : NaN, vmin: Math.sqrt(r2) / dt };
    },
    eq: ['s^2 = c^2\\Delta t^2 - \\Delta x^2 - \\Delta y^2 - \\Delta z^2', '\\Delta\\tau = \\sqrt{s^2}/c'], assume: ['Flat (Minkowski) spacetime, signature (+,−,−,−).'], limits: [], refs: ['Taylor & Wheeler, Spacetime Physics, ch. 3.'], related: { sim: 'minkowski' },
  },
  {
    id: 'black-hole', title: 'Black Hole Properties', disc: 'relativity', sub: 'Black holes', level: 'school', tags: ['schwarzschild radius', 'event horizon', 'hawking temperature', 'isco', 'photon sphere', 'kerr', 'black hole entropy'],
    summary: 'Schwarzschild radius, photon sphere, ISCO (with spin), Hawking temperature, entropy, evaporation time and tidal stretch.',
    inputs: [I('M', 'Mass', 'M', 'mass', 10 * C.Msun, { u: { si: 'M☉', metric: 'M☉', imperial: 'M☉' } }), I('a', 'Dimensionless spin a* (0 = Schwarzschild)', 'a_*', 'none', 0, { adv: true, min: 0, max: 0.998 }), I('Lb', 'Body length (for tidal stretch)', 'L', 'length', 2, { adv: true })],
    outputs: [O('rs', 'Schwarzschild radius', 'r_s', 'length', { primary: true, u: { si: 'km' } }), O('rp', 'Event horizon (Kerr r₊)', 'r_+', 'length', { u: { si: 'km' } }), O('ph', 'Photon sphere (non-spinning)', 'r_{ph}', 'length', { u: { si: 'km' } }), O('isco', 'ISCO (prograde)', 'r_{ISCO}', 'length', { u: { si: 'km' } }),
      O('TH', 'Hawking temperature', 'T_H', 'temperature', { u: { si: 'K', metric: 'K', imperial: 'K' } }), O('S', 'Bekenstein–Hawking entropy', 'S', 'entropy'), O('SkB', 'Entropy in units of k_B', 'S/k_B', 'none'), O('tev', 'Evaporation time', 't_{ev}', 'time', { u: { si: 'yr' } }), O('kap', 'Surface gravity', '\\kappa', 'accel'), O('rho', 'Mean density inside r_s', '\\bar\\rho', 'density'), O('tidal', 'Tidal acceleration across L at horizon', '\\Delta a', 'accel', { u: { si: 'g' } })],
    compute({ M, a, Lb }) {
      const rs = 2 * G * M / (c * c), rg = rs / 2, k = kerr(Math.min(Math.max(a, 0), 0.998)), hb = C.hbar, kB = C.kB;
      const TH = hb * c ** 3 / (8 * PI * G * M * kB), S = kB * c ** 3 * 4 * PI * rs * rs / (4 * G * hb);
      return { rs, rp: k.rplus * rg, ph: 1.5 * rs, isco: k.isco * rg, TH, S, SkB: S / kB, tev: 5120 * PI * G * G * M ** 3 / (hb * c ** 4), kap: c ** 4 / (4 * G * M), rho: M / (4 / 3 * PI * rs ** 3), tidal: 2 * G * M / rs ** 3 * Lb,
        _info: ['Hawking temperature, entropy and evaporation use the non-spinning (Schwarzschild) formulas.'] };
    },
    eq: ['r_s = \\frac{2GM}{c^2}', 'r_{ph} = \\tfrac32 r_s,\\; r_{ISCO} = 3r_s\\;(a_*=0)', 'T_H = \\frac{\\hbar c^3}{8\\pi G M k_B}', 'S = \\frac{k_B c^3 A}{4 G\\hbar}', 't_{ev} = \\frac{5120\\pi G^2M^3}{\\hbar c^4}', 'r_+ = \\frac{GM}{c^2}\\left(1 + \\sqrt{1 - a_*^2}\\right)'],
    assume: ['Isolated, uncharged black hole in vacuum.', 'Evaporation time ignores CMB absorption and particle species (photons + gravitons only).'], limits: ['Any black hole above ~10²² kg currently absorbs more CMB than it radiates.'], refs: ['Schwarzschild (1916); Hawking, Commun. Math. Phys. 43 (1975); Bardeen, Press & Teukolsky, ApJ 178 (1972) — Kerr ISCO.'], related: { sim: 'bh-orbit', learn: 'black-holes' },
  },
  {
    id: 'grav-dilation', title: 'Gravitational Time Dilation & Redshift', disc: 'relativity', sub: 'General relativity', level: 'uni', tags: ['gravitational redshift', 'time dilation', 'schwarzschild metric', 'clock rate'],
    summary: 'Clock rate and redshift of light for a static observer at radius r outside a spherical mass.',
    inputs: [I('M', 'Mass', 'M', 'mass', C.Msun, { u: { si: 'M☉', metric: 'M☉', imperial: 'M☉' } }), I('r', 'Radius of observer', 'r', 'length', C.Rsun, { u: { si: 'km' } })],
    outputs: [O('f', 'Clock rate relative to infinity', 'd\\tau/dt', 'none', { primary: true }), O('z', 'Gravitational redshift', 'z', 'none'), O('lag', 'Time lost per day vs far away', '\\Delta t', 'time', { u: { si: 'µs' } }), O('rs', 'Schwarzschild radius', 'r_s', 'length', { u: { si: 'km' } })],
    compute({ M, r }) { const rs = 2 * G * M / (c * c); if (r <= rs) return { rs, _warn: ['r is inside the horizon — static observers cannot exist.'] }; const f = Math.sqrt(1 - rs / r); return { f, z: 1 / f - 1, lag: (1 - f) * 86400, rs }; },
    eq: ['\\frac{d\\tau}{dt} = \\sqrt{1 - \\frac{r_s}{r}}', '1 + z = \\left(1 - \\frac{r_s}{r}\\right)^{-1/2}'], assume: ['Schwarzschild exterior, static observer.'], limits: [], refs: ['Pound & Rebka, PRL 4 (1960).'],
  },
  {
    id: 'gps', title: 'Orbital Clock Rates (GPS relativity)', disc: 'relativity', sub: 'General relativity', level: 'uni', tags: ['gps', 'satellite clock', 'relativistic correction', 'gravitational time dilation', 'special relativity'],
    summary: 'Combined special- and general-relativistic clock drift of a satellite in circular orbit vs a clock on the ground.',
    inputs: [I('h', 'Orbit altitude', 'h', 'length', 20184e3, { u: { si: 'km', imperial: 'mi' } }), I('R', 'Planet radius', 'R', 'length', 6.371e6, { u: { si: 'km' }, adv: true }), I('GM', 'GM of planet', 'GM', 'none', C.GMearth, { adv: true, note: 'm³/s²' })],
    outputs: [O('gr', 'GR gain per day (higher clock runs fast)', '\\Delta t_{GR}', 'time', { u: { si: 'µs' } }), O('sr', 'SR loss per day (moving clock runs slow)', '\\Delta t_{SR}', 'time', { u: { si: 'µs' } }), O('net', 'Net drift per day', '\\Delta t', 'time', { primary: true, u: { si: 'µs' } }), O('range', 'Ranging error if uncorrected (per day)', 'c\\Delta t', 'length', { u: { si: 'km' } }), O('v', 'Orbital speed', 'v', 'velocity', { u: { si: 'km/s' } })],
    compute({ h, R, GM }) { const r = R + h, v = Math.sqrt(GM / r), gr = GM / (c * c) * (1 / R - 1 / r) * 86400, sr = v * v / (2 * c * c) * 86400, net = gr - sr; return { gr, sr, net, range: net * c, v, _info: ["Ground clock's rotation speed neglected (≈ 0.03 µs/day)."] }; },
    eq: ['\\frac{\\Delta f}{f}\\bigg|_{GR} \\approx \\frac{GM}{c^2}\\left(\\frac{1}{R} - \\frac{1}{r}\\right)', '\\frac{\\Delta f}{f}\\bigg|_{SR} \\approx -\\frac{v^2}{2c^2}'], assume: ['Weak field; circular orbit; first-order expansion.'], limits: [], refs: ['Ashby, "Relativity in the Global Positioning System", Living Rev. Relativ. 6 (2003).'],
  },
  {
    id: 'cosmology', title: 'Cosmology — Hubble Law, Age & Distances (flat ΛCDM)', disc: 'relativity', sub: 'Cosmology', level: 'uni', tags: ['hubble constant', 'age of universe', 'redshift', 'comoving distance', 'luminosity distance', 'lookback time', 'critical density', 'lcdm'],
    summary: 'Age of the universe, lookback time, comoving/luminosity/angular-diameter distances and critical density for a flat ΛCDM model.',
    inputs: [I('H0', 'Hubble constant (km/s/Mpc)', 'H_0', 'none', 67.4), I('Om', 'Matter density parameter', '\\Omega_m', 'none', 0.315), I('z', 'Redshift', 'z', 'none', 1)],
    outputs: [O('t0', 'Age of the universe', 't_0', 'time', { u: { si: 'Gyr', metric: 'Gyr', imperial: 'Gyr' } }), O('lookback', 'Lookback time to z', 't_L', 'time', { primary: true, u: { si: 'Gyr', metric: 'Gyr', imperial: 'Gyr' } }), O('tz', 'Age at z', 't(z)', 'time', { u: { si: 'Gyr', metric: 'Gyr', imperial: 'Gyr' } }), O('Dc', 'Comoving distance', 'D_C', 'length', { u: { si: 'Mpc', metric: 'Mpc', imperial: 'Mpc' } }), O('DL', 'Luminosity distance', 'D_L', 'length', { u: { si: 'Mpc', metric: 'Mpc', imperial: 'Mpc' } }), O('DA', 'Angular-diameter distance', 'D_A', 'length', { u: { si: 'Mpc', metric: 'Mpc', imperial: 'Mpc' } }), O('vlow', 'Low-z recession speed cz', 'cz', 'velocity', { u: { si: 'km/s' } }), O('rhoc', 'Critical density', '\\rho_c', 'density'), O('tH', 'Hubble time 1/H₀', 't_H', 'time', { u: { si: 'Gyr', metric: 'Gyr', imperial: 'Gyr' } })],
    compute({ H0, Om, z }) { const r = cosmology(H0, Om, z); return { ...r, vlow: c * z, _warn: z > 0.1 ? ['cz is only the low-redshift approximation of the recession velocity.'] : [] }; },
    eq: ['H(z) = H_0\\sqrt{\\Omega_m(1+z)^3 + \\Omega_\\Lambda}', 't(z) = \\frac{2}{3H_0\\sqrt{\\Omega_\\Lambda}}\\sinh^{-1}\\!\\left[\\sqrt{\\frac{\\Omega_\\Lambda}{\\Omega_m}}(1+z)^{-3/2}\\right]', 'D_C = \\frac{c}{H_0}\\int_0^z\\frac{dz\'}{E(z\')}', 'D_L = (1+z)D_C,\\; \\rho_c = \\frac{3H_0^2}{8\\pi G}'],
    assume: ['Spatially flat universe, Ω_Λ = 1 − Ω_m; radiation neglected (< 0.1 % effect for z < ~100).'], limits: [], refs: ['Planck 2018 results VI (H₀ = 67.4, Ω_m = 0.315).', 'Hogg, "Distance measures in cosmology", astro-ph/9905116.'],
  },
  {
    id: 'chirp', title: 'Gravitational Waves — Chirp Mass & ISCO Frequency', disc: 'relativity', sub: 'Gravitational waves', level: 'pro', tags: ['gravitational waves', 'chirp mass', 'binary black hole', 'ligo', 'merger', 'inspiral'],
    summary: 'Chirp mass, symmetric mass ratio, GW frequency at ISCO and time to coalescence of a compact binary.',
    inputs: [I('m1', 'Mass 1', 'm_1', 'mass', 36 * C.Msun, { u: { si: 'M☉', metric: 'M☉', imperial: 'M☉' } }), I('m2', 'Mass 2', 'm_2', 'mass', 29 * C.Msun, { u: { si: 'M☉', metric: 'M☉', imperial: 'M☉' } }), I('f0', 'Starting GW frequency', 'f_0', 'frequency', 35)],
    outputs: [O('Mc', 'Chirp mass', '\\mathcal{M}', 'mass', { primary: true, u: { si: 'M☉', metric: 'M☉', imperial: 'M☉' } }), O('Mt', 'Total mass', 'M', 'mass', { u: { si: 'M☉', metric: 'M☉', imperial: 'M☉' } }), O('eta', 'Symmetric mass ratio', '\\eta', 'none'), O('fisco', 'GW frequency at ISCO', 'f_{ISCO}', 'frequency'), O('tau', 'Time to coalescence from f₀', '\\tau', 'time')],
    compute({ m1, m2, f0 }) { const M = m1 + m2, Mc = Math.pow(m1 * m2, 0.6) / Math.pow(M, 0.2), tM = G * Mc / c ** 3; return { Mc, Mt: M, eta: m1 * m2 / (M * M), fisco: c ** 3 / (Math.pow(6, 1.5) * PI * G * M), tau: 5 / 256 * Math.pow(tM, -5 / 3) * Math.pow(PI * f0, -8 / 3) }; },
    eq: ['\\mathcal M = \\frac{(m_1m_2)^{3/5}}{(m_1+m_2)^{1/5}}', 'f_{ISCO} = \\frac{c^3}{6^{3/2}\\pi G M}', '\\tau = \\frac{5}{256}\\left(\\frac{G\\mathcal M}{c^3}\\right)^{-5/3}(\\pi f_0)^{-8/3}'], assume: ['Leading-order (Newtonian) quadrupole inspiral; quasi-circular orbits.'], limits: ['Post-Newtonian corrections matter near merger.'], refs: ['Abbott et al. (LIGO/Virgo), PRL 116, 061102 (2016) — GW150914.'],
  },
];
