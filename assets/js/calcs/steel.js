// Steel member design to EN 1993-1-1 (simplified): rolled I/H beams and columns.
import { I, O, SEL, PI, check } from './_h.js';
import { SECTIONS, SECTION } from '../data/sections.js';

const E = 210e9, G = 81e9;
const GRADES = [['235', 'S235'], ['275', 'S275'], ['355', 'S355'], ['460', 'S460']];
const SECS = SECTIONS.map(s => [s.id, `${s.name} — ${s.mass.toFixed(1)} kg/m`]);
// fy reduced for thick flanges (EN 10025-2, t > 40 mm)
const fyOf = (grade, tf) => { const f = +grade * 1e6; return tf > 0.04 ? f - 20e6 : f; };
const chi = (lam, alpha) => { const ph = 0.5 * (1 + alpha * (lam - 0.2) + lam * lam); return Math.min(1, 1 / (ph + Math.sqrt(Math.max(0, ph * ph - lam * lam)))); };

// Cross-section class for bending about y (outstand flange in compression, web in bending).
export function sectionClass(s, fy) {
  const eps = Math.sqrt(235e6 / fy), cf = (s.b - s.tw - 2 * s.r) / 2, cw = s.h - 2 * s.tf - 2 * s.r;
  const fl = cf / s.tf, wb = cw / s.tw;
  const cF = fl <= 9 * eps ? 1 : fl <= 10 * eps ? 2 : fl <= 14 * eps ? 3 : 4;
  const cW = wb <= 72 * eps ? 1 : wb <= 83 * eps ? 2 : wb <= 124 * eps ? 3 : 4;
  return { cls: Math.max(cF, cW), fl, wb, eps };
}

// Beam check: simply supported, UDL. Returns utilisations and intermediate values.
export function beamCheck(s, { grade, L, wU, wS, restraint, C1 = 1.127, defl = 250, sw = true }) {
  const fy = fyOf(grade, s.tf), { cls, eps } = sectionClass(s, fy);
  const wUd = wU + (sw ? 1.35 * s.mass * 9.81 : 0), wSd = wS + (sw ? s.mass * 9.81 : 0);
  const MEd = wUd * L * L / 8, VEd = wUd * L / 2;
  const Wy = cls <= 2 ? s.Wply : s.Wely;
  const McRd = Wy * fy, VcRd = s.Avz * fy / Math.sqrt(3);
  const Mcr = C1 * PI * PI * E * s.Iz / (L * L) * Math.sqrt(s.Iw / s.Iz + L * L * G * s.It / (PI * PI * E * s.Iz));
  const lamLT = Math.sqrt(Wy * fy / Mcr), aLT = s.h / s.b <= 2 ? 0.21 : 0.34;
  const chiLT = restraint === 'full' || lamLT <= 0.2 ? 1 : chi(lamLT, aLT);
  const MbRd = chiLT * Wy * fy;
  const delta = 5 * wSd * L ** 4 / (384 * E * s.Iy), dlim = L / defl;
  const u = { M: MEd / McRd, V: VEd / VcRd, LTB: restraint === 'full' ? 0 : MEd / MbRd, d: delta / dlim };
  return { fy, cls, eps, MEd, VEd, McRd, VcRd, Mcr, lamLT, chiLT, MbRd, delta, dlim, u, umax: Math.max(u.M, u.V, u.LTB, u.d), highShear: VEd > 0.5 * VcRd };
}

// Column check: pinned–pinned axial compression, flexural buckling about both axes (EN 1993-1-1 6.3.1).
export function columnCheck(s, { grade, Ly, Lz, NEd }) {
  const fy = fyOf(grade, s.tf), A = s.A, Npl = A * fy;
  const lam1 = PI * Math.sqrt(E / fy);
  const ly = Ly / s.iy / lam1, lz = Lz / s.iz / lam1;
  // Buckling curves for rolled I/H sections (Table 6.2)
  const hb = s.h / s.b, t = s.tf;
  const [ay, az] = hb > 1.2 ? (t <= 0.04 ? [0.21, 0.34] : [0.34, 0.49]) : (t <= 0.1 ? [0.34, 0.49] : [0.76, 0.76]);
  const cy = chi(ly, ay), cz = chi(lz, az), c = Math.min(cy, cz);
  return { fy, Npl, ly, lz, cy, cz, NbRd: c * Npl, u: NEd / (c * Npl), Ncr_y: PI * PI * E * s.Iy / (Ly * Ly), Ncr_z: PI * PI * E * s.Iz / (Lz * Lz) };
}

