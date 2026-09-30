import { esc, T } from '../core/format.js';
import { CALC, DISCIPLINES } from '../calcs/index.js';
import { EQ } from '../data/equations.js';
import { LESSON } from '../data/lessons.js';

export const SIMS = {
  projectile: { title: 'Projectile Motion', sec: 'physics', d: 'Launch, drag the angle and speed, compare with and without air drag.' },
  pendulum: { title: 'Pendulum (non-linear, RK4)', sec: 'physics', d: 'Large-amplitude pendulum vs the small-angle approximation, with damping and phase portrait.' },
  'double-slit': { title: 'Double-Slit Interference', sec: 'quantum', d: 'Two-slit interference with single-slit diffraction envelope, and single-photon build-up.' },
  wavefunction: { title: 'Wavefunction Explorer', sec: 'quantum', d: 'Particle in a box and quantum harmonic oscillator: eigenstates, superpositions and time evolution.' },
  minkowski: { title: 'Minkowski Diagram', sec: 'quantum', d: 'Drag events, change the boost and watch simultaneity, time dilation and light cones.' },
  'bh-orbit': { title: 'Orbits Around a Black Hole', sec: 'quantum', d: 'Integrate Schwarzschild geodesics: precession, ISCO, plunge — vs Newtonian orbits.' },
  collisions: { title: 'Collisions & Momentum', sec: 'physics', d: 'Two carts, any masses and restitution — momentum conserved, kinetic energy tracked.' },
  waves: { title: 'Wave Superposition & Standing Waves', sec: 'physics', d: 'Add two travelling waves: standing waves, nodes, beats.' },
  optics: { title: 'Thin Lens Ray Diagram', sec: 'physics', d: 'Drag the object; principal rays, real and virtual images, magnification.' },
  efield: { title: 'Electric Fields & Potential', sec: 'physics', d: 'Drag point charges; field lines and a live potential map.' },
  kepler: { title: 'Kepler Orbits & Equal Areas', sec: 'physics', d: 'Elliptical orbits from Kepler’s equation; equal areas in equal times.' },
  heat: { title: 'Transient Heat Conduction', sec: 'physics', d: '1D rod with real material diffusivities — watch the temperature profile evolve.' },
  tensile: { title: 'Tensile Test', sec: 'physics', d: 'Stress–strain curve, yielding, necking and fracture from database materials.' },
  packet: { title: 'Quantum Tunnelling Wave Packet', sec: 'quantum', d: 'Time-dependent Schrödinger equation (split-step Fourier): a packet hits a barrier.' },
  orbitals: { title: 'Hydrogen Orbitals', sec: 'quantum', d: 'Exact ψ_nlm slices for n ≤ 5 with phase — s, p, d, f, g orbitals.' },
  lightclock: { title: 'Light Clock & Time Dilation', sec: 'quantum', d: 'The same photon clock seen from its rest frame and from the platform.' },
  gwaves: { title: 'Gravitational-Wave Chirp', sec: 'quantum', d: 'Binary inspiral: the frequency and amplitude sweep up to merger.' },
  rlc: { title: 'AC Circuit — RLC Phasors', sec: 'physics', d: 'Series RLC driven by a sine source: rotating phasors, waveforms, phase and the resonance curve.' },
  bfield: { title: 'Magnetic Fields of Currents', sec: 'physics', d: 'Drag current-carrying wires: field lines, |B| map and the force between wires.' },
  flow: { title: 'Flow Past a Cylinder (Magnus Effect)', sec: 'physics', d: 'Potential flow with circulation: streamlines, tracer particles, surface pressure and Kutta–Joukowski lift.' },
  gears: { title: 'Gear Train', sec: 'physics', d: 'Meshing spur gears with idler: speed, torque, direction and efficiency.' },
  'stern-gerlach': { title: 'Stern–Gerlach Experiment', sec: 'quantum', d: 'Spin quantisation atom by atom — classical smear vs two spots, and sequential measurements at any angle.' },
  lensing: { title: 'Gravitational Lensing', sec: 'quantum', d: 'Point-mass lens by inverse ray shooting: arcs, Einstein rings, magnification and microlensing light curves.' },
  accretion: { title: 'Black-Hole Accretion Disk', sec: 'quantum', d: 'Thin-disk temperatures, ISCO vs spin, efficiency, Doppler beaming and gravitational redshift.' },
  doppler: { title: 'Doppler Effect & Mach Cone', sec: 'physics', d: 'Moving source wavefronts: frequency shift ahead and behind, and the shock cone above Mach 1.' },
  universe: { title: 'Expanding Universe', sec: 'quantum', d: 'ΛCDM scale factor, stretching comoving grid and Hubble flow.' },
};
export const SOLVERS = {
  beam: { title: 'Beam Solver', d: 'Any supports (pin, roller, fixed), point loads, distributed/triangular loads and couples. Reactions, SFD, BMD, deflection, stress. Handles indeterminate beams.', live: true },
  truss: { title: 'Truss Solver', d: 'Pin-jointed 2D trusses by the direct stiffness method: member forces (tension/compression), reactions and displacements.', live: true },
  circuit: { title: 'Circuit Solver', d: 'DC and AC (phasor) modified nodal analysis with R, L, C and sources; node voltages, branch currents, power balance and frequency sweep.', live: true },
  'pipe-network': { title: 'Pipe Network Solver', d: 'Reservoirs, junction demands, looped networks and pumps. Darcy–Colebrook friction, nodal Newton solution; flows, heads and pressures.', live: true },
  gear: { title: 'Gear System & Drive Train Solver', d: 'Motor → belts, gears, chains, worms, planetaries → load. Speed, torque, power and minimum shaft size on every shaft.', live: true },
  hx: { title: 'Heat Exchanger Solver', d: 'Rating (ε-NTU) and sizing (LMTD) for counterflow, parallel, shell-and-tube and crossflow exchangers.', live: true, href: '#/calc/entu' },
  cycle: { title: 'Thermodynamic Cycle Solver', d: 'Otto, Diesel, Dual, Brayton, Carnot and Stirling cycles with state tables, P–v and T–s diagrams.', live: true },
  pid: { title: 'PID / Control Solver', d: 'Closed-loop PID simulation, tuning rules, Bode/Nyquist margins and Routh–Hurwitz stability.', live: true, href: '#/calc/pid' },
  vibration: { title: 'Vibration Solver (MDOF)', d: 'Spring–mass chains: natural frequencies, mode shapes and forced frequency response.', live: true },
};

