import test from 'node:test';
import assert from 'node:assert/strict';
import { planSync } from '../assets/js/core/sync.js';

const P = (id, updated) => ({ id, updated });
const R = (id, updated_at, deleted = false) => ({ id, updated_at, deleted });
const T1 = '2026-09-30T10:00:00Z', T2 = '2026-09-30T11:00:00Z', T3 = '2026-09-30T12:00:00Z';

test('new local project is uploaded; new remote project is downloaded', () => {
  const p = planSync([P('a', T1)], [], [R('b', T1)]);
  assert.deepEqual(p.upload, ['a']);
  assert.deepEqual(p.download, ['b']);
});

test('newest version wins in both directions; equal timestamps do nothing', () => {
  const p = planSync([P('a', T2), P('b', T1), P('c', T1)], [], [R('a', T1), R('b', T2), R('c', T1)]);
  assert.deepEqual(p.upload, ['a']);
  assert.deepEqual(p.download, ['b']);
  assert.deepEqual([...p.upload, ...p.download].includes('c'), false);
});

test('remote deletion newer than the local copy removes it locally', () => {
  const p = planSync([P('a', T1)], [], [R('a', T2, true)]);
  assert.deepEqual(p.removeLocal, ['a']);
});

test('local edit after a remote deletion resurrects the project', () => {
  const p = planSync([P('a', T3)], [], [R('a', T2, true)]);
  assert.deepEqual(p.upload, ['a']);
});

test('local deletion is uploaded as a tombstone and the tombstone is then dropped', () => {
  const p = planSync([], [{ id: 'a', at: T2 }], [R('a', T1)]);
  assert.deepEqual(p.uploadDeletes, ['a']);
  assert.deepEqual(p.dropTomb, ['a']);
});

test('remote edit after a local deletion wins (edit is kept)', () => {
  const p = planSync([], [{ id: 'a', at: T1 }], [R('a', T2)]);
  assert.deepEqual(p.download, ['a']);
  assert.deepEqual(p.uploadDeletes, []);
});

test('tombstone for a project the server never saw is just dropped; remote tombstones are ignored', () => {
  const p = planSync([], [{ id: 'x', at: T1 }], [R('y', T1, true)]);
  assert.deepEqual(p, { upload: [], uploadDeletes: [], download: [], removeLocal: [], dropTomb: ['x'] });
});
