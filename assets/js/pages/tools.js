import { DIMS, CONVERTER_DIMS, toSI, fromSI, unitsOf, defaultUnit, siUnit } from '../core/units.js';
import { compile, parse, dimOf, dimString, dimName, DIMVEC, BASE, partial, solveRoot, variables, evaluate as evalAst } from '../core/expr.js';
import { fmt, num, esc, T, toast, debounce } from '../core/format.js';
import { plotSVG, legend, linspace, linfit, polyfit, COLORS } from '../core/plot.js';
import { EQUATIONS, EQ } from '../data/equations.js';
import { settings } from '../core/store.js';
import { crumbs, pageHead } from './common.js';
import { solverWidget } from './reference.js';

// ── Unit converter ──────────────────────────────────────────────
export function units(main, _, query) {
  const st = { dim: query.get('d') || 'pressure', val: 1, from: null };
  const QUICK = [['pressure', 'MPa', 'N/mm²'], ['torque', 'N·m', 'lbf·ft'], ['power', 'kW', 'hp'], ['pressure', 'bar', 'psi'], ['flow', 'L/min', 'm³/s'], ['energy', 'kWh', 'MJ'], ['temperature', '°C', '°F'], ['force', 'kN', 'lbf'], ['pressure', 'ksi', 'MPa'], ['energy', 'eV', 'J'], ['power', 'TR (refrig. ton)', 'kW'], ['dynvisc', 'cP', 'Pa·s']];
  main.innerHTML = `${crumbs([['Tools', '#/tools'], ['Unit converter']])}${pageHead('06 / TLS / UNIT', 'Unit Converter', `${CONVERTER_DIMS.length} physical quantities. Factors use exact SI definitions (e.g. 1 in = 0.0254 m, 1 lb = 0.45359237 kg, g<sub>n</sub> = 9.80665 m/s²).`)}
    <div class="chips mb" id="dims">${CONVERTER_DIMS.map(d => `<button class="chip${d === st.dim ? ' on' : ''}" data-d="${d}">${esc(DIMS[d].name)}</button>`).join('')}</div>
    <div class="split"><div class="panel tick"><h4>Convert</h4><div class="field mt"><label>Value</label><div class="in"><input id="cv" value="1" inputmode="decimal"><select class="unit" id="cu"></select></div></div><div id="big"></div></div>
    <div class="panel"><h4>Common engineering conversions</h4><div class="tbl-wrap mt" style="max-height:none"><table class="tbl"><tbody>${QUICK.map(([d, a, b]) => `<tr><td class="num">1 ${esc(a)}</td><td>=</td><td class="num">${esc(fmt(fromSI(toSI(1, d, a), d, b), 7))} ${esc(b)}</td></tr>`).join('')}</tbody></table></div></div></div>
    <div class="sec-head"><h2 id="allh"></h2></div><div class="tbl-wrap" style="max-height:none"><table class="tbl"><tbody id="all"></tbody></table></div>`;
  const setDim = d => {
    st.dim = d;
    const us = unitsOf(d);
    const cu = main.querySelector('#cu');
    cu.innerHTML = us.map(u => `<option>${esc(u)}</option>`).join('');
    cu.value = defaultUnit(d, settings.units);
    main.querySelectorAll('#dims .chip').forEach(b => b.classList.toggle('on', b.dataset.d === d));
    draw();
  };
  const draw = () => {
    const v = Number(main.querySelector('#cv').value), from = main.querySelector('#cu').value;
    const si = toSI(v, st.dim, from);
    main.querySelector('#allh').textContent = `${fmt(v, 8)} ${from} in every ${DIMS[st.dim].name.toLowerCase()} unit`;
    main.querySelector('#all').innerHTML = unitsOf(st.dim).map(u => `<tr${u === from ? ' style="background:var(--acc-soft)"' : ''}><td class="num" style="width:50%;font-size:15px">${Number.isFinite(v) ? esc(fmt(fromSI(si, st.dim, u), 8)) : '—'}</td><td class="mono">${esc(u || '(dimensionless)')}</td></tr>`).join('');
    main.querySelector('#big').innerHTML = `<div class="readout primary"><div class="rl">SI value</div><div class="rv">${Number.isFinite(si) ? esc(fmt(si, 8)) : '—'}<span class="u">${esc(siUnit(st.dim))}</span></div></div>`;
  };
  main.querySelectorAll('#dims .chip').forEach(b => b.onclick = () => setDim(b.dataset.d));
  main.querySelector('#cv').oninput = draw;
  main.querySelector('#cu').onchange = draw;
  setDim(st.dim);
}