export function toolHref(id) {
  if (id === 'qc') return '#/quantum/circuit';
  if (id === 'practice') return '#/learn/practice';
  if (id === 'api') return '#/reference/api';
  if (['materials', 'constants', 'tables', 'fluids', 'steam', 'refrigerants', 'sections', 'compare', 'standards', 'equations'].includes(id)) return `#/reference/${id}`;
  return `#/tools/${id}`;
}
export function href(kind, id) {
  switch (kind) {
    case 'calc': return `#/calc/${id}`;
    case 'learn': return `#/learn/${id}`;
    case 'sim': return `#/sims/${id}`;
    case 'solver': return SOLVERS[id]?.href || `#/solvers/${id}`;
    case 'eq': return `#/reference/equations/${id}`;
    case 'tool': return toolHref(id);
    case 'material': return `#/reference/materials/${id}`;
    case 'disc': return `#/engineering/${id}`;
  }
  return '#/';
}
export function titleOf(kind, id) {
  switch (kind) {
    case 'calc': return CALC[id]?.title;
    case 'learn': return LESSON[id]?.title;
    case 'sim': return SIMS[id]?.title;
    case 'solver': return SOLVERS[id]?.title;
    case 'eq': return EQ[id]?.name;
  }
  return id;
}

export function crumbs(list) {
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a>${list.map(([t, h]) => `<span class="sep">/</span>${h ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`}`).join('')}</nav>`;
}

export const LEVEL_NAME = { school: 'School', uni: 'University', pro: 'Professional' };
export const levelBadge = lv => `<span class="badge lv-${lv}">${LEVEL_NAME[lv] || lv}</span>`;

export function calcTile(c) {
  const d = DISCIPLINES[c.disc];
  const qr = d?.section === 'quantum';
  return `<a class="tile${qr ? ' qr' : ''}" href="#/calc/${c.id}"><span class="k"><span>${esc(d?.code || '')} · ${esc(d?.name || c.disc)}</span>${levelBadge(c.level)}</span><span class="t">${esc(c.title)}</span><span class="d">${esc(c.summary)}</span><span class="go">Calculate →</span></a>`;
}

export function linkTile(url, kicker, title, desc, go = 'Open →', extra = '') {
  return `<a class="tile ${extra}" href="${url}"><span class="k"><span>${esc(kicker)}</span></span><span class="t">${esc(title)}</span><span class="d">${esc(desc)}</span><span class="go">${esc(go)}</span></a>`;
}

// Render "$..$" / "$$..$$" in lesson/rich text into KaTeX spans (text outside math is trusted HTML from our data).
export function richText(s) {
  return String(s).replace(/\$\$([^$]+)\$\$/g, (_, m) => T(m, true)).replace(/\$([^$]+)\$/g, (_, m) => T(m));
}

export function pageHead(code, title, lede, qr = false) {
  return `<header class="page-head${qr ? ' qr' : ''}"><span class="code">${esc(code)}</span><h1>${esc(title)}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</header>`;
}

// Parse a taxonomy item "Name>kind:id".
export function parseItem(s) {
  const [name, link] = s.split('>');
  if (!link) return { name, url: null };
  const [kind, id] = link.split(':');
  return { name, url: href(kind, id), kind, id };
}

export function taxGroups(groups) {
  return `<div class="tax">${groups.map(g => {
    const items = g.items.map(parseItem);
    const live = items.filter(i => i.url).length;
    return `<div class="grp" id="g-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"><h3>${esc(g.name)} <small>${live}/${items.length} live</small></h3><ul>${items.map(i => i.url ? `<li class="live"><a href="${i.url}">${esc(i.name)}</a></li>` : `<li>${esc(i.name)}</li>`).join('')}</ul></div>`;
  }).join('')}</div>`;
}
