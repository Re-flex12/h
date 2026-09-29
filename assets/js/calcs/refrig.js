// Refrigerant calculators using tabulated reference-EOS properties.
import { I, O, SEL, check } from './_h.js';
import { REFRIGERANT_LIST, REFRIGERANTS, refSatT, refSatP, refPT, refPS, refPH, vcrCycle } from '../data/refrigerants.js';

const K0 = 273.15;
const REFS = REFRIGERANT_LIST.map(r => [r.id, r.name]);
const kJ = { u: { si: 'kJ/kg', imperial: 'BTU/lb' } }, Tu = { u: { si: '°C', imperial: '°F' } };
const range = id => { const r = REFRIGERANTS[id]; return [r.sat[0][0], r.sat[r.sat.length - 1][0]]; };

// Saturation dome on p–h axes (h kJ/kg, p bar).
export function domePH(id) {
  const r = REFRIGERANTS[id];
  return { x: [...r.sat.map(q => q[5]), ...r.sat.slice().reverse().map(q => q[6])], y: [...r.sat.map(q => q[1] / 1e5), ...r.sat.slice().reverse().map(q => q[2] / 1e5)], label: `${r.name} saturation dome`, color: 'var(--ink3)', width: 1.5 };
}

export default [
  {
    id: 'vcr-cycle', title: 'Refrigeration / Heat-Pump Cycle — Real Refrigerants', disc: 'hvac', level: 'pro',
    tags: ['refrigeration cycle', 'heat pump', 'cop', 'r134a', 'r32', 'r410a', 'ammonia', 'r717', 'co2', 'propane', 'r1234yf', 'superheat', 'subcooling', 'discharge temperature', 'p-h diagram', 'compressor sizing'],
    summary: 'Single-stage vapour-compression cycle from evaporating and condensing temperatures for 11 refrigerants. Gives COP, mass flow, compressor power, discharge temperature, pressure ratio, volumetric capacity and a p–h diagram.',
    inputs: [
      SEL('ref', 'Refrigerant', REFS, 'R134a'),
      I('Te', 'Evaporating temperature (dew)', 'T_e', 'temperature', 263.15, Tu), I('Tc', 'Condensing temperature (bubble)', 'T_c', 'temperature', 313.15, Tu),
      I('sh', 'Suction superheat', '\\Delta T_{sh}', 'tempdiff', 5), I('sc', 'Liquid subcooling', '\\Delta T_{sc}', 'tempdiff', 3),
      I('etaC', 'Compressor isentropic efficiency', '\\eta_{is}', 'none', 0.7), I('Q', 'Cooling capacity', '\\dot Q_e', 'power', 10e3, { u: { si: 'kW', imperial: 'TR (refrig. ton)' } }),
      I('etaV', 'Compressor volumetric efficiency', '\\eta_v', 'none', 0.85, { adv: true }),
    ],
    outputs: [
      O('COP', 'COP (cooling)', 'COP_R', 'none', { primary: true }), O('COPhp', 'COP (heating)', 'COP_{HP}', 'none'), O('COPc', 'Carnot COP', 'COP_{Carnot}', 'none'), O('eta2', 'Second-law efficiency', '\\eta_{II}', 'none', { u: { si: '%' } }),
      O('m', 'Refrigerant mass flow', '\\dot m', 'massflow', { u: { si: 'kg/h' } }), O('W', 'Compressor power', '\\dot W', 'power', { u: { si: 'kW' } }), O('Qc', 'Condenser heat rejection', '\\dot Q_c', 'power', { u: { si: 'kW' } }),
      O('pe', 'Evaporating pressure', 'p_e', 'pressure', { u: { si: 'bar', imperial: 'psi' } }), O('pc', 'Condensing pressure', 'p_c', 'pressure', { u: { si: 'bar', imperial: 'psi' } }), O('rp', 'Pressure ratio', 'r_p', 'none'),
      O('T2', 'Discharge temperature', 'T_2', 'temperature', Tu), O('qe', 'Refrigerating effect', 'q_e', 'specenergy', kJ), O('x4', 'Quality after expansion', 'x_4', 'none'),
      O('VCC', 'Volumetric cooling capacity', 'VCC', 'energydensity', { u: { si: 'kJ/m³' } }), O('Vd', 'Required swept volume rate', '\\dot V_{sw}', 'flow', { u: { si: 'm³/h' } }),
    ],
    compute(x) {
      const [a, b] = range(x.ref), w = [];
      const te = x.Te - K0, tc = x.Tc - K0;
      if (te < a || tc > b) return { _warn: [`${REFRIGERANTS[x.ref].name}: tabulated saturation range is ${a} … ${b} °C.${x.ref === 'R744' ? ' CO₂ above ~30 °C rejects heat transcritically (gas cooler), which this single-stage subcritical model does not cover.' : ''}`] };
      if (!(x.Tc > x.Te)) return { _warn: ['Condensing temperature must exceed evaporating temperature.'] };
      const c = vcrCycle(x.ref, { Te: x.Te, Tc: x.Tc, sh: x.sh, sc: x.sc, etaC: x.etaC, Qe: x.Q, etaV: x.etaV });
      if (!c) return { _warn: ['Compressor discharge lies beyond the tabulated superheat range (220 K). Reduce the lift or raise efficiency.'] };
      const T2 = c.st2.T;
      if (T2 - K0 > 135) w.push(`Discharge temperature ${(T2 - K0).toFixed(0)} °C is high — oil breakdown risk above ~135 °C; consider staging or liquid injection.`);
      if (c.rp > 10) w.push('Pressure ratio above ~10: single-stage compression becomes inefficient; consider two-stage.');
      const ck = [check('Discharge temperature ≤ 135 °C', T2 - K0 <= 135, `${(T2 - K0).toFixed(1)} °C`), check('Pressure ratio ≤ 10', c.rp <= 10, c.rp.toFixed(2))];
      const pts = [c.st1, c.st2, c.st3, c.st4, c.st1];
      const r = REFRIGERANTS[x.ref];
      return {
        COP: c.COP, COPhp: c.COPhp, COPc: c.COPcarnot, eta2: c.COP / c.COPcarnot, m: c.m, W: c.Wc, Qc: c.Qc, pe: c.pe, pc: c.pc, rp: c.rp, T2, qe: c.qe, x4: c.st4.x, VCC: c.VCC, Vd: c.Vdot,
        _warn: w, _checks: ck,
        _info: [`${r.name}: GWP₁₀₀ ≈ ${r.gwp}, ASHRAE 34 safety class ${r.safety}. ${r.use}`],
        _plot: { series: [domePH(x.ref), { x: pts.map(s => s.h / 1e3), y: pts.map(s => s.p / 1e5), label: 'Cycle 1-2-3-4', type: 'area' }, { x: pts.slice(0, 4).map(s => s.h / 1e3), y: pts.slice(0, 4).map(s => s.p / 1e5), label: 'States 1–4', type: 'scatter' }], opts: { xlabel: 'h (kJ/kg)', ylabel: 'p (bar)', logy: true } },
      };
    },
    eq: ['q_e = h_1 - h_4,\\quad w = h_2 - h_1 = \\frac{h_{2s} - h_1}{\\eta_{is}}', 'h_4 = h_3\\;\\text{(isenthalpic expansion)}', 'COP_R = \\frac{q_e}{w},\\quad COP_{HP} = \\frac{h_2 - h_3}{w}', 'VCC = \\rho_1\\,q_e\\,\\eta_v'],
    assume: ['Steady flow; no pressure drops in heat exchangers or lines; adiabatic compressor with the given isentropic efficiency.', 'Properties interpolated from tables generated with reference equations of state (CoolProp 8); typical error < 0.5 kJ/kg in h.', 'Blends (R-410A, R-404A, R-407C) are modelled as pseudo-pure fluids; for R-407C T_e is the dew point and T_c the bubble point.'],
    limits: ['Subcritical cycles only (CO₂ transcritical operation not covered).', 'Subcooled liquid uses saturated-liquid properties at its temperature.'],
    refs: ['Bell, Wronski, Quoilin & Lemort, Ind. Eng. Chem. Res. 53 (2014) 2498 — CoolProp.', 'ASHRAE Handbook — Fundamentals, ch. 2 & 30.', 'Stoecker & Jones, Refrigeration and Air Conditioning.'],
    related: ['refrigeration', 'refrigerant-props', 'refrigerant-compare', 'carnot'],
  },
  {
    id: 'refrigerant-props', title: 'Refrigerant Properties', disc: 'hvac', level: 'uni',
    tags: ['refrigerant', 'saturation pressure', 'pt chart', 'superheat', 'subcooling', 'enthalpy', 'r134a', 'r410a', 'r32', 'ammonia', 'service gauge'],
    summary: 'Saturation pressure/temperature (a P–T chart), superheat or subcooling from a gauge reading, and superheated-vapour properties for 11 refrigerants.',
    inputs: [SEL('ref', 'Refrigerant', REFS, 'R410A'),
      SEL('mode', 'Find', [['T', 'Saturation at a temperature'], ['p', 'Saturation at a pressure'], ['pT', 'State at pressure & temperature (superheat/subcooling)']], 'pT'),
      I('T', 'Temperature', 'T', 'temperature', 283.15, { ...Tu, showIf: v => v.mode !== 'p' }),
      I('p', 'Pressure (absolute)', 'p', 'pressure', 9e5, { u: { si: 'bar', imperial: 'psi' }, showIf: v => v.mode !== 'T', hint: 'Absolute. Gauge + 1.013 bar (14.7 psi).' })],
    outputs: [O('Tdew', 'Dew temperature', 'T_{dew}', 'temperature', Tu), O('Tbub', 'Bubble temperature', 'T_{bub}', 'temperature', Tu), O('pd', 'Saturation pressure (dew)', 'p_{sat}', 'pressure', { u: { si: 'bar', imperial: 'psi' } }), O('pg', 'Saturation pressure (gauge)', 'p_{g}', 'pressure', { u: { si: 'bar', imperial: 'psi' } }),
      O('state', 'Phase / condition', '', 'none', { type: 'text', optional: true }), O('dT', 'Superheat (+) / subcooling (−)', '\\Delta T', 'tempdiff', { primary: true, optional: true }),
      O('h', 'Specific enthalpy', 'h', 'specenergy', { ...kJ, optional: true }), O('s', 'Specific entropy', 's', 'specheat', { u: { si: 'kJ/(kg·K)' }, optional: true }), O('rho', 'Density', '\\rho', 'density', { optional: true }),
      O('hfg', 'Latent heat', 'h_{fg}', 'specenergy', { ...kJ, optional: true }), O('rf', 'Sat. liquid density', '\\rho_f', 'density', { optional: true }), O('rg', 'Sat. vapour density', '\\rho_g', 'density', { optional: true })],
    compute(x) {
      const [a, b] = range(x.ref), r = REFRIGERANTS[x.ref];
      if (x.mode === 'T') {
        if (x.T - K0 < a || x.T - K0 > b) return { _warn: [`Tabulated range ${a} … ${b} °C.`] };
        const s = refSatT(x.ref, x.T);
        return { Tdew: x.T, Tbub: x.T, pd: s.pd, pg: s.pd - 101325, hfg: s.hg - s.hf, rf: s.rf, rg: s.rg, _info: s.pb !== s.pd ? [`Bubble pressure ${(s.pb / 1e5).toFixed(3)} bar (glide).`] : [] };
      }
      const pmin = r.sat[0][2], pmax = r.sat[r.sat.length - 1][1];
      if (x.p < pmin || x.p > pmax) return { _warn: [`Pressure outside tabulated saturation range ${(pmin / 1e5).toFixed(3)} … ${(pmax / 1e5).toFixed(2)} bar (abs).`] };
      const s = refSatP(x.ref, x.p);
      const base = { Tdew: s.Tdew, Tbub: s.Tbub, pd: x.p, pg: x.p - 101325, hfg: s.hg - s.hf, rf: s.rf, rg: s.rg };
      if (x.mode === 'p') return base;
      const st = refPT(x.ref, x.p, x.T);
      if (!st) return { ...base, _warn: ['Superheat beyond tabulated 220 K.'] };
      if (st.phase === 'vapour') return { ...base, state: 'Superheated vapour', dT: x.T - s.Tdew, h: st.h, s: st.s, rho: st.rho };
      if (x.T <= s.Tbub) return { ...base, state: 'Subcooled liquid', dT: x.T - s.Tbub, h: st.h, s: st.s, rho: st.rho };
      return { ...base, state: 'Inside the glide (two-phase)', dT: 0 };
    },
    eq: ['\\Delta T_{sh} = T_{suction} - T_{dew}(p)', '\\Delta T_{sc} = T_{bub}(p) - T_{liquid}'], assume: ['Tabulated reference-EOS data with interpolation.'], limits: ['Subcooled liquid treated as saturated liquid at its temperature.'],
    refs: ['CoolProp 8 (Bell et al. 2014).', 'ASHRAE Handbook — Fundamentals, ch. 30.'], related: ['vcr-cycle', 'refrigerant-compare'],
  },
  {
    id: 'refrigerant-compare', title: 'Refrigerant Comparison at Given Conditions', disc: 'hvac', level: 'pro',
    tags: ['refrigerant selection', 'compare refrigerants', 'gwp', 'cop comparison', 'volumetric capacity', 'retrofit', 'f-gas'],
    summary: 'Runs the same cycle for every refrigerant and ranks them by COP, volumetric capacity, pressure level, discharge temperature and GWP.',
    inputs: [I('Te', 'Evaporating temperature', 'T_e', 'temperature', 268.15, Tu), I('Tc', 'Condensing temperature', 'T_c', 'temperature', 318.15, Tu), I('sh', 'Superheat', '\\Delta T_{sh}', 'tempdiff', 5), I('sc', 'Subcooling', '\\Delta T_{sc}', 'tempdiff', 3), I('etaC', 'Compressor isentropic efficiency', '\\eta_{is}', 'none', 0.7)],
    outputs: [O('best', 'Highest COP', '', 'none', { type: 'text', primary: true }), O('bestV', 'Highest volumetric capacity', '', 'none', { type: 'text' }), O('n', 'Refrigerants evaluated', 'n', 'none')],
    compute(x) {
      const rows = [];
      for (const r of REFRIGERANT_LIST) {
        const [a, b] = range(r.id);
        if (x.Te - K0 < a || x.Tc - K0 > b) continue;
        const c = vcrCycle(r.id, { Te: x.Te, Tc: x.Tc, sh: x.sh, sc: x.sc, etaC: x.etaC, Qe: 1e3, etaV: 1 });
        if (c) rows.push({ r, c });
      }
      if (!rows.length) return { _warn: ['No refrigerant covers these temperatures.'] };
      rows.sort((p, q) => q.c.COP - p.c.COP);
      const bv = rows.slice().sort((p, q) => q.c.VCC - p.c.VCC)[0];
      const td = (v, d = 2) => `<td class="num">${v.toFixed(d)}</td>`;
      const _svg = `<div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>Refrigerant</th><th class="num">COP</th><th class="num">VCC kJ/m³</th><th class="num">p_e bar</th><th class="num">p_c bar</th><th class="num">r_p</th><th class="num">T_dis °C</th><th class="num">GWP</th><th>Safety</th></tr></thead><tbody>${rows.map(({ r, c }) => `<tr><td>${r.name}</td>${td(c.COP)}${td(c.VCC / 1e3, 0)}${td(c.pe / 1e5)}${td(c.pc / 1e5)}${td(c.rp)}${td(c.st2.T - K0, 1)}<td class="num">${r.gwp}</td><td>${r.safety}</td></tr>`).join('')}</tbody></table></div>`;
      return { best: `${rows[0].r.name} — COP ${rows[0].c.COP.toFixed(2)}`, bestV: `${bv.r.name} — ${(bv.c.VCC / 1e3).toFixed(0)} kJ/m³`, n: rows.length, _svg, _info: ['Higher volumetric capacity → smaller compressor for the same duty. GWP values are AR4 100-year (EU F-gas basis).'] };
    },
    eq: ['COP_R = \\frac{h_1 - h_4}{h_2 - h_1}', 'VCC = \\rho_1 (h_1 - h_4)'], assume: ['Identical cycle conditions for every fluid; ideal volumetric efficiency.'], limits: ['Ignores heat-transfer and pressure-drop differences between fluids, which matter in practice.'],
    refs: ['CoolProp 8.', 'IPCC AR4 GWP values; ASHRAE Standard 34 safety groups.'], related: ['vcr-cycle', 'refrigerant-props'],
  },
];
