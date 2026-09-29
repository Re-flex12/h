import { I, O, SEL, FLU, PI, g0, sq, check } from './_h.js';

export function colebrook(Re, rr) {
  if (Re < 2300) return 64 / Re;
  // Start from Swamee–Jain, then iterate Colebrook–White on x = 1/√f.
  let f = swameeJain(Re, rr);
  let x = 1 / Math.sqrt(f);
  for (let i = 0; i < 50; i++) {
    const xn = -2 * Math.log10(rr / 3.7 + 2.51 * x / Re);
    if (Math.abs(xn - x) < 1e-12) { x = xn; break; }
    x = xn;
  }
  return 1 / (x * x);
}
export function swameeJain(Re, rr) { return 0.25 / sq(Math.log10(rr / 3.7 + 5.74 / Math.pow(Re, 0.9))); }

export function isa(h) {
  const R = 287.05287, g = g0;
  let T, p;
  if (h <= 11000) { T = 288.15 - 0.0065 * h; p = 101325 * Math.pow(T / 288.15, g / (R * 0.0065)); }
  else if (h <= 20000) { T = 216.65; p = 22632.06 * Math.exp(-g * (h - 11000) / (R * T)); }
  else if (h <= 32000) { T = 216.65 + 0.001 * (h - 20000); p = 5474.889 * Math.pow(216.65 / T, g / (R * 0.001)); }
  else { T = 228.65 + 0.0028 * (h - 32000); p = 868.0187 * Math.pow(228.65 / T, g / (R * 0.0028)); }
  const rho = p / (R * T);
  return { T, p, rho, a: Math.sqrt(1.4 * R * T), mu: 1.458e-6 * Math.pow(T, 1.5) / (T + 110.4) };
}

const regime = Re => Re < 2300 ? 'Laminar' : Re < 4000 ? 'Transitional' : 'Turbulent';

