// Controls, signals, chemical, civil/geotechnical, materials science, mechatronics/robotics and vibrations.
import { I, O, SEL, MAT, PI, g0, deg, rad, check } from './_h.js';
import { C as K } from '../data/constants.js';
import { polyRoots, polyval, routh, C as Cx, erf, erfc } from '../core/numeric.js';

const list = s => String(s).split(/[,;\s]+/).map(Number).filter(Number.isFinite);

// Second-order unit-step response.
export function step2(wn, z, t) {
  if (z < 1) { const wd = wn * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + z / Math.sqrt(1 - z * z) * Math.sin(wd * t)); }
  if (z === 1) return 1 - (1 + wn * t) * Math.exp(-wn * t);
  const r = Math.sqrt(z * z - 1), s1 = -wn * (z - r), s2 = -wn * (z + r);
  return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
}
function stepMetrics(ts, ys, yf) {
  const t10 = ts[ys.findIndex(y => y >= 0.1 * yf)], t90 = ts[ys.findIndex(y => y >= 0.9 * yf)];
  const peak = Math.max(...ys), ip = ys.indexOf(peak);
  let ts2 = 0;
  for (let i = ys.length - 1; i >= 0; i--) if (Math.abs(ys[i] - yf) > 0.02 * Math.abs(yf)) { ts2 = ts[Math.min(i + 1, ts.length - 1)]; break; }
  return { tr: t90 - t10, tp: ts[ip], Mp: Math.max(0, (peak - yf) / Math.abs(yf)), ts: ts2 };
}

// Closed-loop PID simulation. plant: '1' first-order, '2' second-order, 'fopdt'.
export function simulatePID(p) {
  const T = p.T, n = 6000, dt = T / n;
  const delayN = p.plant === 'fopdt' ? Math.round(p.theta / dt) : 0, buf = new Array(delayN + 1).fill(0);
  let y = 0, yd = 0, x1 = 0, integ = 0, prevY = 0, dFilt = 0;
  const ts = [], ys = [], us = [];
  const N = 10;
  for (let i = 0; i <= n; i++) {
    const t = i * dt, r = 1, e = r - y;
    integ += e * dt;
    // derivative on measurement with first-order filter (Td/N)
    const Td = p.Kd / (p.Kp || 1);
    const rawD = -(y - prevY) / dt;
    dFilt = Td > 0 ? dFilt + (rawD - dFilt) * Math.min(1, dt * N / Td) : rawD;
    prevY = y;
    let u = p.Kp * e + p.Ki * integ + p.Kd * dFilt;
    if (p.umax > 0) { const uc = Math.max(-p.umax, Math.min(p.umax, u)); if (uc !== u) integ -= e * dt; u = uc; } // clamping anti-windup
    buf.push(u); const ud = buf.shift();
    if (p.plant === '2') { const acc = p.K * p.wn * p.wn * ud - 2 * p.z * p.wn * yd - p.wn * p.wn * y; yd += acc * dt; y += yd * dt; }
    else { x1 += (p.K * ud - x1) / p.tau * dt; y = x1; }
    ts.push(t); ys.push(y); us.push(u);
  }
  return { ts, ys, us };
}

// Bode data for L(s) = k·N(s)/D(s)·e^{-sθ}
export function bode(num, den, k, theta, wmin, wmax) {
  const ws = [], mag = [], ph = [], re = [], im = [];
  let prev = null, off = 0;
  for (let i = 0; i <= 600; i++) {
    const w = wmin * Math.pow(wmax / wmin, i / 600), s = [0, w];
    const L = Cx.mul(Cx.div(polyval(num, s), polyval(den, s)), [k * Math.cos(-w * theta), k * Math.sin(-w * theta)]);
    let a = Cx.arg(L) * 180 / PI;
    if (prev !== null) { while (a + off - prev > 180) off -= 360; while (a + off - prev < -180) off += 360; }
    a += off; prev = a;
    ws.push(w); mag.push(20 * Math.log10(Cx.abs(L))); ph.push(a); re.push(L[0]); im.push(L[1]);
  }
  let pm = NaN, wgc = NaN, gm = NaN, wpc = NaN;
  for (let i = 1; i < ws.length; i++) {
    if (Number.isNaN(wgc) && mag[i - 1] >= 0 && mag[i] < 0) { const f = mag[i - 1] / (mag[i - 1] - mag[i]); wgc = ws[i - 1] * Math.pow(ws[i] / ws[i - 1], f); pm = 180 + ph[i - 1] + f * (ph[i] - ph[i - 1]); }
    if (Number.isNaN(wpc) && (ph[i - 1] + 180) * (ph[i] + 180) <= 0 && ph[i - 1] !== ph[i]) { const f = (ph[i - 1] + 180) / (ph[i - 1] - ph[i]); wpc = ws[i - 1] * Math.pow(ws[i] / ws[i - 1], f); gm = -(mag[i - 1] + f * (mag[i] - mag[i - 1])); }
  }
  return { ws, mag, ph, re, im, pm, wgc, gm, wpc };
}