// ── Equation / formula solver ───────────────────────────────────
export function solver(main, _, query) {
  const topics = [...new Set(EQUATIONS.map(e => e.topic))];
  main.innerHTML = `${crumbs([['Tools', '#/tools'], ['Equation solver']])}${pageHead('06 / TLS / SOLVE', 'Equation Solver', 'Choose an equation from the library (with units), or type your own. Pick the unknown and it is solved numerically — no rearranging needed.')}
    <div class="tabs" style="margin-top:0"><button class="on" data-t="lib">From the library</button><button data-t="own">Type your own</button></div>
    <div id="pane" class="mt"></div>`;
  const pane = main.querySelector('#pane');
  const lib = () => {
    pane.innerHTML = `<div class="field"><label>Equation</label><select class="plain" id="eqs">${topics.map(t => `<optgroup label="${esc(t)}">${EQUATIONS.filter(e => e.topic === t && e.f).map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join('')}</optgroup>`).join('')}</select></div><div class="eqblock" id="eqtex"></div><div id="sw"></div>`;
    const sel = pane.querySelector('#eqs');
    sel.value = query.get('eq') && EQ[query.get('eq')] ? query.get('eq') : 'power';
    const show = () => { const e = EQ[sel.value]; pane.querySelector('#eqtex').innerHTML = T(e.tex, true); solverWidget(pane.querySelector('#sw'), e); };
    sel.onchange = show; show();
  };
  const own = () => {
    pane.innerHTML = `<div class="field"><label>Equation (use * for multiply, ^ for powers; functions sin, cos, sqrt, ln, exp …)</label><div class="in"><input id="oe" value="P = W/t" spellcheck="false"></div></div><div id="ov"></div><div id="or" class="mt"></div>`;
    const st = { vals: { P: 50, W: 500, t: 10 }, unk: 'W' };
    const draw = () => {
      let cc;
      try { cc = compile(pane.querySelector('#oe').value); } catch (e) { pane.querySelector('#ov').innerHTML = `<div class="msg bad">${esc(e.message)}</div>`; return; }
      if (cc.ast.t !== 'eq') { pane.querySelector('#ov').innerHTML = '<div class="msg warn">Include an “=” sign.</div>'; return; }
      cc.vars.forEach(v => { if (!(v in st.vals)) st.vals[v] = 1; });
      if (!cc.vars.includes(st.unk)) st.unk = cc.vars[0];
      pane.querySelector('#ov').innerHTML = `<table class="tbl"><thead><tr><th>Solve for</th><th>Variable</th><th>Value</th></tr></thead><tbody>${cc.vars.map(v => `<tr><td><input type="radio" name="ou" value="${esc(v)}" ${v === st.unk ? 'checked' : ''}></td><td class="mono">${esc(v)}</td><td><input class="plain" data-ov="${esc(v)}" value="${num(st.vals[v])}" ${v === st.unk ? 'readonly' : ''}></td></tr>`).join('')}</tbody></table>`;
      pane.querySelectorAll('[name="ou"]').forEach(r => r.onchange = () => { st.unk = r.value; draw(); });
      pane.querySelectorAll('[data-ov]').forEach(i => i.oninput = () => { const x = Number(i.value); if (Number.isFinite(x)) { st.vals[i.dataset.ov] = x; solve(cc); } });
      solve(cc);
    };
    const solve = cc => {
      const k = st.unk, r = solveRoot(x => cc.f({ ...st.vals, [k]: x }), st.vals[k] || 1);
      if (Number.isFinite(r)) { st.vals[k] = r; const inp = pane.querySelector(`[data-ov="${k}"]`); if (inp) inp.value = num(r); }
      pane.querySelector('#or').innerHTML = Number.isFinite(r) ? `<div class="readout primary"><div class="rl">${esc(k)}</div><div class="rv">${esc(fmt(r, 8))}</div></div><p class="small muted">Values are unitless here — use consistent units (SI recommended), or pick a library equation for unit handling. <a href="#/tools/dimensions">Check dimensions →</a></p>` : '<div class="msg bad">No real solution found.</div>';
    };
    pane.querySelector('#oe').oninput = debounce(draw, 250);
    draw();
  };
  main.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { main.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); b.dataset.t === 'lib' ? lib() : own(); });
  lib();
}