export default [
  {
    id: 'reynolds', title: 'Reynolds Number', disc: 'fluids', level: 'school', tags: ['laminar', 'turbulent', 'pipe flow', 'flow regime', 'viscosity'],
    summary: 'Reynolds number and flow regime for flow in a pipe or over a body.',
    inputs: [FLU('fluid', { rho: 'rho', mu: 'mu' }), I('rho', 'Density', '\\rho', 'density', 998.2), I('mu', 'Dynamic viscosity', '\\mu', 'dynvisc', 1.002e-3, { u: { si: 'mPa·s' } }),
      I('v', 'Velocity', 'v', 'velocity', 2), I('D', 'Characteristic length (pipe ID)', 'D', 'length', 0.025, { u: { si: 'mm', imperial: 'in' } })],
    outputs: [O('Re', 'Reynolds number', 'Re', 'none', { primary: true }), O('reg', 'Flow regime (pipe)', '', 'none', { type: 'text' }), O('nu', 'Kinematic viscosity', '\\nu', 'kinvisc', { u: { si: 'cSt' } })],
    compute({ rho, mu, v, D }) { const Re = rho * v * D / mu; return { Re, reg: regime(Re), nu: mu / rho, _info: ['Regime thresholds apply to internal pipe flow. External flows use different critical Re (e.g. flat plate ≈ 5×10⁵).'] }; },
    eq: ['Re = \\frac{\\rho v D}{\\mu} = \\frac{vD}{\\nu}'],
    assume: ['Newtonian fluid.', 'Pipe flow thresholds: laminar < 2300, turbulent > 4000.'], limits: ['Transition depends on inlet disturbance and wall roughness.'],
    refs: ['White, Fluid Mechanics, §6.1.'], related: { learn: 'reynolds', eqs: ['reynolds'] },
  },
  {
    id: 'pipe-flow', title: 'Pipe Pressure Drop (Darcy–Weisbach)', disc: 'fluids', level: 'pro', tags: ['head loss', 'friction factor', 'colebrook', 'moody', 'minor losses', 'pressure drop', 'pump sizing'],
    summary: 'Velocity, Reynolds number, Colebrook friction factor, major & minor losses, pressure drop and pumping power for a pipe run.',
    inputs: [FLU('fluid', { rho: 'rho', mu: 'mu' }), I('rho', 'Density', '\\rho', 'density', 998.2), I('mu', 'Dynamic viscosity', '\\mu', 'dynvisc', 1.002e-3, { u: { si: 'mPa·s' } }),
      I('Q', 'Flow rate', 'Q', 'flow', 2e-3, { u: { si: 'L/s', metric: 'L/min', imperial: 'gpm (US)' } }), I('D', 'Pipe inner diameter', 'D', 'length', 0.05, { u: { si: 'mm', imperial: 'in' } }), I('L', 'Pipe length', 'L', 'length', 100, { u: { imperial: 'ft' } }),
      { k: 'rough', label: 'Pipe material', type: 'roughness', fill: { eps: 'eps' }, def: 'steel', dim: 'none' },
      I('eps', 'Absolute roughness', '\\varepsilon', 'length', 0.045e-3, { u: { si: 'mm', imperial: 'in' } }),
      I('K', 'Sum of minor loss coefficients', '\\Sigma K', 'none', 5, { hint: '90° elbow ≈ 0.3–0.9, gate valve open ≈ 0.2, globe valve ≈ 10, entrance ≈ 0.5, exit = 1.0' }),
      I('dz', 'Elevation rise (outlet − inlet)', '\\Delta z', 'length', 0, { adv: true }), I('eta', 'Pump efficiency', '\\eta_p', 'none', 0.7, { adv: true })],
    outputs: [O('v', 'Mean velocity', 'v', 'velocity'), O('Re', 'Reynolds number', 'Re', 'none'), O('reg', 'Regime', '', 'none', { type: 'text' }), O('f', 'Darcy friction factor (Colebrook)', 'f', 'none'), O('fsj', 'Swamee–Jain friction factor', 'f_{SJ}', 'none', { adv: true }),
      O('hf', 'Major head loss', 'h_f', 'length'), O('hm', 'Minor head loss', 'h_m', 'length'), O('dp', 'Total pressure drop', '\\Delta p', 'pressure', { primary: true, u: { si: 'kPa', metric: 'bar', imperial: 'psi' } }), O('dpL', 'Pressure gradient (major)', '\\Delta p/L', 'pressure', { note: 'per metre', u: { si: 'Pa' } }),
      O('Ph', 'Hydraulic power', 'P_h', 'power', { u: { si: 'kW' } }), O('Ps', 'Pump shaft power', 'P_s', 'power', { u: { si: 'kW' } })],
    compute(x) {
      const A = PI * x.D ** 2 / 4, v = x.Q / A, Re = x.rho * v * x.D / x.mu, rr = x.eps / x.D;
      const f = colebrook(Re, rr), fsj = swameeJain(Re, rr);
      const hv = v * v / (2 * g0), hf = f * x.L / x.D * hv, hm = x.K * hv;
      const dp = x.rho * g0 * (hf + hm + x.dz);
      const w = [];
      if (Re >= 2300 && Re < 4000) w.push('Transitional flow — friction factor is uncertain (Colebrook used).');
      if (v > 3 && x.rho > 500) w.push(`Velocity ${v.toFixed(2)} m/s is high for liquid lines (typical 1–3 m/s): noise, erosion, water-hammer risk.`);
      return { v, Re, reg: regime(Re), f, fsj, hf, hm, dp, dpL: x.rho * g0 * hf / x.L, Ph: dp * x.Q, Ps: dp * x.Q / x.eta, _warn: w };
    },
    eq: ['v = \\frac{4Q}{\\pi D^2}', '\\frac{1}{\\sqrt f} = -2\\log_{10}\\!\\left(\\frac{\\varepsilon/D}{3.7} + \\frac{2.51}{Re\\sqrt f}\\right)', 'f_{lam} = \\frac{64}{Re}', 'h_f = f\\frac{L}{D}\\frac{v^2}{2g}', 'h_m = \\Sigma K\\frac{v^2}{2g}', '\\Delta p = \\rho g (h_f + h_m + \\Delta z)', 'P_s = \\frac{\\Delta p\\, Q}{\\eta_p}'],
    assume: ['Steady, incompressible, fully developed flow of a Newtonian fluid.', 'Circular pipe running full; constant properties.', 'Colebrook–White friction factor for turbulent flow (Moody chart equivalent).'],
    limits: ['Minor loss K values are approximate (±30 %) — use manufacturer data for valves.', 'Does not model gas compressibility (keep Δp < ~10 % of p for gases).'],
    refs: ['White, Fluid Mechanics, §6.6–6.9.', 'Colebrook, J. Inst. Civil Eng. 11 (1939).', 'Crane Technical Paper No. 410 (K factors).'], related: { learn: 'reynolds', eqs: ['darcy'] },
  },
  {
    id: 'hydrostatic', title: 'Hydrostatic Pressure', disc: 'fluids', level: 'school', tags: ['pressure', 'depth', 'gauge pressure', 'absolute pressure', 'manometer'],
    summary: 'Gauge and absolute pressure at depth in a fluid at rest.',
    inputs: [FLU('fluid', { rho: 'rho' }), I('rho', 'Density', '\\rho', 'density', 998.2), I('h', 'Depth', 'h', 'length', 10), I('p0', 'Surface (atmospheric) pressure', 'p_0', 'pressure', 101325, { u: { si: 'kPa', imperial: 'psi' } }), I('g', 'Gravity', 'g', 'accel', g0, { adv: true })],
    outputs: [O('pg', 'Gauge pressure', 'p_g', 'pressure', { primary: true, u: { si: 'kPa', metric: 'bar', imperial: 'psi' } }), O('pa', 'Absolute pressure', 'p', 'pressure', { u: { si: 'kPa', metric: 'bar', imperial: 'psi' } }), O('F', 'Force on 1 m² at this depth', 'F', 'force', { u: { si: 'kN' } })],
    compute({ rho, h, p0, g }) { const pg = rho * g * h; return { pg, pa: p0 + pg, F: pg }; },
    eq: ['p = p_0 + \\rho g h'], assume: ['Incompressible fluid at rest; constant g.'], limits: [], refs: ['White §2.3.'],
  },
  {
    id: 'buoyancy', title: 'Buoyancy (Archimedes)', disc: 'fluids', level: 'school', tags: ['archimedes', 'upthrust', 'float', 'sink', 'displacement'],
    summary: 'Buoyant force and whether an object floats, and the submerged fraction if it does.',
    inputs: [FLU('fluid', { rho: 'rhof' }), I('rhof', 'Fluid density', '\\rho_f', 'density', 998.2), I('m', 'Object mass', 'm', 'mass', 5), I('V', 'Object volume', 'V', 'volume', 0.008, { u: { si: 'L' } })],
    outputs: [O('Fb', 'Buoyant force (fully submerged)', 'F_B', 'force', { primary: true }), O('W', 'Weight', 'W', 'force'), O('net', 'Net upward force', 'F_{net}', 'force'), O('rhoo', 'Object mean density', '\\rho_o', 'density'), O('frac', 'Submerged fraction when floating', '\\phi', 'none', { u: { si: '%' } }), O('st', 'Outcome', '', 'none', { type: 'text' })],
    compute({ rhof, m, V }) { const Fb = rhof * g0 * V, W = m * g0, rhoo = m / V; return { Fb, W, net: Fb - W, rhoo, frac: Math.min(1, rhoo / rhof), st: rhoo < rhof ? 'Floats' : rhoo > rhof ? 'Sinks' : 'Neutrally buoyant' }; },
    eq: ['F_B = \\rho_f g V_{disp}', '\\phi = \\rho_o / \\rho_f'], assume: ['Rigid object; uniform fluid density.'], limits: [], refs: ['White §2.8.'],
  },
  {
    id: 'venturi', title: 'Bernoulli / Venturi (pipe contraction)', disc: 'fluids', level: 'uni', tags: ['bernoulli', 'continuity', 'venturi meter', 'pressure', 'velocity'],
    summary: 'Velocities and downstream pressure between two pipe sections using continuity and Bernoulli.',
    inputs: [FLU('fluid', { rho: 'rho' }), I('rho', 'Density', '\\rho', 'density', 998.2), I('Q', 'Flow rate', 'Q', 'flow', 5e-3, { u: { si: 'L/s', imperial: 'gpm (US)' } }),
      I('D1', 'Diameter at 1', 'D_1', 'length', 0.08, { u: { si: 'mm', imperial: 'in' } }), I('D2', 'Diameter at 2', 'D_2', 'length', 0.04, { u: { si: 'mm', imperial: 'in' } }),
      I('p1', 'Pressure at 1 (gauge)', 'p_1', 'pressure', 200e3, { u: { si: 'kPa', imperial: 'psi' } }), I('z1', 'Elevation at 1', 'z_1', 'length', 0, { adv: true }), I('z2', 'Elevation at 2', 'z_2', 'length', 0, { adv: true }), I('hL', 'Head loss 1→2', 'h_L', 'length', 0, { adv: true })],
    outputs: [O('v1', 'Velocity at 1', 'v_1', 'velocity'), O('v2', 'Velocity at 2', 'v_2', 'velocity'), O('p2', 'Pressure at 2 (gauge)', 'p_2', 'pressure', { primary: true, u: { si: 'kPa', imperial: 'psi' } }), O('dp', 'Pressure difference p₁ − p₂', '\\Delta p', 'pressure', { u: { si: 'kPa', imperial: 'psi' } }), O('H', 'Total head at 1', 'H_1', 'length')],
    compute(x) {
      const v1 = x.Q / (PI * x.D1 ** 2 / 4), v2 = x.Q / (PI * x.D2 ** 2 / 4);
      const p2 = x.p1 + x.rho * (v1 * v1 - v2 * v2) / 2 + x.rho * g0 * (x.z1 - x.z2 - x.hL);
      const w = p2 < -101325 + 2339 ? ['Absolute pressure at 2 would be below vapour pressure — cavitation.'] : [];
      return { v1, v2, p2, dp: x.p1 - p2, H: x.p1 / (x.rho * g0) + v1 * v1 / (2 * g0) + x.z1, _warn: w };
    },
    eq: ['Q = A_1 v_1 = A_2 v_2', 'p_1 + \\tfrac12\\rho v_1^2 + \\rho g z_1 = p_2 + \\tfrac12\\rho v_2^2 + \\rho g z_2 + \\rho g h_L'],
    assume: ['Steady, incompressible flow along a streamline.', 'Uniform velocity across each section.'], limits: ['Real meters need a discharge coefficient (C_d ≈ 0.98 venturi).'], refs: ['White §3.5.'], related: { learn: 'bernoulli' },
  },
  {
    id: 'orifice', title: 'Orifice Plate Flow', disc: 'fluids', level: 'pro', tags: ['flow measurement', 'orifice', 'discharge coefficient', 'beta ratio', 'iso 5167'],
    summary: 'Volumetric and mass flow through an orifice plate from the measured differential pressure.',
    inputs: [FLU('fluid', { rho: 'rho' }), I('rho', 'Density', '\\rho', 'density', 998.2), I('d', 'Orifice bore', 'd', 'length', 0.03, { u: { si: 'mm' } }), I('D', 'Pipe inner diameter', 'D', 'length', 0.06, { u: { si: 'mm' } }), I('dp', 'Differential pressure', '\\Delta p', 'pressure', 25e3, { u: { si: 'kPa', imperial: 'psi' } }), I('Cd', 'Discharge coefficient', 'C_d', 'none', 0.61)],
    outputs: [O('Q', 'Volumetric flow', 'Q', 'flow', { primary: true, u: { si: 'L/s', metric: 'm³/h', imperial: 'gpm (US)' } }), O('mdot', 'Mass flow', '\\dot m', 'massflow'), O('beta', 'Beta ratio', '\\beta', 'none'), O('v', 'Pipe velocity', 'v', 'velocity')],
    compute({ rho, d, D, dp, Cd }) {
      const beta = d / D, A0 = PI * d * d / 4, Q = Cd * A0 * Math.sqrt(2 * dp / (rho * (1 - beta ** 4)));
      const w = (beta < 0.1 || beta > 0.75) ? ['β outside ISO 5167-2 range (0.1–0.75).'] : [];
      return { Q, mdot: rho * Q, beta, v: Q / (PI * D * D / 4), _warn: w };
    },
    eq: ['Q = C_d A_0\\sqrt{\\frac{2\\Delta p}{\\rho(1-\\beta^4)}}', '\\beta = d/D'],
    assume: ['Incompressible flow (liquid) — gases need the expansibility factor ε.', 'Constant C_d (≈ 0.6 for sharp-edged orifices at high Re).'],
    limits: ['For custody transfer, use the Reader-Harris/Gallagher C_d equation and installation rules of ISO 5167-2.'], refs: ['ISO 5167-1/-2:2022.', 'White §6.12.'],
  },
  {
    id: 'pump-power', title: 'Pump Power', disc: 'fluids', level: 'uni', tags: ['pump', 'hydraulic power', 'head', 'efficiency', 'motor sizing'],
    summary: 'Hydraulic, shaft and electrical input power for a pump delivering a flow against a head.',
    inputs: [FLU('fluid', { rho: 'rho' }), I('rho', 'Density', '\\rho', 'density', 998.2), I('Q', 'Flow rate', 'Q', 'flow', 10e-3, { u: { si: 'L/s', metric: 'm³/h', imperial: 'gpm (US)' } }), I('H', 'Total dynamic head', 'H', 'length', 30, { u: { imperial: 'ft' } }),
      I('ep', 'Pump efficiency', '\\eta_p', 'none', 0.72), I('em', 'Motor efficiency', '\\eta_m', 'none', 0.92)],
    outputs: [O('Ph', 'Hydraulic power', 'P_h', 'power', { u: { si: 'kW', imperial: 'hp' } }), O('Ps', 'Shaft (brake) power', 'P_s', 'power', { primary: true, u: { si: 'kW', imperial: 'hp' } }), O('Pe', 'Electrical input', 'P_e', 'power', { u: { si: 'kW' } }), O('dp', 'Pressure rise', '\\Delta p', 'pressure', { u: { si: 'bar', imperial: 'psi' } }), O('motor', 'Suggested motor (next IEC size with 10 % margin)', '', 'none', { type: 'text' })],
    compute({ rho, Q, H, ep, em }) {
      const Ph = rho * g0 * Q * H, Ps = Ph / ep;
      const sizes = [0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315];
      const need = Ps * 1.1 / 1e3;
      const s = sizes.find(k => k >= need);
      return { Ph, Ps, Pe: Ps / em, dp: rho * g0 * H, motor: s ? `${s} kW` : '> 315 kW', _info: ['Electrical → see the Electric Motor calculator for current draw.'] };
    },
    eq: ['P_h = \\rho g Q H', 'P_s = P_h/\\eta_p', 'P_e = P_s/\\eta_m'], assume: ['Steady operation at the duty point.'], limits: ['Check NPSH and the pump curve for the actual operating point.'],
    refs: ['Karassik, Pump Handbook.', 'IEC 60072-1 standard motor ratings.'], related: { calc: 'motor' },
  },
  {
    id: 'npsh', title: 'NPSH Available (cavitation check)', disc: 'fluids', level: 'pro', tags: ['npsh', 'cavitation', 'suction', 'vapour pressure', 'pump'],
    summary: 'Net positive suction head available at the pump inlet, compared with the pump\'s NPSH required.',
    inputs: [I('patm', 'Pressure on liquid surface (absolute)', 'p_s', 'pressure', 101325, { u: { si: 'kPa', imperial: 'psi' } }), FLU('fluid', { rho: 'rho', pv: 'pv' }), I('rho', 'Density', '\\rho', 'density', 998.2), I('pv', 'Vapour pressure', 'p_v', 'pressure', 2339, { u: { si: 'kPa', imperial: 'psi' } }),
      I('zs', 'Liquid level above pump inlet (− if below)', 'z_s', 'length', -3), I('hf', 'Suction line losses', 'h_{f,s}', 'length', 0.8), I('NPSHr', 'NPSH required (pump curve)', 'NPSH_r', 'length', 3), I('margin', 'Required margin', 'm', 'length', 0.5, { adv: true })],
    outputs: [O('NPSHa', 'NPSH available', 'NPSH_a', 'length', { primary: true }), O('ratio', 'NPSHa / NPSHr', '', 'none')],
    compute(x) {
      const NPSHa = (x.patm - x.pv) / (x.rho * g0) + x.zs - x.hf;
      return { NPSHa, ratio: NPSHa / x.NPSHr, _checks: [check('NPSHa ≥ NPSHr + margin', NPSHa >= x.NPSHr + x.margin, `${NPSHa.toFixed(2)} m vs ${(x.NPSHr + x.margin).toFixed(2)} m`)] };
    },
    eq: ['NPSH_a = \\frac{p_s - p_v}{\\rho g} + z_s - h_{f,s}'], assume: ['Velocity head at the free surface negligible.'], limits: ['Margins per ANSI/HI 9.6.1 depend on application (often NPSHa/NPSHr ≥ 1.1–1.5).'],
    refs: ['ANSI/HI 9.6.1 Rotodynamic Pumps — Guideline for NPSH Margin.'],
  },
  {
    id: 'affinity', title: 'Pump / Fan Affinity Laws', disc: 'fluids', level: 'uni', tags: ['affinity laws', 'speed change', 'impeller trim', 'vfd', 'fan laws'],
    summary: 'New flow, head and power when a pump or fan changes speed (or impeller diameter).',
    inputs: [I('n1', 'Original speed', 'n_1', 'angvel', 1450 * 2 * PI / 60), I('n2', 'New speed', 'n_2', 'angvel', 1200 * 2 * PI / 60), I('Dr', 'Diameter ratio D₂/D₁', 'D_2/D_1', 'none', 1, { adv: true }),
      I('Q1', 'Original flow', 'Q_1', 'flow', 10e-3, { u: { si: 'L/s' } }), I('H1', 'Original head', 'H_1', 'length', 30), I('P1', 'Original power', 'P_1', 'power', 4e3, { u: { si: 'kW' } })],
    outputs: [O('Q2', 'New flow', 'Q_2', 'flow', { primary: true, u: { si: 'L/s' } }), O('H2', 'New head', 'H_2', 'length'), O('P2', 'New power', 'P_2', 'power', { u: { si: 'kW' } }), O('save', 'Power saving', '', 'none', { u: { si: '%' } })],
    compute(x) { const r = x.n2 / x.n1, d = x.Dr; const P2 = x.P1 * r ** 3 * d ** 5; return { Q2: x.Q1 * r * d ** 3, H2: x.H1 * r * r * d * d, P2, save: 1 - P2 / x.P1 }; },
    eq: ['\\frac{Q_2}{Q_1} = \\frac{n_2}{n_1}\\left(\\frac{D_2}{D_1}\\right)^3', '\\frac{H_2}{H_1} = \\left(\\frac{n_2}{n_1}\\right)^2\\left(\\frac{D_2}{D_1}\\right)^2', '\\frac{P_2}{P_1} = \\left(\\frac{n_2}{n_1}\\right)^3\\left(\\frac{D_2}{D_1}\\right)^5'],
    assume: ['Geometrically similar operation (same efficiency).'], limits: ['With static head in the system, the real operating point moves along the system curve — savings are lower.', 'Impeller trim law is approximate for trims > 10 %.'], refs: ['White §11.5.'],
  },
  {
    id: 'drag', title: 'Aerodynamic Drag & Terminal Velocity', disc: 'fluids', level: 'school', tags: ['drag force', 'drag coefficient', 'terminal velocity', 'air resistance'],
    summary: 'Drag force and power at a given speed, and the terminal velocity of a falling body.',
    inputs: [I('rho', 'Fluid density', '\\rho', 'density', 1.204), I('Cd', 'Drag coefficient', 'C_d', 'none', 0.47, { hint: 'sphere ≈ 0.47, car ≈ 0.25–0.35, cyclist ≈ 0.9, flat plate ⟂ ≈ 1.28' }), I('A', 'Frontal area', 'A', 'area', 0.05), I('v', 'Speed', 'v', 'velocity', 30), I('m', 'Mass (for terminal velocity)', 'm', 'mass', 1)],
    outputs: [O('F', 'Drag force', 'F_D', 'force', { primary: true }), O('P', 'Power to overcome drag', 'P', 'power'), O('q', 'Dynamic pressure', 'q', 'pressure'), O('vt', 'Terminal velocity', 'v_t', 'velocity')],
    compute({ rho, Cd, A, v, m }) { const q = 0.5 * rho * v * v; return { q, F: q * Cd * A, P: q * Cd * A * v, vt: Math.sqrt(2 * m * g0 / (rho * Cd * A)) }; },
    eq: ['F_D = \\tfrac12\\rho v^2 C_d A', 'v_t = \\sqrt{\\frac{2mg}{\\rho C_d A}}'], assume: ['C_d constant over the speed range (Re-independent regime).'], limits: ['C_d depends on Re, Mach and surface roughness.'], refs: ['Hoerner, Fluid-Dynamic Drag (1965).'],
  },
  {
    id: 'isa', title: 'ISA Standard Atmosphere', disc: 'fluids', level: 'pro', tags: ['altitude', 'air density', 'speed of sound', 'aerodynamics', 'isa', 'icao'],
    summary: 'Temperature, pressure, density, speed of sound and viscosity of air vs geopotential altitude (ICAO/ISA, 0–47 km).',
    inputs: [I('h', 'Geopotential altitude', 'h', 'length', 3000, { u: { si: 'm', metric: 'm', imperial: 'ft' } }), I('v', 'Airspeed (for Mach, q)', 'v', 'velocity', 100, { adv: true })],
    outputs: [O('T', 'Temperature', 'T', 'temperature', { u: { si: '°C' } }), O('p', 'Pressure', 'p', 'pressure', { u: { si: 'kPa', imperial: 'psi' } }), O('rho', 'Density', '\\rho', 'density', { primary: true }), O('sig', 'Density ratio', '\\sigma = \\rho/\\rho_0', 'none'), O('a', 'Speed of sound', 'a', 'velocity'), O('mu', 'Dynamic viscosity', '\\mu', 'dynvisc'), O('M', 'Mach number', 'M', 'none'), O('q', 'Dynamic pressure', 'q', 'pressure', { u: { si: 'kPa' } })],
    compute({ h, v }) {
      const s = isa(h);
      const w = h > 47000 ? ['Model implemented to 47 km.'] : h < 0 ? ['Below sea level — extrapolated.'] : [];
      return { ...s, sig: s.rho / 1.225, M: v / s.a, q: 0.5 * s.rho * v * v, _warn: w };
    },
    eq: ['T = T_0 - Lh\\;(h \\le 11\\text{ km})', 'p = p_0\\left(\\frac{T}{T_0}\\right)^{g_0/(RL)}', '\\rho = \\frac{p}{RT}', 'a = \\sqrt{\\gamma R T}', '\\mu = \\frac{1.458\\times10^{-6} T^{3/2}}{T + 110.4}'],
    assume: ['Dry air, ideal gas, R = 287.053 J/(kg·K), γ = 1.4.', 'Standard day (ISA), geopotential altitude.'], limits: ['Real atmosphere deviates with weather; use ISA+ΔT for hot/cold days.'],
    refs: ['ICAO Doc 7488/3 Manual of the ICAO Standard Atmosphere.', 'ISO 2533:1975.'],
  },
  {
    id: 'manning', title: 'Open Channel Flow (Manning)', disc: 'fluids', level: 'pro', tags: ['manning', 'open channel', 'froude', 'hydraulic radius', 'drainage', 'civil'],
    summary: 'Flow rate, velocity and Froude number in a rectangular or trapezoidal channel using Manning\'s equation.',
    inputs: [I('b', 'Bottom width', 'b', 'length', 2), I('y', 'Flow depth', 'y', 'length', 0.8), I('z', 'Side slope (H:V, 0 = rectangular)', 'z', 'none', 1.5), I('S', 'Bed slope', 'S_0', 'none', 0.001), I('n', "Manning's n", 'n', 'none', 0.015, { hint: 'finished concrete 0.012–0.015, earth 0.022–0.030, natural stream 0.03–0.05' })],
    outputs: [O('Q', 'Discharge', 'Q', 'flow', { primary: true, u: { si: 'm³/s', imperial: 'ft³/s' } }), O('v', 'Mean velocity', 'v', 'velocity'), O('A', 'Flow area', 'A', 'area'), O('P', 'Wetted perimeter', 'P', 'length'), O('R', 'Hydraulic radius', 'R_h', 'length'), O('Fr', 'Froude number', 'Fr', 'none'), O('reg', 'Flow type', '', 'none', { type: 'text' })],
    compute({ b, y, z, S, n }) {
      const A = (b + z * y) * y, P = b + 2 * y * Math.sqrt(1 + z * z), R = A / P, v = Math.pow(R, 2 / 3) * Math.sqrt(S) / n, T = b + 2 * z * y, Fr = v / Math.sqrt(g0 * A / T);
      return { A, P, R, v, Q: v * A, Fr, reg: Fr < 1 ? 'Subcritical (tranquil)' : Fr > 1 ? 'Supercritical (rapid)' : 'Critical' };
    },
    eq: ['Q = \\frac{1}{n} A R_h^{2/3} S_0^{1/2}\\;\\text{(SI)}', 'R_h = A/P', 'Fr = \\frac{v}{\\sqrt{g A/T}}'], assume: ['Uniform, steady flow (normal depth).'], limits: ['n is empirical and uncertain (±20 %).'], refs: ['Chow, Open-Channel Hydraulics (1959).'],
  },
  {
    id: 'water-hammer', title: 'Water Hammer (Joukowsky)', disc: 'fluids', level: 'pro', tags: ['surge', 'water hammer', 'pressure transient', 'valve closure', 'wave speed'],
    summary: 'Pressure surge from a sudden velocity change, including pipe-wall elasticity in the wave speed.',
    inputs: [I('rho', 'Density', '\\rho', 'density', 998.2), I('K', 'Fluid bulk modulus', 'K', 'pressure', 2.2e9, { u: { si: 'GPa' } }), I('E', 'Pipe wall modulus', 'E', 'pressure', 200e9, { u: { si: 'GPa' } }), I('D', 'Pipe diameter', 'D', 'length', 0.1, { u: { si: 'mm' } }), I('e', 'Wall thickness', 'e', 'length', 0.005, { u: { si: 'mm' } }), I('dv', 'Velocity change', '\\Delta v', 'velocity', 2), I('L', 'Pipe length', 'L', 'length', 500)],
    outputs: [O('a', 'Pressure wave speed', 'a', 'velocity'), O('dp', 'Surge pressure', '\\Delta p', 'pressure', { primary: true, u: { si: 'bar', imperial: 'psi' } }), O('dH', 'Surge head', '\\Delta H', 'length'), O('tc', 'Critical closure time', 't_c = 2L/a', 'time')],
    compute(x) { const a = Math.sqrt((x.K / x.rho) / (1 + x.K * x.D / (x.E * x.e))); const dp = x.rho * a * x.dv; return { a, dp, dH: dp / (x.rho * g0), tc: 2 * x.L / a, _info: ['Closures slower than t_c reduce the surge (approximately ∝ t_c/t_closure).'] }; },
    eq: ['a = \\sqrt{\\frac{K/\\rho}{1 + \\frac{KD}{Ee}}}', '\\Delta p = \\rho a \\Delta v', 't_c = \\frac{2L}{a}'], assume: ['Instantaneous (rapid) velocity change; thin-walled elastic pipe; no friction.'], limits: ['Column separation and friction require a transient (MOC) analysis.'], refs: ['Wylie & Streeter, Fluid Transients in Systems (1993).'],
  },
];