export default [
  // ── Control systems ────────────────────────────────────
  {
    id: 'second-order', title: 'Second-Order System Step Response', disc: 'controls', level: 'uni', tags: ['damping ratio', 'natural frequency', 'overshoot', 'settling time', 'rise time', 'transient response'],
    summary: 'Rise time, peak time, percent overshoot and settling time of a standard second-order system, with the step response.',
    inputs: [I('wn', 'Natural frequency', '\\omega_n', 'angvel', 10), I('z', 'Damping ratio', '\\zeta', 'none', 0.4, { min: 0 }), I('K', 'Static gain', 'K', 'none', 1)],
    outputs: [O('Mp', 'Percent overshoot', 'M_p', 'none', { u: { si: '%' }, primary: true }), O('tr', 'Rise time (10–90 %)', 't_r', 'time'), O('tp', 'Peak time', 't_p', 'time'), O('ts', 'Settling time (2 %)', 't_s', 'time'), O('wd', 'Damped frequency', '\\omega_d', 'angvel'), O('poles', 'Poles', '', 'none', { type: 'text' })],
    compute({ wn, z, K }) {
      const T = Math.max(12 / (Math.max(z, 0.05) * wn), 6 / wn), ts = [], ys = [];
      for (let i = 0; i <= 800; i++) { const t = T * i / 800; ts.push(t); ys.push(K * step2(wn, z, t)); }
      const m = stepMetrics(ts, ys, K);
      const poles = z < 1 ? `${(-z * wn).toPrecision(4)} ± ${(wn * Math.sqrt(1 - z * z)).toPrecision(4)}j` : `${(-wn * (z - Math.sqrt(z * z - 1))).toPrecision(4)}, ${(-wn * (z + Math.sqrt(z * z - 1))).toPrecision(4)}`;
      return { ...m, wd: z < 1 ? wn * Math.sqrt(1 - z * z) : 0, poles, _info: z < 1 ? [`Analytic: M_p = e^(−πζ/√(1−ζ²)) = ${(100 * Math.exp(-PI * z / Math.sqrt(1 - z * z))).toFixed(2)} %, t_s ≈ 4/(ζω_n) = ${(4 / (z * wn)).toPrecision(4)} s.`] : ['ζ ≥ 1: no overshoot (critically/over-damped).'],
        _plot: { series: [{ x: ts, y: ys, label: 'y(t) for unit step' }], opts: { xlabel: 't (s)', ylabel: 'y', hlines: [{ y: K * 1.02, label: '±2 %' }, { y: K * 0.98, label: '' }] } } };
    },
    eq: ['G(s) = \\frac{K\\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}', 'M_p = e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}}', 't_p = \\frac{\\pi}{\\omega_n\\sqrt{1-\\zeta^2}},\\quad t_s \\approx \\frac{4}{\\zeta\\omega_n}'],
    assume: ['Linear time-invariant system, zero initial conditions, unit step input.'], limits: ['Additional poles/zeros change the response — simulate the full system (PID simulator).'], refs: ['Ogata, Modern Control Engineering, §5-3.', 'Nise, Control Systems Engineering, ch. 4.'],
  },
  {
    id: 'pid', title: 'PID Controller Simulator', disc: 'controls', level: 'uni', tags: ['pid', 'feedback control', 'closed loop', 'step response', 'tuning', 'anti-windup', 'kp ki kd'],
    summary: 'Simulate a PID loop around a first-order, second-order or first-order-plus-dead-time plant; see overshoot, settling time and control effort.',
    inputs: [SEL('plant', 'Plant', [['1', 'First order  K/(τs+1)'], ['2', 'Second order  Kωn²/(s²+2ζωn s+ωn²)'], ['fopdt', 'First order + dead time  K e^(−θs)/(τs+1)']], 'fopdt'),
      I('K', 'Plant gain', 'K', 'none', 2), I('tau', 'Time constant', '\\tau', 'time', 5, { showIf: v => v.plant !== '2' }), I('theta', 'Dead time', '\\theta', 'time', 1, { showIf: v => v.plant === 'fopdt' }),
      I('wn', 'Plant natural frequency', '\\omega_n', 'angvel', 2, { showIf: v => v.plant === '2' }), I('z', 'Plant damping ratio', '\\zeta', 'none', 0.3, { showIf: v => v.plant === '2' }),
      I('Kp', 'Proportional gain', 'K_p', 'none', 1.2), I('Ki', 'Integral gain', 'K_i', 'none', 0.25, { hint: 'K_i = K_p/T_i' }), I('Kd', 'Derivative gain', 'K_d', 'none', 0.5, { hint: 'K_d = K_p·T_d (applied to measurement, filtered N = 10)' }),
      I('umax', 'Actuator limit |u| (0 = none)', 'u_{max}', 'none', 0, { adv: true }), I('T', 'Simulation time', 'T', 'time', 40)],
    outputs: [O('Mp', 'Overshoot', 'M_p', 'none', { u: { si: '%' }, primary: true }), O('tr', 'Rise time (10–90 %)', 't_r', 'time'), O('ts', 'Settling time (2 %)', 't_s', 'time'), O('sse', 'Steady-state error', 'e_{ss}', 'none'), O('umaxo', 'Peak control effort', 'u_{peak}', 'none')],
    compute(x) {
      const { ts, ys, us } = simulatePID(x);
      const m = stepMetrics(ts, ys, 1);
      const tail = ys.slice(-300), osc = Math.max(...tail) - Math.min(...tail);
      const w = osc > 0.05 ? ['Response is still oscillating at the end of the simulation — likely unstable or poorly damped. Reduce K_p/K_i or add derivative action.'] : [];
      const decim = (a, k = 6) => a.filter((_, i) => i % k === 0);
      return { ...m, sse: 1 - ys[ys.length - 1], umaxo: Math.max(...us.map(Math.abs)), _warn: w,
        _plot: [{ series: [{ x: decim(ts), y: decim(ys), label: 'output y' }, { x: [0, x.T], y: [1, 1], label: 'set-point', dash: '5 4', color: 'var(--ink3)' }], opts: { xlabel: 't (s)', ylabel: 'y' } },
          { title: 'Controller output u(t)', series: [{ x: decim(ts), y: decim(us), label: 'u', color: 'var(--c4)' }], opts: { xlabel: 't (s)', ylabel: 'u', h: 200 } }] };
    },
    eq: ['u(t) = K_p e(t) + K_i\\int_0^t e\\,d\\tau - K_d\\frac{dy_f}{dt}', 'e = r - y'],
    assume: ['Unit step set-point; explicit time stepping (6000 steps).', 'Derivative on measurement (no derivative kick), filtered with N = 10.', 'Clamping anti-windup when an actuator limit is set.'],
    limits: ['Educational simulation — no noise, sampling or quantisation effects.'], refs: ['Åström & Murray, Feedback Systems (2008), ch. 10.', 'Åström & Hägglund, Advanced PID Control (2006).'], related: { calc: 'zn-tuning' },
  },
  {
    id: 'zn-tuning', title: 'PID Tuning (Ziegler–Nichols, Cohen–Coon, SIMC)', disc: 'controls', level: 'pro', tags: ['pid tuning', 'ziegler nichols', 'cohen coon', 'simc', 'skogestad', 'fopdt'],
    summary: 'PID gains from a first-order-plus-dead-time process model, using three classic tuning rules.',
    inputs: [I('K', 'Process gain', 'K', 'none', 2), I('tau', 'Time constant', '\\tau', 'time', 5), I('theta', 'Dead time', '\\theta', 'time', 1), SEL('type', 'Controller', [['PI', 'PI'], ['PID', 'PID']], 'PID')],
    outputs: [O('zn', 'Ziegler–Nichols (open loop)', '', 'none', { type: 'text' }), O('cc', 'Cohen–Coon', '', 'none', { type: 'text' }), O('simc', 'SIMC (Skogestad, τ_c = θ)', '', 'none', { type: 'text', primary: true })],
    compute({ K, tau, theta, type }) {
      const fmt3 = v => Number(v.toPrecision(3));
      const f = (Kp, Ti, Td) => `Kp = ${fmt3(Kp)}, Ti = ${fmt3(Ti)} s${Td ? `, Td = ${fmt3(Td)} s` : ''}  →  Ki = ${fmt3(Kp / Ti)}${Td ? `, Kd = ${fmt3(Kp * Td)}` : ''}`;
      const r = theta / tau;
      const zn = type === 'PID' ? f(1.2 * tau / (K * theta), 2 * theta, 0.5 * theta) : f(0.9 * tau / (K * theta), 3.33 * theta, 0);
      const cc = type === 'PID' ? f((1 / K) * (1 / r) * (4 / 3 + r / 4), theta * (32 + 6 * r) / (13 + 8 * r), theta * 4 / (11 + 2 * r)) : f((1 / K) * (1 / r) * (0.9 + r / 12), theta * (30 + 3 * r) / (9 + 20 * r), 0);
      const tc = theta, simc = f(tau / (K * (tc + theta)), Math.min(tau, 4 * (tc + theta)), type === 'PID' ? 0 : 0);
      return { zn, cc, simc, _info: ['Gains are in the ideal (non-interacting) form u = Kp(e + (1/Ti)∫e + Td de/dt). Paste them into the PID Simulator to check the response.', 'SIMC gives a PI controller for FOPDT processes (derivative only helps for second-order dynamics).'] };
    },
    eq: ['\\text{ZN: } K_p = \\frac{1.2\\tau}{K\\theta},\\; T_i = 2\\theta,\\; T_d = 0.5\\theta', '\\text{SIMC: } K_p = \\frac{\\tau}{K(\\tau_c + \\theta)},\\; T_i = \\min(\\tau, 4(\\tau_c + \\theta))'],
    assume: ['Process well described by a first-order-plus-dead-time model.'], limits: ['Ziegler–Nichols gives aggressive (quarter-decay) tuning; SIMC is more robust.'], refs: ['Ziegler & Nichols, Trans. ASME 64 (1942).', 'Cohen & Coon, Trans. ASME 75 (1953).', 'Skogestad, J. Process Control 13 (2003).'], related: { calc: 'pid' },
  },
  {
    id: 'bode', title: 'Bode, Nyquist & Stability Margins', disc: 'controls', level: 'pro', tags: ['bode plot', 'nyquist plot', 'gain margin', 'phase margin', 'transfer function', 'routh-hurwitz', 'root locus', 'stability'],
    summary: 'Frequency response of a loop transfer function with gain and phase margins, closed-loop poles and the Routh–Hurwitz stability test.',
    inputs: [{ k: 'num', label: 'Numerator coefficients N(s) (descending powers)', type: 'text', def: '1', dim: 'none' }, { k: 'den', label: 'Denominator coefficients D(s) (descending powers)', type: 'text', def: '1 3 3 1', dim: 'none', hint: 'e.g. "1 3 3 1" = (s+1)³' },
      I('k', 'Loop gain K', 'K', 'none', 4), I('theta', 'Loop delay', '\\theta', 'time', 0, { adv: true })],
    outputs: [O('pm', 'Phase margin', 'PM', 'none', { primary: true, note: '°' }), O('gm', 'Gain margin', 'GM', 'none', { note: 'dB' }), O('wgc', 'Gain crossover', '\\omega_{gc}', 'angvel'), O('wpc', 'Phase crossover', '\\omega_{pc}', 'angvel'), O('stab', 'Closed-loop stability (1 + KG = 0)', '', 'none', { type: 'text' }), O('cl', 'Closed-loop poles', '', 'none', { type: 'text' }), O('ol', 'Open-loop poles', '', 'none', { type: 'text' })],
    compute(x) {
      const num = list(x.num), den = list(x.den);
      if (!num.length || !den.length) return { _warn: ['Enter coefficients.'] };
      const cp = [...den]; const nn = [...num]; while (nn.length < cp.length) nn.unshift(0);
      const clPoly = cp.map((c, i) => c + x.k * (nn[i] ?? 0));
      const cl = polyRoots(clPoly), ol = polyRoots(den);
      const fr = r => r[1] ? `${r[0].toPrecision(4)} ${r[1] > 0 ? '+' : '−'} ${Math.abs(r[1]).toPrecision(4)}j` : r[0].toPrecision(4);
      const rt = routh(clPoly);
      const unstable = cl.some(r => r[0] > 1e-9);
      const mags = [...ol, ...polyRoots(num)].map(r => Math.hypot(r[0], r[1])).filter(v => v > 1e-9);
      const wmin = Math.min(...mags, 1) / 100, wmax = Math.max(...mags, 1) * 100;
      const b = bode(num, den, x.k, x.theta, wmin, wmax);
      return { pm: b.pm, gm: b.gm, wgc: b.wgc, wpc: b.wpc, cl: cl.map(fr).join(', '), ol: ol.map(fr).join(', '),
        stab: x.theta > 0 ? (b.pm > 0 && !(b.gm < 0) ? 'Stable by margins (delay present — pole list excludes delay)' : 'Unstable by margins') : unstable ? `UNSTABLE — ${rt.signChanges} Routh sign change(s) = RHP poles` : 'Stable — all closed-loop poles in the left half-plane',
        _checks: [check('Phase margin ≥ 45°', b.pm >= 45, `${Number.isFinite(b.pm) ? b.pm.toFixed(1) : '—'}°`), check('Gain margin ≥ 6 dB', !(b.gm < 6), `${Number.isFinite(b.gm) ? b.gm.toFixed(1) + ' dB' : '∞'}`)],
        _plot: [{ title: 'Bode magnitude', series: [{ x: b.ws, y: b.mag, label: '|L(jω)| dB' }], opts: { logx: true, xlabel: 'ω (rad/s)', ylabel: 'dB', h: 220, hlines: [{ y: 0, label: '0 dB' }], marks: Number.isFinite(b.wgc) ? [{ x: b.wgc, label: 'ω_gc' }] : [] } },
          { title: 'Bode phase', series: [{ x: b.ws, y: b.ph, label: '∠L(jω) °', color: 'var(--c2)' }], opts: { logx: true, xlabel: 'ω (rad/s)', ylabel: 'deg', h: 220, hlines: [{ y: -180, label: '−180°' }] } },
          { title: 'Nyquist', series: [{ x: b.re, y: b.im, label: 'L(jω), ω > 0', color: 'var(--c3)' }, { x: b.re, y: b.im.map(v => -v), label: 'ω < 0', dash: '4 4', color: 'var(--c3)' }, { x: [-1], y: [0], type: 'scatter', label: '−1 point', color: 'var(--c4)' }], opts: { xlabel: 'Re', ylabel: 'Im', h: 300 } }] };
    },
    eq: ['L(s) = K\\frac{N(s)}{D(s)}e^{-\\theta s}', 'PM = 180^\\circ + \\angle L(j\\omega_{gc}),\\; |L(j\\omega_{gc})| = 1', 'GM = -20\\log_{10}|L(j\\omega_{pc})|,\\; \\angle L(j\\omega_{pc}) = -180^\\circ', 'D(s) + K N(s) = 0\\;\\text{(closed-loop poles)}'],
    assume: ['Unity negative feedback; real rational transfer function (plus optional pure delay).'], limits: ['Margins assume a single gain/phase crossover; check the Nyquist plot for conditionally stable systems.'], refs: ['Ogata ch. 7; Nise ch. 6 & 10.'],
  },
  {
    id: 'first-order', title: 'First-Order System', disc: 'controls', level: 'uni', tags: ['time constant', 'first order lag', 'bandwidth', 'sensor response'],
    summary: 'Step response, time to reach a percentage and bandwidth of a first-order lag.',
    inputs: [I('K', 'Gain', 'K', 'none', 1), I('tau', 'Time constant', '\\tau', 'time', 2), I('pct', 'Target % of final value', 'p', 'none', 0.95, { u: { si: '%' } })],
    outputs: [O('t', 'Time to reach target', 't_p', 'time', { primary: true }), O('t63', 'Time to 63.2 %', '\\tau', 'time'), O('bw', 'Bandwidth (−3 dB)', 'f_{-3dB}', 'frequency'), O('tr', 'Rise time 10–90 %', 't_r', 'time')],
    compute({ K, tau, pct }) { const ts = [], ys = []; for (let i = 0; i <= 200; i++) { const t = 6 * tau * i / 200; ts.push(t); ys.push(K * (1 - Math.exp(-t / tau))); } return { t: -tau * Math.log(1 - pct), t63: tau, bw: 1 / (2 * PI * tau), tr: tau * Math.log(9), _plot: { series: [{ x: ts, y: ys, label: 'y(t)' }], opts: { xlabel: 't (s)', ylabel: 'y', marks: [{ x: tau, label: 'τ' }] } } }; },
    eq: ['G(s) = \\frac{K}{\\tau s + 1}', 'y(t) = K(1 - e^{-t/\\tau})', 't_p = -\\tau\\ln(1-p)'], assume: ['Unit step, zero initial condition.'], limits: [], refs: ['Nise §4.3.'],
  },
  // ── Signals ────────────────────────────────────────────
  {
    id: 'aliasing', title: 'Sampling & Aliasing', disc: 'signals', level: 'uni', tags: ['nyquist', 'sampling rate', 'aliasing', 'adc', 'folding frequency'],
    summary: 'Nyquist frequency and the apparent (aliased) frequency when a sinusoid is sampled.',
    inputs: [I('f', 'Signal frequency', 'f', 'frequency', 7000), I('fs', 'Sampling rate', 'f_s', 'frequency', 10000)],
    outputs: [O('fa', 'Apparent (aliased) frequency', 'f_a', 'frequency', { primary: true }), O('fn', 'Nyquist frequency', 'f_s/2', 'frequency'), O('ok', 'Result', '', 'none', { type: 'text' })],
    compute({ f, fs }) {
      const fa = Math.abs(f - fs * Math.round(f / fs));
      const T = 4 / Math.min(f, fa || f), tc = [], yc = [], tsx = [], ysx = [];
      for (let i = 0; i <= 600; i++) { const t = T * i / 600; tc.push(t * 1e3); yc.push(Math.sin(2 * PI * f * t)); }
      for (let t = 0; t <= T; t += 1 / fs) { tsx.push(t * 1e3); ysx.push(Math.sin(2 * PI * f * t)); }
      return { fa, fn: fs / 2, ok: f <= fs / 2 ? 'Correctly sampled (f ≤ f_s/2)' : `ALIASED — appears as ${fa.toPrecision(4)} Hz`, _plot: { series: [{ x: tc, y: yc, label: 'true signal', color: 'var(--ink3)' }, { x: tsx, y: ysx, type: 'scatter', label: 'samples' }, { x: tc, y: tc.map(t => Math.sin(2 * PI * (f - fs * Math.round(f / fs)) * t / 1e3)), label: 'alias', dash: '5 4', color: 'var(--c3)' }], opts: { xlabel: 't (ms)', ylabel: '' } } };
    },
    eq: ['f_N = f_s/2', 'f_a = |f - k f_s|,\\; k = \\text{round}(f/f_s)'], assume: ['Ideal instantaneous sampling of a pure sinusoid.'], limits: ['Real ADCs need an anti-aliasing filter below f_s/2.'], refs: ['Oppenheim & Schafer, Discrete-Time Signal Processing, ch. 4.'],
  },
  {
    id: 'decibel', title: 'Decibels & Signal Levels', disc: 'signals', level: 'school', tags: ['db', 'dbm', 'gain', 'attenuation', 'power ratio', 'voltage ratio'],
    summary: 'Convert power or amplitude ratios to decibels and dBm (and back).',
    inputs: [SEL('mode', 'Convert', [['pr', 'Power ratio → dB'], ['vr', 'Voltage/amplitude ratio → dB'], ['db', 'dB → ratios'], ['w', 'Power → dBm']], 'pr'), I('r', 'Ratio', 'r', 'none', 100, { showIf: v => v.mode === 'pr' || v.mode === 'vr' }), I('db', 'Decibels', 'L', 'none', 20, { showIf: v => v.mode === 'db' }), I('P', 'Power', 'P', 'power', 1e-3, { u: { si: 'mW' }, showIf: v => v.mode === 'w' })],
    outputs: [O('dB', 'Level', 'L', 'none', { note: 'dB', primary: true }), O('pr', 'Power ratio', 'P_2/P_1', 'none'), O('vr', 'Amplitude ratio', 'V_2/V_1', 'none'), O('dbm', 'dBm', 'L_{dBm}', 'none', { note: 'dBm', optional: true })],
    compute(x) {
      const dB = x.mode === 'pr' ? 10 * Math.log10(x.r) : x.mode === 'vr' ? 20 * Math.log10(x.r) : x.mode === 'db' ? x.db : 10 * Math.log10(x.P / 1e-3);
      return { dB, pr: Math.pow(10, dB / 10), vr: Math.pow(10, dB / 20), dbm: x.mode === 'w' ? dB : NaN };
    },
    eq: ['L = 10\\log_{10}\\frac{P_2}{P_1} = 20\\log_{10}\\frac{V_2}{V_1}', 'L_{dBm} = 10\\log_{10}\\frac{P}{1\\text{ mW}}'], assume: ['Amplitude form assumes equal impedances.'], limits: [], refs: [],
  },
  {
    id: 'adc', title: 'ADC Resolution & Quantisation', disc: 'signals', level: 'uni', tags: ['adc', 'dac', 'bits', 'lsb', 'snr', 'enob', 'quantisation'],
    summary: 'LSB size, ideal quantisation SNR and dynamic range of an N-bit converter.',
    inputs: [I('N', 'Resolution (bits)', 'N', 'none', 12), I('Vref', 'Full-scale range', 'V_{FS}', 'voltage', 3.3), I('snr', 'Measured SINAD (for ENOB)', 'SINAD', 'none', 68, { adv: true, hint: 'dB' })],
    outputs: [O('lsb', 'LSB size', 'q', 'voltage', { u: { si: 'mV' }, primary: true }), O('levels', 'Number of levels', '2^N', 'none'), O('snrq', 'Ideal SNR (full-scale sine)', 'SNR', 'none', { note: 'dB' }), O('noise', 'Quantisation noise (RMS)', 'q/\\sqrt{12}', 'voltage', { u: { si: 'µV' } }), O('enob', 'Effective number of bits', 'ENOB', 'none')],
    compute({ N, Vref, snr }) { const q = Vref / Math.pow(2, N); return { lsb: q, levels: Math.pow(2, N), snrq: 6.02 * N + 1.76, noise: q / Math.sqrt(12), enob: (snr - 1.76) / 6.02 }; },
    eq: ['q = \\frac{V_{FS}}{2^N}', 'SNR = 6.02N + 1.76\\text{ dB}', 'ENOB = \\frac{SINAD - 1.76}{6.02}'], assume: ['Uniform quantisation, full-scale sinusoidal input.'], limits: [], refs: ['Analog Devices MT-001: Taking the Mystery out of the Infamous Formula SNR = 6.02N + 1.76 dB.'],
  },
  // ── Chemical engineering ───────────────────────────────
  {
    id: 'arrhenius', title: 'Reaction Rate — Arrhenius', disc: 'chemical', level: 'uni', tags: ['reaction kinetics', 'activation energy', 'rate constant', 'temperature dependence'],
    summary: 'Rate constant at temperature from the Arrhenius equation, and the rate increase between two temperatures.',
    inputs: [I('A', 'Pre-exponential factor', 'A', 'rate', 1e10), I('Ea', 'Activation energy (J/mol)', 'E_a', 'none', 75e3), I('T1', 'Temperature', 'T_1', 'temperature', 298.15, { u: { si: '°C' } }), I('T2', 'Second temperature', 'T_2', 'temperature', 308.15, { u: { si: '°C' } })],
    outputs: [O('k1', 'Rate constant at T₁', 'k_1', 'rate', { primary: true }), O('k2', 'Rate constant at T₂', 'k_2', 'rate'), O('ratio', 'Rate ratio k₂/k₁', '', 'none'), O('half', 'First-order half-life at T₁', 't_{1/2}', 'time')],
    compute({ A, Ea, T1, T2 }) { const R = K.R, k1 = A * Math.exp(-Ea / (R * T1)), k2 = A * Math.exp(-Ea / (R * T2)); return { k1, k2, ratio: k2 / k1, half: Math.LN2 / k1 }; },
    eq: ['k = A\\,e^{-E_a/RT}', '\\ln\\frac{k_2}{k_1} = \\frac{E_a}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right)'], assume: ['A and E_a independent of temperature.'], limits: [], refs: ['Fogler, Elements of Chemical Reaction Engineering, ch. 3.'],
  },
  {
    id: 'reactor', title: 'Reactor Design — CSTR vs PFR (1st order)', disc: 'chemical', level: 'uni', tags: ['cstr', 'pfr', 'conversion', 'residence time', 'reactor volume', 'space time'],
    summary: 'Conversion for a first-order reaction in a CSTR and a PFR, and the volumes needed for a target conversion.',
    inputs: [I('k', 'Rate constant', 'k', 'rate', 0.1 / 60, { u: { si: '1/min' } }), I('V', 'Reactor volume', 'V', 'volume', 2, { u: { si: 'm³' } }), I('Q', 'Volumetric flow', 'v_0', 'flow', 0.1 / 60, { u: { si: 'm³/h' } }), I('X', 'Target conversion', 'X', 'none', 0.9, { u: { si: '%' } }), I('n', 'CSTRs in series (for comparison)', 'n', 'none', 3, { adv: true })],
    outputs: [O('tau', 'Space time V/v₀', '\\tau', 'time', { u: { si: 'min' } }), O('Xc', 'CSTR conversion', 'X_{CSTR}', 'none', { u: { si: '%' } }), O('Xp', 'PFR conversion', 'X_{PFR}', 'none', { u: { si: '%' }, primary: true }), O('Xn', 'n CSTRs in series', 'X_n', 'none', { u: { si: '%' } }), O('Vc', 'CSTR volume for target X', 'V_{CSTR}', 'volume'), O('Vp', 'PFR volume for target X', 'V_{PFR}', 'volume')],
    compute({ k, V, Q, X, n }) { const tau = V / Q, kt = k * tau; return { tau, Xc: kt / (1 + kt), Xp: 1 - Math.exp(-kt), Xn: 1 - Math.pow(1 + kt / n, -n), Vc: Q * X / (k * (1 - X)), Vp: -Q * Math.log(1 - X) / k }; },
    eq: ['X_{CSTR} = \\frac{k\\tau}{1 + k\\tau}', 'X_{PFR} = 1 - e^{-k\\tau}', 'X_n = 1 - (1 + k\\tau/n)^{-n}'], assume: ['Isothermal, constant density, irreversible first-order reaction; ideal mixing/plug flow.'], limits: [], refs: ['Fogler ch. 2 & 4; Levenspiel, Chemical Reaction Engineering, ch. 5–6.'],
  },
  {
    id: 'afr', title: 'Stoichiometric Combustion (CₓHᵧ)', disc: 'chemical', level: 'uni', tags: ['air-fuel ratio', 'combustion', 'stoichiometry', 'excess air', 'co2 emissions', 'lambda'],
    summary: 'Stoichiometric air–fuel ratio, CO₂ produced and air flow for a hydrocarbon fuel with excess air.',
    inputs: [SEL('fuel', 'Fuel', [['1,4', 'Methane CH₄'], ['3,8', 'Propane C₃H₈'], ['8,18', 'Octane C₈H₁₈ (gasoline surrogate)'], ['12,23', 'Dodecane-type C₁₂H₂₃ (diesel/kerosene)'], ['custom', 'Custom CₓHᵧ']], '8,18'), I('x', 'Carbon atoms x', 'x', 'none', 8, { showIf: v => v.fuel === 'custom' }), I('y', 'Hydrogen atoms y', 'y', 'none', 18, { showIf: v => v.fuel === 'custom' }), I('lam', 'Air ratio λ (1 = stoichiometric)', '\\lambda', 'none', 1.0), I('mf', 'Fuel mass flow', '\\dot m_f', 'massflow', 1 / 3600, { u: { si: 'kg/h' } })],
    outputs: [O('afr', 'Stoichiometric AFR (mass)', 'AFR_s', 'none', { primary: true }), O('afra', 'Actual AFR', 'AFR', 'none'), O('ma', 'Air mass flow', '\\dot m_a', 'massflow', { u: { si: 'kg/h' } }), O('co2', 'CO₂ per kg fuel', '', 'none', { note: 'kg/kg' }), O('o2', 'O₂ in dry exhaust (approx.)', '', 'none', { u: { si: '%' } })],
    compute(x) {
      const [cx, hy] = x.fuel === 'custom' ? [x.x, x.y] : x.fuel.split(',').map(Number), a = cx + hy / 4, Mf = 12.011 * cx + 1.008 * hy, afr = a * 4.76 * 28.965 / Mf;
      const dry = cx + 3.76 * a * x.lam + (x.lam - 1) * a;
      return { afr, afra: afr * x.lam, ma: x.mf * afr * x.lam, co2: cx * 44.01 / Mf, o2: (x.lam - 1) * a / dry };
    },
    eq: ['C_xH_y + a(O_2 + 3.76N_2) \\to xCO_2 + \\tfrac{y}{2}H_2O + 3.76aN_2,\\; a = x + y/4', 'AFR_s = \\frac{4.76\\,a\\,M_{air}}{M_{fuel}}'], assume: ['Complete combustion; air = 21 % O₂ / 79 % N₂ by volume.'], limits: ['Real fuels are blends; use measured AFR (gasoline ≈ 14.7, diesel ≈ 14.5).'], refs: ['Turns, An Introduction to Combustion, ch. 2.'],
  },
  {
    id: 'mixing', title: 'Mass Balance — Stream Mixing', disc: 'chemical', level: 'school', tags: ['mass balance', 'concentration', 'mixing', 'blending', 'dilution'],
    summary: 'Flow and composition of two mixed streams (steady-state component mass balance).',
    inputs: [I('m1', 'Stream 1 flow', '\\dot m_1', 'massflow', 1), I('x1', 'Stream 1 mass fraction', 'x_1', 'none', 0.4, { u: { si: '%' } }), I('m2', 'Stream 2 flow', '\\dot m_2', 'massflow', 3), I('x2', 'Stream 2 mass fraction', 'x_2', 'none', 0.05, { u: { si: '%' } })],
    outputs: [O('m3', 'Mixed flow', '\\dot m_3', 'massflow'), O('x3', 'Mixed mass fraction', 'x_3', 'none', { u: { si: '%' }, primary: true }), O('mc', 'Component flow', '\\dot m_c', 'massflow')],
    compute({ m1, x1, m2, x2 }) { const m3 = m1 + m2, mc = m1 * x1 + m2 * x2; return { m3, x3: mc / m3, mc }; },
    eq: ['\\dot m_3 = \\dot m_1 + \\dot m_2', 'x_3 = \\frac{\\dot m_1x_1 + \\dot m_2x_2}{\\dot m_3}'], assume: ['Steady state, no reaction.'], limits: [], refs: ['Felder & Rousseau, Elementary Principles of Chemical Processes, ch. 4.'],
  },
  // ── Civil / geotechnical ───────────────────────────────
  {
    id: 'effective-stress', title: 'Effective Stress in Soil', disc: 'civil', level: 'uni', tags: ['effective stress', 'pore pressure', 'geotechnical', 'water table', 'terzaghi'],
    summary: 'Total stress, pore-water pressure and effective stress at depth with a water table.',
    inputs: [I('z', 'Depth of point', 'z', 'length', 8), I('zw', 'Depth to water table', 'z_w', 'length', 2), I('g', 'Bulk unit weight (above WT)', '\\gamma', 'stiffness', 18e3, { u: { si: 'kN/m' }, hint: 'kN/m³ (entered in the kN/m field)' }), I('gs', 'Saturated unit weight (below WT)', '\\gamma_{sat}', 'stiffness', 20e3, { u: { si: 'kN/m' }, hint: 'kN/m³' }), I('q', 'Surface surcharge', 'q', 'pressure', 0, { u: { si: 'kPa' } })],
    outputs: [O('s', 'Total vertical stress', '\\sigma_v', 'pressure', { u: { si: 'kPa' } }), O('u', 'Pore-water pressure', 'u', 'pressure', { u: { si: 'kPa' } }), O('se', 'Effective vertical stress', "\\sigma'_v", 'pressure', { primary: true, u: { si: 'kPa' } })],
    compute({ z, zw, g, gs, q }) { const s = q + g * Math.min(z, zw) + gs * Math.max(0, z - zw), u = 9.81e3 * Math.max(0, z - zw); return { s, u, se: s - u }; },
    eq: ["\\sigma'_v = \\sigma_v - u", '\\sigma_v = q + \\gamma z_w + \\gamma_{sat}(z - z_w)', 'u = \\gamma_w (z - z_w)'], assume: ['Hydrostatic pore pressure; horizontal layers; γ_w = 9.81 kN/m³.'], limits: [], refs: ['Craig\'s Soil Mechanics, ch. 3.'],
  },
  {
    id: 'bearing', title: 'Shallow Foundation Bearing Capacity', disc: 'civil', level: 'pro', tags: ['bearing capacity', 'foundation', 'terzaghi', 'footing', 'geotechnical', 'allowable bearing pressure'],
    summary: 'Ultimate and allowable bearing pressure of a shallow footing using the general bearing capacity equation.',
    inputs: [SEL('shape', 'Footing shape', [['strip', 'Strip'], ['square', 'Square'], ['circle', 'Circular']], 'square'), I('B', 'Width / diameter', 'B', 'length', 2), I('Df', 'Founding depth', 'D_f', 'length', 1), I('c', 'Cohesion', "c'", 'pressure', 5e3, { u: { si: 'kPa' } }), I('phi', 'Friction angle', "\\phi'", 'angle', rad(30)), I('gam', 'Soil unit weight', '\\gamma', 'stiffness', 18e3, { u: { si: 'kN/m' }, hint: 'kN/m³' }), I('FS', 'Factor of safety', 'FS', 'none', 3)],
    outputs: [O('Nc', 'N_c', 'N_c', 'none'), O('Nq', 'N_q', 'N_q', 'none'), O('Ng', 'N_γ', 'N_\\gamma', 'none'), O('qu', 'Ultimate bearing capacity', 'q_u', 'pressure', { u: { si: 'kPa' } }), O('qa', 'Allowable bearing pressure', 'q_a', 'pressure', { primary: true, u: { si: 'kPa' } }), O('Q', 'Allowable column load', 'Q_a', 'force', { u: { si: 'kN' } })],
    compute({ shape, B, Df, c, phi, gam, FS }) {
      const t = Math.tan(phi), Nq = Math.exp(PI * t) * Math.tan(PI / 4 + phi / 2) ** 2, Nc = t > 1e-9 ? (Nq - 1) / t : 5.14, Ng = 2 * (Nq + 1) * t;
      const [sc, sg] = { strip: [1, 1], square: [1.3, 0.8], circle: [1.3, 0.6] }[shape];
      const q = gam * Df, qu = sc * c * Nc + q * Nq + 0.5 * sg * gam * B * Ng, qa = qu / FS;
      const A = shape === 'strip' ? B : shape === 'square' ? B * B : PI * B * B / 4;
      return { Nc, Nq, Ng, qu, qa, Q: qa * A, _info: shape === 'strip' ? ['Strip footing: Q is per metre run.'] : [] };
    },
    eq: ['q_u = s_c c N_c + q N_q + \\tfrac12 s_\\gamma \\gamma B N_\\gamma', 'N_q = e^{\\pi\\tan\\phi}\\tan^2(45^\\circ + \\phi/2),\\; N_c = (N_q - 1)\\cot\\phi,\\; N_\\gamma = 2(N_q + 1)\\tan\\phi'],
    assume: ['Vesić bearing capacity factors with Terzaghi shape factors (s_c = 1.3, s_γ = 0.8 square / 0.6 circle).', 'Vertical concentric load, level ground, water table well below the footing.'],
    limits: ['Settlement usually governs on soft/loose soils. Design to the governing code (e.g. EN 1997-1 Annex D) with site investigation data.'], refs: ['Vesić (1973), ASCE J. Soil Mech. Found. Div.', 'Das, Principles of Foundation Engineering, ch. 4.'],
  },
  {
    id: 'earth-pressure', title: 'Rankine Earth Pressure (retaining wall)', disc: 'civil', level: 'uni', tags: ['retaining wall', 'active pressure', 'passive pressure', 'rankine', 'lateral earth pressure'],
    summary: 'Active/passive coefficients, pressure distribution and resultant thrust on a vertical wall with level backfill.',
    inputs: [I('phi', 'Friction angle', '\\phi', 'angle', rad(32)), I('gam', 'Unit weight', '\\gamma', 'stiffness', 18e3, { u: { si: 'kN/m' }, hint: 'kN/m³' }), I('H', 'Wall height', 'H', 'length', 4), I('q', 'Surcharge', 'q', 'pressure', 10e3, { u: { si: 'kPa' } })],
    outputs: [O('Ka', 'Active coefficient', 'K_a', 'none'), O('Kp', 'Passive coefficient', 'K_p', 'none'), O('K0', 'At-rest coefficient (Jaky)', 'K_0', 'none'), O('Pa', 'Active thrust per metre', 'P_a', 'stiffness', { primary: true, u: { si: 'kN/m' } }), O('y', 'Height of resultant above base', '\\bar y', 'length')],
    compute({ phi, gam, H, q }) { const Ka = (1 - Math.sin(phi)) / (1 + Math.sin(phi)), P1 = 0.5 * Ka * gam * H * H, P2 = Ka * q * H; return { Ka, Kp: 1 / Ka, K0: 1 - Math.sin(phi), Pa: P1 + P2, y: (P1 * H / 3 + P2 * H / 2) / (P1 + P2) }; },
    eq: ['K_a = \\frac{1 - \\sin\\phi}{1 + \\sin\\phi} = \\tan^2(45^\\circ - \\phi/2)', 'P_a = \\tfrac12 K_a\\gamma H^2 + K_a q H'], assume: ['Cohesionless, dry, level backfill; smooth vertical wall; wall moves enough to mobilise active state.'], limits: [], refs: ['Craig\'s Soil Mechanics, ch. 11.'],
  },
  {
    id: 'consolidation', title: 'Consolidation Settlement & Time', disc: 'civil', level: 'pro', tags: ['consolidation', 'settlement', 'compression index', 'clay', 'time factor', 'cv'],
    summary: 'Primary consolidation settlement of a normally consolidated clay layer and time to reach a degree of consolidation.',
    inputs: [I('Cc', 'Compression index', 'C_c', 'none', 0.3), I('e0', 'Initial void ratio', 'e_0', 'none', 0.9), I('H', 'Layer thickness', 'H', 'length', 4), I('s0', 'Initial effective stress (mid-layer)', "\\sigma'_0", 'pressure', 60e3, { u: { si: 'kPa' } }), I('ds', 'Stress increase', '\\Delta\\sigma', 'pressure', 40e3, { u: { si: 'kPa' } }),
      I('cv', 'Coefficient of consolidation', 'c_v', 'kinvisc', 2 / 31557600, { u: { si: 'm²/s' }, hint: 'm²/yr ÷ 31.6×10⁶' }), SEL('drain', 'Drainage', [['2', 'Double (top & bottom)'], ['1', 'Single']], '2'), I('U', 'Target degree of consolidation', 'U', 'none', 0.9, { u: { si: '%' } })],
    outputs: [O('S', 'Final settlement', 'S_c', 'length', { primary: true, u: { si: 'mm' } }), O('Tv', 'Time factor', 'T_v', 'none'), O('t', 'Time to reach U', 't', 'time', { u: { si: 'yr', metric: 'yr', imperial: 'yr' } })],
    compute({ Cc, e0, H, s0, ds, cv, drain, U }) {
      const S = Cc * H / (1 + e0) * Math.log10((s0 + ds) / s0);
      const Tv = U <= 0.6 ? PI / 4 * U * U : -0.933 * Math.log10(1 - U) - 0.085, Hd = H / +drain;
      return { S, Tv, t: Tv * Hd * Hd / cv };
    },
    eq: ["S_c = \\frac{C_c H}{1 + e_0}\\log_{10}\\frac{\\sigma'_0 + \\Delta\\sigma}{\\sigma'_0}", 't = \\frac{T_v H_{dr}^2}{c_v}', 'T_v = \\tfrac{\\pi}{4}U^2\\;(U \\le 0.6),\\; T_v = -0.933\\log(1-U) - 0.085'], assume: ['Normally consolidated clay; 1D Terzaghi consolidation; uniform Δσ with depth.'], limits: ['Overconsolidated clays use C_r below the preconsolidation pressure.'], refs: ['Craig\'s Soil Mechanics, ch. 7.'],
  },
  {
    id: 'rational', title: 'Rational Method Peak Runoff', disc: 'civil', level: 'uni', tags: ['hydrology', 'runoff', 'drainage', 'storm water', 'rainfall intensity'],
    summary: 'Peak storm-water runoff from a small catchment (Q = CiA).',
    inputs: [I('C', 'Runoff coefficient', 'C', 'none', 0.7, { hint: 'roofs/asphalt 0.8–0.95, lawns 0.1–0.35, industrial 0.5–0.9' }), I('i', 'Rainfall intensity (mm/h)', 'i', 'none', 50), I('A', 'Catchment area', 'A', 'area', 2e4, { u: { si: 'ha' } })],
    outputs: [O('Q', 'Peak discharge', 'Q_p', 'flow', { primary: true, u: { si: 'L/s' } })],
    compute({ C, i, A }) { return { Q: C * i / 1000 / 3600 * A }; },
    eq: ['Q_p = C\\,i\\,A'], assume: ['Rainfall duration equals time of concentration; uniform intensity.'], limits: ['Valid for small catchments (< ~80 ha).'], refs: ['Chow, Maidment & Mays, Applied Hydrology, §15.1.'],
  },
  // ── Materials science ──────────────────────────────────
  {
    id: 'bragg', title: "X-Ray Diffraction — Bragg's Law", disc: 'materials', level: 'uni', tags: ['bragg', 'xrd', 'miller indices', 'lattice parameter', 'crystal', 'd-spacing'],
    summary: 'Interplanar spacing of cubic crystal planes (hkl) and the Bragg diffraction angle.',
    inputs: [I('a', 'Lattice parameter', 'a', 'length', 0.3615e-9, { u: { si: 'nm' }, hint: 'Cu 0.3615 nm, Al 0.4049, α-Fe 0.2866' }), I('h', 'h', 'h', 'none', 1), I('k', 'k', 'k', 'none', 1), I('l', 'l', 'l', 'none', 1), I('lam', 'X-ray wavelength', '\\lambda', 'length', 0.15406e-9, { u: { si: 'nm' }, hint: 'Cu Kα₁ 0.15406 nm' }), I('n', 'Order', 'n', 'none', 1, { adv: true })],
    outputs: [O('d', 'Interplanar spacing', 'd_{hkl}', 'length', { u: { si: 'nm' } }), O('th', 'Bragg angle θ', '\\theta', 'angle', { primary: true }), O('tth', 'Detector angle 2θ', '2\\theta', 'angle')],
    compute({ a, h, k, l, lam, n }) { const d = a / Math.sqrt(h * h + k * k + l * l), s = n * lam / (2 * d); return { d, th: s <= 1 ? Math.asin(s) : NaN, tth: s <= 1 ? 2 * Math.asin(s) : NaN, _warn: s > 1 ? ['No diffraction: nλ > 2d.'] : [] }; },
    eq: ['n\\lambda = 2d\\sin\\theta', 'd_{hkl} = \\frac{a}{\\sqrt{h^2 + k^2 + l^2}}'], assume: ['Cubic lattice.'], limits: ['Structure factor determines which reflections appear (BCC: h+k+l even; FCC: all odd or all even).'], refs: ['Callister, Materials Science and Engineering, §3.16.'],
  },
  {
    id: 'crystal', title: 'Crystal Structure — Lattice & Density', disc: 'materials', level: 'uni', tags: ['unit cell', 'bcc', 'fcc', 'hcp', 'atomic packing factor', 'theoretical density'],
    summary: 'Lattice parameter, atomic packing factor and theoretical density from atomic radius and mass.',
    inputs: [SEL('st', 'Structure', [['sc', 'Simple cubic'], ['bcc', 'Body-centred cubic'], ['fcc', 'Face-centred cubic'], ['hcp', 'Hexagonal close-packed (ideal c/a)']], 'fcc'), I('r', 'Atomic radius', 'R', 'length', 0.1278e-9, { u: { si: 'nm' }, hint: 'Cu 0.1278, Fe 0.1241, Al 0.1431 nm' }), I('M', 'Atomic mass (g/mol)', 'A', 'none', 63.55)],
    outputs: [O('a', 'Lattice parameter', 'a', 'length', { u: { si: 'nm' } }), O('n', 'Atoms per cell', 'n', 'none'), O('apf', 'Atomic packing factor', 'APF', 'none'), O('CN', 'Coordination number', 'CN', 'none'), O('rho', 'Theoretical density', '\\rho', 'density', { primary: true, u: { si: 'g/cm³' } })],
    compute({ st, r, M }) {
      const d = { sc: [2 * r, 1, 6], bcc: [4 * r / Math.sqrt(3), 2, 8], fcc: [2 * Math.SQRT2 * r, 4, 12], hcp: [2 * r, 6, 12] }[st];
      const [a, n, CN] = d, Vc = st === 'hcp' ? 3 * Math.sqrt(3) / 2 * a * a * a * Math.sqrt(8 / 3) : a ** 3;
      return { a, n, CN, apf: n * 4 / 3 * PI * r ** 3 / Vc, rho: n * M * 1e-3 / (K.NA * Vc) };
    },
    eq: ['\\rho = \\frac{nA}{V_C N_A}', 'a_{FCC} = 2\\sqrt2R,\\; a_{BCC} = \\frac{4R}{\\sqrt3}'], assume: ['Hard-sphere model.'], limits: [], refs: ['Callister §3.4–3.5.'],
  },
  {
    id: 'carburizing', title: "Diffusion — Fick's Second Law (carburising)", disc: 'materials', level: 'pro', tags: ['diffusion', 'fick', 'carburizing', 'case hardening', 'error function', 'diffusion coefficient'],
    summary: 'Concentration profile in a semi-infinite solid with constant surface concentration, and time to reach a target concentration at depth.',
    inputs: [I('C0', 'Initial concentration (wt%)', 'C_0', 'none', 0.2), I('Cs', 'Surface concentration (wt%)', 'C_s', 'none', 1.0), I('Cx', 'Target concentration at depth (wt%)', 'C_x', 'none', 0.45), I('x', 'Depth', 'x', 'length', 0.5e-3, { u: { si: 'mm' } }),
      I('D0', 'Pre-exponential D₀', 'D_0', 'kinvisc', 2.3e-5, { u: { si: 'm²/s' }, hint: 'C in γ-Fe: D₀ = 2.3×10⁻⁵ m²/s, Q_d = 148 kJ/mol' }), I('Qd', 'Activation energy (J/mol)', 'Q_d', 'none', 148e3), I('T', 'Temperature', 'T', 'temperature', 1273.15, { u: { si: '°C' } })],
    outputs: [O('D', 'Diffusion coefficient', 'D', 'kinvisc', { u: { si: 'm²/s' } }), O('t', 'Time to reach C_x at depth x', 't', 'time', { primary: true, u: { si: 'h' } }), O('L', 'Characteristic depth √(Dt)', '\\sqrt{Dt}', 'length', { u: { si: 'mm' } })],
    compute(x) {
      const D = x.D0 * Math.exp(-x.Qd / (K.R * x.T)), target = (x.Cx - x.C0) / (x.Cs - x.C0);
      if (!(target > 0 && target < 1)) return { D, _warn: ['C_x must lie between C_0 and C_s.'] };
      const z = (() => { let lo = 0, hi = 6; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (erfc(m) > target) lo = m; else hi = m; } return (lo + hi) / 2; })();
      const t = (x.x / (2 * z)) ** 2 / D;
      const xs = [], cs = []; for (let i = 0; i <= 100; i++) { const d = 4 * x.x * i / 100; xs.push(d * 1e3); cs.push(x.C0 + (x.Cs - x.C0) * erfc(d / (2 * Math.sqrt(D * t)))); }
      return { D, t, L: Math.sqrt(D * t), _plot: { series: [{ x: xs, y: cs, label: 'C(x) at time t' }], opts: { xlabel: 'depth (mm)', ylabel: 'wt %', marks: [{ x: x.x * 1e3, label: 'x' }], hlines: [{ y: x.Cx, label: 'C_x' }] } } };
    },
    eq: ['\\frac{C_x - C_0}{C_s - C_0} = 1 - \\operatorname{erf}\\left(\\frac{x}{2\\sqrt{Dt}}\\right)', 'D = D_0 e^{-Q_d/RT}'], assume: ['Semi-infinite solid, constant surface concentration and D.'], limits: [], refs: ['Callister §5.4–5.5 (Example 5.3).'],
  },
  {
    id: 'fracture', title: 'Fracture Mechanics (LEFM)', disc: 'materials', level: 'pro', tags: ['fracture toughness', 'stress intensity factor', 'critical crack length', 'kic', 'griffith'],
    summary: 'Stress intensity factor, critical crack size and critical stress using linear-elastic fracture mechanics.',
    inputs: [I('sig', 'Applied stress', '\\sigma', 'pressure', 200e6, { u: { si: 'MPa' } }), I('a', 'Crack length (edge) / half-length (centre)', 'a', 'length', 2e-3, { u: { si: 'mm' } }), I('Y', 'Geometry factor', 'Y', 'none', 1.12, { hint: 'edge crack ≈ 1.12, centre crack in wide plate = 1.0' }), I('KIc', 'Fracture toughness', 'K_{Ic}', 'none', 29e6, { hint: 'Pa·√m — 7075-T651 ≈ 24–29 MPa√m, 4340 ≈ 50, Ti-6Al-4V ≈ 55' }), I('Sy', 'Yield strength', 'S_y', 'pressure', 503e6, { u: { si: 'MPa' }, adv: true })],
    outputs: [O('K', 'Stress intensity factor', 'K_I', 'none', { note: 'MPa√m' }), O('n', 'Safety factor on K', 'K_{Ic}/K_I', 'none', { primary: true }), O('ac', 'Critical crack size', 'a_c', 'length', { u: { si: 'mm' } }), O('sc', 'Critical stress', '\\sigma_c', 'pressure', { u: { si: 'MPa' } }), O('B', 'Plane-strain thickness requirement', 'B \\ge 2.5(K_{Ic}/S_y)^2', 'length', { u: { si: 'mm' } })],
    compute({ sig, a, Y, KIc, Sy }) { const K = Y * sig * Math.sqrt(PI * a); return { K: K / 1e6, n: KIc / K, ac: (KIc / (Y * sig)) ** 2 / PI, sc: KIc / (Y * Math.sqrt(PI * a)), B: 2.5 * (KIc / Sy) ** 2, _checks: [check('K_I < K_Ic', K < KIc, `${(K / 1e6).toFixed(1)} vs ${(KIc / 1e6).toFixed(1)} MPa√m`)] }; },
    eq: ['K_I = Y\\sigma\\sqrt{\\pi a}', 'a_c = \\frac{1}{\\pi}\\left(\\frac{K_{Ic}}{Y\\sigma}\\right)^2'], assume: ['Linear-elastic fracture mechanics; small-scale yielding.'], limits: ['Not valid when plastic zone is large (use EPFM/J-integral).'], refs: ['Anderson, Fracture Mechanics, ch. 2.', 'ASTM E399 (K_Ic testing).'],
  },
  {
    id: 'paris', title: 'Fatigue Crack Growth (Paris Law)', disc: 'materials', level: 'pro', tags: ['paris law', 'crack growth', 'damage tolerance', 'fatigue life', 'da/dn'],
    summary: 'Cycles to grow a crack from initial to final size under constant-amplitude loading.',
    inputs: [I('C', 'Paris coefficient C (m/cycle, MPa√m)', 'C', 'none', 6.9e-12, { hint: 'ferritic-pearlitic steels ≈ 6.9×10⁻¹², m = 3 (Barsom)' }), I('m', 'Paris exponent', 'm', 'none', 3), I('ds', 'Stress range', '\\Delta\\sigma', 'pressure', 150e6, { u: { si: 'MPa' } }), I('Y', 'Geometry factor', 'Y', 'none', 1.12), I('a0', 'Initial crack', 'a_0', 'length', 1e-3, { u: { si: 'mm' } }), I('af', 'Final crack', 'a_f', 'length', 10e-3, { u: { si: 'mm' } })],
    outputs: [O('N', 'Cycles to reach a_f', 'N_f', 'none', { primary: true }), O('dK0', 'Initial ΔK', '\\Delta K_0', 'none', { note: 'MPa√m' })],
    compute({ C, m, ds, Y, a0, af }) {
      const dsM = ds / 1e6, f = a => 1 / (C * Math.pow(Y * dsM * Math.sqrt(PI * a), m));
      let N = 0; const n = 2000, h = (af - a0) / n;
      for (let i = 0; i <= n; i++) N += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f(a0 + i * h);
      return { N: N * h / 3, dK0: Y * dsM * Math.sqrt(PI * a0) };
    },
    eq: ['\\frac{da}{dN} = C(\\Delta K)^m', '\\Delta K = Y\\Delta\\sigma\\sqrt{\\pi a}', 'N_f = \\int_{a_0}^{a_f}\\frac{da}{C(Y\\Delta\\sigma\\sqrt{\\pi a})^m}'], assume: ['Constant Y; region II (Paris) growth; no load interaction effects.'], limits: [], refs: ['Paris & Erdogan (1963); Barsom & Rolfe, Fracture and Fatigue Control in Structures.'],
  },
  {
    id: 'hall-petch', title: 'Grain Size Strengthening (Hall–Petch)', disc: 'materials', level: 'uni', tags: ['hall-petch', 'grain size', 'yield strength', 'strengthening mechanisms'],
    summary: 'Yield strength as a function of average grain diameter.',
    inputs: [I('s0', 'Friction stress σ₀', '\\sigma_0', 'pressure', 70e6, { u: { si: 'MPa' } }), I('ky', 'Hall–Petch coefficient (MPa·√m)', 'k_y', 'none', 0.74, { hint: 'mild steel ≈ 0.74' }), I('d', 'Grain diameter', 'd', 'length', 20e-6, { u: { si: 'µm' } })],
    outputs: [O('sy', 'Yield strength', '\\sigma_y', 'pressure', { primary: true, u: { si: 'MPa' } })],
    compute({ s0, ky, d }) { return { sy: s0 + ky * 1e6 / Math.sqrt(d) }; },
    eq: ['\\sigma_y = \\sigma_0 + k_y d^{-1/2}'], assume: ['Valid for grain sizes above ~20 nm.'], limits: [], refs: ['Callister §7.8.'],
  },
  {
    id: 'rule-mixtures', title: 'Composite Rule of Mixtures', disc: 'materials', level: 'uni', tags: ['composite', 'fibre volume fraction', 'rule of mixtures', 'longitudinal modulus', 'transverse modulus'],
    summary: 'Longitudinal and transverse modulus, density and strength of a unidirectional fibre composite.',
    inputs: [I('Ef', 'Fibre modulus', 'E_f', 'pressure', 230e9, { u: { si: 'GPa' } }), I('Em', 'Matrix modulus', 'E_m', 'pressure', 3.5e9, { u: { si: 'GPa' } }), I('Vf', 'Fibre volume fraction', 'V_f', 'none', 0.6, { u: { si: '%' } }), I('rf', 'Fibre density', '\\rho_f', 'density', 1800), I('rm', 'Matrix density', '\\rho_m', 'density', 1200), I('sf', 'Fibre strength', '\\sigma_f', 'pressure', 3500e6, { u: { si: 'MPa' }, adv: true }), I('sm', 'Matrix stress at fibre failure strain', "\\sigma_m'", 'pressure', 50e6, { u: { si: 'MPa' }, adv: true })],
    outputs: [O('E1', 'Longitudinal modulus', 'E_1', 'pressure', { primary: true, u: { si: 'GPa' } }), O('E2', 'Transverse modulus (inverse ROM)', 'E_2', 'pressure', { u: { si: 'GPa' } }), O('rho', 'Density', '\\rho_c', 'density'), O('s1', 'Longitudinal strength', '\\sigma_1', 'pressure', { u: { si: 'MPa' } })],
    compute({ Ef, Em, Vf, rf, rm, sf, sm }) { return { E1: Ef * Vf + Em * (1 - Vf), E2: 1 / (Vf / Ef + (1 - Vf) / Em), rho: rf * Vf + rm * (1 - Vf), s1: sf * Vf + sm * (1 - Vf) }; },
    eq: ['E_1 = E_fV_f + E_m(1 - V_f)', '\\frac{1}{E_2} = \\frac{V_f}{E_f} + \\frac{1 - V_f}{E_m}'], assume: ['Perfect bonding, continuous aligned fibres.'], limits: ['Inverse ROM underestimates E₂ — use Halpin–Tsai for design.'], refs: ['Callister §16.5.'],
  },
  // ── Mechatronics & robotics ────────────────────────────
  {
    id: 'two-link', title: 'Two-Link Planar Arm Kinematics', disc: 'robotics', level: 'uni', tags: ['forward kinematics', 'inverse kinematics', 'robot arm', 'manipulator', 'workspace', 'jacobian'],
    summary: 'Forward and inverse kinematics of a 2-DOF planar arm, with the Jacobian determinant and a diagram.',
    inputs: [SEL('mode', 'Mode', [['fk', 'Forward: joint angles → position'], ['ik', 'Inverse: position → joint angles']], 'ik'), I('L1', 'Link 1 length', 'L_1', 'length', 0.4, { u: { si: 'mm' } }), I('L2', 'Link 2 length', 'L_2', 'length', 0.3, { u: { si: 'mm' } }),
      I('t1', 'Joint 1 angle', '\\theta_1', 'angle', rad(30), { showIf: v => v.mode === 'fk' }), I('t2', 'Joint 2 angle', '\\theta_2', 'angle', rad(45), { showIf: v => v.mode === 'fk' }), I('x', 'Target x', 'x', 'length', 0.45, { u: { si: 'mm' }, showIf: v => v.mode === 'ik' }), I('y', 'Target y', 'y', 'length', 0.3, { u: { si: 'mm' }, showIf: v => v.mode === 'ik' }), SEL('elbow', 'Elbow', [['down', 'Elbow down (θ₂ > 0)'], ['up', 'Elbow up (θ₂ < 0)']], 'down', { showIf: v => v.mode === 'ik' })],
    outputs: [O('X', 'End-effector x', 'x', 'length', { u: { si: 'mm' } }), O('Y', 'End-effector y', 'y', 'length', { u: { si: 'mm' } }), O('T1', 'θ₁', '\\theta_1', 'angle', { primary: true }), O('T2', 'θ₂', '\\theta_2', 'angle'), O('detJ', 'Jacobian determinant L₁L₂ sin θ₂', '\\det J', 'area'), O('reach', 'Reach', '', 'none', { type: 'text' })],
    compute(x) {
      let t1 = x.t1, t2 = x.t2; const w = [];
      if (x.mode === 'ik') {
        const c2 = (x.x ** 2 + x.y ** 2 - x.L1 ** 2 - x.L2 ** 2) / (2 * x.L1 * x.L2);
        if (Math.abs(c2) > 1) return { _warn: ['Target out of reach.'], reach: 'Unreachable' };
        t2 = (x.elbow === 'down' ? 1 : -1) * Math.acos(c2);
        t1 = Math.atan2(x.y, x.x) - Math.atan2(x.L2 * Math.sin(t2), x.L1 + x.L2 * Math.cos(t2));
      }
      const ex = x.L1 * Math.cos(t1), ey = x.L1 * Math.sin(t1), X = ex + x.L2 * Math.cos(t1 + t2), Y = ey + x.L2 * Math.sin(t1 + t2);
      const detJ = x.L1 * x.L2 * Math.sin(t2);
      if (Math.abs(Math.sin(t2)) < 0.05) w.push('Near a singularity (arm fully stretched or folded) — joint speeds blow up.');
      const R = x.L1 + x.L2, S = 150 / R, cx = 180, cy = 180, P = (a, b) => `${cx + a * S},${cy - b * S}`;
      const svg = `<svg class="plot" viewBox="0 0 360 340"><circle cx="${cx}" cy="${cy}" r="${R * S}" fill="none" stroke="var(--line2)" stroke-dasharray="4 4"/><circle cx="${cx}" cy="${cy}" r="${Math.abs(x.L1 - x.L2) * S}" fill="none" stroke="var(--line2)" stroke-dasharray="4 4"/><polyline points="${P(0, 0)} ${P(ex, ey)} ${P(X, Y)}" fill="none" stroke="var(--acc)" stroke-width="6" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="7" fill="var(--ink)"/><circle cx="${cx + ex * S}" cy="${cy - ey * S}" r="6" fill="var(--c2)"/><circle cx="${cx + X * S}" cy="${cy - Y * S}" r="6" fill="var(--c3)"/><text x="10" y="330">dashed: workspace boundary</text></svg>`;
      return { X, Y, T1: t1, T2: t2, detJ, reach: `Annulus ${Math.abs(x.L1 - x.L2).toPrecision(3)}–${R.toPrecision(3)} m`, _warn: w, _svg: svg };
    },
    eq: ['x = L_1\\cos\\theta_1 + L_2\\cos(\\theta_1 + \\theta_2)', '\\cos\\theta_2 = \\frac{x^2 + y^2 - L_1^2 - L_2^2}{2L_1L_2}', '\\theta_1 = \\operatorname{atan2}(y, x) - \\operatorname{atan2}(L_2\\sin\\theta_2, L_1 + L_2\\cos\\theta_2)'], assume: ['Planar revolute joints, rigid links, no joint limits.'], limits: [], refs: ['Craig, Introduction to Robotics, ch. 4.'],
  },
  {
    id: 'dc-motor', title: 'DC Motor Model', disc: 'robotics', level: 'uni', tags: ['dc motor', 'torque constant', 'back emf', 'stall torque', 'no-load speed', 'motor curve'],
    summary: 'Steady-state speed, current, power and efficiency of a brushed DC motor, with its torque–speed curve.',
    inputs: [I('V', 'Supply voltage', 'V', 'voltage', 12), I('R', 'Armature resistance', 'R', 'resistance', 1.2), I('Kt', 'Torque constant (= K_e)', 'K_t', 'none', 0.05, { hint: 'N·m/A (= V·s/rad)' }), I('TL', 'Load torque', 'T_L', 'torque', 0.1), I('I0', 'No-load current', 'I_0', 'current', 0.1, { adv: true })],
    outputs: [O('w', 'Speed', '\\omega', 'angvel', { primary: true, u: { si: 'rpm' } }), O('I', 'Current', 'I', 'current'), O('Pout', 'Mechanical output', 'P_{out}', 'power'), O('eta', 'Efficiency', '\\eta', 'none', { u: { si: '%' } }), O('Ts', 'Stall torque', 'T_s', 'torque'), O('w0', 'No-load speed', '\\omega_0', 'angvel', { u: { si: 'rpm' } }), O('Pmax', 'Max output power', 'P_{max}', 'power')],
    compute({ V, R, Kt, TL, I0 }) {
      const I = TL / Kt + I0, w = (V - I * R) / Kt, Ts = Kt * (V / R - I0), w0 = (V - I0 * R) / Kt;
      const ts = [], ws = []; for (let i = 0; i <= 50; i++) { const T = Ts * i / 50; ts.push(T); ws.push((V - (T / Kt + I0) * R) / Kt * 60 / (2 * PI)); }
      return { I, w, Pout: TL * w, eta: TL * w / (V * I), Ts, w0, Pmax: Ts * w0 / 4, _warn: w < 0 ? ['Load exceeds stall torque.'] : [], _plot: { series: [{ x: ts, y: ws, label: 'speed (rpm) vs torque' }], opts: { xlabel: 'T (N·m)', ylabel: 'rpm', marks: [{ x: TL, label: 'T_L' }] } } };
    },
    eq: ['V = IR + K_e\\omega', 'T = K_t(I - I_0)', '\\omega = \\frac{V - IR}{K_e}'], assume: ['Steady state, inductance neglected, K_t = K_e in SI.'], limits: [], refs: ['Hughes & Drury, Electric Motors and Drives, ch. 3.'],
  },
  {
    id: 'stepper', title: 'Stepper Motor & Lead Screw', disc: 'robotics', level: 'uni', tags: ['stepper motor', 'microstepping', 'lead screw', 'linear resolution', 'steps per mm'],
    summary: 'Linear resolution, steps per mm, feed speed and thrust of a stepper motor driving a lead screw.',
    inputs: [I('spr', 'Full steps per revolution', 'n', 'none', 200), I('ms', 'Microstepping', 'm', 'none', 16), I('p', 'Screw lead', 'p', 'length', 8e-3, { u: { si: 'mm' } }), I('f', 'Step pulse rate', 'f', 'frequency', 20e3, { u: { si: 'kHz' } }), I('T', 'Motor torque', 'T', 'torque', 0.4), I('eta', 'Screw efficiency', '\\eta', 'none', 0.35, { adv: true, hint: 'trapezoidal ≈ 0.3–0.5, ball screw ≈ 0.9' })],
    outputs: [O('res', 'Linear resolution', '\\Delta x', 'length', { u: { si: 'µm' }, primary: true }), O('spmm', 'Steps per mm', '', 'none'), O('v', 'Linear speed', 'v', 'velocity', { u: { si: 'mm/s' } }), O('rpm', 'Motor speed', '\\omega', 'angvel', { u: { si: 'rpm' } }), O('F', 'Thrust', 'F', 'force')],
    compute({ spr, ms, p, f, T, eta }) { const steps = spr * ms, res = p / steps; return { res, spmm: 1e-3 / res, v: f * res, rpm: f / steps * 2 * PI, F: 2 * PI * eta * T / p }; },
    eq: ['\\Delta x = \\frac{p}{n\\,m}', 'F = \\frac{2\\pi\\eta T}{p}'], assume: ['No missed steps; microstep positions are ideal (real accuracy is lower).'], limits: [], refs: [],
  },
  // ── Vibrations ─────────────────────────────────────────
  {
    id: 'forced-vib', title: 'Forced Vibration & Transmissibility', disc: 'vibrations', level: 'uni', tags: ['forced vibration', 'resonance', 'magnification factor', 'transmissibility', 'vibration isolation', 'frequency response'],
    summary: 'Steady-state amplitude, phase, dynamic magnification and force transmissibility of a damped SDOF system under harmonic force.',
    inputs: [I('m', 'Mass', 'm', 'mass', 50), I('k', 'Stiffness', 'k', 'stiffness', 2e5, { u: { si: 'kN/m' } }), I('z', 'Damping ratio', '\\zeta', 'none', 0.05), I('F0', 'Force amplitude', 'F_0', 'force', 200), I('f', 'Excitation frequency', 'f', 'frequency', 12)],
    outputs: [O('fn', 'Natural frequency', 'f_n', 'frequency'), O('r', 'Frequency ratio', 'r', 'none'), O('X', 'Displacement amplitude', 'X', 'length', { u: { si: 'mm' }, primary: true }), O('M', 'Magnification factor', 'X k/F_0', 'none'), O('ph', 'Phase lag', '\\phi', 'angle'), O('TR', 'Force transmissibility', 'TR', 'none'), O('Ft', 'Transmitted force', 'F_T', 'force')],
    compute({ m, k, z, F0, f }) {
      const wn = Math.sqrt(k / m), r = 2 * PI * f / wn, D = Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2), M = 1 / D, TR = Math.sqrt(1 + (2 * z * r) ** 2) / D;
      const rs = [], Ms = [], Ts = []; for (let i = 1; i <= 300; i++) { const rr = 3 * i / 300, d = Math.sqrt((1 - rr * rr) ** 2 + (2 * z * rr) ** 2); rs.push(rr); Ms.push(1 / d); Ts.push(Math.sqrt(1 + (2 * z * rr) ** 2) / d); }
      return { fn: wn / (2 * PI), r, X: F0 / k * M, M, ph: Math.atan2(2 * z * r, 1 - r * r), TR, Ft: TR * F0, _info: [r > Math.SQRT2 ? 'r > √2: isolation region (TR < 1).' : 'r < √2: transmitted force is amplified.'],
        _plot: { series: [{ x: rs, y: Ms, label: 'magnification X k/F₀' }, { x: rs, y: Ts, label: 'transmissibility', dash: '5 4' }], opts: { xlabel: 'r = ω/ωn', ylabel: '', logy: true, marks: [{ x: r, label: 'operating r' }, { x: Math.SQRT2, label: '√2' }] } } };
    },
    eq: ['X = \\frac{F_0/k}{\\sqrt{(1 - r^2)^2 + (2\\zeta r)^2}}', 'TR = \\frac{\\sqrt{1 + (2\\zeta r)^2}}{\\sqrt{(1 - r^2)^2 + (2\\zeta r)^2}}', '\\tan\\phi = \\frac{2\\zeta r}{1 - r^2}'], assume: ['Linear SDOF, viscous damping, steady state.'], limits: [], refs: ['Rao, Mechanical Vibrations, ch. 3.'],
  },
  {
    id: 'unbalance', title: 'Rotating Unbalance', disc: 'vibrations', level: 'uni', tags: ['unbalance', 'rotating machinery', 'eccentric mass', 'vibration amplitude'],
    summary: 'Vibration amplitude of a machine on flexible mounts due to a rotating unbalance.',
    inputs: [I('M', 'Total machine mass', 'M', 'mass', 200), I('me', 'Unbalance m·e (kg·m)', 'm e', 'none', 0.002), I('k', 'Mount stiffness (total)', 'k', 'stiffness', 1e6, { u: { si: 'kN/m' } }), I('z', 'Damping ratio', '\\zeta', 'none', 0.08), I('n', 'Speed', '\\omega', 'angvel', 1480 * 2 * PI / 60)],
    outputs: [O('X', 'Vibration amplitude', 'X', 'length', { primary: true, u: { si: 'µm' } }), O('v', 'Velocity amplitude (RMS)', 'v_{rms}', 'velocity', { u: { si: 'mm/s' } }), O('ncrit', 'Critical speed', 'n_c', 'angvel', { u: { si: 'rpm' } }), O('Fu', 'Unbalance force', 'F_u', 'force')],
    compute({ M, me, k, z, n }) { const wn = Math.sqrt(k / M), r = n / wn, X = me / M * r * r / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2); return { X, v: X * n / Math.SQRT2, ncrit: wn, Fu: me * n * n, _info: ['Compare v_rms with ISO 10816/20816 severity zones for your machine class.'] }; },
    eq: ['X = \\frac{me}{M}\\frac{r^2}{\\sqrt{(1 - r^2)^2 + (2\\zeta r)^2}}'], assume: ['Vertical SDOF model.'], limits: [], refs: ['Rao §3.7; ISO 21940 (balance quality).'],
  },
  {
    id: 'beam-freq', title: 'Natural Frequencies of Beams', disc: 'vibrations', level: 'pro', tags: ['beam vibration', 'natural frequency', 'mode shapes', 'euler-bernoulli', 'cantilever frequency'],
    summary: 'First three bending natural frequencies of uniform Euler–Bernoulli beams for standard end conditions.',
    inputs: [SEL('bc', 'Boundary conditions', [['ss', 'Pinned–pinned'], ['cf', 'Cantilever (fixed–free)'], ['ff', 'Fixed–fixed'], ['fp', 'Fixed–pinned'], ['free', 'Free–free']], 'cf'), I('L', 'Length', 'L', 'length', 1), I('E', "Young's modulus", 'E', 'pressure', 200e9, { u: { si: 'GPa' } }), I('I', 'Second moment of area', 'I', 'areamoment', 8.33e-10, { u: { si: 'mm⁴' } }), I('mpl', 'Mass per unit length', '\\rho A', 'massperlen', 0.785)],
    outputs: [O('f1', 'Mode 1', 'f_1', 'frequency', { primary: true }), O('f2', 'Mode 2', 'f_2', 'frequency'), O('f3', 'Mode 3', 'f_3', 'frequency')],
    compute({ bc, L, E, I, mpl }) {
      const bl = { ss: [PI, 2 * PI, 3 * PI], cf: [1.87510, 4.69409, 7.85476], ff: [4.73004, 7.85320, 10.99561], fp: [3.92660, 7.06858, 10.21018], free: [4.73004, 7.85320, 10.99561] }[bc];
      const f = b => b * b / (2 * PI * L * L) * Math.sqrt(E * I / mpl);
      return { f1: f(bl[0]), f2: f(bl[1]), f3: f(bl[2]), _info: bc === 'free' ? ['Free–free beams also have two rigid-body modes at 0 Hz.'] : [] };
    },
    eq: ['f_n = \\frac{(\\beta_nL)^2}{2\\pi L^2}\\sqrt{\\frac{EI}{\\rho A}}'], assume: ['Uniform slender beam; shear deformation and rotary inertia neglected.'], limits: [], refs: ['Blevins, Formulas for Natural Frequency and Mode Shape, Table 8-1.'],
  },
  {
    id: 'critical-speed', title: 'Shaft Critical Speed (single disc)', disc: 'vibrations', level: 'uni', tags: ['critical speed', 'whirl', 'rotor dynamics', 'shaft'],
    summary: 'First critical speed of a massless shaft carrying a central disc, from the shaft\'s lateral stiffness.',
    inputs: [SEL('sup', 'Supports', [['ss', 'Simply supported, disc at centre'], ['cant', 'Overhung (cantilever), disc at end']], 'ss'), I('L', 'Span', 'L', 'length', 0.8), I('d', 'Shaft diameter', 'd', 'length', 0.04, { u: { si: 'mm' } }), I('E', "Young's modulus", 'E', 'pressure', 205e9, { u: { si: 'GPa' } }), I('m', 'Disc mass', 'm', 'mass', 25), I('n', 'Operating speed', '\\omega', 'angvel', 3000 * 2 * PI / 60)],
    outputs: [O('k', 'Lateral stiffness', 'k', 'stiffness', { u: { si: 'N/mm' } }), O('nc', 'Critical speed', 'n_c', 'angvel', { primary: true, u: { si: 'rpm' } }), O('ratio', 'Operating / critical', 'n/n_c', 'none')],
    compute({ sup, L, d, E, m, n }) { const I = PI * d ** 4 / 64, k = sup === 'ss' ? 48 * E * I / L ** 3 : 3 * E * I / L ** 3, nc = Math.sqrt(k / m), r = n / nc; return { k, nc, ratio: r, _checks: [check('Operating speed away from critical (< 0.7 or > 1.3)', r < 0.7 || r > 1.3, `n/n_c = ${r.toFixed(2)}`)] }; },
    eq: ['\\omega_c = \\sqrt{k/m}', 'k_{ss} = \\frac{48EI}{L^3},\\; k_{cant} = \\frac{3EI}{L^3}'], assume: ['Massless shaft, rigid bearings, disc gyroscopic effects neglected.'], limits: [], refs: ['Shigley §7-6.'],
  },
];
