import { I, O, SEL, GAS, MAT, PI, g0, check } from './_h.js';
import { C } from '../data/constants.js';
import { psatIF97, tsatIF97, air } from '../data/fluids.js';
import { colebrook } from './fluids.js';

const K0 = 273.15;
const pv = (series) => ({ series, opts: { xlabel: 'v or V', ylabel: 'p (kPa)' } });

export function psychro(Tc, RH, p) {
  const es = 610.94 * Math.exp(17.625 * Tc / (Tc + 243.04)); // Magnus (Alduchov & Eskridge 1996), Pa
  const pvap = RH * es;
  const W = 0.621945 * pvap / (p - pvap);
  const gamma = Math.log(pvap / 610.94);
  const Td = 243.04 * gamma / (17.625 - gamma);
  const h = 1.006 * Tc + W * (2501 + 1.86 * Tc); // kJ/kg dry air
  const v = 287.042 * (Tc + K0) * (1 + 1.607858 * W) / p;
  const R = RH * 100;
  const Tw = Tc * Math.atan(0.151977 * Math.sqrt(R + 8.313659)) + Math.atan(Tc + R) - Math.atan(R - 1.676331) + 0.00391838 * Math.pow(R, 1.5) * Math.atan(0.023101 * R) - 4.686035;
  return { es, pvap, W, Td, h: h * 1e3, v, Tw };
}

