import test from 'node:test';
import assert from 'node:assert/strict';
import { interpret, simulateQC, blochVector } from '../assets/js/pages/tools2.js';
import { drill } from '../assets/js/pages/practice.js';
import { PHYSENG } from '../assets/js/api.js';

test('Ask interpreter maps questions to calculators and inputs', () => {
  const cases = [
    ['Water flowing through a 25 mm pipe at 2 m/s — is it turbulent?', 'reynolds', { D: 0.025, v: 2 }],
    ['Shear stress in a 35 mm 4140 steel shaft carrying 450 N·m', 'shaft-torsion', { d: 0.035, T: 450 }],
    ['Photon energy of 532 nm light', 'photon', { lam: 532e-9 }],
    ['Three phase 400 V motor drawing 22 kW at 0.85 power factor', 'three-phase', { VL: 400, P: 22e3, pf: 0.85 }],
    ['Current through a 220 ohm resistor on 5 V', 'ohm', { R: 220, V: 5 }],
  ];
  for (const [q, id, vals] of cases) {
    const r = interpret(q);
    assert.equal(r.id, id, q);
    for (const [k, v] of Object.entries(vals)) assert.ok(Math.abs(r.values[k] - v) < 1e-9 * Math.max(1, v), `${q}: ${k}=${r.values[k]}`);
  }
});

test('quantum circuits: Bell state, Grover, entanglement shrinks Bloch vector', () => {
  const p = s => s.map(a => a[0] ** 2 + a[1] ** 2);
  const bell = simulateQC(2, [['H', '—'], ['●', 'X']]);
  assert.deepEqual(p(bell).map(x => +x.toFixed(9)), [0.5, 0, 0, 0.5]);
  assert.ok(Math.hypot(...blochVector(bell, 2, 0)) < 1e-9);
  const g = simulateQC(2, [['H', 'H'], ['●', 'Z'], ['H', 'H'], ['X', 'X'], ['●', 'Z'], ['X', 'X'], ['H', 'H']]);
  assert.ok(Math.abs(p(g)[3] - 1) < 1e-9);
  const plus = simulateQC(1, [['H']]);
  const b = blochVector(plus, 1, 0); assert.ok(Math.abs(b[0] - 1) < 1e-9 && Math.abs(b[2]) < 1e-9);
});

test('generated formula drills are solvable', () => {
  let seed = 1; const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 100; i++) { const q = drill(rng); assert.ok(q && Number.isFinite(q.ans)); }
});

test('public API', () => {
  assert.ok(Math.abs(PHYSENG.run('shaft-torsion', { T: 450, d: 0.035 }).outputs.tau - 16 * 450 / (Math.PI * 0.035 ** 3)) < 1);
  assert.equal(PHYSENG.solve('ohm', { V: 12, R: 100 }, 'I'), 0.12);
});