// ── Graphing ────────────────────────────────────────────────────
export function graph(main) {
  main.innerHTML = `${crumbs([['Tools', '#/tools'], ['Graphing']])}${pageHead('06 / TLS / GRAPH', 'Graphing', 'Plot functions of x and experimental data together. Log axes, error bars and least-squares fits.')}
    <div class="calc"><div class="panel tick">
      <div class="field"><label>Functions of x (one per line)</label><textarea class="plain" id="gf" spellcheck="false" style="min-height:90px">sin(x)*exp(-x/5)
0.5*cos(2*x)</textarea></div>
      <div class="grid g2"><div class="field"><label>x min</label><div class="in"><input id="x0" value="0"></div></div><div class="field"><label>x max</label><div class="in"><input id="x1" value="15"></div></div></div>
      <div class="field"><label>Data points (optional) — x, y[, ±err] per line</label><textarea class="plain" id="gd" spellcheck="false" style="min-height:90px">1, 0.72, 0.05
3, 0.02, 0.05
5, -0.35, 0.05
8, 0.60, 0.05</textarea></div>
      <div class="chips"><label class="chip"><input type="checkbox" id="lx"> log x</label><label class="chip"><input type="checkbox" id="ly"> log y</label><label class="chip"><input type="checkbox" id="fit"> linear fit to data</label></div>
    </div><div class="panel"><div id="gp"></div><div id="gm"></div></div></div>`;
  const draw = () => {
    const x0 = Number(main.querySelector('#x0').value), x1 = Number(main.querySelector('#x1').value), logx = main.querySelector('#lx').checked;
    const xs = logx && x0 > 0 ? linspace(Math.log10(x0), Math.log10(x1), 500).map(v => 10 ** v) : linspace(x0, x1, 500);
    const series = [], msgs = [];
    main.querySelector('#gf').value.split('\n').map(s => s.trim()).filter(Boolean).forEach((s, i) => {
      try { const c = compile(s); series.push({ x: xs, y: xs.map(x => { try { return c.f({ x }); } catch (e) { return NaN; } }), label: s, color: COLORS[i % COLORS.length] }); } catch (e) { msgs.push(`“${s}”: ${e.message}`); }
    });
    const pts = main.querySelector('#gd').value.split('\n').map(l => l.split(/[,;\t ]+/).map(Number)).filter(r => r.length >= 2 && r.every(Number.isFinite));
    if (pts.length) {
      series.push({ x: pts.map(p => p[0]), y: pts.map(p => p[1]), yerr: pts.map(p => p[2] || 0), type: 'scatter', label: 'data', color: 'var(--ink)' });
      if (main.querySelector('#fit').checked && pts.length > 2) {
        const f = linfit(pts.map(p => p[0]), pts.map(p => p[1]));
        series.push({ x: xs, y: xs.map(x => f.m * x + f.c), label: `fit: y = ${fmt(f.m, 4)}x + ${fmt(f.c, 4)} (R² = ${f.r2.toFixed(4)})`, dash: '6 4', color: 'var(--c4)' });
      }
    }
    main.querySelector('#gp').innerHTML = plotSVG(series, { logx, logy: main.querySelector('#ly').checked, xlabel: 'x', ylabel: 'y', h: 380 }) + legend(series);
    main.querySelector('#gm').innerHTML = msgs.map(m => `<div class="msg bad">${esc(m)}</div>`).join('');
  };
  main.querySelectorAll('textarea, input').forEach(el => el.addEventListener('input', debounce(draw, 200)));
  draw();
}

