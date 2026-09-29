import { EQUATIONS, EQ } from '../data/equations.js';
import { CONSTANTS } from '../data/constants.js';
import { MATERIALS, PROPS, DERIVED, getMaterial } from '../data/materials.js';
import { WATER_TABLE, AIR_TABLE, FLUIDS, GASES, ROUGHNESS, psatIF97 } from '../data/fluids.js';
import { steamPT, satP, satT, dome, steamPS } from '../data/if97.js';
import { THREADS, BOLT_CLASSES, PIPES, KFACTORS, STANDARDS } from '../data/reference.js';
import { CALC, CALCS, DISCIPLINES } from '../calcs/index.js';
import { LESSON } from '../data/lessons.js';
import { DIMS, defaultUnit, toSI, fromSI, unitsOf, siUnit } from '../core/units.js';
import { compile, solveRoot } from '../core/expr.js';
import { fmt, num, esc, T, toast, renderTex } from '../core/format.js';
import { plotSVG, legend, COLORS } from '../core/plot.js';
import { settings, toggleFav, isFav } from '../core/store.js';
import { crumbs, pageHead, calcTile } from './common.js';

const TOPIC_NAME = { mechanics: 'Mechanics', mechanical: 'Mechanical design', structural: 'Solid mechanics & structures', fluids: 'Fluid mechanics', thermo: 'Thermodynamics & heat transfer', electrical: 'Electrical & electromagnetism', waves: 'Waves & optics', nuclear: 'Nuclear physics', quantum: 'Quantum physics', relativity: 'Relativity & cosmology', maths: 'Mathematics' };

// ── Solve-for-any-variable widget ───────────────────────────────
export function solverWidget(el, e) {
  if (!e.f) { el.innerHTML = `<div class="msg info">${esc(e.note || 'This equation is shown for reference and is not numerically solvable here.')}</div>`; return; }
  const c = compile(e.f);
  const sys = settings.units;
  const st = { unknown: e.v[0][0], v: Object.fromEntries(e.v.map(x => [x[0], x[4]])), u: Object.fromEntries(e.v.map(x => [x[0], defaultUnit(x[2], sys)])) };
  el.innerHTML = `<div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>Solve for</th><th>Variable</th><th>Value</th><th>Unit</th></tr></thead><tbody>${e.v.map(([k, label, dim, sym]) => {
    const us = unitsOf(dim);
    return `<tr data-k="${k}"><td><input type="radio" name="unk" value="${k}" ${k === st.unknown ? 'checked' : ''} aria-label="Solve for ${esc(label)}"></td><td>${T(sym)} <span class="muted small">${esc(label)}</span></td><td><input class="plain" data-v="${k}" inputmode="decimal" style="min-width:110px"></td><td>${dim === 'none' ? '<span class="muted">—</span>' : us.length > 1 ? `<select class="plain" data-u="${k}" style="min-width:90px">${us.map(u => `<option${u === st.u[k] ? ' selected' : ''}>${esc(u)}</option>`).join('')}</select>` : esc(us[0])}</td></tr>`;
  }).join('')}</tbody></table></div><div id="solveMsg" class="mt"></div>`;
  const sync = k => { const [, , dim] = e.v.find(x => x[0] === k); el.querySelector(`[data-v="${k}"]`).value = num(fromSI(st.v[k], dim, st.u[k])); };
  e.v.forEach(([k]) => sync(k));
  const solve = () => {
    el.querySelectorAll('tbody tr').forEach(tr => { const on = tr.dataset.k === st.unknown; tr.style.background = on ? 'var(--acc-soft)' : ''; tr.querySelector('[data-v]').readOnly = on; });
    const k = st.unknown;
    const r = solveRoot(x => c.f({ ...st.v, [k]: x }), st.v[k] || 1);
    const msg = el.querySelector('#solveMsg');
    if (!Number.isFinite(r)) { msg.innerHTML = '<div class="msg bad">No real solution found for these values.</div>'; return; }
    st.v[k] = r; sync(k);
    const [, label, dim] = e.v.find(x => x[0] === k);
    msg.innerHTML = `<div class="readout primary" style="border-top:1px solid var(--line)"><div class="rl">${esc(label)}</div><div class="rv">${esc(fmt(fromSI(r, dim, st.u[k]), 6))}<span class="u">${esc(dim === 'none' ? '' : st.u[k])}</span></div></div><p class="small muted">Solved numerically (Newton–Raphson with bracketing fallback) for the root nearest the previous value. Non-linear equations may have other roots.</p>`;
  };
  el.querySelectorAll('input[name="unk"]').forEach(r => r.onchange = () => { st.unknown = r.value; solve(); });
  el.querySelectorAll('[data-v]').forEach(inp => inp.oninput = () => {
    const k = inp.dataset.v, [, , dim] = e.v.find(x => x[0] === k);
    let val = Number(inp.value);
    if (!Number.isFinite(val)) { try { val = compile(inp.value).f({}); } catch (er) { val = NaN; } }
    if (Number.isFinite(val)) { st.v[k] = toSI(val, dim, st.u[k]); solve(); }
  });
  el.querySelectorAll('[data-u]').forEach(s => s.onchange = () => { st.u[s.dataset.u] = s.value; sync(s.dataset.u); solve(); });
  solve();
}

