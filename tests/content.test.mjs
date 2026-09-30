import test from 'node:test';
import assert from 'node:assert/strict';
import { LABS } from '../assets/js/data/labs.js';
import { PAPERS, paperMarks } from '../assets/js/data/papers.js';
import { linfit } from '../assets/js/core/plot.js';
import { CALC } from '../assets/js/calcs/index.js';

test('lab sample data reproduce the accepted value within 3 standard uncertainties (or 8 %)', () => {
  for (const L of LABS) {
    const k = Object.fromEntries(L.consts.map(c => [c.k, c.val]));
    const rows = L.data.map(d => Object.fromEntries(L.cols.map((c, i) => [c.k, d[i]])));
    const f = linfit(rows.map(r => L.x(r, k)), rows.map(r => L.y(r, k)));
    const v = L.result(f.m, f.c, k), u = Math.abs(L.result(f.m + f.se_m, f.c, k) - L.result(f.m - f.se_m, f.c, k)) / 2;
    assert.ok(Number.isFinite(v) && u > 0, `${L.id}: finite result`);
    assert.ok(f.r2 > 0.99, `${L.id}: sample data linear (R² = ${f.r2})`);
    const acc = typeof L.accepted === 'function' ? L.accepted(k) : L.accepted;
    if (acc) assert.ok(Math.abs(v - acc) <= Math.max(3 * u, 0.08 * acc), `${L.id}: ${v} ± ${u} vs ${acc}`);
    (L.related || []).forEach(c => assert.ok(CALC[c], `${L.id}: related calc ${c} exists`));
  }
});

test('exam papers: every part has a finite answer, marks and a mark scheme', () => {
  for (const p of PAPERS) {
    assert.ok(paperMarks(p) > 0);
    p.questions.forEach((q, i) => q.parts.forEach((x, j) => {
      assert.ok(Number.isFinite(x.ans) && x.ans !== 0, `${p.id} Q${i + 1}${j}: answer`);
      assert.ok(x.marks >= 1 && x.scheme.length > 5, `${p.id} Q${i + 1}${j}: marks/scheme`);
    }));
  }
});
