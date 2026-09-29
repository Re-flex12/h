import { I, O, SEL, MAT, PI, g0, sq, deg, rad, check } from './_h.js';
import { C } from '../data/constants.js';

const suvatModes = [
  ['sv', 'Known u, a, t → find s, v'], ['sa', 'Known u, v, t → find s, a'], ['st', 'Known u, v, a → find s, t'],
  ['su', 'Known v, a, t → find s, u'], ['uv', 'Known s, a, t → find u, v'], ['ua', 'Known s, v, t → find u, a'],
  ['ut', 'Known s, v, a → find u, t'], ['va', 'Known s, u, t → find v, a'], ['vt', 'Known s, u, a → find v, t'], ['at', 'Known s, u, v → find a, t'],
];
const known = (v, x) => !v.mode.includes(x);

export default [
  {
    id: 'suvat', title: 'SUVAT — Constant Acceleration', disc: 'mechanics', level: 'school', tags: ['kinematics', 'equations of motion', 'displacement', 'velocity', 'acceleration'],
    summary: 'Solve any two of s, u, v, a, t from the other three for motion with constant acceleration.',
    inputs: [
      SEL('mode', 'Solve for', suvatModes, 'sv'),
      I('s', 'Displacement', 's', 'length', 20, { showIf: v => known(v, 's') }),
      I('u', 'Initial velocity', 'u', 'velocity', 0, { showIf: v => known(v, 'u') }),
      I('v', 'Final velocity', 'v', 'velocity', 10, { showIf: v => known(v, 'v') }),
      I('a', 'Acceleration', 'a', 'accel', 2, { showIf: v => known(v, 'a') }),
      I('t', 'Time', 't', 'time', 5, { showIf: v => known(v, 't') }),
    ],
    outputs: [O('s', 'Displacement', 's', 'length'), O('u', 'Initial velocity', 'u', 'velocity'), O('v', 'Final velocity', 'v', 'velocity'), O('a', 'Acceleration', 'a', 'accel'), O('t', 'Time', 't', 'time')],
    compute(x) {
      let { s, u, v, a, t } = x;
      const w = [];
      switch (x.mode) {
        case 'sv': v = u + a * t; s = u * t + a * t * t / 2; break;
        case 'sa': s = (u + v) * t / 2; a = (v - u) / t; break;
        case 'st': t = (v - u) / a; s = (v * v - u * u) / (2 * a); break;
        case 'su': u = v - a * t; s = v * t - a * t * t / 2; break;
        case 'uv': u = s / t - a * t / 2; v = u + a * t; break;
        case 'ua': u = 2 * s / t - v; a = (v - u) / t; break;
        case 'ut': { const d = v * v - 2 * a * s; if (d < 0) w.push('No real solution: v² − 2as < 0.'); u = Math.sqrt(d); t = (v - u) / a; w.push('Took the positive root for u; u = −√(v² − 2as) is also a solution.'); break; }
        case 'va': a = 2 * (s - u * t) / (t * t); v = u + a * t; break;
        case 'vt': { const d = u * u + 2 * a * s; if (d < 0) w.push('No real solution: u² + 2as < 0 (the object never reaches s).'); v = Math.sqrt(d); t = (v - u) / a; w.push('Took the positive root for v.'); break; }
        case 'at': t = 2 * s / (u + v); a = (v - u) / t; break;
      }
      if (t < 0) w.push('Negative time — check signs/directions of your inputs.');
      return { s, u, v, a, t, _warn: w };
    },
    eq: ['v = u + at', 's = ut + \\tfrac12 at^2', 's = \\tfrac12 (u+v)t', 'v^2 = u^2 + 2as', 's = vt - \\tfrac12 at^2'],
    assume: ['Acceleration is constant throughout the motion.', 'Motion is along a straight line; signs define direction.'],
    limits: ['Not valid for variable acceleration (use calculus / numerical integration).'],
    refs: ['Any introductory mechanics text, e.g. Young & Freedman, University Physics, ch. 2.'],
    related: { learn: 'suvat', sim: 'projectile' },
  },
  {
    id: 'projectile', title: 'Projectile Motion', disc: 'mechanics', level: 'school', tags: ['trajectory', 'range', 'launch angle', 'ballistics'],
    summary: 'Range, peak height, flight time and impact velocity for a projectile launched from a height, without air resistance.',
    inputs: [I('v0', 'Launch speed', 'v_0', 'velocity', 20), I('th', 'Launch angle', '\\theta', 'angle', rad(45)), I('h0', 'Launch height', 'h_0', 'length', 0), I('g', 'Gravitational acceleration', 'g', 'accel', g0, { adv: true })],
    outputs: [O('R', 'Horizontal range', 'R', 'length', { primary: true }), O('H', 'Maximum height', 'H', 'length'), O('T', 'Time of flight', 'T', 'time'), O('tH', 'Time to apex', 't_H', 'time'), O('vi', 'Impact speed', 'v_i', 'velocity'), O('ai', 'Impact angle (below horizontal)', '\\phi', 'angle')],
    compute({ v0, th, h0, g }) {
      const vx = v0 * Math.cos(th), vy = v0 * Math.sin(th);
      const T = (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g;
      const vyf = vy - g * T;
      const xs = [], ys = [];
      for (let i = 0; i <= 80; i++) { const t = T * i / 80; xs.push(vx * t); ys.push(h0 + vy * t - g * t * t / 2); }
      return {
        R: vx * T, H: h0 + Math.max(0, vy) ** 2 / (2 * g), T, tH: Math.max(0, vy / g), vi: Math.hypot(vx, vyf), ai: Math.atan2(-vyf, vx),
        _plot: { series: [{ x: xs, y: ys, label: 'trajectory' }], opts: { xlabel: 'x (m)', ylabel: 'y (m)', zero: true } },
      };
    },
    eq: ['x = v_0\\cos\\theta\\, t', 'y = h_0 + v_0\\sin\\theta\\, t - \\tfrac12 g t^2', 'T = \\frac{v_0\\sin\\theta + \\sqrt{v_0^2\\sin^2\\theta + 2gh_0}}{g}', 'H = h_0 + \\frac{v_0^2\\sin^2\\theta}{2g}'],
    assume: ['No air resistance.', 'Uniform gravitational field; flat ground at y = 0.', 'Point mass (no spin/lift).'],
    limits: ['Air drag significantly shortens range for light/fast projectiles (Re-dependent drag).'],
    refs: ['Young & Freedman, University Physics, §3.3.'],
    related: { sim: 'projectile', learn: 'suvat' },
  },
  {
    id: 'collision', title: '1D Collision (coefficient of restitution)', disc: 'mechanics', level: 'school', tags: ['momentum', 'impulse', 'elastic', 'inelastic', 'restitution'],
    summary: 'Final velocities and kinetic energy loss for a head-on collision of two bodies.',
    inputs: [I('m1', 'Mass 1', 'm_1', 'mass', 2), I('u1', 'Velocity 1 (before)', 'u_1', 'velocity', 3), I('m2', 'Mass 2', 'm_2', 'mass', 1), I('u2', 'Velocity 2 (before)', 'u_2', 'velocity', -1),
      I('e', 'Coefficient of restitution', 'e', 'none', 1, { hint: '1 = perfectly elastic, 0 = perfectly inelastic (stick together)', min: 0, max: 1 })],
    outputs: [O('v1', 'Velocity 1 (after)', 'v_1', 'velocity', { primary: true }), O('v2', 'Velocity 2 (after)', 'v_2', 'velocity'), O('p', 'Total momentum', 'p', 'momentum'), O('KE0', 'Kinetic energy before', 'E_{k0}', 'energy'), O('KE1', 'Kinetic energy after', 'E_{k1}', 'energy'), O('dKE', 'Energy lost', '\\Delta E_k', 'energy'), O('J', 'Impulse on body 2', 'J', 'momentum')],
    compute({ m1, u1, m2, u2, e }) {
      const M = m1 + m2, p = m1 * u1 + m2 * u2;
      const v1 = (p - m2 * e * (u1 - u2)) / M, v2 = (p + m1 * e * (u1 - u2)) / M;
      const KE0 = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2, KE1 = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
      return { v1, v2, p, KE0, KE1, dKE: KE0 - KE1, J: m2 * (v2 - u2) };
    },
    eq: ['m_1u_1 + m_2u_2 = m_1v_1 + m_2v_2', 'e = \\frac{v_2 - v_1}{u_1 - u_2}'],
    assume: ['Collision is head-on (1D) and instantaneous.', 'No external impulse during the collision.'],
    limits: ['Oblique collisions need 2D momentum treatment.'], refs: ['Meriam & Kraige, Engineering Mechanics: Dynamics, §3/12.'],
    related: { learn: 'momentum' },
  },
  {
    id: 'circular', title: 'Circular Motion', disc: 'mechanics', level: 'school', tags: ['centripetal force', 'centripetal acceleration', 'angular velocity'],
    summary: 'Centripetal acceleration and force, angular velocity and period for uniform circular motion.',
    inputs: [I('m', 'Mass', 'm', 'mass', 1), I('v', 'Speed', 'v', 'velocity', 10), I('r', 'Radius', 'r', 'length', 5)],
    outputs: [O('F', 'Centripetal force', 'F_c', 'force', { primary: true }), O('a', 'Centripetal acceleration', 'a_c', 'accel'), O('w', 'Angular velocity', '\\omega', 'angvel'), O('T', 'Period', 'T', 'time'), O('ag', 'Acceleration in g', 'a_c/g', 'none')],
    compute({ m, v, r }) { const a = v * v / r; return { a, F: m * a, w: v / r, T: 2 * PI * r / v, ag: a / g0 }; },
    eq: ['a_c = \\frac{v^2}{r} = \\omega^2 r', 'F_c = \\frac{mv^2}{r}', 'T = \\frac{2\\pi r}{v}'],
    assume: ['Uniform (constant-speed) circular motion.'], limits: [], refs: ['Young & Freedman §5.4.'],
  },
  {
    id: 'orbit', title: 'Circular Orbit & Escape Velocity', disc: 'mechanics', level: 'school', tags: ['gravitation', 'satellite', 'orbital period', 'escape velocity', 'kepler'],
    summary: 'Orbital speed, period and local gravity for a circular orbit around a planet or star.',
    inputs: [
      SEL('body', 'Central body', [['earth', 'Earth'], ['moon', 'Moon'], ['mars', 'Mars'], ['sun', 'Sun'], ['custom', 'Custom']], 'earth'),
      I('M', 'Central mass', 'M', 'mass', C.Mearth, { showIf: v => v.body === 'custom' }),
      I('R', 'Body radius', 'R', 'length', C.Rearth, { showIf: v => v.body === 'custom', u: { si: 'km' } }),
      I('h', 'Altitude above surface', 'h', 'length', 400e3, { u: { si: 'km', imperial: 'mi' } }),
    ],
    outputs: [O('v', 'Orbital speed', 'v', 'velocity', { primary: true, u: { si: 'km/s' } }), O('T', 'Orbital period', 'T', 'time', { u: { si: 'min' } }), O('ve', 'Escape velocity at this radius', 'v_{esc}', 'velocity', { u: { si: 'km/s' } }), O('g', 'Gravitational field strength', 'g', 'accel'), O('r', 'Orbit radius', 'r', 'length', { u: { si: 'km' } })],
    compute(x) {
      const B = { earth: [5.9722e24, 6.371e6], moon: [7.342e22, 1.7374e6], mars: [6.4171e23, 3.3895e6], sun: [C.Msun, C.Rsun] };
      const [M, R] = x.body === 'custom' ? [x.M, x.R] : B[x.body];
      const r = R + x.h, GM = C.G * M;
      return { r, v: Math.sqrt(GM / r), T: 2 * PI * Math.sqrt(r ** 3 / GM), ve: Math.sqrt(2 * GM / r), g: GM / (r * r) };
    },
    eq: ['v = \\sqrt{\\frac{GM}{r}}', 'T = 2\\pi\\sqrt{\\frac{r^3}{GM}}', 'v_{esc} = \\sqrt{\\frac{2GM}{r}}', 'g = \\frac{GM}{r^2}'],
    assume: ['Spherically symmetric central body; satellite mass ≪ M.', 'Circular orbit; no drag.'], limits: ['Mean radii used for presets.'],
    refs: ['CODATA 2018 G; IAU 2015 nominal values; NASA planetary fact sheets for masses/radii.'], related: { sim: 'bh-orbit' },
  },
  {
    id: 'shm-spring', title: 'Spring–Mass Oscillator (SHM)', disc: 'mechanics', level: 'school', tags: ['simple harmonic motion', 'natural frequency', 'vibration', 'damping'],
    summary: 'Natural frequency, period, peak velocity/acceleration and energy of a spring–mass system, with optional damping.',
    inputs: [I('m', 'Mass', 'm', 'mass', 0.5), I('k', 'Spring stiffness', 'k', 'stiffness', 200), I('A', 'Amplitude', 'A', 'length', 0.05, { u: { si: 'mm' } }), I('z', 'Damping ratio', '\\zeta', 'none', 0, { adv: true, min: 0 })],
    outputs: [O('fn', 'Natural frequency', 'f_n', 'frequency', { primary: true }), O('wn', 'Angular natural frequency', '\\omega_n', 'angvel'), O('T', 'Period', 'T', 'time'), O('vmax', 'Maximum velocity', 'v_{max}', 'velocity'), O('amax', 'Maximum acceleration', 'a_{max}', 'accel'), O('E', 'Total energy', 'E', 'energy'), O('fd', 'Damped natural frequency', 'f_d', 'frequency'), O('c', 'Damping coefficient', 'c', 'none', { note: 'N·s/m' })],
    compute({ m, k, A, z }) {
      const wn = Math.sqrt(k / m), fn = wn / (2 * PI);
      const w = [];
      if (z >= 1) w.push('ζ ≥ 1: system is critically/over-damped and does not oscillate.');
      const wd = z < 1 ? wn * Math.sqrt(1 - z * z) : 0;
      const ts = [], xs = [];
      const T = 1 / fn;
      for (let i = 0; i <= 300; i++) { const t = 4 * T * i / 300; ts.push(t); xs.push(z < 1 ? A * Math.exp(-z * wn * t) * Math.cos(wd * t) : A * Math.exp(-wn * t) * (1 + wn * t)); }
      return { wn, fn, T, vmax: A * wn, amax: A * wn * wn, E: 0.5 * k * A * A, fd: wd / (2 * PI), c: 2 * z * Math.sqrt(k * m), _warn: w,
        _plot: { series: [{ x: ts, y: xs.map(x => x * 1e3), label: 'x(t), released from rest at A' }], opts: { xlabel: 't (s)', ylabel: 'x (mm)' } } };
    },
    eq: ['\\omega_n = \\sqrt{k/m}', 'f_n = \\frac{1}{2\\pi}\\sqrt{\\frac{k}{m}}', 'v_{max} = A\\omega_n,\\quad a_{max} = A\\omega_n^2', 'E = \\tfrac12 kA^2', '\\omega_d = \\omega_n\\sqrt{1-\\zeta^2}'],
    assume: ['Linear spring, massless.', 'Viscous damping (force ∝ velocity).'], limits: ['Large amplitudes may make the spring non-linear.'],
    refs: ['Rao, Mechanical Vibrations, ch. 2.'], related: { sim: 'pendulum' },
  },
  {
    id: 'pendulum', title: 'Simple Pendulum (exact period)', disc: 'mechanics', level: 'school', tags: ['pendulum', 'shm', 'period', 'large amplitude'],
    summary: 'Pendulum period with the small-angle approximation and the exact large-amplitude result.',
    inputs: [I('L', 'Length', 'L', 'length', 1), I('th', 'Release angle', '\\theta_0', 'angle', rad(20)), I('g', 'Gravitational acceleration', 'g', 'accel', g0, { adv: true })],
    outputs: [O('T0', 'Period (small-angle)', 'T_0', 'time'), O('T', 'Period (exact)', 'T', 'time', { primary: true }), O('err', 'Small-angle error', '\\varepsilon', 'none', { u: { si: '%' } }), O('vmax', 'Speed at bottom', 'v_{max}', 'velocity')],
    compute({ L, th, g }) {
      const T0 = 2 * PI * Math.sqrt(L / g);
      let a = 1, b = Math.cos(th / 2);
      for (let i = 0; i < 30; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; }
      const T = T0 / a;
      return { T0, T, err: (T - T0) / T, vmax: Math.sqrt(2 * g * L * (1 - Math.cos(th))) };
    },
    eq: ['T_0 = 2\\pi\\sqrt{L/g}', 'T = \\frac{T_0}{\\operatorname{AGM}\\!\\left(1, \\cos\\frac{\\theta_0}{2}\\right)}'],
    assume: ['Point mass on a massless, inextensible string.', 'No friction or air resistance.'], limits: ['θ₀ < 180°.'],
    refs: ['Carvalhaes & Suppes, Am. J. Phys. 76, 1150 (2008) — AGM formula for the exact pendulum period.'], related: { sim: 'pendulum' },
  },
  {
    id: 'inertia', title: 'Mass Moment of Inertia', disc: 'mechanics', level: 'uni', tags: ['rotational inertia', 'radius of gyration', 'flywheel'],
    summary: 'Moment of inertia of standard solid shapes about common axes.',
    inputs: [
      SEL('shape', 'Shape / axis', [['disc', 'Solid cylinder/disc — central axis'], ['ring', 'Thick-walled tube — central axis'], ['sphere', 'Solid sphere — diameter'], ['shell', 'Thin spherical shell'], ['rodc', 'Slender rod — about centre'], ['rode', 'Slender rod — about end'], ['plate', 'Rectangular plate — axis ⟂ through centre']], 'disc'),
      I('m', 'Mass', 'm', 'mass', 10),
      I('r', 'Outer radius', 'r_o', 'length', 0.2, { u: { si: 'mm' }, showIf: v => ['disc', 'ring', 'sphere', 'shell'].includes(v.shape) }),
      I('ri', 'Inner radius', 'r_i', 'length', 0.1, { u: { si: 'mm' }, showIf: v => v.shape === 'ring' }),
      I('L', 'Length', 'L', 'length', 1, { showIf: v => ['rodc', 'rode'].includes(v.shape) }),
      I('a', 'Side a', 'a', 'length', 0.3, { showIf: v => v.shape === 'plate' }), I('b', 'Side b', 'b', 'length', 0.2, { showIf: v => v.shape === 'plate' }),
    ],
    outputs: [O('J', 'Moment of inertia', 'I', 'inertia', { primary: true }), O('k', 'Radius of gyration', 'k', 'length', { u: { si: 'mm' } })],
    compute(x) {
      const f = { disc: () => x.m * x.r ** 2 / 2, ring: () => x.m * (x.r ** 2 + x.ri ** 2) / 2, sphere: () => 0.4 * x.m * x.r ** 2, shell: () => 2 / 3 * x.m * x.r ** 2, rodc: () => x.m * x.L ** 2 / 12, rode: () => x.m * x.L ** 2 / 3, plate: () => x.m * (x.a ** 2 + x.b ** 2) / 12 }[x.shape];
      const J = f();
      return { J, k: Math.sqrt(J / x.m) };
    },
    eq: ['I_{disc} = \\tfrac12 mr^2', 'I_{tube} = \\tfrac12 m(r_o^2 + r_i^2)', 'I_{sphere} = \\tfrac25 mr^2', 'I_{rod,c} = \\tfrac1{12}mL^2', 'I_{rod,e} = \\tfrac13 mL^2', 'k = \\sqrt{I/m}'],
    assume: ['Homogeneous material.'], limits: ['Use parallel-axis theorem I = I_G + md² for offset axes.'], refs: ['Meriam & Kraige, Dynamics, Appendix B.'],
  },
  {
    id: 'flywheel', title: 'Flywheel Energy', disc: 'mechanical', level: 'uni', tags: ['rotational kinetic energy', 'energy storage', 'rpm'],
    summary: 'Kinetic energy stored in a flywheel and energy released between two speeds.',
    inputs: [
      SEL('shape', 'Rotor', [['disc', 'Solid disc'], ['rim', 'Thin rim'], ['custom', 'Known inertia']], 'disc'),
      I('m', 'Mass', 'm', 'mass', 50, { showIf: v => v.shape !== 'custom' }), I('r', 'Radius', 'r', 'length', 0.25, { u: { si: 'mm' }, showIf: v => v.shape !== 'custom' }),
      I('J', 'Moment of inertia', 'I', 'inertia', 1.5, { showIf: v => v.shape === 'custom' }),
      I('n1', 'Maximum speed', '\\omega_1', 'angvel', 3000 * 2 * PI / 60), I('n2', 'Minimum speed', '\\omega_2', 'angvel', 2500 * 2 * PI / 60),
    ],
    outputs: [O('E1', 'Energy at max speed', 'E_1', 'energy', { u: { si: 'kJ' } }), O('dE', 'Energy released ω₁ → ω₂', '\\Delta E', 'energy', { primary: true, u: { si: 'kJ' } }), O('Cs', 'Coefficient of speed fluctuation', 'C_s', 'none'), O('vt', 'Rim speed at max', 'v_t', 'velocity'), O('Jo', 'Moment of inertia', 'I', 'inertia')],
    compute(x) {
      const J = x.shape === 'custom' ? x.J : x.shape === 'disc' ? x.m * x.r ** 2 / 2 : x.m * x.r ** 2;
      const w = [];
      const vt = x.shape === 'custom' ? NaN : x.n1 * x.r;
      if (vt > 200) w.push('Rim speed above ~200 m/s — check burst stress (σ ≈ ρv² for a thin rim).');
      return { Jo: J, E1: 0.5 * J * x.n1 ** 2, dE: 0.5 * J * (x.n1 ** 2 - x.n2 ** 2), Cs: 2 * (x.n1 - x.n2) / (x.n1 + x.n2), vt, _warn: w };
    },
    eq: ['E = \\tfrac12 I\\omega^2', '\\Delta E = \\tfrac12 I(\\omega_1^2 - \\omega_2^2)', 'C_s = \\frac{\\omega_1 - \\omega_2}{\\bar\\omega}'],
    assume: ['Rigid rotor.'], limits: ['Does not check rotor stresses.'], refs: ['Shigley, Mechanical Engineering Design, §16-12.'],
  },
  {
    id: 'power-torque', title: 'Power – Torque – Speed', disc: 'mechanical', level: 'school', tags: ['shaft power', 'rpm', 'horsepower', 'kw'],
    summary: 'Convert between shaft torque, rotational speed and power.',
    inputs: [SEL('mode', 'Find', [['P', 'Power from torque & speed'], ['T', 'Torque from power & speed'], ['n', 'Speed from power & torque']], 'P'),
      I('T', 'Torque', 'T', 'torque', 100, { showIf: v => v.mode !== 'T' }), I('n', 'Speed', '\\omega', 'angvel', 1500 * 2 * PI / 60, { showIf: v => v.mode !== 'n' }), I('P', 'Power', 'P', 'power', 15000, { showIf: v => v.mode !== 'P' })],
    outputs: [O('P', 'Power', 'P', 'power', { u: { si: 'kW' } }), O('T', 'Torque', 'T', 'torque'), O('n', 'Speed', '\\omega', 'angvel', { u: { si: 'rpm' } }), O('hp', 'Power', 'P', 'power', { u: { si: 'hp', metric: 'hp' } })],
    compute(x) {
      let { T, n, P } = x;
      if (x.mode === 'P') P = T * n; else if (x.mode === 'T') T = P / n; else n = P / T;
      return { P, T, n, hp: P };
    },
    eq: ['P = T\\omega = \\frac{2\\pi n T}{60}'], assume: ['Steady rotation.'], limits: [], refs: ['Definition of power.'],
  },
  {
    id: 'gear-train', title: 'Gear Train (2-stage)', disc: 'mechanical', level: 'uni', tags: ['gear ratio', 'gearbox', 'reduction', 'torque multiplication'],
    summary: 'Overall ratio, output speed, torque and power through a compound gear train with mesh losses.',
    inputs: [I('N1', 'Stage 1 driver teeth', 'N_1', 'none', 17), I('N2', 'Stage 1 driven teeth', 'N_2', 'none', 51), I('N3', 'Stage 2 driver teeth', 'N_3', 'none', 19, { hint: 'Set N3 = N4 = 1 for a single stage.' }), I('N4', 'Stage 2 driven teeth', 'N_4', 'none', 57),
      I('nin', 'Input speed', '\\omega_{in}', 'angvel', 1450 * 2 * PI / 60), I('Tin', 'Input torque', 'T_{in}', 'torque', 50), I('eta', 'Efficiency per mesh', '\\eta', 'none', 0.98, { adv: true })],
    outputs: [O('i', 'Overall ratio', 'i', 'none', { primary: true }), O('nout', 'Output speed', '\\omega_{out}', 'angvel', { u: { si: 'rpm' } }), O('Tout', 'Output torque', 'T_{out}', 'torque'), O('Pin', 'Input power', 'P_{in}', 'power', { u: { si: 'kW' } }), O('Pout', 'Output power', 'P_{out}', 'power', { u: { si: 'kW' } }), O('etat', 'Overall efficiency', '\\eta_{tot}', 'none', { u: { si: '%' } })],
    compute({ N1, N2, N3, N4, nin, Tin, eta }) {
      const stages = (N3 === N4 && N3 === 1) ? 1 : 2;
      const i = (N2 / N1) * (N4 / N3), etat = Math.pow(eta, stages);
      const w = [];
      [N1, N3].forEach(n => { if (n < 17 && n > 1) w.push(`Pinion with ${n} teeth: risk of undercut for 20° full-depth involute teeth (min ≈ 17).`); });
      return { i, nout: nin / i, Tout: Tin * i * etat, Pin: Tin * nin, Pout: Tin * nin * etat, etat, _warn: w };
    },
    eq: ['i = \\frac{N_2}{N_1}\\cdot\\frac{N_4}{N_3}', '\\omega_{out} = \\omega_{in}/i', 'T_{out} = T_{in}\\, i\\, \\eta^{k}'],
    assume: ['Spur/helical gears in simple compound arrangement.', 'Constant mesh efficiency.'], limits: ['Does not check tooth bending/contact stress (AGMA 2001 / ISO 6336).'],
    refs: ['Shigley §13-12; AGMA 2001-D04; ISO 6336.'],
  },
  {
    id: 'belt-drive', title: 'Belt Drive Geometry', disc: 'mechanical', level: 'uni', tags: ['pulley', 'v-belt', 'belt length', 'wrap angle'],
    summary: 'Speed ratio, open-belt length, wrap angle and belt speed for a two-pulley drive.',
    inputs: [I('D1', 'Driver pulley diameter', 'D_1', 'length', 0.1, { u: { si: 'mm' } }), I('D2', 'Driven pulley diameter', 'D_2', 'length', 0.25, { u: { si: 'mm' } }), I('Cd', 'Centre distance', 'C', 'length', 0.5, { u: { si: 'mm' } }), I('n1', 'Driver speed', '\\omega_1', 'angvel', 1450 * 2 * PI / 60)],
    outputs: [O('i', 'Speed ratio', 'i', 'none', { primary: true }), O('n2', 'Driven speed', '\\omega_2', 'angvel', { u: { si: 'rpm' } }), O('L', 'Belt pitch length', 'L', 'length', { u: { si: 'mm' } }), O('th', 'Wrap on small pulley', '\\theta', 'angle'), O('v', 'Belt speed', 'v', 'velocity')],
    compute({ D1, D2, Cd, n1 }) {
      const d = Math.min(D1, D2), D = Math.max(D1, D2);
      const L = 2 * Cd + PI * (D1 + D2) / 2 + (D - d) ** 2 / (4 * Cd);
      const th = PI - 2 * Math.asin((D - d) / (2 * Cd));
      const w = [];
      if (th < rad(120)) w.push('Wrap angle below 120° — risk of slip; increase centre distance or add an idler.');
      return { i: D2 / D1, n2: n1 * D1 / D2, L, th, v: n1 * D1 / 2, _warn: w };
    },
    eq: ['i = D_2/D_1', 'L \\approx 2C + \\frac{\\pi}{2}(D_1+D_2) + \\frac{(D_2-D_1)^2}{4C}', '\\theta = \\pi - 2\\sin^{-1}\\frac{D-d}{2C}'],
    assume: ['No slip.', 'Open (uncrossed) belt.'], limits: ['Approximate length formula; use manufacturer tables for standard belt lengths.'], refs: ['Shigley §17-2.'],
  },
  {
    id: 'bearing-life', title: 'Rolling Bearing Life (L10)', disc: 'mechanical', level: 'pro', tags: ['ball bearing', 'roller bearing', 'l10', 'iso 281', 'dynamic load rating'],
    summary: 'Basic rating life of a rolling bearing from its dynamic load rating and equivalent load.',
    inputs: [I('Cr', 'Basic dynamic load rating', 'C', 'force', 14e3, { u: { si: 'kN' } }), I('P', 'Equivalent dynamic load', 'P', 'force', 2e3, { u: { si: 'kN' } }),
      SEL('type', 'Bearing type', [['3', 'Ball bearing (p = 3)'], ['3.333333', 'Roller bearing (p = 10/3)']], '3'), I('n', 'Speed', 'n', 'angvel', 1500 * 2 * PI / 60),
      SEL('rel', 'Reliability', [['1', '90 % (a₁ = 1)'], ['0.64', '95 % (a₁ = 0.64)'], ['0.55', '96 %'], ['0.47', '97 %'], ['0.37', '98 %'], ['0.25', '99 % (a₁ = 0.25)']], '1', { adv: true })],
    outputs: [O('L10', 'Rating life', 'L_{10}', 'none', { note: '×10⁶ revolutions' }), O('L10h', 'Rating life in hours', 'L_{10h}', 'time', { primary: true, u: { si: 'h' } }), O('Lnh', 'Adjusted life (reliability)', 'L_{nm,h}', 'time', { u: { si: 'h' } }), O('CP', 'Load ratio', 'C/P', 'none')],
    compute({ Cr, P, type, n, rel }) {
      const p = parseFloat(type), L10 = Math.pow(Cr / P, p), rev = n / (2 * PI);
      return { L10, L10h: L10 * 1e6 / rev, Lnh: parseFloat(rel) * L10 * 1e6 / rev, CP: Cr / P };
    },
    eq: ['L_{10} = \\left(\\frac{C}{P}\\right)^p \\;[10^6\\text{ rev}]', 'L_{10h} = \\frac{10^6}{60 n} L_{10}', 'L_{nm} = a_1 L_{10}'],
    assume: ['P already includes radial/axial combination (P = XF_r + YF_a).', 'Conventional operating conditions, adequate lubrication.'],
    limits: ['Does not include a_ISO (lubrication/contamination) modification factor per ISO 281:2007.'], refs: ['ISO 281:2007 Rolling bearings — Dynamic load ratings and rating life.', 'Bearing manufacturer catalogues (C values).'],
  },
  {
    id: 'bolt', title: 'Bolt Preload & Tightening Torque (ISO metric)', disc: 'mechanical', level: 'pro', tags: ['fastener', 'preload', 'torque', 'property class', 'iso 898', 'tensile stress area'],
    summary: 'Tensile stress area, proof load, recommended preload and tightening torque for ISO metric coarse bolts.',
    inputs: [
      SEL('size', 'Thread (ISO coarse)', [['3,0.5', 'M3 × 0.5'], ['4,0.7', 'M4 × 0.7'], ['5,0.8', 'M5 × 0.8'], ['6,1', 'M6 × 1'], ['8,1.25', 'M8 × 1.25'], ['10,1.5', 'M10 × 1.5'], ['12,1.75', 'M12 × 1.75'], ['16,2', 'M16 × 2'], ['20,2.5', 'M20 × 2.5'], ['24,3', 'M24 × 3'], ['30,3.5', 'M30 × 3.5'], ['36,4', 'M36 × 4']], '10,1.5'),
      SEL('cls', 'Property class', [['4.6', '4.6'], ['5.8', '5.8'], ['8.8', '8.8'], ['10.9', '10.9'], ['12.9', '12.9']], '8.8'),
      I('fr', 'Preload as fraction of proof load', 'F_i/F_p', 'none', 0.75, { hint: '0.75 reusable joints; 0.90 permanent (Shigley).' }),
      I('K', 'Nut (torque) factor', 'K', 'none', 0.2, { hint: '≈0.2 as-received steel, ≈0.15 lubricated, ≈0.3 dry/plated variability', adv: true }),
    ],
    outputs: [O('As', 'Tensile stress area', 'A_s', 'area', { u: { si: 'mm²' } }), O('Sp', 'Proof strength', 'S_p', 'pressure', { u: { si: 'MPa' } }), O('Fp', 'Proof load', 'F_p', 'force', { u: { si: 'kN' } }), O('Fi', 'Recommended preload', 'F_i', 'force', { primary: true, u: { si: 'kN' } }), O('T', 'Tightening torque', 'T', 'torque'), O('Sy', 'Yield strength (min)', 'S_y', 'pressure', { u: { si: 'MPa' } })],
    compute({ size, cls, fr, K }) {
      const [d, P] = size.split(',').map(Number);
      const As = PI / 4 * (d - 0.9382 * P) ** 2 * 1e-6;
      const tab = { '4.6': [225, 240, 400], '5.8': [380, 420, 520], '8.8': [d <= 16 ? 580 : 600, d <= 16 ? 640 : 660, d <= 16 ? 800 : 830], '10.9': [830, 940, 1040], '12.9': [970, 1100, 1220] };
      const [Sp, Sy, Su] = tab[cls].map(s => s * 1e6);
      const Fp = Sp * As, Fi = fr * Fp;
      return { As, Sp, Sy, Fp, Fi, T: K * Fi * d * 1e-3, _info: [`Minimum tensile strength S_u = ${Su / 1e6} MPa.`] };
    },
    eq: ['A_s = \\frac{\\pi}{4}(d - 0.9382P)^2', 'F_p = S_p A_s', 'F_i = 0.75F_p', 'T = K F_i d'],
    assume: ['Nominal diameter d and pitch P per ISO 261/262.', 'Proof/yield/ultimate minima per ISO 898-1 for the property class.'],
    limits: ['Torque–preload scatter is typically ±25 % or more — use controlled methods (angle, stretch, DTI) for critical joints.', 'Does not compute joint stiffness or load factor (VDI 2230).'],
    refs: ['ISO 898-1:2013 Mechanical properties of fasteners.', 'Shigley §8-7, §8-8.', 'VDI 2230 Part 1 (systematic bolted joint design).'],
  },
  {
    id: 'spring', title: 'Helical Compression Spring', disc: 'mechanical', level: 'uni', tags: ['spring rate', 'wahl factor', 'coil spring'],
    summary: 'Spring rate, index, Wahl-corrected shear stress and deflection of a helical compression spring.',
    inputs: [I('d', 'Wire diameter', 'd', 'length', 2e-3, { u: { si: 'mm', imperial: 'in' } }), I('D', 'Mean coil diameter', 'D', 'length', 16e-3, { u: { si: 'mm', imperial: 'in' } }), I('Na', 'Active coils', 'N_a', 'none', 8),
      I('G', 'Shear modulus', 'G', 'pressure', 79.3e9, { u: { si: 'GPa', imperial: 'Msi' }, hint: 'Music wire 81.7, oil-tempered 77.2, 302 SS 69.0 GPa' }), I('F', 'Applied force', 'F', 'force', 50),
      I('Ssy', 'Allowable torsional yield', 'S_{sy}', 'pressure', 0.45 * 1900e6, { u: { si: 'MPa' }, adv: true, hint: '≈0.45 S_ut for music wire (set not removed)' })],
    outputs: [O('k', 'Spring rate', 'k', 'stiffness', { primary: true, u: { si: 'N/mm' } }), O('C', 'Spring index', 'C', 'none'), O('Kw', 'Wahl factor', 'K_W', 'none'), O('tau', 'Max shear stress', '\\tau', 'pressure', { u: { si: 'MPa' } }), O('y', 'Deflection', 'y', 'length', { u: { si: 'mm' } }), O('n', 'Safety factor vs S_sy', 'n', 'none')],
    compute({ d, D, Na, G, F, Ssy }) {
      const C = D / d, k = G * d ** 4 / (8 * D ** 3 * Na), Kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C, tau = Kw * 8 * F * D / (PI * d ** 3);
      const w = [];
      if (C < 4 || C > 12) w.push(`Spring index C = ${C.toFixed(1)} outside the preferred 4–12 range (manufacturability).`);
      return { k, C, Kw, tau, y: F / k, n: Ssy / tau, _warn: w, _checks: [{ label: 'Stress below allowable', pass: tau < Ssy, detail: `n = ${(Ssy / tau).toFixed(2)}` }] };
    },
    eq: ['k = \\frac{G d^4}{8 D^3 N_a}', 'C = D/d', 'K_W = \\frac{4C-1}{4C-4} + \\frac{0.615}{C}', '\\tau = K_W\\frac{8FD}{\\pi d^3}'],
    assume: ['Round wire, closed & ground ends.', 'Static loading.'], limits: ['Check buckling for free length / D > 4 and fatigue for cyclic loading.'], refs: ['Shigley ch. 10; SMI Handbook of Spring Design.'],
  },
];
