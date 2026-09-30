import { esc, fmt } from '../core/format.js';
import { crumbs, pageHead, linkTile, SIMS } from './common.js';
import { hermite } from '../calcs/quantum.js';
import * as S2 from './sims2.js';
import { SIMS3 } from './sims3.js';

export function index(main) {
  main.innerHTML = `${crumbs([['Tools', '#/tools'], ['Simulations']])}${pageHead('06 / TLS / SIM', 'Simulations', 'Drag things around instead of typing numbers. Every simulation integrates the real equations (RK4 where it matters) and shows the numbers behind the picture.')}
    <h4 class="mb">Physics</h4><div class="grid auto mb">${Object.entries(SIMS).filter(([, s]) => s.sec === 'physics').map(([id, s]) => linkTile(`#/sims/${id}`, 'Simulation', s.title, s.d, 'Run →')).join('')}</div>
    <h4 class="mb mt2" style="color:var(--qr)">Quantum &amp; Relativity</h4><div class="grid auto">${Object.entries(SIMS).filter(([, s]) => s.sec === 'quantum').map(([id, s]) => linkTile(`#/sims/${id}`, 'Simulation · Q&R', s.title, s.d, 'Run →', 'qr')).join('')}</div>`;
}

export const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888';

export function setupCanvas(cv, aspect = 0.5) {
  const fit = () => {
    const w = cv.clientWidth, h = Math.round(w * aspect), dpr = window.devicePixelRatio || 1;
    cv.style.height = h + 'px'; cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  };
  return fit;
}

export function slider(id, label, min, max, step, val, unit = '') {
  return `<div class="field"><label for="${id}"><span>${label}</span><span class="mono" id="${id}-v">${val}${unit}</span></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
}
export function bindSliders(root, ids, fmtr = {}) {
  const vals = {};
  ids.forEach(id => {
    const el = root.querySelector('#' + id), out = root.querySelector(`#${id}-v`);
    const upd = () => { vals[id] = Number(el.value); if (out) out.textContent = fmtr[id] ? fmtr[id](vals[id]) : el.value; };
    el.addEventListener('input', upd); upd();
  });
  return vals;
}

export function shell(main, id, controls, aspect = 0.5, extra = '') {
  const s = SIMS[id];
  main.innerHTML = `${crumbs([['Simulations', '#/sims'], [s.title]])}${pageHead(s.sec === 'quantum' ? 'SIM / Q&R' : 'SIM / PHY', s.title, esc(s.d), s.sec === 'quantum')}
    <div class="calc"><div class="panel tick">${controls}</div><div><canvas class="sim" id="cv"></canvas><div id="ro" class="mt"></div>${extra}</div></div>`;
  const cv = main.querySelector('#cv');
  return { cv, fit: setupCanvas(cv, aspect), ro: main.querySelector('#ro') };
}

export function loop(fn) {
  let raf, last = performance.now(), alive = true;
  const step = t => { if (!alive) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; fn(dt, t / 1000); raf = requestAnimationFrame(step); };
  raf = requestAnimationFrame(step);
  return () => { alive = false; cancelAnimationFrame(raf); };
}

export function page(main, [id]) {
  const f = { projectile, pendulum, 'double-slit': doubleSlit, wavefunction, minkowski, 'bh-orbit': bhOrbit, ...S2, ...SIMS3 }[id];
  if (!f) { main.innerHTML = 'Unknown simulation'; return; }
  return f(main);
}

