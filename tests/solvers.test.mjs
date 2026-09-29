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
