import { settings, setSetting, getHistory, clearHistory, getProjects, createProject, deleteProject, updateProject, removeFromProject, restoreVersion, getFavs, toggleFav, exportAll, importAll } from '../core/store.js';
import { CALC } from '../calcs/index.js';
import { EQ } from '../data/equations.js';
import { getMaterial } from '../data/materials.js';
import { esc, toast, debounce } from '../core/format.js';
import { crumbs, pageHead, LEVEL_NAME } from './common.js';
import { encodeState } from './calc.js';

const itemHref = it => {
  if (it.kind === 'calc') return `#/calc/${it.calc}?s=${encodeState({ v: it.inputs, u: it.units, m: it.mode })}`;
  if (it.kind === 'beam') return `#/solvers/beam?s=${encodeState(it.state)}`;
  if (it.kind === 'truss') return `#/solvers/truss?s=${encodeState(it.state)}`;
  return '#/workspace';
};
// Input differences between two saved states of the same calculator, as readable text.
const diffInputs = (calcId, a = {}, b = {}) => {
  const c = CALC[calcId];
  const label = k => c?.inputs.find(i => i.k === k)?.label || k;
  const show = v => typeof v === 'number' ? (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v) ? v.toExponential(4) : String(+v.toPrecision(6))) : String(v);
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => String(a[k]) !== String(b[k])).map(k => `${label(k)}: ${show(a[k])} → ${show(b[k])}`);
};
const versionsHtml = it => !it.versions?.length ? '' : `<details class="mt"><summary class="small">Revision history (${it.versions.length} earlier)</summary><div class="rows">${it.versions.map((v, j) => {
  const newer = j === 0 ? it : it.versions[j - 1], d = diffInputs(it.calc, v.inputs, newer.inputs);
  return `<div class="row"><span class="ri">r${v.rev || 1}</span><span><a href="${itemHref({ ...it, ...v })}" class="rt" style="text-decoration:none">Open rev ${v.rev || 1}</a>${v.note ? ` <span class="muted small">— ${esc(v.note)}</span>` : ''}<div class="small muted">${esc(v.result || '')}</div>${d.length ? `<div class="small">Changed in r${newer.rev || 1}: ${esc(d.join('; '))}</div>` : ''}</span><span class="rd">${when(v.at)} <button class="btn ghost sm" data-restore="${it.id}:${j}">Restore</button></span></div>`;
}).join('')}</div></details>`;
const when = iso => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function page(main, _, query) {
  const tab = query.get('t') || 'projects';
  main.innerHTML = `${crumbs([['Workspace']])}${pageHead('08 / WSP', 'My Workspace', 'Projects, saved calculations, history and preferences. Everything is stored in this browser — export a backup to move it between devices. (Accounts and sync are coming.)')}
    <div class="tabs" style="margin-top:0">${[['projects', 'Projects'], ['history', 'History'], ['saved', 'Saved items'], ['settings', 'Settings & data']].map(([k, n]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div><div id="wp" class="mt"></div>`;
  const pane = main.querySelector('#wp');
  const show = t => { main.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); ({ projects, history: hist, saved, settings: prefs })[t](pane); };
  main.querySelectorAll('.tabs button').forEach(b => b.onclick = () => show(b.dataset.t));
  show(tab);
}

function projects(pane) {
  const ps = getProjects();
  pane.innerHTML = `<div class="toolbar"><input class="filter-in" id="np" placeholder="New project name, e.g. “Formula Student suspension”"><button class="btn sm" id="npb">Create project</button></div>
    ${ps.length ? ps.map(p => `<div class="panel tick mb" data-p="${p.id}">
      <div class="panel-title"><div><input class="plain" data-name value="${esc(p.name)}" style="font-weight:700;font-size:18px;border-color:transparent;padding:4px 0;background:transparent"><div class="small muted mono">Created ${when(p.created)} · ${p.items.length} item${p.items.length === 1 ? '' : 's'}</div></div>
      <div class="btns"><button class="btn ghost sm" data-exp>Export JSON</button><button class="btn ghost sm" data-print>Project summary</button><button class="btn danger sm" data-del>Delete</button></div></div>
      ${p.items.length ? `<div class="rows">${p.items.map((it, i) => `<div class="row"><span class="ri">${String(i + 1).padStart(2, '0')}</span><span><a href="${itemHref(it)}" class="rt" style="text-decoration:none">${esc(it.title)}</a>${it.rev > 1 ? ` <span class="badge">rev ${it.rev}</span>` : ''}${it.note ? ` <span class="muted small">— ${esc(it.note)}</span>` : ''}<div class="small muted">${esc(it.result || '')}</div>${versionsHtml(it)}</span><span class="rd">${when(it.at)} <button class="btn ghost sm" data-rm="${it.id}">✕</button></span></div>`).join('')}</div>` : '<div class="empty">No items yet — open any calculator or solver and press “Save to project”.</div>'}
      <div class="field mt"><label>Project notes</label><textarea class="plain" data-notes style="min-height:80px" placeholder="Requirements, decisions, open questions…">${esc(p.notes || '')}</textarea></div>
    </div>`).join('') : '<div class="empty">No projects yet. Create one above — e.g. a Formula Student suspension, a pump system or a lab report.</div>'}`;
  pane.querySelector('#npb').onclick = () => { const n = pane.querySelector('#np').value.trim(); if (!n) return; createProject(n); projects(pane); toast('Project created'); };
  pane.querySelectorAll('[data-p]').forEach(el => {
    const id = el.dataset.p, p = getProjects().find(x => x.id === id);
    el.querySelector('[data-name]').oninput = debounce(e => updateProject(id, { name: e.target.value }), 400);
    el.querySelector('[data-notes]').oninput = debounce(e => updateProject(id, { notes: e.target.value }), 400);
    el.querySelector('[data-del]').onclick = () => { if (confirm(`Delete project “${p.name}”? This cannot be undone.`)) { deleteProject(id); projects(pane); } };
    el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { removeFromProject(id, b.dataset.rm); projects(pane); });
    el.querySelectorAll('[data-restore]').forEach(b => b.onclick = () => { const [iid, j] = b.dataset.restore.split(':'); restoreVersion(id, iid, +j); projects(pane); toast('Earlier revision restored as a new revision'); });
    el.querySelector('[data-exp]').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })); a.download = `${p.name.replace(/[^\w-]+/g, '_')}.physeng.json`; a.click(); };
    el.querySelector('[data-print]').onclick = () => {
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(p.name)}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;color:#111}td{border-bottom:1px solid #ccc;padding:6px 8px;vertical-align:top}h1{border-bottom:3px solid #111}</style><h1>${esc(p.name)}</h1><p>PHYSENG project summary · ${new Date().toLocaleString()}</p><table>${p.items.map((it, i) => `<tr><td>${i + 1}</td><td><b>${esc(it.title)}</b><br>${esc(it.note || '')}</td><td>${esc(it.result || '')}</td></tr>`).join('')}</table><h2>Notes</h2><p style="white-space:pre-wrap">${esc(p.notes || '—')}</p><p style="font-size:12px;color:#555">Open each item in PHYSENG to regenerate its full calculation sheet.</p>`);
      w.document.close(); w.print();
    };
  });
}