// ── Data analysis ───────────────────────────────────────────────
const SAMPLE = `time_s, distance_m
0.0, 0.00
0.5, 1.30
1.0, 4.95
1.5, 11.10
2.0, 19.70
2.5, 30.80
3.0, 44.00`;
export function data(main) {
  main.innerHTML = `${crumbs([['Tools', '#/tools'], ['Data analysis']])}${pageHead('06 / TLS / DATA', 'Data Analysis', 'Paste or import CSV. Get descriptive statistics for every column, then fit y against x with residuals and R². Nothing leaves your browser.')}
    <div class="calc"><div class="panel tick"><div class="field"><label>CSV (first row = headers)</label><textarea class="plain" id="dd" spellcheck="false" style="min-height:220px">${SAMPLE}</textarea></div>
      <div class="btns"><label class="btn ghost sm">Import CSV<input type="file" id="df" accept=".csv,.txt,text/csv" hidden></label><button class="btn ghost sm" id="dx">Download results</button></div>
      <div class="grid g3 mt"><div class="field"><label>x column</label><select class="plain" id="cx"></select></div><div class="field"><label>y column</label><select class="plain" id="cy"></select></div><div class="field"><label>Fit</label><select class="plain" id="fd"><option value="1">Linear</option><option value="2">Quadratic</option><option value="3">Cubic</option></select></div></div></div>
      <div class="panel"><div id="dp"></div><div id="dfit"></div></div></div>
    <div class="sec-head"><h2>Descriptive statistics</h2></div><div class="tbl-wrap" style="max-height:none" id="ds"></div>
    <div class="sec-head"><h2>Residuals</h2></div><div id="dr"></div>`;
  let parsed = null, lastOut = '';
  const parseCSV = () => {
    const lines = main.querySelector('#dd').value.trim().split(/\r?\n/).filter(Boolean);
    const split = l => l.split(/[,;\t]/).map(s => s.trim());
    const head = split(lines[0]);
    const numericHead = head.every(h => Number.isFinite(Number(h)));
    const heads = numericHead ? head.map((_, i) => `col${i + 1}`) : head;
    const rows = (numericHead ? lines : lines.slice(1)).map(split).map(r => r.map(Number));
    const cols = heads.map((h, i) => ({ name: h, v: rows.map(r => r[i]).filter(Number.isFinite) }));
    return { cols, rows };
  };
  const stats = v => {
    const n = v.length, mean = v.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
    const s = [...v].sort((a, b) => a - b), med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    return { n, mean, sd, se: sd / Math.sqrt(n), min: s[0], max: s[n - 1], med, cv: sd / Math.abs(mean) };
  };
  const draw = () => {
    parsed = parseCSV();
    const { cols, rows } = parsed;
    const cx = main.querySelector('#cx'), cy = main.querySelector('#cy');
    const prevX = cx.value, prevY = cy.value;
    cx.innerHTML = cy.innerHTML = cols.map((c, i) => `<option value="${i}">${esc(c.name)}</option>`).join('');
    cx.value = prevX || 0; cy.value = prevY || Math.min(1, cols.length - 1);
    main.querySelector('#ds').innerHTML = `<table class="tbl"><thead><tr><th>Column</th><th class="num">n</th><th class="num">Mean</th><th class="num">SD (sample)</th><th class="num">Std. error</th><th class="num">Median</th><th class="num">Min</th><th class="num">Max</th><th class="num">CV</th></tr></thead><tbody>${cols.map(c => { if (c.v.length < 2) return ''; const s = stats(c.v); return `<tr><td>${esc(c.name)}</td>${[s.n, s.mean, s.sd, s.se, s.med, s.min, s.max].map(v => `<td class="num">${esc(fmt(v, 5))}</td>`).join('')}<td class="num">${(s.cv * 100).toFixed(1)} %</td></tr>`; }).join('')}</tbody></table>`;
    const xi = +cx.value, yi = +cy.value;
    const pts = rows.filter(r => Number.isFinite(r[xi]) && Number.isFinite(r[yi]));
    const x = pts.map(r => r[xi]), y = pts.map(r => r[yi]);
    if (x.length < 3) { main.querySelector('#dp').innerHTML = '<div class="empty">Need at least 3 numeric (x, y) rows.</div>'; return; }
    const deg = +main.querySelector('#fd').value;
    const xs = linspace(Math.min(...x), Math.max(...x), 200);
    let fitTxt, fitY, res;
    if (deg === 1) {
      const f = linfit(x, y); res = f.res; fitY = xs.map(t => f.m * t + f.c);
      fitTxt = `<table class="tbl"><tbody><tr><td>Slope m</td><td class="num">${fmt(f.m, 6)} ± ${fmt(f.se_m, 3)}</td></tr><tr><td>Intercept c</td><td class="num">${fmt(f.c, 6)} ± ${fmt(f.se_c, 3)}</td></tr><tr><td>R²</td><td class="num">${f.r2.toFixed(6)}</td></tr><tr><td>n</td><td class="num">${f.n}</td></tr></tbody></table><p class="small muted">± values are standard errors from least squares.</p>`;
      lastOut = `fit,linear\nslope,${f.m}\nslope_se,${f.se_m}\nintercept,${f.c}\nintercept_se,${f.se_c}\nR2,${f.r2}\n`;
    } else {
      const f = polyfit(x, y, deg); res = x.map((t, i) => y[i] - f.f(t)); fitY = xs.map(f.f);
      fitTxt = `<table class="tbl"><tbody>${f.coef.map((a, i) => `<tr><td>a${i} (x^${i})</td><td class="num">${fmt(a, 6)}</td></tr>`).join('')}<tr><td>R²</td><td class="num">${f.r2.toFixed(6)}</td></tr></tbody></table>`;
      lastOut = `fit,poly${deg}\n${f.coef.map((a, i) => `a${i},${a}`).join('\n')}\nR2,${f.r2}\n`;
    }
    lastOut += `\n${parsed.cols[xi].name},${parsed.cols[yi].name},residual\n${x.map((t, i) => `${t},${y[i]},${res[i]}`).join('\n')}\n`;
    const series = [{ x, y, type: 'scatter', label: 'data', color: 'var(--ink)' }, { x: xs, y: fitY, label: deg === 1 ? 'linear fit' : `degree-${deg} fit`, color: 'var(--acc)' }];
    main.querySelector('#dp').innerHTML = plotSVG(series, { xlabel: parsed.cols[xi].name, ylabel: parsed.cols[yi].name, h: 320 }) + legend(series);
    main.querySelector('#dfit').innerHTML = fitTxt;
    main.querySelector('#dr').innerHTML = plotSVG([{ x, y: res, type: 'scatter', color: 'var(--c3)' }], { xlabel: parsed.cols[xi].name, ylabel: 'residual', h: 200, zero: true });
  };
  main.querySelector('#dd').oninput = debounce(draw, 300);
  ['#cx', '#cy', '#fd'].forEach(s => main.querySelector(s).onchange = draw);
  main.querySelector('#df').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { main.querySelector('#dd').value = t; main.querySelector('#cx').innerHTML = ''; draw(); }); };
  main.querySelector('#dx').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lastOut], { type: 'text/csv' })); a.download = 'physeng-analysis.csv'; a.click(); };
  draw();
}

