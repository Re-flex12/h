import { I, O, SEL, PI, check } from './_h.js';

// ISO 286-1 size steps (mm) up to 500 mm.
const STEPS = [[0, 3], [3, 6], [6, 10], [10, 18], [18, 30], [30, 50], [50, 80], [80, 120], [120, 180], [180, 250], [250, 315], [315, 400], [400, 500]];
const ITK = { 5: 7, 6: 10, 7: 16, 8: 25, 9: 40, 10: 64, 11: 100 };

export function isoFit(D, holeIT, shaft, shaftIT) {
  const step = STEPS.find(([a, b]) => D > a && D <= b) || STEPS[0];
  const Dm = Math.sqrt(Math.max(step[0], 1) * step[1]);
  const i = 0.45 * Math.cbrt(Dm) + 0.001 * Dm; // µm
  const IT = n => ITK[n] * i;
  const ITh = IT(holeIT), ITs = IT(shaftIT);
  // Hole basis H: EI = 0
  const hole = { lo: 0, hi: ITh };
  let es, ei;
  switch (shaft) {
    case 'd': es = -16 * Math.pow(Dm, 0.44); ei = es - ITs; break;
    case 'e': es = -11 * Math.pow(Dm, 0.41); ei = es - ITs; break;
    case 'f': es = -5.5 * Math.pow(Dm, 0.41); ei = es - ITs; break;
    case 'g': es = -2.5 * Math.pow(Dm, 0.34); ei = es - ITs; break;
    case 'h': es = 0; ei = -ITs; break;
    case 'js': es = ITs / 2; ei = -ITs / 2; break;
    case 'k': ei = (shaftIT >= 4 && shaftIT <= 7) ? 0.6 * Math.cbrt(Dm) : 0; es = ei + ITs; break;
    case 'm': ei = IT(7) - IT(6); es = ei + ITs; break;
    case 'n': ei = 5 * Math.pow(Dm, 0.34); es = ei + ITs; break;
    case 'p': ei = IT(7); es = ei + ITs; break;
  }
  return { step, i, ITh, ITs, hole, shaft: { lo: ei, hi: es }, cmax: hole.hi - ei, cmin: hole.lo - es };
}

