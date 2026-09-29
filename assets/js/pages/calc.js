import { CALCS, CALC, DISCIPLINES } from '../calcs/index.js';
import { pickerOptions, pickerRecord } from '../calcs/_h.js';
import { DIMS, defaultUnit, toSI, fromSI, siUnit, unitsOf } from '../core/units.js';
import { fmt, num, esc, T, tex, toast, debounce, renderTex } from '../core/format.js';
import { compile } from '../core/expr.js';
import { plotSVG, legend } from '../core/plot.js';
import { settings, pushHistory, getProjects, createProject, addToProject, toggleFav, isFav } from '../core/store.js';
import { VALIDATION } from '../data/validation.js';
import { EQ } from '../data/equations.js';
import { LESSON } from '../data/lessons.js';
import { crumbs, calcTile, levelBadge, SIMS, SOLVERS, LEVEL_NAME } from './common.js';

const VERSION = '1.0';

// ── Share-state encoding ───────────────────────────────────────
export function encodeState(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
export function decodeState(s) { try { return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { return null; } }

// ── Library ─────────────────────────────────────────────────────
export function library(main, _, query) {
  const st = { disc: query.get('d') || 'all', level: query.get('l') || 'all', q: query.get('q') || '' };
  const discs = Object.entries(DISCIPLINES).filter(([k]) => CALCS.some(c => c.disc === k));
  main.innerHTML = `${crumbs([['Tools', '#/tools'], ['Calculators']])}
    <header class="page-head"><span class="code">06 / TLS / CALC</span><h1>Calculator Library</h1><p class="lede">${CALCS.length} calculators. Each states its equations, assumptions, limitations and sources, works in SI, metric-engineering or imperial units, and exports a calculation sheet.</p></header>
    <div class="toolbar"><input class="filter-in" id="cq" placeholder="Filter calculators…" value="${esc(st.q)}"><div class="chips" id="lv">${['all', 'school', 'uni', 'pro'].map(l => `<button class="chip${st.level === l ? ' on' : ''}" data-l="${l}">${l === 'all' ? 'All levels' : LEVEL_NAME[l]}</button>`).join('')}</div></div>
    <div class="chips mb" id="dc"><button class="chip${st.disc === 'all' ? ' on' : ''}" data-d="all">All · ${CALCS.length}</button>${discs.map(([k, d]) => `<button class="chip${st.disc === k ? ' on' : ''}" data-d="${k}">${d.code} ${esc(d.name)} · ${CALCS.filter(c => c.disc === k).length}</button>`).join('')}</div>
    <div class="grid auto" id="cl"></div>`;
  const draw = () => {
    const q = st.q.toLowerCase();
    const list = CALCS.filter(c => (st.disc === 'all' || c.disc === st.disc) && (st.level === 'all' || c.level === st.level) && (!q || `${c.title} ${c.summary} ${c.tags.join(' ')}`.toLowerCase().includes(q)));
    main.querySelector('#cl').innerHTML = list.map(calcTile).join('') || '<div class="empty">No calculators match.</div>';
  };
  main.querySelector('#cq').oninput = e => { st.q = e.target.value; draw(); };
  main.querySelectorAll('#lv .chip').forEach(b => b.onclick = () => { st.level = b.dataset.l; main.querySelectorAll('#lv .chip').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  main.querySelectorAll('#dc .chip').forEach(b => b.onclick = () => { st.disc = b.dataset.d; main.querySelectorAll('#dc .chip').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  draw();
}

// ── Calculator page ─────────────────────────────────────────────
export function page(main, [id], query) {
  const c = CALC[id];
  if (!c) { main.innerHTML = `${crumbs([['Calculators', '#/calculators']])}<h1>Unknown calculator</h1>`; return; }
  const disc = DISCIPLINES[c.disc];
  const sys = settings.units;
  const hasAdv = c.inputs.some(i => i.adv) || c.outputs.some(o => o.adv);
  const st = { v: {}, u: {}, ou: {}, mode: settings.level === 'school' ? 'basic' : 'advanced', pick: {} };
  c.inputs.forEach(i => {
    st.v[i.k] = i.def;
    if (i.type === 'number') st.u[i.k] = defaultUnit(i.dim, sys, i.u);
    if (i.fill) st.pick[i.k] = i.def;
  });
  c.inputs.filter(i => i.fill).forEach(i => applyPicker(i, i.def, false));
  c.outputs.forEach(o => { if (o.type !== 'text') st.ou[o.k] = defaultUnit(o.dim, sys, o.u); });
  const shared = query.get('s') && decodeState(query.get('s'));
  if (shared) {
    Object.assign(st.v, shared.v || {});
    Object.entries(shared.u || {}).forEach(([k, u]) => { const i = c.inputs.find(x => x.k === k); if (i && DIMS[i.dim]?.units[u] !== undefined) st.u[k] = u; });
    if (shared.m) st.mode = shared.m;
    c.inputs.filter(i => i.fill).forEach(i => { st.pick[i.k] = shared.v?.[i.k] ?? st.pick[i.k]; });
  }
  // Deep links from the materials/fluids databases: #/calc/id?mat=al-6061-t6 or ?fluid=water60
  [['material', query.get('mat')], ['fluid', query.get('fluid')]].forEach(([type, val]) => {
    if (val) c.inputs.filter(i => i.type === type).forEach(i => applyPicker(i, val, false));
  });

  function applyPicker(inp, val, redraw = true) {
    st.pick[inp.k] = val;
    st.v[inp.k] = val;
    if (val === '__custom') return;
    const rec = pickerRecord(inp.type, val);
    if (!rec) return;
    const missing = [];
    Object.entries(inp.fill).forEach(([k, p]) => { if (rec[p] != null) st.v[k] = rec[p]; else missing.push(k); });
    st.missing = missing;
    if (redraw) Object.keys(inp.fill).forEach(k => syncField(k));
  }

  const vb = VALIDATION[id];
  main.innerHTML = `${crumbs([['Calculators', '#/calculators'], [disc?.name || c.disc, disc?.section === 'quantum' ? '#/quantum' : disc?.section === 'physics' ? '#/physics' : `#/calculators?d=${c.disc}`], [c.title]])}
  <header class="page-head${disc?.section === 'quantum' ? ' qr' : ''}">
    <span class="code">${esc(disc?.code || '')} · ${esc(disc?.name || '')} · CALC v${VERSION}</span>
    <h1>${esc(c.title)}</h1>
    <p class="lede">${esc(c.summary)}</p>
    <div class="chips mt">${levelBadge(c.level)}${vb ? `<span class="badge live" title="Automated reference checks">✓ Validated · ${vb.length} reference case${vb.length > 1 ? 's' : ''}</span>` : ''}<span class="badge plan">Units: ${sys === 'si' ? 'SI' : sys === 'metric' ? 'Metric eng.' : 'Imperial'}</span></div>
  </header>
  <div class="toolbar noprint">
    ${hasAdv ? `<div class="mode-switch" role="group" aria-label="Mode"><button data-m="basic">Basic</button><button data-m="advanced">Advanced</button></div>` : ''}
    <span class="grow"></span>
    <button class="btn ghost sm" id="aFav">${isFav('calc:' + id) ? '★ Saved' : '☆ Favourite'}</button>
    <button class="btn ghost sm" id="aShare">Share link</button>
    <button class="btn ghost sm" id="aSave">Save to project</button>
    <button class="btn sm" id="aReport">Calculation sheet / PDF</button>
  </div>
  <div id="saveBox" class="panel mb" hidden></div>
  <div class="calc">
    <section class="panel tick" aria-label="Inputs"><div class="panel-title"><h4>Inputs</h4><button class="btn ghost sm" id="aReset">Reset</button></div><div id="ins"></div></section>
    <section class="panel" aria-label="Results"><div class="panel-title"><h4>Results</h4><span class="mono small muted" id="status"></span></div><div class="readouts" id="outs"></div><div id="msgs"></div><div id="viz" class="mt"></div></section>
  </div>
  <div class="tabs" role="tablist">${['Equations', 'Assumptions & limits', 'Units (SI working)', 'Sources & validation', 'Related'].map((t, i) => `<button data-t="${i}" class="${i ? '' : 'on'}">${t}</button>`).join('')}</div>
  <div class="tabpanes" id="tabs"></div>`;

  const ins = main.querySelector('#ins'), outs = main.querySelector('#outs');

  // Inputs
  ins.innerHTML = c.inputs.map(i => {
    const hint = i.hint ? `<div class="hint">${esc(i.hint)}</div>` : '';
    const sym = i.sym ? `<span class="sym">${T(i.sym)}</span>` : '';
    if (i.type === 'select') return `<div class="field" data-k="${i.k}"><label for="f-${i.k}"><span>${esc(i.label)}</span></label><div class="in"><select id="f-${i.k}">${i.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></div>${hint}</div>`;
    if (i.fill) return `<div class="field" data-k="${i.k}"><label for="f-${i.k}"><span>${esc(i.label)}</span><a class="small" href="${i.type === 'material' ? '#/reference/materials' : '#/reference/fluids'}" style="text-transform:none">database →</a></label><div class="in"><select id="f-${i.k}">${pickerOptions(i.type).map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}<option value="__custom">— Custom values —</option></select></div>${hint}</div>`;
    if (i.type === 'text') return `<div class="field" data-k="${i.k}"><label for="f-${i.k}"><span>${esc(i.label)}</span></label>${i.multiline ? `<textarea class="plain" id="f-${i.k}" spellcheck="false"></textarea>` : `<div class="in"><input id="f-${i.k}" spellcheck="false"></div>`}${hint}</div>`;
    const units = unitsOf(i.dim);
    const unitCtl = i.dim === 'none' ? (st.u[i.k] ? `<select class="unit" id="u-${i.k}">${units.map(u => `<option value="${esc(u)}">${esc(u || '—')}</option>`).join('')}</select>` : '') : units.length > 1 ? `<select class="unit" id="u-${i.k}" aria-label="Unit">${units.map(u => `<option value="${esc(u)}">${esc(u)}</option>`).join('')}</select>` : `<span class="unit-fixed">${esc(units[0])}</span>`;
    return `<div class="field" data-k="${i.k}"><label for="f-${i.k}"><span>${esc(i.label)}</span>${sym}</label><div class="in"><input id="f-${i.k}" inputmode="decimal" autocomplete="off" spellcheck="false">${unitCtl}</div>${hint}</div>`;
  }).join('');

  function syncField(k) {
    const i = c.inputs.find(x => x.k === k), el = main.querySelector(`#f-${k}`);
    if (!i || !el) return;
    if (i.type === 'number') {
      const u = main.querySelector(`#u-${k}`);
      if (u) u.value = st.u[k] ?? '';
      el.value = num(fromSI(st.v[k], i.dim, st.u[k]));
    } else if (i.fill) el.value = st.pick[k];
    else el.value = st.v[k];
  }
  c.inputs.forEach(i => syncField(i.k));

  c.inputs.forEach(i => {
    const el = main.querySelector(`#f-${i.k}`);
    if (i.type === 'number') {
      el.addEventListener('input', () => {
        let val = Number(el.value.replace(/,/g, '').replace(/−/g, '-'));
        if (!Number.isFinite(val) && el.value.trim()) { try { val = compile(el.value).f({}); } catch (e) { val = NaN; } }
        el.closest('.field').classList.toggle('invalid', !Number.isFinite(val));
        if (Number.isFinite(val)) st.v[i.k] = toSI(val, i.dim, st.u[i.k]);
        else st.v[i.k] = NaN;
        c.inputs.filter(p => p.fill && Object.keys(p.fill).includes(i.k)).forEach(p => { st.pick[p.k] = '__custom'; st.v[p.k] = '__custom'; main.querySelector(`#f-${p.k}`).value = '__custom'; });
        run();
      });
      const u = main.querySelector(`#u-${i.k}`);
      if (u) u.addEventListener('change', () => { st.u[i.k] = u.value; syncField(i.k); run(); });
    } else if (i.fill) {
      el.addEventListener('change', () => { applyPicker(i, el.value); run(); });
    } else {
      el.addEventListener(i.type === 'select' ? 'change' : 'input', () => { st.v[i.k] = el.value; visibility(); run(); });
    }
  });

  // Outputs
  outs.innerHTML = c.outputs.map(o => {
    const sym = o.sym ? `<span class="sym">${T(o.sym)}</span>` : '';
    let unitCtl = '';
    if (o.type !== 'text') {
      const units = unitsOf(o.dim);
      if (o.dim === 'none') unitCtl = st.ou[o.k] === '%' ? '<span class="u">%</span>' : o.note ? `<span class="u">${esc(o.note)}</span>` : '';
      else if (units.length > 1) unitCtl = `<select data-ou="${o.k}" aria-label="Output unit">${units.map(u => `<option value="${esc(u)}"${u === st.ou[o.k] ? ' selected' : ''}>${esc(u)}</option>`).join('')}</select>`;
      else unitCtl = `<span class="u">${esc(units[0])}</span>`;
      if (o.note && o.dim !== 'none') unitCtl += `<span class="u">${esc(o.note)}</span>`;
    }
    return `<div class="readout${o.primary ? ' primary' : ''}" data-o="${o.k}"><div class="rl">${esc(o.label)}${sym}</div><div class="rv${o.type === 'text' ? ' txt' : ''}"><span class="val">—</span>${unitCtl}</div></div>`;
  }).join('');
  outs.querySelectorAll('select[data-ou]').forEach(s => s.addEventListener('change', () => { st.ou[s.dataset.ou] = s.value; run(); }));

  // Mode
  const setMode = m => { st.mode = m; main.querySelectorAll('.mode-switch button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); visibility(); };
  main.querySelectorAll('.mode-switch button').forEach(b => b.onclick = () => setMode(b.dataset.m));

  function visibility() {
    c.inputs.forEach(i => {
      const f = main.querySelector(`.field[data-k="${i.k}"]`);
      const show = (!i.adv || st.mode === 'advanced') && (!i.showIf || i.showIf(st.v));
      if (f) f.hidden = !show;
    });
    c.outputs.forEach(o => { const r = outs.querySelector(`[data-o="${o.k}"]`); if (r) r.hidden = !!o.adv && st.mode !== 'advanced'; });
  }

  let last = null;
  const saveHist = debounce(() => { if (last) pushHistory({ calc: id, title: c.title, inputs: { ...st.v }, units: { ...st.u }, result: primarySummary() }, 2500); }, 2500);

  function primarySummary() {
    const o = c.outputs.find(x => x.primary) || c.outputs[0];
    if (!last) return '';
    const v = last[o.k];
    return o.type === 'text' ? `${o.label}: ${v}` : `${o.label}: ${fmt(fromSI(v, o.dim, st.ou[o.k]))} ${st.ou[o.k] || o.note || ''}`.trim();
  }

  function run() {
    const status = main.querySelector('#status'), msgs = main.querySelector('#msgs'), viz = main.querySelector('#viz');
    const bad = c.inputs.filter(i => i.type === 'number' && !Number.isFinite(st.v[i.k]) && (!i.showIf || i.showIf(st.v)));
    if (bad.length) { status.textContent = 'INVALID INPUT'; msgs.innerHTML = `<div class="msg bad">Check: ${bad.map(i => esc(i.label)).join(', ')}.</div>`; return; }
    let r;
    try { r = c.compute({ ...st.v }); } catch (e) { status.textContent = 'ERROR'; msgs.innerHTML = `<div class="msg bad">${esc(e.message)}</div>`; return; }
    last = r;
    status.textContent = `OK · ${new Date().toLocaleTimeString()}`;
    c.outputs.forEach(o => {
      const el = outs.querySelector(`[data-o="${o.k}"] .val`);
      const v = r[o.k];
      el.textContent = o.type === 'text' ? (v ?? '—') : (typeof v === 'number' ? fmt(fromSI(v, o.dim, st.ou[o.k]), 5) : '—');
    });
    let m = '';
    (st.missing || []).forEach(k => { const i = c.inputs.find(x => x.k === k); m += `<div class="msg warn">The selected entry has no value for “${esc(i?.label || k)}” — using the value shown; enter your own.</div>`; });
    (r._checks || []).forEach(ch => { m += `<div class="check ${ch.pass ? 'pass' : 'fail'}"><span class="st">${ch.pass ? 'PASS' : 'FAIL'}</span><span>${esc(ch.label)}</span><span class="muted">${esc(ch.detail || '')}</span></div>`; });
    (r._warn || []).forEach(w => { m += `<div class="msg warn">${esc(w)}</div>`; });
    (r._info || []).forEach(w => { m += `<div class="msg info">${esc(w)}</div>`; });
    msgs.innerHTML = m;
    const plots = r._plot ? (Array.isArray(r._plot) ? r._plot : [r._plot]) : [];
    viz.innerHTML = (r._svg || '') + plots.map(pl => (pl.title ? `<h4 class="mt">${esc(pl.title)}</h4>` : '') + plotSVG(pl.series, pl.opts) + legend(pl.series)).join('');
    drawSIUnits();
    saveHist();
  }

  // Tabs
  const tabs = main.querySelector('#tabs');
  const rel = c.related || {};
  const panes = [
    () => `${c.eq.map(e => `<div class="eqblock">${T(e, true)}</div>`).join('')}${(rel.eqs || []).length ? `<p class="small">Equation library: ${rel.eqs.map(e => `<a href="#/reference/equations/${e}">${esc(EQ[e]?.name || e)}</a>`).join(' · ')}</p>` : ''}`,
    () => `<div class="split"><div><h4>Assumptions</h4><ul class="list mt">${c.assume.map(a => `<li>${esc(a)}</li>`).join('') || '<li>None beyond the equations shown.</li>'}</ul></div><div><h4>Limitations & applicable range</h4><ul class="list mt">${c.limits.map(a => `<li>${esc(a)}</li>`).join('') || '<li>—</li>'}</ul></div></div>`,
    () => '<div id="siTbl"></div>',
    () => `<h4>Sources</h4><ul class="list mt">${c.refs.map(a => `<li>${esc(a)}</li>`).join('') || '<li>Standard textbook relations.</li>'}${c.inputs.some(i => i.type === 'material') ? '<li>Material properties: see the <a href="#/reference/materials">Materials Database</a> (basis and sources per entry).</li>' : ''}</ul>
      <h4 class="mt2">Validation</h4>${vb ? `<table class="tbl mt"><thead><tr><th>Reference case</th><th>Checked outputs</th><th>Tolerance</th></tr></thead><tbody>${vb.map(cs => `<tr><td>${esc(cs.source)}</td><td>${Object.keys(cs.expect).map(k => esc(c.outputs.find(o => o.k === k)?.label || k)).join(', ')}</td><td class="num">${Object.values(cs.expect).map(([, t]) => `${(t * 100).toPrecision(2)} %`).join(', ')}</td></tr>`).join('')}</tbody></table><p class="small muted">Run automatically by the test suite on every change.</p>` : '<p class="muted mt">No dedicated reference case yet; the calculator is covered by the general suite (finite results from defaults; equations cross-checked with the equation library).</p>'}
      <p class="small muted mt">Calculator version ${VERSION} · engine computes in SI (IEEE-754 double precision).</p>`,
    () => {
      const items = [];
      if (rel.learn) items.push(`<a class="tile" href="#/learn/${rel.learn}"><span class="k">Learn</span><span class="t">${esc(LESSON[rel.learn]?.title || rel.learn)}</span><span class="go">Lesson →</span></a>`);
      if (rel.sim) items.push(`<a class="tile" href="#/sims/${rel.sim}"><span class="k">Simulate</span><span class="t">${esc(SIMS[rel.sim]?.title)}</span><span class="go">Run →</span></a>`);
      if (rel.solver) items.push(`<a class="tile" href="#/solvers/${rel.solver}"><span class="k">Solve</span><span class="t">${esc(SOLVERS[rel.solver]?.title)}</span><span class="go">Open →</span></a>`);
      if (rel.calc) items.push(calcTile(CALC[rel.calc]));
      const same = CALCS.filter(x => x.disc === c.disc && x.id !== id).slice(0, 6).map(calcTile);
      return `<div class="grid auto">${items.join('')}${same.join('')}</div>`;
    },
  ];
  const showTab = n => { main.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', +b.dataset.t === n)); tabs.innerHTML = `<div>${panes[n]()}</div>`; if (n === 2) drawSIUnits(); };
  main.querySelectorAll('.tabs button').forEach(b => b.onclick = () => showTab(+b.dataset.t));
  showTab(0);

  function drawSIUnits() {
    const box = main.querySelector('#siTbl');
    if (!box) return;
    const rows = c.inputs.filter(i => i.type === 'number' && (!i.showIf || i.showIf(st.v))).map(i => `<tr><td>${esc(i.label)}</td><td class="num">${esc(fmt(fromSI(st.v[i.k], i.dim, st.u[i.k]), 6))} ${esc(st.u[i.k] || '')}</td><td class="num">${esc(fmt(st.v[i.k], 6))} ${esc(siUnit(i.dim))}</td></tr>`).join('');
    const orows = last ? c.outputs.filter(o => o.type !== 'text').map(o => `<tr><td>${esc(o.label)}</td><td class="num">${esc(fmt(fromSI(last[o.k], o.dim, st.ou[o.k]), 6))} ${esc(st.ou[o.k] || '')}</td><td class="num">${esc(fmt(last[o.k], 6))} ${esc(siUnit(o.dim))}</td></tr>`).join('') : '';
    box.innerHTML = `<p class="muted small">All inputs are converted to coherent SI before the equations are evaluated, then converted back for display.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Quantity</th><th class="num">As entered / displayed</th><th class="num">SI value used</th></tr></thead><tbody><tr><td colspan="3"><b>Inputs</b></td></tr>${rows}<tr><td colspan="3"><b>Results</b></td></tr>${orows}</tbody></table></div>`;
  }

  // Actions
  main.querySelector('#aReset').onclick = () => { location.hash = `#/calc/${id}`; if (!query.get('s')) page(main, [id], new URLSearchParams()); };
  main.querySelector('#aFav').onclick = e => { const on = toggleFav('calc:' + id); e.target.textContent = on ? '★ Saved' : '☆ Favourite'; toast(on ? 'Added to favourites' : 'Removed from favourites'); };
  main.querySelector('#aShare').onclick = () => {
    const url = `${location.href.split("#")[0]}#/calc/${id}?s=${encodeState({ v: st.v, u: st.u, m: st.mode })}`;
    (navigator.clipboard?.writeText(url) || Promise.reject()).then(() => toast('Share link copied'), () => prompt('Copy this link:', url));
  };
  main.querySelector('#aSave').onclick = () => {
    const box = main.querySelector('#saveBox');
    const projects = getProjects();
    box.hidden = !box.hidden;
    box.innerHTML = `<div class="toolbar" style="margin:0"><h4>Save to project</h4><select class="plain" id="pSel" style="max-width:280px">${projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}<option value="__new">+ New project…</option></select><input class="plain" id="pNew" placeholder="New project name" style="max-width:260px" ${projects.length ? 'hidden' : ''}><input class="plain" id="pNote" placeholder="Note (e.g. 'Rear axle, rev B')" style="max-width:300px"><button class="btn sm" id="pGo">Save</button></div>`;
    const sel = box.querySelector('#pSel'), nw = box.querySelector('#pNew');
    if (!projects.length) sel.value = '__new';
    sel.onchange = () => { nw.hidden = sel.value !== '__new'; };
    box.querySelector('#pGo').onclick = () => {
      let pid = sel.value;
      if (pid === '__new') { const name = nw.value.trim() || 'Untitled project'; pid = createProject(name).id; }
      addToProject(pid, { kind: 'calc', calc: id, title: c.title, note: box.querySelector('#pNote').value, inputs: { ...st.v }, units: { ...st.u }, mode: st.mode, result: primarySummary() });
      box.hidden = true;
      toast('Saved to project');
    };
  };
  main.querySelector('#aReport').onclick = () => {
    if (!last) return;
    const payload = {
      id, title: c.title, disc: disc?.name, version: VERSION, date: new Date().toISOString(), units: sys,
      inputs: c.inputs.filter(i => (!i.showIf || i.showIf(st.v))).map(i => i.type === 'number'
        ? { label: i.label, sym: i.sym, value: fmt(fromSI(st.v[i.k], i.dim, st.u[i.k]), 6), unit: st.u[i.k], si: `${fmt(st.v[i.k], 6)} ${siUnit(i.dim)}` }
        : { label: i.label, value: i.fill ? (pickerOptions(i.type).find(o => o[0] === st.pick[i.k])?.[1] || 'Custom values') : i.type === 'select' ? i.options.find(o => o[0] === st.v[i.k])?.[1] : String(st.v[i.k]) }),
      outputs: c.outputs.filter(o => !o.adv || st.mode === 'advanced').map(o => ({ label: o.label, sym: o.sym, value: o.type === 'text' ? last[o.k] : fmt(fromSI(last[o.k], o.dim, st.ou[o.k]), 5), unit: o.type === 'text' ? '' : (st.ou[o.k] || o.note || ''), primary: o.primary })),
      eq: c.eq, assume: c.assume, limits: c.limits, refs: c.refs, warn: last._warn || [], info: last._info || [], checks: last._checks || [],
      validation: (vb || []).map(v => v.source), viz: (last._svg || '') + (last._plot ? (Array.isArray(last._plot) ? last._plot : [last._plot]).map(pl => plotSVG(pl.series, pl.opts)).join('') : ''),
      share: `${location.href.split("#")[0]}#/calc/${id}?s=${encodeState({ v: st.v, u: st.u, m: st.mode })}`,
    };
    try { sessionStorage.setItem('physeng.report', JSON.stringify(payload)); } catch (e) { /* ignore */ }
    window.__physengReport = payload;
    location.hash = '#/report';
  };

  setMode(st.mode);
  run();
}

// ── Calculation sheet ───────────────────────────────────────────
export function report(main) {
  let p = window.__physengReport;
  if (!p) { try { p = JSON.parse(sessionStorage.getItem('physeng.report')); } catch (e) { p = null; } }
  if (!p) { main.innerHTML = `${crumbs([['Report']])}<div class="empty">No calculation to report. Open a calculator and press “Calculation sheet / PDF”.</div>`; return; }
  const d = new Date(p.date);
  main.innerHTML = `<div class="toolbar noprint">${crumbs([['Calculators', '#/calculators'], [p.title, `#/calc/${p.id}`], ['Calculation sheet']])}<span class="grow"></span><a class="btn ghost sm" href="${esc(p.share)}">← Back to calculator</a><button class="btn sm" onclick="window.print()">Print / Save as PDF</button></div>
  <p class="muted small noprint">Fields with a dashed outline are editable before printing.</p>
  <article class="report">
    <div style="display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:3px solid #111;padding-bottom:12px">
      <div><div style="font-family:var(--mono);font-size:11px;letter-spacing:.12em">PHYSENG · CALCULATION SHEET</div><h1>${esc(p.title)}</h1><div style="font-size:13px;color:#444">${esc(p.disc || '')}</div></div>
      <div style="font-family:var(--mono);font-size:11px;text-align:right">Calc v${esc(p.version)}<br>${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}<br>Units: ${esc(p.units)}</div>
    </div>
    <div class="meta">${['Project', 'Reference / item', 'Prepared by', 'Checked by'].map(l => `<div>${l}: <span contenteditable="true" style="outline:1px dashed #bbb;padding:0 4px;min-width:120px;display:inline-block">&nbsp;</span></div>`).join('')}</div>
    <h2>1. Inputs</h2><table><tbody>${p.inputs.map(i => `<tr><td>${esc(i.label)}</td><td>${i.sym ? tex(i.sym) : ''}</td><td class="num">${esc(i.value)} ${esc(i.unit || '')}</td><td class="num" style="color:#666">${esc(i.si || '')}</td></tr>`).join('')}</tbody></table>
    <h2>2. Assumptions</h2><ul>${p.assume.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
    <h2>3. Equations</h2>${p.eq.map(e => `<div style="margin:6px 0">${tex(e, true)}</div>`).join('')}
    <h2>4. Results</h2><table><tbody>${p.outputs.map(o => `<tr${o.primary ? ' style="font-weight:700"' : ''}><td>${esc(o.label)}</td><td>${o.sym ? tex(o.sym) : ''}</td><td class="num">${esc(o.value)} ${esc(o.unit)}</td></tr>`).join('')}</tbody></table>
    ${p.checks.length ? `<h2>5. Checks</h2><table><tbody>${p.checks.map(c => `<tr><td>${esc(c.label)}</td><td class="num" style="color:${c.pass ? '#0a7a3a' : '#b00'}">${c.pass ? 'PASS' : 'FAIL'}</td><td>${esc(c.detail || '')}</td></tr>`).join('')}</tbody></table>` : ''}
    ${p.warn.length || p.info.length ? `<h2>Notes & warnings</h2><ul>${[...p.warn, ...p.info].map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
    ${p.viz ? `<div style="margin-top:14px">${p.viz}</div>` : ''}
    <h2>Limitations</h2><ul>${p.limits.map(a => `<li>${esc(a)}</li>`).join('') || '<li>—</li>'}</ul>
    <h2>References</h2><ul>${p.refs.map(a => `<li>${esc(a)}</li>`).join('') || '<li>Standard textbook relations.</li>'}</ul>
    ${p.validation.length ? `<p style="font-size:12px">Validated against: ${p.validation.map(esc).join('; ')}.</p>` : ''}
    <div class="disc-note">Generated by PHYSENG for education and preliminary design. This is not a certified engineering analysis. Verify inputs, assumptions and results, and apply the governing code/standard before use. Reproduce this calculation: <span style="word-break:break-all">${esc(p.share)}</span></div>
  </article>`;
  renderTex(main);
}