// ── Projectile ──────────────────────────────────────────────────
function projectile(main) {
  const { cv, fit, ro } = shell(main, 'projectile', `${slider('v0', 'Launch speed', 1, 60, 0.5, 25, ' m/s')}${slider('th', 'Angle', 1, 89, 1, 45, '°')}${slider('h0', 'Launch height', 0, 30, 0.5, 0, ' m')}${slider('k', 'Drag parameter k = ρC_dA/2m', 0, 0.05, 0.001, 0.01, ' 1/m')}
    <div class="field"><label>Gravity</label><select class="plain" id="g"><option value="9.80665">Earth 9.81</option><option value="1.62">Moon 1.62</option><option value="3.71">Mars 3.71</option><option value="24.79">Jupiter 24.79</option></select></div>
    <button class="btn" id="go">Launch ▶</button><p class="small muted mt">Tip: drag on the canvas from the launch point to aim.</p>`);
  const v = bindSliders(main, ['v0', 'th', 'h0', 'k']);
  const traj = drag => {
    const g = +main.querySelector('#g').value, th = v.th * Math.PI / 180;
    const x = 0, y = v.h0, vx = v.v0 * Math.cos(th), vy = v.v0 * Math.sin(th);
    let t = 0;
    const pts = [[x, y, t]], dt = 0.002, k = drag ? v.k : 0;
    // State derivative for (x, y, vx, vy) with quadratic drag.
    const f = ([, , u, w]) => { const sp = Math.hypot(u, w); return [u, w, -k * sp * u, -g - k * sp * w]; };
    let S = [x, y, vx, vy];
    while (S[1] >= 0 && t < 60) {
      const k1 = f(S), k2 = f(S.map((q, i) => q + dt / 2 * k1[i])), k3 = f(S.map((q, i) => q + dt / 2 * k2[i])), k4 = f(S.map((q, i) => q + dt * k3[i]));
      S = S.map((q, i) => q + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
      t += dt;
      pts.push([S[0], Math.max(S[1], 0), t]);
    }
    return pts;
  };
  let anim = 0, ideal = traj(false), real = traj(true);
  const recompute = () => { ideal = traj(false); real = traj(true); anim = 0; };
  main.querySelectorAll('input,select').forEach(e => e.addEventListener('input', recompute));
  main.querySelector('#g').onchange = recompute;
  main.querySelector('#go').onclick = () => { anim = 0.0001; };
  let view = null;
  cv.addEventListener('pointerdown', ev => { cv.setPointerCapture(ev.pointerId); aim(ev); cv.onpointermove = aim; });
  cv.addEventListener('pointerup', () => { cv.onpointermove = null; anim = 0.0001; });
  function aim(ev) {
    if (!view) return;
    const r = cv.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
    const [ox, oy] = [view.X(0), view.Y(v.h0)], dx = px - ox, dy = oy - py;
    const th = Math.max(1, Math.min(89, Math.atan2(dy, dx) * 180 / Math.PI)), sp = Math.max(1, Math.min(60, Math.hypot(dx, dy) / 4));
    main.querySelector('#th').value = th.toFixed(0); main.querySelector('#v0').value = sp.toFixed(1);
    main.querySelectorAll('#th,#v0').forEach(e => e.dispatchEvent(new Event('input')));
  }
  return loop(dt => {
    const { ctx, w, h } = fit();
    const xmax = Math.max(...ideal.map(p => p[0]), 10) * 1.08, ymax = Math.max(...ideal.map(p => p[1]), 5) * 1.15;
    const s = Math.min((w - 60) / xmax, (h - 50) / ymax);
    view = { X: x => 40 + x * s, Y: y => h - 30 - y * s };
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = css('--line'); ctx.lineWidth = 1;
    for (let gx = 0; gx <= xmax; gx += Math.pow(10, Math.floor(Math.log10(xmax)))) { ctx.beginPath(); ctx.moveTo(view.X(gx), view.Y(0)); ctx.lineTo(view.X(gx), 10); ctx.stroke(); ctx.fillStyle = css('--ink3'); ctx.font = '11px JetBrains Mono, monospace'; ctx.fillText(`${gx.toFixed(0)} m`, view.X(gx) + 2, h - 14); }
    ctx.strokeStyle = css('--ink2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, view.Y(0)); ctx.lineTo(w, view.Y(0)); ctx.stroke();
    const path = (pts, col, dash) => { ctx.strokeStyle = col; ctx.setLineDash(dash); ctx.lineWidth = 2; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(view.X(p[0]), view.Y(p[1])) : ctx.moveTo(view.X(p[0]), view.Y(p[1]))); ctx.stroke(); ctx.setLineDash([]); };
    path(ideal, css('--ink3'), [6, 5]);
    if (v.k > 0) path(real, css('--acc'), []);
    const th = v.th * Math.PI / 180;
    ctx.strokeStyle = css('--c4'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(view.X(0), view.Y(v.h0)); ctx.lineTo(view.X(0) + Math.cos(th) * v.v0 * 3, view.Y(v.h0) - Math.sin(th) * v.v0 * 3); ctx.stroke();
    if (anim > 0) {
      const src = v.k > 0 ? real : ideal, T = src[src.length - 1][2];
      anim += dt;
      const p = src.find(q => q[2] >= anim) || src[src.length - 1];
      ctx.fillStyle = css('--acc'); ctx.beginPath(); ctx.arc(view.X(p[0]), view.Y(p[1]), 7, 0, 7); ctx.fill();
      if (anim > T + 0.8) anim = 0;
    }
    const last = a => a[a.length - 1];
    ro.innerHTML = `<div class="grid g3"><div class="readout"><div class="rl">Range (no drag)</div><div class="rv">${fmt(last(ideal)[0], 4)}<span class="u">m</span></div></div><div class="readout"><div class="rl">Range (with drag)</div><div class="rv" style="color:var(--acc)">${fmt(last(real)[0], 4)}<span class="u">m</span></div></div><div class="readout"><div class="rl">Flight time (drag)</div><div class="rv">${fmt(last(real)[2], 3)}<span class="u">s</span></div></div></div><div class="legend"><span><i style="background:var(--ink3)"></i>ideal (no drag)</span><span><i style="background:var(--acc)"></i>quadratic drag, RK4</span></div>`;
  });
}

// ── Pendulum ────────────────────────────────────────────────────
function pendulum(main) {
  const { cv, fit, ro } = shell(main, 'pendulum', `${slider('L', 'Length', 0.2, 5, 0.1, 1, ' m')}${slider('th0', 'Release angle', 1, 179, 1, 120, '°')}${slider('b', 'Damping (1/s)', 0, 1, 0.01, 0.05)}<button class="btn" id="rs">Release ▶</button><p class="small muted mt">Ghost pendulum: small-angle SHM with the same initial angle. Compare how far they drift apart at large amplitude.</p>`, 0.55);
  const v = bindSliders(main, ['L', 'th0', 'b']);
  const g = 9.80665;
  let s = null;
  const reset = () => { s = { th: v.th0 * Math.PI / 180, w: 0, t: 0, trace: [] }; };
  reset();
  main.querySelector('#rs').onclick = reset;
  main.querySelectorAll('input').forEach(e => e.addEventListener('change', reset));
  const f = (th, w) => [w, -g / v.L * Math.sin(th) - v.b * w];
  return loop(dt => {
    const n = 8, h = dt / n;
    for (let i = 0; i < n; i++) {
      const [k1a, k1b] = f(s.th, s.w), [k2a, k2b] = f(s.th + h / 2 * k1a, s.w + h / 2 * k1b), [k3a, k3b] = f(s.th + h / 2 * k2a, s.w + h / 2 * k2b), [k4a, k4b] = f(s.th + h * k3a, s.w + h * k3b);
      s.th += h / 6 * (k1a + 2 * k2a + 2 * k3a + k4a); s.w += h / 6 * (k1b + 2 * k2b + 2 * k3b + k4b); s.t += h;
    }
    s.trace.push([s.th, s.w]); if (s.trace.length > 1500) s.trace.shift();
    const { ctx, w, h: H } = fit();
    ctx.clearRect(0, 0, w, H);
    const cx = w * 0.3, cy = H * 0.12, R = Math.min(w * 0.26, H * 0.75);
    const w0 = Math.sqrt(g / v.L), th0 = v.th0 * Math.PI / 180, zeta = v.b / (2 * w0);
    const thSmall = th0 * Math.exp(-v.b / 2 * s.t) * Math.cos(w0 * Math.sqrt(Math.max(0, 1 - zeta * zeta)) * s.t);
    const bob = (th, col, r, alpha) => { ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); const x = cx + R * Math.sin(th), y = cy + R * Math.cos(th); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; };
    ctx.fillStyle = css('--ink2'); ctx.fillRect(cx - 30, cy - 4, 60, 4);
    bob(thSmall, css('--ink3'), 10, 0.45);
    bob(s.th, css('--acc'), 13, 1);
    // phase portrait
    const px = w * 0.62, pw = w * 0.34, py = H * 0.1, ph = H * 0.8;
    ctx.strokeStyle = css('--line2'); ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = css('--ink3'); ctx.font = '11px JetBrains Mono, monospace'; ctx.fillText('phase portrait θ–ω', px + 6, py + 14);
    const wm = Math.sqrt(2 * g / v.L * (1 - Math.cos(th0))) * 1.1 || 1;
    ctx.strokeStyle = css('--c2'); ctx.lineWidth = 1.5; ctx.beginPath();
    s.trace.forEach(([a, b], i) => { const X = px + pw / 2 + a / Math.PI * pw / 2, Y = py + ph / 2 - b / wm * ph / 2; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.stroke();
    let A = 1, B = Math.cos(th0 / 2); for (let i = 0; i < 25; i++) { const a2 = (A + B) / 2; B = Math.sqrt(A * B); A = a2; }
    const T0 = 2 * Math.PI / w0, T = T0 / A;
    ro.innerHTML = `<div class="grid g3"><div class="readout"><div class="rl">θ now</div><div class="rv">${(s.th * 180 / Math.PI).toFixed(1)}<span class="u">°</span></div></div><div class="readout"><div class="rl">Small-angle period</div><div class="rv">${T0.toFixed(4)}<span class="u">s</span></div></div><div class="readout"><div class="rl">Exact period (undamped)</div><div class="rv" style="color:var(--acc)">${T.toFixed(4)}<span class="u">s</span></div></div></div><p class="small muted">θ̈ = −(g/L) sin θ − bθ̇ integrated with RK4. <a href="#/calc/pendulum">Pendulum calculator →</a></p>`;
  });
}

// ── Double slit ─────────────────────────────────────────────────
function wlRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
  const f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (750 - nm) / 50 : 1;
  return [r * f * 255, g * f * 255, b * f * 255].map(Math.round);
}
function doubleSlit(main) {
  const { cv, fit, ro } = shell(main, 'double-slit', `${slider('lam', 'Wavelength', 380, 750, 1, 532, ' nm')}${slider('d', 'Slit separation d', 0.05, 1, 0.01, 0.25, ' mm')}${slider('a', 'Slit width a', 0.01, 0.2, 0.005, 0.05, ' mm')}${slider('L', 'Screen distance L', 0.5, 5, 0.1, 2, ' m')}
    <div class="chips"><label class="chip"><input type="checkbox" id="ph"> photon-by-photon</label><button class="chip" id="clr">clear</button></div><p class="small muted mt">In photon mode, single detections land at random — the interference pattern appears only statistically.</p>`, 0.55);
  const v = bindSliders(main, ['lam', 'd', 'a', 'L']);
  let hits = [];
  main.querySelector('#clr').onclick = () => { hits = []; };
  main.querySelectorAll('input[type=range]').forEach(e => e.addEventListener('input', () => { hits = []; }));
  const I = y => { const lam = v.lam * 1e-9, d = v.d * 1e-3, a = v.a * 1e-3, L = v.L; const be = Math.PI * a * y / (lam * L), al = Math.PI * d * y / (lam * L); const s = be === 0 ? 1 : Math.sin(be) / be; return Math.cos(al) ** 2 * s * s; };
  return loop(() => {
    const { ctx, w, h } = fit();
    ctx.clearRect(0, 0, w, h);
    const ymax = 3 * v.lam * 1e-9 * v.L / (v.a * 1e-3); // show up to 3rd diffraction minimum
    const [r, g, b] = wlRGB(v.lam), bandH = h * 0.4;
    const photon = main.querySelector('#ph').checked;
    if (!photon) {
      for (let px = 0; px < w; px++) { const y = (px / w - 0.5) * 2 * ymax, k = I(y); ctx.fillStyle = `rgb(${r * k},${g * k},${b * k})`; ctx.fillRect(px, 10, 1, bandH); }
    } else {
      for (let n = 0; n < 40; n++) { let y, tries = 0; do { y = (Math.random() - 0.5) * 2 * ymax; tries++; } while (Math.random() > I(y) && tries < 200); hits.push([y, Math.random()]); }
      if (hits.length > 60000) hits.splice(0, 40);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 10, w, bandH);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      hits.forEach(([y, q]) => ctx.fillRect((y / ymax / 2 + 0.5) * w, 10 + q * bandH, 1.3, 1.3));
    }
    ctx.strokeStyle = css('--acc'); ctx.lineWidth = 2; ctx.beginPath();
    for (let px = 0; px < w; px++) { const y = (px / w - 0.5) * 2 * ymax, k = I(y); const Y = h - 20 - k * (h - bandH - 50); px ? ctx.lineTo(px, Y) : ctx.moveTo(px, Y); }
    ctx.stroke();
    ctx.fillStyle = css('--ink3'); ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(`±${(ymax * 1e3).toFixed(1)} mm on screen`, 8, h - 6);
    if (photon) ctx.fillText(`${hits.length} photons`, w - 110, h - 6);
    const wf = v.lam * 1e-9 * v.L / (v.d * 1e-3);
    ro.innerHTML = `<div class="grid g3"><div class="readout"><div class="rl">Fringe spacing λL/d</div><div class="rv">${(wf * 1e3).toFixed(3)}<span class="u">mm</span></div></div><div class="readout"><div class="rl">Envelope half-width λL/a</div><div class="rv">${(v.lam * 1e-9 * v.L / (v.a * 1e-3) * 1e3).toFixed(2)}<span class="u">mm</span></div></div><div class="readout"><div class="rl">Fringes in central max</div><div class="rv">${Math.floor(2 * v.d / v.a) - 1}</div></div></div><p class="small muted">I(y) = cos²(πdy/λL) · sinc²(πay/λL) (Fraunhofer). <a href="#/calc/double-slit">Calculator →</a></p>`;
  });
}

// ── Wavefunction ────────────────────────────────────────────────
function wavefunction(main) {
  const { cv, fit, ro } = shell(main, 'wavefunction', `<div class="field"><label>System</label><select class="plain" id="sys"><option value="box">Infinite square well</option><option value="qho">Harmonic oscillator</option></select></div>
    <div class="field"><label>States in superposition (equal weights)</label><div class="chips" id="st"></div></div>${slider('sp', 'Time speed', 0, 3, 0.05, 1)}
    <div class="chips"><label class="chip"><input type="checkbox" id="re" checked> Re ψ</label><label class="chip"><input type="checkbox" id="im"> Im ψ</label><label class="chip"><input type="checkbox" id="pd" checked> |ψ|²</label></div>
    <p class="small muted mt">Single eigenstates are stationary: |ψ|² does not move. Superpositions slosh — ⟨x⟩ oscillates at the Bohr frequency (E₂ − E₁)/ħ.</p>`, 0.55);
  const v = bindSliders(main, ['sp']);
  let sel = new Set([1, 2]), t = 0;
  const drawChips = () => {
    const sys = main.querySelector('#sys').value, ns = sys === 'box' ? [1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5];
    sel = new Set([...sel].filter(n => ns.includes(n))); if (!sel.size) sel.add(ns[0]);
    main.querySelector('#st').innerHTML = ns.map(n => `<button class="chip${sel.has(n) ? ' on' : ''}" data-n="${n}">n=${n}</button>`).join('');
    main.querySelectorAll('#st .chip').forEach(b => b.onclick = () => { const n = +b.dataset.n; sel.has(n) && sel.size > 1 ? sel.delete(n) : sel.add(n); t = 0; drawChips(); });
  };
  main.querySelector('#sys').onchange = () => { sel = main.querySelector('#sys').value === 'box' ? new Set([1, 2]) : new Set([0, 1]); t = 0; drawChips(); };
  drawChips();
  const fact = n => (n <= 1 ? 1 : n * fact(n - 1));
  return loop(dt => {
    t += dt * v.sp;
    const sys = main.querySelector('#sys').value, ns = [...sel], c = 1 / Math.sqrt(ns.length);
    const { ctx, w, h } = fit();
    ctx.clearRect(0, 0, w, h);
    const N = 400, xs = [], re = [], im = [], pd = [];
    const x0 = sys === 'box' ? 0 : -5, x1 = sys === 'box' ? 1 : 5;
    let mean = 0, norm = 0;
    for (let i = 0; i <= N; i++) {
      const x = x0 + (x1 - x0) * i / N; let R = 0, M = 0;
      ns.forEach(n => {
        const E = sys === 'box' ? n * n : n + 0.5, om = sys === 'box' ? E * 2 : E * 2;
        const psi = sys === 'box' ? Math.SQRT2 * Math.sin(n * Math.PI * x) : Math.pow(Math.PI, -0.25) / Math.sqrt(Math.pow(2, n) * fact(n)) * hermite(n, x) * Math.exp(-x * x / 2);
        R += c * psi * Math.cos(om * t); M -= c * psi * Math.sin(om * t);
      });
      xs.push(x); re.push(R); im.push(M); pd.push(R * R + M * M); mean += x * (R * R + M * M); norm += R * R + M * M;
    }
    mean /= norm;
    const ymax = Math.max(...pd, ...re.map(Math.abs)) * 1.1;
    const X = x => 30 + (x - x0) / (x1 - x0) * (w - 60), Y = y => h / 2 - y / ymax * (h / 2 - 20);
    ctx.strokeStyle = css('--line2'); ctx.beginPath(); ctx.moveTo(30, h / 2); ctx.lineTo(w - 30, h / 2); ctx.stroke();
    if (sys === 'qho') { ctx.strokeStyle = css('--line2'); ctx.setLineDash([4, 4]); ctx.beginPath(); xs.forEach((x, i) => { const yy = Y(x * x / 25 * ymax); i ? ctx.lineTo(X(x), yy) : ctx.moveTo(X(x), yy); }); ctx.stroke(); ctx.setLineDash([]); }
    else { ctx.fillStyle = css('--line2'); ctx.fillRect(22, 10, 8, h - 20); ctx.fillRect(w - 30, 10, 8, h - 20); }
    const line = (arr, col, fill) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); arr.forEach((y, i) => i ? ctx.lineTo(X(xs[i]), Y(y)) : ctx.moveTo(X(xs[i]), Y(y))); ctx.stroke(); if (fill) { ctx.lineTo(X(x1), Y(0)); ctx.lineTo(X(x0), Y(0)); ctx.globalAlpha = 0.15; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1; } };
    if (main.querySelector('#pd').checked) line(pd, css('--acc'), true);
    if (main.querySelector('#re').checked) line(re, css('--c2'));
    if (main.querySelector('#im').checked) line(im, css('--c3'));
    ctx.strokeStyle = css('--c4'); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(mean), 10); ctx.lineTo(X(mean), h - 10); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = css('--c4'); ctx.font = '11px JetBrains Mono, monospace'; ctx.fillText('⟨x⟩', X(mean) + 4, 20);
    ro.innerHTML = `<div class="legend"><span><i style="background:var(--acc)"></i>|ψ|²</span><span><i style="background:var(--c2)"></i>Re ψ</span><span><i style="background:var(--c3)"></i>Im ψ</span><span><i style="background:var(--c4)"></i>⟨x⟩ = ${mean.toFixed(3)}</span></div><p class="small muted">Dimensionless units (ħ = m = L = 1 for the box; ħ = m = ω = 1 for the oscillator). Energies: box Eₙ ∝ n², oscillator Eₙ = (n + ½)ħω. <a href="#/calc/box">Particle-in-a-box calculator →</a></p>`;
  });
}

