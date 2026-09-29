// IAPWS-IF97 water and steam properties: Regions 1, 2, 3, 4 and 5.
// Reference: IAPWS R7-97(2012), Revised Release on the IAPWS Industrial Formulation 1997.
// Units in this module: p in Pa, T in K, v in m³/kg, h/u in J/kg, s/cp/cv in J/(kg·K), w in m/s.
import { psatIF97, tsatIF97 } from './fluids.js';

const R = 461.526; // J/(kg·K)
export const TC = 647.096, PC = 22.064e6, RHOC = 322;

// ---- Region 1 (compressed liquid) ----
const I1 = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 8, 8, 21, 23, 29, 30, 31, 32];
const J1 = [-2, -1, 0, 1, 2, 3, 4, 5, -9, -7, -1, 0, 1, 3, -3, 0, 1, 3, 17, -4, 0, 6, -5, -2, 10, -8, -11, -6, -29, -31, -38, -39, -40, -41];
const n1 = [0.14632971213167, -0.84548187169114, -0.37563603672040e1, 0.33855169168385e1, -0.95791963387872, 0.15772038513228,
  -0.16616417199501e-1, 0.81214629983568e-3, 0.28319080123804e-3, -0.60706301565874e-3, -0.18990068218419e-1, -0.32529748770505e-1,
  -0.21841717175414e-1, -0.52838357969930e-4, -0.47184321073267e-3, -0.30001780793026e-3, 0.47661393906987e-4, -0.44141845330846e-5,
  -0.72694996297594e-15, -0.31679644845054e-4, -0.28270797985312e-5, -0.85205128120103e-9, -0.22425281908000e-5, -0.65171222895601e-6,
  -0.14341729937924e-12, -0.40516996860117e-6, -0.12734301741641e-8, -0.17424871230634e-9, -0.68762131295531e-18, 0.14478307828521e-19,
  0.26335781662795e-22, -0.11947622640071e-22, 0.18228094581404e-23, -0.93537087292458e-25];

function gibbs1(p, T) {
  const pi = p / 16.53e6, tau = 1386 / T, a = 7.1 - pi, b = tau - 1.222;
  let g = 0, gp = 0, gpp = 0, gt = 0, gtt = 0, gpt = 0;
  for (let i = 0; i < 34; i++) {
    const I = I1[i], J = J1[i], n = n1[i];
    const aI = a ** I, bJ = b ** J;
    g += n * aI * bJ;
    gp += -n * I * a ** (I - 1) * bJ;
    gpp += n * I * (I - 1) * a ** (I - 2) * bJ;
    gt += n * aI * J * b ** (J - 1);
    gtt += n * aI * J * (J - 1) * b ** (J - 2);
    gpt += -n * I * a ** (I - 1) * J * b ** (J - 1);
  }
  return { pi, tau, g, gp, gpp, gt, gtt, gpt };
}

// ---- Region 2 (superheated vapour) ----
const J0 = [0, 1, -5, -4, -3, -2, -1, 2, 3];
const n0 = [-0.96927686500217e1, 0.10086655968018e2, -0.56087911283020e-2, 0.71452738081455e-1, -0.40710498223928, 0.14240819171444e1,
  -0.43839511319450e1, -0.28408632460772, 0.21268463753307e-1];
const I2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10, 10, 10, 16, 16, 18, 20, 20, 20, 21, 22, 23, 24, 24, 24];
const J2 = [0, 1, 2, 3, 6, 1, 2, 4, 7, 36, 0, 1, 3, 6, 35, 1, 2, 3, 7, 3, 16, 35, 0, 11, 25, 8, 36, 13, 4, 10, 14, 29, 50, 57, 20, 35, 48, 21, 53, 39, 26, 40, 58];
const n2 = [-0.17731742473213e-2, -0.17834862292358e-1, -0.45996013696365e-1, -0.57581259083432e-1, -0.50325278727930e-1, -0.33032641670203e-4,
  -0.18948987516315e-3, -0.39392777243355e-2, -0.43797295650573e-1, -0.26674547914087e-4, 0.20481737692309e-7, 0.43870667284435e-6,
  -0.32277677238570e-4, -0.15033924542148e-2, -0.40668253562649e-1, -0.78847309559367e-9, 0.12790717852285e-7, 0.48225372718507e-6,
  0.22922076337661e-5, -0.16714766451061e-10, -0.21171472321355e-2, -0.23895741934104e2, -0.59059564324270e-17, -0.12621808899101e-5,
  -0.38946842435739e-1, 0.11256211360459e-10, -0.82311340897998e1, 0.19809712802088e-7, 0.10406965210174e-18, -0.10234747095929e-12,
  -0.10018179379511e-8, -0.80882908646985e-10, 0.10693031879409, -0.33662250574171, 0.89185845355421e-24, 0.30629316876232e-12,
  -0.42002467698208e-5, -0.59056029685639e-25, 0.37826947613457e-5, -0.12768608934681e-14, 0.73087610595061e-28, 0.55414715350778e-16,
  -0.94369707241210e-6];