export default [
  {
    id: 'turning', title: 'Turning — Speed, Feed, MRR & Power', disc: 'manufacturing', level: 'uni', tags: ['lathe', 'cutting speed', 'spindle speed', 'rpm', 'feed rate', 'material removal rate', 'machining time', 'cnc'],
    summary: 'Spindle speed, feed rate, material removal rate, cutting time and power for a turning pass.',
    inputs: [I('D', 'Workpiece diameter', 'D', 'length', 0.05, { u: { si: 'mm', imperial: 'in' } }), I('Vc', 'Cutting speed', 'V_c', 'velocity', 200 / 60, { u: { si: 'm/min', imperial: 'ft/min' }, hint: 'carbide on mild steel ≈ 150–250 m/min; aluminium 300–1000' }),
      I('f', 'Feed per revolution', 'f', 'length', 0.2e-3, { u: { si: 'mm', imperial: 'in' } }), I('ap', 'Depth of cut', 'a_p', 'length', 2e-3, { u: { si: 'mm', imperial: 'in' } }), I('L', 'Length of cut', 'L', 'length', 0.1, { u: { si: 'mm', imperial: 'in' } }),
      I('kc', 'Specific cutting force', 'k_c', 'pressure', 2000e6, { u: { si: 'N/mm²' }, adv: true, hint: 'steel ≈ 1500–2500, stainless ≈ 2500, Al ≈ 700 N/mm²' }), I('eta', 'Machine efficiency', '\\eta', 'none', 0.8, { adv: true })],
    outputs: [O('n', 'Spindle speed', 'n', 'angvel', { primary: true, u: { si: 'rpm' } }), O('vf', 'Feed rate', 'v_f', 'velocity', { u: { si: 'mm/s' }, note: '' }), O('Q', 'Material removal rate', 'Q', 'flow', { u: { si: 'L/min' } }), O('t', 'Cutting time', 't', 'time', { u: { si: 's' } }), O('Pc', 'Cutting power', 'P_c', 'power', { u: { si: 'kW' } }), O('Pm', 'Motor power required', 'P_m', 'power', { u: { si: 'kW' } }), O('Fc', 'Cutting force', 'F_c', 'force')],
    compute(x) { const n = 2 * x.Vc / x.D, rps = n / (2 * PI), vf = x.f * rps, Q = x.Vc * x.f * x.ap, Pc = Q * x.kc; return { n, vf, Q, t: x.L / vf, Pc, Pm: Pc / x.eta, Fc: x.kc * x.f * x.ap }; },
    eq: ['n = \\frac{1000\\,V_c}{\\pi D}\\;\\text{[rpm; }V_c\\text{ m/min, }D\\text{ mm]}', 'v_f = f\\,n', 'Q = V_c\\, f\\, a_p', 'P_c = Q\\, k_c', 't = L / v_f'], assume: ['Constant cutting speed at diameter D; k_c constant (chip-thickness effects ignored).'], limits: ['Use tooling manufacturer data for V_c and f.'], refs: ['Sandvik Coromant Metal Cutting Technology Guide.', 'Kalpakjian & Schmid, Manufacturing Engineering & Technology, ch. 21–23.'],
  },
  {
    id: 'milling', title: 'Milling — Speed, Feed, MRR & Power', disc: 'manufacturing', level: 'uni', tags: ['milling', 'chip load', 'feed per tooth', 'spindle speed', 'mrr', 'end mill', 'cnc'],
    summary: 'Spindle speed, table feed, material removal rate and power for a milling operation.',
    inputs: [I('D', 'Cutter diameter', 'D_c', 'length', 0.012, { u: { si: 'mm', imperial: 'in' } }), I('z', 'Number of teeth', 'z', 'none', 4), I('Vc', 'Cutting speed', 'V_c', 'velocity', 120 / 60, { u: { si: 'm/min', imperial: 'ft/min' } }), I('fz', 'Feed per tooth', 'f_z', 'length', 0.05e-3, { u: { si: 'mm', imperial: 'in' } }),
      I('ae', 'Radial engagement (width)', 'a_e', 'length', 6e-3, { u: { si: 'mm', imperial: 'in' } }), I('ap', 'Axial depth', 'a_p', 'length', 10e-3, { u: { si: 'mm', imperial: 'in' } }), I('kc', 'Specific cutting force', 'k_c', 'pressure', 2000e6, { u: { si: 'N/mm²' }, adv: true }), I('eta', 'Machine efficiency', '\\eta', 'none', 0.8, { adv: true })],
    outputs: [O('n', 'Spindle speed', 'n', 'angvel', { primary: true, u: { si: 'rpm' } }), O('vf', 'Table feed', 'v_f', 'velocity', { u: { si: 'mm/s', metric: 'm/min', imperial: 'ft/min' } }), O('Q', 'MRR', 'Q', 'flow', { u: { si: 'L/min' } }), O('Pc', 'Cutting power', 'P_c', 'power', { u: { si: 'kW' } }), O('Pm', 'Motor power', 'P_m', 'power', { u: { si: 'kW' } }), O('T', 'Spindle torque', 'T', 'torque')],
    compute(x) { const n = 2 * x.Vc / x.D, vf = x.fz * x.z * n / (2 * PI), Q = x.ae * x.ap * vf, Pc = Q * x.kc; return { n, vf, Q, Pc, Pm: Pc / x.eta, T: Pc / n, _info: x.ae < x.D / 2 ? ['Radial engagement < D/2: consider chip thinning — increase f_z to hold chip thickness.'] : [] }; },
    eq: ['n = \\frac{V_c}{\\pi D_c}', 'v_f = f_z\\, z\\, n', 'Q = a_e\\, a_p\\, v_f', 'P_c = Q\\,k_c'], assume: ['Average specific cutting force.'], limits: [], refs: ['Sandvik Coromant Milling formulas.'],
  },
  {
    id: 'drilling', title: 'Drilling — Speed, Feed & Time', disc: 'manufacturing', level: 'uni', tags: ['drill', 'drilling speed', 'feed', 'machining time', 'torque'],
    summary: 'Spindle speed, penetration rate, cycle time, removal rate and power for drilling.',
    inputs: [I('D', 'Drill diameter', 'D', 'length', 0.01, { u: { si: 'mm', imperial: 'in' } }), I('Vc', 'Cutting speed', 'V_c', 'velocity', 80 / 60, { u: { si: 'm/min', imperial: 'ft/min' } }), I('f', 'Feed per revolution', 'f', 'length', 0.15e-3, { u: { si: 'mm', imperial: 'in' } }), I('L', 'Hole depth (incl. approach)', 'L', 'length', 0.03, { u: { si: 'mm', imperial: 'in' } }), I('kc', 'Specific cutting force', 'k_c', 'pressure', 2000e6, { u: { si: 'N/mm²' }, adv: true })],
    outputs: [O('n', 'Spindle speed', 'n', 'angvel', { primary: true, u: { si: 'rpm' } }), O('vf', 'Penetration rate', 'v_f', 'velocity', { u: { si: 'mm/s', metric: 'm/min' } }), O('t', 'Drilling time', 't', 'time'), O('Q', 'MRR', 'Q', 'flow', { u: { si: 'L/min' } }), O('P', 'Cutting power', 'P_c', 'power', { u: { si: 'kW' } }), O('T', 'Torque', 'T', 'torque')],
    compute(x) { const n = 2 * x.Vc / x.D, vf = x.f * n / (2 * PI), Q = PI * x.D ** 2 / 4 * vf, P = Q * x.kc; return { n, vf, t: x.L / vf, Q, P, T: P / n }; },
    eq: ['n = \\frac{V_c}{\\pi D}', 'v_f = f\\,n', 'Q = \\frac{\\pi D^2}{4}v_f'], assume: ['Solid drilling (no pilot hole).'], limits: [], refs: ['Sandvik Coromant Drilling formulas.'],
  },
  {
    id: 'tol-stack', title: 'Tolerance Stack-Up (worst case & RSS)', disc: 'manufacturing', level: 'pro', tags: ['tolerance analysis', 'stack-up', 'rss', 'worst case', 'gap', 'assembly'],
    summary: 'Nominal gap and its variation from a 1D chain of dimensions using worst-case and root-sum-square methods.',
    inputs: [{ k: 'chain', label: 'Dimension chain — one per line: sign nominal ±tol  (e.g. "+50 0.1")', type: 'text', multiline: true, def: '+100 0.10\n-40 0.05\n-30 0.05\n-29.5 0.08', dim: 'none' },
      I('cpk', 'Target process sigma (RSS assumes ±3σ per tolerance)', 'k', 'none', 3, { adv: true })],
    outputs: [O('nom', 'Nominal result', 'G_{nom}', 'none', { primary: true, note: 'same units as input' }), O('wc', 'Worst-case variation (±)', 't_{WC}', 'none'), O('rss', 'RSS variation (±)', 't_{RSS}', 'none'), O('wcr', 'Worst-case range', '', 'none', { type: 'text' }), O('rssr', 'RSS range', '', 'none', { type: 'text' }), O('n', 'Contributors', 'n', 'none')],
    compute(x) {
      const rows = String(x.chain).split('\n').map(s => s.trim()).filter(Boolean).map(s => { const m = s.match(/^([+-])?\s*([\d.]+)\s*(?:±|\+\/-)?\s*([\d.]+)?/); return m ? { s: m[1] === '-' ? -1 : 1, v: parseFloat(m[2]), t: parseFloat(m[3] || '0') } : null; }).filter(Boolean);
      const nom = rows.reduce((a, r) => a + r.s * r.v, 0), wc = rows.reduce((a, r) => a + r.t, 0), rss = Math.sqrt(rows.reduce((a, r) => a + r.t * r.t, 0)) * 3 / x.cpk;
      const f = v => Number(v.toFixed(4));
      return { nom, wc, rss, wcr: `${f(nom - wc)} … ${f(nom + wc)}`, rssr: `${f(nom - rss)} … ${f(nom + rss)}`, n: rows.length, _checks: [check('Worst-case minimum > 0 (no interference)', nom - wc > 0, `${f(nom - wc)}`)] };
    },
    eq: ['G = \\sum s_i d_i', 't_{WC} = \\sum |t_i|', 't_{RSS} = \\sqrt{\\sum t_i^2}'], assume: ['1D chain; symmetric tolerances; RSS assumes independent, centred, normally distributed dimensions.'], limits: ['Geometric tolerances (position, flatness) need 3D/GD&T analysis (ASME Y14.5 / ISO GPS).'], refs: ['Fortini, Dimensioning for Interchangeable Manufacture.', 'ASME Y14.5-2018.'],
  },
  {
    id: 'iso-fit', title: 'ISO Hole-Basis Fits (H/…)', disc: 'manufacturing', level: 'pro', tags: ['fits', 'tolerances', 'iso 286', 'clearance fit', 'interference fit', 'transition fit', 'h7/g6', 'shaft', 'hole'],
    summary: 'Hole and shaft limits, and minimum/maximum clearance, for ISO 286 hole-basis fits (computed from the ISO formulae).',
    inputs: [I('D', 'Nominal size', 'D', 'length', 25e-3, { u: { si: 'mm', imperial: 'mm', metric: 'mm' } }), SEL('hIT', 'Hole grade (H)', [['6', 'H6'], ['7', 'H7'], ['8', 'H8'], ['9', 'H9'], ['11', 'H11']], '7'),
      SEL('sh', 'Shaft deviation', [['d', 'd (loose running)'], ['e', 'e'], ['f', 'f (close running)'], ['g', 'g (sliding)'], ['h', 'h (locational clearance)'], ['js', 'js'], ['k', 'k (transition)'], ['m', 'm'], ['n', 'n (transition/light press)'], ['p', 'p (press, approx.)']], 'g'), SEL('sIT', 'Shaft grade', [['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'], ['11', '11']], '6')],
    outputs: [O('hole', 'Hole limits', '', 'none', { type: 'text' }), O('shaft', 'Shaft limits', '', 'none', { type: 'text' }), O('cmax', 'Maximum clearance', 'C_{max}', 'length', { u: { si: 'µm', metric: 'µm', imperial: 'µm' } }), O('cmin', 'Minimum clearance (− = interference)', 'C_{min}', 'length', { u: { si: 'µm', metric: 'µm', imperial: 'µm' } }), O('type', 'Fit type', '', 'none', { type: 'text', primary: true }), O('it', 'Tolerance grades (hole / shaft)', '', 'none', { type: 'text' })],
    compute(x) {
      const Dmm = x.D * 1e3;
      const w = Dmm > 500 ? ['Implemented for sizes up to 500 mm.'] : [];
      const r = isoFit(Dmm, +x.hIT, x.sh, +x.sIT);
      const f = v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;
      const lim = (lo, hi) => `${(Dmm + lo / 1e3).toFixed(4)} … ${(Dmm + hi / 1e3).toFixed(4)} mm (${f(lo)} / ${f(hi)} µm)`;
      const type = r.cmin >= 0 ? 'Clearance fit' : r.cmax <= 0 ? 'Interference fit' : 'Transition fit';
      if (x.sh === 'p') w.push('p deviation approximated as ei = IT7 (ISO adds 0–5 µm steps) — confirm with ISO 286-2 tables.');
      return { hole: lim(r.hole.lo, r.hole.hi), shaft: lim(r.shaft.lo, r.shaft.hi), cmax: r.cmax * 1e-6, cmin: r.cmin * 1e-6, type, it: `IT${x.hIT} = ${r.ITh.toFixed(1)} µm / IT${x.sIT} = ${r.ITs.toFixed(1)} µm`, _warn: w,
        _info: ['Values are computed from the ISO 286-1 formulae and are not rounded to the tabulated values — expect ±1 µm differences from ISO 286-2 tables.'] };
    },
    eq: ['i = 0.45\\sqrt[3]{D} + 0.001D\\;[\\mu m]', 'IT6 = 10i,\\; IT7 = 16i,\\; IT8 = 25i', 'es_g = -2.5D^{0.34},\\; es_f = -5.5D^{0.41},\\; ei_n = 5D^{0.34}'],
    assume: ['Hole-basis system (H hole, EI = 0).', 'D = geometric mean of the ISO size step.'], limits: ['Always confirm against ISO 286-2 tables for drawings.'], refs: ['ISO 286-1:2010 Geometrical product specifications — ISO code system for tolerances on linear sizes.'],
  },
];
