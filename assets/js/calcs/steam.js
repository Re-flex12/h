// Water/steam calculators built on the full IAPWS-IF97 formulation.
import { I, O, SEL, check } from './_h.js';
import { steamPT, steamPH, steamPS, steamPX, steamTX, satP, dome, PC, TC } from '../data/if97.js';

const K0 = 273.15;
const PHASE = { 1: 'Compressed liquid (Region 1)', 2: 'Superheated vapour (Region 2)', 3: 'Near-critical / supercritical (Region 3)', 4: 'Wet steam — two-phase (Region 4)', 5: 'High-temperature steam (Region 5)' };
const kJ = { u: { si: 'kJ/kg', imperial: 'BTU/lb' } }, kJK = { u: { si: 'kJ/(kg·K)', imperial: 'BTU/(lb·°F)' } };
const Tu = { u: { si: '°C', imperial: '°F' } }, pu = (si) => ({ u: { si, imperial: 'psi' } });

// Saturation dome series for T–s charts (T in °C, s in kJ/kg·K).
function domeTs() {
  const d = dome(70);
  return { x: [...d.map(p => p.sf / 1e3), ...d.slice().reverse().map(p => p.sg / 1e3)], y: [...d.map(p => p.T - K0), ...d.slice().reverse().map(p => p.T - K0)], label: 'Saturation dome', color: 'var(--ink3)', dash: '4 3', width: 1.5 };
}
// Constant-pressure line on T–s between two temperatures (passes through the dome horizontally).
function isobarTs(p, Ta, Tb, n = 40) {
  const xs = [], ys = [];
  const Ts = p < PC ? satP(p).T : NaN;
  for (let i = 0; i <= n; i++) {
    const T = Ta + (Tb - Ta) * i / n;
    if (Number.isFinite(Ts) && Math.abs(T - Ts) < 1e-6) continue;
    const st = steamPT(p, T);
    if (st) { xs.push(st.s / 1e3); ys.push(T - K0); }
  }
  if (Number.isFinite(Ts) && Ts > Ta && Ts < Tb) {
    const sat = satP(p);
    // insert the flat two-phase segment in order
    const idx = ys.findIndex(y => y > Ts - K0);
    xs.splice(idx, 0, sat.liq.s / 1e3, sat.vap.s / 1e3); ys.splice(idx, 0, Ts - K0, Ts - K0);
  }
  return { xs, ys };
}

function state(x) {
  switch (x.mode) {
    case 'pT': return steamPT(x.p, x.T);
    case 'ph': return steamPH(x.p, x.h);
    case 'ps': return steamPS(x.p, x.s);
    case 'px': return x.p < PC ? steamPX(x.p, x.x) : null;
    case 'Tx': return x.T < TC ? steamTX(x.T, x.x) : null;
  }
  return null;
}

