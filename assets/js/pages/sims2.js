// Second batch of simulations.
import { fmt, esc } from '../core/format.js';
import { plotSVG, legend } from '../core/plot.js';
import { fft } from '../core/numeric.js';
import { MATERIALS, materialSI } from '../data/materials.js';
import { css, slider, bindSliders, shell, loop } from './sims.js';

const PI = Math.PI;
const mono = '11px JetBrains Mono, monospace';

// ── Collisions ─────────────────────────────────────────────────
export function collisions(main) {
  const { cv, fit, ro } = shell(main, 'collisions', `${slider('m1', 'Mass 1 (kg)', 0.5, 10, 0.5, 2)}${slider('m2', 'Mass 2 (kg)', 0.5, 10, 0.5, 1)}${slider('u1', 'Velocity 1 (m/s)', -5, 5, 0.1, 3)}${slider('u2', 'Velocity 2 (m/s)', -5, 5, 0.1, -1)}${slider('e', 'Coefficient of restitution e', 0, 1, 0.05, 1)}<button class="btn" id="go">Reset ▶</button>`, 0.45);
  const v = bindSliders(main, ['m1', 'm2', 'u1', 'u2', 'e']);
  let s;
  const reset = () => { s = { x1: 2, x2: 8, v1: v.u1, v2: v.u2, hit: false, t: 0 }; };
  reset(); main.querySelector('#go').onclick = reset; main.querySelectorAll('input').forEach(i => i.addEventListener('change', reset));
  return loop(dt => {
    const w1 = 0.4 + 0.1 * Math.cbrt(v.m1), w2 = 0.4 + 0.1 * Math.cbrt(v.m2);
    s.x1 += s.v1 * dt; s.x2 += s.v2 * dt; s.t += dt;
    if (!s.hit && s.x2 - s.x1 <= (w1 + w2) / 2 && s.v1 > s.v2) {
      const M = v.m1 + v.m2, p = v.m1 * s.v1 + v.m2 * s.v2, du = s.v1 - s.v2;
      s.v1 = (p - v.m2 * v.e * du) / M; s.v2 = (p + v.m1 * v.e * du) / M; s.hit = true;
    }
    if (s.x1 < -1 || s.x2 > 11 || s.t > 12) reset();
    const { ctx, w, h } = fit(), X = x => 20 + x / 10 * (w - 40);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = css('--line2'); ctx.fillRect(0, h * 0.62, w, 2);
    const cart = (x, wd, m, col, vel) => { const W = wd * (w - 40) / 10, H = 30 + 6 * Math.cbrt(m); ctx.fillStyle = col; ctx.fillRect(X(x) - W / 2, h * 0.62 - H, W, H); ctx.fillStyle = css('--bg'); ctx.font = mono; ctx.fillText(`${m} kg`, X(x) - W / 2 + 4, h * 0.62 - H / 2); ctx.strokeStyle = css('--ink'); ctx.beginPath(); ctx.moveTo(X(x), h * 0.62 - H - 10); ctx.lineTo(X(x) + vel * 25, h * 0.62 - H - 10); ctx.stroke(); };
    cart(s.x1, w1, v.m1, css('--acc'), s.v1); cart(s.x2, w2, v.m2, css('--c2'), s.v2);
    const p = v.m1 * s.v1 + v.m2 * s.v2, KE = 0.5 * v.m1 * s.v1 ** 2 + 0.5 * v.m2 * s.v2 ** 2, KE0 = 0.5 * v.m1 * v.u1 ** 2 + 0.5 * v.m2 * v.u2 ** 2;
    ro.innerHTML = `<div class="grid g4"><div class="readout"><div class="rl">v₁</div><div class="rv">${s.v1.toFixed(2)}<span class="u">m/s</span></div></div><div class="readout"><div class="rl">v₂</div><div class="rv">${s.v2.toFixed(2)}<span class="u">m/s</span></div></div><div class="readout"><div class="rl">Total momentum</div><div class="rv">${p.toFixed(2)}<span class="u">kg·m/s</span></div></div><div class="readout"><div class="rl">Kinetic energy</div><div class="rv">${KE.toFixed(2)}<span class="u">J (${KE0 ? (KE / KE0 * 100).toFixed(0) : 100} %)</span></div></div></div><p class="small muted">Momentum is conserved in every collision; kinetic energy only when e = 1. <a href="#/calc/collision">Collision calculator →</a></p>`;
  });
}

// ── Waves & superposition ──────────────────────────────────────
export function waves(main) {
  const { cv, fit, ro } = shell(main, 'waves', `${slider('A1', 'Wave 1 amplitude', 0, 1, 0.05, 0.6)}${slider('l1', 'Wave 1 wavelength', 0.5, 4, 0.1, 2)}${slider('A2', 'Wave 2 amplitude', 0, 1, 0.05, 0.6)}${slider('l2', 'Wave 2 wavelength', 0.5, 4, 0.1, 2)}<div class="field"><label>Wave 2 direction</label><select class="plain" id="dir"><option value="-1">Leftward (→ standing wave if equal)</option><option value="1">Rightward (→ beats/interference)</option></select></div>${slider('c', 'Wave speed', 0.2, 3, 0.1, 1)}`, 0.5);
  const v = bindSliders(main, ['A1', 'l1', 'A2', 'l2', 'c']);
  let t = 0;
  return loop(dt => {
    t += dt;
    const { ctx, w, h } = fit(), L = 10, X = x => x / L * w, Y = (y, off) => off - y * h * 0.12;
    ctx.clearRect(0, 0, w, h);
    const dir = +main.querySelector('#dir').value;
    const y1 = x => v.A1 * Math.sin(2 * PI * (x - v.c * t) / v.l1);
    const w2 = x => v.A2 * Math.sin(2 * PI * (x - dir * v.c * t) / v.l2);
    const rows = [[y1, css('--c2'), h * 0.18, 'wave 1'], [w2, css('--c3'), h * 0.45, 'wave 2'], [x => y1(x) + w2(x), css('--acc'), h * 0.78, 'sum']];
    rows.forEach(([f, col, off, lab]) => { ctx.strokeStyle = css('--line'); ctx.beginPath(); ctx.moveTo(0, off); ctx.lineTo(w, off); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 400; i++) { const x = L * i / 400; i ? ctx.lineTo(X(x), Y(f(x), off)) : ctx.moveTo(X(x), Y(f(x), off)); } ctx.stroke(); ctx.fillStyle = col; ctx.font = mono; ctx.fillText(lab, 6, off - h * 0.12); });
    const standing = dir < 0 && Math.abs(v.l1 - v.l2) < 1e-9 && Math.abs(v.A1 - v.A2) < 1e-9;
    ro.innerHTML = `<p class="small muted">${standing ? `Standing wave: nodes every λ/2 = ${(v.l1 / 2).toFixed(2)} (fixed points), antinodes between.` : dir > 0 && v.l1 !== v.l2 ? 'Same direction, different wavelengths → a moving beat envelope.' : 'Superposition: the displacements simply add at every point.'} Frequency f = c/λ: ${(v.c / v.l1).toFixed(2)} and ${(v.c / v.l2).toFixed(2)}. <a href="#/calc/standing-wave">Standing-wave calculator →</a></p>`;
  });
}

