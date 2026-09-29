import test from 'node:test';
import assert from 'node:assert/strict';
import { toSI, fromSI, convert } from '../assets/js/core/units.js';
import { compile, parse, dimOf, DIMVEC, solveRoot } from '../assets/js/core/expr.js';
import { EQUATIONS, matchEquation } from '../assets/js/data/equations.js';
import { psatIF97, tsatIF97 } from '../assets/js/data/fluids.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `got ${a}, want ${b}`);

test('unit conversions (exact definitions)', () => {
  close(toSI(1, 'pressure', 'psi'), 6894.757293168361);
  close(toSI(1, 'length', 'in'), 0.0254);
  close(convert(1, 'torque', 'lbf·ft', 'N·m'), 1.3558179483314004);
  close(convert(1, 'power', 'hp', 'kW'), 0.74569987158227);
  close(convert(1, 'pressure', 'MPa', 'N/mm²'), 1);
  close(toSI(100, 'temperature', '°C'), 373.15);
  close(fromSI(373.15, 'temperature', '°F'), 212);
  close(convert(1, 'flow', 'L/min', 'm³/s'), 1 / 60000);
  close(convert(1, 'energy', 'eV', 'J'), 1.602176634e-19);
});

test('expression parser and evaluator', () => {
  close(compile('2*x^2 + 3x - 1').f({ x: 2 }), 13);
  close(compile('sin(pi/2) + ln(e)').f({}), 2);
  close(compile('x²').f({ x: 3 }), 9);
  assert.throws(() => parse('2 +* 3'));
});

test('dimensional analysis', () => {
  const S = { F: DIMVEC.force, m: DIMVEC.mass, a: DIMVEC.accel, v: DIMVEC.velocity };
  assert.equal(dimOf(parse('F = m*a'), S).ok, true);
  assert.equal(dimOf(parse('F = m*v'), S).ok, false);
});

test('root finding', () => {
  close(solveRoot(x => x * x - 2, 1), Math.SQRT2, 1e-10);
  close(solveRoot(x => Math.exp(x) - 1e6, 1), Math.log(1e6), 1e-10);
});

test('every library equation is consistent with its defaults and solvable for every variable', () => {
  for (const e of EQUATIONS) {
    if (!e.f) continue;
    const c = compile(e.f);
    const vals = Object.fromEntries(e.v.map(x => [x[0], x[4]]));
    c.vars.forEach(k => assert.ok(k in vals, `${e.id}: variable ${k} undefined`));
    const scale = Math.max(...e.v.map(x => Math.abs(x[4]) || 0), 1);
    for (const [k] of e.v) {
      const r = solveRoot(x => c.f({ ...vals, [k]: x }), vals[k] * 1.3 || 1);
      assert.ok(Number.isFinite(r), `${e.id}: could not solve for ${k}`);
      const res = Math.abs(c.f({ ...vals, [k]: r }));
      const ref = Math.abs(c.f({ ...vals, [k]: vals[k] * 2 || 1 }));
      assert.ok(res <= 1e-6 * Math.max(1, Number.isFinite(ref) ? ref : 1), `${e.id}: residual ${res} solving for ${k}`);
      if (vals[k] > 0 && e.id !== 'quadratic') assert.ok(r > 0, `${e.id}: expected the positive root for ${k}, got ${r}`);
    }
  }
});

test('equation search recognises typed equations', () => {
  assert.equal(matchEquation('E=mc2')[0].id, 'emc2');
  assert.equal(matchEquation('PV=nRT')[0].id, 'ideal-gas');
  assert.equal(matchEquation('Re = ρvD/μ')[0].id, 'reynolds');
  assert.equal(matchEquation('FL^3/48EI')[0].id, 'ss-point');
});

test('IAPWS-IF97 region 4 round trip', () => {
  for (const T of [280, 350, 450, 550, 640]) close(tsatIF97(psatIF97(T)), T, 1e-9);
});