// ── Uncertainty propagation ─────────────────────────────────────
export function uncertainty(main) {
  main.innerHTML = `${crumbs([['Tools', '#/tools'], ['Uncertainty']])}${pageHead('06 / TLS / UNC', 'Uncertainty Propagation', 'Propagate measurement uncertainties through any formula: first-order (GUM) linear propagation with a contribution breakdown, cross-checked by Monte Carlo.')}
    <div class="calc"><div class="panel tick"><div class="field"><label>Formula (result = …)</label><div class="in"><input id="uf" value="g = 4*pi^2*L/T^2" spellcheck="false"></div><div class="hint">Example: pendulum measurement of g. Use * for multiplication.</div></div><div id="uv"></div></div>
    <div class="panel"><div id="ur"></div><div id="uh" class="mt"></div></div></div>
    <div class="panel mt2"><h4>Quick rules (school level)</h4><ul class="list mt"><li>Adding or subtracting: add <b>absolute</b> uncertainties.</li><li>Multiplying or dividing: add <b>percentage</b> uncertainties.</li><li>Raising to a power n: multiply the percentage uncertainty by |n|.</li><li>Repeated readings: uncertainty ≈ half the range (school) or standard error of the mean (university).</li></ul><p class="small muted">This tool uses the general first-order formula σ_f² = Σ(∂f/∂xᵢ · σᵢ)², which reduces to these rules, assuming independent inputs.</p></div>`;
  const st = { L: [0.995, 0.002], T: [2.003, 0.01] };
  const draw = () => {
    const src = main.querySelector('#uf').value;
    let ast, rhs, name = 'f';
    try { ast = parse(src); } catch (e) { main.querySelector('#uv').innerHTML = `<div class="msg bad">${esc(e.message)}</div>`; return; }
    if (ast.t === 'eq') { rhs = ast.b; if (ast.a.t === 'var') name = ast.a.n; } else rhs = ast;
    const vars = [...variables(rhs)];
    vars.forEach(v => { st[v] ??= [1, 0.01]; });
    const vb = main.querySelector('#uv');
    if (!vb.dataset.vars || vb.dataset.vars !== vars.join(',')) {
      vb.dataset.vars = vars.join(',');
      vb.innerHTML = `<table class="tbl"><thead><tr><th>Variable</th><th>Value</th><th>± Uncertainty (1σ)</th></tr></thead><tbody>${vars.map(v => `<tr><td class="mono">${esc(v)}</td><td><input class="plain" data-uv="${esc(v)}" value="${st[v][0]}"></td><td><input class="plain" data-us="${esc(v)}" value="${st[v][1]}"></td></tr>`).join('')}</tbody></table>`;
      vb.querySelectorAll('input').forEach(i => i.oninput = () => { const v = i.dataset.uv || i.dataset.us, x = Number(i.value); if (Number.isFinite(x)) { st[v][i.dataset.uv ? 0 : 1] = x; compute(); } });
    }
    compute();
    function compute() {
      const evaluate = vv => evalAst(rhs, vv);
      const vals = Object.fromEntries(vars.map(v => [v, st[v][0]]));
      let f0;
      try { f0 = evaluate(vals); } catch (e) { main.querySelector('#ur').innerHTML = `<div class="msg bad">${esc(e.message)}</div>`; return; }
      const contrib = vars.map(v => { const d = partial(evaluate, vals, v); return [v, d, (d * st[v][1]) ** 2]; });
      const varT = contrib.reduce((s, c) => s + c[2], 0), sig = Math.sqrt(varT);
      // Monte Carlo
      const N = 20000, samples = new Float64Array(N);
      const gauss = () => { let u = 0, w = 0; while (u === 0) u = Math.random(); while (w === 0) w = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); };
      for (let i = 0; i < N; i++) { const s = {}; vars.forEach(v => { s[v] = st[v][0] + st[v][1] * gauss(); }); samples[i] = evaluate(s); }
      const fin = [...samples].filter(Number.isFinite), mean = fin.reduce((a, b) => a + b, 0) / fin.length, sd = Math.sqrt(fin.reduce((a, b) => a + (b - mean) ** 2, 0) / (fin.length - 1));
      main.querySelector('#ur').innerHTML = `<div class="readouts"><div class="readout primary"><div class="rl">${esc(name)} (linear propagation)</div><div class="rv">${esc(fmt(f0, 6))} ± ${esc(fmt(sig, 3))}</div></div><div class="readout"><div class="rl">Relative uncertainty</div><div class="rv">${(sig / Math.abs(f0) * 100).toFixed(3)} %</div></div><div class="readout"><div class="rl">Monte Carlo (N = ${N})</div><div class="rv">${esc(fmt(mean, 6))} ± ${esc(fmt(sd, 3))}</div></div></div>
        <h4 class="mt">Contribution to variance</h4>${contrib.map(([v, d, c2]) => `<div class="bar-row"><span class="bl mono">${esc(v)} · ∂f/∂${esc(v)} = ${esc(fmt(d, 3))}</span><div class="bar-track"><div class="bar" style="width:${varT ? c2 / varT * 100 : 0}%"></div></div><span class="bv">${varT ? (c2 / varT * 100).toFixed(1) : 0} %</span></div>`).join('')}`;
      const lo = mean - 4 * sd, hi = mean + 4 * sd, B = 50, bins = new Array(B).fill(0);
      fin.forEach(s => { const k = Math.floor((s - lo) / (hi - lo) * B); if (k >= 0 && k < B) bins[k]++; });
      const bx = bins.map((_, i) => lo + (i + 0.5) * (hi - lo) / B);
      main.querySelector('#uh').innerHTML = plotSVG([{ x: bx, y: bins, type: 'area', label: 'Monte Carlo distribution' }], { xlabel: name, ylabel: 'count', h: 220, marks: [{ x: f0 - sig, label: '−σ' }, { x: f0 + sig, label: '+σ' }] });
    }
  };
  main.querySelector('#uf').oninput = debounce(draw, 300);
  draw();
}