// ── Thin lens ray diagram ──────────────────────────────────────
export function optics(main) {
  const { cv, fit, ro } = shell(main, 'optics', `${slider('f', 'Focal length (cm, − = diverging)', -30, 30, 0.5, 10)}${slider('u', 'Object distance (cm)', 2, 60, 0.5, 25)}${slider('ho', 'Object height (cm)', 1, 10, 0.5, 5)}<p class="small muted">Drag the object arrow left/right too.</p>`, 0.5);
  const v = bindSliders(main, ['f', 'u', 'ho']);
  let drag = false, S = 1, cx = 0;
  cv.addEventListener('pointerdown', e => { drag = true; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag) return; const r = cv.getBoundingClientRect(); const u = Math.max(2, Math.min(60, (cx - (e.clientX - r.left)) / S)); const el = main.querySelector('#u'); el.value = u.toFixed(1); el.dispatchEvent(new Event('input')); });
  cv.addEventListener('pointerup', () => { drag = false; });
  return loop(() => {
    const { ctx, w, h } = fit(); cx = w / 2; const cy = h / 2; S = w / 140;
    const f = Math.abs(v.f) < 0.5 ? 0.5 : v.f, u = v.u, vi = 1 / (1 / f - 1 / u), m = -vi / u, hi = m * v.ho;
    const P = (x, y) => [cx + x * S, cy - y * S];
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = css('--line2'); ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.strokeStyle = css('--c2'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy - h * 0.4); ctx.lineTo(cx, cy + h * 0.4); ctx.stroke();
    [f, -f].forEach(x => { ctx.fillStyle = css('--c4'); ctx.beginPath(); ctx.arc(...P(x, 0), 4, 0, 7); ctx.fill(); });
    ctx.font = mono; ctx.fillStyle = css('--c4'); ctx.fillText('F', ...P(f, -3)); ctx.fillText('F', ...P(-f, -3));
    const arrow = (x, y, col, dash) => { const [a, b] = P(x, 0), [c, d] = P(x, y); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(c, d, 4, 0, 7); ctx.fill(); };
    arrow(-u, v.ho, css('--acc'), []);
    const ray = (pts, col, dash = []) => { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash(dash); ctx.beginPath(); pts.forEach((p, i) => { const [a, b] = P(...p); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.stroke(); ctx.setLineDash([]); };
    const far = 80, O = [-u, v.ho];
    // Ray 1: parallel then through (or from) focal point
    const s1 = -v.ho / f; ray([O, [0, v.ho], [far, v.ho + s1 * far]], css('--c3')); if (vi < 0 || f < 0) ray([[0, v.ho], [-far, v.ho - s1 * far]], css('--c3'), [4, 4]);
    // Ray 2: through centre
    ray([O, [far, O[1] + (0 - O[1]) / (0 - O[0]) * (far - O[0])]], css('--ink2'));
    if (vi < 0) ray([[0, 0], [-far, -(0 - O[1]) / (0 - O[0]) * far]], css('--ink2'), [4, 4]);
    if (Number.isFinite(vi) && Math.abs(vi) < 200) arrow(vi, hi, css('--c2'), vi < 0 ? [5, 4] : []);
    ro.innerHTML = `<div class="grid g4"><div class="readout"><div class="rl">Image distance v</div><div class="rv">${Number.isFinite(vi) ? vi.toFixed(1) : '∞'}<span class="u">cm</span></div></div><div class="readout"><div class="rl">Magnification</div><div class="rv">${Number.isFinite(m) ? m.toFixed(2) : '∞'}</div></div><div class="readout"><div class="rl">Image</div><div class="rv txt">${!Number.isFinite(vi) ? 'at infinity' : `${vi > 0 ? 'real' : 'virtual'}, ${m < 0 ? 'inverted' : 'upright'}`}</div></div><div class="readout"><div class="rl">Power</div><div class="rv">${(100 / f).toFixed(1)}<span class="u">D</span></div></div></div><p class="small muted">1/f = 1/u + 1/v (real-is-positive). Dashed lines are virtual ray extensions. <a href="#/calc/lens">Lens calculator →</a></p>`;
  });
}

// ── Electric field & potential ─────────────────────────────────
export function efield(main) {
  const { cv, fit, ro } = shell(main, 'efield', `<div class="btns"><button class="btn sm" id="addp">+ charge</button><button class="btn ghost sm" id="addn">− charge</button><button class="btn ghost sm" id="clr">Dipole preset</button></div><div class="chips mt"><label class="chip"><input type="checkbox" id="pot" checked> potential map</label><label class="chip"><input type="checkbox" id="lines" checked> field lines</label></div><p class="small muted mt">Drag charges. Double-click a charge to flip its sign.</p>`, 0.6);
  let Q = [{ x: 0.35, y: 0.5, q: 1 }, { x: 0.65, y: 0.5, q: -1 }], drag = -1, dirty = true;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  cv.addEventListener('pointerdown', e => { const [x, y] = pos(e); drag = Q.findIndex(c => Math.hypot(c.x - x, (c.y - y) * 0.6) < 0.03); if (drag >= 0) cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (drag < 0) return; const [x, y] = pos(e); Q[drag].x = x; Q[drag].y = y; dirty = true; });
  cv.addEventListener('pointerup', () => { drag = -1; });
  cv.addEventListener('dblclick', e => { const [x, y] = pos(e); const i = Q.findIndex(c => Math.hypot(c.x - x, (c.y - y) * 0.6) < 0.03); if (i >= 0) { Q[i].q *= -1; dirty = true; } });
  main.querySelector('#addp').onclick = () => { Q.push({ x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.6, q: 1 }); dirty = true; };
  main.querySelector('#addn').onclick = () => { Q.push({ x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.6, q: -1 }); dirty = true; };
  main.querySelector('#clr').onclick = () => { Q = [{ x: 0.35, y: 0.5, q: 1 }, { x: 0.65, y: 0.5, q: -1 }]; dirty = true; };
  main.querySelectorAll('input').forEach(i => i.onchange = () => { dirty = true; });
  return loop(() => {
    if (!dirty) return; dirty = false;
    const { ctx, w, h } = fit();
    const V = (x, y) => Q.reduce((s, c) => s + c.q / Math.max(0.01, Math.hypot((x - c.x) * w, (y - c.y) * h) / w), 0);
    const E = (x, y) => Q.reduce((s, c) => { const dx = (x - c.x) * w, dy = (y - c.y) * h, r = Math.max(2, Math.hypot(dx, dy)); return [s[0] + c.q * dx / r ** 3, s[1] + c.q * dy / r ** 3]; }, [0, 0]);
    ctx.clearRect(0, 0, w, h);
    if (main.querySelector('#pot').checked) {
      const step = 6;
      for (let px = 0; px < w; px += step) for (let py = 0; py < h; py += step) { const p = V(px / w, py / h), t = Math.tanh(p / 8); ctx.fillStyle = t > 0 ? `rgba(200,245,60,${t * 0.35})` : `rgba(255,95,162,${-t * 0.35})`; ctx.fillRect(px, py, step, step); }
    }
    if (main.querySelector('#lines').checked) {
      ctx.strokeStyle = css('--ink2'); ctx.lineWidth = 1;
      Q.filter(c => c.q > 0).forEach(c => { for (let k = 0; k < 16; k++) { let x = c.x * w + 6 * Math.cos(2 * PI * k / 16), y = c.y * h + 6 * Math.sin(2 * PI * k / 16); ctx.beginPath(); ctx.moveTo(x, y); for (let s = 0; s < 800; s++) { const [ex, ey] = E(x / w, y / h), m = Math.hypot(ex, ey) || 1; x += 3 * ex / m; y += 3 * ey / m; ctx.lineTo(x, y); if (x < 0 || y < 0 || x > w || y > h || Q.some(d => d.q < 0 && Math.hypot(x - d.x * w, y - d.y * h) < 6)) break; } ctx.stroke(); } });
    }
    Q.forEach(c => { ctx.fillStyle = c.q > 0 ? css('--acc') : css('--c3'); ctx.beginPath(); ctx.arc(c.x * w, c.y * h, 11, 0, 7); ctx.fill(); ctx.fillStyle = css('--bg'); ctx.font = 'bold 14px sans-serif'; ctx.fillText(c.q > 0 ? '+' : '−', c.x * w - 4, c.y * h + 5); });
    ro.innerHTML = `<p class="small muted">Field lines start on + and end on − charges; colour shows electric potential (lime +, magenta −). Field lines are always perpendicular to equipotentials. <a href="#/calc/coulomb">Coulomb calculator →</a></p>`;
  });
}

// ── Kepler orbits ──────────────────────────────────────────────
export function kepler(main) {
  const { cv, fit, ro } = shell(main, 'kepler', `${slider('e', 'Eccentricity', 0, 0.9, 0.01, 0.6)}${slider('sp', 'Speed', 0.2, 4, 0.1, 1)}${slider('ns', 'Area sectors per orbit', 4, 16, 1, 8)}<p class="small muted">Kepler's 2nd law: equal areas in equal times — the shaded sectors all have the same area.</p>`, 0.6);
  const v = bindSliders(main, ['e', 'sp', 'ns']);
  let M = 0, prevE = -1;
  const solveE = (Mv, e) => { let E = Mv; for (let i = 0; i < 30; i++) E -= (E - e * Math.sin(E) - Mv) / (1 - e * Math.cos(E)); return E; };
  return loop(dt => {
    if (v.e !== prevE) { M = 0; prevE = v.e; }
    M += dt * v.sp * 0.8;
    const { ctx, w, h } = fit(), a = Math.min(w * 0.38, h * 0.45 / Math.sqrt(1 - v.e ** 2)), b = a * Math.sqrt(1 - v.e ** 2), cx = w / 2 + a * v.e, cy = h / 2;
    const pos = Mv => { const E = solveE(Mv, v.e); return [cx + a * (Math.cos(E) - v.e) - a * 0, cy - b * Math.sin(E)]; };
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = css('--line2'); ctx.beginPath(); ctx.ellipse(cx - a * v.e, cy, a, b, 0, 0, 2 * PI); ctx.stroke();
    const n = v.ns;
    for (let k = 0; k < n; k += 2) { ctx.fillStyle = css('--acc'); ctx.globalAlpha = 0.15; ctx.beginPath(); ctx.moveTo(cx, cy); for (let j = 0; j <= 30; j++) { const [x, y] = pos(2 * PI * (k + j / 30) / n); ctx.lineTo(x, y); } ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.fillStyle = css('--c4'); ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill();
    const [px, py] = pos(M);
    ctx.strokeStyle = css('--ink3'); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
    ctx.fillStyle = css('--c2'); ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.fill();
    const E = solveE(M % (2 * PI), v.e), r = 1 - v.e * Math.cos(E), speed = Math.sqrt(2 / r - 1);
    ro.innerHTML = `<div class="grid g4"><div class="readout"><div class="rl">r / a</div><div class="rv">${r.toFixed(3)}</div></div><div class="readout"><div class="rl">Speed / circular speed at a</div><div class="rv">${speed.toFixed(3)}</div></div><div class="readout"><div class="rl">Perihelion / aphelion speed ratio</div><div class="rv">${((1 + v.e) / (1 - v.e)).toFixed(2)}</div></div><div class="readout"><div class="rl">T² ∝ a³</div><div class="rv txt">3rd law</div></div></div><p class="small muted">Position from Kepler's equation M = E − e sin E; speed from the vis-viva equation v² = GM(2/r − 1/a). <a href="#/calc/orbit">Orbit calculator →</a></p>`;
  });
}

// ── 1D transient heat conduction ───────────────────────────────
export function heat(main) {
  const opts = MATERIALS.filter(m => m.k && m.cp && m.rho).map(m => `<option value="${m.id}"${m.id === 'cu-c11000' ? ' selected' : ''}>${esc(m.name)}</option>`).join('');
  const { cv, fit, ro } = shell(main, 'heat', `<div class="field"><label>Material</label><select class="plain" id="mat">${opts}</select></div>${slider('L', 'Rod length (cm)', 2, 50, 1, 20)}${slider('TL', 'Left end (°C)', 0, 300, 5, 200)}${slider('TR', 'Right end (°C)', 0, 300, 5, 20)}<div class="field"><label>Right boundary</label><select class="plain" id="bc"><option value="T">Fixed temperature</option><option value="ins">Insulated</option></select></div>${slider('sp', 'Time acceleration (×)', 1, 2000, 1, 200)}<button class="btn" id="rs">Reset ▶</button>`, 0.5);
  const v = bindSliders(main, ['L', 'TL', 'TR', 'sp']);
  const N = 60; let T, t;
  const reset = () => { T = new Array(N).fill(20); t = 0; };
  reset(); main.querySelector('#rs').onclick = reset; main.querySelector('#mat').onchange = reset;
  return loop(dt => {
    const m = materialSI(main.querySelector('#mat').value), alpha = m.k / (m.rho * m.cp), L = v.L / 100, dx = L / (N - 1), dtmax = 0.45 * dx * dx / alpha;
    let rem = dt * v.sp;
    while (rem > 0) { const h = Math.min(dtmax, rem); rem -= h; t += h; const n = [...T]; for (let i = 1; i < N - 1; i++) n[i] = T[i] + alpha * h / dx ** 2 * (T[i + 1] - 2 * T[i] + T[i - 1]); n[0] = v.TL; n[N - 1] = main.querySelector('#bc').value === 'T' ? v.TR : n[N - 2]; T = n; }
    const { ctx, w, h } = fit();
    ctx.clearRect(0, 0, w, h);
    const col = x => { const f = Math.max(0, Math.min(1, (x - 0) / 300)); return `rgb(${Math.round(40 + 215 * f)},${Math.round(80 + 100 * (1 - Math.abs(f - 0.5) * 2))},${Math.round(255 * (1 - f))})`; };
    T.forEach((x, i) => { ctx.fillStyle = col(x); ctx.fillRect(20 + i * (w - 40) / N, h * 0.12, (w - 40) / N + 1, h * 0.14); });
    ctx.strokeStyle = css('--acc'); ctx.lineWidth = 2; ctx.beginPath();
    T.forEach((x, i) => { const X = 20 + i * (w - 40) / (N - 1), Y = h * 0.92 - x / 300 * h * 0.58; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
    ctx.fillStyle = css('--ink3'); ctx.font = mono; ctx.fillText('T(x)', 22, h * 0.36); ctx.fillText('300 °C', w - 60, h * 0.36); ctx.fillText('0 °C', w - 50, h * 0.92);
    ro.innerHTML = `<div class="grid g4"><div class="readout"><div class="rl">Elapsed (real) time</div><div class="rv">${t < 120 ? t.toFixed(1) + ' s' : (t / 60).toFixed(1) + ' min'}</div></div><div class="readout"><div class="rl">Thermal diffusivity α</div><div class="rv">${fmt(alpha * 1e6, 3)}<span class="u">mm²/s</span></div></div><div class="readout"><div class="rl">Diffusion time L²/α</div><div class="rv">${fmt(L * L / alpha / 60, 3)}<span class="u">min</span></div></div><div class="readout"><div class="rl">Mid-point T</div><div class="rv">${T[N >> 1].toFixed(1)}<span class="u">°C</span></div></div></div><p class="small muted">∂T/∂t = α ∂²T/∂x², explicit finite differences (stable step Δt ≤ Δx²/2α). Copper equalises ~100× faster than steel.</p>`;
  });
}

// ── Tensile test ───────────────────────────────────────────────
export function tensile(main) {
  const opts = MATERIALS.filter(m => m.Sy && m.Su && m.el > 1).map(m => `<option value="${m.id}"${m.id === 'st-1018-hr' ? ' selected' : ''}>${esc(m.name)}</option>`).join('');
  const { cv, fit, ro } = shell(main, 'tensile', `<div class="field"><label>Material</label><select class="plain" id="mat">${opts}</select></div>${slider('sp', 'Test speed', 0.2, 5, 0.1, 1)}<button class="btn" id="rs">Restart ▶</button><p class="small muted mt">Curve built from the database values: linear to S_y, work hardening to S_u at uniform elongation, then necking to fracture at the listed elongation.</p>`, 0.55);
  const v = bindSliders(main, ['sp']);
  let e = 0;
  main.querySelector('#rs').onclick = () => { e = 0; }; main.querySelector('#mat').onchange = () => { e = 0; };
  const curve = (m, eps) => {
    const E = m.E, Sy = m.Sy, Su = m.Su, ey = Sy / E, ef = m.el / 100, eu = Math.max(ey * 2, Math.min(0.6 * ef, 0.25));
    if (eps <= ey) return E * eps;
    if (eps <= eu) { const x = (eps - ey) / (eu - ey); return Sy + (Su - Sy) * (1 - (1 - x) ** 2); }
    if (eps <= ef) { const x = (eps - eu) / (ef - eu); return Su - (Su - Sy * 0.8) * 0.35 * x * x; }
    return NaN;
  };
  return loop(dt => {
    const m = materialSI(main.querySelector('#mat').value), ef = m.el / 100;
    e = Math.min(ef * 1.02, e + dt * v.sp * ef / 8);
    const { ctx, w, h } = fit(), gx = w * 0.42, X = s => gx + 10 + s / (ef * 1.05) * (w - gx - 30), Y = s => h - 30 - s / (m.Su * 1.15) * (h - 50);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = css('--line2'); ctx.strokeRect(gx + 10, 20, w - gx - 30, h - 50);
    ctx.strokeStyle = css('--acc'); ctx.lineWidth = 2.5; ctx.beginPath();
    let last = [0, 0], tough = 0, prev = [0, 0];
    for (let i = 0; i <= 400; i++) { const eps = Math.min(e, ef) * i / 400, s = curve(m, eps); if (!Number.isFinite(s)) break; i ? ctx.lineTo(X(eps), Y(s)) : ctx.moveTo(X(eps), Y(s)); tough += (s + prev[1]) / 2 * (eps - prev[0]); prev = [eps, s]; last = [eps, s]; }
    ctx.stroke();
    ctx.fillStyle = css('--ink3'); ctx.font = mono; ctx.fillText('strain ε', w - 70, h - 12); ctx.fillText('σ (MPa)', gx + 14, 16);
    [['S_y', m.Sy], ['S_u', m.Su]].forEach(([l, s]) => { ctx.strokeStyle = css('--line2'); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(gx + 10, Y(s)); ctx.lineTo(w - 20, Y(s)); ctx.stroke(); ctx.setLineDash([]); ctx.fillText(`${l} ${(s / 1e6).toFixed(0)}`, w - 90, Y(s) - 4); });
    // specimen
    const broken = e >= ef, L0 = h * 0.55, len = L0 * (1 + Math.min(e, ef)), neck = e > 0.6 * ef ? Math.min(1, (e - 0.6 * ef) / (0.4 * ef)) : 0, cx = gx * 0.5, top = (h - len) / 2, W = 34;
    ctx.fillStyle = css('--ink3'); ctx.fillRect(cx - 30, top - 26, 60, 26); ctx.fillRect(cx - 30, top + len, 60, 26);
    ctx.fillStyle = css('--c2');
    for (let i = 0; i < 60; i++) { const y = top + len * i / 60, z = (i - 30) / 30, wd = W * (1 - 0.5 * neck * Math.exp(-z * z * 30)); if (broken && Math.abs(i - 30) < 1) continue; ctx.fillRect(cx - wd / 2, y, wd, len / 60 + 1); }
    ro.innerHTML = `<div class="grid g4"><div class="readout"><div class="rl">Strain</div><div class="rv">${(Math.min(e, ef) * 100).toFixed(1)}<span class="u">%</span></div></div><div class="readout"><div class="rl">Stress</div><div class="rv">${Number.isFinite(last[1]) ? (last[1] / 1e6).toFixed(0) : '—'}<span class="u">MPa</span></div></div><div class="readout"><div class="rl">Toughness (area)</div><div class="rv">${(tough / 1e6).toFixed(0)}<span class="u">MJ/m³</span></div></div><div class="readout"><div class="rl">State</div><div class="rv txt">${broken ? 'Fractured' : e > 0.6 * ef ? 'Necking' : e > m.Sy / m.E ? 'Plastic' : 'Elastic'}</div></div></div><p class="small muted">Schematic curve shape from ${esc(m.name)} database values (E, S_y, S_u, elongation) — not measured test data. <a href="#/learn/stress-strain">Lesson →</a></p>`;
  });
}

// ── Quantum wave packet (split-step Fourier) ───────────────────
export function packet(main) {
  const { cv, fit, ro } = shell(main, 'packet', `${slider('k0', 'Packet momentum k₀', 1, 6, 0.1, 3.5)}${slider('V0', 'Barrier height V₀ (× E)', 0, 2, 0.05, 1.2)}${slider('a', 'Barrier width', 0.2, 3, 0.05, 0.6)}${slider('sp', 'Speed', 0.2, 3, 0.1, 1)}<button class="btn" id="rs">Launch ▶</button>`, 0.5);
  const v = bindSliders(main, ['k0', 'V0', 'a', 'sp']);
  const N = 1024, L = 200, dx = L / N, xs = Array.from({ length: N }, (_, i) => -L / 2 + i * dx);
  let re, im, Vx, t;
  const reset = () => {
    const E = v.k0 ** 2 / 2, s = 5; Vx = xs.map(x => (x > 0 && x < v.a ? v.V0 * E : 0));
    re = xs.map(x => Math.exp(-((x + 40) ** 2) / (4 * s * s)) * Math.cos(v.k0 * x)); im = xs.map(x => Math.exp(-((x + 40) ** 2) / (4 * s * s)) * Math.sin(v.k0 * x));
    const nrm = Math.sqrt(re.reduce((a, r, i) => a + r * r + im[i] * im[i], 0) * dx); re = re.map(r => r / nrm); im = im.map(r => r / nrm); t = 0;
  };
  reset(); main.querySelector('#rs').onclick = reset; main.querySelectorAll('input').forEach(i => i.addEventListener('change', reset));
  const ks = Array.from({ length: N }, (_, i) => 2 * PI * (i < N / 2 ? i : i - N) / L);
  const ifft = (R, I) => { const f = fft(Array.from(R), Array.from(I).map(x => -x)); return { re: f.re.map(x => x / N), im: Array.from(f.im).map(x => -x / N) }; };
  return loop(dt => {
    const h = 0.05, steps = Math.round(4 * v.sp);
    for (let s = 0; s < steps; s++) {
      // half potential step, full kinetic step in k-space, half potential step
      const half = () => { for (let i = 0; i < N; i++) { const ph = -Vx[i] * h / 2, c = Math.cos(ph), sn = Math.sin(ph), r = re[i], q = im[i]; re[i] = r * c - q * sn; im[i] = r * sn + q * c; } };
      half();
      const F = fft(re, im);
      for (let i = 0; i < N; i++) { const ph = -(ks[i] ** 2) / 2 * h, c = Math.cos(ph), sn = Math.sin(ph), r = F.re[i], q = F.im[i]; F.re[i] = r * c - q * sn; F.im[i] = r * sn + q * c; }
      const B = ifft(F.re, F.im); re = Array.from(B.re); im = Array.from(B.im);
      half(); t += h;
    }
    const { ctx, w, h: H } = fit(), X = x => (x + 80) / 160 * w;
    ctx.clearRect(0, 0, w, H);
    const P = xs.map((_, i) => re[i] ** 2 + im[i] ** 2), pm = 0.1;
    ctx.fillStyle = css('--c4'); ctx.globalAlpha = 0.35; ctx.fillRect(X(0), H * 0.1, Math.max(2, X(v.a) - X(0)), H * 0.8); ctx.globalAlpha = 1;
    ctx.strokeStyle = css('--qr'); ctx.lineWidth = 2; ctx.beginPath();
    xs.forEach((x, i) => { if (x < -80 || x > 80) return; const y = H * 0.9 - P[i] / pm * H * 0.75; ctx.lineTo(X(x), Math.max(4, y)); }); ctx.stroke();
    ctx.strokeStyle = css('--c2'); ctx.lineWidth = 1; ctx.globalAlpha = 0.6; ctx.beginPath();
    xs.forEach((x, i) => { if (x < -80 || x > 80) return; ctx.lineTo(X(x), H * 0.5 - re[i] / Math.sqrt(pm) * H * 0.3); }); ctx.stroke(); ctx.globalAlpha = 1;
    const Tp = xs.reduce((s, x, i) => s + (x > v.a ? P[i] : 0), 0) * dx, Rp = xs.reduce((s, x, i) => s + (x < 0 ? P[i] : 0), 0) * dx;
    ro.innerHTML = `<div class="grid g4"><div class="readout"><div class="rl">Transmitted</div><div class="rv">${(Tp * 100).toFixed(1)}<span class="u">%</span></div></div><div class="readout"><div class="rl">Reflected</div><div class="rv">${(Rp * 100).toFixed(1)}<span class="u">%</span></div></div><div class="readout"><div class="rl">E / V₀</div><div class="rv">${v.V0 ? (1 / v.V0).toFixed(2) : '∞'}</div></div><div class="readout"><div class="rl">t</div><div class="rv">${t.toFixed(1)}</div></div></div><p class="small muted">Time-dependent Schrödinger equation (ħ = m = 1) by split-step Fourier on 1024 points. Even with E &lt; V₀ part of the packet tunnels through. <a href="#/calc/tunnel">Barrier calculator →</a></p>`;
  });
}

// ── Hydrogen orbitals ──────────────────────────────────────────
function laguerre(k, a, x) { if (k === 0) return 1; let L0 = 1, L1 = 1 + a - x; for (let i = 1; i < k; i++) { const L2 = ((2 * i + 1 + a - x) * L1 - (i + a) * L0) / (i + 1); L0 = L1; L1 = L2; } return L1; }
function legendreP(l, m, x) { let pmm = 1; const s = Math.sqrt(Math.max(0, 1 - x * x)); for (let i = 1; i <= m; i++) pmm *= -(2 * i - 1) * s; if (l === m) return pmm; let p1 = x * (2 * m + 1) * pmm; if (l === m + 1) return p1; let p2 = 0; for (let ll = m + 2; ll <= l; ll++) { p2 = ((2 * ll - 1) * x * p1 - (ll + m - 1) * pmm) / (ll - m); pmm = p1; p1 = p2; } return p2; }
export function hydrogenPsi(n, l, m, x, y, z) {
  const r = Math.hypot(x, y, z), rho = 2 * r / n;
  const R = Math.pow(rho, l) * Math.exp(-rho / 2) * laguerre(n - l - 1, 2 * l + 1, rho);
  const ct = r ? z / r : 1, ph = Math.atan2(y, x), am = Math.abs(m);
  return R * legendreP(l, am, ct) * (m > 0 ? Math.cos(am * ph) : m < 0 ? Math.sin(am * ph) : 1);
}
export function orbitals(main) {
  const { cv, fit, ro } = shell(main, 'orbitals', `<div class="grid g3"><div class="field"><label>n</label><select class="plain" id="n">${[1, 2, 3, 4, 5].map(i => `<option${i === 3 ? ' selected' : ''}>${i}</option>`).join('')}</select></div><div class="field"><label>l</label><select class="plain" id="l"></select></div><div class="field"><label>m</label><select class="plain" id="m"></select></div></div><div class="field"><label>Slice plane</label><select class="plain" id="pl"><option value="xz">x–z (contains z-axis)</option><option value="xy">x–y</option></select></div><div class="chips"><label class="chip"><input type="checkbox" id="ph" checked> show phase (sign)</label></div>`, 0.75);
  const $ = s => main.querySelector(s);
  const syncL = () => { const n = +$('#n').value; $('#l').innerHTML = Array.from({ length: n }, (_, i) => `<option>${i}</option>`).join(''); $('#l').value = String(Math.min(n - 1, 2)); syncM(); };
  const syncM = () => { const l = +$('#l').value; $('#m').innerHTML = Array.from({ length: 2 * l + 1 }, (_, i) => `<option>${i - l}</option>`).join(''); $('#m').value = '0'; draw = true; };
  let draw = true;
  $('#n').onchange = syncL; $('#l').onchange = syncM; $('#m').onchange = () => { draw = true; }; $('#pl').onchange = () => { draw = true; }; $('#ph').onchange = () => { draw = true; };
  syncL();
  const NAMES = ['s', 'p', 'd', 'f', 'g'];
  return loop(() => {
    if (!draw) return; draw = false;
    const { ctx, w, h } = fit(), n = +$('#n').value, l = +$('#l').value, m = +$('#m').value, xy = $('#pl').value === 'xy', ext = 2.5 * n * n + 4;
    const img = ctx.createImageData(Math.round(w), Math.round(h)), vals = new Float32Array(img.width * img.height);
    let mx = 0;
    for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++) { const a = (i / img.width - 0.5) * 2 * ext * img.width / img.height, b = (0.5 - j / img.height) * 2 * ext; const p = xy ? hydrogenPsi(n, l, m, a, b, 0) : hydrogenPsi(n, l, m, a, 0, b); vals[j * img.width + i] = p; mx = Math.max(mx, p * p); }
    const phase = $('#ph').checked;
    for (let k = 0; k < vals.length; k++) { const d = Math.pow(vals[k] * vals[k] / mx, 0.5), pos = vals[k] >= 0; img.data[4 * k] = phase ? (pos ? 200 : 255) * d : 181 * d; img.data[4 * k + 1] = phase ? (pos ? 245 : 95) * d : 140 * d; img.data[4 * k + 2] = phase ? (pos ? 60 : 162) * d : 255 * d; img.data[4 * k + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = '#fff'; ctx.font = mono; ctx.fillText(`${n}${NAMES[l]}  (m = ${m})  ·  box ±${ext.toFixed(0)} a₀`, 10, 18);
    const E = -13.605693 / (n * n);
    ro.innerHTML = `<div class="grid g4"><div class="readout"><div class="rl">Energy</div><div class="rv">${E.toFixed(3)}<span class="u">eV</span></div></div><div class="readout"><div class="rl">Radial nodes</div><div class="rv">${n - l - 1}</div></div><div class="readout"><div class="rl">Angular nodes</div><div class="rv">${l}</div></div><div class="readout"><div class="rl">Degeneracy of n</div><div class="rv">${2 * n * n}</div></div></div><p class="small muted">Slice of |ψ<sub>nlm</sub>|² (real orbitals, brightness √-scaled) from the exact hydrogen solution: associated Laguerre radial functions × real spherical harmonics. Lime/magenta show the sign of ψ. <a href="#/calc/hydrogen">Hydrogen levels →</a></p>`;
  });
}

// ── Light clock ────────────────────────────────────────────────
export function lightclock(main) {
  const { cv, fit, ro } = shell(main, 'lightclock', `${slider('b', 'Train speed β = v/c', 0, 0.95, 0.01, 0.6)}<p class="small muted">Top: the clock's own rest frame. Bottom: the platform frame — the photon travels a longer diagonal at the same speed c, so each tick takes γ times longer.</p>`, 0.6);
  const v = bindSliders(main, ['b'], { b: x => x.toFixed(2) });
  let tau = 0, tLab = 0;
  return loop(dt => {
    const g = 1 / Math.sqrt(1 - v.b ** 2), tick = 1.2;
    tLab += dt; tau += dt / g;
    const { ctx, w, h } = fit(), H = h * 0.3;
    ctx.clearRect(0, 0, w, h);
    const clock = (x0, yTop, phase, trail) => {
      ctx.strokeStyle = css('--ink2'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - 25, yTop); ctx.lineTo(x0 + 25, yTop); ctx.moveTo(x0 - 25, yTop + H); ctx.lineTo(x0 + 25, yTop + H); ctx.stroke();
      const y = phase < 0.5 ? yTop + H - phase * 2 * H : yTop + (phase - 0.5) * 2 * H;
      ctx.fillStyle = css('--c4'); ctx.beginPath(); ctx.arc(x0, y, 6, 0, 7); ctx.fill();
      if (trail) { ctx.strokeStyle = css('--c4'); ctx.globalAlpha = 0.4; ctx.lineWidth = 1.5; ctx.beginPath(); trail.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke(); ctx.globalAlpha = 1; }
    };
    clock(w / 2, h * 0.06, (tau % tick) / tick);
    const speedPx = v.b * H * 2 / tick, xPlat = ((tLab * speedPx) % (w + 100)) - 50;
    const ph = ((tLab / g) % tick) / tick, trail = [];
    for (let k = 0; k <= 40; k++) { const pk = ph * k / 40, dtB = (ph - pk) * tick * g; trail.push([xPlat - dtB * speedPx, pk < 0.5 ? h * 0.58 + H - pk * 2 * H : h * 0.58 + (pk - 0.5) * 2 * H]); }
    clock(xPlat, h * 0.58, ph, trail);
    ctx.fillStyle = css('--ink3'); ctx.font = mono; ctx.fillText('rest frame of the clock', 10, 16); ctx.fillText('platform frame', 10, h * 0.55);
    ro.innerHTML = `<div class="grid g3"><div class="readout"><div class="rl">γ</div><div class="rv">${g.toFixed(4)}</div></div><div class="readout"><div class="rl">Ticks on moving clock</div><div class="rv">${Math.floor(tau / tick)}</div></div><div class="readout"><div class="rl">Ticks on platform clocks</div><div class="rv">${Math.floor(tLab / tick)}</div></div></div><p class="small muted">Δt = γΔτ. <a href="#/learn/time-dilation">Lesson →</a></p>`;
  });
}

// ── Gravitational waves (inspiral chirp) ───────────────────────
export function gwaves(main) {
  const { cv, fit, ro } = shell(main, 'gwaves', `${slider('m1', 'Mass 1 (M☉)', 1, 80, 1, 36)}${slider('m2', 'Mass 2 (M☉)', 1, 80, 1, 29)}${slider('f0', 'Start frequency (Hz)', 10, 60, 1, 30)}`, 0.55);
  const v = bindSliders(main, ['m1', 'm2', 'f0']);
  let t = 0;
  return loop(dt => {
    const Ms = 1.98847e30, G = 6.6743e-11, c = 299792458, M = (v.m1 + v.m2) * Ms, Mc = Math.pow(v.m1 * v.m2, 0.6) / Math.pow(v.m1 + v.m2, 0.2) * Ms, tM = G * Mc / c ** 3;
    const tau0 = 5 / 256 * Math.pow(tM, -5 / 3) * Math.pow(PI * v.f0, -8 / 3), fisco = c ** 3 / (Math.pow(6, 1.5) * PI * G * M);
    const f = tau => Math.pow(5 / 256 / tau, 3 / 8) * Math.pow(tM, -5 / 8) / PI;
    const tIsco = 5 / 256 * Math.pow(tM, -5 / 3) * Math.pow(PI * fisco, -8 / 3);
    t = (t + dt * 0.25) % (tau0 + 0.1);
    const { ctx, w, h } = fit();
    ctx.clearRect(0, 0, w, h);
    // waveform: phase Φ(τ) = −2(τ/5tM)^(5/8)
    const Phi = tau => -2 * Math.pow(tau / (5 * tM), 5 / 8);
    const T0 = tau0, X = tt => 20 + tt / (T0 + 0.05) * (w - 40), Y = y => h * 0.72 - y * h * 0.22;
    ctx.strokeStyle = css('--qr'); ctx.lineWidth = 1.3; ctx.beginPath();
    let amp0 = Math.pow(PI * v.f0, 2 / 3);
    for (let i = 0; i <= 3000; i++) { const tt = T0 * i / 3000, tau = Math.max(T0 - tt, tIsco), a = Math.pow(PI * f(tau), 2 / 3) / amp0 * 0.35, y = tt <= T0 - tIsco ? a * Math.cos(Phi(tau)) : Math.pow(PI * fisco, 2 / 3) / amp0 * 0.35 * Math.exp(-(tt - (T0 - tIsco)) * fisco * 3) * Math.cos(Phi(tIsco) + 2 * PI * 1.2 * fisco * (tt - (T0 - tIsco))); i ? ctx.lineTo(X(tt), Y(Math.min(1, y))) : ctx.moveTo(X(tt), Y(y)); }
    ctx.stroke();
    ctx.strokeStyle = css('--c4'); ctx.beginPath(); ctx.moveTo(X(t), h * 0.45); ctx.lineTo(X(t), h * 0.98); ctx.stroke();
    // binary
    const tau = Math.max(T0 - t, tIsco), orbPhase = Phi(tau) / 2, sep = Math.min(1, Math.pow(f(tau) / v.f0, -2 / 3)) * h * 0.16 + 6, cx = w / 2, cy = h * 0.2;
    const r1 = sep * v.m2 / (v.m1 + v.m2), r2 = sep * v.m1 / (v.m1 + v.m2);
    ctx.fillStyle = css('--ink'); ctx.beginPath(); ctx.arc(cx + r1 * Math.cos(orbPhase), cy + r1 * Math.sin(orbPhase) * 0.5, 4 + v.m1 / 12, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(cx - r2 * Math.cos(orbPhase), cy - r2 * Math.sin(orbPhase) * 0.5, 4 + v.m2 / 12, 0, 7); ctx.fill();
    ctx.fillStyle = css('--ink3'); ctx.font = mono; ctx.fillText('strain h(t) (normalised)', 20, h * 0.47);
    ro.innerHTML = `<div class="grid g4"><div class="readout"><div class="rl">Chirp mass</div><div class="rv">${(Mc / Ms).toFixed(1)}<span class="u">M☉</span></div></div><div class="readout"><div class="rl">GW frequency now</div><div class="rv">${f(tau).toFixed(0)}<span class="u">Hz</span></div></div><div class="readout"><div class="rl">f at ISCO</div><div class="rv">${fisco.toFixed(0)}<span class="u">Hz</span></div></div><div class="readout"><div class="rl">Time from ${v.f0} Hz to merger</div><div class="rv">${tau0.toFixed(3)}<span class="u">s</span></div></div></div><p class="small muted">Leading-order (Newtonian quadrupole) inspiral: f ∝ τ^(−3/8), h ∝ f^(2/3); merger/ringdown drawn schematically. Defaults ≈ GW150914. <a href="#/calc/chirp">Chirp-mass calculator →</a></p>`;
  });
}

// ── Expanding universe ─────────────────────────────────────────
export function universe(main) {
  const { cv, fit, ro } = shell(main, 'universe', `${slider('t', 'Cosmic time (Gyr)', 0.5, 30, 0.1, 13.8)}${slider('Om', 'Ω_m', 0.05, 1, 0.005, 0.315)}${slider('H0', 'H₀ (km/s/Mpc)', 50, 80, 0.5, 67.4)}<p class="small muted">Galaxies sit at fixed comoving positions; the grid stretches with the scale factor a(t). Every observer sees Hubble's law v = H d.</p>`, 0.55);
  const v = bindSliders(main, ['t', 'Om', 'H0']);
  const gal = Array.from({ length: 70 }, (_, i) => [Math.sin(i * 12.9898) * 43758.5453 % 1, Math.sin(i * 78.233) * 12543.123 % 1].map(x => Math.abs(x) * 2 - 1));
  return loop(() => {
    const H0 = v.H0 * 1e3 / 3.0857e22, OL = 1 - v.Om, Gyr = 3.15576e16;
    const a = tt => Math.pow(v.Om / OL, 1 / 3) * Math.pow(Math.sinh(1.5 * Math.sqrt(OL) * H0 * tt * Gyr), 2 / 3);
    const t0 = 2 / (3 * H0 * Math.sqrt(OL)) * Math.asinh(Math.sqrt(OL / v.Om)) / Gyr, at = a(v.t) / a(t0), Ht = H0 * Math.sqrt(v.Om / at ** 3 + OL);
    const { ctx, w, h } = fit(), gw = w * 0.55, cx = gw / 2, cy = h / 2, sc = Math.min(gw, h) * 0.32 * at;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = css('--line'); ctx.lineWidth = 1;
    for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(cx + k * sc / 2, cy - 4 * sc / 2); ctx.lineTo(cx + k * sc / 2, cy + 4 * sc / 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - 4 * sc / 2, cy + k * sc / 2); ctx.lineTo(cx + 4 * sc / 2, cy + k * sc / 2); ctx.stroke(); }
    gal.forEach(([x, y], i) => { ctx.fillStyle = i === 0 ? css('--acc') : css('--qr'); ctx.beginPath(); ctx.arc(cx + x * sc, cy + y * sc, i === 0 ? 5 : 3, 0, 7); ctx.fill(); });
    const px = gw + 30, pw = w - px - 20, T = x => px + x / 30 * pw, Yv = y => h - 40 - y / 3 * (h - 80);
    ctx.strokeStyle = css('--line2'); ctx.strokeRect(px, 40, pw, h - 80);
    ctx.strokeStyle = css('--c2'); ctx.lineWidth = 2; ctx.beginPath(); for (let i = 1; i <= 200; i++) { const tt = 30 * i / 200, y = a(tt) / a(t0); i > 1 ? ctx.lineTo(T(tt), Yv(Math.min(3, y))) : ctx.moveTo(T(tt), Yv(y)); } ctx.stroke();
    ctx.fillStyle = css('--acc'); ctx.beginPath(); ctx.arc(T(v.t), Yv(Math.min(3, at)), 5, 0, 7); ctx.fill();
    ctx.fillStyle = css('--ink3'); ctx.font = mono; ctx.fillText('a(t) / a(today)', px + 4, 32); ctx.fillText('t (Gyr) →', px + pw - 70, h - 24);
    ro.innerHTML = `<div class="grid g4"><div class="readout"><div class="rl">Scale factor a/a₀</div><div class="rv">${at.toFixed(3)}</div></div><div class="readout"><div class="rl">Redshift of light emitted now, seen today</div><div class="rv">${at < 1 ? (1 / at - 1).toFixed(2) : '—'}</div></div><div class="readout"><div class="rl">H(t)</div><div class="rv">${(Ht * 3.0857e22 / 1e3).toFixed(1)}<span class="u">km/s/Mpc</span></div></div><div class="readout"><div class="rl">Age today (model)</div><div class="rv">${t0.toFixed(2)}<span class="u">Gyr</span></div></div></div><p class="small muted">Flat ΛCDM: a(t) ∝ sinh^(2/3)(3/2 √Ω_Λ H₀t). The curve bends upward after ~7 Gyr as dark energy takes over. <a href="#/calc/cosmology">Cosmology calculator →</a></p>`;
  });
}