// ── Minkowski diagram ───────────────────────────────────────────
function minkowski(main) {
  const { cv, fit, ro } = shell(main, 'minkowski', `${slider('b', 'Boost β = v/c of frame S′', -0.95, 0.95, 0.01, 0.5)}<div class="chips"><label class="chip"><input type="checkbox" id="gr" checked> S′ simultaneity lines</label><label class="chip"><input type="checkbox" id="hy" checked> invariant hyperbolae</label></div>
    <p class="small muted mt">Drag events A, B and C. Units: c = 1 (ct and x in the same units). Lines of constant t′ tilt — events simultaneous in S are not simultaneous in S′.</p>`, 0.75);
  const v = bindSliders(main, ['b'], { b: x => x.toFixed(2) });
  const ev = [{ n: 'A', t: 0, x: 0 }, { n: 'B', t: 2, x: 1 }, { n: 'C', t: 1, x: 2.5 }];
  let view = null, drag = -1;
  cv.addEventListener('pointerdown', e => { if (!view) return; const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; drag = ev.findIndex(q => Math.hypot(view.X(q.x) - px, view.Y(q.t) - py) < 16); if (drag >= 0) cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (drag < 0) return; const r = cv.getBoundingClientRect(); ev[drag].x = Math.round(view.ix(e.clientX - r.left) * 10) / 10; ev[drag].t = Math.round(view.it(e.clientY - r.top) * 10) / 10; });
  cv.addEventListener('pointerup', () => { drag = -1; });
  return loop(() => {
    const { ctx, w, h } = fit();
    const S = Math.min(w, h) / 9, cx = w / 2, cy = h * 0.62;
    view = { X: x => cx + x * S, Y: t => cy - t * S, ix: px => (px - cx) / S, it: py => (cy - py) / S };
    const b = v.b, g = 1 / Math.sqrt(1 - b * b);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1; ctx.strokeStyle = css('--line');
    for (let k = -8; k <= 8; k++) { ctx.beginPath(); ctx.moveTo(view.X(k), 0); ctx.lineTo(view.X(k), h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, view.Y(k)); ctx.lineTo(w, view.Y(k)); ctx.stroke(); }
    const seg = (x1, t1, x2, t2, col, wd = 1.5, dash = []) => { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(view.X(x1), view.Y(t1)); ctx.lineTo(view.X(x2), view.Y(t2)); ctx.stroke(); ctx.setLineDash([]); };
    // light cone
    seg(-10, -10, 10, 10, css('--c4'), 1.5, [6, 4]); seg(10, -10, -10, 10, css('--c4'), 1.5, [6, 4]);
    // S axes
    seg(-10, 0, 10, 0, css('--ink2'), 2); seg(0, -10, 0, 10, css('--ink2'), 2);
    // S' axes: ct' axis: x = β ct ; x' axis: ct = β x
    const qc = css('--qr');
    seg(-10 * b, -10, 10 * b, 10, qc, 2.5); seg(-10, -10 * b, 10, 10 * b, qc, 2.5);
    // Lines of constant t′ = k satisfy ct = βx + k/γ.
    if (main.querySelector('#gr').checked) for (let k = -6; k <= 6; k++) { if (k) seg(-10, -10 * b + k / g, 10, 10 * b + k / g, qc, 0.6, [2, 4]); }
    if (main.querySelector('#hy').checked) [1, 2, 3].forEach(s => { ctx.strokeStyle = css('--c2'); ctx.lineWidth = 1; ctx.globalAlpha = 0.6; ctx.beginPath(); for (let u = -2.5; u <= 2.5; u += 0.05) { const x = s * Math.sinh(u), t = s * Math.cosh(u); u === -2.5 ? ctx.moveTo(view.X(x), view.Y(t)) : ctx.lineTo(view.X(x), view.Y(t)); } ctx.stroke(); ctx.globalAlpha = 1; });
    ctx.font = '12px JetBrains Mono, monospace'; ctx.fillStyle = css('--ink2'); ctx.fillText('ct', view.X(0) + 6, 16); ctx.fillText('x', w - 16, view.Y(0) - 6);
    ctx.fillStyle = qc; ctx.fillText("ct′", view.X(4 * b) + 6, view.Y(4)); ctx.fillText("x′", view.X(4), view.Y(4 * b) - 6);
    // tick marks on ct' axis at t' = 1,2,3 (calibrated by hyperbolae)
    for (let k = 1; k <= 3; k++) { const t = g * k, x = g * b * k; ctx.fillStyle = qc; ctx.beginPath(); ctx.arc(view.X(x), view.Y(t), 3, 0, 7); ctx.fill(); }
    const tr = e => ({ t: g * (e.t - b * e.x), x: g * (e.x - b * e.t) });
    ev.forEach((e, i) => { ctx.fillStyle = [css('--acc'), css('--c3'), css('--good')][i]; ctx.beginPath(); ctx.arc(view.X(e.x), view.Y(e.t), 7, 0, 7); ctx.fill(); ctx.fillStyle = css('--ink'); ctx.fillText(e.n, view.X(e.x) + 9, view.Y(e.t) - 8); });
    const pair = (a, c) => { const dt = c.t - a.t, dx = c.x - a.x, s2 = dt * dt - dx * dx, p = tr(c), q = tr(a); return `<tr><td>${a.n}→${c.n}</td><td class="num">${s2.toFixed(3)}</td><td>${Math.abs(s2) < 1e-9 ? 'lightlike' : s2 > 0 ? 'timelike' : 'spacelike'}</td><td class="num">${dt.toFixed(2)}</td><td class="num">${(p.t - q.t).toFixed(2)}</td><td>${Math.sign(dt) !== Math.sign(p.t - q.t) && s2 < 0 ? '<b style="color:var(--c3)">order reversed</b>' : ''}</td></tr>`; };
    ro.innerHTML = `<div class="grid g2"><div><table class="tbl"><thead><tr><th>Event</th><th class="num">(ct, x) in S</th><th class="num">(ct′, x′) in S′</th></tr></thead><tbody>${ev.map(e => { const p = tr(e); return `<tr><td>${e.n}</td><td class="num">(${e.t.toFixed(2)}, ${e.x.toFixed(2)})</td><td class="num">(${p.t.toFixed(2)}, ${p.x.toFixed(2)})</td></tr>`; }).join('')}</tbody></table><p class="small muted">γ = ${g.toFixed(4)}</p></div>
      <div><table class="tbl"><thead><tr><th>Pair</th><th class="num">s²</th><th>Type</th><th class="num">Δct</th><th class="num">Δct′</th><th></th></tr></thead><tbody>${pair(ev[0], ev[1])}${pair(ev[0], ev[2])}${pair(ev[1], ev[2])}</tbody></table><p class="small muted">s² is identical in every frame. Only spacelike pairs can change time order.</p></div></div>`;
  });
}

