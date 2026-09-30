import test from 'node:test';
import assert from 'node:assert/strict';
import { PHYSICS, QUANTUM, MATHS, ENGINEERING } from '../assets/js/data/taxonomy.js';
import { TOPICS } from '../assets/js/data/topics.js';
import { titleOf, parseItem } from '../assets/js/pages/common.js';

const TOOLS = new Set(['materials', 'constants', 'tables', 'fluids', 'steam', 'refrigerants', 'sections', 'compare', 'standards', 'equations', 'qc', 'practice', 'api', 'units', 'solver', 'graph', 'data', 'uncertainty', 'dimensions', 'ask', 'fft', 'matrix', 'numerics', 'psychro']);
const ok = (kind, id) => kind === 'tool' ? TOOLS.has(id) : kind === 'disc' || kind === 'material' ? true : Boolean(titleOf(kind, id)) && titleOf(kind, id) !== id;

test('every content-map item links to something that exists', () => {
  const groups = [...PHYSICS.groups, ...QUANTUM.areas.flatMap(a => a.groups), ...MATHS.groups, ...ENGINEERING.disciplines.flatMap(d => d.groups)];
  const bad = [];
  groups.forEach(g => g.items.forEach(s => { const it = parseItem(s); if (!it.url) bad.push(`${g.name}: ${s} (unlinked)`); else { const m = s.split('>')[1]; if (m) { const [k, id] = m.split(':'); if (!ok(k, id)) bad.push(`${g.name}: ${s}`); } } }));
  assert.deepEqual(bad, []);
});

test('topic pages: links resolve and self-check answers are finite', () => {
  for (const t of TOPICS) {
    assert.ok(Number.isFinite(t.check.ans), `${t.id}: check answer`);
    assert.ok(t.points.length >= 2 && t.eqs.length >= 1 && t.example.steps.length >= 1, `${t.id}: content`);
    (t.links || []).forEach(l => { const [k, id] = l.split(':'); assert.ok(ok(k, id), `${t.id}: link ${l}`); });
  }
  assert.equal(new Set(TOPICS.map(t => t.id)).size, TOPICS.length, 'unique ids');
});
