import test from 'node:test';
import assert from 'node:assert/strict';
import { solveBeam } from '../assets/js/solvers/beam-core.js';
import { solveTruss } from '../assets/js/solvers/truss-core.js';

const E = 210e9, I = 8.36e-6, L = 4, P = 10e3, w = 5e3, EI = E * I;
const close = (a, b, tol = 1e-6, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} got ${a}, want ${b}`);
const pin = x => ({ x, type: 'pin' }), roller = x => ({ x, type: 'roller' }), fixed = x => ({ x, type: 'fixed' });

test('simply supported, centre point load', () => {
  const r = solveBeam({ L, E, I, supports: [pin(0), roller(L)], loads: [{ type: 'point', x: 2, P }] });
  close(r.reactions[0].R, P / 2); close(r.reactions[1].R, P / 2);
  close(r.maxM.v, P * L / 4); close(-r.maxDefl.v, P * L ** 3 / (48 * EI), 1e-4, 'δ');
});
test('simply supported, UDL', () => {
  const r = solveBeam({ L, E, I, supports: [pin(0), roller(L)], loads: [{ type: 'udl', x1: 0, x2: L, w1: w, w2: w }] });
  close(r.maxM.v, w * L * L / 8); close(-r.maxDefl.v, 5 * w * L ** 4 / (384 * EI), 1e-4, 'δ');
});
test('cantilever, end load', () => {
  const r = solveBeam({ L, E, I, supports: [fixed(0)], loads: [{ type: 'point', x: L, P }] });
  close(r.reactions[0].R, P); close(r.reactions[0].M, -P * L); close(-r.maxDefl.v, P * L ** 3 / (3 * EI), 1e-4, 'δ');
});
test('fixed–fixed UDL (indeterminate)', () => {
  const r = solveBeam({ L, E, I, supports: [fixed(0), fixed(L)], loads: [{ type: 'udl', x1: 0, x2: L, w1: w, w2: w }] });
  close(Math.abs(r.reactions[0].M), w * L * L / 12); close(-r.maxDefl.v, w * L ** 4 / (384 * EI), 1e-4, 'δ');
});
test('propped cantilever UDL (indeterminate)', () => {
  const r = solveBeam({ L, E, I, supports: [fixed(0), roller(L)], loads: [{ type: 'udl', x1: 0, x2: L, w1: w, w2: w }] });
  close(r.reactions[0].R, 5 * w * L / 8); close(r.reactions[1].R, 3 * w * L / 8);
});
test('two-span continuous beam', () => {
  const r = solveBeam({ L, E, I, supports: [pin(0), roller(2), roller(4)], loads: [{ type: 'udl', x1: 0, x2: L, w1: w, w2: w }] });
  close(r.reactions[1].R, 1.25 * w * 2); close(r.reactions[0].R, 0.375 * w * 2);
});
test('triangular load reactions and peak moment', () => {
  const r = solveBeam({ L, E, I, supports: [pin(0), roller(L)], loads: [{ type: 'udl', x1: 0, x2: L, w1: 0, w2: w }] });
  close(r.reactions[0].R, w * L / 6); close(r.reactions[1].R, w * L / 3);
  close(r.maxM.v, w * L * L / (9 * Math.sqrt(3)), 1e-4, 'M');
});
test('mechanism is reported', () => {
  const r = solveBeam({ L, E, I, supports: [pin(0)], loads: [{ type: 'point', x: 2, P }] });
  assert.ok(r.error);
});
test('truss: symmetric triangle under apex load', () => {
  const r = solveTruss({ nodes: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 2, y: 3 }], members: [{ i: 0, j: 1 }, { i: 0, j: 2 }, { i: 1, j: 2 }], supports: [{ node: 0, type: 'pin' }, { node: 1, type: 'rollerY' }], loads: [{ node: 2, Fx: 0, Fy: -10e3 }], E: 200e9, A: 1e-3 });
  const diag = -5e3 * Math.sqrt(13) / 3;
  close(r.forces[1].N, diag); close(r.forces[2].N, diag); close(r.forces[0].N, -diag * 2 / Math.sqrt(13));
  assert.equal(r.determinacy, 'Statically determinate');
});

import { solveCircuit, solvePipeNetwork, solveCycle, chainMatrices, modal, solveDrive } from '../assets/js/solvers/cores2.js';
const mag = c => Math.hypot(c[0], c[1]);
test('circuit: DC divider and power balance', () => {
  const r = solveCircuit([{ type: 'V', a: 1, b: 0, value: 10 }, { type: 'R', a: 1, b: 2, value: 1000 }, { type: 'R', a: 2, b: 0, value: 1000 }], 0);
  close(r.nodes[1].V[0], 5); close(r.parts.reduce((s, p) => s + p.P, 0) + 1, 1);
});
test('circuit: RC low-pass at corner frequency is −3 dB, −45°', () => {
  const r = solveCircuit([{ type: 'V', a: 1, b: 0, value: 1 }, { type: 'R', a: 1, b: 2, value: 1000 }, { type: 'C', a: 2, b: 0, value: 1 / (2 * Math.PI * 1e6) }], 1000);
  const v = r.nodes[1].V; close(mag(v), Math.SQRT1_2, 1e-6); close(Math.atan2(v[1], v[0]), -Math.PI / 4, 1e-6);
});
test('circuit: series RLC at resonance draws V/R', () => {
  const r = solveCircuit([{ type: 'V', a: 1, b: 0, value: 1 }, { type: 'R', a: 1, b: 2, value: 10 }, { type: 'L', a: 2, b: 3, value: 0.01 }, { type: 'C', a: 3, b: 0, value: 1e-6 }], 1 / (2 * Math.PI * 1e-4));
  close(mag(r.parts[1].I), 0.1, 1e-6);
});
test('pipe network: series pipes split head equally and conserve flow', () => {
  const r = solvePipeNetwork({ nodes: [{ type: 'res', H: 50 }, { type: 'junc', z: 0, demand: 0 }, { type: 'res', H: 10 }], pipes: [{ from: 0, to: 1, L: 500, D: 0.2, eps: 45e-6 }, { from: 1, to: 2, L: 500, D: 0.2, eps: 45e-6 }] });
  assert.ok(r.converged); close(r.nodes[1].H, 30, 1e-6); close(r.pipes[0].Q, r.pipes[1].Q, 1e-9);
});
test('pipe network: looped network satisfies continuity at every junction', () => {
  const nodes = [{ type: 'res', H: 60, z: 60 }, { type: 'junc', z: 10, demand: 0.02 }, { type: 'junc', z: 8, demand: 0.03 }, { type: 'junc', z: 12, demand: 0.025 }];
  const pipes = [{ from: 0, to: 1, L: 500, D: 0.3, eps: 1e-4 }, { from: 1, to: 2, L: 400, D: 0.2, eps: 1e-4 }, { from: 2, to: 3, L: 300, D: 0.15, eps: 1e-4 }, { from: 1, to: 3, L: 500, D: 0.15, eps: 1e-4 }];
  const r = solvePipeNetwork({ nodes, pipes });
  assert.ok(r.converged);
  [1, 2, 3].forEach(i => close(r.pipes.reduce((s, p) => s + (p.to === i ? p.Q : 0) - (p.from === i ? p.Q : 0), 0), nodes[i].demand, 1e-7));
});
test('ideal-gas cycles match closed-form efficiencies', () => {
  const base = { R: 287, g: 1.4, T1: 300, p1: 1e5 };
  close(solveCycle({ ...base, cycle: 'otto', r: 8, Tmax: 1800 }).eta, 1 - 8 ** -0.4, 1e-9);
  close(solveCycle({ ...base, cycle: 'brayton', rp: 10, Tmax: 1400, etac: 1, etat: 1 }).eta, 1 - 10 ** (-0.4 / 1.4), 1e-9);
  close(solveCycle({ ...base, cycle: 'carnot', r: 5, Tmax: 900 }).eta, 2 / 3, 1e-9);
  const rc = 2000 / (300 * 18 ** 0.4);
  close(solveCycle({ ...base, cycle: 'diesel', r: 18, Tmax: 2000 }).eta, 1 - (rc ** 1.4 - 1) / (18 ** 0.4 * 1.4 * (rc - 1)), 1e-9);
});
test('MDOF modal analysis: 2-DOF chain eigenvalues', () => {
  const w2 = modal([1, 1], chainMatrices([1, 1], [1, 1, 0])).map(m => m.w ** 2);
  close(w2[0], (3 - Math.sqrt(5)) / 2, 1e-9); close(w2[1], (3 + Math.sqrt(5)) / 2, 1e-9);
});
test('drive train ratio and power flow', () => {
  const r = solveDrive({ n: 100, T: 10, stages: [{ type: 'gear', a: 20, b: 60, eta: 1 }, { type: 'planet', a: 20, b: 60, eta: 1 }] });
  close(r.ratio, 12); close(r.shafts[2].T, 120);
});
