// Practical lab guides: method, safety, live data table, straight-line fit and result with uncertainty.
import { LABS, LAB } from '../data/labs.js';
import { CALC } from '../calcs/index.js';
import { fmt, esc, T, toast } from '../core/format.js';
import { plotSVG, linfit, legend } from '../core/plot.js';
import { crumbs, pageHead, linkTile, levelBadge, SIMS, SOLVERS } from './common.js';

const KEY = id => `physeng.lab.${id}`;
const load = id => { try { return JSON.parse(localStorage.getItem(KEY(id))); } catch (e) { return null; } };
const save = (id, st) => { try { localStorage.setItem(KEY(id), JSON.stringify(st)); } catch (e) { /* storage unavailable */ } };

export function index(main) {
  const groups = [['physics', 'Physics'], ['engineering', 'Engineering'], ['quantum', 'Quantum & Modern Physics']];
  main.innerHTML = `${crumbs([['Learn', '#/learn'], ['Lab guides']])}${pageHead('01 / LEARN / LAB', 'Lab Guides', 'Required-practical style experiments with method, safety, apparatus and a live data table. Enter your readings and get the best-fit line, gradient uncertainty, the final result ± uncertainty and its difference from the accepted value — then print a lab report.')}
    ${groups.map(([k, n]) => { const ls = LABS.filter(l => l.sec === k); return ls.length ? `<div class="sec-head"><h2>${n}</h2><span class="muted small">${ls.length}</span></div><div class="grid auto">${ls.map(l => linkTile(`#/learn/labs/${l.id}`, `Lab · ~${l.mins} min`, l.title, l.aim, 'Open lab →', levelBadge(l.level))).join('')}</div>` : ''; }).join('')}`;
}