// ── Equations ───────────────────────────────────────────────────
export function equations(main, _, query) {
  const topics = [...new Set(EQUATIONS.map(e => e.topic))];
  main.innerHTML = `${crumbs([['Reference', '#/reference'], ['Equations']])}${pageHead('07 / REF / EQ', 'Equation Library', `${EQUATIONS.length} equations with variable definitions, SI units and linked calculators. Every numeric equation can be solved for any variable. You can also type an equation straight into search — e.g. <code>FL^3/48EI</code>.`)}
    <div class="toolbar"><input class="filter-in" id="eqf" placeholder="Filter equations…" value="${esc(query.get('q') || '')}"></div>
    <div id="eql"></div>`;
  const draw = () => {
    const q = main.querySelector('#eqf').value.toLowerCase();
    main.querySelector('#eql').innerHTML = topics.map(t => {
      const list = EQUATIONS.filter(e => e.topic === t && (!q || `${e.name} ${e.plain.join(' ')} ${e.v.map(v => v[1]).join(' ')}`.toLowerCase().includes(q)));
      if (!list.length) return '';
      return `<div class="sec-head"><h2>${esc(TOPIC_NAME[t] || t)}</h2><span class="mono small muted">${list.length}</span></div><div class="tbl-wrap" style="max-height:none"><table class="tbl"><tbody>${list.map(e => `<tr><td style="width:34%"><a href="#/reference/equations/${e.id}"><b>${esc(e.name)}</b></a></td><td style="overflow-x:auto">${T(e.tex)}</td><td class="num">${e.calc ? `<a href="#/calc/${e.calc}">calc →</a>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
    }).join('') || '<div class="empty">No equations match.</div>';
  };
  main.querySelector('#eqf').oninput = draw;
  draw();
}

export function equation(main, [id]) {
  const e = EQ[id];
  if (!e) { main.innerHTML = 'Unknown equation'; return; }
  const related = EQUATIONS.filter(x => x.topic === e.topic && x.id !== id).slice(0, 8);
  main.innerHTML = `${crumbs([['Reference', '#/reference'], ['Equations', '#/reference/equations'], [e.name]])}
    <header class="page-head"><span class="code">EQ / ${esc((TOPIC_NAME[e.topic] || e.topic).toUpperCase())}</span><h1>${esc(e.name)}</h1></header>
    <div class="eqblock" style="font-size:1.35em;padding:22px">${T(e.tex, true)}</div>
    <div class="btns mb">${e.calc ? `<a class="btn" href="#/calc/${e.calc}">Open in ${esc(CALC[e.calc].title)} →</a>` : ''}${e.learn ? `<a class="btn ghost" href="#/learn/${e.learn}">Learn: ${esc(LESSON[e.learn]?.title)}</a>` : ''}${e.solver ? `<a class="btn ghost" href="#/solvers/${e.solver}">Beam solver</a>` : ''}<button class="btn ghost" id="fav">${isFav('eq:' + id) ? '★ Saved' : '☆ Save equation'}</button></div>
    <div class="split">
      <div class="panel tick"><h4>Variables</h4>${e.v.length ? `<table class="tbl mt"><thead><tr><th>Symbol</th><th>Meaning</th><th>SI unit</th></tr></thead><tbody>${e.v.map(([, label, dim, sym]) => `<tr><td>${T(sym)}</td><td>${esc(label)}</td><td class="mono">${esc(siUnit(dim) || '—')}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Tensor/operator equation — see note.</p>'}
      ${e.note ? `<div class="msg info mt">${esc(e.note)}</div>` : ''}<p class="small muted mt">Search forms: ${e.plain.map(p => `<code>${esc(p)}</code>`).join(' · ')}</p></div>
      <div class="panel"><h4>Solve for any variable</h4><div id="sw" class="mt"></div></div>
    </div>
    ${related.length ? `<div class="sec-head"><h2>Related equations</h2></div><div class="tbl-wrap" style="max-height:none"><table class="tbl"><tbody>${related.map(r => `<tr><td><a href="#/reference/equations/${r.id}">${esc(r.name)}</a></td><td>${T(r.tex)}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
  solverWidget(main.querySelector('#sw'), e);
  main.querySelector('#fav').onclick = ev => { const on = toggleFav('eq:' + id); ev.target.textContent = on ? '★ Saved' : '☆ Save equation'; };
}

// ── Constants ───────────────────────────────────────────────────
export function constants(main) {
  const groups = [...new Set(CONSTANTS.map(c => c[0]))];
  main.innerHTML = `${crumbs([['Reference', '#/reference'], ['Constants']])}${pageHead('07 / REF / CONST', 'Physical & Engineering Constants', 'CODATA 2018 recommended values, SI 2019 exact definitions, IAU 2015 nominal astronomical values and conventional engineering constants. Click a value to copy it.')}
    <div class="toolbar"><input class="filter-in" id="cf" placeholder="Filter constants…"></div><div id="cl"></div>`;
  const draw = () => {
    const q = main.querySelector('#cf').value.toLowerCase();
    main.querySelector('#cl').innerHTML = groups.map(g => {
      const rows = CONSTANTS.filter(c => c[0] === g && (!q || `${c[1]} ${c[2]} ${c[5]}`.toLowerCase().includes(q)));
      return rows.length ? `<div class="sec-head"><h2>${esc(g)}</h2></div><div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>Quantity</th><th>Symbol</th><th class="num">Value</th><th>Unit</th><th>Status</th></tr></thead><tbody>${rows.map(([, k, n, s, v, u, note]) => `<tr id="c-${k}"><td>${esc(n)}</td><td>${T(s)}</td><td class="num"><button class="chip" data-copy="${v}" title="Copy">${esc(String(v).replace('e', '×10^'))}</button></td><td class="mono">${esc(u)}</td><td class="small muted">${esc(note)}</td></tr>`).join('')}</tbody></table></div>` : '';
    }).join('');
    main.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => navigator.clipboard?.writeText(b.dataset.copy).then(() => toast(`Copied ${b.dataset.copy}`)));
  };
  main.querySelector('#cf').oninput = draw;
  draw();
}

// ── Materials ───────────────────────────────────────────────────
function propDisplay(p, m) {
  const raw = m[p.k];
  if (raw == null) return ['—', ''];
  if (settings.units === 'imperial' && p.dim !== 'none') {
    const u = p.k === 'rho' ? 'lb/in³' : p.dim === 'pressure' ? (p.k === 'E' || p.k === 'G' ? 'Msi' : 'ksi') : defaultUnit(p.dim, 'imperial');
    if (u !== siUnit(p.dim) || p.f !== 1) return [fmt(fromSI(raw * p.f, p.dim, u), 4), u];
  }
  return [fmt(raw, 4), p.unit];
}
const PICK = ['rho', 'E', 'Sy', 'Su', 'el', 'k', 'a'];

export function materials(main, _, query) {
  const cats = [...new Set(MATERIALS.map(m => m.sub))];
  const st = { cat: query.get('c') || 'all', q: '' };
  main.innerHTML = `${crumbs([['Reference', '#/reference'], ['Materials']])}${pageHead('07 / REF / MAT', 'Materials Database', `${MATERIALS.length} engineering materials with condition/temper and the basis of each value (typical vs specification minimum). Values are representative — <b>not design allowables</b>. Units follow your unit setting.`)}
    <div class="toolbar"><input class="filter-in" id="mq" placeholder="Search e.g. 4140, titanium, PEEK…"><a class="btn ghost sm" href="#/reference/compare">Compare materials →</a></div>
    <div class="chips mb" id="mc"><button class="chip on" data-c="all">All</button>${cats.map(c => `<button class="chip" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Material</th><th>Condition</th><th>Basis</th>${PICK.map(k => { const p = PROPS.find(x => x.k === k); return `<th class="num">${esc(p.label)}<br><span style="text-transform:none">${esc(propDisplay(p, { [k]: 1 })[1])}</span></th>`; }).join('')}</tr></thead><tbody id="mt"></tbody></table></div>`;
  const draw = () => {
    const q = main.querySelector('#mq').value.toLowerCase();
    main.querySelector('#mt').innerHTML = MATERIALS.filter(m => (st.cat === 'all' || m.sub === st.cat) && (!q || `${m.name} ${m.id} ${m.uses} ${m.sub}`.toLowerCase().includes(q)))
      .map(m => `<tr><td><a href="#/reference/materials/${m.id}"><b>${esc(m.name)}</b></a><div class="small muted">${esc(m.sub)}</div></td><td class="small">${esc(m.cond)}</td><td><span class="badge ${m.basis === 'min' ? 'lv-pro' : 'plan'}">${m.basis === 'min' ? 'Spec min' : 'Typical'}</span></td>${PICK.map(k => `<td class="num">${esc(propDisplay(PROPS.find(p => p.k === k), m)[0])}</td>`).join('')}</tr>`).join('');
  };
  main.querySelector('#mq').oninput = draw;
  main.querySelectorAll('#mc .chip').forEach(b => b.onclick = () => { st.cat = b.dataset.c; main.querySelectorAll('#mc .chip').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  draw();
}

export function material(main, [id]) {
  const m = getMaterial(id);
  if (!m) { main.innerHTML = 'Unknown material'; return; }
  const users = CALCS.filter(c => c.inputs.some(i => i.type === 'material'));
  main.innerHTML = `${crumbs([['Reference', '#/reference'], ['Materials', '#/reference/materials'], [m.name]])}
    <header class="page-head"><span class="code">MAT / ${esc(m.sub.toUpperCase())}</span><h1>${esc(m.name)}</h1><p class="lede">${esc(m.cond)} · <span class="badge ${m.basis === 'min' ? 'lv-pro' : 'plan'}">${m.basis === 'min' ? 'Specification minimum' : 'Typical values'}</span></p></header>
    <div class="btns mb"><a class="btn" href="#/reference/compare?m=${id}">Compare →</a><button class="btn ghost" id="fav">${isFav('mat:' + id) ? '★ Saved' : '☆ Save material'}</button></div>
    <div class="split">
      <div class="panel tick"><h4>Properties</h4><table class="tbl mt"><tbody>${PROPS.map(p => { const [v, u] = propDisplay(p, m); return `<tr><td>${esc(p.label)}</td><td>${T(p.sym)}</td><td class="num">${esc(v)}</td><td class="mono small">${v === '—' ? '' : esc(u)}</td></tr>`; }).join('')}<tr><td>Melting / softening</td><td></td><td class="num">${esc(m.melt)}</td><td class="mono small">°C</td></tr></tbody></table></div>
      <div>
        <div class="panel"><h4>Derived indices</h4><table class="tbl mt"><tbody>${DERIVED.map(d => { const v = (d.k === 'thermDiff' && !(m.k && m.cp)) ? NaN : d.f(m); return `<tr><td>${esc(d.label)}</td><td class="num">${Number.isFinite(v) ? esc(fmt(v, 4)) : '—'}</td><td class="mono small">${esc(d.unit)}</td></tr>`; }).join('')}</tbody></table></div>
        <div class="panel mt"><h4>Application notes</h4><dl class="kv mt"><dt>Typical uses</dt><dd>${esc(m.uses)}</dd><dt>Corrosion</dt><dd>${esc(m.corr)}</dd>${m.notes ? `<dt>Notes</dt><dd>${esc(m.notes)}</dd>` : ''}</dl></div>
      </div>
    </div>
    <div class="msg warn mt">Representative data aggregated from handbook sources (ASM Handbooks, Shigley Table A-20, specification minima where marked, manufacturer datasheets). Properties depend on product form, section size, heat treatment and supplier — use certified mill/test data for design.</div>
    <div class="sec-head"><h2>Use this material in a calculator</h2></div><div class="grid auto">${users.map(c => `<a class="tile" href="#/calc/${c.id}?mat=${id}"><span class="k">${esc(DISCIPLINES[c.disc].code)}</span><span class="t">${esc(c.title)}</span><span class="go">Calculate with ${esc(m.name)} →</span></a>`).join('')}</div>`;
  main.querySelector('#fav').onclick = ev => { const on = toggleFav('mat:' + id); ev.target.textContent = on ? '★ Saved' : '☆ Save material'; };
}

export function compare(main, _, query) {
  const sel = (query.get('m') || 'al-6061-t6,al-7075-t6,ss-304,ti-6al4v').split(',').filter(getMaterial);
  let prop = 'Sy', ax = ['rho', 'E'];
  main.innerHTML = `${crumbs([['Reference', '#/reference'], ['Compare materials']])}${pageHead('07 / REF / CMP', 'Material Comparison', 'Pick up to six materials. Compare properties, specific strength and stiffness, and see them on an Ashby-style property chart against the whole database.')}
    <div class="panel mb"><div class="toolbar" style="margin:0"><select class="plain" id="add" style="max-width:360px"><option value="">+ Add material…</option>${MATERIALS.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select><div class="chips" id="selc"></div></div></div>
    <div class="tbl-wrap" style="max-height:none" id="ct"></div>
    <div class="split mt2">
      <div class="panel"><div class="panel-title"><h4>Bar chart</h4><select class="plain" id="bp" style="max-width:260px">${[...PROPS, ...DERIVED].map(p => `<option value="${p.k}">${esc(p.label)}</option>`).join('')}</select></div><div id="bars"></div></div>
      <div class="panel"><div class="panel-title"><h4>Property chart (log–log)</h4><span><select class="plain" id="ay" style="max-width:150px">${PROPS.filter(p => p.dim !== 'none').map(p => `<option value="${p.k}">${esc(p.label)}</option>`).join('')}</select> vs <select class="plain" id="ax" style="max-width:150px">${PROPS.filter(p => p.dim !== 'none').map(p => `<option value="${p.k}">${esc(p.label)}</option>`).join('')}</select></span></div><div id="ashby"></div></div>
    </div>`;
  const add = main.querySelector('#add'), bp = main.querySelector('#bp');
  bp.value = prop;
  main.querySelector('#ax').value = ax[0]; main.querySelector('#ay').value = ax[1];
  const val = (m, k) => { const p = PROPS.find(x => x.k === k); if (p) return m[k]; const d = DERIVED.find(x => x.k === k); try { return d.f(m); } catch (e) { return NaN; } };
  const draw = () => {
    history.replaceState(null, '', `#/reference/compare?m=${sel.join(',')}`);
    const mats = sel.map(getMaterial);
    main.querySelector('#selc').innerHTML = mats.map(m => `<button class="chip on" data-rm="${m.id}" title="Remove">${esc(m.name)} ✕</button>`).join('');
    main.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { sel.splice(sel.indexOf(b.dataset.rm), 1); draw(); });
    const rows = [...PROPS, ...DERIVED].map(p => {
      const vals = mats.map(m => val(m, p.k));
      const fin = vals.filter(Number.isFinite);
      const best = p.k === 'rho' || p.k === 'a' || p.k === 'res' ? Math.min(...fin) : Math.max(...fin);
      return `<tr><td>${esc(p.label)} <span class="muted small">${esc(p.unit)}</span></td>${vals.map(v => `<td class="num"${Number.isFinite(v) && v === best && fin.length > 1 ? ' style="color:var(--acc);font-weight:700"' : ''}>${Number.isFinite(v) ? esc(fmt(v, 4)) : '—'}</td>`).join('')}</tr>`;
    }).join('');
    main.querySelector('#ct').innerHTML = `<table class="tbl"><thead><tr><th>Property</th>${mats.map(m => `<th class="num"><a href="#/reference/materials/${m.id}">${esc(m.name)}</a></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
    const pk = bp.value, vals = mats.map(m => val(m, pk)), mx = Math.max(...vals.filter(Number.isFinite), 1e-30);
    const pd = [...PROPS, ...DERIVED].find(p => p.k === pk);
    main.querySelector('#bars').innerHTML = mats.map((m, i) => `<div class="bar-row"><span class="bl">${esc(m.name)}</span><div class="bar-track"><div class="bar" style="width:${Number.isFinite(vals[i]) ? vals[i] / mx * 100 : 0}%;background:${COLORS[i % COLORS.length]}"></div></div><span class="bv">${Number.isFinite(vals[i]) ? esc(fmt(vals[i], 4)) : '—'} <span class="muted">${esc(pd.unit)}</span></span></div>`).join('');
    const kx = main.querySelector('#ax').value, ky = main.querySelector('#ay').value;
    const px = PROPS.find(p => p.k === kx), py = PROPS.find(p => p.k === ky);
    const cats = [...new Set(MATERIALS.map(m => m.cat))];
    const series = cats.map((c, i) => { const ms = MATERIALS.filter(m => m.cat === c && m[kx] > 0 && m[ky] > 0); return { x: ms.map(m => m[kx]), y: ms.map(m => m[ky]), type: 'scatter', label: c, color: ['var(--c2)', 'var(--c4)', 'var(--c3)', 'var(--good)'][i % 4] }; });
    const sm = mats.filter(m => m[kx] > 0 && m[ky] > 0);
    series.push({ x: sm.map(m => m[kx]), y: sm.map(m => m[ky]), type: 'scatter', label: 'Selected', color: 'var(--acc)' });
    main.querySelector('#ashby').innerHTML = plotSVG(series, { logx: true, logy: true, xlabel: `${px.label} (${px.unit})`, ylabel: `${py.label} (${py.unit})`, h: 360 }) + legend(series);
  };
  add.onchange = () => { if (add.value && !sel.includes(add.value) && sel.length < 6) sel.push(add.value); add.value = ''; draw(); };
  bp.onchange = draw;
  main.querySelector('#ax').onchange = draw; main.querySelector('#ay').onchange = draw;
  draw();
}

// ── Fluids & property tables ────────────────────────────────────
export function fluids(main) {
  const sat = [];
  for (let T = 0.01; T <= 370; T += T < 1 ? 9.99 : 10) sat.push([T, psatIF97(T + 273.15)]);
  const tbl = (t, heads, fmts) => `<div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr>${heads.map(h => `<th class="num">${h}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map((v, i) => `<td class="num">${fmts ? fmts[i](v) : v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  main.innerHTML = `${crumbs([['Reference', '#/reference'], ['Fluids & property tables']])}${pageHead('07 / REF / PROP', 'Fluid & Property Tables', 'Water and air properties at 1 atm, common fluids and gases, pipe roughness, and water/steam saturation from IAPWS-IF97.')}
    <div class="split">
      <div><div class="sec-head" style="margin-top:0"><h2>Water (1 atm)</h2></div>${tbl(WATER_TABLE, ['T °C', 'ρ kg/m³', 'μ mPa·s', 'k W/(m·K)', 'c_p kJ/(kg·K)', 'p_sat kPa'])}<p class="small muted">IAPWS-95-based tabulations, rounded.</p></div>
      <div><div class="sec-head" style="margin-top:0"><h2>Dry air (1 atm)</h2></div>${tbl(AIR_TABLE, ['T °C', 'ρ kg/m³', 'μ ×10⁻⁵ Pa·s', 'k W/(m·K)', 'c_p kJ/(kg·K)', 'Pr'])}<p class="small muted">Standard heat-transfer text tabulations (e.g. Incropera, Çengel appendices).</p></div>
    </div>
    <div class="split mt2">
      <div><div class="sec-head" style="margin-top:0"><h2>Liquids (≈20 °C)</h2></div><div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>Fluid</th><th class="num">ρ kg/m³</th><th class="num">μ mPa·s</th></tr></thead><tbody>${FLUIDS.map(f => `<tr><td>${esc(f.name)}</td><td class="num">${fmt(f.rho, 5)}</td><td class="num">${fmt(f.mu * 1e3, 4)}</td></tr>`).join('')}</tbody></table></div></div>
      <div><div class="sec-head" style="margin-top:0"><h2>Gases (ideal-gas data, ~300 K)</h2></div><div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>Gas</th><th class="num">M g/mol</th><th class="num">R J/(kg·K)</th><th class="num">c_p J/(kg·K)</th><th class="num">γ</th></tr></thead><tbody>${GASES.map(g => `<tr><td>${esc(g.name)}</td><td class="num">${g.M}</td><td class="num">${g.R}</td><td class="num">${g.cp}</td><td class="num">${g.gamma}</td></tr>`).join('')}</tbody></table></div></div>
    </div>
    <div class="split mt2">
      <div><div class="sec-head" style="margin-top:0"><h2>Water/steam saturation — IAPWS-IF97</h2><a class="btn ghost sm" href="#/reference/steam">Full steam tables →</a></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th class="num">T °C</th><th class="num">p_sat kPa</th><th class="num">p_sat bar</th></tr></thead><tbody>${sat.map(([t, p]) => `<tr><td class="num">${t < 1 ? '0.01' : t.toFixed(0)}</td><td class="num">${fmt(p / 1e3, 6)}</td><td class="num">${fmt(p / 1e5, 5)}</td></tr>`).join('')}</tbody></table></div><p class="small muted">Computed live from the IF97 Region 4 equation (IAPWS R7-97).</p></div>
      <div><div class="sec-head" style="margin-top:0"><h2>Pipe roughness</h2></div><div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>Material</th><th class="num">ε mm</th></tr></thead><tbody>${ROUGHNESS.map(r => `<tr><td>${esc(r.name)}</td><td class="num">${r.eps}</td></tr>`).join('')}</tbody></table></div><p class="small muted">Typical new-pipe values (Moody 1944; Crane TP-410). Aged pipe can be several times rougher.</p></div>
    </div>`;
}

// ── Steam tables (IAPWS-IF97) ───────────────────────────────────
export function steam(main) {
  const P_MPa = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.101325, 0.2, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 22];
  const satRows = P_MPa.map(p => { const s = satP(p * 1e6); return [p, s.T - 273.15, s.liq.v, s.vap.v, s.liq.h / 1e3, s.hfg / 1e3, s.vap.h / 1e3, s.liq.s / 1e3, s.vap.s / 1e3]; });
  const f = (v, d = 5) => fmt(v, d);
  const head = (h) => `<thead><tr>${h.map(x => `<th class="num">${x}</th>`).join('')}</tr></thead>`;
  main.innerHTML = `${crumbs([['Reference', '#/reference'], ['Steam tables']])}${pageHead('07 / REF / STM', 'Steam Tables — IAPWS-IF97', 'Saturated, superheated, compressed and supercritical water computed live from the IAPWS Industrial Formulation 1997 (Regions 1–5). Every value on this page is calculated in your browser; the implementation is checked against the IAPWS verification tables in the test suite.')}
    <div class="row gap" style="flex-wrap:wrap"><a class="btn sm" href="#/calc/steam-props">Any state calculator →</a><a class="btn ghost sm" href="#/calc/rankine-if97">Rankine cycle →</a><a class="btn ghost sm" href="#/calc/steam-turbine">Turbine expansion →</a><a class="btn ghost sm" href="#/calc/steam-sat">Saturation only →</a></div>
    <div class="sec-head"><h2>Saturated water — pressure table</h2></div>
    <div class="tbl-wrap" style="max-height:none"><table class="tbl">${head(['p MPa', 'T_sat °C', 'v_f m³/kg', 'v_g m³/kg', 'h_f kJ/kg', 'h_fg kJ/kg', 'h_g kJ/kg', 's_f kJ/kg·K', 's_g kJ/kg·K'])}<tbody>${satRows.map(r => `<tr>${r.map((v, i) => `<td class="num">${i === 0 ? v : f(v, i === 2 ? 5 : 6)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="sec-head"><h2>Superheated &amp; compressed — at pressure</h2>
      <div class="row gap"><label class="small muted" for="stp">p (MPa)</label><select class="plain" id="stp">${[0.01, 0.1, 0.2, 0.5, 1, 2, 4, 6, 8, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100].map(p => `<option${p === 1 ? ' selected' : ''}>${p}</option>`).join('')}</select></div></div>
    <div id="stSup"></div>
    <div class="sec-head"><h2>Charts</h2><div class="row gap"><select class="plain" id="stChart"><option value="Ts">T–s diagram</option><option value="hs">h–s (Mollier) diagram</option><option value="ph">p–h diagram</option></select></div></div>
    <div id="stPlot"></div>
    <p class="small muted">Reference state: u = s = 0 for saturated liquid at the triple point (0.01 °C). Region 3 densities are solved numerically on the stable branch; states closer than ~0.1 K to the critical point are less accurate (IF97 limitation). Source: IAPWS R7-97(2012).</p>`;
  const sup = () => {
    const p = parseFloat(main.querySelector('#stp').value) * 1e6;
    const Ts = [0.01, 20, 50, 80, 100, 120, 150, 180, 200, 250, 300, 350, 375, 400, 450, 500, 550, 600, 650, 700, 800, 900, 1000, 1200, 1500, 2000];
    const tsat = p < 22.064e6 ? satP(p).T - 273.15 : null;
    const rows = Ts.map(t => [t, steamPT(p, t + 273.15)]).filter(([, s]) => s);
    main.querySelector('#stSup').innerHTML = `<p class="small muted">${tsat != null ? `T_sat = ${f(tsat, 6)} °C at this pressure. Rows below T_sat are compressed liquid (marked L).` : 'Supercritical pressure — no phase change.'}</p><div class="tbl-wrap" style="max-height:none"><table class="tbl">${head(['T °C', 'phase', 'v m³/kg', 'ρ kg/m³', 'u kJ/kg', 'h kJ/kg', 's kJ/kg·K', 'c_p kJ/kg·K', 'w m/s'])}<tbody>${rows.map(([t, s]) => `<tr><td class="num">${t}</td><td class="num">${s.region === 1 || (s.region === 3 && tsat != null && t < tsat) ? 'L' : s.region === 3 ? 'SC' : 'V'}</td><td class="num">${f(s.v)}</td><td class="num">${f(s.rho)}</td><td class="num">${f(s.u / 1e3, 6)}</td><td class="num">${f(s.h / 1e3, 6)}</td><td class="num">${f(s.s / 1e3, 5)}</td><td class="num">${f(s.cp / 1e3, 4)}</td><td class="num">${f(s.w, 4)}</td></tr>`).join('')}</tbody></table></div>`;
  };
  const chart = () => {
    const kind = main.querySelector('#stChart').value, d = dome(80);
    const X = st => kind === 'ph' ? st.h / 1e3 : st.s / 1e3, Y = st => kind === 'Ts' ? st.T - 273.15 : kind === 'hs' ? st.h / 1e3 : st.p / 1e6;
    const dx = kind === 'ph' ? [...d.map(q => q.hf / 1e3), ...d.slice().reverse().map(q => q.hg / 1e3)] : [...d.map(q => q.sf / 1e3), ...d.slice().reverse().map(q => q.sg / 1e3)];
    const dy = kind === 'Ts' ? [...d.map(q => q.T - 273.15), ...d.slice().reverse().map(q => q.T - 273.15)] : kind === 'hs' ? [...d.map(q => q.hf / 1e3), ...d.slice().reverse().map(q => q.hg / 1e3)] : [...d.map(q => q.p / 1e6), ...d.slice().reverse().map(q => q.p / 1e6)];
    const series = [{ x: dx, y: dy, label: 'Saturation dome', color: 'var(--ink)', width: 2 }];
    [0.01, 0.1, 1, 5, 10, 22.064, 40].forEach((pM, k) => {
      const xs = [], ys = [];
      for (let T = 275; T <= 1073; T += 4) {
        const p = pM * 1e6;
        if (p < 22.064e6) { const ts = satP(p).T; if (T > ts - 4 && T < ts + 4 && T <= ts) { const sat = satP(p); [sat.liq, sat.vap].forEach(q => { xs.push(X(q)); ys.push(Y({ ...q, T: sat.T, p })); }); continue; } }
        const st = steamPT(p, T); if (st) { xs.push(X(st)); ys.push(Y(st)); }
      }
      if (kind !== 'ph') series.push({ x: xs, y: ys, label: `${pM} MPa`, color: COLORS[(k + 1) % COLORS.length], width: 1.2 });
    });
    if (kind === 'ph') [100, 200, 300, 400, 500, 600, 800].forEach((t, k) => {
      const xs = [], ys = [];
      for (let lp = -2; lp <= 2; lp += 0.02) { const st = steamPT(10 ** lp * 1e6, t + 273.15); if (st) { xs.push(st.h / 1e3); ys.push(10 ** lp); } }
      series.push({ x: xs, y: ys, label: `${t} °C`, color: COLORS[(k + 1) % COLORS.length], width: 1.2 });
    });
    if (kind !== 'Ts') [0.8, 0.9].forEach(xq => { const xs = [], ys = []; d.forEach(q => { const s = q.sf + xq * (q.sg - q.sf), h = q.hf + xq * (q.hg - q.hf); xs.push(kind === 'ph' ? h / 1e3 : s / 1e3); ys.push(kind === 'hs' ? h / 1e3 : q.p / 1e6); }); series.push({ x: xs, y: ys, label: `x = ${xq}`, color: 'var(--ink3)', dash: '3 3', width: 1 }); });
    const opts = kind === 'Ts' ? { xlabel: 's (kJ/kg·K)', ylabel: 'T (°C)', ymin: 0, ymax: 800, xmin: 0, xmax: 10 } : kind === 'hs' ? { xlabel: 's (kJ/kg·K)', ylabel: 'h (kJ/kg)', xmin: 0, xmax: 10, ymin: 0, ymax: 4200 } : { xlabel: 'h (kJ/kg)', ylabel: 'p (MPa)', logy: true, xmin: 0, xmax: 4000 };
    main.querySelector('#stPlot').innerHTML = plotSVG(series, { ...opts, h: 420 }) + legend(series);
  };
  main.querySelector('#stp').onchange = sup; main.querySelector('#stChart').onchange = chart;
  sup(); chart();
}

export function tables(main) {
  main.innerHTML = `${crumbs([['Reference', '#/reference'], ['Engineering tables']])}${pageHead('07 / REF / TBL', 'Engineering Tables', 'Dimensional reference data. Stress areas are computed from the ISO 898-1 formula; always confirm against the current edition of the standard.')}
    <div class="sec-head"><h2>ISO metric coarse threads</h2><a class="btn ghost sm" href="#/calc/bolt">Bolt preload calculator →</a></div>
    <div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>Size</th><th class="num">Pitch P mm</th><th class="num">Stress area A_s mm²</th><th class="num">Minor dia. d₃ mm</th><th class="num">Tap drill ≈ mm</th></tr></thead><tbody>${THREADS.map(t => `<tr><td><b>M${t.d}</b></td><td class="num">${t.P}</td><td class="num">${t.As.toFixed(1)}</td><td class="num">${t.d3.toFixed(3)}</td><td class="num">${t.drill}</td></tr>`).join('')}</tbody></table></div>
    <div class="sec-head"><h2>Bolt property classes (ISO 898-1)</h2></div>
    <div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>Class</th><th class="num">R_m nom MPa</th><th class="num">R_m min MPa</th><th class="num">Yield min MPa</th><th class="num">Proof S_p MPa</th><th>Notes</th></tr></thead><tbody>${BOLT_CLASSES.map(r => `<tr><td><b>${r[0]}</b></td>${r.slice(1, 5).map(v => `<td class="num">${v}</td>`).join('')}<td class="small muted">${esc(r[5])}</td></tr>`).join('')}</tbody></table></div>
    <div class="sec-head"><h2>Steel pipe — ASME B36.10M</h2><a class="btn ghost sm" href="#/calc/pipe-flow">Pipe flow calculator →</a></div>
    <div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>NPS</th><th class="num">OD mm</th><th class="num">Sch 40 wall</th><th class="num">Sch 40 ID</th><th class="num">Sch 80 wall</th><th class="num">Sch 80 ID</th></tr></thead><tbody>${PIPES.map(([n, od, w40, w80]) => `<tr><td><b>${n}″</b></td><td class="num">${od}</td><td class="num">${w40}</td><td class="num">${(od - 2 * w40).toFixed(1)}</td><td class="num">${w80}</td><td class="num">${(od - 2 * w80).toFixed(1)}</td></tr>`).join('')}</tbody></table></div>
    <div class="sec-head"><h2>Minor loss coefficients K</h2></div>
    <div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>Fitting</th><th class="num">K</th></tr></thead><tbody>${KFACTORS.map(([n, k]) => `<tr><td>${esc(n)}</td><td class="num">${esc(String(k))}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">Indicative, fully-turbulent values (Crane TP-410, White). Use manufacturer C_v / K data for valves.</p>`;
}

export function standards(main) {
  main.innerHTML = `${crumbs([['Reference', '#/reference'], ['Standards guide']])}${pageHead('07 / REF / STD', 'Standards Guide', 'What the major standards bodies cover, where their standards apply and which calculators on this site relate to them. Standards are described and referenced here — never reproduced. Buy or access the current edition from the publisher.')}
    ${STANDARDS.map(s => `<div class="sec-head"><div><span class="code">${esc(s.org)}</span><h2>${esc(s.full)}</h2></div><a class="btn ghost sm" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(new URL(s.url).host)} ↗</a></div>
      <p class="muted">${esc(s.scope)}</p>
      <div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>Standard</th><th>Scope</th><th>Related calculator</th></tr></thead><tbody>${s.items.map(([n, d, c]) => `<tr><td><b>${esc(n)}</b></td><td>${esc(d)}</td><td>${c ? `<a href="#/calc/${c}">${esc(CALC[c]?.title || c)}</a>` : '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>`).join('')}`;
}

// ── JavaScript API docs ─────────────────────────────────────────
export function api(main) {
  const ex = (code) => `<pre class="eqblock mono" style="white-space:pre-wrap;font-size:13px">${esc(code)}</pre>`;
  main.innerHTML = `${crumbs([['Reference', '#/reference'], ['JavaScript API']])}${pageHead('07 / REF / API', 'JavaScript API', 'Every calculator, equation, unit conversion, material and solver is available programmatically as <code>window.PHYSENG</code> — in the site and in the single-file build. All values are coherent SI.')}
    <div class="split"><div class="panel tick"><h4>Run a calculator</h4>${ex(`PHYSENG.run('reynolds', { v: 2, D: 0.025, fluid: 'water20' })
// → { outputs: { Re: 49800, reg: 'Turbulent', nu: 1.0e-6 }, warnings: [...], checks: [...] }

PHYSENG.run('shaft-torsion', { T: 450, d: 0.035, mat: 'st-4140-ann' }).outputs.tau
// → 53454000 (Pa)`)}
      <h4 class="mt">Inspect inputs</h4>${ex(`PHYSENG.calculators().find(c => c.id === 'pipe-flow').inputs
PHYSENG.defaults('pipe-flow')`)}</div>
    <div class="panel"><h4>Equations & units</h4>${ex(`PHYSENG.solve('ohm', { V: 12, R: 100 }, 'I')      // → 0.12
PHYSENG.solve('schwarzschild', { M: 1.98847e30 }, 'rs')  // → 2953.3
PHYSENG.convert(1, 'pressure', 'psi', 'kPa')            // → 6.894757
PHYSENG.dimensions().torque                              // → ['N·m', 'kN·m', …]`)}
      <h4 class="mt">Materials, constants, solvers</h4>${ex(`PHYSENG.material('al-6061-t6').E        // → 6.89e10 (Pa)
PHYSENG.constants.h                      // → 6.62607015e-34
PHYSENG.solvers.beam({ L: 4, E: 210e9, I: 8.36e-6,
  supports: [{ x: 0, type: 'pin' }, { x: 4, type: 'roller' }],
  loads: [{ type: 'point', x: 2, P: 10e3 }] }).maxM   // → { x: 2, v: 10000 }`)}</div></div>
    <div class="panel mt"><h4>Try it</h4><p class="small muted">Open your browser's developer console on this page and type <code>PHYSENG</code>. Calculator ids: <a href="#/calculators">calculator library</a> (last URL segment). API version ${esc(window.PHYSENG?.version || '1.0')}.</p></div>`;
}
