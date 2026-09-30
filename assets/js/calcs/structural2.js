// Load combinations (EN 1990) and reinforced-concrete beam design (EN 1992-1-1, simplified).
import { I, O, SEL, PI, check } from './_h.js';

// ψ factors, EN 1990 Table A1.1 (recommended values)
const PSI = { A: ['Cat. A: domestic, residential', 0.7, 0.5, 0.3], B: ['Cat. B: offices', 0.7, 0.5, 0.3], C: ['Cat. C: congregation areas', 0.7, 0.7, 0.6], D: ['Cat. D: shopping', 0.7, 0.7, 0.6], E: ['Cat. E: storage', 1.0, 0.9, 0.8], H: ['Cat. H: roofs', 0, 0, 0], S: ['Snow (sites ≤ 1000 m)', 0.5, 0.2, 0], W: ['Wind', 0.6, 0.2, 0] };
const PSI_OPTS = Object.entries(PSI).map(([k, v]) => [k, v[0]]);

export default [
  {
    id: 'load-comb', title: 'Load Combinations (EN 1990)', disc: 'structural', level: 'pro',
    tags: ['load combination', 'eurocode 0', 'en 1990', 'uls', 'sls', 'partial factors', 'psi factors', 'dead load', 'imposed load', '6.10a', '6.10b'],
    summary: 'Design values of actions for ULS (Eq. 6.10 and 6.10a/b) and SLS (characteristic, frequent, quasi-permanent) from permanent and two variable actions.',
    inputs: [I('Gk', 'Permanent action G_k', 'G_k', 'pressure', 4e3, { u: { si: 'kPa', imperial: 'psf' }, hint: 'Any consistent load units (kN/m², kN/m or kN) work.' }),
      I('Q1', 'Leading variable action Q_k,1', 'Q_{k,1}', 'pressure', 2.5e3, { u: { si: 'kPa', imperial: 'psf' } }), SEL('c1', 'Leading action category', PSI_OPTS, 'B'),
      I('Q2', 'Accompanying variable action Q_k,2', 'Q_{k,2}', 'pressure', 0.6e3, { u: { si: 'kPa', imperial: 'psf' } }), SEL('c2', 'Accompanying action category', PSI_OPTS, 'S'),
      SEL('fav', 'Permanent action', [['unfav', 'Unfavourable (γ_G = 1.35)'], ['fav', 'Favourable (γ_G = 1.0)']], 'unfav', { adv: true })],
    outputs: [O('uls', 'ULS design value (governing of 6.10a/6.10b)', 'E_d', 'pressure', { primary: true, u: { si: 'kPa', imperial: 'psf' } }), O('e610', 'Eq. 6.10', 'E_{d,6.10}', 'pressure', { u: { si: 'kPa', imperial: 'psf' } }), O('e610a', 'Eq. 6.10a', 'E_{d,6.10a}', 'pressure', { u: { si: 'kPa', imperial: 'psf' } }), O('e610b', 'Eq. 6.10b', 'E_{d,6.10b}', 'pressure', { u: { si: 'kPa', imperial: 'psf' } }),
      O('char', 'SLS characteristic', 'E_{char}', 'pressure', { u: { si: 'kPa', imperial: 'psf' } }), O('freq', 'SLS frequent', 'E_{fr}', 'pressure', { u: { si: 'kPa', imperial: 'psf' } }), O('qp', 'SLS quasi-permanent', 'E_{qp}', 'pressure', { u: { si: 'kPa', imperial: 'psf' } })],
    compute(x) {
      const [, p01, p11, p21] = PSI[x.c1], [, p02, , p22] = PSI[x.c2], gG = x.fav === 'fav' ? 1.0 : 1.35, xi = x.fav === 'fav' ? 1 : 0.85;
      const e610 = gG * x.Gk + 1.5 * x.Q1 + 1.5 * p02 * x.Q2, e610a = gG * x.Gk + 1.5 * p01 * x.Q1 + 1.5 * p02 * x.Q2, e610b = xi * gG * x.Gk + 1.5 * x.Q1 + 1.5 * p02 * x.Q2;
      return { uls: Math.max(e610a, e610b), e610, e610a, e610b, char: x.Gk + x.Q1 + p02 * x.Q2, freq: x.Gk + p11 * x.Q1 + p22 * x.Q2, qp: x.Gk + p21 * x.Q1 + p22 * x.Q2,
        _info: [`ψ₀,₁ = ${p01}, ψ₁,₁ = ${p11}, ψ₂,₁ = ${p21}; ψ₀,₂ = ${p02}, ψ₂,₂ = ${p22}. The UK National Annex allows the lower of 6.10a/6.10b to be skipped by using 6.10b directly; 6.10 alone is more conservative.`, 'Swap the leading and accompanying actions to find the worst case when both are significant.'] };
    },
    eq: ['E_{d} = \\gamma_G G_k + \\gamma_Q Q_{k,1} + \\gamma_Q \\psi_{0,2} Q_{k,2}\\;(6.10)', '6.10a: \\gamma_G G_k + \\gamma_Q\\psi_{0,1}Q_{k,1} + \\ldots,\\quad 6.10b: \\xi\\gamma_G G_k + \\gamma_Q Q_{k,1} + \\ldots', 'E_{qp} = G_k + \\sum \\psi_{2,i} Q_{k,i}'],
    assume: ['Recommended partial factors (Set B): γ_G = 1.35 (unfavourable), γ_Q = 1.5, ξ = 0.85.', 'ψ values from EN 1990 Table A1.1 (buildings).'], limits: ['Buildings only; bridges, accidental and seismic combinations are not covered. Check your National Annex.'],
    refs: ['EN 1990:2002 + A1, §6.4.3.2, 6.5.3, Annex A1.'], related: ['steel-beam', 'rc-beam'],
  },
  {
    id: 'rc-beam', title: 'Reinforced Concrete Beam Design (EN 1992-1-1)', disc: 'structural', level: 'pro',
    tags: ['reinforced concrete', 'rc beam', 'eurocode 2', 'ec2', 'rebar', 'tension steel', 'compression steel', 'lever arm', 'shear resistance', 'concrete design'],
    summary: 'Rectangular RC beam in bending: K, lever arm, tension (and compression) steel area, bar arrangement, minimum/maximum steel, and concrete shear resistance V_Rd,c.',
    inputs: [I('b', 'Width b', 'b', 'length', 0.3, { u: { si: 'mm' } }), I('h', 'Overall depth h', 'h', 'length', 0.55, { u: { si: 'mm' } }), I('cov', 'Cover to main bar centroid (h − d)', "h - d", 'length', 0.05, { u: { si: 'mm' } }),
      I('M', 'Design moment M_Ed', 'M_{Ed}', 'torque', 250e3, { u: { si: 'kN·m' } }), I('V', 'Design shear V_Ed', 'V_{Ed}', 'force', 150e3, { u: { si: 'kN' } }),
      SEL('fck', 'Concrete class', [['25', 'C25/30'], ['30', 'C30/37'], ['35', 'C35/45'], ['40', 'C40/50'], ['50', 'C50/60']], '30'), I('fyk', 'Reinforcement f_yk', 'f_{yk}', 'pressure', 500e6, { u: { si: 'MPa' } }),
      SEL('bar', 'Bar diameter', [['12', 'H12'], ['16', 'H16'], ['20', 'H20'], ['25', 'H25'], ['32', 'H32']], '20'), I('d2', 'Compression steel depth d₂', 'd_2', 'length', 0.05, { u: { si: 'mm' }, adv: true })],
    outputs: [O('As', 'Tension steel required', 'A_{s,req}', 'area', { primary: true, u: { si: 'mm²' } }), O('bars', 'Bar arrangement', '', 'none', { type: 'text' }), O('As2', 'Compression steel required', "A_{s2}", 'area', { u: { si: 'mm²' } }),
      O('K', 'K = M/(b d² f_ck)', 'K', 'none'), O('z', 'Lever arm z', 'z', 'length', { u: { si: 'mm' } }), O('xd', 'Neutral-axis depth x/d', 'x/d', 'none'), O('Asmin', 'Minimum steel', 'A_{s,min}', 'area', { u: { si: 'mm²' } }),
      O('VRdc', 'Shear resistance without links', 'V_{Rd,c}', 'force', { u: { si: 'kN' } }), O('links', 'Shear links', '', 'none', { type: 'text' })],
    compute(x) {
      const fck = +x.fck * 1e6, d = x.h - x.cov, fctm = 0.3 * (+x.fck) ** (2 / 3) * 1e6, Kp = 0.167;
      const K = x.M / (x.b * d * d * fck);
      let z, As, As2 = 0;
      if (K <= Kp) { z = Math.min(0.95 * d, d * (0.5 + Math.sqrt(0.25 - K / 1.134))); As = x.M / (0.87 * x.fyk * z); }
      else { z = d * (0.5 + Math.sqrt(0.25 - Kp / 1.134)); As2 = (K - Kp) * fck * x.b * d * d / (0.87 * x.fyk * (d - x.d2)); As = Kp * fck * x.b * d * d / (0.87 * x.fyk * z) + As2; }
      const Asmin = Math.max(0.26 * fctm / x.fyk * x.b * d, 0.0013 * x.b * d), Asmax = 0.04 * x.b * x.h;
      const Areq = Math.max(As, Asmin), phi = +x.bar / 1000, abar = PI * phi * phi / 4, n = Math.max(2, Math.ceil(Areq / abar));
      const clear = (x.b - 2 * 0.035 - n * phi) / (n - 1);
      // Shear (6.2.2)
      const k = Math.min(2, 1 + Math.sqrt(0.2 / d)), rho = Math.min(0.02, n * abar / (x.b * d));
      const vmin = 0.035 * k ** 1.5 * Math.sqrt(+x.fck), vrdc = Math.max(0.12 * k * (100 * rho * (+x.fck)) ** (1 / 3), vmin);
      const VRdc = vrdc * 1e6 * x.b * d;
      const w = [];
      if (K > Kp) w.push(`K = ${K.toFixed(3)} > K′ = 0.167: compression reinforcement required (or deepen the section).`);
      if (Areq > Asmax) w.push('Required steel exceeds 4 % of the concrete area — increase the section.');
      if (clear < Math.max(phi, 0.02 + 0.005)) w.push(`Bars do not fit in one layer (clear spacing ${(clear * 1e3).toFixed(0)} mm, assuming 35 mm to bar edge) — use two layers or larger bars.`);
      const xd = (d - z) / 0.4 / d;
      return { As: Areq, As2, K, z, xd, Asmin, VRdc, bars: `${n} × H${x.bar} = ${(n * abar * 1e6).toFixed(0)} mm²`, links: x.V <= VRdc ? 'Minimum links only (V_Ed ≤ V_Rd,c)' : 'Design shear links required (V_Ed > V_Rd,c) — see EN 1992-1-1 6.2.3',
        _checks: [check('K ≤ K′ (singly reinforced)', K <= Kp, K.toFixed(3)), check('A_s ≤ 4 % A_c', Areq <= Asmax), check('Shear without design links', x.V <= VRdc, `V_Ed = ${(x.V / 1e3).toFixed(0)} kN, V_Rd,c = ${(VRdc / 1e3).toFixed(0)} kN`)], _warn: w,
        _info: [`d = ${(d * 1e3).toFixed(0)} mm, f_ctm = ${(fctm / 1e6).toFixed(2)} MPa. γ_c = 1.5, γ_s = 1.15 (0.87 f_yk), rectangular stress block, no moment redistribution.`] };
    },
    eq: ['K = \\frac{M_{Ed}}{b d^2 f_{ck}},\\quad K\' = 0.167', 'z = d\\left[0.5 + \\sqrt{0.25 - K/1.134}\\right] \\le 0.95d', 'A_s = \\frac{M_{Ed}}{0.87 f_{yk} z}', 'V_{Rd,c} = \\left[0.12 k (100\\rho_l f_{ck})^{1/3}\\right] b d \\ge v_{min} b d,\\quad k = 1 + \\sqrt{200/d} \\le 2'],
    assume: ['Simplified rectangular stress block (λ = 0.8, η = 1) for f_ck ≤ 50 MPa; no redistribution.', 'Recommended values of C_Rd,c = 0.18/γ_c and v_min.'], limits: ['No crack-width, deflection (span/depth), anchorage or detailing checks. Check against the National Annex and a qualified engineer.'],
    refs: ['EN 1992-1-1:2004 §3.1, 6.1, 6.2.2, 9.2.1.', 'Mosley, Bungey & Hulse, Reinforced Concrete Design to Eurocode 2.', 'The Concrete Centre, How to Design Concrete Structures using Eurocode 2.'],
    related: ['load-comb', 'steel-beam', 'beam-cases'],
  },
];