export default [
  {
    id: 'ideal-gas', title: 'Ideal Gas (mass form)', disc: 'thermo', level: 'school', tags: ['pv=nrt', 'gas law', 'moles', 'specific gas constant'],
    summary: 'Solve the ideal gas law for a real gas species: mass, moles, density and specific volume from p, V, T.',
    inputs: [GAS('gas', { R: 'R' }), I('R', 'Specific gas constant', 'R', 'specheat', 287.05), I('p', 'Absolute pressure', 'p', 'pressure', 101325, { u: { si: 'kPa', imperial: 'psi' } }), I('V', 'Volume', 'V', 'volume', 1), I('T', 'Temperature', 'T', 'temperature', 293.15, { u: { si: '°C', imperial: '°F' } })],
    outputs: [O('m', 'Mass', 'm', 'mass', { primary: true }), O('n', 'Amount', 'n', 'amount'), O('rho', 'Density', '\\rho', 'density'), O('v', 'Specific volume', 'v', 'specvol'), O('M', 'Molar mass', 'M', 'molarmass', { u: { si: 'g/mol' } })],
    compute({ R, p, V, T }) { const m = p * V / (R * T), M = C.R / R; return { m, n: m / M, rho: m / V, v: V / m, M }; },
    eq: ['pV = mRT = nR_uT', 'R = R_u / M'], assume: ['Ideal gas (low pressure relative to critical, T well above critical).'], limits: ['Use compressibility factor Z for high pressure: pV = ZmRT.'], refs: ['Çengel & Boles, Thermodynamics, §3-6.'], related: { eqs: ['ideal-gas'] },
  },
  {
    id: 'gas-process', title: 'Ideal-Gas Process (closed system)', disc: 'thermo', level: 'uni', tags: ['isothermal', 'isobaric', 'isochoric', 'adiabatic', 'isentropic', 'polytropic', 'work', 'heat', 'first law', 'p-v diagram'],
    summary: 'Final state, boundary work, heat, ΔU, ΔH and ΔS for a closed-system ideal-gas process, with the p–V diagram.',
    inputs: [GAS('gas', { R: 'R', cp: 'cp' }), I('R', 'Specific gas constant', 'R', 'specheat', 287.05), I('cp', 'Specific heat c_p', 'c_p', 'specheat', 1005),
      SEL('proc', 'Process', [['isobaric', 'Isobaric (p = const)'], ['isochoric', 'Isochoric (V = const)'], ['isothermal', 'Isothermal (T = const)'], ['isentropic', 'Isentropic (reversible adiabatic)'], ['polytropic', 'Polytropic (pVⁿ = const)']], 'isentropic'),
      I('m', 'Mass', 'm', 'mass', 1), I('p1', 'Initial pressure', 'p_1', 'pressure', 100e3, { u: { si: 'kPa', imperial: 'psi' } }), I('T1', 'Initial temperature', 'T_1', 'temperature', 300, { u: { si: '°C', imperial: '°F' } }),
      I('r', 'Volume ratio V₂/V₁', 'V_2/V_1', 'none', 0.125, { showIf: v => v.proc !== 'isochoric' }), I('pr', 'Pressure ratio p₂/p₁', 'p_2/p_1', 'none', 2, { showIf: v => v.proc === 'isochoric' }),
      I('n', 'Polytropic index', 'n', 'none', 1.3, { showIf: v => v.proc === 'polytropic' })],
    outputs: [O('p2', 'Final pressure', 'p_2', 'pressure', { u: { si: 'kPa', imperial: 'psi' } }), O('T2', 'Final temperature', 'T_2', 'temperature', { u: { si: '°C', imperial: '°F' } }), O('V1', 'Initial volume', 'V_1', 'volume', { u: { si: 'L' } }), O('V2', 'Final volume', 'V_2', 'volume', { u: { si: 'L' } }),
      O('W', 'Boundary work done BY gas', 'W_b', 'energy', { primary: true, u: { si: 'kJ' } }), O('Q', 'Heat added TO gas', 'Q', 'energy', { u: { si: 'kJ' } }), O('dU', 'Internal energy change', '\\Delta U', 'energy', { u: { si: 'kJ' } }), O('dH', 'Enthalpy change', '\\Delta H', 'energy', { u: { si: 'kJ' } }), O('dS', 'Entropy change', '\\Delta S', 'entropy', { u: { si: 'kJ/K' } })],
    compute(x) {
      const { R, cp, m, p1, T1, proc } = x, cv = cp - R, g = cp / cv;
      const V1 = m * R * T1 / p1;
      let V2, p2, T2, W;
      const pts = [];
      const curve = (fn) => { for (let i = 0; i <= 60; i++) { const V = V1 + (V2 - V1) * i / 60; pts.push([V, fn(V)]); } };
      switch (proc) {
        case 'isobaric': V2 = x.r * V1; p2 = p1; T2 = T1 * x.r; W = p1 * (V2 - V1); curve(() => p1); break;
        case 'isochoric': V2 = V1; p2 = p1 * x.pr; T2 = T1 * x.pr; W = 0; pts.push([V1, p1], [V1, p2]); break;
        case 'isothermal': V2 = x.r * V1; T2 = T1; p2 = p1 / x.r; W = p1 * V1 * Math.log(x.r); curve(V => p1 * V1 / V); break;
        case 'isentropic': V2 = x.r * V1; p2 = p1 * Math.pow(x.r, -g); T2 = T1 * Math.pow(x.r, 1 - g); W = (p1 * V1 - p2 * V2) / (g - 1); curve(V => p1 * Math.pow(V1 / V, g)); break;
        case 'polytropic': { const n = x.n; V2 = x.r * V1; p2 = p1 * Math.pow(x.r, -n); T2 = T1 * Math.pow(x.r, 1 - n); W = Math.abs(n - 1) < 1e-9 ? p1 * V1 * Math.log(x.r) : (p1 * V1 - p2 * V2) / (n - 1); curve(V => p1 * Math.pow(V1 / V, n)); break; }
      }
      const dU = m * cv * (T2 - T1), dH = m * cp * (T2 - T1), Q = dU + W;
      const dS = m * (cv * Math.log(T2 / T1) + R * Math.log(V2 / V1));
      return { V1, V2, p2, T2, W, Q, dU, dH, dS: proc === 'isentropic' ? 0 : dS,
        _plot: { series: [{ x: pts.map(p => p[0] * 1e3), y: pts.map(p => p[1] / 1e3), label: `${proc} 1 → 2`, type: 'area' }], opts: { xlabel: 'V (L)', ylabel: 'p (kPa)' } } };
    },
    eq: ['pV = mRT,\\; c_v = c_p - R,\\; \\gamma = c_p/c_v', 'W_b = \\int_1^2 p\\,dV', '\\text{isentropic: } pV^\\gamma = \\text{const},\\; W = \\frac{p_1V_1 - p_2V_2}{\\gamma - 1}', '\\text{isothermal: } W = p_1V_1\\ln\\frac{V_2}{V_1}', 'Q = \\Delta U + W_b', '\\Delta S = m\\left(c_v\\ln\\frac{T_2}{T_1} + R\\ln\\frac{V_2}{V_1}\\right)'],
    assume: ['Ideal gas with constant specific heats.', 'Quasi-equilibrium (reversible) boundary work.', 'Sign convention: W positive when done by the gas, Q positive when added.'],
    limits: ['Constant c_p is inaccurate over large temperature ranges (use variable-c_p tables).'], refs: ['Çengel & Boles, Thermodynamics, ch. 4 and 7.'],
  },
  {
    id: 'heating', title: 'Heating, Cooling & Phase Change', disc: 'thermo', level: 'school', tags: ['specific heat capacity', 'latent heat', 'q=mcΔt', 'melting', 'boiling'],
    summary: 'Heat to change the temperature of a substance, plus any latent heat for a phase change, and the time at a given power.',
    inputs: [I('m', 'Mass', 'm', 'mass', 1), I('c', 'Specific heat capacity', 'c', 'specheat', 4186), I('T1', 'Initial temperature', 'T_1', 'temperature', 293.15, { u: { si: '°C', imperial: '°F' } }), I('T2', 'Final temperature', 'T_2', 'temperature', 373.15, { u: { si: '°C', imperial: '°F' } }),
      I('L', 'Latent heat (0 if no phase change)', 'L', 'specenergy', 0, { u: { si: 'kJ/kg' }, hint: 'water: fusion 334 kJ/kg, vaporisation 2257 kJ/kg' }), I('P', 'Heater power', 'P', 'power', 2000, { adv: true }), I('eta', 'Heater efficiency', '\\eta', 'none', 1, { adv: true })],
    outputs: [O('Qs', 'Sensible heat', 'Q_s', 'energy', { u: { si: 'kJ' } }), O('Ql', 'Latent heat', 'Q_L', 'energy', { u: { si: 'kJ' } }), O('Q', 'Total heat', 'Q', 'energy', { primary: true, u: { si: 'kJ' } }), O('t', 'Time at heater power', 't', 'time', { u: { si: 'min' } }), O('kwh', 'Energy', 'E', 'energy', { u: { si: 'kWh', metric: 'kWh', imperial: 'kWh' } })],
    compute({ m, c, T1, T2, L, P, eta }) { const Qs = m * c * (T2 - T1), Ql = m * L, Q = Qs + Ql; return { Qs, Ql, Q, t: Math.abs(Q) / (P * eta), kwh: Q }; },
    eq: ['Q = mc\\Delta T + mL', 't = \\frac{Q}{\\eta P}'], assume: ['Constant c over the range; no heat losses.'], limits: ['If the range crosses a phase change, split into stages with each phase\'s c.'], refs: ['Any introductory thermal physics text.'],
  },
  {
    id: 'wall', title: 'Composite Wall Conduction (thermal resistance)', disc: 'thermo', level: 'uni', tags: ['conduction', 'fourier', 'thermal resistance', 'u-value', 'insulation', 'convection', 'composite wall'],
    summary: 'Heat flow and interface temperatures through up to three layers with convection on both faces.',
    inputs: [I('A', 'Area', 'A', 'area', 10), I('Ti', 'Inside air temperature', 'T_{\\infty,i}', 'temperature', 293.15, { u: { si: '°C', imperial: '°F' } }), I('To', 'Outside air temperature', 'T_{\\infty,o}', 'temperature', 273.15, { u: { si: '°C', imperial: '°F' } }),
      I('hi', 'Inside h (0 = none)', 'h_i', 'htc', 8), I('ho', 'Outside h (0 = none)', 'h_o', 'htc', 25),
      I('L1', 'Layer 1 thickness', 'L_1', 'length', 0.1, { u: { si: 'mm' } }), I('k1', 'Layer 1 conductivity', 'k_1', 'thermcond', 0.72, { hint: 'brick ≈ 0.72, concrete ≈ 1.4, mineral wool ≈ 0.04, EPS ≈ 0.035, plasterboard ≈ 0.17' }),
      I('L2', 'Layer 2 thickness', 'L_2', 'length', 0.1, { u: { si: 'mm' } }), I('k2', 'Layer 2 conductivity', 'k_2', 'thermcond', 0.04),
      I('L3', 'Layer 3 thickness (0 = none)', 'L_3', 'length', 0.0125, { u: { si: 'mm' } }), I('k3', 'Layer 3 conductivity', 'k_3', 'thermcond', 0.17)],
    outputs: [O('q', 'Heat flow', '\\dot Q', 'power', { primary: true }), O('U', 'Overall U-value', 'U', 'htc'), O('Rt', 'Total resistance (per m²)', "R''", 'none', { note: 'm²·K/W' }), O('temps', 'Surface / interface temperatures (inside → outside)', '', 'none', { type: 'text' })],
    compute(x) {
      const layers = [['inside film', x.hi > 0 ? 1 / x.hi : 0], ['layer 1', x.L1 / x.k1], ['layer 2', x.L2 / x.k2], ['layer 3', x.L3 > 0 ? x.L3 / x.k3 : 0], ['outside film', x.ho > 0 ? 1 / x.ho : 0]];
      const Rpp = layers.reduce((s, l) => s + l[1], 0), qpp = (x.Ti - x.To) / Rpp;
      let T = x.Ti; const out = [];
      layers.forEach(([n, r]) => { if (r === 0) return; T -= qpp * r; out.push(`${(T - K0).toFixed(2)} °C after ${n}`); });
      return { q: qpp * x.A, U: 1 / Rpp, Rt: Rpp, temps: out.join(' · ') };
    },
    eq: ['R_{cond} = \\frac{L}{kA},\\quad R_{conv} = \\frac{1}{hA}', '\\dot Q = \\frac{T_{\\infty,i} - T_{\\infty,o}}{\\Sigma R}', 'U = \\frac{1}{A\\,\\Sigma R}'],
    assume: ['Steady, one-dimensional conduction; constant k.', 'Perfect contact between layers (no contact resistance).'], limits: ['Thermal bridging (studs, fixings) is not included — building U-values per ISO 6946 add corrections.'],
    refs: ['Incropera & DeWitt, Fundamentals of Heat and Mass Transfer, §3.1.', 'ISO 6946 (building components).'],
  },
  {
    id: 'pipe-insulation', title: 'Pipe Insulation & Critical Radius', disc: 'thermo', level: 'uni', tags: ['cylindrical conduction', 'insulation', 'critical radius', 'heat loss', 'pipe'],
    summary: 'Heat loss from an insulated pipe (cylindrical conduction + outer convection) and the critical insulation radius.',
    inputs: [I('r1', 'Pipe outer radius', 'r_1', 'length', 0.02, { u: { si: 'mm' } }), I('r2', 'Insulation outer radius', 'r_2', 'length', 0.045, { u: { si: 'mm' } }), I('k', 'Insulation conductivity', 'k', 'thermcond', 0.04), I('L', 'Pipe length', 'L', 'length', 10),
      I('Ts', 'Pipe surface temperature', 'T_s', 'temperature', 353.15, { u: { si: '°C', imperial: '°F' } }), I('Ta', 'Ambient temperature', 'T_\\infty', 'temperature', 293.15, { u: { si: '°C', imperial: '°F' } }), I('h', 'Outer convection coefficient', 'h', 'htc', 10)],
    outputs: [O('q', 'Heat loss (insulated)', '\\dot Q', 'power', { primary: true }), O('q0', 'Heat loss (bare pipe)', '\\dot Q_0', 'power'), O('red', 'Reduction', '', 'none', { u: { si: '%' } }), O('Tsurf', 'Insulation surface temperature', 'T_2', 'temperature', { u: { si: '°C', imperial: '°F' } }), O('rc', 'Critical radius k/h', 'r_{cr}', 'length', { u: { si: 'mm' } })],
    compute(x) {
      const Rc = Math.log(x.r2 / x.r1) / (2 * PI * x.k * x.L), Rv = 1 / (x.h * 2 * PI * x.r2 * x.L);
      const q = (x.Ts - x.Ta) / (Rc + Rv), q0 = x.h * 2 * PI * x.r1 * x.L * (x.Ts - x.Ta), rc = x.k / x.h;
      const w = x.r1 < rc ? [`Pipe radius is below the critical radius (${(rc * 1e3).toFixed(1)} mm): thin insulation can INCREASE heat loss.`] : [];
      return { q, q0, red: 1 - q / q0, Tsurf: x.Ta + q * Rv, rc, _warn: w };
    },
    eq: ['R_{cyl} = \\frac{\\ln(r_2/r_1)}{2\\pi k L}', 'R_{conv} = \\frac{1}{h\\,2\\pi r_2 L}', 'r_{cr} = k/h'], assume: ['Steady radial conduction; pipe wall resistance negligible; radiation lumped into h.'], limits: [], refs: ['Incropera & DeWitt §3.3.'],
  },
  {
    id: 'radiation', title: 'Radiation Heat Transfer (grey surface)', disc: 'thermo', level: 'uni', tags: ['stefan-boltzmann', 'emissivity', 'radiation', 'blackbody'],
    summary: 'Net radiation exchange between a small grey surface and large surroundings, and the equivalent radiative h.',
    inputs: [I('eps', 'Emissivity', '\\varepsilon', 'none', 0.9), I('A', 'Surface area', 'A', 'area', 1), I('Ts', 'Surface temperature', 'T_s', 'temperature', 373.15, { u: { si: '°C', imperial: '°F' } }), I('Tsur', 'Surroundings temperature', 'T_{sur}', 'temperature', 293.15, { u: { si: '°C', imperial: '°F' } })],
    outputs: [O('q', 'Net radiation', '\\dot Q_{rad}', 'power', { primary: true }), O('E', 'Emissive power', 'E', 'heatflux'), O('hr', 'Radiation coefficient', 'h_r', 'htc')],
    compute({ eps, A, Ts, Tsur }) { const s = C.sigma; return { q: eps * s * A * (Ts ** 4 - Tsur ** 4), E: eps * s * Ts ** 4, hr: eps * s * (Ts + Tsur) * (Ts * Ts + Tsur * Tsur) }; },
    eq: ['\\dot Q = \\varepsilon\\sigma A (T_s^4 - T_{sur}^4)', 'h_r = \\varepsilon\\sigma(T_s + T_{sur})(T_s^2 + T_{sur}^2)'], assume: ['Grey diffuse surface, small relative to large isothermal surroundings.'], limits: ['For two finite surfaces, view factors are needed.'], refs: ['Incropera & DeWitt §1.2, §13.3.'],
  },
  {
    id: 'lumped', title: 'Transient Cooling (lumped capacitance)', disc: 'thermo', level: 'uni', tags: ["newton's law of cooling", 'biot number', 'time constant', 'transient conduction', 'quenching'],
    summary: 'Temperature vs time of a body cooling/heating by convection, with a Biot-number validity check.',
    inputs: [MAT('mat', { rho: 'rho', cp: 'cp', k: 'k' }, 'al-6061-t6'), I('rho', 'Density', '\\rho', 'density', 2700), I('cp', 'Specific heat', 'c_p', 'specheat', 896), I('k', 'Conductivity', 'k', 'thermcond', 167),
      SEL('shape', 'Shape', [['sphere', 'Sphere'], ['cyl', 'Long cylinder'], ['plate', 'Plate (both faces)']], 'sphere'), I('D', 'Diameter / thickness', 'D', 'length', 0.02, { u: { si: 'mm' } }),
      I('h', 'Convection coefficient', 'h', 'htc', 50), I('T0', 'Initial temperature', 'T_0', 'temperature', 473.15, { u: { si: '°C', imperial: '°F' } }), I('Tinf', 'Fluid temperature', 'T_\\infty', 'temperature', 298.15, { u: { si: '°C', imperial: '°F' } }), I('t', 'Time', 't', 'time', 300, { u: { si: 'min' } })],
    outputs: [O('T', 'Temperature at time t', 'T(t)', 'temperature', { primary: true, u: { si: '°C', imperial: '°F' } }), O('tau', 'Time constant', '\\tau', 'time'), O('Bi', 'Biot number', 'Bi', 'none'), O('Q', 'Heat transferred by t (per body)', 'Q', 'energy', { u: { si: 'kJ' } })],
    compute(x) {
      const Lc = x.shape === 'sphere' ? x.D / 6 : x.shape === 'cyl' ? x.D / 4 : x.D / 2;
      const Bi = x.h * Lc / x.k, tau = x.rho * x.cp * Lc / x.h;
      const T = x.Tinf + (x.T0 - x.Tinf) * Math.exp(-x.t / tau);
      const V = x.shape === 'sphere' ? PI * x.D ** 3 / 6 : x.shape === 'cyl' ? PI * x.D ** 2 / 4 : x.D; // per metre length / per m² for plate
      const ts = [], Ts = [];
      for (let i = 0; i <= 80; i++) { const t = Math.max(x.t, 3 * tau) * i / 80; ts.push(t); Ts.push(x.Tinf + (x.T0 - x.Tinf) * Math.exp(-t / tau) - K0); }
      return { T, tau, Bi, Q: x.rho * V * x.cp * (x.T0 - T), _checks: [check('Lumped model valid (Bi < 0.1)', Bi < 0.1, `Bi = ${Bi.toFixed(3)}`)],
        _info: [x.shape === 'sphere' ? 'Q is per sphere.' : x.shape === 'cyl' ? 'Q is per metre of cylinder length.' : 'Q is per m² of plate.'],
        _plot: { series: [{ x: ts, y: Ts, label: 'T(t) °C' }], opts: { xlabel: 't (s)', ylabel: 'T (°C)', marks: [{ x: x.t, label: 't' }] } } };
    },
    eq: ['\\frac{T - T_\\infty}{T_0 - T_\\infty} = e^{-t/\\tau}', '\\tau = \\frac{\\rho c_p L_c}{h},\\; L_c = V/A_s', 'Bi = \\frac{h L_c}{k} < 0.1'], assume: ['Uniform internal temperature (Bi < 0.1).', 'Constant h and properties.'], limits: ['For Bi > 0.1 use one-term series (Heisler) solutions.'], refs: ['Incropera & DeWitt §5.1–5.3.'],
  },
  {
    id: 'lmtd', title: 'Heat Exchanger — LMTD Sizing', disc: 'thermo', level: 'pro', tags: ['heat exchanger', 'lmtd', 'overall heat transfer coefficient', 'counterflow', 'parallel flow', 'area'],
    summary: 'Duty, log-mean temperature difference and required area for a heat exchanger with known terminal temperatures.',
    inputs: [SEL('arr', 'Flow arrangement', [['counter', 'Counterflow'], ['parallel', 'Parallel flow']], 'counter'),
      I('mh', 'Hot-side mass flow', '\\dot m_h', 'massflow', 1.5), I('cph', 'Hot-side c_p', 'c_{p,h}', 'specheat', 4190), I('Thi', 'Hot inlet', 'T_{h,i}', 'temperature', 363.15, { u: { si: '°C', imperial: '°F' } }), I('Tho', 'Hot outlet', 'T_{h,o}', 'temperature', 333.15, { u: { si: '°C', imperial: '°F' } }),
      I('cpc', 'Cold-side c_p', 'c_{p,c}', 'specheat', 4180), I('Tci', 'Cold inlet', 'T_{c,i}', 'temperature', 288.15, { u: { si: '°C', imperial: '°F' } }), I('Tco', 'Cold outlet', 'T_{c,o}', 'temperature', 318.15, { u: { si: '°C', imperial: '°F' } }),
      I('U', 'Overall heat transfer coefficient', 'U', 'htc', 1200, { hint: 'water–water plate HX 3000–7000, shell & tube water–water 800–1500, gas–gas 10–50' }), I('F', 'LMTD correction factor', 'F', 'none', 1, { adv: true })],
    outputs: [O('Q', 'Heat duty', '\\dot Q', 'power', { u: { si: 'kW' } }), O('mc', 'Required cold-side flow', '\\dot m_c', 'massflow'), O('LMTD', 'Log-mean temp. difference', '\\Delta T_{lm}', 'tempdiff'), O('A', 'Required area', 'A', 'area', { primary: true })],
    compute(x) {
      const Q = x.mh * x.cph * (x.Thi - x.Tho), mc = Q / (x.cpc * (x.Tco - x.Tci));
      const [d1, d2] = x.arr === 'counter' ? [x.Thi - x.Tco, x.Tho - x.Tci] : [x.Thi - x.Tci, x.Tho - x.Tco];
      const w = [];
      if (d1 <= 0 || d2 <= 0) w.push('Temperature cross — impossible for this arrangement (a terminal ΔT ≤ 0).');
      const LMTD = Math.abs(d1 - d2) < 1e-9 ? d1 : (d1 - d2) / Math.log(d1 / d2);
      return { Q, mc, LMTD, A: Q / (x.U * x.F * LMTD), _warn: w };
    },
    eq: ['\\dot Q = \\dot m_h c_{p,h}(T_{h,i} - T_{h,o})', '\\Delta T_{lm} = \\frac{\\Delta T_1 - \\Delta T_2}{\\ln(\\Delta T_1/\\Delta T_2)}', 'A = \\frac{\\dot Q}{U F \\Delta T_{lm}}'], assume: ['Steady state, no heat loss to surroundings, constant U and c_p.'], limits: ['Shell-and-tube/crossflow need F < 1 from charts.', 'U must include fouling resistances (TEMA).'],
    refs: ['Incropera & DeWitt §11.3.', 'TEMA Standards (fouling factors).'],
  },
  {
    id: 'entu', title: 'Heat Exchanger — ε-NTU Rating', disc: 'thermo', level: 'pro', tags: ['effectiveness', 'ntu', 'heat exchanger', 'outlet temperature', 'rating'],
    summary: 'Effectiveness, duty and outlet temperatures of a heat exchanger of known UA.',
    inputs: [SEL('arr', 'Arrangement', [['counter', 'Counterflow'], ['parallel', 'Parallel flow'], ['shell', 'Shell & tube (1 shell pass, 2/4/… tube passes)'], ['cross', 'Crossflow, both fluids unmixed']], 'counter'),
      I('mh', 'Hot mass flow', '\\dot m_h', 'massflow', 1), I('cph', 'Hot c_p', 'c_{p,h}', 'specheat', 4190), I('mc', 'Cold mass flow', '\\dot m_c', 'massflow', 1.5), I('cpc', 'Cold c_p', 'c_{p,c}', 'specheat', 4180),
      I('Thi', 'Hot inlet', 'T_{h,i}', 'temperature', 363.15, { u: { si: '°C', imperial: '°F' } }), I('Tci', 'Cold inlet', 'T_{c,i}', 'temperature', 288.15, { u: { si: '°C', imperial: '°F' } }), I('U', 'U', 'U', 'htc', 1200), I('A', 'Area', 'A', 'area', 5)],
    outputs: [O('NTU', 'NTU', 'NTU', 'none'), O('Cr', 'Capacity ratio', 'C_r', 'none'), O('eps', 'Effectiveness', '\\varepsilon', 'none', { u: { si: '%' } }), O('Q', 'Heat duty', '\\dot Q', 'power', { primary: true, u: { si: 'kW' } }), O('Tho', 'Hot outlet', 'T_{h,o}', 'temperature', { u: { si: '°C', imperial: '°F' } }), O('Tco', 'Cold outlet', 'T_{c,o}', 'temperature', { u: { si: '°C', imperial: '°F' } })],
    compute(x) {
      const Ch = x.mh * x.cph, Cc = x.mc * x.cpc, Cmin = Math.min(Ch, Cc), Cr = Cmin / Math.max(Ch, Cc), N = x.U * x.A / Cmin;
      let e;
      if (Cr < 1e-9) e = 1 - Math.exp(-N);
      else switch (x.arr) {
        case 'parallel': e = (1 - Math.exp(-N * (1 + Cr))) / (1 + Cr); break;
        case 'counter': e = Math.abs(Cr - 1) < 1e-9 ? N / (1 + N) : (1 - Math.exp(-N * (1 - Cr))) / (1 - Cr * Math.exp(-N * (1 - Cr))); break;
        case 'shell': { const s = Math.sqrt(1 + Cr * Cr), E = Math.exp(-N * s); e = 2 / (1 + Cr + s * (1 + E) / (1 - E)); break; }
        case 'cross': e = 1 - Math.exp((1 / Cr) * Math.pow(N, 0.22) * (Math.exp(-Cr * Math.pow(N, 0.78)) - 1)); break;
      }
      const Q = e * Cmin * (x.Thi - x.Tci);
      return { NTU: N, Cr, eps: e, Q, Tho: x.Thi - Q / Ch, Tco: x.Tci + Q / Cc };
    },
    eq: ['NTU = \\frac{UA}{C_{min}},\\; C_r = \\frac{C_{min}}{C_{max}}', '\\varepsilon_{counter} = \\frac{1 - e^{-NTU(1-C_r)}}{1 - C_r e^{-NTU(1-C_r)}}', '\\dot Q = \\varepsilon C_{min}(T_{h,i} - T_{c,i})'],
    assume: ['Steady state, constant properties and U, no losses.'], limits: ['Crossflow (unmixed) relation is an approximation (Incropera Eq. 11.32).'], refs: ['Incropera & DeWitt, Table 11.3.'],
  },
  {
    id: 'carnot', title: 'Carnot Limits (engine, fridge, heat pump)', disc: 'thermo', level: 'school', tags: ['carnot efficiency', 'cop', 'second law', 'heat engine', 'refrigerator', 'heat pump'],
    summary: 'Maximum possible thermal efficiency and COPs between two reservoirs.',
    inputs: [I('TH', 'Hot reservoir', 'T_H', 'temperature', 873.15, { u: { si: '°C', imperial: '°F' } }), I('TC', 'Cold reservoir', 'T_C', 'temperature', 298.15, { u: { si: '°C', imperial: '°F' } }), I('Q', 'Heat input (engine)', 'Q_H', 'energy', 1000e3, { u: { si: 'kJ' }, adv: true })],
    outputs: [O('eta', 'Carnot efficiency', '\\eta_C', 'none', { primary: true, u: { si: '%' } }), O('copR', 'Carnot COP (refrigerator)', 'COP_R', 'none'), O('copHP', 'Carnot COP (heat pump)', 'COP_{HP}', 'none'), O('W', 'Max work from Q_H', 'W_{max}', 'energy', { u: { si: 'kJ' } })],
    compute({ TH, TC, Q }) { const eta = 1 - TC / TH; return { eta, copR: TC / (TH - TC), copHP: TH / (TH - TC), W: eta * Q }; },
    eq: ['\\eta_C = 1 - \\frac{T_C}{T_H}', 'COP_R = \\frac{T_C}{T_H - T_C}', 'COP_{HP} = \\frac{T_H}{T_H - T_C}'], assume: ['Reversible cycle; absolute temperatures.'], limits: ['Real devices reach typically 30–70 % of Carnot.'], refs: ['Çengel & Boles §6-10.'],
  },
  {
    id: 'otto', title: 'Otto Cycle (air-standard)', disc: 'thermo', level: 'uni', tags: ['otto cycle', 'petrol engine', 'compression ratio', 'thermal efficiency', 'mep', 'p-v diagram'],
    summary: 'State points, efficiency, net work and mean effective pressure for the ideal air-standard Otto cycle.',
    inputs: [I('r', 'Compression ratio', 'r', 'none', 10), I('g', 'Heat capacity ratio', '\\gamma', 'none', 1.4), I('R', 'Gas constant', 'R', 'specheat', 287.05, { adv: true }), I('T1', 'Intake temperature', 'T_1', 'temperature', 300, { u: { si: '°C' } }), I('p1', 'Intake pressure', 'p_1', 'pressure', 100e3, { u: { si: 'kPa' } }), I('qin', 'Heat added per kg', 'q_{in}', 'specenergy', 1800e3, { u: { si: 'kJ/kg' } })],
    outputs: [O('eta', 'Thermal efficiency', '\\eta', 'none', { primary: true, u: { si: '%' } }), O('T2', 'T₂ (after compression)', 'T_2', 'temperature', { u: { si: '°C' } }), O('T3', 'T₃ (peak)', 'T_3', 'temperature', { u: { si: '°C' } }), O('p3', 'Peak pressure', 'p_3', 'pressure', { u: { si: 'MPa' } }), O('T4', 'T₄', 'T_4', 'temperature', { u: { si: '°C' } }), O('w', 'Net work per kg', 'w_{net}', 'specenergy', { u: { si: 'kJ/kg' } }), O('mep', 'Mean effective pressure', 'MEP', 'pressure', { u: { si: 'kPa' } })],
    compute({ r, g, R, T1, p1, qin }) {
      const cv = R / (g - 1), v1 = R * T1 / p1, v2 = v1 / r;
      const T2 = T1 * r ** (g - 1), p2 = p1 * r ** g, T3 = T2 + qin / cv, p3 = p2 * T3 / T2, T4 = T3 / r ** (g - 1), p4 = p3 / r ** g;
      const eta = 1 - r ** (1 - g), w = eta * qin;
      const V = [], P = [];
      for (let i = 0; i <= 40; i++) { const v = v1 - (v1 - v2) * i / 40; V.push(v); P.push(p1 * (v1 / v) ** g); }
      V.push(v2); P.push(p3);
      for (let i = 0; i <= 40; i++) { const v = v2 + (v1 - v2) * i / 40; V.push(v); P.push(p3 * (v2 / v) ** g); }
      V.push(v1); P.push(p1);
      return { eta, T2, T3, p3, T4, w, mep: w / (v1 - v2), _plot: { series: [{ x: V, y: P.map(p => p / 1e3), label: 'Otto cycle 1-2-3-4', type: 'area' }], opts: { xlabel: 'v (m³/kg)', ylabel: 'p (kPa)', logy: true } } };
    },
    eq: ['\\eta = 1 - \\frac{1}{r^{\\gamma - 1}}', 'T_2 = T_1 r^{\\gamma-1},\\; T_3 = T_2 + \\frac{q_{in}}{c_v}', 'MEP = \\frac{w_{net}}{v_1 - v_2}'], assume: ['Air-standard: ideal gas, constant specific heats, reversible processes, heat addition at constant volume.'], limits: ['Real SI engines reach ~25–38 % brake efficiency.'], refs: ['Çengel & Boles §9-5.'],
  },
  {
    id: 'diesel', title: 'Diesel Cycle (air-standard)', disc: 'thermo', level: 'uni', tags: ['diesel cycle', 'cut-off ratio', 'compression ignition', 'efficiency'],
    summary: 'Efficiency and state temperatures for the ideal Diesel cycle.',
    inputs: [I('r', 'Compression ratio', 'r', 'none', 18), I('rc', 'Cut-off ratio', 'r_c', 'none', 2), I('g', 'Heat capacity ratio', '\\gamma', 'none', 1.4), I('R', 'Gas constant', 'R', 'specheat', 287.05, { adv: true }), I('T1', 'Intake temperature', 'T_1', 'temperature', 300, { u: { si: '°C' } }), I('p1', 'Intake pressure', 'p_1', 'pressure', 100e3, { u: { si: 'kPa' } })],
    outputs: [O('eta', 'Thermal efficiency', '\\eta', 'none', { primary: true, u: { si: '%' } }), O('T2', 'T₂', 'T_2', 'temperature', { u: { si: '°C' } }), O('T3', 'T₃', 'T_3', 'temperature', { u: { si: '°C' } }), O('T4', 'T₄', 'T_4', 'temperature', { u: { si: '°C' } }), O('qin', 'Heat added', 'q_{in}', 'specenergy', { u: { si: 'kJ/kg' } }), O('w', 'Net work', 'w_{net}', 'specenergy', { u: { si: 'kJ/kg' } }), O('mep', 'MEP', 'MEP', 'pressure', { u: { si: 'kPa' } })],
    compute({ r, rc, g, R, T1, p1 }) {
      const cp = g * R / (g - 1), T2 = T1 * r ** (g - 1), T3 = T2 * rc, T4 = T3 * (rc / r) ** (g - 1);
      const eta = 1 - (1 / r ** (g - 1)) * (rc ** g - 1) / (g * (rc - 1)), qin = cp * (T3 - T2), w = eta * qin, v1 = R * T1 / p1;
      return { eta, T2, T3, T4, qin, w, mep: w / (v1 - v1 / r) };
    },
    eq: ['\\eta = 1 - \\frac{1}{r^{\\gamma-1}}\\left[\\frac{r_c^\\gamma - 1}{\\gamma(r_c - 1)}\\right]'], assume: ['Air-standard; heat addition at constant pressure.'], limits: [], refs: ['Çengel & Boles §9-6.'],
  },
  {
    id: 'brayton', title: 'Brayton Cycle (gas turbine)', disc: 'thermo', level: 'uni', tags: ['gas turbine', 'brayton', 'pressure ratio', 'back work ratio', 'jet engine', 'compressor', 'turbine'],
    summary: 'Simple gas-turbine cycle with compressor and turbine isentropic efficiencies.',
    inputs: [I('rp', 'Pressure ratio', 'r_p', 'none', 12), I('T1', 'Compressor inlet', 'T_1', 'temperature', 288.15, { u: { si: '°C' } }), I('T3', 'Turbine inlet', 'T_3', 'temperature', 1400, { u: { si: '°C' } }), I('ec', 'Compressor isentropic eff.', '\\eta_c', 'none', 0.85), I('et', 'Turbine isentropic eff.', '\\eta_t', 'none', 0.88),
      I('cp', 'c_p', 'c_p', 'specheat', 1005, { adv: true }), I('g', 'γ', '\\gamma', 'none', 1.4, { adv: true }), I('P', 'Net power required', 'P', 'power', 10e6, { u: { si: 'MW' }, adv: true })],
    outputs: [O('eta', 'Thermal efficiency', '\\eta', 'none', { primary: true, u: { si: '%' } }), O('etai', 'Ideal efficiency', '\\eta_{ideal}', 'none', { u: { si: '%' } }), O('T2', 'Compressor exit', 'T_2', 'temperature', { u: { si: '°C' } }), O('T4', 'Turbine exit', 'T_4', 'temperature', { u: { si: '°C' } }), O('wc', 'Compressor work', 'w_c', 'specenergy', { u: { si: 'kJ/kg' } }), O('wt', 'Turbine work', 'w_t', 'specenergy', { u: { si: 'kJ/kg' } }), O('wn', 'Net work', 'w_{net}', 'specenergy', { u: { si: 'kJ/kg' } }), O('bwr', 'Back-work ratio', 'r_{bw}', 'none', { u: { si: '%' } }), O('m', 'Mass flow for P', '\\dot m', 'massflow')],
    compute(x) {
      const k = (x.g - 1) / x.g, T2s = x.T1 * x.rp ** k, T2 = x.T1 + (T2s - x.T1) / x.ec, T4s = x.T3 / x.rp ** k, T4 = x.T3 - x.et * (x.T3 - T4s);
      const wc = x.cp * (T2 - x.T1), wt = x.cp * (x.T3 - T4), wn = wt - wc, qin = x.cp * (x.T3 - T2);
      return { eta: wn / qin, etai: 1 - 1 / x.rp ** k, T2, T4, wc, wt, wn, bwr: wc / wt, m: x.P / wn, _warn: wn <= 0 ? ['Net work ≤ 0 — cycle cannot produce power at these conditions.'] : [] };
    },
    eq: ['T_{2s} = T_1 r_p^{(\\gamma-1)/\\gamma}', 'T_2 = T_1 + \\frac{T_{2s} - T_1}{\\eta_c}', 'T_4 = T_3 - \\eta_t(T_3 - T_{4s})', '\\eta = \\frac{w_t - w_c}{c_p(T_3 - T_2)}'], assume: ['Cold-air standard: constant c_p, no pressure losses, fuel mass neglected.'], limits: [], refs: ['Çengel & Boles §9-8, 9-9.'],
  },
  {
    id: 'rankine', title: 'Rankine Cycle (from steam-table enthalpies)', disc: 'thermo', level: 'uni', tags: ['rankine', 'steam turbine', 'power plant', 'pump work', 'boiler'],
    summary: 'Thermal efficiency, work and heat of a simple Rankine cycle from state enthalpies (read from steam tables).',
    inputs: [I('h1', 'h₁ — sat. liquid at condenser', 'h_1', 'specenergy', 191.81e3, { u: { si: 'kJ/kg' } }), I('v1', 'v₁ — specific volume at 1', 'v_1', 'specvol', 0.00101), I('pL', 'Condenser pressure', 'p_L', 'pressure', 10e3, { u: { si: 'kPa' } }), I('pH', 'Boiler pressure', 'p_H', 'pressure', 8e6, { u: { si: 'MPa' } }),
      I('h3', 'h₃ — turbine inlet', 'h_3', 'specenergy', 3348.4e3, { u: { si: 'kJ/kg' } }), I('h4s', 'h₄s — isentropic turbine exit', 'h_{4s}', 'specenergy', 2108.9e3, { u: { si: 'kJ/kg' } }), I('et', 'Turbine isentropic efficiency', '\\eta_t', 'none', 0.85), I('ep', 'Pump isentropic efficiency', '\\eta_p', 'none', 0.85), I('P', 'Net power', 'P', 'power', 100e6, { u: { si: 'MW' }, adv: true })],
    outputs: [O('eta', 'Thermal efficiency', '\\eta', 'none', { primary: true, u: { si: '%' } }), O('wp', 'Pump work', 'w_p', 'specenergy', { u: { si: 'kJ/kg' } }), O('wt', 'Turbine work', 'w_t', 'specenergy', { u: { si: 'kJ/kg' } }), O('qin', 'Boiler heat', 'q_{in}', 'specenergy', { u: { si: 'kJ/kg' } }), O('qout', 'Condenser heat', 'q_{out}', 'specenergy', { u: { si: 'kJ/kg' } }), O('m', 'Steam flow for P', '\\dot m', 'massflow'), O('bwr', 'Back-work ratio', 'r_{bw}', 'none', { u: { si: '%' } })],
    compute(x) {
      const wp = x.v1 * (x.pH - x.pL) / x.ep, h2 = x.h1 + wp, wt = x.et * (x.h3 - x.h4s), qin = x.h3 - h2;
      return { wp, wt, qin, qout: qin - (wt - wp), eta: (wt - wp) / qin, m: x.P / (wt - wp), bwr: wp / wt, _info: ['Defaults: 8 MPa/480 °C turbine inlet, 10 kPa condenser (steam-table values). Look up h and s for your own states in IAPWS-IF97 tables.'] };
    },
    eq: ['w_p = \\frac{v_1(p_H - p_L)}{\\eta_p}', 'w_t = \\eta_t(h_3 - h_{4s})', 'q_{in} = h_3 - h_2', '\\eta = \\frac{w_t - w_p}{q_{in}}'], assume: ['Steady flow; negligible KE/PE changes; no pressure losses in boiler/condenser.'], limits: ['Enthalpies must come from real steam tables; this tool does not yet compute superheated properties.'], refs: ['Çengel & Boles §10-2; IAPWS-IF97.'],
  },
  {
    id: 'refrigeration', title: 'Vapour-Compression Refrigeration', disc: 'hvac', level: 'uni', tags: ['cop', 'refrigeration', 'heat pump', 'compressor', 'cooling capacity', 'refrigerant', 'tons'],
    summary: 'COP, capacity and compressor power from refrigerant state enthalpies, compared with the Carnot limit.',
    inputs: [I('h1', 'h₁ — evaporator exit (compressor inlet)', 'h_1', 'specenergy', 239.16e3, { u: { si: 'kJ/kg' } }), I('h2', 'h₂ — compressor exit', 'h_2', 'specenergy', 275.39e3, { u: { si: 'kJ/kg' } }), I('h3', 'h₃ = h₄ — condenser exit', 'h_3', 'specenergy', 95.47e3, { u: { si: 'kJ/kg' } }),
      I('m', 'Refrigerant mass flow', '\\dot m', 'massflow', 0.05), I('TL', 'Evaporating temperature', 'T_L', 'temperature', 254.39, { u: { si: '°C' }, adv: true }), I('TH', 'Condensing temperature', 'T_H', 'temperature', 304.54, { u: { si: '°C' }, adv: true })],
    outputs: [O('QL', 'Cooling capacity', '\\dot Q_L', 'power', { u: { si: 'kW', imperial: 'TR (refrig. ton)' } }), O('W', 'Compressor power', '\\dot W', 'power', { u: { si: 'kW' } }), O('QH', 'Heat rejected', '\\dot Q_H', 'power', { u: { si: 'kW' } }), O('COP', 'COP (cooling)', 'COP_R', 'none', { primary: true }), O('COPhp', 'COP (heating)', 'COP_{HP}', 'none'), O('COPc', 'Carnot COP', 'COP_{Carnot}', 'none'), O('eta2', 'Second-law efficiency', '\\eta_{II}', 'none', { u: { si: '%' } })],
    compute(x) { const qL = x.h1 - x.h3, w = x.h2 - x.h1, COP = qL / w, COPc = x.TL / (x.TH - x.TL); return { QL: x.m * qL, W: x.m * w, QH: x.m * (x.h2 - x.h3), COP, COPhp: COP + 1, COPc, eta2: COP / COPc, _info: ['Defaults: R-134a between 0.14 and 0.8 MPa (textbook example).'] }; },
    eq: ['COP_R = \\frac{h_1 - h_4}{h_2 - h_1}', '\\dot Q_L = \\dot m(h_1 - h_4)', 'h_4 = h_3\\;\\text{(throttling)}'], assume: ['Steady flow; isenthalpic expansion; no line losses.'], limits: [], refs: ['Çengel & Boles §11-3.'],
  },
  {
    id: 'engine', title: 'IC Engine Performance', disc: 'thermo', level: 'pro', tags: ['bmep', 'bsfc', 'displacement', 'brake power', 'volumetric efficiency', 'engine', 'piston speed'],
    summary: 'Displacement, brake power, BMEP, BSFC, brake thermal efficiency, volumetric efficiency and mean piston speed.',
    inputs: [I('B', 'Bore', 'B', 'length', 0.086, { u: { si: 'mm' } }), I('S', 'Stroke', 'S', 'length', 0.086, { u: { si: 'mm' } }), I('z', 'Cylinders', 'z', 'none', 4), SEL('st', 'Cycle', [['2', '4-stroke'], ['1', '2-stroke']], '2'),
      I('n', 'Engine speed', 'n', 'angvel', 5500 * 2 * PI / 60), I('T', 'Brake torque', 'T', 'torque', 190), I('mf', 'Fuel mass flow', '\\dot m_f', 'massflow', 18 / 3600, { u: { si: 'kg/h' } }), I('LHV', 'Fuel lower heating value', 'Q_{LHV}', 'specenergy', 43e6, { u: { si: 'MJ/kg' }, hint: 'gasoline ≈ 43–44, diesel ≈ 42.6–43 MJ/kg' }),
      I('ma', 'Air mass flow', '\\dot m_a', 'massflow', 250 / 3600, { u: { si: 'kg/h' }, adv: true }), I('rhoa', 'Ambient air density', '\\rho_a', 'density', 1.184, { adv: true })],
    outputs: [O('Vd', 'Displacement', 'V_d', 'volume', { u: { si: 'L' } }), O('P', 'Brake power', 'P_b', 'power', { primary: true, u: { si: 'kW', imperial: 'hp' } }), O('bmep', 'BMEP', 'BMEP', 'pressure', { u: { si: 'bar', imperial: 'psi' } }), O('bsfc', 'BSFC', 'BSFC', 'fuelcons', { u: { si: 'g/kWh', imperial: 'lb/(hp·h)' } }), O('eta', 'Brake thermal efficiency', '\\eta_b', 'none', { u: { si: '%' } }), O('etav', 'Volumetric efficiency', '\\eta_v', 'none', { u: { si: '%' } }), O('afr', 'Air–fuel ratio', 'AFR', 'none'), O('Up', 'Mean piston speed', '\\bar U_p', 'velocity')],
    compute(x) {
      const nR = parseFloat(x.st), Vd = PI / 4 * x.B ** 2 * x.S * x.z, P = x.T * x.n, rps = x.n / (2 * PI);
      const bmep = 2 * PI * nR * x.T / Vd, Up = 2 * x.S * rps;
      const w = Up > 25 ? ['Mean piston speed > 25 m/s — unusually high (race engines ~25).'] : [];
      return { Vd, P, bmep, bsfc: x.mf / P, eta: P / (x.mf * x.LHV), etav: x.ma / (x.rhoa * Vd * rps / nR), afr: x.ma / x.mf, Up, _warn: w };
    },
    eq: ['V_d = \\frac{\\pi}{4}B^2 S z', 'P_b = 2\\pi N T', 'BMEP = \\frac{2\\pi n_R T}{V_d}', 'BSFC = \\frac{\\dot m_f}{P_b}', '\\eta_b = \\frac{P_b}{\\dot m_f Q_{LHV}}', '\\eta_v = \\frac{\\dot m_a}{\\rho_a V_d N/n_R}'], assume: ['Steady-state operating point.'], limits: [], refs: ['Heywood, Internal Combustion Engine Fundamentals, ch. 2.'],
  },
  {
    id: 'psychro', title: 'Psychrometrics (moist air)', disc: 'hvac', level: 'pro', tags: ['humidity ratio', 'dew point', 'wet bulb', 'relative humidity', 'enthalpy', 'psychrometric chart'],
    summary: 'Humidity ratio, dew point, wet-bulb temperature, enthalpy and specific volume of moist air.',
    inputs: [I('T', 'Dry-bulb temperature', 'T_{db}', 'temperature', 298.15, { u: { si: '°C', imperial: '°F' } }), I('RH', 'Relative humidity', '\\phi', 'none', 0.5, { u: { si: '%' } }), I('p', 'Atmospheric pressure', 'p', 'pressure', 101325, { u: { si: 'kPa', imperial: 'psi' } })],
    outputs: [O('W', 'Humidity ratio', 'W', 'none', { primary: true, note: 'kg water / kg dry air' }), O('Wg', 'Humidity ratio', 'W', 'none', { note: 'g/kg' }), O('Td', 'Dew point', 'T_{dp}', 'temperature', { u: { si: '°C', imperial: '°F' } }), O('Tw', 'Wet-bulb temperature', 'T_{wb}', 'temperature', { u: { si: '°C', imperial: '°F' } }), O('h', 'Specific enthalpy', 'h', 'specenergy', { u: { si: 'kJ/kg', imperial: 'BTU/lb' }, note: 'per kg dry air' }), O('v', 'Specific volume', 'v', 'specvol', { note: 'per kg dry air' }), O('pv', 'Vapour partial pressure', 'p_v', 'pressure', { u: { si: 'kPa' } }), O('ps', 'Saturation pressure', 'p_{ws}', 'pressure', { u: { si: 'kPa' } })],
    compute({ T, RH, p }) {
      const Tc = T - K0, r = psychro(Tc, RH, p);
      const w = (Tc < -20 || Tc > 50 || RH < 0.05) ? ['Wet-bulb (Stull 2011) is fitted for −20…50 °C and RH 5–99 %.'] : [];
      return { W: r.W, Wg: r.W * 1e3, Td: r.Td + K0, Tw: r.Tw + K0, h: r.h, v: r.v, pv: r.pvap, ps: r.es, _warn: w };
    },
    eq: ['p_{ws} = 610.94\\exp\\left(\\frac{17.625\\,T}{T + 243.04}\\right)', 'W = 0.621945\\frac{p_v}{p - p_v}', 'h = 1.006T + W(2501 + 1.86T)\\;\\text{kJ/kg}', 'v = \\frac{R_a T(1 + 1.6078W)}{p}'],
    assume: ['Moist air as ideal-gas mixture.', 'Magnus saturation formula (Alduchov & Eskridge 1996), ±0.1 % from −40 to 50 °C over water.', 'Wet-bulb from Stull (2011) empirical fit, ±0.3 °C.'],
    limits: ['For high-accuracy work use the ASHRAE Hyland–Wexler formulation (ASHRAE Handbook — Fundamentals, ch. 1).'], refs: ['Alduchov & Eskridge, J. Appl. Meteor. 35 (1996).', 'Stull, J. Appl. Meteor. Climatol. 50 (2011).', 'ASHRAE Handbook — Fundamentals, ch. 1.'],
  },
  {
    id: 'hvac-load', title: 'Air-Side Sensible & Latent Load', disc: 'hvac', level: 'pro', tags: ['cooling load', 'sensible heat', 'latent heat', 'shr', 'airflow', 'tonnage', 'ahu'],
    summary: 'Sensible, latent and total load for an airflow across a coil, sensible heat ratio and refrigeration tons.',
    inputs: [I('V', 'Airflow', '\\dot V', 'flow', 1.0, { u: { si: 'm³/s', metric: 'm³/h', imperial: 'cfm' } }), I('rho', 'Air density', '\\rho', 'density', 1.2), I('T1', 'Entering dry-bulb', 'T_1', 'temperature', 300.15, { u: { si: '°C', imperial: '°F' } }), I('T2', 'Leaving dry-bulb', 'T_2', 'temperature', 286.15, { u: { si: '°C', imperial: '°F' } }),
      I('W1', 'Entering humidity ratio', 'W_1', 'none', 0.0112, { hint: 'kg/kg — use the Psychrometrics calculator' }), I('W2', 'Leaving humidity ratio', 'W_2', 'none', 0.0085)],
    outputs: [O('Qs', 'Sensible load', '\\dot Q_s', 'power', { u: { si: 'kW', imperial: 'BTU/h' } }), O('Ql', 'Latent load', '\\dot Q_l', 'power', { u: { si: 'kW', imperial: 'BTU/h' } }), O('Qt', 'Total load', '\\dot Q_t', 'power', { primary: true, u: { si: 'kW', imperial: 'BTU/h' } }), O('tons', 'Total load', '', 'power', { u: { si: 'TR (refrig. ton)', metric: 'TR (refrig. ton)', imperial: 'TR (refrig. ton)' } }), O('SHR', 'Sensible heat ratio', 'SHR', 'none'), O('cond', 'Condensate', '\\dot m_w', 'massflow', { u: { si: 'kg/h' } })],
    compute(x) { const m = x.rho * x.V, Wm = (x.W1 + x.W2) / 2, Qs = m * (1006 + 1860 * Wm) * (x.T1 - x.T2), Ql = m * 2501e3 * (x.W1 - x.W2), Qt = Qs + Ql; return { Qs, Ql, Qt, tons: Qt, SHR: Qs / Qt, cond: m * (x.W1 - x.W2) }; },
    eq: ['\\dot Q_s = \\dot m (c_{pa} + W c_{pv})\\Delta T', '\\dot Q_l = \\dot m\\, h_{fg}\\,\\Delta W', 'SHR = \\dot Q_s / \\dot Q_t'], assume: ['Mass flow of dry air ≈ ρV̇; h_fg = 2501 kJ/kg.'], limits: ['Building heat-gain calculations (envelope, solar, occupants) need ASHRAE RTS/CLTD methods.'], refs: ['ASHRAE Handbook — Fundamentals, ch. 1 & 18.'],
  },
  {
    id: 'duct', title: 'Duct Sizing (round & equivalent rectangular)', disc: 'hvac', level: 'pro', tags: ['duct', 'velocity', 'pressure drop', 'equivalent diameter', 'huebscher', 'ventilation'],
    summary: 'Round duct diameter for a target velocity, friction loss per metre, and equivalent rectangular duct.',
    inputs: [I('Q', 'Airflow', 'Q', 'flow', 0.5, { u: { si: 'm³/s', metric: 'm³/h', imperial: 'cfm' } }), I('v', 'Target velocity', 'v', 'velocity', 5, { hint: 'low-velocity supply 4–6 m/s, mains 6–9 m/s' }), I('ar', 'Rectangular aspect ratio (a/b)', 'a/b', 'none', 2), I('eps', 'Duct roughness', '\\varepsilon', 'length', 0.09e-3, { u: { si: 'mm' }, adv: true, hint: 'galvanised steel ≈ 0.09 mm' }), I('T', 'Air temperature', 'T', 'temperature', 293.15, { u: { si: '°C' }, adv: true })],
    outputs: [O('D', 'Round duct diameter', 'D', 'length', { primary: true, u: { si: 'mm', imperial: 'in' } }), O('dpL', 'Friction loss', '\\Delta p/L', 'pressure', { note: 'per metre', u: { si: 'Pa' } }), O('a', 'Equivalent rectangular — long side', 'a', 'length', { u: { si: 'mm', imperial: 'in' } }), O('b', 'Equivalent rectangular — short side', 'b', 'length', { u: { si: 'mm', imperial: 'in' } }), O('Re', 'Reynolds number', 'Re', 'none')],
    compute(x) {
      const D = Math.sqrt(4 * x.Q / (PI * x.v)), a0 = air(x.T - K0), Re = a0.rho * x.v * D / a0.mu, f = colebrook(Re, x.eps / D);
      const dpL = f / D * a0.rho * x.v * x.v / 2;
      // Huebscher: De = 1.30 (ab)^0.625 / (a+b)^0.25 → solve b with a = ar·b
      const De = bb => 1.30 * Math.pow(x.ar * bb * bb, 0.625) / Math.pow((x.ar + 1) * bb, 0.25);
      const b = D / De(1);
      return { D, dpL, a: x.ar * b, b, Re };
    },
    eq: ['D = \\sqrt{\\frac{4Q}{\\pi v}}', 'D_e = \\frac{1.30(ab)^{0.625}}{(a+b)^{0.25}}', '\\frac{\\Delta p}{L} = \\frac{f}{D}\\frac{\\rho v^2}{2}'], assume: ['Air properties at the given temperature, 1 atm; Colebrook friction.'], limits: ['Fittings losses not included (use ASHRAE fitting database).'], refs: ['ASHRAE Handbook — Fundamentals, ch. 21 (Huebscher equivalent diameter).'],
  },
  {
    id: 'steam-sat', title: 'Water/Steam Saturation (IAPWS-IF97)', disc: 'thermo', level: 'pro', tags: ['steam', 'saturation pressure', 'boiling point', 'iapws', 'if97', 'vapour pressure'],
    summary: 'Saturation pressure from temperature, or saturation temperature from pressure, for water using the IAPWS-IF97 Region 4 equations.',
    inputs: [SEL('mode', 'Find', [['p', 'Saturation pressure from temperature'], ['T', 'Saturation temperature from pressure']], 'p'), I('T', 'Temperature', 'T', 'temperature', 373.15, { u: { si: '°C', imperial: '°F' }, showIf: v => v.mode === 'p' }), I('p', 'Pressure (absolute)', 'p', 'pressure', 101325, { u: { si: 'kPa', imperial: 'psi' }, showIf: v => v.mode === 'T' })],
    outputs: [O('psat', 'Saturation pressure', 'p_{sat}', 'pressure', { u: { si: 'kPa', imperial: 'psi' } }), O('Tsat', 'Saturation temperature', 'T_{sat}', 'temperature', { primary: true, u: { si: '°C', imperial: '°F' } })],
    compute(x) {
      const w = [];
      if (x.mode === 'p') { if (x.T < 273.15 || x.T > 647.096) w.push('IF97 Region 4 valid for 273.15–647.096 K.'); return { psat: psatIF97(x.T), Tsat: x.T, _warn: w }; }
      if (x.p < 611.213 || x.p > 22.064e6) w.push('IF97 Region 4 valid for 611.213 Pa – 22.064 MPa.');
      return { psat: x.p, Tsat: tsatIF97(x.p), _warn: w };
    },
    eq: ['\\beta^2\\vartheta^2 + n_1\\beta^2\\vartheta + n_2\\beta^2 + n_3\\beta\\vartheta^2 + n_4\\beta\\vartheta + n_5\\beta + n_6\\vartheta^2 + n_7\\vartheta + n_8 = 0', '\\beta = (p/p^*)^{1/4},\\; \\vartheta = \\frac{T}{T^*} + \\frac{n_9}{T/T^* - n_{10}}'],
    assume: ['IAPWS Industrial Formulation 1997, Region 4 (saturation line).'], limits: ['Superheated/compressed properties (h, s, v) are on the roadmap (IF97 Regions 1–3, 5).'], refs: ['IAPWS R7-97(2012) Revised Release on the IAPWS Industrial Formulation 1997.'],
  },
];