export default [
  {
    id: 'steam-props', title: 'Steam Tables — Water/Steam Properties (IAPWS-IF97)', disc: 'thermo', level: 'pro',
    tags: ['steam tables', 'superheated steam', 'compressed liquid', 'enthalpy', 'entropy', 'quality', 'dryness fraction', 'iapws', 'if97', 'mollier', 'specific volume'],
    summary: 'Full water/steam properties from any common pair: (p, T), (p, h), (p, s), (p, x) or (T, x). Covers compressed liquid, wet steam, superheated and supercritical states and high-temperature steam up to 2000 °C.',
    inputs: [
      SEL('mode', 'Known pair', [['pT', 'Pressure & temperature'], ['ph', 'Pressure & enthalpy'], ['ps', 'Pressure & entropy'], ['px', 'Pressure & quality'], ['Tx', 'Temperature & quality']], 'pT'),
      I('p', 'Pressure (absolute)', 'p', 'pressure', 1e6, { ...pu('bar'), showIf: v => v.mode !== 'Tx' }),
      I('T', 'Temperature', 'T', 'temperature', 573.15, { ...Tu, showIf: v => v.mode === 'pT' || v.mode === 'Tx' }),
      I('h', 'Specific enthalpy', 'h', 'specenergy', 2800e3, { ...kJ, showIf: v => v.mode === 'ph' }),
      I('s', 'Specific entropy', 's', 'specheat', 6.5e3, { ...kJK, showIf: v => v.mode === 'ps' }),
      I('x', 'Quality (dryness fraction)', 'x', 'none', 0.9, { showIf: v => v.mode === 'px' || v.mode === 'Tx', min: 0, max: 1 }),
    ],
    outputs: [
      O('Tout', 'Temperature', 'T', 'temperature', { ...Tu }), O('pout', 'Pressure', 'p', 'pressure', { ...pu('bar') }),
      O('hout', 'Specific enthalpy', 'h', 'specenergy', { primary: true, ...kJ }), O('sout', 'Specific entropy', 's', 'specheat', kJK),
      O('xout', 'Quality', 'x', 'none', { optional: true }), O('v', 'Specific volume', 'v', 'specvol'), O('rho', 'Density', '\\rho', 'density'),
      O('u', 'Internal energy', 'u', 'specenergy', kJ), O('cp', 'Isobaric heat capacity', 'c_p', 'specheat', { ...kJK, optional: true }),
      O('cv', 'Isochoric heat capacity', 'c_v', 'specheat', { ...kJK, optional: true }), O('w', 'Speed of sound', 'w', 'velocity', { optional: true }),
      O('Tsat', 'Saturation temperature at p', 'T_{sat}', 'temperature', { ...Tu, optional: true }), O('super', 'Degree of superheat / subcooling', '\\Delta T', 'tempdiff', { optional: true }),
    ],
    compute(x) {
      const w = [], info = [];
      if ((x.mode === 'px' || x.mode === 'Tx') && (x.x < 0 || x.x > 1)) w.push('Quality must lie between 0 and 1.');
      if (x.mode === 'px' && x.p >= PC) w.push('Above the critical pressure (22.064 MPa) there is no two-phase region — use (p, T).');
      if (x.mode === 'Tx' && x.T >= TC) w.push('Above the critical temperature (373.946 °C) there is no two-phase region.');
      const st = state(x);
      if (!st || !Number.isFinite(st.h)) return { _warn: [...w, 'State outside IF97 range: 0–100 MPa for 0–800 °C, and up to 50 MPa for 800–2000 °C.'] };
      const Tsat = st.p < PC ? satP(st.p).T : NaN;
      info.push(`Phase: ${PHASE[st.region]}.`);
      if (st.p >= PC && st.T >= TC) info.push('Supercritical fluid: above both critical pressure and temperature.');
      const out = { Tout: st.T, pout: st.p, hout: st.h, sout: st.s, v: st.v, rho: st.rho, u: st.u, cp: st.cp, cv: st.cv, w: st.w, xout: st.x, Tsat: Number.isFinite(Tsat) ? Tsat : undefined, super: st.region !== 4 && Number.isFinite(Tsat) ? st.T - Tsat : undefined };
      const iso = st.p < PC ? isobarTs(st.p, 274, Math.max(st.T + 80, (Tsat || 600) + 150)) : isobarTs(st.p, 274, st.T + 100);
      out._plot = { series: [domeTs(), { x: iso.xs, y: iso.ys, label: `Isobar ${(st.p / 1e5).toPrecision(4)} bar`, width: 1.5 }, { x: [st.s / 1e3], y: [st.T - K0], label: 'State', type: 'scatter' }], opts: { xlabel: 's (kJ/kg·K)', ylabel: 'T (°C)', ymin: 0 } };
      out._info = info; out._warn = w;
      return out;
    },
    eq: ['\\frac{g(p,T)}{RT} = \\gamma(\\pi,\\tau)\\;\\text{(Regions 1, 2, 5)}', '\\frac{f(\\rho,T)}{RT} = \\phi(\\delta,\\tau)\\;\\text{(Region 3)}', 'h = RT\\tau\\gamma_\\tau,\\quad s = R(\\tau\\gamma_\\tau - \\gamma),\\quad v = \\frac{RT}{p}\\pi\\gamma_\\pi', 'h = h_f + x\\,h_{fg}'],
    assume: ['IAPWS-IF97 basic equations for Regions 1, 2, 3 and 5; Region 4 saturation equation for the two-phase boundary.', 'Region 3 density from p and T is solved numerically on the correct phase branch; (p,h) and (p,s) states are solved by bisection in T.', 'R = 0.461526 kJ/(kg·K). Reference state: u = s = 0 for saturated liquid at the triple point.'],
    limits: ['Valid 0.000611–100 MPa for 0–800 °C and up to 50 MPa for 800–2000 °C.', 'Metastable states (supercooled vapour) are not modelled. Very close to the critical point the IF97 accuracy degrades (use IAPWS-95 for scientific work).'],
    refs: ['IAPWS R7-97(2012), Revised Release on the IAPWS Industrial Formulation 1997.', 'Wagner & Kretzschmar, International Steam Tables, 2nd ed., Springer 2008.'],
    related: ['steam-sat', 'rankine-if97', 'steam-turbine', 'throttle-calorimeter'],
  },
  {
    id: 'rankine-if97', title: 'Rankine Cycle with Reheat — Full Steam Properties', disc: 'thermo', level: 'pro',
    tags: ['rankine', 'reheat', 'steam turbine', 'power plant', 'thermal efficiency', 'heat rate', 'condenser', 'boiler', 'iapws'],
    summary: 'Simple or reheat Rankine cycle computed from boiler and condenser conditions using IAPWS-IF97 — no table look-ups needed. Returns every state, efficiency, heat rate, turbine-exit quality and a T–s diagram.',
    inputs: [
      I('pH', 'Boiler pressure', 'p_H', 'pressure', 8e6, pu('MPa')), I('T3', 'Turbine inlet temperature', 'T_3', 'temperature', 753.15, Tu),
      I('pL', 'Condenser pressure', 'p_L', 'pressure', 10e3, pu('kPa')),
      SEL('rh', 'Reheat', [['no', 'No reheat'], ['yes', 'Single reheat']], 'no'),
      I('pR', 'Reheat pressure', 'p_R', 'pressure', 2e6, { ...pu('MPa'), showIf: v => v.rh === 'yes' }), I('TR', 'Reheat temperature', 'T_R', 'temperature', 753.15, { ...Tu, showIf: v => v.rh === 'yes' }),
      I('et', 'Turbine isentropic efficiency', '\\eta_t', 'none', 1, { adv: true }), I('ep', 'Pump isentropic efficiency', '\\eta_p', 'none', 1, { adv: true }),
      I('P', 'Net power output', 'P', 'power', 100e6, { u: { si: 'MW' }, adv: true }),
    ],
    outputs: [
      O('eta', 'Thermal efficiency', '\\eta_{th}', 'none', { primary: true, u: { si: '%' } }), O('wnet', 'Net work', 'w_{net}', 'specenergy', kJ),
      O('wt', 'Turbine work', 'w_t', 'specenergy', kJ), O('wp', 'Pump work', 'w_p', 'specenergy', kJ), O('qin', 'Heat added', 'q_{in}', 'specenergy', kJ), O('qout', 'Heat rejected', 'q_{out}', 'specenergy', kJ),
      O('x4', 'Turbine exit quality', 'x_4', 'none'), O('m', 'Steam mass flow', '\\dot m', 'massflow'), O('HR', 'Heat rate (kJ/kWh)', 'HR', 'none'),
      O('bwr', 'Back-work ratio', 'r_{bw}', 'none', { u: { si: '%' } }), O('carnot', 'Carnot efficiency (same T limits)', '\\eta_C', 'none', { u: { si: '%' } }),
      O('h1', 'h₁ pump inlet', 'h_1', 'specenergy', kJ), O('h2', 'h₂ boiler inlet', 'h_2', 'specenergy', kJ), O('h3', 'h₃ turbine inlet', 'h_3', 'specenergy', kJ), O('h4', 'h₄ condenser inlet', 'h_4', 'specenergy', kJ),
    ],
    compute(x) {
      const w = [], ck = [];
      if (!(x.pL < x.pH)) return { _warn: ['Condenser pressure must be below boiler pressure.'] };
      const reheat = x.rh === 'yes';
      if (reheat && !(x.pR > x.pL && x.pR < x.pH)) return { _warn: ['Reheat pressure must lie between the condenser and boiler pressures.'] };
      const sat = satP(x.pL), s1 = sat.liq; // state 1: saturated liquid
      const s2s = steamPS(x.pH, s1.s);
      const wp = (s2s.h - s1.h) / x.ep, h2 = s1.h + wp;
      const s3 = steamPT(x.pH, x.T3);
      if (!s3) return { _warn: ['Turbine inlet state outside IF97 range.'] };
      if (s3.region === 1) w.push('Turbine inlet is compressed liquid — raise T₃ above saturation.');
      const pts = [];
      let wt = 0, qin = s3.h - h2, sIn = s3, s4;
      const expand = (from, pOut) => { const is = steamPS(pOut, from.s); const hout = from.h - x.et * (from.h - is.h); return { is, out: steamPH(pOut, hout) }; };
      if (reheat) {
        const hp = expand(s3, x.pR); wt += s3.h - hp.out.h;
        const s5 = steamPT(x.pR, x.TR); qin += s5.h - hp.out.h;
        const lp = expand(s5, x.pL); wt += s5.h - lp.out.h; s4 = lp.out;
        pts.push([s3, hp.out, s5, s4]);
      } else { const e = expand(sIn, x.pL); wt = s3.h - e.out.h; s4 = e.out; pts.push([s3, s4]); }
      const wnet = wt - wp, eta = wnet / qin, x4 = s4.x ?? 1;
      if (x4 < 0.88) w.push(`Turbine exit quality ${(x4 * 100).toFixed(1)} % — below ~88 % blade erosion becomes a concern; consider reheat or higher T₃.`);
      ck.push(check('Turbine exit quality ≥ 88 %', x4 >= 0.88, `x₄ = ${(x4 * 100).toFixed(1)} %`));
      ck.push(check('Energy balance closes', Math.abs(qin - (s4.h - s1.h) - wnet) < 1e-3 * qin, 'q_in − q_out = w_net'));
      const Tmax = Math.max(x.T3, reheat ? x.TR : 0), carnot = 1 - sat.T / Tmax;
      // T–s diagram
      const cyc = { x: [], y: [] }, add = (st) => { cyc.x.push(st.s / 1e3); cyc.y.push(st.T - K0); };
      add(s1); const st2 = steamPH(x.pH, h2); add(st2);
      const heat = (p, a, b) => { const iso = isobarTs(p, a.T, b.T, 50); iso.xs.forEach((s, i) => { if (s >= a.s / 1e3 - 1e-9 && s <= b.s / 1e3 + 1e-9) { cyc.x.push(s); cyc.y.push(iso.ys[i]); } }); };
      heat(x.pH, st2, s3); add(s3);
      if (reheat) { const [, a, b] = pts[0]; add(a); heat(x.pR, a, b); add(b); }
      add(s4); add(s1);
      return {
        eta, wnet, wt, wp, qin, qout: qin - wnet, x4, m: x.P / wnet, HR: 3600 / eta, bwr: wp / wt, carnot, h1: s1.h, h2, h3: s3.h, h4: s4.h,
        _warn: w, _checks: ck, _info: [`T_sat at condenser = ${(sat.T - K0).toFixed(2)} °C; at boiler = ${x.pH < PC ? (satP(x.pH).T - K0).toFixed(2) + ' °C' : 'supercritical'}.`],
        _plot: { series: [domeTs(), { x: cyc.x, y: cyc.y, label: reheat ? 'Reheat Rankine cycle' : 'Rankine cycle', type: 'area' }], opts: { xlabel: 's (kJ/kg·K)', ylabel: 'T (°C)', ymin: 0 } },
      };
    },
    eq: ['w_p = h_2 - h_1 = \\frac{h_{2s} - h_1}{\\eta_p}', 'w_t = \\eta_t\\,(h_3 - h_{4s})', 'q_{in} = (h_3 - h_2) + (h_5 - h_4)_{reheat}', '\\eta_{th} = \\frac{w_t - w_p}{q_{in}},\\quad HR = \\frac{3600}{\\eta_{th}}\\;\\mathrm{kJ/kWh}'],
    assume: ['Steady flow; negligible kinetic/potential energy changes.', 'Saturated liquid leaves the condenser; no pressure losses in boiler, reheater or condenser.', 'All properties from IAPWS-IF97.'],
    limits: ['No feedwater heaters or regeneration; for those, combine states manually with the steam-properties calculator.'],
    refs: ['Çengel & Boles, Thermodynamics, §10-2 to 10-4.', 'IAPWS R7-97(2012).'],
    related: ['steam-props', 'rankine', 'steam-turbine', 'carnot'],
  },
  {
    id: 'steam-turbine', title: 'Steam Turbine / Nozzle Expansion', disc: 'thermo', level: 'pro',
    tags: ['steam turbine', 'isentropic efficiency', 'expansion', 'nozzle', 'exit velocity', 'wet steam', 'enthalpy drop'],
    summary: 'Expansion of steam from an inlet state to an exit pressure with a given isentropic efficiency: actual and isentropic exit states, work, power, and nozzle exit velocity.',
    inputs: [I('p1', 'Inlet pressure', 'p_1', 'pressure', 4e6, pu('MPa')), I('T1', 'Inlet temperature', 'T_1', 'temperature', 673.15, Tu), I('p2', 'Exit pressure', 'p_2', 'pressure', 0.1e6, pu('kPa')),
      I('eta', 'Isentropic efficiency', '\\eta_s', 'none', 0.85), I('m', 'Mass flow', '\\dot m', 'massflow', 10, { u: { si: 'kg/s' } }), I('V1', 'Inlet velocity (nozzle)', 'V_1', 'velocity', 0, { adv: true })],
    outputs: [O('W', 'Shaft power', 'P', 'power', { primary: true, u: { si: 'MW' } }), O('dh', 'Actual enthalpy drop', '\\Delta h', 'specenergy', kJ), O('dhs', 'Isentropic enthalpy drop', '\\Delta h_s', 'specenergy', kJ),
      O('T2', 'Exit temperature', 'T_2', 'temperature', Tu), O('x2', 'Exit quality', 'x_2', 'none'), O('x2s', 'Isentropic exit quality', 'x_{2s}', 'none'), O('s2', 'Exit entropy', 's_2', 'specheat', kJK), O('sgen', 'Entropy generation (kW/K)', '\\dot S_{gen}', 'none'), O('V2', 'Nozzle exit velocity (same Δh)', 'V_2', 'velocity')],
    compute(x) {
      if (!(x.p2 < x.p1)) return { _warn: ['Exit pressure must be below inlet pressure.'] };
      const s1 = steamPT(x.p1, x.T1); if (!s1) return { _warn: ['Inlet state outside IF97 range.'] };
      const is = steamPS(x.p2, s1.s), dhs = s1.h - is.h, dh = x.eta * dhs, s2 = steamPH(x.p2, s1.h - dh);
      return { W: x.m * dh, dh, dhs, T2: s2.T, x2: s2.x ?? 1, x2s: is.x ?? 1, s2: s2.s, sgen: x.m * (s2.s - s1.s) / 1e3, V2: Math.sqrt(x.V1 * x.V1 + 2 * dh), _warn: (s2.x ?? 1) < 0.88 ? ['Exit moisture above ~12 % — erosion risk in the last stages.'] : [] };
    },
    eq: ['h_{2s} = h(p_2, s_1)', 'h_2 = h_1 - \\eta_s (h_1 - h_{2s})', 'P = \\dot m (h_1 - h_2)', 'V_2 = \\sqrt{V_1^2 + 2(h_1 - h_2)}'],
    assume: ['Adiabatic, steady flow.', 'For the nozzle velocity the same enthalpy drop is converted to kinetic energy.'], limits: ['Choking and supersonic nozzle design are not checked.'],
    refs: ['Çengel & Boles §7-12.', 'IAPWS R7-97(2012).'], related: ['steam-props', 'rankine-if97'],
  },
  {
    id: 'throttle-calorimeter', title: 'Throttling Calorimeter — Steam Dryness', disc: 'thermo', level: 'uni',
    tags: ['throttling', 'dryness fraction', 'quality', 'calorimeter', 'isenthalpic', 'wet steam', 'joule-thomson'],
    summary: 'Find the dryness fraction of wet steam in a line by throttling a sample to a low pressure and measuring its superheated temperature (h₁ = h₂).',
    inputs: [I('p1', 'Line pressure', 'p_1', 'pressure', 1e6, pu('bar')), I('p2', 'Calorimeter pressure', 'p_2', 'pressure', 101325, pu('kPa')), I('T2', 'Calorimeter temperature', 'T_2', 'temperature', 383.15, Tu)],
    outputs: [O('x1', 'Line steam quality', 'x_1', 'none', { primary: true, u: { si: '%' } }), O('h', 'Enthalpy (constant)', 'h', 'specenergy', kJ), O('sup', 'Superheat in calorimeter', '\\Delta T_{sup}', 'tempdiff'), O('xmin', 'Minimum measurable quality', 'x_{min}', 'none', { u: { si: '%' } })],
    compute(x) {
      const s2 = steamPT(x.p2, x.T2), sat1 = satP(x.p1), sat2 = satP(x.p2);
      if (!s2 || s2.region !== 2) return { _warn: ['Calorimeter state must be superheated — the steam was too wet to measure by throttling alone (use a separating calorimeter first).'] };
      const x1 = (s2.h - sat1.liq.h) / sat1.hfg, xmin = (sat2.vap.h - sat1.liq.h) / sat1.hfg;
      return { x1, h: s2.h, sup: x.T2 - sat2.T, xmin, _checks: [check('Superheat ≥ 5 K for a reliable reading', x.T2 - sat2.T >= 5)], _warn: x1 > 1 ? ['Result > 1: the line steam is already superheated.'] : [] };
    },
    eq: ['h_1 = h_2 \\;(\\text{throttling})', 'x_1 = \\frac{h_2(p_2, T_2) - h_f(p_1)}{h_{fg}(p_1)}'],
    assume: ['Adiabatic throttling; negligible KE change.'], limits: ['Only works for steam with quality above x_min (typically ≥ 0.95).'],
    refs: ['Rogers & Mayhew, Engineering Thermodynamics, §10.'], related: ['steam-props'],
  },
  {
    id: 'boiler-duty', title: 'Boiler Duty & Fuel Consumption', disc: 'thermo', level: 'pro',
    tags: ['boiler', 'steam generation', 'fuel', 'efficiency', 'feedwater', 'heat input', 'from and at 100', 'evaporation'],
    summary: 'Heat duty to raise feedwater to steam at a given pressure and temperature, fuel flow for a given boiler efficiency and heating value, and the "from and at 100 °C" equivalent evaporation.',
    inputs: [I('m', 'Steam flow', '\\dot m', 'massflow', 20000 / 3600, { u: { si: 'kg/h' } }), I('p', 'Steam pressure', 'p', 'pressure', 1e6, pu('bar')),
      SEL('cond', 'Steam condition', [['sat', 'Dry saturated'], ['sup', 'Superheated'], ['wet', 'Wet']], 'sat'),
      I('Ts', 'Steam temperature', 'T_s', 'temperature', 523.15, { ...Tu, showIf: v => v.cond === 'sup' }), I('xs', 'Steam quality', 'x', 'none', 0.97, { showIf: v => v.cond === 'wet' }),
      I('Tfw', 'Feedwater temperature', 'T_{fw}', 'temperature', 353.15, Tu), I('eff', 'Boiler efficiency (on LHV)', '\\eta_b', 'none', 0.85), I('LHV', 'Fuel heating value', 'LHV', 'specenergy', 42.5e6, { u: { si: 'MJ/kg' } })],
    outputs: [O('Q', 'Boiler duty', '\\dot Q', 'power', { primary: true, u: { si: 'MW' } }), O('mf', 'Fuel flow', '\\dot m_f', 'massflow', { u: { si: 'kg/h' } }), O('dh', 'Enthalpy rise', '\\Delta h', 'specenergy', kJ), O('FA', 'Equivalent evaporation (from and at 100 °C)', '\\dot m_e', 'massflow', { u: { si: 'kg/h' } }), O('ratio', 'Evaporation ratio (steam/fuel)', 'r', 'none')],
    compute(x) {
      const st = x.cond === 'sup' ? steamPT(x.p, x.Ts) : steamPX(x.p, x.cond === 'wet' ? x.xs : 1);
      const fw = steamPT(Math.max(x.p, 1.01e5), x.Tfw);
      if (!st || !fw) return { _warn: ['State outside IF97 range.'] };
      if (x.cond === 'sup' && st.region !== 2 && st.region !== 5 && st.region !== 3) return { _warn: ['Given temperature is below saturation — steam is not superheated.'] };
      const dh = st.h - fw.h, Q = x.m * dh, mf = Q / (x.eff * x.LHV), hfg100 = satP(101325).hfg;
      return { Q, mf, dh, FA: Q / hfg100, ratio: x.m / mf };
    },
    eq: ['\\dot Q = \\dot m (h_{steam} - h_{fw})', '\\dot m_f = \\frac{\\dot Q}{\\eta_b\\,LHV}', '\\dot m_e = \\frac{\\dot Q}{h_{fg,100\\,°C}}'],
    assume: ['Feedwater enthalpy evaluated at boiler pressure (compressed liquid).', 'Blowdown neglected.'], limits: [], refs: ['BS 845 / ASME PTC 4 (efficiency definitions).', 'IAPWS R7-97(2012).'], related: ['steam-props', 'rankine-if97'],
  },
];
