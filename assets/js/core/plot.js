// Minimal SVG plotting: line/scatter series, error bars, linear or log axes, filled areas.
import { fmt, esc } from './format.js';

export const COLORS = ['var(--acc)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--good)', 'var(--qr)'];

function niceStep(range, target = 6) {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const r = raw / mag;
  return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
}
function ticks(lo, hi, log) {
  if (log) {
    const out = [];
    for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) { const v = Math.pow(10, e); if (v >= lo * 0.999 && v <= hi * 1.001) out.push(v); }
    return out.length >= 2 ? out : [lo, hi];
  }
  const st = niceStep(hi - lo || 1);
  const out = [];
  for (let v = Math.ceil(lo / st) * st; v <= hi + st * 1e-9; v += st) out.push(Math.abs(v) < st * 1e-9 ? 0 : v);
  return out;
}

/**
 * series: [{ x:[], y:[], type:'line'|'scatter'|'area', color, label, yerr:[], width, dash }]
 * opts: { w, h, xlabel, ylabel, logx, logy, xmin, xmax, ymin, ymax, zero, marks:[{x,label}], hlines:[{y,label}], title }
 */
export function plotSVG(series, opts = {}) {
  const W = opts.w ?? 640, H = opts.h ?? 320;
  const m = { l: 62, r: 16, t: opts.title ? 26 : 12, b: 40 };
  const xs = [], ys = [];
  series.forEach(s => s.x.forEach((x, i) => {
    const y = s.y[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (opts.logx && x <= 0) return;
    if (opts.logy && y <= 0) return;
    xs.push(x);
    const e = s.yerr?.[i] ?? 0;
    ys.push(y - e, y + e);
  }));
  if (!xs.length) return `<svg class="plot" viewBox="0 0 ${W} ${H}"><text x="${W / 2}" y="${H / 2}" text-anchor="middle">No finite data to plot</text></svg>`;
  let x0 = opts.xmin ?? Math.min(...xs), x1 = opts.xmax ?? Math.max(...xs);
  let y0 = opts.ymin ?? Math.min(...ys), y1 = opts.ymax ?? Math.max(...ys);
  if (opts.zero && !opts.logy) { y0 = Math.min(y0, 0); y1 = Math.max(y1, 0); }
  if (x0 === x1) { x0 -= 1; x1 += 1; }
  if (y0 === y1) { const d = Math.abs(y0) * 0.1 || 1; y0 -= d; y1 += d; }
  if (!opts.logy && opts.ymin === undefined) { const pad = (y1 - y0) * 0.06; y0 -= (y0 === 0 ? 0 : pad); y1 += pad; }
  const LX = v => opts.logx ? Math.log10(v) : v, LY = v => opts.logy ? Math.log10(v) : v;
  const sx = v => m.l + (LX(v) - LX(x0)) / (LX(x1) - LX(x0)) * (W - m.l - m.r);
  const sy = v => H - m.b - (LY(v) - LY(y0)) / (LY(y1) - LY(y0)) * (H - m.t - m.b);
  let g = '';
  ticks(x0, x1, opts.logx).forEach(v => {
    const X = sx(v);
    g += `<line class="gl" x1="${X}" x2="${X}" y1="${m.t}" y2="${H - m.b}"/><text x="${X}" y="${H - m.b + 15}" text-anchor="middle">${esc(fmt(v, 3))}</text>`;
  });
  ticks(y0, y1, opts.logy).forEach(v => {
    const Y = sy(v);
    g += `<line class="gl" x1="${m.l}" x2="${W - m.r}" y1="${Y}" y2="${Y}"/><text x="${m.l - 6}" y="${Y + 4}" text-anchor="end">${esc(fmt(v, 3))}</text>`;
  });
  if (!opts.logy && y0 < 0 && y1 > 0) g += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${sy(0)}" y2="${sy(0)}" style="stroke:var(--ink3)"/>`;
  g += `<rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="none" class="ax"/>`;
  (opts.hlines || []).forEach(l => {
    const Y = sy(l.y);
    if (Y < m.t || Y > H - m.b) return;
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y}" y2="${Y}" stroke="${l.color || 'var(--ink3)'}" stroke-dasharray="4 4"/><text x="${W - m.r - 4}" y="${Y - 4}" text-anchor="end" style="fill:${l.color || 'var(--ink3)'}">${esc(l.label || '')}</text>`;
  });
  (opts.marks || []).forEach(k => {
    const X = sx(k.x);
    g += `<line x1="${X}" x2="${X}" y1="${m.t}" y2="${H - m.b}" stroke="${k.color || 'var(--ink3)'}" stroke-dasharray="3 3"/><text x="${X + 4}" y="${m.t + 12}" style="fill:${k.color || 'var(--ink2)'}">${esc(k.label || '')}</text>`;
  });
  series.forEach((s, si) => {
    const col = s.color || COLORS[si % COLORS.length];
    const pts = [];
    s.x.forEach((x, i) => {
      const y = s.y[i];
      if (!Number.isFinite(x) || !Number.isFinite(y) || (opts.logx && x <= 0) || (opts.logy && y <= 0)) { pts.push(null); return; }
      pts.push([sx(x), sy(y)]);
    });
    if (s.type === 'scatter') {
      pts.forEach((p, i) => {
        if (!p) return;
        const e = s.yerr?.[i];
        if (e) g += `<line x1="${p[0]}" x2="${p[0]}" y1="${sy(s.y[i] - e)}" y2="${sy(s.y[i] + e)}" stroke="${col}" stroke-width="1"/><line x1="${p[0] - 3}" x2="${p[0] + 3}" y1="${sy(s.y[i] - e)}" y2="${sy(s.y[i] - e)}" stroke="${col}"/><line x1="${p[0] - 3}" x2="${p[0] + 3}" y1="${sy(s.y[i] + e)}" y2="${sy(s.y[i] + e)}" stroke="${col}"/>`;
        g += `<rect x="${p[0] - 3}" y="${p[1] - 3}" width="6" height="6" fill="none" stroke="${col}" stroke-width="1.6"/>`;
      });
    } else {
      let d = '', pen = false;
      pts.forEach(p => { if (!p) { pen = false; return; } d += (pen ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); pen = true; });
      if (s.type === 'area' && pts.length && pts[0] && pts[pts.length - 1]) {
        const base = sy(opts.logy ? y0 : Math.max(y0, Math.min(0, y1)));
        g += `<path d="${d}L${pts[pts.length - 1][0]} ${base}L${pts[0][0]} ${base}Z" fill="${col}" fill-opacity=".14" stroke="none"/>`;
      }
      g += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${s.width ?? 2}" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''} stroke-linejoin="round"/>`;
    }
  });
  if (opts.xlabel) g += `<text class="ttl" x="${(m.l + W - m.r) / 2}" y="${H - 6}" text-anchor="middle">${esc(opts.xlabel)}</text>`;
  if (opts.ylabel) g += `<text class="ttl" x="14" y="${(m.t + H - m.b) / 2}" text-anchor="middle" transform="rotate(-90 14 ${(m.t + H - m.b) / 2})">${esc(opts.ylabel)}</text>`;
  if (opts.title) g += `<text class="ttl" x="${m.l}" y="16">${esc(opts.title)}</text>`;
  return `<svg class="plot" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">${g}</svg>`;
}

