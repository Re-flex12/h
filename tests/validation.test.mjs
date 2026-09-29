// Every calculator is run with its defaults (must produce finite outputs) and checked against
// the reference cases in assets/js/data/validation.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CALCS, CALC } from '../assets/js/calcs/index.js';
import { pickerRecord } from '../assets/js/calcs/_h.js';
import { VALIDATION } from '../assets/js/data/validation.js';

export function defaults(c) {
  const v = {};
  c.inputs.forEach(i => { v[i.k] = i.def; });
  c.inputs.filter(i => i.fill).forEach(i => {
    const r = pickerRecord(i.type, i.def);
    if (r) for (const [k, p] of Object.entries(i.fill)) if (r[p] != null) v[k] = r[p];
  });
  return v;
}

test('every calculator computes finite results from its defaults', () => {
  for (const c of CALCS) {
    const r = c.compute(defaults(c));
    for (const o of c.outputs) {
      if (o.type === 'text') { assert.equal(typeof r[o.k], 'string', `${c.id}.${o.k}`); continue; }
      if (c.id === 'interval' && o.k === 'sig') continue; // proper distance undefined for a timelike default
      assert.ok(Number.isFinite(r[o.k]), `${c.id}.${o.k} = ${r[o.k]}`);
    }
  }
});

test('calculator metadata is complete', () => {
  const ids = new Set();
  for (const c of CALCS) {
    assert.ok(!ids.has(c.id), `duplicate id ${c.id}`); ids.add(c.id);
    for (const f of ['title', 'disc', 'level', 'summary']) assert.ok(c[f], `${c.id} missing ${f}`);
    assert.ok(c.eq?.length, `${c.id} has no equations`);
    assert.ok(Array.isArray(c.assume) && Array.isArray(c.limits) && Array.isArray(c.refs), `${c.id} missing assumptions/limits/refs`);
  }
});

for (const [id, cases] of Object.entries(VALIDATION)) {
  test(`validation: ${id}`, () => {
    const c = CALC[id];
    assert.ok(c, `unknown calculator ${id}`);
    cases.forEach(cs => {
      const r = c.compute({ ...defaults(c), ...cs.inputs });
      for (const [k, [want, tol]] of Object.entries(cs.expect)) {
        const got = r[k];
        const rel = Math.abs(got - want) / Math.abs(want);
        assert.ok(rel <= tol, `${id}.${k}: got ${got}, want ${want} (rel err ${rel.toExponential(2)} > ${tol}) — ${cs.source}`);
      }
    });
  });
}