// Shared ideal+residual Gibbs evaluation (regions 2 and 5).
function gibbsIR(pi, tau, tau0, J0s, n0s, Is, Js, ns, tShift) {
  let g = Math.log(pi), gp = 1 / pi, gpp = -1 / (pi * pi), gt = 0, gtt = 0, gpt = 0;
  for (let i = 0; i < J0s.length; i++) {
    const J = J0s[i], n = n0s[i];
    g += n * tau0 ** J; gt += n * J * tau0 ** (J - 1); gtt += n * J * (J - 1) * tau0 ** (J - 2);
  }
  const b = tau - tShift;
  for (let i = 0; i < Is.length; i++) {
    const I = Is[i], J = Js[i], n = ns[i];
    const pI = pi ** I, bJ = b ** J;
    g += n * pI * bJ;
    gp += n * I * pi ** (I - 1) * bJ;
    gpp += n * I * (I - 1) * pi ** (I - 2) * bJ;
    gt += n * pI * J * b ** (J - 1);
    gtt += n * pI * J * (J - 1) * b ** (J - 2);
    gpt += n * I * pi ** (I - 1) * J * b ** (J - 1);
  }
  return { pi, tau, g, gp, gpp, gt, gtt, gpt };
}
const gibbs2 = (p, T) => { const tau = 540 / T; return gibbsIR(p / 1e6, tau, tau, J0, n0, I2, J2, n2, 0.5); };

// ---- Region 5 (high-temperature steam, 1073.15–2273.15 K, p ≤ 50 MPa) ----
const J05 = [0, 1, -3, -2, -1, 2];
const n05 = [-0.13179983674201e2, 0.68540841634434e1, -0.24805148933466e-1, 0.36901534980333, -0.31161318213925e1, -0.32961626538917];
const I5 = [1, 1, 1, 2, 2, 3], J5 = [1, 2, 3, 3, 9, 7];
const n5 = [0.15736404855259e-2, 0.90153761673944e-3, -0.50270077677648e-2, 0.22440037409485e-5, -0.41163275453471e-5, 0.37918454823767e-7];
const gibbs5 = (p, T) => { const tau = 1000 / T; return gibbsIR(p / 1e6, tau, tau, J05, n05, I5, J5, n5, 0); };

function fromGibbs(G, p, T, region) {
  const { pi, tau, g, gp, gpp, gt, gtt, gpt } = G;
  const v = R * T / p * pi * gp;
  const h = R * T * tau * gt;
  const s = R * (tau * gt - g);
  const u = R * T * (tau * gt - pi * gp);
  const cp = -R * tau * tau * gtt;
  const cv = R * (-tau * tau * gtt + (gp - tau * gpt) ** 2 / gpp);
  const w = Math.sqrt(R * T * gp * gp / ((gp - tau * gpt) ** 2 / (tau * tau * gtt) - gpp));
  return { region, p, T, v, rho: 1 / v, h, s, u, cp, cv, w };
}

