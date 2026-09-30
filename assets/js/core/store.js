// Local persistence: settings, calculation history, projects.
// Everything lives in this browser (localStorage). Accounts / sync are a server-side roadmap item.

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
export function getProjects() { return read(K.projects, []); }
export function saveProjects(p) { write(K.projects, p); }
export function createProject(name, description = '') {
  const p = getProjects();
  const proj = { id: uid(), name, description, created: new Date().toISOString(), items: [], notes: '' };
  p.unshift(proj);
  saveProjects(p);
  return proj;
}
export function addToProject(projectId, item) {
  const p = getProjects();
  const proj = p.find(x => x.id === projectId);
  if (!proj) return false;
  proj.items.unshift({ ...item, id: uid(), at: new Date().toISOString() });
  saveProjects(p);
  return true;
}
// Calculation versioning: replace an item's state and keep the previous state in item.versions (newest first).
const SNAP = ['inputs', 'units', 'mode', 'result', 'note', 'at', 'rev', 'state'];
const snap = it => Object.fromEntries(SNAP.filter(k => it[k] !== undefined).map(k => [k, it[k]]));
export function saveVersion(projectId, itemId, data) {
  const p = getProjects(), proj = p.find(x => x.id === projectId), it = proj?.items.find(i => i.id === itemId);
  if (!it) return false;
  it.versions = [snap({ ...it, rev: it.rev || 1 }), ...(it.versions || [])].slice(0, 50);
  Object.assign(it, data, { at: new Date().toISOString(), rev: (it.rev || 1) + 1 });
  saveProjects(p);
  return it.rev;
}
export function restoreVersion(projectId, itemId, idx) {
  const p = getProjects(), proj = p.find(x => x.id === projectId), it = proj?.items.find(i => i.id === itemId);
  const v = it?.versions?.[idx];
  if (!v) return false;
  const { rev, at, ...state } = v;
  it.versions = [snap({ ...it, rev: it.rev || 1 }), ...it.versions];
  Object.assign(it, state, { at: new Date().toISOString(), rev: (it.rev || 1) + 1, note: `${state.note || ''} (restored from rev ${rev})`.trim() });
  saveProjects(p);
  return true;
}
export function removeFromProject(projectId, itemId) {
  const p = getProjects();
  const proj = p.find(x => x.id === projectId);
  if (proj) proj.items = proj.items.filter(i => i.id !== itemId);
  saveProjects(p);
}
export function deleteProject(id) { saveProjects(getProjects().filter(p => p.id !== id)); }
export function updateProject(id, patch) {
  const p = getProjects();
  const proj = p.find(x => x.id === id);
  if (proj) Object.assign(proj, patch);
  saveProjects(p);
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
  if (d.projects) write(K.projects, d.projects);
  if (d.history) write(K.history, d.history);
  if (d.favs) write(K.favs, d.favs);
}
