import { I, O, SEL, MAT, PI, sq, deg, rad, check } from './_h.js';

const matStrength = (x) => x.Sy || x.Su;

export default [
  {
    id: 'axial-stress', title: 'Axial Stress, Strain & Elongation', disc: 'structural', level: 'school', tags: ['stress', 'strain', "hooke's law", "young's modulus", 'tension', 'compression'],
    summary: 'Normal stress, strain and elongation of a bar under axial load, with a factor of safety against yield.',
    inputs: [I('F', 'Axial force', 'F', 'force', 20e3, { u: { si: 'kN' } }),
      SEL('sec', 'Cross-section', [['round', 'Solid round'], ['rect', 'Rectangle'], ['area', 'Known area']], 'round'),
      I('d', 'Diameter', 'd', 'length', 0.012, { u: { si: 'mm' }, showIf: v => v.sec === 'round' }),
      I('b', 'Width', 'b', 'length', 0.02, { u: { si: 'mm' }, showIf: v => v.sec === 'rect' }), I('t', 'Thickness', 't', 'length', 0.005, { u: { si: 'mm' }, showIf: v => v.sec === 'rect' }),
      I('A', 'Area', 'A', 'area', 1e-4, { u: { si: 'mm²' }, showIf: v => v.sec === 'area' }),
      I('L', 'Length', 'L', 'length', 1),
      MAT('mat', { E: 'E', Sy: 'Sy' }, 'st-1018-cd'),
      I('E', "Young's modulus", 'E', 'pressure', 205e9, { u: { si: 'GPa', imperial: 'Msi' } }), I('Sy', 'Yield strength', 'S_y', 'pressure', 370e6, { u: { si: 'MPa' } })],
    outputs: [O('sig', 'Normal stress', '\\sigma', 'pressure', { primary: true, u: { si: 'MPa' } }), O('eps', 'Strain', '\\varepsilon', 'none'), O('dL', 'Elongation', '\\delta', 'length', { u: { si: 'mm' } }), O('n', 'Factor of safety (yield)', 'n', 'none'), O('Ao', 'Area', 'A', 'area', { u: { si: 'mm²' } })],
    compute(x) {
      const A = x.sec === 'round' ? PI * x.d ** 2 / 4 : x.sec === 'rect' ? x.b * x.t : x.A;
      const sig = x.F / A, n = x.Sy / Math.abs(sig);
      const w = [];
      if (Math.abs(sig) > x.Sy) w.push('Stress exceeds yield — linear-elastic results are not valid.');
      if (x.F < 0) w.push('Compressive load: check buckling (see Euler buckling calculator).');
      return { Ao: A, sig, eps: sig / x.E, dL: x.F * x.L / (A * x.E), n, _warn: w, _checks: [check('Elastic (σ < S_y)', Math.abs(sig) < x.Sy, `n = ${n.toFixed(2)}`)] };
    },
    eq: ['\\sigma = \\frac{F}{A}', '\\varepsilon = \\frac{\\sigma}{E}', '\\delta = \\frac{FL}{AE}', 'n = \\frac{S_y}{\\sigma}'],
    assume: ['Load applied through the centroid (no bending).', 'Uniform, prismatic bar; linear-elastic material.', 'Away from stress concentrations (St Venant).'],
    limits: ['Stress concentrations at holes/shoulders need K_t.'], refs: ['Gere & Goodno, Mechanics of Materials, ch. 1–2.'], related: { learn: 'stress-strain' },
  },
  {
    id: 'shaft-torsion', title: 'Shaft Torsion', disc: 'structural', level: 'uni', tags: ['torsion', 'shear stress', 'angle of twist', 'polar moment', 'shaft'],
    summary: 'Maximum shear stress, angle of twist and factor of safety for a solid or hollow circular shaft under pure torsion.',
    inputs: [I('T', 'Torque', 'T', 'torque', 450), I('d', 'Outer diameter', 'd', 'length', 0.035, { u: { si: 'mm', imperial: 'in' } }), I('di', 'Inner diameter (0 = solid)', 'd_i', 'length', 0, { u: { si: 'mm', imperial: 'in' } }),
      I('L', 'Length', 'L', 'length', 0.5, { u: { si: 'mm', imperial: 'in' } }),
      MAT('mat', { G: 'G', Sy: 'Sy' }, 'st-4140-ann'),
      I('G', 'Shear modulus', 'G', 'pressure', 80e9, { u: { si: 'GPa', imperial: 'Msi' } }), I('Sy', 'Yield strength', 'S_y', 'pressure', 417e6, { u: { si: 'MPa' } }),
      I('nreq', 'Required safety factor', 'n_{req}', 'none', 2)],
    outputs: [O('tau', 'Maximum shear stress', '\\tau_{max}', 'pressure', { primary: true, u: { si: 'MPa' } }), O('Ssy', 'Shear yield (von Mises)', 'S_{sy}', 'pressure', { u: { si: 'MPa' } }), O('tall', 'Allowable shear stress', '\\tau_{allow}', 'pressure', { u: { si: 'MPa' } }), O('n', 'Factor of safety', 'n', 'none'),
      O('phi', 'Angle of twist', '\\phi', 'angle'), O('J', 'Polar second moment', 'J', 'areamoment', { u: { si: 'mm⁴' } }), O('kt', 'Torsional stiffness', 'k_t', 'rotstiff')],
    compute(x) {
      const J = PI * (x.d ** 4 - x.di ** 4) / 32;
      const tau = x.T * (x.d / 2) / J, Ssy = 0.577 * x.Sy, n = Ssy / tau;
      return { J, tau, Ssy, tall: Ssy / x.nreq, n, phi: x.T * x.L / (x.G * J), kt: x.G * J / x.L,
        _checks: [check(`n ≥ ${x.nreq} (required)`, n >= x.nreq, `n = ${n.toFixed(2)}`)], _warn: x.di >= x.d ? ['Inner diameter must be smaller than outer diameter.'] : [] };
    },
    eq: ['\\tau_{max} = \\frac{T r}{J} = \\frac{16 T d}{\\pi (d^4 - d_i^4)}', 'J = \\frac{\\pi}{32}(d^4 - d_i^4)', 'S_{sy} = 0.577\\,S_y \\;\\text{(distortion energy)}', '\\phi = \\frac{TL}{GJ}', 'n = S_{sy}/\\tau_{max}'],
    assume: ['Pure torsion (no bending or axial load).', 'Circular, prismatic, homogeneous, linear-elastic shaft.', 'Static load; von Mises (distortion-energy) yield criterion.'],
    limits: ['Keyways, shoulders and grooves add stress concentration.', 'Fluctuating torque needs a fatigue check (see Fatigue — Goodman).'],
    refs: ['Shigley §3-12, §5-5.', 'Gere & Goodno ch. 3.'], related: { eqs: ['torsion'] },
  },
  {
    id: 'shaft-size', title: 'Shaft Sizing — Combined Bending & Torsion (static)', disc: 'structural', level: 'pro', tags: ['shaft design', 'von mises', 'minimum diameter', 'bending', 'torsion'],
    summary: 'Minimum solid shaft diameter for combined bending moment and torque using the distortion-energy criterion.',
    inputs: [I('M', 'Bending moment', 'M', 'torque', 300), I('T', 'Torque', 'T', 'torque', 450), MAT('mat', { Sy: 'Sy' }, 'st-1045-cd'), I('Sy', 'Yield strength', 'S_y', 'pressure', 530e6, { u: { si: 'MPa' } }), I('n', 'Design factor', 'n', 'none', 2.5)],
    outputs: [O('d', 'Minimum diameter', 'd_{min}', 'length', { primary: true, u: { si: 'mm', imperial: 'in' } }), O('sv', 'von Mises stress at d_min', "\\sigma'", 'pressure', { u: { si: 'MPa' } }), O('sb', 'Bending stress at d_min', '\\sigma_b', 'pressure', { u: { si: 'MPa' } }), O('ts', 'Torsional stress at d_min', '\\tau', 'pressure', { u: { si: 'MPa' } })],
    compute({ M, T, Sy, n }) {
      const d = Math.cbrt(16 * n * Math.sqrt(4 * M * M + 3 * T * T) / (PI * Sy));
      const sb = 32 * M / (PI * d ** 3), ts = 16 * T / (PI * d ** 3);
      return { d, sb, ts, sv: Math.sqrt(sb * sb + 3 * ts * ts), _info: ['Round up to the next standard size, then check deflection, critical speed and fatigue.'] };
    },
    eq: ['\\sigma_b = \\frac{32M}{\\pi d^3},\\quad \\tau = \\frac{16T}{\\pi d^3}', "\\sigma' = \\sqrt{\\sigma_b^2 + 3\\tau^2} = \\frac{S_y}{n}", 'd = \\left[\\frac{16n}{\\pi S_y}\\sqrt{4M^2 + 3T^2}\\right]^{1/3}'],
    assume: ['Solid circular shaft, static loading.', 'Distortion-energy (von Mises) criterion.', 'Axial loads and transverse shear neglected.'],
    limits: ['Rotating shafts see fully reversed bending — use a fatigue criterion (DE-Goodman, ASME B106.1M) for final design.'], refs: ['Shigley §7-4.'],
  },
  {
    id: 'beam-cases', title: 'Beam Deflection — Standard Cases', disc: 'structural', level: 'uni', tags: ['beam', 'deflection', 'bending moment', 'reactions', 'cantilever', 'simply supported'],
    summary: 'Reactions, maximum moment, maximum deflection and bending stress for textbook beam cases.',
    inputs: [
      SEL('case', 'Case', [['ss_p', 'Simply supported — centre point load'], ['ss_w', 'Simply supported — UDL'], ['cant_p', 'Cantilever — end point load'], ['cant_w', 'Cantilever — UDL'], ['ff_p', 'Fixed–fixed — centre point load'], ['ff_w', 'Fixed–fixed — UDL'], ['prop_w', 'Propped cantilever — UDL']], 'ss_p'),
      I('L', 'Span', 'L', 'length', 4), I('P', 'Point load', 'P', 'force', 10e3, { u: { si: 'kN' }, showIf: v => v.case.endsWith('_p') }), I('w', 'Distributed load', 'w', 'stiffness', 5e3, { u: { si: 'kN/m' }, showIf: v => v.case.endsWith('_w') }),
      MAT('mat', { E: 'E' }, 'st-s355'), I('E', "Young's modulus", 'E', 'pressure', 210e9, { u: { si: 'GPa', imperial: 'Msi' } }),
      I('I', 'Second moment of area', 'I', 'areamoment', 8.36e-6, { u: { si: 'mm⁴', metric: 'cm⁴' }, hint: 'Use the Section Properties calculator if unknown.' }),
      I('c', 'Distance to extreme fibre', 'c', 'length', 0.1, { u: { si: 'mm' } })],
    outputs: [O('dmax', 'Maximum deflection', '\\delta_{max}', 'length', { primary: true, u: { si: 'mm', imperial: 'in' } }), O('Mmax', 'Maximum bending moment', 'M_{max}', 'torque', { u: { si: 'kN·m' } }), O('Vmax', 'Maximum shear force', 'V_{max}', 'force', { u: { si: 'kN' } }), O('RA', 'Reaction A (left / fixed)', 'R_A', 'force', { u: { si: 'kN' } }), O('RB', 'Reaction B (right)', 'R_B', 'force', { u: { si: 'kN' } }), O('sig', 'Max bending stress', '\\sigma_{max}', 'pressure', { u: { si: 'MPa' } }), O('ratio', 'Span / deflection', 'L/\\delta', 'none')],
    compute(x) {
      const { L, P, w, E, I, c } = x, EI = E * I;
      const r = {
        ss_p: [P * L ** 3 / (48 * EI), P * L / 4, P / 2, P / 2, P / 2],
        ss_w: [5 * w * L ** 4 / (384 * EI), w * L * L / 8, w * L / 2, w * L / 2, w * L / 2],
        cant_p: [P * L ** 3 / (3 * EI), P * L, P, P, 0],
        cant_w: [w * L ** 4 / (8 * EI), w * L * L / 2, w * L, w * L, 0],
        ff_p: [P * L ** 3 / (192 * EI), P * L / 8, P / 2, P / 2, P / 2],
        ff_w: [w * L ** 4 / (384 * EI), w * L * L / 12, w * L / 2, w * L / 2, w * L / 2],
        prop_w: [w * L ** 4 / (185 * EI), w * L * L / 8, 5 * w * L / 8, 5 * w * L / 8, 3 * w * L / 8],
      }[x.case];
      const [dmax, Mmax, Vmax, RA, RB] = r;
      return { dmax, Mmax, Vmax, RA, RB, sig: Mmax * c / I, ratio: L / dmax, _info: ['For arbitrary loads/supports and full SFD/BMD, open the Beam Solver.'] };
    },
    eq: ['\\text{SS, centre }P:\\; \\delta = \\frac{PL^3}{48EI},\\; M = \\frac{PL}{4}', '\\text{SS, UDL}:\\; \\delta = \\frac{5wL^4}{384EI},\\; M = \\frac{wL^2}{8}', '\\text{Cantilever }P:\\; \\delta = \\frac{PL^3}{3EI},\\; M = PL', '\\text{Cantilever UDL}:\\; \\delta = \\frac{wL^4}{8EI}', '\\text{Fixed–fixed }P:\\; \\delta = \\frac{PL^3}{192EI}', '\\text{Fixed–fixed UDL}:\\; \\delta = \\frac{wL^4}{384EI},\\; M = \\frac{wL^2}{12}', '\\sigma = \\frac{Mc}{I}'],
    assume: ['Euler–Bernoulli beam theory (plane sections remain plane, small deflections).', 'Linear-elastic, prismatic, homogeneous beam.', 'Self-weight not included unless added to w.'],
    limits: ['Short deep beams (L/h < ~10) have significant shear deflection (Timoshenko).', 'Lateral-torsional buckling not checked.'],
    refs: ['Roark\'s Formulas for Stress and Strain, Table 8.1.', 'Gere & Goodno, Appendix H.'], related: { solver: 'beam', learn: 'beam-bending' },
  },
  {
    id: 'section', title: 'Section Properties', disc: 'structural', level: 'uni', tags: ['second moment of area', 'section modulus', 'radius of gyration', 'moment of inertia', 'i-beam', 'hollow section'],
    summary: 'Area, second moments, elastic & plastic section moduli and radii of gyration for common cross-sections.',
    inputs: [
      SEL('shape', 'Shape', [['rect', 'Rectangle'], ['hrect', 'Hollow rectangle (RHS/SHS)'], ['circ', 'Solid circle'], ['tube', 'Circular tube (CHS)'], ['ibeam', 'Symmetric I-section']], 'rect'),
      I('b', 'Width b', 'b', 'length', 0.05, { u: { si: 'mm' }, showIf: v => ['rect', 'hrect', 'ibeam'].includes(v.shape) }),
      I('h', 'Depth h', 'h', 'length', 0.1, { u: { si: 'mm' }, showIf: v => ['rect', 'hrect', 'ibeam'].includes(v.shape) }),
      I('D', 'Outer diameter', 'D', 'length', 0.06, { u: { si: 'mm' }, showIf: v => ['circ', 'tube'].includes(v.shape) }),
      I('t', 'Wall thickness', 't', 'length', 0.004, { u: { si: 'mm' }, showIf: v => ['hrect', 'tube'].includes(v.shape) }),
      I('tf', 'Flange thickness', 't_f', 'length', 0.0085, { u: { si: 'mm' }, showIf: v => v.shape === 'ibeam' }), I('tw', 'Web thickness', 't_w', 'length', 0.0056, { u: { si: 'mm' }, showIf: v => v.shape === 'ibeam' }),
      I('rho', 'Density (for mass/length)', '\\rho', 'density', 7850, { adv: true })],
    outputs: [O('A', 'Area', 'A', 'area', { u: { si: 'mm²' } }), O('Ix', 'Second moment, major axis', 'I_x', 'areamoment', { primary: true, u: { si: 'mm⁴', metric: 'cm⁴' } }), O('Iy', 'Second moment, minor axis', 'I_y', 'areamoment', { u: { si: 'mm⁴', metric: 'cm⁴' } }),
      O('Zx', 'Elastic section modulus', 'Z_x', 'sectionmod', { u: { si: 'mm³', metric: 'cm³' } }), O('Zpx', 'Plastic section modulus', 'Z_{p,x}', 'sectionmod', { u: { si: 'mm³', metric: 'cm³' } }), O('rx', 'Radius of gyration x', 'r_x', 'length', { u: { si: 'mm' } }), O('ry', 'Radius of gyration y', 'r_y', 'length', { u: { si: 'mm' } }), O('J', 'Torsion constant', 'J', 'areamoment', { u: { si: 'mm⁴' } }), O('mpl', 'Mass per length', 'm/L', 'massperlen')],
    compute(x) {
      let A, Ix, Iy, Zx, Zpx, J;
      const w = [];
      switch (x.shape) {
        case 'rect': A = x.b * x.h; Ix = x.b * x.h ** 3 / 12; Iy = x.h * x.b ** 3 / 12; Zx = Ix / (x.h / 2); Zpx = x.b * x.h ** 2 / 4; { const a = Math.max(x.b, x.h), b = Math.min(x.b, x.h); J = a * b ** 3 * (1 / 3 - 0.21 * b / a * (1 - b ** 4 / (12 * a ** 4))); } break;
        case 'hrect': { const bi = x.b - 2 * x.t, hi = x.h - 2 * x.t; A = x.b * x.h - bi * hi; Ix = (x.b * x.h ** 3 - bi * hi ** 3) / 12; Iy = (x.h * x.b ** 3 - hi * bi ** 3) / 12; Zx = Ix / (x.h / 2); Zpx = x.b * x.h ** 2 / 4 - bi * hi ** 2 / 4; const Am = (x.b - x.t) * (x.h - x.t), p = 2 * ((x.b - x.t) + (x.h - x.t)); J = 4 * Am * Am * x.t / p; if (bi <= 0 || hi <= 0) w.push('Wall too thick for the outer size.'); break; }
        case 'circ': A = PI * x.D ** 2 / 4; Ix = Iy = PI * x.D ** 4 / 64; Zx = PI * x.D ** 3 / 32; Zpx = x.D ** 3 / 6; J = 2 * Ix; break;
        case 'tube': { const d = x.D - 2 * x.t; A = PI * (x.D ** 2 - d ** 2) / 4; Ix = Iy = PI * (x.D ** 4 - d ** 4) / 64; Zx = Ix / (x.D / 2); Zpx = (x.D ** 3 - d ** 3) / 6; J = 2 * Ix; break; }
        case 'ibeam': { const hw = x.h - 2 * x.tf; A = 2 * x.b * x.tf + hw * x.tw; Ix = (x.b * x.h ** 3 - (x.b - x.tw) * hw ** 3) / 12; Iy = 2 * x.tf * x.b ** 3 / 12 + hw * x.tw ** 3 / 12; Zx = Ix / (x.h / 2); Zpx = x.b * x.tf * (x.h - x.tf) + x.tw * hw ** 2 / 4; J = (2 * x.b * x.tf ** 3 + (x.h - x.tf) * x.tw ** 3) / 3; w.push('Root fillets are ignored — rolled-section tables give slightly higher A and I.'); break; }
      }
      return { A, Ix, Iy, Zx, Zpx, rx: Math.sqrt(Ix / A), ry: Math.sqrt(Iy / A), J, mpl: A * x.rho, _warn: w };
    },
    eq: ['I_{rect} = \\frac{bh^3}{12}', 'I_{circ} = \\frac{\\pi D^4}{64}', 'Z = \\frac{I}{y_{max}}', 'r = \\sqrt{I/A}', 'I_{I} = \\frac{bh^3 - (b-t_w)(h-2t_f)^3}{12}'],
    assume: ['Sharp corners (no fillets/radii).', 'J for rectangles uses Roark\'s approximation; RHS uses thin-wall Bredt formula.'],
    limits: ['Use manufacturer/standard section tables (e.g. EN 10365, AISC Shapes Database) for rolled sections.'], refs: ['Roark\'s Formulas, Table A.1 and Table 10.7.', 'Gere & Goodno, Appendix E.'], related: { solver: 'beam' },
  },
  {
    id: 'buckling', title: 'Column Buckling (Euler / Johnson)', disc: 'structural', level: 'uni', tags: ['euler buckling', 'johnson', 'slenderness', 'critical load', 'column', 'effective length'],
    summary: 'Critical buckling load of a column, automatically switching to the Johnson parabola for intermediate slenderness.',
    inputs: [I('L', 'Length', 'L', 'length', 2),
      SEL('K', 'End conditions (K)', [['1', 'Pinned–pinned (K = 1.0)'], ['2', 'Fixed–free (K = 2.0)'], ['0.7', 'Fixed–pinned (K = 0.7)'], ['0.5', 'Fixed–fixed (K = 0.5)'], ['0.65', 'Fixed–fixed, design (AISC K = 0.65)'], ['0.8', 'Fixed–pinned, design (K = 0.8)'], ['2.1', 'Fixed–free, design (K = 2.1)']], '1'),
      MAT('mat', { E: 'E', Sy: 'Sy' }, 'st-s355'),
      I('E', "Young's modulus", 'E', 'pressure', 210e9, { u: { si: 'GPa', imperial: 'Msi' } }), I('Sy', 'Yield strength', 'S_y', 'pressure', 355e6, { u: { si: 'MPa' } }),
      I('A', 'Cross-section area', 'A', 'area', 1.2e-3, { u: { si: 'mm²' } }), I('I', 'Least second moment of area', 'I_{min}', 'areamoment', 5e-7, { u: { si: 'mm⁴', metric: 'cm⁴' } }), I('n', 'Design factor', 'n', 'none', 3, { adv: true })],
    outputs: [O('Pcr', 'Critical load', 'P_{cr}', 'force', { primary: true, u: { si: 'kN' } }), O('Pall', 'Allowable load (P_cr / n)', 'P_{all}', 'force', { u: { si: 'kN' } }), O('scr', 'Critical stress', '\\sigma_{cr}', 'pressure', { u: { si: 'MPa' } }), O('lam', 'Slenderness ratio', 'KL/r', 'none'), O('lamc', 'Transition slenderness', '(KL/r)_c', 'none'), O('method', 'Governing method', '', 'none', { type: 'text' }), O('PE', 'Euler load (for reference)', 'P_E', 'force', { u: { si: 'kN' } })],
    compute(x) {
      const K = parseFloat(x.K), r = Math.sqrt(x.I / x.A), lam = K * x.L / r, lamc = Math.sqrt(2 * PI * PI * x.E / x.Sy);
      const PE = PI * PI * x.E * x.I / (K * x.L) ** 2;
      let scr, method;
      if (lam >= lamc) { scr = PE / x.A; method = 'Euler (long column)'; } else { scr = x.Sy - (x.Sy * lam / (2 * PI)) ** 2 / x.E; method = 'Johnson parabola (intermediate column)'; }
      const w = lam < 10 ? ['Very stocky member (KL/r < 10): treat as a compression block — crushing/yield governs.'] : [];
      return { Pcr: scr * x.A, Pall: scr * x.A / x.n, scr, lam, lamc, method, PE, _warn: w };
    },
    eq: ['P_E = \\frac{\\pi^2 EI}{(KL)^2}', '\\frac{KL}{r},\\; r = \\sqrt{I/A}', '\\left(\\frac{KL}{r}\\right)_c = \\sqrt{\\frac{2\\pi^2 E}{S_y}}', '\\sigma_{cr,J} = S_y - \\frac{1}{E}\\left(\\frac{S_y}{2\\pi}\\frac{KL}{r}\\right)^2'],
    assume: ['Perfectly straight, centrally loaded, prismatic column.', 'Buckling about the axis of least I.'],
    limits: ['Real columns have imperfections and residual stresses — structural codes (EN 1993-1-1 buckling curves, AISC 360 Ch. E) give lower design capacities.', 'Local buckling of thin walls not checked.'],
    refs: ['Shigley §4-14 to 4-16.', 'Timoshenko & Gere, Theory of Elastic Stability.'], related: { learn: 'beam-bending' },
  },
  {
    id: 'mohr', title: "Principal Stresses & Mohr's Circle", disc: 'structural', level: 'uni', tags: ['mohr circle', 'principal stress', 'von mises', 'tresca', 'stress transformation', 'plane stress'],
    summary: "Principal stresses, maximum shear, principal angle and von Mises/Tresca equivalent stresses for plane stress, with Mohr's circle.",
    inputs: [I('sx', 'Normal stress σx', '\\sigma_x', 'pressure', 80e6, { u: { si: 'MPa' } }), I('sy', 'Normal stress σy', '\\sigma_y', 'pressure', -20e6, { u: { si: 'MPa' } }), I('txy', 'Shear stress τxy', '\\tau_{xy}', 'pressure', 40e6, { u: { si: 'MPa' } }),
      MAT('mat', { Sy: 'Sy' }, 'al-6061-t6', { adv: true }), I('Sy', 'Yield strength', 'S_y', 'pressure', 276e6, { u: { si: 'MPa' }, adv: true })],
    outputs: [O('s1', 'Principal stress σ₁', '\\sigma_1', 'pressure', { u: { si: 'MPa' } }), O('s2', 'Principal stress σ₂', '\\sigma_2', 'pressure', { u: { si: 'MPa' } }), O('tmax', 'Max in-plane shear', '\\tau_{max}', 'pressure', { u: { si: 'MPa' } }), O('tabs', 'Absolute max shear (3D, σ₃ = 0)', '\\tau_{abs}', 'pressure', { u: { si: 'MPa' } }),
      O('thp', 'Principal angle', '\\theta_p', 'angle'), O('svm', 'von Mises stress', "\\sigma'", 'pressure', { primary: true, u: { si: 'MPa' } }), O('nvm', 'Safety factor (von Mises)', 'n_{DE}', 'none'), O('ntr', 'Safety factor (Tresca)', 'n_{MSS}', 'none')],
    compute(x) {
      const c = (x.sx + x.sy) / 2, R = Math.hypot((x.sx - x.sy) / 2, x.txy);
      const s1 = c + R, s2 = c - R, thp = 0.5 * Math.atan2(2 * x.txy, x.sx - x.sy);
      const svm = Math.sqrt(s1 * s1 - s1 * s2 + s2 * s2);
      const tabs = Math.max(Math.abs(s1 - s2), Math.abs(s1), Math.abs(s2)) / 2;
      // Mohr's circle SVG
      const W = 520, H = 300, pad = 36;
      const span = Math.max(Math.abs(s1), Math.abs(s2), R) * 1.25 || 1;
      const sc = Math.min((W - 2 * pad) / (2 * span), (H - 2 * pad) / (2 * R * 1.25 || 1));
      const X = s => W / 2 + (s - 0) * sc, Y = t => H / 2 + t * sc;
      const f = v => (v / 1e6).toFixed(1);
      const svg = `<svg class="plot" viewBox="0 0 ${W} ${H}">
        <line class="gl" x1="${pad}" x2="${W - pad}" y1="${H / 2}" y2="${H / 2}"/><line class="gl" x1="${X(0)}" x2="${X(0)}" y1="${pad / 2}" y2="${H - pad / 2}"/>
        <circle cx="${X(c)}" cy="${H / 2}" r="${R * sc}" fill="var(--acc-soft)" stroke="var(--acc)" stroke-width="2"/>
        <line x1="${X(x.sx)}" y1="${Y(x.txy)}" x2="${X(x.sy)}" y2="${Y(-x.txy)}" stroke="var(--c2)" stroke-width="1.6"/>
        <circle cx="${X(x.sx)}" cy="${Y(x.txy)}" r="4" fill="var(--c2)"/><text x="${X(x.sx) + 6}" y="${Y(x.txy) - 6}" style="fill:var(--c2)">x (${f(x.sx)}, ${f(x.txy)})</text>
        <circle cx="${X(x.sy)}" cy="${Y(-x.txy)}" r="4" fill="var(--c2)"/><text x="${X(x.sy) + 6}" y="${Y(-x.txy) + 14}" style="fill:var(--c2)">y (${f(x.sy)}, ${f(-x.txy)})</text>
        <circle cx="${X(s1)}" cy="${H / 2}" r="4" fill="var(--c3)"/><text x="${X(s1) + 4}" y="${H / 2 - 6}" style="fill:var(--c3)">σ₁ ${f(s1)}</text>
        <circle cx="${X(s2)}" cy="${H / 2}" r="4" fill="var(--c3)"/><text x="${X(s2) - 4}" y="${H / 2 - 6}" text-anchor="end" style="fill:var(--c3)">σ₂ ${f(s2)}</text>
        <text x="${X(c)}" y="${H / 2 - R * sc - 6}" text-anchor="middle">τmax ${f(R)}</text>
        <text x="${W - pad}" y="${H / 2 + 14}" text-anchor="end">σ (MPa)</text><text x="${X(0) + 4}" y="${H - 8}">τ (cw +, MPa)</text></svg>`;
      return { s1, s2, tmax: R, tabs, thp, svm, nvm: x.Sy / svm, ntr: x.Sy / (2 * tabs), _svg: svg };
    },
    eq: ['\\sigma_{1,2} = \\frac{\\sigma_x+\\sigma_y}{2} \\pm \\sqrt{\\left(\\frac{\\sigma_x-\\sigma_y}{2}\\right)^2 + \\tau_{xy}^2}', '\\tan 2\\theta_p = \\frac{2\\tau_{xy}}{\\sigma_x - \\sigma_y}', "\\sigma' = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2}", 'n_{MSS} = \\frac{S_y}{2\\tau_{abs}}'],
    assume: ['Plane stress (σz = τxz = τyz = 0).', 'Ductile isotropic material for the yield criteria.'], limits: ['Brittle materials: use Coulomb–Mohr / modified Mohr.'],
    refs: ['Shigley §3-6, §5-4, §5-5.', 'Gere & Goodno ch. 7.'],
  },
  {
    id: 'pressure-vessel', title: 'Thin-Walled Pressure Vessel', disc: 'structural', level: 'uni', tags: ['hoop stress', 'longitudinal stress', 'pressure vessel', 'pipe', 'cylinder', 'sphere'],
    summary: 'Hoop and longitudinal membrane stresses in thin-walled cylinders and spheres under internal pressure.',
    inputs: [SEL('type', 'Geometry', [['cyl', 'Cylinder (closed ends)'], ['sph', 'Sphere']], 'cyl'), I('p', 'Internal gauge pressure', 'p', 'pressure', 2e6, { u: { si: 'bar', imperial: 'psi' } }), I('D', 'Mean diameter', 'D', 'length', 0.5, { u: { si: 'mm' } }), I('t', 'Wall thickness', 't', 'length', 0.006, { u: { si: 'mm' } }),
      MAT('mat', { Sy: 'Sy' }, 'ss-316'), I('Sy', 'Yield strength', 'S_y', 'pressure', 290e6, { u: { si: 'MPa' } })],
    outputs: [O('sh', 'Hoop stress', '\\sigma_\\theta', 'pressure', { primary: true, u: { si: 'MPa' } }), O('sl', 'Longitudinal stress', '\\sigma_L', 'pressure', { u: { si: 'MPa' } }), O('svm', 'von Mises stress', "\\sigma'", 'pressure', { u: { si: 'MPa' } }), O('n', 'Safety factor vs yield', 'n', 'none'), O('rt', 'Radius / thickness', 'r/t', 'none')],
    compute(x) {
      const r = x.D / 2, sh = x.type === 'cyl' ? x.p * r / x.t : x.p * r / (2 * x.t), sl = x.p * r / (2 * x.t);
      const svm = Math.sqrt(sh * sh - sh * sl + sl * sl);
      const w = r / x.t < 10 ? ['r/t < 10: thin-wall theory is inaccurate — use Lamé thick-wall equations.'] : [];
      return { sh, sl, svm, n: x.Sy / svm, rt: r / x.t, _warn: w };
    },
    eq: ['\\sigma_\\theta = \\frac{pr}{t}\\;\\text{(cylinder)}', '\\sigma_L = \\frac{pr}{2t}', '\\sigma_{sphere} = \\frac{pr}{2t}'],
    assume: ['r/t ≥ 10; membrane stresses uniform through thickness.', 'Radial stress neglected.', 'Away from heads, nozzles and supports.'],
    limits: ['Not a code calculation. Pressure equipment design must follow ASME BPVC Section VIII, EN 13445 or the applicable code (including joint efficiency and corrosion allowance).'],
    refs: ['Gere & Goodno §8.2–8.3.', 'ASME BPVC Section VIII Div. 1, UG-27 (for code formulas).'],
  },
  {
    id: 'thermal-stress', title: 'Thermal Expansion & Thermal Stress', disc: 'structural', level: 'uni', tags: ['thermal expansion', 'thermal stress', 'restrained', 'coefficient of expansion'],
    summary: 'Free thermal expansion of a bar and the stress developed if it is fully restrained.',
    inputs: [I('L', 'Length', 'L', 'length', 2), I('dT', 'Temperature change', '\\Delta T', 'tempdiff', 60), MAT('mat', { E: 'E', a: 'a' }, 'al-6061-t6'),
      I('E', "Young's modulus", 'E', 'pressure', 68.9e9, { u: { si: 'GPa', imperial: 'Msi' } }), I('a', 'Expansion coefficient', '\\alpha', 'expansion', 23.6e-6, { u: { si: 'µm/(m·K)' } }), I('gap', 'Available gap', 'g', 'length', 0.001, { u: { si: 'mm' }, adv: true })],
    outputs: [O('dL', 'Free expansion', '\\Delta L', 'length', { primary: true, u: { si: 'mm' } }), O('eps', 'Thermal strain', '\\varepsilon_T', 'none'), O('sig', 'Stress if fully restrained', '\\sigma', 'pressure', { u: { si: 'MPa' } }), O('sigg', 'Stress after gap closes', '\\sigma_g', 'pressure', { u: { si: 'MPa' } })],
    compute(x) {
      const dL = x.a * x.dT * x.L;
      const sigg = dL > x.gap ? -x.E * (dL - x.gap) / x.L : 0;
      return { dL, eps: x.a * x.dT, sig: -x.E * x.a * x.dT, sigg };
    },
    eq: ['\\Delta L = \\alpha\\,\\Delta T\\, L', '\\sigma = -E\\alpha\\Delta T\\;\\text{(fully restrained)}', '\\sigma_g = -E\\frac{\\Delta L - g}{L}'],
    assume: ['Uniform temperature change; α constant over the range.', 'Rigid restraint.'], limits: ['Compressive thermal stress may cause buckling.'], refs: ['Gere & Goodno §2.5.'],
  },
  {
    id: 'fatigue', title: 'Fatigue — Marin Factors & Modified Goodman', disc: 'structural', level: 'pro', tags: ['fatigue', 'endurance limit', 'goodman', 'marin', 's-n', 'fluctuating stress'],
    summary: 'Corrected endurance limit (Marin factors) and fatigue/yield safety factors for fluctuating stress on steel parts.',
    inputs: [MAT('mat', { Su: 'Su', Sy: 'Sy' }, 'st-1045-cd'), I('Su', 'Ultimate tensile strength', 'S_{ut}', 'pressure', 630e6, { u: { si: 'MPa' } }), I('Sy', 'Yield strength', 'S_y', 'pressure', 530e6, { u: { si: 'MPa' } }),
      I('sa', 'Alternating stress (incl. K_f)', '\\sigma_a', 'pressure', 120e6, { u: { si: 'MPa' } }), I('sm', 'Mean stress (incl. K_f)', '\\sigma_m', 'pressure', 80e6, { u: { si: 'MPa' } }),
      SEL('surf', 'Surface finish', [['ground', 'Ground'], ['machined', 'Machined / cold-drawn'], ['hot', 'Hot-rolled'], ['forged', 'As-forged']], 'machined'),
      I('d', 'Diameter (size factor)', 'd', 'length', 0.03, { u: { si: 'mm' } }),
      SEL('load', 'Loading', [['bend', 'Bending'], ['axial', 'Axial'], ['tors', 'Torsion']], 'bend'),
      SEL('rel', 'Reliability', [['1', '50 %'], ['0.897', '90 %'], ['0.868', '95 %'], ['0.814', '99 %'], ['0.753', '99.9 %']], '1')],
    outputs: [O('Se0', 'Rotating-beam endurance limit', "S_e'", 'pressure', { u: { si: 'MPa' } }), O('ka', 'Surface factor', 'k_a', 'none'), O('kb', 'Size factor', 'k_b', 'none'), O('kc', 'Load factor', 'k_c', 'none'), O('ke', 'Reliability factor', 'k_e', 'none'),
      O('Se', 'Corrected endurance limit', 'S_e', 'pressure', { u: { si: 'MPa' } }), O('nf', 'Fatigue safety factor (Goodman)', 'n_f', 'none', { primary: true }), O('ny', 'First-cycle yield factor (Langer)', 'n_y', 'none')],
    compute(x) {
      const SuM = x.Su / 1e6;
      const Se0 = (SuM <= 1400 ? 0.5 * SuM : 700) * 1e6;
      const [a, b] = { ground: [1.58, -0.085], machined: [4.51, -0.265], hot: [57.7, -0.718], forged: [272, -0.995] }[x.surf];
      const ka = a * Math.pow(SuM, b);
      const dm = x.d * 1e3;
      let kb = 1;
      if (x.load !== 'axial') kb = dm <= 51 ? 1.24 * Math.pow(Math.max(dm, 2.79), -0.107) : 1.51 * Math.pow(Math.min(dm, 254), -0.157);
      const kc = { bend: 1, axial: 0.85, tors: 0.59 }[x.load];
      const ke = parseFloat(x.rel);
      const Se = ka * kb * kc * ke * Se0;
      const nf = 1 / (x.sa / Se + x.sm / x.Su), ny = x.Sy / (x.sa + x.sm);
      const w = [];
      if (x.load === 'tors') w.push('For torsion, Shigley recommends using von Mises equivalent stresses with k_c = 1 instead; k_c = 0.59 applies to pure torsional endurance.');
      if (x.sm < 0) w.push('Compressive mean stress: Goodman is conservative; fatigue is governed by σa ≤ Se.');
      return { Se0, ka, kb, kc, ke, Se, nf, ny, _checks: [check('Infinite life (n_f > 1)', nf > 1, `n_f = ${nf.toFixed(2)}`), check('No first-cycle yield (n_y > 1)', ny > 1, `n_y = ${ny.toFixed(2)}`)], _warn: w };
    },
    eq: ["S_e' = 0.5\\,S_{ut}\\;(S_{ut} \\le 1400\\text{ MPa})", 'S_e = k_a k_b k_c k_d k_e k_f\\, S_e\'', 'k_a = a\\,S_{ut}^{\\,b}', 'k_b = 1.24\\,d^{-0.107}\\;(2.79 \\le d \\le 51\\text{ mm})', '\\frac{\\sigma_a}{S_e} + \\frac{\\sigma_m}{S_{ut}} = \\frac{1}{n_f}'],
    assume: ['Steel with rotating-beam endurance limit behaviour.', 'Stresses already include the fatigue stress-concentration factor K_f.', 'Room temperature (k_d = 1), no miscellaneous effects (k_f = 1).'],
    limits: ['Aluminium and most non-ferrous alloys have no true endurance limit — use S-N data at a specified life.', 'Estimates carry ±20 % or more scatter; test data govern for critical parts.'],
    refs: ['Shigley\'s Mechanical Engineering Design, 10th ed., §6-9 to 6-12, Table 6-2 (Marin surface factor), Eq. 6-20 (size), Table 6-5 (reliability).'],
  },
];