// ── Dimensional analysis ────────────────────────────────────────
const DEFAULT_SYMBOLS = `F = force
m = mass
a = accel
g = accel
v = velocity
u = velocity
c = velocity
t = time
s = length
x = length
h = length
L = length
r = length
d = length
A = area
V = volume
E = energy
W = energy
Q = energy
P = power
p = momentum
rho = density
T = temperature
k = stiffness
f = frequency
omega = frequency
tau = torque
I = current
R = resistance
mu = dynvisc
sigma = pressure
n = amount`;
export function dimensions(main) {
  const EX = ['F = m*a', 'F = m*v', 'E = m*c^2', 'p = m*v', 'P = F*v', 'v = sqrt(2*g*h)', 'E = 1/2*k*x^2', 'T = 2*pi*sqrt(L/g)', 'Re = rho*v*d/mu', 'P = rho*g*h*v'];
  main.innerHTML = `${crumbs([['Tools', '#/tools'], ['Dimensional analysis']])}${pageHead('06 / TLS / DIM', 'Dimensional Analysis', 'Type an equation; each side is reduced to base dimensions (M, L, T, I, Θ, N, J) and compared. Edit the symbol table to define your own symbols.')}
    <div class="calc"><div class="panel tick"><div class="field"><label>Equation</label><div class="in"><input id="de" value="F = m*v" spellcheck="false"></div></div><div class="chips">${EX.map(e => `<button class="chip" data-ex="${esc(e)}">${esc(e)}</button>`).join('')}</div>
      <div class="field mt"><label>Symbol table (symbol = quantity, or base form like "M L^2 T^-2")</label><textarea class="plain" id="dt" spellcheck="false" style="min-height:220px">${DEFAULT_SYMBOLS}</textarea><div class="hint">Quantities: ${Object.keys(DIMVEC).join(', ')}</div></div></div>
    <div class="panel"><div id="dres"></div></div></div>`;
  const parseTable = () => {
    const sym = {};
    main.querySelector('#dt').value.split('\n').forEach(line => {
      const [k, v] = line.split('=').map(s => s?.trim());
      if (!k || !v) return;
      if (DIMVEC[v]) { sym[k] = DIMVEC[v]; return; }
      const vec = [0, 0, 0, 0, 0, 0, 0];
      v.split(/\s+/).forEach(tok => { const m = tok.match(/^(M|L|T|I|Θ|N|J)(?:\^(-?[\d.]+))?$/); if (m) vec[BASE.indexOf(m[1])] += Number(m[2] ?? 1); });
      sym[k] = vec;
    });
    return sym;
  };
  const draw = () => {
    const out = main.querySelector('#dres');
    try {
      const ast = parse(main.querySelector('#de').value);
      const sym = parseTable();
      if (ast.t !== 'eq') { const d = dimOf(ast, sym); out.innerHTML = `<div class="readout primary"><div class="rl">Dimensions</div><div class="rv txt">${esc(dimString(d))}</div></div>`; return; }
      // Allow an undefined dimensionless LHS name like "Re".
      if (ast.a.t === 'var' && !(ast.a.n in sym)) sym[ast.a.n] = DIMVEC.none;
      const r = dimOf(ast, sym);
      out.innerHTML = `<div style="font-size:26px;font-weight:800;color:${r.ok ? 'var(--good)' : 'var(--bad)'}">${r.ok ? '✓ Dimensionally consistent' : '✗ Dimensions inconsistent'}</div>
        <div class="readouts mt"><div class="readout"><div class="rl">Left-hand side</div><div class="rv txt mono">${esc(dimString(r.lhs))}${dimName(r.lhs) ? ` <span class="u">(${esc(dimName(r.lhs))})</span>` : ''}</div></div><div class="readout"><div class="rl">Right-hand side</div><div class="rv txt mono">${esc(dimString(r.rhs))}${dimName(r.rhs) ? ` <span class="u">(${esc(dimName(r.rhs))})</span>` : ''}</div></div></div>
        <p class="small muted mt">Consistency is necessary but not sufficient — dimensionless factors (½, 2π) cannot be checked this way.</p>`;
    } catch (e) { out.innerHTML = `<div class="msg bad">${esc(e.message)}</div>`; }
  };
  main.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => { main.querySelector('#de').value = b.dataset.ex; draw(); });
  main.querySelector('#de').oninput = draw;
  main.querySelector('#dt').oninput = debounce(draw, 300);
  draw();
}
