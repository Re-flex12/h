// Local persistence: settings, calculation history, projects.
// Everything lives in this browser (localStorage). Projects owned by a signed-in account are also
// synced to Supabase by core/sync.js.

const K = { settings: 'physeng.settings', history: 'physeng.history', projects: 'physeng.projects', favs: 'physeng.favs' };

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; }
}
function write(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; }
}

const listeners = new Set();
export function onSettings(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export const settings = Object.assign({ level: 'uni', units: 'si', theme: 'dark' }, read(K.settings, {}));
export function setSetting(k, v) {
  settings[k] = v;
  write(K.settings, settings);
  listeners.forEach(fn => fn(k, v));
}

export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ── History ─────────────────────────────────────────────
export function getHistory() { return read(K.history, []); }
export function pushHistory(entry) {
  const hist = getHistory().filter(e => !(e.calc === entry.calc && JSON.stringify(e.inputs) === JSON.stringify(entry.inputs)));
  hist.unshift({ ...entry, id: uid(), at: new Date().toISOString() });
  write(K.history, hist.slice(0, 60));
}
export function clearHistory() { write(K.history, []); }

// ── Projects ────────────────────────────────────────────
// Each project may carry `owner` (the signed-in user it syncs to; absent = local-only) and `updated`
// (ISO time of the last local change, used for last-write-wins sync). Projects owned by another
// account are hidden while a different user (or nobody) is signed in.
const TOMB = 'physeng.projects.deleted';
let currentOwner = null;
const projListeners = new Set();
export function onProjectsChanged(fn) { projListeners.add(fn); return () => projListeners.delete(fn); }
const changed = (source) => projListeners.forEach(fn => { try { fn(source); } catch (e) { console.error(e); } });
const visible = p => !p.owner || p.owner === currentOwner;
export function setProjectOwner(id) { currentOwner = id || null; }
export const projectOwner = () => currentOwner;
export function getAllProjects() { return read(K.projects, []); }
export function getProjects() { return getAllProjects().filter(visible); }
// Save the visible list, keeping other accounts' hidden projects untouched.
export function saveProjects(list, source = 'local') {
  const hidden = getAllProjects().filter(p => !visible(p));
  write(K.projects, [...list, ...hidden]);
  changed(source);
}
export function writeAllProjects(all, source = 'sync') { write(K.projects, all); changed(source); }
const now = () => new Date().toISOString();
const touch = proj => { proj.updated = now(); return proj; };
export function getTombstones() { return read(TOMB, []); }
export function setTombstones(t) { write(TOMB, t); }

export function createProject(name, description = '') {
  const p = getProjects();
  const proj = touch({ id: uid(), name, description, created: now(), items: [], notes: '', ...(currentOwner ? { owner: currentOwner } : {}) });
  p.unshift(proj);
  saveProjects(p);
  return proj;
}
export function addToProject(projectId, item) {
  const p = getProjects();
  const proj = p.find(x => x.id === projectId);
  if (!proj) return false;
  proj.items.unshift({ ...item, id: uid(), at: now() });
  touch(proj); saveProjects(p);
  return true;
}
// Calculation versioning: replace an item's state and keep the previous state in item.versions (newest first).
const SNAP = ['inputs', 'units', 'mode', 'result', 'note', 'at', 'rev', 'state'];
const snap = it => Object.fromEntries(SNAP.filter(k => it[k] !== undefined).map(k => [k, it[k]]));
export function saveVersion(projectId, itemId, data) {
  const p = getProjects(), proj = p.find(x => x.id === projectId), it = proj?.items.find(i => i.id === itemId);
  if (!it) return false;
  it.versions = [snap({ ...it, rev: it.rev || 1 }), ...(it.versions || [])].slice(0, 50);
  Object.assign(it, data, { at: now(), rev: (it.rev || 1) + 1 });
  touch(proj); saveProjects(p);
  return it.rev;
}
export function restoreVersion(projectId, itemId, idx) {
  const p = getProjects(), proj = p.find(x => x.id === projectId), it = proj?.items.find(i => i.id === itemId);
  const v = it?.versions?.[idx];
  if (!v) return false;
  const { rev, at, ...state } = v;
  it.versions = [snap({ ...it, rev: it.rev || 1 }), ...it.versions];
  Object.assign(it, state, { at: now(), rev: (it.rev || 1) + 1, note: `${state.note || ''} (restored from rev ${rev})`.trim() });
  touch(proj); saveProjects(p);
  return true;
}
export function removeFromProject(projectId, itemId) {
  const p = getProjects();
  const proj = p.find(x => x.id === projectId);
  if (proj) { proj.items = proj.items.filter(i => i.id !== itemId); touch(proj); }
  saveProjects(p);
}
export function deleteProject(id) {
  const all = getProjects(), proj = all.find(p => p.id === id);
  if (proj?.owner) setTombstones([...getTombstones().filter(t => t.id !== id), { id, owner: proj.owner, at: now() }]);
  saveProjects(all.filter(p => p.id !== id));
}
export function updateProject(id, patch) {
  const p = getProjects();
  const proj = p.find(x => x.id === id);
  if (proj) { Object.assign(proj, patch); touch(proj); }
  saveProjects(p);
}
// Attach local-only projects to the signed-in account so they sync.
export function claimProjects(ids) {
  if (!currentOwner) return 0;
  const p = getProjects(); let n = 0;
  p.forEach(x => { if (!x.owner && (!ids || ids.includes(x.id))) { x.owner = currentOwner; touch(x); n++; } });
  saveProjects(p);
  return n;
}
// Turn an account's copies into local-only projects (used when sign-out happens before a sync could finish).
export function releaseOwner(owner) {
  write(K.projects, getAllProjects().map(p => (p.owner === owner ? { ...p, owner: undefined } : p)));
  setTombstones(getTombstones().filter(t => t.owner !== owner));
  changed('signout');
}
// On sign-out: remove an account's synced copies (and tombstones) from this browser; they stay in the cloud.
export function forgetOwner(owner) {
  write(K.projects, getAllProjects().filter(p => p.owner !== owner));
  setTombstones(getTombstones().filter(t => t.owner !== owner));
  changed('signout');
}

// ── Favourites (equations, materials, calculators) ─────
export function getFavs() { return read(K.favs, []); }
export function toggleFav(key) {
  const f = getFavs();
  const i = f.indexOf(key);
  if (i >= 0) f.splice(i, 1); else f.unshift(key);
  write(K.favs, f);
  return i < 0;
}
export function isFav(key) { return getFavs().includes(key); }

export function exportAll() {
  return JSON.stringify({ exported: new Date().toISOString(), settings, history: getHistory(), projects: getProjects(), favs: getFavs() }, null, 2);
}
export function importAll(json) {
  const d = JSON.parse(json);
  if (d.projects) {
    // Imported projects join the current account (or stay local-only when signed out); same ids are replaced.
    const inc = d.projects.map(p => ({ ...p, updated: now(), ...(currentOwner ? { owner: currentOwner } : { owner: undefined }) }));
    const ids = new Set(inc.map(p => p.id));
    saveProjects([...inc, ...getProjects().filter(p => !ids.has(p.id))]);
  }
  if (d.history) write(K.history, d.history);
  if (d.favs) write(K.favs, d.favs);
}
