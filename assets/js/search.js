// Global search palette: calculators, equations (including typed equations), lessons, simulations,
// solvers, materials, constants, reference pages and every topic in the content map.
import { CALCS, DISCIPLINES } from './calcs/index.js';
import { EQUATIONS, matchEquation } from './data/equations.js';
import { LESSONS } from './data/lessons.js';
import { MATERIALS } from './data/materials.js';
import { CONSTANTS } from './data/constants.js';
import { PHYSICS, QUANTUM, MATHS, ENGINEERING, TOOLS_LIST, REFERENCE_LIST } from './data/taxonomy.js';
import { SIMS, SOLVERS, parseItem, toolHref } from './pages/common.js';
import { esc, tex } from './core/format.js';

const ORDER = ['Learn', 'Equation', 'Calculator', 'Solver', 'Simulation', 'Material', 'Constant', 'Reference', 'Tool', 'Topic'];
let INDEX = null;

function build() {
  const items = [];
  const add = (type, title, sub, url, text = '', boost = 0) => items.push({ type, title, sub, url, hay: `${title} ${sub} ${text}`.toLowerCase(), t: title.toLowerCase(), boost });
  LESSONS.forEach(l => add('Learn', l.title, l.intro, `#/learn/${l.id}`, `${l.topic} lesson ${l.calcs?.join(' ')}`, 4));
  EQUATIONS.forEach(e => add('Equation', e.name, e.plain[0], `#/reference/equations/${e.id}`, `${e.plain.join(' ')} ${e.topic} ${e.v.map(v => v[1]).join(' ')}`, 2));
  CALCS.forEach(c => add('Calculator', c.title, c.summary, `#/calc/${c.id}`, `${c.tags.join(' ')} ${DISCIPLINES[c.disc]?.name} ${c.sub || ''} calculator`, 3));
  Object.entries(SOLVERS).forEach(([id, s]) => add('Solver', s.title, s.live ? s.d : `Planned — ${s.d}`, s.href || `#/solvers/${id}`, 'solver', s.live ? 2 : -2));
  Object.entries(SIMS).forEach(([id, s]) => add('Simulation', s.title, s.d, `#/sims/${id}`, 'simulation interactive', 2));
  MATERIALS.forEach(m => add('Material', m.name, `${m.sub} · ${m.cond}`, `#/reference/materials/${m.id}`, `${m.uses} ${m.cat} ${m.id.replace(/-/g, ' ')}`, 1));
  CONSTANTS.forEach(([grp, key, name, , val, unit]) => add('Constant', name, `${val.toPrecision(10).replace(/\.?0+e/, 'e')} ${unit}`, `#/reference/constants#c-${key}`, `${grp} ${key} constant`));
  REFERENCE_LIST.forEach(([id, t, d]) => add('Reference', t, d, `#/reference/${id}`, 'reference'));
  TOOLS_LIST.forEach(([id, t, d]) => add('Tool', t, d, id === 'calculators' ? '#/calculators' : id === 'solvers' ? '#/solvers' : id === 'sims' ? '#/sims' : toolHref(id), 'tool'));
  const topics = (sec, groups, url) => groups.forEach(g => g.items.forEach(s => { const it = parseItem(s); add('Topic', it.name, `${sec} › ${g.name}${it.url ? '' : ' (planned)'}`, it.url || url, '', it.url ? 0 : -3); }));
  topics('Physics', PHYSICS.groups, '#/physics');
  QUANTUM.areas.forEach(a => topics(`Quantum & Relativity › ${a.name}`, a.groups, '#/quantum'));
  topics('Mathematics', MATHS.groups, '#/maths');
  ENGINEERING.disciplines.forEach(d => topics(`Engineering › ${d.name}`, d.groups, `#/engineering/${d.id}`));
  return items;
}

export function search(q) {
  INDEX ??= build();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const ql = q.toLowerCase().trim();
  const scored = [];
  for (const it of INDEX) {
    let s = 0, ok = true;
    for (const w of words) {
      if (it.t.includes(w)) s += it.t.startsWith(w) ? 14 : 9;
      else if (it.hay.includes(w)) s += 3;
      else { ok = false; break; }
    }
    if (!ok) continue;
    if (it.t === ql) s += 60;
    else if (it.t.startsWith(ql)) s += 25;
    s += it.boost;
    scored.push([s, it]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  // de-duplicate by url+title
  const seen = new Set();
  return scored.map(x => x[1]).filter(it => { const k = it.type + it.url + it.t; if (seen.has(k)) return false; seen.add(k); return true; });
}

export function initSearch() {
  const pal = document.getElementById('palette');
  const input = document.getElementById('palInput');
  const res = document.getElementById('palRes');
  let sel = 0, links = [];

  const open = (q = '') => { pal.hidden = false; input.value = q; render(); setTimeout(() => input.focus(), 0); };
  const close = () => { pal.hidden = true; };
  window.physengSearch = open;

  function render() {
    const q = input.value.trim();
    if (!q) {
      res.innerHTML = `<div class="pal-empty">Search <b>${INDEX?.length || '1500+'}</b> calculators, equations, materials, constants, lessons and topics.<br><br>
        <span class="mono small">Try:</span> ${['reynolds', 'buckling', '6061', 'E=mc2', 'FL^3/48EI', 'black hole', 'three phase', 'psychrometrics', 'young modulus'].map(s => `<button class="chip" data-q="${esc(s)}">${esc(s)}</button>`).join(' ')}</div>`;
      res.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { input.value = b.dataset.q; render(); input.focus(); });
      links = [];
      return;
    }
    const hits = search(q);
    const eqs = matchEquation(q);
    let html = '';
    if (eqs.length) {
      const e = eqs[0];
      html += `<div class="pal-grp">Recognised equation</div><a class="pal-item pal-eq-hit" href="#/reference/equations/${e.id}"><span class="pt">${esc(e.name)}</span><span class="ps">${tex(e.tex)}</span><span class="pk">Equation</span></a>`;
    }
    const groups = {};
    hits.forEach(h => { (groups[h.type] ??= []).push(h); });
    ORDER.forEach(t => {
      const g = groups[t];
      if (!g) return;
      html += `<div class="pal-grp">${t}${g.length > 6 ? ` · ${g.length}` : ''}</div>` + g.slice(0, t === 'Topic' ? 5 : 6).map(h => `<a class="pal-item" href="${h.url}"><span class="pt">${esc(h.title)}</span><span class="ps">${esc(h.sub).slice(0, 140)}</span><span class="pk">${t}</span></a>`).join('');
    });
    res.innerHTML = html || `<div class="pal-empty">No matches for “${esc(q)}”. Try fewer words, or browse the <a href="#/content-map">content map</a>.</div>`;
    links = [...res.querySelectorAll('a.pal-item')];
    sel = 0;
    highlight();
  }
  function highlight() { links.forEach((l, i) => l.classList.toggle('sel', i === sel)); links[sel]?.scrollIntoView({ block: 'nearest' }); }

  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, links.length - 1); highlight(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); highlight(); e.preventDefault(); }
    else if (e.key === 'Enter' && links[sel]) { location.hash = links[sel].getAttribute('href'); close(); }
    else if (e.key === 'Escape') close();
  });
  res.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  pal.addEventListener('mousedown', e => { if (e.target === pal) close(); });
  document.getElementById('searchTrigger').addEventListener('click', () => open());
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if ((e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); open(); }
    if (e.key === 'Escape' && !pal.hidden) close();
  });
}