// ---- Region 3 (near-critical, Helmholtz in ρ, T) ----
const I3 = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 8, 9, 9, 10, 10, 11];
const J3 = [0, 1, 2, 7, 10, 12, 23, 2, 6, 15, 17, 0, 2, 6, 7, 22, 26, 0, 2, 4, 16, 26, 0, 2, 4, 26, 1, 3, 26, 0, 2, 26, 2, 26, 2, 26, 0, 1, 26];
const n3_1 = 0.10658070028513e1;
const n3 = [-0.15732845290239e2, 0.20944396974307e2, -0.76867707878716e1, 0.26185947787954e1, -0.28080781148620e1, 0.12053369696517e1,
  -0.84566812812502e-2, -0.12654315477714e1, -0.11524407806681e1, 0.88521043984318, -0.64207765181607, 0.38493460186671, -0.85214708824206,
  0.48972281541877e1, -0.30502617256965e1, 0.39420536879154e-1, 0.12558408424308, -0.27999329698710, 0.13899799569460e1, -0.20189915023570e1,
  -0.82147637173963e-2, -0.47596035734923, 0.43984074473500e-1, -0.44476435428739, 0.90572070719733, 0.70522450087967, 0.10770512626332,
  -0.32913623258954, -0.50871062041158, -0.22175400873096e-1, 0.94260751665092e-1, 0.16436278447961, -0.13503372241348e-1, -0.14834345352472e-1,
  0.57922953628084e-3, 0.32308904703711e-2, 0.80964802996215e-4, -0.16557679795037e-3, -0.44923899061815e-4];

function helm3(rho, T) {
  const d = rho / RHOC, t = TC / T;
  let f = n3_1 * Math.log(d), fd = n3_1 / d, fdd = -n3_1 / (d * d), ft = 0, ftt = 0, fdt = 0;
  for (let i = 0; i < 39; i++) {
    const I = I3[i], J = J3[i], n = n3[i];
    const dI = d ** I, tJ = t ** J;
    f += n * dI * tJ;
    fd += n * I * d ** (I - 1) * tJ;
    fdd += n * I * (I - 1) * d ** (I - 2) * tJ;
    ft += n * dI * J * t ** (J - 1);
    ftt += n * dI * J * (J - 1) * t ** (J - 2);
    fdt += n * I * d ** (I - 1) * J * t ** (J - 1);
  }
  return { d, t, f, fd, fdd, ft, ftt, fdt };
}
export function region3rhoT(rho, T) {
  const { d, t, f, fd, fdd, ft, ftt, fdt } = helm3(rho, T);
  const p = rho * R * T * d * fd;
  const h = R * T * (t * ft + d * fd);
  const s = R * (t * ft - f);
  const u = R * T * t * ft;
  const cv = -R * t * t * ftt;
  const cp = R * (-t * t * ftt + (d * fd - d * t * fdt) ** 2 / (2 * d * fd + d * d * fdd));
  const w = Math.sqrt(R * T * (2 * d * fd + d * d * fdd - (d * fd - d * t * fdt) ** 2 / (t * t * ftt)));
  return { region: 3, p, T, v: 1 / rho, rho, h, s, u, cp, cv, w };
}
const p3 = (rho, T) => { const { d, fd } = helm3(rho, T); return rho * R * T * d * fd; };

// Density in Region 3 for (p, T). phase: 'liq' | 'vap' | undefined (supercritical/auto).
function rho3(p, T, phase) {
  if (!phase) phase = T < TC ? (p > psatIF97(T) ? 'liq' : 'vap') : 'liq';
  // March from the phase's far end towards the critical density to find the first bracket, then bisect.
  const [a, b] = phase === 'liq' ? [820, 110] : [1, 700];
  const steps = 400;
  let r0 = a, f0 = p3(r0, T) - p;
  for (let k = 1; k <= steps; k++) {
    const r1 = a + (b - a) * k / steps, f1 = p3(r1, T) - p;
    if (Number.isFinite(f0) && Number.isFinite(f1) && f0 * f1 <= 0) {
      let lo = r0, hi = r1, flo = f0;
      for (let it = 0; it < 80; it++) {
        const mid = (lo + hi) / 2, fm = p3(mid, T) - p;
        if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; }
      }
      return (lo + hi) / 2;
    }
    r0 = r1; f0 = f1;
  }
  return NaN;
}

// ---- Boundaries ----
export function pB23(T) { return (0.34805185628969e3 - 0.11671859879975e1 * T + 0.10192970039326e-2 * T * T) * 1e6; }
export function TB23(p) { return 0.57254459862746e3 + Math.sqrt((p / 1e6 - 0.13918839778870e2) / 0.10192970039326e-2); }

