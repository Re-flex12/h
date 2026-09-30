// Project sync with Supabase: each project is one row in public.projects (see supabase/schema.sql).
// Rule per project: the newest `updated` wins (the database also refuses stale overwrites), and
// deletions travel as tombstones. Each sync fetches only row metadata, downloads the projects that
// are newer on the server, and uploads the ones that are newer here. Syncs run on sign-in, shortly
// after local changes, when the window regains focus or comes back online, and once a minute.
import * as auth from './auth.js';
import { getAllProjects, writeAllProjects, getTombstones, setTombstones, onProjectsChanged, setProjectOwner, forgetOwner, releaseOwner } from './store.js';

let status = { state: 'off', at: null, error: null };
const listeners = new Set();
const emit = (patch) => { status = { ...status, ...patch }; listeners.forEach(fn => { try { fn(status); } catch (e) { console.error(e); } }); };
export const syncStatus = () => status;
export function onSync(fn) { listeners.add(fn); fn(status); return () => listeners.delete(fn); }

const t = (iso) => (iso ? Date.parse(iso) : 0);

// Decide what to do for every project id. Pure, so it can be unit-tested.
// local: this account's projects; tomb: this account's tombstones [{id, at}]; meta: server rows [{id, updated_at, deleted}].
export function planSync(local, tomb, meta) {
  const L = new Map(local.map(p => [p.id, p])), D = new Map(tomb.map(x => [x.id, x])), R = new Map(meta.map(r => [r.id, r]));
  const plan = { upload: [], uploadDeletes: [], download: [], removeLocal: [], dropTomb: [] };
  for (const id of new Set([...L.keys(), ...D.keys(), ...R.keys()])) {
    const l = L.get(id), d = D.get(id), r = R.get(id);
    const lt = t(l?.updated), dt = t(d?.at), rt = t(r?.updated_at);
    if (l) {
      if (!r || lt > rt) plan.upload.push(id);
      else if (lt < rt) (r.deleted ? plan.removeLocal : plan.download).push(id);
    } else if (d) {
      if (r && dt >= rt && !r.deleted) plan.uploadDeletes.push(id);
      else if (r && dt < rt && !r.deleted) plan.download.push(id);   // edited elsewhere after we deleted it: keep the edit
      plan.dropTomb.push(id);
    } else if (r && !r.deleted) plan.download.push(id);
  }
  return plan;
}

let user = null, timer = null, poll = null, running = null, again = false;
const clean = (p) => { const { owner, ...rest } = p || {}; return rest; };

async function doSync() {
  const sb = auth.supabase(), me = user?.id;
  if (!sb || !me) return;
  emit({ state: 'syncing', error: null });
  const { data: meta, error } = await sb.from('projects').select('id,updated_at,deleted').eq('user_id', me);
  if (error) throw error;
  const all = getAllProjects(), mine = all.filter(p => p.owner === me);
  const tombs = getTombstones(), myTomb = tombs.filter(x => x.owner === me);
  const plan = planSync(mine, myTomb, meta || []);

  let fresh = [];
  if (plan.download.length) {
    const { data, error: e } = await sb.from('projects').select('id,data,updated_at').eq('user_id', me).in('id', plan.download);
    if (e) throw e;
    fresh = data || [];
  }
  const rows = [
    ...plan.upload.map(id => { const p = mine.find(x => x.id === id); return { user_id: me, id, data: clean(p), updated_at: p.updated || new Date().toISOString(), deleted: false }; }),
    ...plan.uploadDeletes.map(id => ({ user_id: me, id, data: {}, updated_at: myTomb.find(x => x.id === id).at, deleted: true })),
  ];
  if (rows.length) { const { error: e } = await sb.from('projects').upsert(rows, { onConflict: 'user_id,id' }); if (e) throw e; }

  // Apply to local storage — re-read in case the user changed something while we were waiting.
  const now = getAllProjects(), byId = new Map(fresh.map(r => [r.id, r]));
  const drop = new Set(plan.removeLocal);
  const out = now.filter(p => !(p.owner === me && drop.has(p.id))).map(p => {
    const r = p.owner === me && byId.get(p.id);
    if (!r || t(p.updated) > t(r.updated_at)) return p;          // local changed meanwhile: keep it, next sync uploads
    byId.delete(p.id);
    return { ...r.data, id: r.id, owner: me, updated: r.updated_at };
  });
  const added = [...byId.values()].filter(r => !out.some(p => p.id === r.id)).map(r => ({ ...r.data, id: r.id, owner: me, updated: r.updated_at }));
  if (plan.download.length || drop.size) writeAllProjects([...added, ...out], 'sync');
  if (plan.dropTomb.length || plan.uploadDeletes.length) { const gone = new Set([...plan.dropTomb, ...plan.uploadDeletes]); setTombstones(getTombstones().filter(x => !(x.owner === me && gone.has(x.id)))); }
  emit({ state: 'synced', at: new Date().toISOString(), error: null, up: rows.length, down: fresh.length + drop.size });
}

export function syncNow() {
  if (!user) return Promise.resolve();
  if (running) { again = true; return running; }
  running = (async () => {
    try { do { again = false; await doSync(); } while (again); }
    catch (e) { emit({ state: navigator.onLine === false ? 'offline' : 'error', error: e.message || String(e) }); }
    finally { running = null; }
  })();
  return running;
}
const schedule = (ms = 1500) => { clearTimeout(timer); timer = setTimeout(syncNow, ms); };

let started = false;
export function initSync() {
  if (started) return; started = true;
  // Flush before sign-out; remember whether everything reached the server.
  let flushedOk = true;
  auth.onBeforeSignOut(async () => { clearTimeout(timer); await syncNow(); flushedOk = status.state === 'synced'; });
  onProjectsChanged(src => { if (user && src !== 'sync' && src !== 'signout') { emit({ state: 'pending' }); schedule(); } });
  window.addEventListener('focus', () => { if (user) schedule(200); });
  window.addEventListener('online', () => { if (user) schedule(200); });
  auth.onAuth(st => {
    if (!st.ready) return;
    const next = st.user || null;
    if (next?.id === user?.id) return;
    const prev = user; user = next;
    clearInterval(poll); clearTimeout(timer);
    // Signed out: synced copies leave this browser. If the last sync failed, keep them as local-only
    // projects instead, so nothing is lost.
    if (prev && !next) { if (flushedOk && status.state !== 'error' && status.state !== 'offline' && status.state !== 'pending') forgetOwner(prev.id); else releaseOwner(prev.id); flushedOk = true; }
    setProjectOwner(next?.id || null);
    if (!next) { emit({ state: 'off', at: null, error: null }); return; }
    syncNow();
    poll = setInterval(() => { if (document.visibilityState === 'visible') syncNow(); }, 60000);
  });
}