const secInfo = s => `${s.name}: h = ${(s.h * 1e3).toFixed(0)} mm, b = ${(s.b * 1e3).toFixed(0)} mm, A = ${(s.A * 1e4).toFixed(1)} cm², I_y = ${(s.Iy * 1e8).toFixed(0)} cm⁴, W_pl,y = ${(s.Wply * 1e6).toFixed(0)} cm³, ${s.mass.toFixed(1)} kg/m.`;

export default [
  {
    id: 'steel-beam', title: 'Steel Beam Design Check (EN 1993-1-1)', disc: 'structural', level: 'pro',
    tags: ['steel beam', 'eurocode 3', 'ec3', 'ipe', 'hea', 'heb', 'lateral torsional buckling', 'ltb', 'mcr', 'section class', 'bending resistance', 'shear resistance', 'beam sizing', 'deflection limit'],
    summary: 'Simply supported rolled I/H beam under UDL: section classification, bending and shear resistance, lateral–torsional buckling (M_cr, χ_LT), deflection limit and the lightest section that passes.',
    inputs: [
      SEL('sec', 'Section', SECS, 'IPE300'), SEL('grade', 'Steel grade', GRADES, '275'),
      I('L', 'Span', 'L', 'length', 6, { u: { si: 'm', imperial: 'ft' } }),
      I('wU', 'Design (ULS) line load, excl. self-weight', 'w_{Ed}', 'stiffness', 20e3, { u: { si: 'kN/m', imperial: 'kip/ft' }, hint: 'e.g. 1.35 g_k + 1.5 q_k' }),
      I('wS', 'Service (SLS) line load for deflection', 'w_{SLS}', 'stiffness', 10e3, { u: { si: 'kN/m', imperial: 'kip/ft' }, hint: 'Imposed load only is common for L/360; total load for L/250.' }),
      SEL('restraint', 'Compression flange', [['full', 'Fully restrained (e.g. slab on top)'], ['none', 'Unrestrained between supports']], 'full'),
      SEL('defl', 'Deflection limit', [['250', 'L/250 (total)'], ['360', 'L/360 (imposed, brittle finishes)'], ['200', 'L/200 (roof)']], '250'),
      SEL('sw', 'Include self-weight', [['yes', 'Yes'], ['no', 'No']], 'yes', { adv: true }),
      I('C1', 'Moment factor C₁ (LTB)', 'C_1', 'none', 1.127, { adv: true, hint: '1.127 for UDL on a simply supported span, load at shear centre; 1.0 for uniform moment.' }),
    ],
    outputs: [
      O('umax', 'Governing utilisation', 'U_{max}', 'none', { primary: true, u: { si: '%' } }),
      O('uM', 'Bending M_Ed / M_c,Rd', 'U_M', 'none', { u: { si: '%' } }), O('uV', 'Shear V_Ed / V_c,Rd', 'U_V', 'none', { u: { si: '%' } }), O('uLTB', 'LTB M_Ed / M_b,Rd', 'U_{LT}', 'none', { u: { si: '%' } }), O('ud', 'Deflection δ / δ_lim', 'U_\\delta', 'none', { u: { si: '%' } }),
      O('MEd', 'Design moment', 'M_{Ed}', 'torque', { u: { si: 'kN·m' } }), O('McRd', 'Bending resistance', 'M_{c,Rd}', 'torque', { u: { si: 'kN·m' } }), O('Mcr', 'Elastic critical moment', 'M_{cr}', 'torque', { u: { si: 'kN·m' } }), O('chiLT', 'LTB reduction factor', '\\chi_{LT}', 'none'), O('MbRd', 'Buckling resistance moment', 'M_{b,Rd}', 'torque', { u: { si: 'kN·m' } }),
      O('VEd', 'Design shear', 'V_{Ed}', 'force', { u: { si: 'kN' } }), O('VcRd', 'Shear resistance', 'V_{c,Rd}', 'force', { u: { si: 'kN' } }),
      O('delta', 'Mid-span deflection', '\\delta', 'length', { u: { si: 'mm' } }), O('cls', 'Section class', 'class', 'none'),
      O('best', 'Lightest passing section (same family)', '', 'none', { type: 'text' }),
    ],
    compute(x) {
      const s = SECTION[x.sec];
      const opts = { grade: x.grade, L: x.L, wU: x.wU, wS: x.wS, restraint: x.restraint, C1: x.C1, defl: +x.defl, sw: x.sw === 'yes' };
      const r = beamCheck(s, opts);
      const passing = SECTIONS.filter(t => t.fam === s.fam).filter(t => beamCheck(t, opts).umax <= 1).sort((a, b) => a.mass - b.mass);
      const w = [];
      if (r.highShear) w.push('V_Ed > 0.5 V_pl,Rd: bending resistance must be reduced for shear (EN 1993-1-1 6.2.8) — not applied here.');
      if (r.cls >= 3) w.push(`Class ${r.cls} section: elastic modulus used${r.cls === 4 ? '; class 4 needs effective-section properties (EN 1993-1-5)' : ''}.`);
      return {
        umax: r.umax, uM: r.u.M, uV: r.u.V, uLTB: r.u.LTB, ud: r.u.d, MEd: r.MEd, McRd: r.McRd, Mcr: r.Mcr, chiLT: r.chiLT, MbRd: r.MbRd, VEd: r.VEd, VcRd: r.VcRd, delta: r.delta, cls: r.cls,
        best: passing.length ? `${passing[0].name} (${passing[0].mass.toFixed(1)} kg/m)` : `No ${s.fam} section passes`,
        _checks: [check('Bending', r.u.M <= 1, `${(r.u.M * 100).toFixed(0)} %`), check('Shear', r.u.V <= 1, `${(r.u.V * 100).toFixed(0)} %`), ...(x.restraint === 'full' ? [] : [check('Lateral–torsional buckling', r.u.LTB <= 1, `${(r.u.LTB * 100).toFixed(0)} %, λ̄_LT = ${r.lamLT.toFixed(2)}`)]), check(`Deflection ≤ L/${x.defl}`, r.u.d <= 1, `${(r.delta * 1e3).toFixed(1)} mm vs ${(r.dlim * 1e3).toFixed(1)} mm`)],
        _warn: w, _info: [secInfo(s), `f_y = ${r.fy / 1e6} MPa, ε = ${r.eps.toFixed(3)}. γ_M0 = γ_M1 = 1.0 (recommended values; check your National Annex).`],
      };
    },
    eq: ['M_{c,Rd} = \\frac{W_{pl,y} f_y}{\\gamma_{M0}},\\quad V_{c,Rd} = \\frac{A_v f_y/\\sqrt3}{\\gamma_{M0}}', 'M_{cr} = C_1\\frac{\\pi^2 E I_z}{L^2}\\sqrt{\\frac{I_w}{I_z} + \\frac{L^2 G I_t}{\\pi^2 E I_z}}', '\\bar\\lambda_{LT} = \\sqrt{\\frac{W_y f_y}{M_{cr}}},\\quad \\chi_{LT} = \\frac{1}{\\Phi + \\sqrt{\\Phi^2 - \\bar\\lambda_{LT}^2}}', '\\delta = \\frac{5 w L^4}{384 E I_y}'],
    assume: ['Simply supported span, uniformly distributed load, load applied at the shear centre.', 'LTB by the general method (EN 1993-1-1 6.3.2.2): curve a for h/b ≤ 2, b otherwise.', 'E = 210 GPa, G = 81 GPa, γ_M0 = γ_M1 = 1.0. Section properties include root fillets.'],
    limits: ['No web bearing/buckling, shear–moment interaction, torsion or fire checks.', 'Preliminary design aid — final design must be checked by a qualified engineer against EN 1993-1-1 and the National Annex.'],
    refs: ['EN 1993-1-1:2005 §6.2, 6.3.2.', 'SCI P362 Steel Building Design: Concise Eurocodes; NCCI SN003 (M_cr).', 'ArcelorMittal Sections & Merchant Bars catalogue (section properties).'],
    related: ['beam-cases', 'section', 'steel-column'],
  },
  {
    id: 'steel-column', title: 'Steel Column Buckling Check (EN 1993-1-1)', disc: 'structural', level: 'pro',
    tags: ['steel column', 'flexural buckling', 'eurocode 3', 'buckling curve', 'hea', 'heb', 'axial resistance', 'strut'],
    summary: 'Axially loaded rolled I/H column: flexural buckling resistance about both axes using the Eurocode buckling curves, plus the lightest section that passes.',
    inputs: [SEL('sec', 'Section', SECS, 'HEB200'), SEL('grade', 'Steel grade', GRADES, '355'),
      I('Ly', 'Buckling length, major axis', 'L_{cr,y}', 'length', 4, { u: { si: 'm' } }), I('Lz', 'Buckling length, minor axis', 'L_{cr,z}', 'length', 4, { u: { si: 'm' } }),
      I('NEd', 'Design axial force', 'N_{Ed}', 'force', 1200e3, { u: { si: 'kN' } })],
    outputs: [O('u', 'Utilisation N_Ed / N_b,Rd', 'U', 'none', { primary: true, u: { si: '%' } }), O('NbRd', 'Buckling resistance', 'N_{b,Rd}', 'force', { u: { si: 'kN' } }), O('Npl', 'Squash load A·f_y', 'N_{pl,Rd}', 'force', { u: { si: 'kN' } }),
      O('ly', 'Slenderness λ̄_y', '\\bar\\lambda_y', 'none'), O('lz', 'Slenderness λ̄_z', '\\bar\\lambda_z', 'none'), O('cy', 'χ_y', '\\chi_y', 'none'), O('cz', 'χ_z', '\\chi_z', 'none'), O('best', 'Lightest passing section (same family)', '', 'none', { type: 'text' })],
    compute(x) {
      const s = SECTION[x.sec], r = columnCheck(s, x);
      const passing = SECTIONS.filter(t => t.fam === s.fam && columnCheck(t, x).u <= 1).sort((a, b) => a.mass - b.mass);
      return { u: r.u, NbRd: r.NbRd, Npl: r.Npl, ly: r.ly, lz: r.lz, cy: r.cy, cz: r.cz, best: passing.length ? `${passing[0].name} (${passing[0].mass.toFixed(1)} kg/m)` : `No ${s.fam} section passes`,
        _checks: [check('Flexural buckling', r.u <= 1, `${(r.u * 100).toFixed(0)} %`)], _info: [secInfo(s), 'Class 1–3 cross-section assumed (true for most H sections in pure compression — check slender IPE webs).'] };
    },
    eq: ['\\bar\\lambda = \\frac{L_{cr}}{i}\\cdot\\frac{1}{\\lambda_1},\\quad \\lambda_1 = \\pi\\sqrt{E/f_y}', '\\chi = \\frac{1}{\\Phi + \\sqrt{\\Phi^2 - \\bar\\lambda^2}},\\quad \\Phi = \\tfrac12[1 + \\alpha(\\bar\\lambda - 0.2) + \\bar\\lambda^2]', 'N_{b,Rd} = \\frac{\\chi A f_y}{\\gamma_{M1}}'],
    assume: ['Pinned ends unless the buckling lengths account for restraint; axial load only.', 'Buckling curves from EN 1993-1-1 Table 6.2 for rolled I/H sections (S235–S420 columns).'],
    limits: ['No torsional/flexural-torsional buckling or combined bending (6.3.3).'], refs: ['EN 1993-1-1:2005 §6.3.1.'], related: ['buckling', 'steel-beam'],
  },
];