export function legend(series) {
  return `<div class="legend">${series.filter(s => s.label).map((s, i) => `<span><i style="background:${s.color || COLORS[i % COLORS.length]}"></i>${esc(s.label)}</span>`).join('')}</div>`;
}

export function linspace(a, b, n) { const out = []; for (let i = 0; i < n; i++) out.push(a + (b - a) * i / (n - 1)); return out; }

// Least-squares linear fit y = m x + c, returns slope/intercept with standard errors and R².
export function linfit(x, y) {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxx += (x[i] - mx) ** 2; sxy += (x[i] - mx) * (y[i] - my); syy += (y[i] - my) ** 2; }
  const m = sxy / sxx, c = my - m * mx;
  const res = y.map((yi, i) => yi - (m * x[i] + c));
  const sse = res.reduce((a, r) => a + r * r, 0);
  const r2 = syy ? 1 - sse / syy : 1;
  const s2 = n > 2 ? sse / (n - 2) : NaN;
  return { m, c, r2, res, se_m: Math.sqrt(s2 / sxx), se_c: Math.sqrt(s2 * (1 / n + mx * mx / sxx)), n };
}

// Polynomial least squares (normal equations with Gaussian elimination) — fine for low order.
export function polyfit(x, y, deg) {
  const N = deg + 1;
  const A = Array.from({ length: N }, () => new Array(N + 1).fill(0));
  for (let i = 0; i < x.length; i++) {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) A[r][c] += Math.pow(x[i], r + c);
      A[r][N] += y[i] * Math.pow(x[i], r);
    }
  }
  for (let c = 0; c < N; c++) {
    let piv = c;
    for (let r = c + 1; r < N; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    for (let r = 0; r < N; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k <= N; k++) A[r][k] -= f * A[c][k]; }
  }
  const coef = A.map((row, i) => row[N] / row[i]);
  const f = t => coef.reduce((s, a, i) => s + a * Math.pow(t, i), 0);
  const my = y.reduce((a, b) => a + b, 0) / y.length;
  const sse = y.reduce((s, yi, i) => s + (yi - f(x[i])) ** 2, 0), sst = y.reduce((s, yi) => s + (yi - my) ** 2, 0);
  return { coef, f, r2: sst ? 1 - sse / sst : 1 };
}