// ── Black-hole orbits (Schwarzschild geodesics) ────────────────
function bhOrbit(main) {
  const { cv, fit, ro } = shell(main, 'bh-orbit', `${slider('r0', 'Initial radius r₀ (GM/c²)', 4, 40, 0.5, 20)}${slider('lf', 'Angular momentum (× circular value)', 0.6, 1.3, 0.01, 0.9)}${slider('sp', 'Speed', 0.2, 5, 0.1, 1.5)}
    <div class="chips"><label class="chip"><input type="checkbox" id="nw" checked> Newtonian orbit (same L)</label></div><button class="btn mt" id="rs">Restart ▶</button>
    <p class="small muted mt">Units G = M = c = 1. Horizon r = 2, photon sphere r = 3, ISCO r = 6. Try r₀ = 20, L = 0.9: the orbit precesses. Drop L below ~0.75 and it plunges.</p>`, 0.7);
  const v = bindSliders(main, ['r0', 'lf', 'sp'], { lf: x => x.toFixed(2) });
  let s;
  const reset = () => {
    // Circular-orbit angular momentum in Schwarzschild: L² = r²/(r − 3) (G = M = c = 1). Newtonian body gets the same L.
    const r = v.r0, Lc = r > 3 ? Math.sqrt(r / (1 - 3 / r)) : 4, L = Lc * v.lf;
    s = { gr: { r, pr: 0, phi: 0, L, trail: [], dead: false }, nw: { r, pr: 0, phi: 0, L, trail: [], dead: false }, tau: 0, peri: [] };
  };
  reset();
  main.querySelector('#rs').onclick = reset;
  main.querySelectorAll('input[type=range]').forEach(e => e.addEventListener('change', reset));
  const acc = (o, gr) => -1 / (o.r * o.r) + o.L * o.L / o.r ** 3 - (gr ? 3 * o.L * o.L / o.r ** 4 : 0);
  const stepBody = (o, gr, dt) => {
    if (o.dead) return;
    const f = (r, pr) => [pr, acc({ r, L: o.L }, gr)];
    const [a1, b1] = f(o.r, o.pr), [a2, b2] = f(o.r + dt / 2 * a1, o.pr + dt / 2 * b1), [a3, b3] = f(o.r + dt / 2 * a2, o.pr + dt / 2 * b2), [a4, b4] = f(o.r + dt * a3, o.pr + dt * b3);
    const prev = o.pr;
    o.r += dt / 6 * (a1 + 2 * a2 + 2 * a3 + a4); o.pr += dt / 6 * (b1 + 2 * b2 + 2 * b3 + b4); o.phi += o.L / (o.r * o.r) * dt;
    if (gr && prev < 0 && o.pr >= 0) s.peri.push(o.phi);
    if (gr && o.r <= 2) o.dead = true;
    if (o.r > 400) o.dead = true;
    o.trail.push([o.r * Math.cos(o.phi), o.r * Math.sin(o.phi)]); if (o.trail.length > 4000) o.trail.shift();
  };
  return loop(dt => {
    const steps = 60;
    for (let i = 0; i < steps; i++) { const h = v.sp * dt * 60 / steps * Math.min(1, Math.pow(s.gr.r / 10, 1.5)); stepBody(s.gr, true, h); stepBody(s.nw, false, h); s.tau += h; }
    const { ctx, w, h } = fit();
    ctx.clearRect(0, 0, w, h);
    const S = Math.min(w, h) / (2.3 * Math.max(v.r0, 8)), cx = w / 2, cy = h / 2;
    const circ = (r, col, fill, dash = []) => { ctx.setLineDash(dash); ctx.beginPath(); ctx.arc(cx, cy, r * S, 0, 7); if (fill) { ctx.fillStyle = col; ctx.fill(); } else { ctx.strokeStyle = col; ctx.stroke(); } ctx.setLineDash([]); };
    circ(6, css('--good'), false, [3, 4]); circ(3, css('--c4'), false, [5, 4]); circ(2, '#000', true); circ(2, css('--c3'), false);
    const trail = (o, col) => { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); o.trail.forEach(([x, y], i) => i ? ctx.lineTo(cx + x * S, cy - y * S) : ctx.moveTo(cx + x * S, cy - y * S)); ctx.stroke(); const p = o.trail[o.trail.length - 1]; if (p && !(o.dead && o.r <= 2)) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx + p[0] * S, cy - p[1] * S, 5, 0, 7); ctx.fill(); } };
    if (main.querySelector('#nw').checked) { ctx.globalAlpha = 0.5; trail(s.nw, css('--ink3')); ctx.globalAlpha = 1; }
    trail(s.gr, css('--qr'));
    ctx.font = '11px JetBrains Mono, monospace'; ctx.fillStyle = css('--good'); ctx.fillText('ISCO r=6', cx + 6 * S + 4, cy); ctx.fillStyle = css('--c4'); ctx.fillText('photon sphere', cx + 3 * S + 4, cy + 14);
    const prec = s.peri.length >= 2 ? ((s.peri[s.peri.length - 1] - s.peri[s.peri.length - 2]) - 2 * Math.PI) * 180 / Math.PI : NaN;
    ro.innerHTML = `<div class="grid g3"><div class="readout"><div class="rl">r now (GR)</div><div class="rv">${s.gr.dead && s.gr.r <= 2 ? '<span style="color:var(--c3)">captured</span>' : s.gr.r.toFixed(2)}</div></div><div class="readout"><div class="rl">Perihelion advance / orbit</div><div class="rv">${Number.isFinite(prec) ? prec.toFixed(1) + '°' : '—'}</div></div><div class="readout"><div class="rl">Proper time τ</div><div class="rv">${s.tau.toFixed(0)}<span class="u">GM/c³</span></div></div></div>
      <p class="small muted">d²r/dτ² = −M/r² + L²/r³ − 3ML²/r⁴ (Schwarzschild, timelike geodesic); the last term is absent in Newtonian gravity. <a href="#/calc/black-hole">Black-hole calculator →</a></p>`;
  });
}
