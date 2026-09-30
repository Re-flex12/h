// PHYSENG application shell: hash router, global settings and search.
import { settings, setSetting } from './core/store.js';
import { renderTex, esc } from './core/format.js';
import { initSearch } from './search.js';
import * as sections from './pages/sections.js';
import * as calc from './pages/calc.js';
import * as ref from './pages/reference.js';
import * as tools from './pages/tools.js';
import * as solvers from './pages/solvers.js';
import * as solvers2 from './pages/solvers2.js';
import * as sims from './pages/sims.js';
import * as learn from './pages/learn.js';
import * as labs from './pages/labs.js';
import * as ws from './pages/workspace.js';
import * as tools2 from './pages/tools2.js';
import * as practice from './pages/practice.js';
import { PHYSENG } from './api.js';
window.PHYSENG = PHYSENG;

const ROUTES = [
  [/^$/, sections.home, ''],
  [/^learn$/, learn.index, 'learn'], [/^learn\/practice$/, practice.page, 'learn'], [/^learn\/labs$/, labs.index, 'learn'], [/^learn\/labs\/([\w-]+)$/, labs.lab, 'learn'], [/^learn\/([\w-]+)$/, learn.lesson, 'learn'],
  [/^physics$/, sections.physics, 'physics'],
  [/^quantum$/, sections.quantum, 'quantum'], [/^quantum\/circuit$/, tools2.quantumCircuit, 'quantum'],
  [/^engineering$/, sections.engineering, 'engineering'], [/^engineering\/([\w-]+)$/, sections.discipline, 'engineering'],
  [/^maths$/, sections.maths, 'maths'],
  [/^tools$/, sections.tools, 'tools'],
  [/^calculators$/, calc.library, 'tools'], [/^calc\/([\w-]+)$/, calc.page, 'tools'],
  [/^solvers$/, solvers.index, 'tools'], [/^solvers\/beam$/, solvers.beam, 'tools'], [/^solvers\/truss$/, solvers.truss, 'tools'], [/^solvers\/circuit$/, solvers2.circuit, 'tools'], [/^solvers\/pipe-network$/, solvers2.pipes, 'tools'], [/^solvers\/cycle$/, solvers2.cycle, 'tools'], [/^solvers\/vibration$/, solvers2.vibration, 'tools'], [/^solvers\/gear$/, solvers2.gear, 'tools'], [/^solvers\/([\w-]+)$/, solvers.planned, 'tools'],
  [/^sims$/, sims.index, 'tools'], [/^sims\/([\w-]+)$/, sims.page, 'tools'],
  [/^tools\/units$/, tools.units, 'tools'], [/^tools\/solver$/, tools.solver, 'tools'], [/^tools\/graph$/, tools.graph, 'tools'],
  [/^tools\/data$/, tools.data, 'tools'], [/^tools\/uncertainty$/, tools.uncertainty, 'tools'], [/^tools\/dimensions$/, tools.dimensions, 'tools'], [/^tools\/ask$/, tools2.ask, 'tools'], [/^tools\/fft$/, tools2.fftTool, 'tools'], [/^tools\/matrix$/, tools2.matrix, 'maths'], [/^tools\/numerics$/, tools2.numerics, 'maths'], [/^tools\/psychro$/, tools2.psychroChart, 'engineering'],
  [/^reference$/, sections.reference, 'reference'],
  [/^reference\/equations$/, ref.equations, 'reference'], [/^reference\/equations\/([\w-]+)$/, ref.equation, 'reference'],
  [/^reference\/constants$/, ref.constants, 'reference'], [/^reference\/materials$/, ref.materials, 'reference'], [/^reference\/materials\/([\w-]+)$/, ref.material, 'reference'],
  [/^reference\/compare$/, ref.compare, 'reference'], [/^reference\/fluids$/, ref.fluids, 'reference'], [/^reference\/steam$/, ref.steam, 'reference'], [/^reference\/refrigerants$/, ref.refrigerants, 'reference'], [/^reference\/sections$/, ref.sections, 'reference'], [/^reference\/tables$/, ref.tables, 'reference'], [/^reference\/standards$/, ref.standards, 'reference'], [/^reference\/api$/, ref.api, 'reference'],
  [/^workspace$/, ws.page, 'workspace'], [/^report$/, calc.report, 'workspace'],
  [/^content-map$/, sections.contentMap, ''], [/^about$/, sections.about, ''],
];

const main = document.getElementById('main');
let cleanup = null;
let lastPath = null;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [pathAndQ, anchor] = raw.split('#');
  const [path, qs] = pathAndQ.split('?');
  return { path: path.replace(/\/$/, ''), query: new URLSearchParams(qs || ''), anchor };
}

export function route() {
  const { path, query, anchor } = parseHash();
  if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
  let found = false;
  for (const [re, fn, sec] of ROUTES) {
    const m = path.match(re);
    if (!m) continue;
    found = true;
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.dataset.sec === sec));
    try {
      const r = fn(main, m.slice(1), query);
      if (typeof r === 'function') cleanup = r;
    } catch (e) {
      console.error(e);
      main.innerHTML = `<div class="msg bad"><b>Something went wrong rendering this page.</b><br><code>${esc(e.message)}</code></div>`;
    }
    break;
  }
  if (!found) main.innerHTML = `<div class="page-head"><span class="code">404</span><h1>Not found</h1><p class="lede">No page at <code>#/${esc(path)}</code>. Try the search (<kbd>/</kbd>) or the <a href="#/content-map">content map</a>.</p></div>`;
  const title = main.querySelector('h1')?.textContent;
  document.title = title && path ? `${title} — PHYSENG` : 'PHYSENG — Physics & Engineering Toolkit';
  if (path !== lastPath) {
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ block: 'start' }), 30);
    else window.scrollTo(0, 0);
    lastPath = path;
  }
  document.getElementById('nav').classList.remove('open');
}

function initControls() {
  const lv = document.getElementById('levelSel'), un = document.getElementById('unitSel');
  lv.value = settings.level; un.value = settings.units;
  lv.onchange = () => { setSetting('level', lv.value); route(); };
  un.onchange = () => { setSetting('units', un.value); route(); };
  const applyTheme = () => { document.documentElement.dataset.theme = settings.theme; };
  applyTheme();
  document.getElementById('themeBtn').onclick = () => { setSetting('theme', settings.theme === 'dark' ? 'light' : 'dark'); applyTheme(); };
  const nav = document.getElementById('nav'), mb = document.getElementById('menuBtn');
  mb.onclick = () => { nav.classList.toggle('open'); mb.setAttribute('aria-expanded', nav.classList.contains('open')); };
  // Mobile copies of the level/unit controls inside the menu.
  const mob = document.createElement('div');
  mob.className = 'mob-ctl';
  mob.innerHTML = `<label class="ctl" style="display:flex">Level <select id="levelSelM">${lv.innerHTML}</select></label><label class="ctl" style="display:flex">Units <select id="unitSelM">${un.innerHTML}</select></label>`;
  nav.appendChild(mob);
  const lvm = mob.querySelector('#levelSelM'), unm = mob.querySelector('#unitSelM');
  lvm.value = settings.level; unm.value = settings.units;
  lvm.onchange = () => { lv.value = lvm.value; lv.onchange(); };
  unm.onchange = () => { un.value = unm.value; un.onchange(); };
}

initControls();
initSearch();
window.addEventListener('hashchange', route);
route();
// KaTeX is loaded with `defer`; re-render math once it is available.
(function waitKatex(n = 0) {
  if (window.katex) { renderTex(document.body); return; }
  if (n < 100) setTimeout(() => waitKatex(n + 1), 100);
})();
