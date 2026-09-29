import { I, O, SEL, PI, deg, rad, check } from './_h.js';
import { C } from '../data/constants.js';

const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
export function e24Above(R) {
  if (!(R > 0)) return NaN;
  const dec = Math.pow(10, Math.floor(Math.log10(R)));
  for (const v of E24) if (v * dec >= R * (1 - 1e-9)) return v * dec;
  return 10 * dec;
}
const parseList = s => String(s).split(/[,;\s]+/).map(Number).filter(v => Number.isFinite(v) && v > 0);

export default [
  {
    id: 'ohm', title: "Ohm's Law & Power", disc: 'electrical', level: 'school', tags: ['voltage', 'current', 'resistance', 'power', 'v=ir', 'p=vi'],
    summary: 'Find voltage, current, resistance and power from any two known quantities.',
    inputs: [SEL('mode', 'Known pair', [['VI', 'Voltage & current'], ['VR', 'Voltage & resistance'], ['IR', 'Current & resistance'], ['PV', 'Power & voltage'], ['PI', 'Power & current'], ['PR', 'Power & resistance']], 'VR'),
      I('V', 'Voltage', 'V', 'voltage', 12, { showIf: v => v.mode.includes('V') }), I('I', 'Current', 'I', 'current', 0.5, { showIf: v => v.mode.includes('I') }), I('R', 'Resistance', 'R', 'resistance', 100, { showIf: v => v.mode.includes('R') }), I('P', 'Power', 'P', 'power', 5, { showIf: v => v.mode.includes('P') })],
    outputs: [O('V', 'Voltage', 'V', 'voltage'), O('I', 'Current', 'I', 'current', { primary: true }), O('R', 'Resistance', 'R', 'resistance'), O('P', 'Power', 'P', 'power')],
    compute(x) {
      let { V, I: Ic, R, P } = x;
      switch (x.mode) {
        case 'VI': R = V / Ic; P = V * Ic; break; case 'VR': Ic = V / R; P = V * Ic; break; case 'IR': V = Ic * R; P = V * Ic; break;
        case 'PV': Ic = P / V; R = V / Ic; break; case 'PI': V = P / Ic; R = V / Ic; break; case 'PR': Ic = Math.sqrt(P / R); V = Ic * R; break;
      }
      return { V, I: Ic, R, P };
    },
    eq: ['V = IR', 'P = VI = I^2R = \\frac{V^2}{R}'], assume: ['Ohmic (linear) resistor, DC or RMS AC with resistive load.'], limits: [], refs: ['Hambley, Electrical Engineering: Principles & Applications, ch. 1.'], related: { learn: 'circuits' },
  },
  {
    id: 'combine', title: 'Series & Parallel Combinations', disc: 'electrical', level: 'school', tags: ['series resistors', 'parallel resistors', 'equivalent resistance', 'capacitors in series', 'inductors'],
    summary: 'Equivalent value of resistors, capacitors or inductors in series and in parallel.',
    inputs: [SEL('kind', 'Component', [['R', 'Resistors (Ω)'], ['C', 'Capacitors (µF)'], ['L', 'Inductors (mH)']], 'R'),
      { k: 'list', label: 'Values (comma separated, in the unit shown above)', type: 'text', def: '100, 220, 470', dim: 'none' }],
    outputs: [O('ser', 'Series equivalent', '', 'none', { type: 'text' }), O('par', 'Parallel equivalent', '', 'none', { type: 'text', primary: true }), O('n', 'Count', 'n', 'none')],
    compute(x) {
      const v = parseList(x.list), u = { R: 'Ω', C: 'µF', L: 'mH' }[x.kind];
      const sum = v.reduce((a, b) => a + b, 0), rec = 1 / v.reduce((a, b) => a + 1 / b, 0);
      const [s, p] = x.kind === 'C' ? [rec, sum] : [sum, rec];
      const f = n => `${Number(n.toPrecision(5))} ${u}`;
      return { ser: v.length ? f(s) : '—', par: v.length ? f(p) : '—', n: v.length };
    },
    eq: ['R_s = \\sum R_i,\\quad \\frac{1}{R_p} = \\sum\\frac{1}{R_i}', '\\frac{1}{C_s} = \\sum\\frac{1}{C_i},\\quad C_p = \\sum C_i'], assume: ['Ideal components.'], limits: [], refs: ['Hambley ch. 2.'],
  },
  {
    id: 'divider', title: 'Voltage Divider (loaded)', disc: 'electrical', level: 'school', tags: ['potential divider', 'voltage divider', 'load resistance', 'sensor'],
    summary: 'Output voltage of a two-resistor divider, with and without a load.',
    inputs: [I('Vin', 'Input voltage', 'V_{in}', 'voltage', 12), I('R1', 'Top resistor', 'R_1', 'resistance', 10e3, { u: { si: 'kΩ' } }), I('R2', 'Bottom resistor', 'R_2', 'resistance', 4.7e3, { u: { si: 'kΩ' } }), I('RL', 'Load resistance (0 = no load)', 'R_L', 'resistance', 0, { u: { si: 'kΩ' } })],
    outputs: [O('Vu', 'Output (unloaded)', 'V_{out}', 'voltage'), O('Vl', 'Output (loaded)', "V_{out}'", 'voltage', { primary: true }), O('I', 'Current from source', 'I', 'current', { u: { si: 'mA' } }), O('P', 'Divider dissipation', 'P', 'power', { u: { si: 'mW' } }), O('Rth', 'Thévenin output resistance', 'R_{th}', 'resistance', { u: { si: 'kΩ' } })],
    compute({ Vin, R1, R2, RL }) {
      const R2e = RL > 0 ? R2 * RL / (R2 + RL) : R2, Vl = Vin * R2e / (R1 + R2e), I = Vin / (R1 + R2e);
      return { Vu: Vin * R2 / (R1 + R2), Vl, I, P: Vin * I, Rth: R1 * R2 / (R1 + R2) };
    },
    eq: ['V_{out} = V_{in}\\frac{R_2}{R_1 + R_2}', "R_2' = R_2 \\parallel R_L"], assume: ['Ideal DC source.'], limits: [], refs: ['Hambley §2.3.'],
  },
  {
    id: 'led', title: 'LED Series Resistor', disc: 'electrical', level: 'school', tags: ['led', 'current limiting resistor', 'e24'],
    summary: 'Current-limiting resistor for one or more series LEDs, with nearest standard E24 value and power rating.',
    inputs: [I('Vs', 'Supply voltage', 'V_s', 'voltage', 5), I('Vf', 'LED forward voltage', 'V_f', 'voltage', 2.0, { hint: 'red ≈ 2.0 V, green/blue/white ≈ 3.0–3.3 V' }), I('If', 'LED current', 'I_f', 'current', 0.02, { u: { si: 'mA' } }), I('n', 'LEDs in series', 'n', 'none', 1)],
    outputs: [O('R', 'Exact resistance', 'R', 'resistance'), O('Re', 'Next E24 value up', 'R_{E24}', 'resistance', { primary: true }), O('Ia', 'Actual current with E24', 'I', 'current', { u: { si: 'mA' } }), O('P', 'Resistor dissipation', 'P_R', 'power', { u: { si: 'mW' } }), O('Pr', 'Suggested rating (2×)', '', 'none', { type: 'text' })],
    compute({ Vs, Vf, If, n }) {
      const Vr = Vs - n * Vf, R = Vr / If, Re = e24Above(R), Ia = Vr / Re, P = Ia * Ia * Re;
      const rating = [0.125, 0.25, 0.5, 1, 2, 5].find(r => r >= 2 * P);
      return { R, Re, Ia, P, Pr: rating ? `${rating} W` : '> 5 W', _warn: Vr <= 0 ? ['Supply voltage too low for this many LEDs.'] : [] };
    },
    eq: ['R = \\frac{V_s - nV_f}{I_f}', 'P_R = I^2 R'], assume: ['Constant LED forward voltage.'], limits: ['V_f varies with temperature and binning.'], refs: ['LED manufacturer datasheets.'],
  },
  {
    id: 'rc', title: 'RC Circuit — Charging & Discharging', disc: 'electrical', level: 'school', tags: ['time constant', 'capacitor charging', 'exponential', 'rc circuit'],
    summary: 'Time constant, capacitor voltage, current, charge and stored energy at time t, with waveforms.',
    inputs: [SEL('mode', 'Mode', [['charge', 'Charging from 0 V'], ['dis', 'Discharging from V₀']], 'charge'), I('R', 'Resistance', 'R', 'resistance', 10e3, { u: { si: 'kΩ' } }), I('C', 'Capacitance', 'C', 'capacitance', 100e-6, { u: { si: 'µF' } }), I('V', 'Supply / initial voltage', 'V_0', 'voltage', 9), I('t', 'Time', 't', 'time', 1)],
    outputs: [O('tau', 'Time constant', '\\tau', 'time', { primary: true }), O('Vc', 'Capacitor voltage at t', 'V_C(t)', 'voltage'), O('I', 'Current at t', 'I(t)', 'current', { u: { si: 'mA' } }), O('Q', 'Charge at t', 'Q', 'charge', { u: { si: 'mC' } }), O('E', 'Energy stored at t', 'E', 'energy', { u: { si: 'mJ' } }), O('t5', 'Time to ~99 % (5τ)', '5\\tau', 'time')],
    compute(x) {
      const tau = x.R * x.C, ch = x.mode === 'charge';
      const f = t => ch ? x.V * (1 - Math.exp(-t / tau)) : x.V * Math.exp(-t / tau);
      const i = t => x.V / x.R * Math.exp(-t / tau);
      const Vc = f(x.t), ts = [], vs = [], is = [];
      for (let k = 0; k <= 100; k++) { const t = 5 * tau * k / 100; ts.push(t); vs.push(f(t)); is.push(i(t) * x.R); }
      return { tau, Vc, I: i(x.t) * (ch ? 1 : -1), Q: x.C * Vc, E: 0.5 * x.C * Vc * Vc, t5: 5 * tau,
        _plot: { series: [{ x: ts, y: vs, label: 'V_C(t)' }, { x: ts, y: is, label: 'I(t)·R (V)', dash: '5 4' }], opts: { xlabel: 't (s)', ylabel: 'V', marks: [{ x: tau, label: 'τ' }, { x: x.t, label: 't' }] } } };
    },
    eq: ['\\tau = RC', 'V_C = V_0(1 - e^{-t/\\tau})\\;\\text{(charging)}', 'V_C = V_0 e^{-t/\\tau}\\;\\text{(discharging)}', 'I = \\frac{V_0}{R}e^{-t/\\tau}', 'E = \\tfrac12 CV^2'], assume: ['Ideal capacitor and resistor; ideal step source.'], limits: [], refs: ['Hambley §4.2.'],
  },
  {
    id: 'rl', title: 'RL Circuit Transient', disc: 'electrical', level: 'uni', tags: ['inductor', 'time constant', 'rl circuit', 'magnetic energy'],
    summary: 'Current rise in an RL circuit after a step voltage, with the stored magnetic energy.',
    inputs: [I('R', 'Resistance', 'R', 'resistance', 10), I('L', 'Inductance', 'L', 'inductance', 0.1, { u: { si: 'mH' } }), I('V', 'Step voltage', 'V', 'voltage', 12), I('t', 'Time', 't', 'time', 0.01, { u: { si: 'ms' } })],
    outputs: [O('tau', 'Time constant', '\\tau', 'time', { primary: true, u: { si: 'ms' } }), O('I', 'Current at t', 'I(t)', 'current'), O('If', 'Final current', 'I_\\infty', 'current'), O('VL', 'Inductor voltage at t', 'V_L', 'voltage'), O('E', 'Magnetic energy at t', 'E', 'energy', { u: { si: 'mJ' } })],
    compute({ R, L, V, t }) { const tau = L / R, If = V / R, I = If * (1 - Math.exp(-t / tau)); return { tau, I, If, VL: V * Math.exp(-t / tau), E: 0.5 * L * I * I }; },
    eq: ['\\tau = L/R', 'I(t) = \\frac{V}{R}(1 - e^{-t/\\tau})', 'E = \\tfrac12 LI^2'], assume: ['Ideal inductor (no core saturation).'], limits: ['Breaking inductive current causes large voltage spikes — use a flyback diode.'], refs: ['Hambley §4.3.'],
  },
  {
    id: 'rlc', title: 'Series RLC Circuit (AC)', disc: 'electrical', level: 'uni', tags: ['impedance', 'reactance', 'resonance', 'q factor', 'bandwidth', 'phase angle', 'ac circuit'],
    summary: 'Reactances, impedance, current, phase, resonant frequency, Q-factor and bandwidth, with the frequency response.',
    inputs: [I('R', 'Resistance', 'R', 'resistance', 10), I('L', 'Inductance', 'L', 'inductance', 10e-3, { u: { si: 'mH' } }), I('C', 'Capacitance', 'C', 'capacitance', 1e-6, { u: { si: 'µF' } }), I('f', 'Frequency', 'f', 'frequency', 1000), I('V', 'Source voltage (RMS)', 'V', 'voltage', 10)],
    outputs: [O('XL', 'Inductive reactance', 'X_L', 'resistance'), O('XC', 'Capacitive reactance', 'X_C', 'resistance'), O('Z', 'Impedance magnitude', '|Z|', 'resistance'), O('phi', 'Phase angle (V leads I)', '\\phi', 'angle'), O('I', 'Current (RMS)', 'I', 'current', { primary: true, u: { si: 'mA' } }),
      O('VR', 'V across R', 'V_R', 'voltage'), O('VLv', 'V across L', 'V_L', 'voltage'), O('VC', 'V across C', 'V_C', 'voltage'), O('f0', 'Resonant frequency', 'f_0', 'frequency'), O('Q', 'Quality factor', 'Q', 'none'), O('BW', 'Bandwidth', 'BW', 'frequency'), O('zeta', 'Damping ratio', '\\zeta', 'none')],
    compute({ R, L, C, f, V }) {
      const w = 2 * PI * f, XL = w * L, XC = 1 / (w * C), Z = Math.hypot(R, XL - XC), I = V / Z, f0 = 1 / (2 * PI * Math.sqrt(L * C)), Q = Math.sqrt(L / C) / R;
      const fs = [], is = [];
      for (let k = 0; k <= 200; k++) { const ff = f0 * Math.pow(10, -1.5 + 3 * k / 200); const ww = 2 * PI * ff; fs.push(ff); is.push(V / Math.hypot(R, ww * L - 1 / (ww * C)) * 1e3); }
      return { XL, XC, Z, phi: Math.atan2(XL - XC, R), I, VR: I * R, VLv: I * XL, VC: I * XC, f0, Q, BW: f0 / Q, zeta: R / 2 * Math.sqrt(C / L),
        _plot: { series: [{ x: fs, y: is, label: '|I| (mA) vs f' }], opts: { xlabel: 'f (Hz)', ylabel: '|I| (mA)', logx: true, marks: [{ x: f0, label: 'f₀' }, { x: f, label: 'f' }] } } };
    },
    eq: ['X_L = \\omega L,\\; X_C = \\frac{1}{\\omega C}', '|Z| = \\sqrt{R^2 + (X_L - X_C)^2}', '\\phi = \\tan^{-1}\\frac{X_L - X_C}{R}', 'f_0 = \\frac{1}{2\\pi\\sqrt{LC}}', 'Q = \\frac{1}{R}\\sqrt{\\frac{L}{C}},\\; BW = f_0/Q'], assume: ['Ideal components; sinusoidal steady state.'], limits: [], refs: ['Hambley ch. 5–6.'],
  },
  {
    id: 'ac-power', title: 'AC Power & Power-Factor Correction', disc: 'electrical', level: 'uni', tags: ['power factor', 'real power', 'reactive power', 'apparent power', 'pf correction', 'capacitor bank'],
    summary: 'Real, reactive and apparent power for a single-phase load and the capacitor needed to improve power factor.',
    inputs: [I('V', 'Voltage (RMS)', 'V', 'voltage', 230), I('I', 'Current (RMS)', 'I', 'current', 20), I('pf', 'Power factor (lagging)', '\\cos\\phi_1', 'none', 0.75), I('pf2', 'Target power factor', '\\cos\\phi_2', 'none', 0.95), I('f', 'Frequency', 'f', 'frequency', 50)],
    outputs: [O('S', 'Apparent power', 'S', 'apparent', { u: { si: 'kVA' } }), O('P', 'Real power', 'P', 'power', { primary: true, u: { si: 'kW' } }), O('Q', 'Reactive power', 'Q', 'reactive', { u: { si: 'kvar' } }), O('phi', 'Phase angle', '\\phi', 'angle'), O('Qc', 'Correction reactive power', 'Q_c', 'reactive', { u: { si: 'kvar' } }), O('Cc', 'Correction capacitance', 'C', 'capacitance', { u: { si: 'µF' } }), O('I2', 'Line current after correction', 'I_2', 'current')],
    compute({ V, I, pf, pf2, f }) {
      const S = V * I, P = S * pf, phi = Math.acos(pf), Q = S * Math.sin(phi), phi2 = Math.acos(pf2), Qc = P * (Math.tan(phi) - Math.tan(phi2));
      return { S, P, Q, phi, Qc, Cc: Qc / (2 * PI * f * V * V), I2: P / (V * pf2) };
    },
    eq: ['S = VI,\\; P = S\\cos\\phi,\\; Q = S\\sin\\phi', 'Q_c = P(\\tan\\phi_1 - \\tan\\phi_2)', 'C = \\frac{Q_c}{2\\pi f V^2}'], assume: ['Sinusoidal voltage and current (no harmonics).'], limits: ['Harmonic distortion requires true power factor (displacement × distortion).'], refs: ['Hambley §5.6.'],
  },
  {
    id: 'three-phase', title: 'Three-Phase Power', disc: 'electrical', level: 'pro', tags: ['three phase', 'line voltage', 'phase voltage', 'star', 'wye', 'delta', 'line current', 'balanced load'],
    summary: 'Line & phase currents and voltages, and real/reactive/apparent power for a balanced three-phase load.',
    inputs: [SEL('mode', 'Known', [['P', 'Real power'], ['I', 'Line current']], 'P'), I('VL', 'Line-to-line voltage', 'V_L', 'voltage', 400), I('P', 'Real power', 'P', 'power', 22e3, { u: { si: 'kW' }, showIf: v => v.mode === 'P' }), I('IL', 'Line current', 'I_L', 'current', 40, { showIf: v => v.mode === 'I' }), I('pf', 'Power factor', '\\cos\\phi', 'none', 0.85), SEL('conn', 'Load connection', [['Y', 'Star / Wye'], ['D', 'Delta']], 'Y')],
    outputs: [O('IL', 'Line current', 'I_L', 'current', { primary: true }), O('P', 'Real power', 'P', 'power', { u: { si: 'kW' } }), O('S', 'Apparent power', 'S', 'apparent', { u: { si: 'kVA' } }), O('Q', 'Reactive power', 'Q', 'reactive', { u: { si: 'kvar' } }), O('Vph', 'Phase voltage', 'V_{ph}', 'voltage'), O('Iph', 'Phase current', 'I_{ph}', 'current'), O('Zph', 'Phase impedance', '|Z_{ph}|', 'resistance')],
    compute(x) {
      const s3 = Math.sqrt(3);
      const IL = x.mode === 'P' ? x.P / (s3 * x.VL * x.pf) : x.IL, S = s3 * x.VL * IL, P = S * x.pf;
      const [Vph, Iph] = x.conn === 'Y' ? [x.VL / s3, IL] : [x.VL, IL / s3];
      return { IL, P, S, Q: S * Math.sin(Math.acos(x.pf)), Vph, Iph, Zph: Vph / Iph };
    },
    eq: ['P = \\sqrt3 V_L I_L\\cos\\phi', 'S = \\sqrt3 V_L I_L', '\\text{Star: } V_{ph} = V_L/\\sqrt3,\\; I_{ph} = I_L', '\\text{Delta: } V_{ph} = V_L,\\; I_{ph} = I_L/\\sqrt3'], assume: ['Balanced, sinusoidal three-phase supply and load.'], limits: [], refs: ['Hambley §5.7.'], related: { calc: 'motor' },
  },
  {
    id: 'transformer', title: 'Transformer', disc: 'electrical', level: 'uni', tags: ['turns ratio', 'transformer efficiency', 'copper loss', 'core loss'],
    summary: 'Secondary voltage, full-load currents and efficiency at a given load fraction and power factor.',
    inputs: [I('Vp', 'Primary voltage', 'V_p', 'voltage', 11e3, { u: { si: 'kV' } }), I('Np', 'Primary turns', 'N_p', 'none', 1100), I('Ns', 'Secondary turns', 'N_s', 'none', 40), I('S', 'Rating', 'S', 'apparent', 500e3, { u: { si: 'kVA' } }),
      I('Pc', 'Core (no-load) loss', 'P_{core}', 'power', 1.2e3, { u: { si: 'kW' }, adv: true }), I('Pcu', 'Copper loss at full load', 'P_{cu}', 'power', 5e3, { u: { si: 'kW' }, adv: true }), I('x', 'Load fraction', 'x', 'none', 0.75), I('pf', 'Load power factor', '\\cos\\phi', 'none', 0.9), SEL('ph', 'Phases', [['1', 'Single-phase'], ['3', 'Three-phase (line quantities)']], '3')],
    outputs: [O('Vs', 'Secondary voltage', 'V_s', 'voltage', { primary: true }), O('a', 'Turns ratio', 'a', 'none'), O('Ip', 'Primary full-load current', 'I_p', 'current'), O('Is', 'Secondary full-load current', 'I_s', 'current'), O('eta', 'Efficiency at load', '\\eta', 'none', { u: { si: '%' } }), O('xmax', 'Load fraction for max efficiency', 'x_{max}', 'none')],
    compute(x) {
      const a = x.Np / x.Ns, Vs = x.Vp / a, k = x.ph === '3' ? Math.sqrt(3) : 1, Pout = x.x * x.S * x.pf;
      return { a, Vs, Ip: x.S / (k * x.Vp), Is: x.S / (k * Vs), eta: Pout / (Pout + x.Pc + x.x * x.x * x.Pcu), xmax: Math.sqrt(x.Pc / x.Pcu) };
    },
    eq: ['\\frac{V_p}{V_s} = \\frac{N_p}{N_s} = \\frac{I_s}{I_p}', '\\eta = \\frac{xS\\cos\\phi}{xS\\cos\\phi + P_{core} + x^2P_{cu}}'], assume: ['Ideal voltage ratio (regulation neglected).'], limits: [], refs: ['Chapman, Electric Machinery Fundamentals, ch. 2.'],
  },
  {
    id: 'motor', title: 'Electric Motor (induction)', disc: 'electrical', level: 'pro', tags: ['induction motor', 'full load current', 'slip', 'synchronous speed', 'motor torque', 'poles'],
    summary: 'Supply current, input power, shaft torque, synchronous speed and slip for an AC induction motor.',
    inputs: [I('P', 'Rated output (shaft) power', 'P_{out}', 'power', 7.5e3, { u: { si: 'kW', imperial: 'hp' } }), I('V', 'Supply voltage (line)', 'V', 'voltage', 400), SEL('ph', 'Phases', [['3', 'Three-phase'], ['1', 'Single-phase']], '3'), I('pf', 'Power factor', '\\cos\\phi', 'none', 0.84), I('eta', 'Efficiency', '\\eta', 'none', 0.9),
      I('f', 'Supply frequency', 'f', 'frequency', 50), SEL('poles', 'Poles', [['2', '2'], ['4', '4'], ['6', '6'], ['8', '8']], '4'), I('n', 'Rated speed', 'n', 'angvel', 1460 * 2 * PI / 60)],
    outputs: [O('I', 'Line current', 'I', 'current', { primary: true }), O('Pin', 'Electrical input', 'P_{in}', 'power', { u: { si: 'kW' } }), O('T', 'Rated torque', 'T', 'torque'), O('ns', 'Synchronous speed', 'n_s', 'angvel', { u: { si: 'rpm' } }), O('s', 'Slip', 's', 'none', { u: { si: '%' } }), O('loss', 'Losses (heat)', 'P_{loss}', 'power', { u: { si: 'kW' } })],
    compute(x) {
      const Pin = x.P / x.eta, k = x.ph === '3' ? Math.sqrt(3) : 1, ns = 4 * PI * x.f / parseFloat(x.poles);
      return { Pin, I: Pin / (k * x.V * x.pf), T: x.P / x.n, ns, s: (ns - x.n) / ns, loss: Pin - x.P, _info: ['Starting (DOL) current is typically 6–8 × rated current.'] };
    },
    eq: ['P_{in} = \\frac{P_{out}}{\\eta}', 'I = \\frac{P_{in}}{\\sqrt3 V\\cos\\phi}', 'n_s = \\frac{120 f}{p}\\;\\text{rpm}', 's = \\frac{n_s - n}{n_s}', 'T = P_{out}/\\omega'], assume: ['Rated operating point.'], limits: ['Use nameplate data for protection sizing.'], refs: ['Chapman ch. 6; IEC 60034-1.'], related: { calc: 'pump-power' },
  },
  {
    id: 'voltage-drop', title: 'Cable Voltage Drop', disc: 'electrical', level: 'pro', tags: ['voltage drop', 'cable sizing', 'conductor resistance', 'copper', 'aluminium', 'power loss'],
    summary: 'Resistive voltage drop and power loss in a cable run, corrected for conductor temperature.',
    inputs: [SEL('sys', 'System', [['dc', 'DC / single-phase (2 conductors)'], ['3', 'Three-phase (balanced)']], '3'), SEL('mat', 'Conductor', [['cu', 'Copper'], ['al', 'Aluminium']], 'cu'), I('A', 'Conductor cross-section', 'A', 'area', 16e-6, { u: { si: 'mm²' } }), I('L', 'Route length (one way)', 'L', 'length', 80),
      I('I', 'Load current', 'I', 'current', 40), I('V', 'Nominal voltage', 'V', 'voltage', 400), I('T', 'Conductor temperature', 'T', 'temperature', 343.15, { u: { si: '°C' }, adv: true }), I('pf', 'Power factor', '\\cos\\phi', 'none', 1, { adv: true }), I('lim', 'Allowed drop', '\\Delta V_{max}', 'none', 0.05, { u: { si: '%' } })],
    outputs: [O('R', 'Conductor resistance (per conductor)', 'R', 'resistance', { u: { si: 'mΩ' } }), O('Vd', 'Voltage drop', '\\Delta V', 'voltage', { primary: true }), O('pct', 'Voltage drop', '\\Delta V\\%', 'none', { u: { si: '%' } }), O('Pl', 'Power loss in cable', 'P_{loss}', 'power'), O('Lmax', 'Max length for allowed drop', 'L_{max}', 'length')],
    compute(x) {
      const [rho20, a] = x.mat === 'cu' ? [1.72e-8, 0.00393] : [2.82e-8, 0.00403];
      const rho = rho20 * (1 + a * (x.T - 293.15)), R = rho * x.L / x.A;
      const k = x.sys === '3' ? Math.sqrt(3) : 2, Vd = k * x.I * R * x.pf, pct = Vd / x.V;
      const Pl = (x.sys === '3' ? 3 : 2) * x.I * x.I * R;
      return { R, Vd, pct, Pl, Lmax: x.L * x.lim / pct, _checks: [check(`Drop ≤ ${(x.lim * 100).toFixed(1)} %`, pct <= x.lim, `${(pct * 100).toFixed(2)} %`)] };
    },
    eq: ['R = \\rho_T\\frac{L}{A},\\; \\rho_T = \\rho_{20}[1 + \\alpha(T - 20)]', '\\Delta V_{1\\phi} = 2IR\\cos\\phi,\\; \\Delta V_{3\\phi} = \\sqrt3 IR\\cos\\phi'],
    assume: ['Resistive drop only — conductor reactance neglected (acceptable for small cables; add X sinφ for large cables).', 'ρ₂₀: Cu 1.72×10⁻⁸ Ω·m, Al 2.82×10⁻⁸ Ω·m.'],
    limits: ['Does NOT check current-carrying capacity, installation method, grouping, fault protection or disconnection times. Cable selection must follow the local wiring regulations (e.g. IEC 60364 / BS 7671 / NFPA 70 NEC) — cite the edition used.'],
    refs: ['IEC 60228 (conductor resistance).', 'IEC 60364-5-52 Annex G (voltage drop).'],
  },
  {
    id: 'battery', title: 'Battery Pack & Runtime', disc: 'electrical', level: 'uni', tags: ['battery capacity', 'runtime', 'c-rate', 'wh', 'ah', 'series cells', 'parallel cells', 'ev'],
    summary: 'Pack voltage, capacity, energy, runtime and C-rate for a series/parallel cell configuration.',
    inputs: [I('Vc', 'Cell nominal voltage', 'V_{cell}', 'voltage', 3.6), I('Ah', 'Cell capacity', 'C_{cell}', 'charge', 3 * 3600, { u: { si: 'Ah' } }), I('s', 'Cells in series', 's', 'none', 14), I('p', 'Cells in parallel', 'p', 'none', 4),
      I('P', 'Load power', 'P', 'power', 500), I('dod', 'Usable depth of discharge', 'DoD', 'none', 0.9, { u: { si: '%' } }), I('eta', 'Conversion efficiency', '\\eta', 'none', 0.95, { u: { si: '%' } }), I('m', 'Cell mass', 'm_{cell}', 'mass', 0.047, { u: { si: 'g' }, adv: true })],
    outputs: [O('V', 'Pack voltage', 'V', 'voltage'), O('C', 'Pack capacity', 'C', 'charge', { u: { si: 'Ah' } }), O('E', 'Pack energy', 'E', 'energy', { u: { si: 'Wh' } }), O('t', 'Runtime', 't', 'time', { primary: true, u: { si: 'h' } }), O('I', 'Pack current', 'I', 'current'), O('Cr', 'C-rate', 'C', 'none'), O('Ed', 'Specific energy (cells only)', 'e', 'specenergy', { u: { si: 'kJ/kg' }, adv: true })],
    compute(x) {
      const V = x.Vc * x.s, C = x.Ah * x.p, E = V * C, I = x.P / (V * x.eta), n = x.s * x.p;
      return { V, C, E, t: E * x.dod * x.eta / x.P, I, Cr: I / (C / 3600), Ed: E / (n * x.m), _info: [`${n} cells total.`] };
    },
    eq: ['V = s V_{cell},\\; C = p\\, C_{cell}', 'E = VC', 't = \\frac{E\\,DoD\\,\\eta}{P}', 'C\\text{-rate} = I / C_{Ah}'], assume: ['Nominal voltage; capacity independent of discharge rate (no Peukert effect).'], limits: ['Capacity falls at high C-rates and low temperature.'], refs: ['Linden\'s Handbook of Batteries.'],
  },
  {
    id: 'opamp-filter', title: 'Op-Amp Gain & RC Filters', disc: 'electrical', level: 'uni', tags: ['op-amp', 'inverting amplifier', 'non-inverting', 'low-pass filter', 'high-pass filter', 'cutoff frequency', 'decibel'],
    summary: 'Gain of inverting/non-inverting amplifiers and the response of first-order RC filters.',
    inputs: [SEL('mode', 'Circuit', [['inv', 'Inverting amplifier'], ['non', 'Non-inverting amplifier'], ['lp', 'RC low-pass filter'], ['hp', 'RC high-pass filter']], 'lp'),
      I('Rf', 'Feedback resistor', 'R_f', 'resistance', 100e3, { u: { si: 'kΩ' }, showIf: v => ['inv', 'non'].includes(v.mode) }), I('Rin', 'Input / ground resistor', 'R_{in}', 'resistance', 10e3, { u: { si: 'kΩ' }, showIf: v => ['inv', 'non'].includes(v.mode) }),
      I('R', 'Resistance', 'R', 'resistance', 1.6e3, { u: { si: 'kΩ' }, showIf: v => ['lp', 'hp'].includes(v.mode) }), I('C', 'Capacitance', 'C', 'capacitance', 100e-9, { u: { si: 'nF' }, showIf: v => ['lp', 'hp'].includes(v.mode) }), I('f', 'Evaluate at frequency', 'f', 'frequency', 1000, { showIf: v => ['lp', 'hp'].includes(v.mode) })],
    outputs: [O('G', 'Gain (V/V)', 'A_v', 'none', { primary: true }), O('dB', 'Gain (dB)', 'A_{dB}', 'none'), O('fc', 'Cutoff frequency', 'f_c', 'frequency'), O('ph', 'Phase shift', '\\phi', 'angle')],
    compute(x) {
      if (x.mode === 'inv') { const G = -x.Rf / x.Rin; return { G, dB: 20 * Math.log10(Math.abs(G)), fc: NaN, ph: PI }; }
      if (x.mode === 'non') { const G = 1 + x.Rf / x.Rin; return { G, dB: 20 * Math.log10(G), fc: NaN, ph: 0 }; }
      const fc = 1 / (2 * PI * x.R * x.C), r = x.f / fc;
      const mag = f => x.mode === 'lp' ? 1 / Math.sqrt(1 + (f / fc) ** 2) : (f / fc) / Math.sqrt(1 + (f / fc) ** 2);
      const fs = [], ds = [];
      for (let k = 0; k <= 160; k++) { const ff = fc * Math.pow(10, -2 + 4 * k / 160); fs.push(ff); ds.push(20 * Math.log10(mag(ff))); }
      const G = mag(x.f);
      return { G, dB: 20 * Math.log10(G), fc, ph: x.mode === 'lp' ? -Math.atan(r) : PI / 2 - Math.atan(r),
        _plot: { series: [{ x: fs, y: ds, label: 'Magnitude (dB)' }], opts: { xlabel: 'f (Hz)', ylabel: 'dB', logx: true, marks: [{ x: fc, label: 'f_c' }], hlines: [{ y: -3.01, label: '−3 dB' }] } } };
    },
    eq: ['A_{inv} = -\\frac{R_f}{R_{in}}', 'A_{non} = 1 + \\frac{R_f}{R_{in}}', 'f_c = \\frac{1}{2\\pi RC}', '|H_{LP}| = \\frac{1}{\\sqrt{1 + (f/f_c)^2}}'], assume: ['Ideal op-amp (infinite gain & bandwidth); filters unloaded.'], limits: ['Real op-amps are limited by gain-bandwidth product and slew rate.'], refs: ['Horowitz & Hill, The Art of Electronics, ch. 1 & 4.'],
  },
  {
    id: 'colour-code', title: 'Resistor Colour Code (4-band)', disc: 'electrical', level: 'school', tags: ['resistor colours', 'colour bands', 'color code'],
    summary: 'Decode a 4-band resistor colour code into its value and tolerance range.',
    inputs: (() => {
      const cols = [['0', 'Black'], ['1', 'Brown'], ['2', 'Red'], ['3', 'Orange'], ['4', 'Yellow'], ['5', 'Green'], ['6', 'Blue'], ['7', 'Violet'], ['8', 'Grey'], ['9', 'White']];
      return [SEL('b1', 'Band 1', cols.slice(1), '4'), SEL('b2', 'Band 2', cols, '7'), SEL('m', 'Multiplier', [...cols.slice(0, 8), ['-1', 'Gold (×0.1)'], ['-2', 'Silver (×0.01)']], '2'), SEL('t', 'Tolerance', [['0.01', 'Brown ±1 %'], ['0.02', 'Red ±2 %'], ['0.05', 'Gold ±5 %'], ['0.1', 'Silver ±10 %']], '0.05')];
    })(),
    outputs: [O('R', 'Resistance', 'R', 'resistance', { primary: true }), O('Rmin', 'Minimum', 'R_{min}', 'resistance'), O('Rmax', 'Maximum', 'R_{max}', 'resistance')],
    compute(x) { const R = (10 * +x.b1 + +x.b2) * Math.pow(10, +x.m), t = +x.t; return { R, Rmin: R * (1 - t), Rmax: R * (1 + t) }; },
    eq: ['R = (10\\,d_1 + d_2)\\times 10^{m}'], assume: [], limits: [], refs: ['IEC 60062.'],
  },
  {
    id: 'energy-cost', title: 'Electrical Energy & Cost', disc: 'electrical', level: 'school', tags: ['kwh', 'electricity bill', 'energy use', 'running cost'],
    summary: 'Energy consumption and running cost of an appliance.',
    inputs: [I('P', 'Power', 'P', 'power', 2000), I('h', 'Hours per day', 't', 'time', 3 * 3600, { u: { si: 'h', metric: 'h', imperial: 'h' } }), I('days', 'Days', 'd', 'none', 30), I('tariff', 'Price per kWh', 'c', 'none', 0.25)],
    outputs: [O('E', 'Energy used', 'E', 'energy', { primary: true, u: { si: 'kWh', metric: 'kWh', imperial: 'kWh' } }), O('cost', 'Cost (same currency as tariff)', '', 'none')],
    compute({ P, h, days, tariff }) { const E = P * h * days; return { E, cost: E / 3.6e6 * tariff }; },
    eq: ['E = Pt', '\\text{cost} = E_{kWh}\\times\\text{tariff}'], assume: ['Constant power draw.'], limits: [], refs: [],
  },
  {
    id: 'coulomb', title: "Coulomb's Law & Electric Field", disc: 'electrical', level: 'school', tags: ['electrostatics', 'point charge', 'electric field', 'electric potential', 'force between charges'],
    summary: 'Force between two point charges, and the field and potential of charge 1 at the separation distance.',
    inputs: [I('q1', 'Charge 1', 'q_1', 'charge', 2e-6, { u: { si: 'µC' } }), I('q2', 'Charge 2', 'q_2', 'charge', -3e-6, { u: { si: 'µC' } }), I('r', 'Separation', 'r', 'length', 0.05, { u: { si: 'cm' } }), I('er', 'Relative permittivity', '\\varepsilon_r', 'none', 1, { adv: true })],
    outputs: [O('F', 'Force magnitude', 'F', 'force', { primary: true }), O('dir', 'Nature', '', 'none', { type: 'text' }), O('E', 'Field of q₁ at r', 'E', 'efield', { u: { si: 'kV/m' } }), O('V', 'Potential of q₁ at r', 'V', 'voltage', { u: { si: 'kV' } }), O('U', 'Potential energy', 'U', 'energy')],
    compute({ q1, q2, r, er }) { const k = 1 / (4 * PI * C.eps0 * er); return { F: Math.abs(k * q1 * q2 / (r * r)), dir: q1 * q2 < 0 ? 'Attractive' : 'Repulsive', E: k * Math.abs(q1) / (r * r), V: k * q1 / r, U: k * q1 * q2 / r }; },
    eq: ['F = \\frac{1}{4\\pi\\varepsilon_0\\varepsilon_r}\\frac{q_1q_2}{r^2}', 'E = \\frac{kq}{r^2},\\; V = \\frac{kq}{r}'], assume: ['Point charges in a uniform linear medium.'], limits: [], refs: ['Griffiths, Introduction to Electrodynamics, ch. 2.'],
  },
  {
    id: 'bfield', title: 'Magnetic Field of Currents', disc: 'electrical', level: 'school', tags: ['magnetic field', 'solenoid', 'straight wire', 'current loop', 'biot-savart', 'ampere'],
    summary: 'Magnetic flux density near a long straight wire, at the centre of a loop, or inside a long solenoid.',
    inputs: [SEL('geo', 'Geometry', [['wire', 'Long straight wire'], ['loop', 'Centre of circular loop(s)'], ['sol', 'Inside long solenoid']], 'sol'), I('I', 'Current', 'I', 'current', 2),
      I('r', 'Distance from wire', 'r', 'length', 0.01, { u: { si: 'mm' }, showIf: v => v.geo === 'wire' }), I('R', 'Loop radius', 'R', 'length', 0.05, { u: { si: 'mm' }, showIf: v => v.geo === 'loop' }),
      I('N', 'Number of turns', 'N', 'none', 500, { showIf: v => v.geo !== 'wire' }), I('L', 'Solenoid length', 'L', 'length', 0.2, { u: { si: 'mm' }, showIf: v => v.geo === 'sol' }), I('mur', 'Relative permeability of core', '\\mu_r', 'none', 1, { adv: true })],
    outputs: [O('B', 'Magnetic flux density', 'B', 'bfield', { primary: true, u: { si: 'mT' } }), O('H', 'Magnetic field strength', 'H', 'none', { note: 'A/m' })],
    compute(x) {
      const mu = C.mu0 * x.mur;
      const B = x.geo === 'wire' ? mu * x.I / (2 * PI * x.r) : x.geo === 'loop' ? mu * x.N * x.I / (2 * x.R) : mu * x.N * x.I / x.L;
      return { B, H: B / mu };
    },
    eq: ['B_{wire} = \\frac{\\mu_0 I}{2\\pi r}', 'B_{loop} = \\frac{\\mu_0 N I}{2R}', 'B_{sol} = \\mu_0 \\frac{N}{L} I'], assume: ['Ideal geometries (infinite wire, long solenoid L ≫ radius).'], limits: ['Ferromagnetic cores saturate — μ_r is not constant.'], refs: ['Griffiths ch. 5.'],
  },
  {
    id: 'capacitor', title: 'Parallel-Plate Capacitor', disc: 'electrical', level: 'school', tags: ['capacitance', 'permittivity', 'dielectric', 'stored energy'],
    summary: 'Capacitance, charge, field and stored energy of a parallel-plate capacitor.',
    inputs: [I('A', 'Plate area', 'A', 'area', 0.01, { u: { si: 'cm²' } }), I('d', 'Plate separation', 'd', 'length', 1e-4, { u: { si: 'mm' } }), I('er', 'Relative permittivity', '\\varepsilon_r', 'none', 1, { hint: 'air 1.0006, PTFE 2.1, glass 4–10, ceramic up to thousands' }), I('V', 'Voltage', 'V', 'voltage', 100)],
    outputs: [O('C', 'Capacitance', 'C', 'capacitance', { primary: true, u: { si: 'pF' } }), O('Q', 'Charge', 'Q', 'charge', { u: { si: 'nC' } }), O('E', 'Electric field', 'E', 'efield', { u: { si: 'kV/m' } }), O('W', 'Stored energy', 'W', 'energy', { u: { si: 'mJ' } })],
    compute({ A, d, er, V }) { const Cc = C.eps0 * er * A / d; return { C: Cc, Q: Cc * V, E: V / d, W: 0.5 * Cc * V * V, _warn: V / d > 3e6 && er === 1 ? ['Field exceeds ~3 MV/m: air would break down.'] : [] }; },
    eq: ['C = \\frac{\\varepsilon_0\\varepsilon_r A}{d}', 'Q = CV,\\; E = V/d,\\; W = \\tfrac12 CV^2'], assume: ['Plate dimensions ≫ separation (fringing neglected).'], limits: [], refs: ['Griffiths §2.5.'],
  },
];