function hist(pane) {
  const h = getHistory();
  pane.innerHTML = `<div class="toolbar"><span class="muted small">Last ${h.length} calculations (stored automatically after you stop editing).</span><span class="grow"></span>${h.length ? '<button class="btn danger sm" id="ch">Clear history</button>' : ''}</div>
    ${h.length ? `<div class="rows">${h.map((e, i) => `<a href="${itemHref({ kind: 'calc', calc: e.calc, inputs: e.inputs, units: e.units })}"><span class="ri">${String(i + 1).padStart(2, '0')}</span><span><span class="rt">${esc(e.title)}</span><div class="small muted">${esc(e.result || '')}</div></span><span class="rd">${when(e.at)}</span></a>`).join('')}</div>` : '<div class="empty">No history yet.</div>'}`;
  pane.querySelector('#ch')?.addEventListener('click', () => { clearHistory(); hist(pane); });
}

function saved(pane) {
  const f = getFavs();
  const row = k => {
    const [kind, id] = k.split(':');
    const [title, href, type] = kind === 'calc' ? [CALC[id]?.title, `#/calc/${id}`, 'Calculator'] : kind === 'eq' ? [EQ[id]?.name, `#/reference/equations/${id}`, 'Equation'] : [getMaterial(id)?.name, `#/reference/materials/${id}`, 'Material'];
    return title ? `<div class="row"><span class="ri">${type}</span><a class="rt" href="${href}" style="text-decoration:none">${esc(title)}</a><span class="rd"><button class="btn ghost sm" data-un="${k}">Remove</button></span></div>` : '';
  };
  pane.innerHTML = f.length ? `<div class="rows">${f.map(row).join('')}</div>` : '<div class="empty">Nothing saved yet. Use ☆ on calculators, equations and materials.</div>';
  pane.querySelectorAll('[data-un]').forEach(b => b.onclick = () => { toggleFav(b.dataset.un); saved(pane); });
}

function prefs(pane) {
  pane.innerHTML = `<div class="split"><div class="panel tick"><h4>Preferences</h4>
      <div class="field mt"><label>Education level (default calculator mode & lesson depth)</label><select class="plain" id="pl">${Object.entries(LEVEL_NAME).map(([k, n]) => `<option value="${k}"${k === settings.level ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Default unit system</label><select class="plain" id="pu">${[['si', 'SI'], ['metric', 'Metric engineering (mm, kN, MPa, °C)'], ['imperial', 'Imperial (in, lbf, psi, °F)']].map(([k, n]) => `<option value="${k}"${k === settings.units ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Theme</label><select class="plain" id="pt"><option value="dark"${settings.theme === 'dark' ? ' selected' : ''}>Dark (oscilloscope)</option><option value="light"${settings.theme === 'light' ? ' selected' : ''}>Light (blueprint)</option></select></div>
      <p class="small muted">Individual units can still be changed on every input and result.</p></div>
    <div class="panel"><h4>Backup & transfer</h4><p class="small muted mt">Export all projects, history and saved items as JSON, and import them on another device or browser.</p>
      <div class="btns"><button class="btn sm" id="ex">Export all data</button><label class="btn ghost sm">Import…<input type="file" id="im" accept=".json,application/json" hidden></label></div>
      <div class="msg info mt">Coming soon: accounts with cross-device sync and team projects (server-backed). Until then, use export/import (or a share link) to move projects between people and devices. Scripting: see the <a href="#/reference/api">JavaScript API</a>.</div></div></div>`;
  const sync = () => { document.getElementById('levelSel').value = settings.level; document.getElementById('unitSel').value = settings.units; document.documentElement.dataset.theme = settings.theme; };
  pane.querySelector('#pl').onchange = e => { setSetting('level', e.target.value); sync(); toast('Level updated'); };
  pane.querySelector('#pu').onchange = e => { setSetting('units', e.target.value); sync(); toast('Units updated'); };
  pane.querySelector('#pt').onchange = e => { setSetting('theme', e.target.value); sync(); };
  pane.querySelector('#ex').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([exportAll()], { type: 'application/json' })); a.download = `physeng-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); };
  pane.querySelector('#im').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { importAll(t); toast('Imported'); } catch (er) { toast('Import failed: invalid file'); } }); };
}