export function region(p, T) {
  if (!(T >= 273.15 && T <= 2273.15 && p > 0)) return 0;
  if (T > 1073.15) return p <= 50e6 ? 5 : 0;
  if (p > 100e6) return 0;
  if (T <= 623.15) return p >= psatIF97(T) ? 1 : 2;
  return p > pB23(T) ? 3 : 2;
}

// Single-phase state from pressure and temperature.
export function steamPT(p, T) {
  const r = region(p, T);
  if (r === 1) return fromGibbs(gibbs1(p, T), p, T, 1);
  if (r === 2) return fromGibbs(gibbs2(p, T), p, T, 2);
  if (r === 5) return fromGibbs(gibbs5(p, T), p, T, 5);
  if (r === 3) { const rho = rho3(p, T); return { ...region3rhoT(rho, T), p }; }
  return null;
}

// Saturated liquid and vapour at pressure p (Pa). Valid 611.213 Pa ≤ p ≤ 22.064 MPa.
export function satP(p) {
  const T = tsatIF97(p);
  return { p, T, ...satPair(p, T) };
}
export function satT(T) {
  const p = psatIF97(T);
  return { p, T, ...satPair(p, T) };
}
function satPair(p, T) {
  let liq, vap;
  if (T <= 623.15) { liq = fromGibbs(gibbs1(p, T), p, T, 1); vap = fromGibbs(gibbs2(p, T), p, T, 2); }
  else if (T >= TC - 1e-9) { liq = vap = { ...region3rhoT(RHOC, TC), p }; }
  else { liq = { ...region3rhoT(rho3(p, T, 'liq'), T), p }; vap = { ...region3rhoT(rho3(p, T, 'vap'), T), p }; }
  return { liq, vap, hfg: vap.h - liq.h, sfg: vap.s - liq.s };
}

const mixProps = (sat, x) => {
  const m = (k) => sat.liq[k] + x * (sat.vap[k] - sat.liq[k]);
  const v = m('v');
  return { region: 4, p: sat.p, T: sat.T, x, v, rho: 1 / v, h: m('h'), s: m('s'), u: m('u'), cp: NaN, cv: NaN, w: NaN };
};

// State from pressure and a property (h or s), including the two-phase region.
function stateFrom(p, key, val) {
  if (p < PC) {
    const sat = satP(p);
    const a = sat.liq[key], b = sat.vap[key];
    if (val >= a && val <= b) return mixProps(sat, (val - a) / (b - a));
    // Single phase: bisection in T on the correct side of saturation.
    const [lo, hi] = val < a ? [273.15, sat.T - 1e-7] : [sat.T + 1e-7, p <= 50e6 ? 2273.15 : 1073.15];
    return bisectT(p, key, val, lo, hi);
  }
  return bisectT(p, key, val, 273.15, p <= 50e6 ? 2273.15 : 1073.15);
}
function bisectT(p, key, val, lo, hi) {
  const f = (T) => { const st = steamPT(p, T); return st ? st[key] - val : NaN; };
  let flo = f(lo), fhi = f(hi);
  if (!(flo * fhi <= 0)) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2, fm = f(mid);
    if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
    if (hi - lo < 1e-9) break;
  }
  const st = steamPT(p, (lo + hi) / 2);
  return st && { ...st, x: st.T > (p < PC ? tsatIF97(p) : Infinity) ? 1 : (p < PC ? 0 : NaN) };
}
export const steamPH = (p, h) => stateFrom(p, 'h', h);
export const steamPS = (p, s) => stateFrom(p, 's', s);
export function steamPX(p, x) { return mixProps(satP(p), x); }
export function steamTX(T, x) { return mixProps(satT(T), x); }

// Saturation dome points for T–s / h–s / p–h charts.
export function dome(n = 60) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const T = 273.16 + (TC - 0.01 - 273.16) * (1 - (1 - i / n) ** 1.6);
    const st = satT(T);
    out.push({ T, p: st.p, sf: st.liq.s, sg: st.vap.s, hf: st.liq.h, hg: st.vap.h, vf: st.liq.v, vg: st.vap.v });
  }
  return out;
}