export function lab(main, [id]) {
  const L = LAB[id];
  if (!L) { main.innerHTML = `${crumbs([['Learn', '#/learn'], ['Lab guides', '#/learn/labs'], ['Not found']])}<div class="msg warn">Unknown lab.</div>`; return; }
  const saved = load(id);
  const st = { rows: saved?.rows || L.data.map(r => [...r]), k: { ...Object.fromEntries(L.consts.map(c => [c.k, c.val])), ...(saved?.k || {}) } };
  const links = [...(L.related || []).filter(c => CALC[c]).map(c => `<a class="btn ghost sm" href="#/calc/${c}">${esc(CALC[c].title)} →</a>`), L.sim && SIMS[L.sim] ? `<a class="btn ghost sm" href="#/sims/${L.sim}">Simulation: ${esc(SIMS[L.sim].title)} →</a>` : '', L.solver && SOLVERS[L.solver] ? `<a class="btn ghost sm" href="#/solvers/${L.solver}">${esc(SOLVERS[L.solver].title)} →</a>` : ''].join('');
  main.innerHTML = `${crumbs([['Learn', '#/learn'], ['Lab guides', '#/learn/labs'], [L.title]])}${pageHead('LAB / ' + L.sec.toUpperCase().slice(0, 3), L.title, esc(L.aim))}
    <div class="row gap" style="flex-wrap:wrap">${levelBadge(L.level)}<span class="badge">~${L.mins} min</span><button class="btn sm" id="print">Print lab report</button><button class="btn ghost sm" id="csv">Export CSV</button></div>
    <div class="split mt2">
      <div>
        <div class="sec-head" style="margin-top:0"><h2>Theory</h2></div>${L.theory.map(t => `<div class="eqblock">${T(t, true)}</div>`).join('')}
        <div class="sec-head"><h2>Apparatus</h2></div><ul>${L.apparatus.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
        <div class="sec-head"><h2>Method</h2></div><ol>${L.method.map(a => `<li>${esc(a)}</li>`).join('')}</ol>
        <div class="msg warn"><b>Safety.</b> ${L.safety.map(esc).join(' ')}</div>
      </div>
      <div>
        <div class="sec-head" style="margin-top:0"><h2>Your data</h2><div class="row gap"><button class="btn ghost sm" id="add">+ row</button><button class="btn ghost sm" id="sample">Sample data</button><button class="btn ghost sm" id="clear">Clear</button></div></div>
        ${L.consts.length ? `<div class="grid g2">${L.consts.map(c => `<div class="field"><label for="k-${c.k}"><span>${esc(c.label)}${c.unit ? ` (${esc(c.unit)})` : ''}</span></label><div class="in"><input id="k-${c.k}" data-k="${c.k}" inputmode="decimal" value="${st.k[c.k]}"></div></div>`).join('')}</div>` : ''}
        <div class="tbl-wrap" style="max-height:none"><table class="tbl" id="dt"><thead><tr><th>#</th>${L.cols.map(c => `<th class="num">${esc(c.label)}${c.unit ? ` (${esc(c.unit)})` : ''}</th>`).join('')}<th class="num">${esc(L.xlabel)}</th><th class="num">${esc(L.ylabel)}</th><th></th></tr></thead><tbody></tbody></table></div>
        <div id="res" class="mt2"></div>
      </div>
    </div>
    <div class="sec-head"><h2>Graph</h2></div><div id="plot"></div>
    <div class="sec-head"><h2>Evaluation</h2></div><ul>${L.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
    ${links ? `<div class="sec-head"><h2>Related</h2></div><div class="row gap" style="flex-wrap:wrap">${links}</div>` : ''}
    <p class="small muted mt2">Your readings are kept in this browser only. Sample data are illustrative (true value plus realistic random error).</p>`;
  const tb = main.querySelector('#dt tbody');
  const num = v => { const x = parseFloat(String(v).replace(',', '.')); return Number.isFinite(x) ? x : NaN; };
  const drawTable = () => {
    tb.innerHTML = st.rows.map((r, i) => `<tr><td class="muted">${i + 1}</td>${L.cols.map((c, j) => `<td class="num"><div class="in"><input data-r="${i}" data-c="${j}" inputmode="decimal" value="${r[j] ?? ''}" style="text-align:right"></div></td>`).join('')}<td class="num" data-x="${i}"></td><td class="num" data-y="${i}"></td><td><button class="btn ghost sm" data-del="${i}" title="Remove row">×</button></td></tr>`).join('');
    tb.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => { st.rows[+inp.dataset.r][+inp.dataset.c] = num(inp.value); update(); }));
    tb.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { st.rows.splice(+b.dataset.del, 1); drawTable(); update(); });
  };
  const accepted = () => typeof L.accepted === 'function' ? L.accepted(st.k) : L.accepted;
  const compute = () => {
    const pts = [];
    st.rows.forEach((r, i) => {
      const o = Object.fromEntries(L.cols.map((c, j) => [c.k, r[j]]));
      const x = L.x(o, st.k), y = L.y(o, st.k), ok = Number.isFinite(x) && Number.isFinite(y);
      const cx = tb.querySelector(`[data-x="${i}"]`), cy = tb.querySelector(`[data-y="${i}"]`);
      if (cx) cx.textContent = ok ? fmt(x, 4) : '—';
      if (cy) cy.textContent = ok ? fmt(y, 4) : '—';
      if (ok) pts.push([x, y]);
    });
    if (pts.length < 3) return { pts };
    const f = linfit(pts.map(p => p[0]), pts.map(p => p[1]));
    const v = L.result(f.m, f.c, st.k), u = Math.abs(L.result(f.m + f.se_m, f.c, st.k) - L.result(f.m - f.se_m, f.c, st.k)) / 2;
    return { pts, f, v, u };
  };
  const update = () => {
    save(id, st);
    const r = compute(), res = main.querySelector('#res'), plot = main.querySelector('#plot');
    if (!r.f) { res.innerHTML = '<div class="msg info">Enter at least three complete rows to fit a line.</div>'; plot.innerHTML = ''; return; }
    const { f, v, u, pts } = r, acc = accepted();
    const xs = pts.map(p => p[0]), x0 = Math.min(...xs, 0), x1 = Math.max(...xs);
    const pct = acc ? (v - acc) / acc * 100 : null, within = acc ? Math.abs(v - acc) <= 2 * u : null;
    res.innerHTML = `<div class="readout primary"><div class="rl">${esc(L.rlabel)} (result)</div><div class="rv"><span class="val">${fmt(v, 4)} ± ${fmt(u, 2)}</span> <span class="muted">${esc(L.runit)}</span></div></div>
      <div class="kv mt"><span>Gradient m = ${fmt(f.m, 5)} ± ${fmt(f.se_m, 2)}</span><span>Intercept c = ${fmt(f.c, 4)} ± ${fmt(f.se_c, 2)}</span><span>R² = ${fmt(f.r2, 5)} (n = ${f.n})</span><span>Percentage uncertainty ${fmt(Math.abs(u / v) * 100, 3)} %</span>${acc ? `<span>Accepted ${fmt(acc, 4)} ${esc(L.runit)} → difference ${pct >= 0 ? '+' : ''}${fmt(pct, 3)} %</span>` : ''}</div>
      ${acc ? `<div class="msg ${within ? 'good' : 'warn'} mt">${within ? 'Agrees with the accepted value within 2 standard uncertainties.' : 'Differs from the accepted value by more than 2 standard uncertainties — look for a systematic error.'}</div>` : ''}
      ${L.extra ? `<p class="small">${esc(L.extra(f.m, f.c, st.k))}</p>` : ''}
      <p class="small muted">${T(L.rtex)}. Uncertainty from the least-squares standard error of the gradient, propagated through the result formula.</p>`;
    const fitX = [x0, x1];
    const series = [{ x: xs, y: pts.map(p => p[1]), type: 'scatter', label: 'Data' }, { x: fitX, y: fitX.map(x => f.m * x + f.c), label: `Best fit y = ${fmt(f.m, 4)}x ${f.c < 0 ? '−' : '+'} ${fmt(Math.abs(f.c), 3)}` }, { x: fitX, y: fitX.map(x => (f.m + f.se_m) * (x - (x0 + x1) / 2) + f.m * (x0 + x1) / 2 + f.c), label: 'Steepest (m + σ)', dash: '4 4', width: 1 }, { x: fitX, y: fitX.map(x => (f.m - f.se_m) * (x - (x0 + x1) / 2) + f.m * (x0 + x1) / 2 + f.c), label: 'Shallowest (m − σ)', dash: '4 4', width: 1 }];
    plot.innerHTML = plotSVG(series, { xlabel: L.xlabel, ylabel: L.ylabel, h: 340 }) + legend(series);
  };
  main.querySelectorAll('[data-k]').forEach(inp => inp.addEventListener('input', () => { st.k[inp.dataset.k] = num(inp.value); update(); }));
  main.querySelector('#add').onclick = () => { st.rows.push(L.cols.map(() => NaN)); drawTable(); update(); };
  main.querySelector('#sample').onclick = () => { st.rows = L.data.map(r => [...r]); drawTable(); update(); };
  main.querySelector('#clear').onclick = () => { st.rows = [L.cols.map(() => NaN), L.cols.map(() => NaN), L.cols.map(() => NaN)]; drawTable(); update(); };
  main.querySelector('#print').onclick = () => window.print();
  main.querySelector('#csv').onclick = () => {
    const head = [...L.cols.map(c => `${c.label}${c.unit ? ` (${c.unit})` : ''}`), L.xlabel, L.ylabel];
    const lines = st.rows.map(r => { const o = Object.fromEntries(L.cols.map((c, j) => [c.k, r[j]])); return [...r, L.x(o, st.k), L.y(o, st.k)].join(','); });
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${id}.csv`; a.click(); URL.revokeObjectURL(a.href); toast('CSV downloaded');
  };
  drawTable(); update();
}
