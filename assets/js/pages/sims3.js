// Third batch of simulations: circuits, fields, flow, machines, and more quantum & relativity.
import { fmt } from '../core/format.js';
import { plotSVG } from '../core/plot.js';
import { css, slider, bindSliders, shell, loop } from './sims.js';

const PI = Math.PI;
const mono = '11px JetBrains Mono, monospace';
const arrow = (ctx, x0, y0, x1, y1, col, lw = 2) => {
  const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), hd = Math.min(9, L * 0.35);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  if (L < 2) return;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - hd * Math.cos(a - 0.4), y1 - hd * Math.sin(a - 0.4)); ctx.lineTo(x1 - hd * Math.cos(a + 0.4), y1 - hd * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
};
const text = (ctx, s, x, y, col, align = 'left') => { ctx.fillStyle = col; ctx.font = mono; ctx.textAlign = align; ctx.fillText(s, x, y); ctx.textAlign = 'left'; };

// ── Series RLC circuit (AC phasors) ─────────────────────────────
function rlc(main) {
  const { fit, ro } = shell(main, 'rlc', `${slider('R', 'Resistance R (Ω)', 1, 200, 1, 20)}${slider('L', 'Inductance L (mH)', 1, 500, 1, 100)}${slider('C', 'Capacitance C (µF)', 1, 200, 1, 10)}${slider('f', 'Frequency f (Hz)', 5, 600, 1, 120)}${slider('V', 'Source amplitude V₀ (V)', 1, 20, 0.5, 10)}<p class="small muted">Phasors rotate (slowed down for display). The projection on the vertical axis is the instantaneous value. At resonance V_L and V_C cancel and the current peaks.</p>`, 0.5, '<div id="rcurve" class="mt"></div>');
  const v = bindSliders(main, ['R', 'L', 'C', 'f', 'V']);
  let th = 0, trace = [], key = '';
  return loop(dt => {
    th += dt * 2 * PI * 0.35;
    const L = v.L * 1e-3, C = v.C * 1e-6, w0 = 2 * PI * v.f, XL = w0 * L, XC = 1 / (w0 * C), Z = Math.hypot(v.R, XL - XC), phi = Math.atan2(XL - XC, v.R), I0 = v.V / Z;
    const f0 = 1 / (2 * PI * Math.sqrt(L * C)), Q = Math.sqrt(L / C) / v.R;
    const k = [v.R, v.L, v.C, v.f, v.V].join();
    if (k !== key) {
      key = k; trace = [];
      const fs = [], Is = [];
      for (let i = 0; i <= 300; i++) { const f = 5 + 595 * i / 300, w = 2 * PI * f; fs.push(f); Is.push(1e3 * v.V / Math.hypot(v.R, w * L - 1 / (w * C))); }
      main.querySelector('#rcurve').innerHTML = plotSVG([{ x: fs, y: Is, label: 'I₀(f)' }], { xlabel: 'f (Hz)', ylabel: 'I₀ (mA)', h: 220, marks: [{ x: v.f, label: 'f' }, ...(f0 < 600 ? [{ x: f0, label: 'f₀' }] : [])] });
    }
    const { ctx, w, h } = fit();
    ctx.clearRect(0, 0, w, h);
    // Phasor diagram (current phasor as reference angle th − φ)
    const cx = w * 0.22, cy = h / 2, Rp = Math.min(w * 0.18, h * 0.42);
    const vmax = Math.max(v.V, I0 * v.R, I0 * XL, I0 * XC), sc = Rp / vmax;
    ctx.strokeStyle = css('--line2'); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, 2 * PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - Rp - 8, cy); ctx.lineTo(cx + Rp + 8, cy); ctx.moveTo(cx, cy - Rp - 8); ctx.lineTo(cx, cy + Rp + 8); ctx.stroke();
    const ai = th - phi; // current angle
    const P = (mag, ang) => [cx + mag * sc * Math.cos(ang), cy - mag * sc * Math.sin(ang)];
    const [xr, yr] = P(I0 * v.R, ai), [xl, yl] = P(I0 * XL, ai + PI / 2), [xc, yc] = P(I0 * XC, ai - PI / 2), [xv, yv] = P(v.V, th);
    arrow(ctx, cx, cy, xr, yr, css('--c2')); arrow(ctx, cx, cy, xl, yl, css('--c3')); arrow(ctx, cx, cy, xc, yc, css('--c4')); arrow(ctx, cx, cy, xv, yv, css('--acc'), 3);
    text(ctx, 'V_R', xr + 4, yr - 4, css('--c2')); text(ctx, 'V_L', xl + 4, yl - 4, css('--c3')); text(ctx, 'V_C', xc + 4, yc - 4, css('--c4')); text(ctx, 'V_s', xv + 4, yv - 4, css('--acc'));
    // Waveforms
    trace.push([Math.sin(th), Math.sin(ai) * I0 * v.R / v.V]); if (trace.length > 360) trace.shift();
    const x0 = w * 0.45, x1 = w - 12, amp = h * 0.38;
    ctx.strokeStyle = css('--line2'); ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.stroke();
    [[0, '--acc', 'v_s(t)'], [1, '--c2', 'i(t)·R']].forEach(([j, c, lab]) => {
      ctx.strokeStyle = css(c); ctx.lineWidth = 2; ctx.beginPath();
      trace.forEach((p, i) => { const X = x1 - (trace.length - 1 - i) * (x1 - x0) / 360, Y = cy - p[j] * amp; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.stroke(); text(ctx, lab, x0 + 4, 14 + j * 14, css(c));
    });
    ctx.strokeStyle = css('--ink3'); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cx, yv); ctx.lineTo(x1, yv); ctx.stroke(); ctx.setLineDash([]);
    ro.innerHTML = `<div class="kv"><span>X_L = ${fmt(XL, 4)} Ω · X_C = ${fmt(XC, 4)} Ω</span><span>|Z| = ${fmt(Z, 4)} Ω</span><span>φ = ${fmt(phi * 180 / PI, 3)}° (${phi > 0.01 ? 'inductive — current lags' : phi < -0.01 ? 'capacitive — current leads' : 'resistive'})</span><span>I₀ = ${fmt(I0 * 1e3, 4)} mA</span><span>f₀ = ${fmt(f0, 4)} Hz · Q = ${fmt(Q, 3)}</span><span>P = ${fmt(0.5 * I0 * I0 * v.R, 4)} W · pf = ${fmt(Math.cos(phi), 3)}</span></div><p class="small muted"><a href="#/calc/rlc">RLC calculator →</a> · <a href="#/solvers/circuit">Circuit solver →</a></p>`;
  });
}

// ── Magnetic field of straight wires ────────────────────────────
function bfield(main) {
  const { cv, fit, ro } = shell(main, 'bfield', `${slider('I', 'Current magnitude I (A)', 1, 100, 1, 20)}<div class="btns"><button class="btn sm" id="out">+ wire ⊙ (out)</button><button class="btn ghost sm" id="in">+ wire ⊗ (in)</button><button class="btn ghost sm" id="pre">Two wires</button></div><div class="chips mt"><label class="chip"><input type="checkbox" id="mag" checked> |B| map</label></div><p class="small muted mt">View is 20 cm across. Drag wires; double-click to reverse the current. Hover to read B.</p>`, 0.6);
  const v = bindSliders(main, ['I']);
  let W = [{ x: 0.38, y: 0.5, s: 1 }, { x: 0.62, y: 0.5, s: 1 }], drag = -1, dirty = true, hover = null;
  const span = 0.2, mu0 = 4e-7 * PI;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  const hit = (x, y) => W.findIndex(c => Math.hypot(c.x - x, (c.y - y) * 0.6) < 0.03);
  cv.addEventListener('pointerdown', e => { const [x, y] = pos(e); drag = hit(x, y); if (drag >= 0) cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { const [x, y] = pos(e); hover = [x, y]; if (drag >= 0) { W[drag].x = x; W[drag].y = y; } dirty = true; });
  cv.addEventListener('pointerup', () => { drag = -1; });
  cv.addEventListener('dblclick', e => { const i = hit(...pos(e)); if (i >= 0) { W[i].s *= -1; dirty = true; } });
  main.querySelector('#out').onclick = () => { W.push({ x: 0.2 + Math.random() * 0.6, y: 0.25 + Math.random() * 0.5, s: 1 }); dirty = true; };
  main.querySelector('#in').onclick = () => { W.push({ x: 0.2 + Math.random() * 0.6, y: 0.25 + Math.random() * 0.5, s: -1 }); dirty = true; };
  main.querySelector('#pre').onclick = () => { W = [{ x: 0.38, y: 0.5, s: 1 }, { x: 0.62, y: 0.5, s: -1 }]; dirty = true; };
  main.querySelectorAll('input').forEach(i => i.addEventListener('input', () => { dirty = true; }));
  return loop(() => {
    if (!dirty) return; dirty = false;
    const { ctx, w, h } = fit(), m = span / w; // metres per pixel
    // B in tesla at pixel (px,py); out-of-page current gives CCW field (screen y down → flip)
    const B = (px, py) => W.reduce((s, c) => { const dx = (px - c.x * w) * m, dy = (py - c.y * h) * m, r2 = Math.max(dx * dx + dy * dy, (3 * m) ** 2), k = mu0 * v.I * c.s / (2 * PI * r2); return [s[0] + k * dy, s[1] - k * dx]; }, [0, 0]);
    ctx.clearRect(0, 0, w, h);
    if (main.querySelector('#mag').checked) {
      const st = 6;
      for (let px = 0; px < w; px += st) for (let py = 0; py < h; py += st) { const b = B(px + st / 2, py + st / 2), t = Math.min(1, Math.hypot(b[0], b[1]) / (mu0 * v.I / (2 * PI * 0.01))); ctx.fillStyle = `rgba(90,170,255,${0.05 + 0.5 * Math.sqrt(t)})`; ctx.fillRect(px, py, st, st); }
    }
    ctx.strokeStyle = css('--ink2'); ctx.lineWidth = 1;
    W.forEach(c => [14, 30, 52, 80, 115, 160].forEach(d => {
      let x = c.x * w + d, y = c.y * h; const x0 = x, y0 = y; ctx.beginPath(); ctx.moveTo(x, y);
      for (let s = 0; s < 4000; s++) {
        const b1 = B(x, y), n1 = Math.hypot(...b1) || 1, xm = x + 1.5 * b1[0] / n1, ym = y + 1.5 * b1[1] / n1, b2 = B(xm, ym), n2 = Math.hypot(...b2) || 1;
        x += 3 * b2[0] / n2; y += 3 * b2[1] / n2; ctx.lineTo(x, y);
        if (s > 20 && Math.hypot(x - x0, y - y0) < 3) { ctx.closePath(); break; }
        if (x < -w || y < -h || x > 2 * w || y > 2 * h) break;
      }
      ctx.stroke();
    }));
    W.forEach(c => { const X = c.x * w, Y = c.y * h; ctx.fillStyle = css('--panel'); ctx.strokeStyle = css(c.s > 0 ? '--acc' : '--c3'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, 11, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; if (c.s > 0) { ctx.beginPath(); ctx.arc(X, Y, 3, 0, 7); ctx.fill(); } else { ctx.beginPath(); ctx.moveTo(X - 6, Y - 6); ctx.lineTo(X + 6, Y + 6); ctx.moveTo(X + 6, Y - 6); ctx.lineTo(X - 6, Y + 6); ctx.stroke(); } });
    let extra = '';
    if (W.length >= 2) { const d = Math.hypot((W[0].x - W[1].x) * w, (W[0].y - W[1].y) * h) * m, F = mu0 * v.I * v.I / (2 * PI * d); extra = `<span>Wires 1–2: d = ${fmt(d * 100, 3)} cm, F/L = ${fmt(F * 1e3, 4)} mN/m (${W[0].s === W[1].s ? 'attract — parallel currents' : 'repel — antiparallel'})</span>`; }
    let hb = '';
    if (hover) { const b = B(hover[0] * w, hover[1] * h); hb = `<span>|B| at cursor = ${fmt(Math.hypot(...b) * 1e6, 4)} µT</span>`; }
    ro.innerHTML = `<div class="kv">${hb}${extra}<span>Single wire: B = μ₀I/2πr = ${fmt(mu0 * v.I / (2 * PI * 0.01) * 1e6, 4)} µT at 1 cm</span></div><p class="small muted">Field lines circle each wire (right-hand rule: ⊙ out of page → anticlockwise). They never start or end — ∇·B = 0. <a href="#/calc/bfield">Field calculator →</a></p>`;
  });
}

// ── Potential flow past a cylinder (Magnus effect) ──────────────
function flow(main) {
  const { fit, ro } = shell(main, 'flow', `${slider('U', 'Free-stream speed U (m/s)', 1, 30, 0.5, 10)}${slider('k', 'Circulation Γ / (4πUa)', -1.5, 1.5, 0.05, 0.4)}${slider('np', 'Tracer particles', 0, 600, 20, 300)}<div class="chips mt"><label class="chip"><input type="checkbox" id="cp" checked> surface C_p</label></div><p class="small muted mt">Ideal (inviscid, irrotational) flow: uniform stream + doublet + vortex. Cylinder radius a = 0.1 m, air ρ = 1.225 kg/m³.</p>`, 0.55);
  const v = bindSliders(main, ['U', 'k', 'np']);
  const a = 0.1, rho = 1.225;
  let parts = [];
  const vel = (x, y, U, G) => { // x,y in metres, cylinder at origin
    const r2 = x * x + y * y, r = Math.sqrt(r2); if (r < a) return [0, 0];
    const c = x / r, s = y / r, ur = U * c * (1 - a * a / r2), ut = -U * s * (1 + a * a / r2) - G / (2 * PI * r);
    return [ur * c - ut * s, ur * s + ut * c];
  };
  return loop(dt => {
    const { ctx, w, h } = fit(), sc = w / 1.2, ox = w / 2, oy = h / 2; // 1.2 m across
    const U = v.U, G = v.k * 4 * PI * U * a;
    const toS = (x, y) => [ox + x * sc, oy - y * sc];
    ctx.clearRect(0, 0, w, h);
    // Streamlines from left edge (RK2)
    ctx.strokeStyle = css('--line2'); ctx.lineWidth = 1;
    const ymax = h / 2 / sc;
    for (let j = -14; j <= 14; j++) {
      let x = -0.6, y = j / 14 * ymax * 0.98; ctx.beginPath(); ctx.moveTo(...toS(x, y));
      for (let s = 0; s < 1500; s++) {
        const u1 = vel(x, y, U, G), n1 = Math.hypot(...u1) || 1, xm = x + 0.002 * u1[0] / n1, ym = y + 0.002 * u1[1] / n1, u2 = vel(xm, ym, U, G), n2 = Math.hypot(...u2) || 1;
        x += 0.004 * u2[0] / n2; y += 0.004 * u2[1] / n2; ctx.lineTo(...toS(x, y));
        if (x > 0.62 || Math.abs(y) > ymax * 1.2 || n2 < 1e-6) break;
      }
      ctx.stroke();
    }
    // Tracers
    while (parts.length < v.np) parts.push([-0.6 + Math.random() * 1.2, (Math.random() * 2 - 1) * ymax]);
    parts.length = v.np;
    ctx.fillStyle = css('--acc');
    parts.forEach(p => {
      const u = vel(p[0], p[1], U, G); p[0] += u[0] * dt * 0.05; p[1] += u[1] * dt * 0.05;
      if (p[0] > 0.6 || p[0] * p[0] + p[1] * p[1] < a * a * 0.98 || Math.abs(p[1]) > ymax) { p[0] = -0.6; p[1] = (Math.random() * 2 - 1) * ymax; }
      const [X, Y] = toS(p[0], p[1]); ctx.fillRect(X - 1, Y - 1, 2.5, 2.5);
    });
    // Cylinder with surface Cp = 1 − (u_θ/U)²
    const [cx, cy] = toS(0, 0);
    ctx.fillStyle = css('--panel'); ctx.beginPath(); ctx.arc(cx, cy, a * sc, 0, 7); ctx.fill();
    if (main.querySelector('#cp').checked) for (let i = 0; i < 72; i++) {
      const t = 2 * PI * i / 72, ut = -2 * U * Math.sin(t) - G / (2 * PI * a), Cp = 1 - (ut / U) ** 2, q = Math.max(-1, Math.min(1, Cp / 3));
      ctx.strokeStyle = q > 0 ? `rgba(255,95,162,${0.3 + 0.7 * q})` : `rgba(90,170,255,${0.3 - 0.7 * q})`; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, a * sc + 3, -t - PI / 72, -t + PI / 72, false); ctx.stroke();
    }
    // Stagnation points
    const ss = -G / (4 * PI * U * a);
    ctx.fillStyle = css('--warn');
    if (Math.abs(ss) <= 1) [Math.asin(ss), PI - Math.asin(ss)].forEach(t => { const [X, Y] = toS(a * Math.cos(t), a * Math.sin(t)); ctx.beginPath(); ctx.arc(X, Y, 4, 0, 7); ctx.fill(); });
    else { const rr = a * (Math.abs(ss) + Math.sqrt(ss * ss - 1)), [X, Y] = toS(0, Math.sign(ss) * rr); ctx.beginPath(); ctx.arc(X, Y, 4, 0, 7); ctx.fill(); }
    const Lp = rho * U * G;
    arrow(ctx, cx, cy, cx, cy - Math.sign(Lp) * Math.min(h * 0.3, 20 + Math.abs(Lp) * 0.6), css('--good'), 3);
    ro.innerHTML = `<div class="kv"><span>Γ = ${fmt(G, 4)} m²/s (clockwise +)</span><span>Lift per span L′ = ρUΓ = ${fmt(Lp, 4)} N/m (Kutta–Joukowski)</span><span>Drag = 0 (d'Alembert's paradox — no viscosity)</span><span>Stagnation: ${Math.abs(ss) <= 1 ? `sin θ = ${fmt(ss, 3)} on the surface` : 'single point off the body'}</span><span>Max surface speed ${fmt(Math.abs(2 * U) + Math.abs(G) / (2 * PI * a), 4)} m/s</span></div><p class="small muted">Surface colour: C_p (magenta = high pressure, blue = suction). Faster flow over the top → lower pressure → lift (Magnus effect). Real cylinders separate and shed vortices — see <a href="#/calc/drag">drag calculator</a>.</p>`;
  });
}

// ── Gear train ──────────────────────────────────────────────────
function gears(main) {
  const { fit, ro } = shell(main, 'gears', `${slider('N1', 'Driver teeth N₁', 8, 60, 1, 16)}${slider('N2', 'Idler / 2nd gear teeth N₂', 8, 80, 1, 32)}${slider('N3', 'Output teeth N₃', 8, 80, 1, 24)}${slider('n', 'Input speed (rpm)', 1, 120, 1, 20)}${slider('T', 'Input torque (N·m)', 1, 200, 1, 50)}${slider('eta', 'Efficiency per mesh (%)', 90, 100, 0.5, 98)}<div class="chips mt"><label class="chip"><input type="checkbox" id="three" checked> 3-gear train (idler)</label></div><p class="small muted mt">Display speed is scaled; ratios are exact. Module 2 mm.</p>`, 0.5);
  const v = bindSliders(main, ['N1', 'N2', 'N3', 'n', 'T', 'eta']);
  let th = 0;
  const mesh = (al, thA, NA, NB) => al + PI - PI / NB + (al - thA) * NA / NB;
  const draw = (ctx, x, y, r, N, m, ang, col) => {
    const ra = r + m, rr = r - 1.25 * m, p = PI / N;
    ctx.beginPath();
    for (let k = 0; k < N; k++) {
      const c = ang + 2 * k * p, pts = [[rr, c - p], [rr, c - 0.55 * p], [ra, c - 0.28 * p], [ra, c + 0.28 * p], [rr, c + 0.55 * p]];
      pts.forEach(([R, A], i) => { const X = x + R * Math.cos(A), Y = y - R * Math.sin(A); k === 0 && i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); });
    }
    ctx.closePath(); ctx.fillStyle = col; ctx.globalAlpha = 0.25; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rr * 0.8 * Math.cos(ang), y - rr * 0.8 * Math.sin(ang)); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, Math.max(3, r * 0.12), 0, 7); ctx.stroke();
    ctx.setLineDash([2, 3]); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  };
  return loop(dt => {
    const three = main.querySelector('#three').checked, Ns = three ? [v.N1, v.N2, v.N3] : [v.N1, v.N2];
    th += dt * 2 * PI * v.n / 60 * 0.5;
    const { ctx, w, h } = fit();
    const mm = 2, rs = Ns.map(N => mm * N / 2), total = 2 * rs.reduce((s, r) => s + r, 0) + 4 * mm;
    const sc = Math.min((w * 0.94) / total, (h * 0.9) / (2 * Math.max(...rs) + 2 * mm));
    ctx.clearRect(0, 0, w, h);
    let x = (w - total * sc) / 2 + (rs[0] + 2 * mm) * sc, ang = th;
    const cols = ['--acc', '--c2', '--c3'];
    Ns.forEach((N, i) => {
      if (i > 0) { ang = mesh(0, ang, Ns[i - 1], N); x += (rs[i - 1] + rs[i]) * sc; }
      draw(ctx, x, h / 2, rs[i] * sc, N, mm * sc, ang, css(cols[i]));
      text(ctx, `N=${N}`, x, h / 2 + rs[i] * sc + mm * sc + 14, css(cols[i]), 'center');
    });
    const Nout = Ns[Ns.length - 1], ratio = Nout / v.N1, meshes = Ns.length - 1, eff = (v.eta / 100) ** meshes;
    const dir = meshes % 2 ? 'opposite to' : 'same as';
    ro.innerHTML = `<div class="kv"><span>Ratio i = N_out/N₁ = ${fmt(ratio, 4)}</span><span>Output speed = ${fmt(v.n / ratio, 4)} rpm (${dir} input)</span><span>Output torque = ${fmt(v.T * ratio * eff, 4)} N·m</span><span>Power in ${fmt(v.T * v.n * 2 * PI / 60, 4)} W → out ${fmt(v.T * v.n * 2 * PI / 60 * eff, 4)} W</span>${three ? `<span>Idler N₂ changes direction only — not the ratio</span>` : ''}<span>Centre distances: ${rs.slice(1).map((r, i) => fmt(rs[i] + r, 4) + ' mm').join(', ')}</span></div><p class="small muted"><a href="#/solvers/gear">Drive-train solver →</a> · <a href="#/calc/gear-train">Gear calculator →</a></p>`;
  });
}

// ── Stern–Gerlach ───────────────────────────────────────────────
function sternGerlach(main) {
  const { fit, ro } = shell(main, 'stern-gerlach', `<div class="field"><label>Model</label><select class="plain" id="mode"><option value="q">Quantum spin-½</option><option value="c">Classical magnetic moment</option></select></div><div class="chips mt"><label class="chip"><input type="checkbox" id="seq"> Second magnet on the ↑ beam</label></div>${slider('ang', 'Second magnet angle θ (°)', 0, 180, 5, 90)}${slider('rate', 'Atoms per second', 5, 200, 5, 60)}<button class="btn ghost sm mt" id="clr">Clear screen</button><p class="small muted mt">Silver atoms (one unpaired electron) pass through an inhomogeneous field. Classically the moment could point anywhere → a continuous smear. Stern & Gerlach (1922) saw two spots.</p>`, 0.5);
  const v = bindSliders(main, ['ang', 'rate']);
  let atoms = [], hits = [], acc = 0;
  main.querySelector('#clr').onclick = () => { hits = []; };
  main.querySelectorAll('select, input[type=checkbox]').forEach(e => e.addEventListener('change', () => { hits = []; atoms = []; }));
  const X1 = [0.18, 0.34], X2 = [0.5, 0.64], XS = 0.72;
  return loop(dt => {
    const q = main.querySelector('#mode').value === 'q', seq = main.querySelector('#seq').checked, th = v.ang * PI / 180;
    acc += dt * v.rate;
    while (acc >= 1) {
      acc -= 1;
      const a = { x: 0, y0: (Math.random() - 0.5) * 0.02, z0: (Math.random() - 0.5) * 0.02 };
      if (q) a.s1 = Math.random() < 0.5 ? 1 : -1; else { a.s1 = 2 * Math.random() - 1; a.phi = 2 * PI * Math.random(); }
      if (seq) {
        if (q) a.s2 = Math.random() < Math.cos(th / 2) ** 2 ? 1 : -1; // |↑z⟩ measured along n(θ)
        else { const sz = a.s1, sp = Math.sqrt(1 - sz * sz); a.s2 = sz * Math.cos(th) + sp * Math.cos(a.phi) * Math.sin(th); }
      }
      atoms.push(a);
    }
    const D = 0.28;
    const posAt = (a, x) => { // transverse (y horizontal-in-screen, z vertical) displacement at position x
      let z = a.z0, y = a.y0;
      const f1 = Math.min(1, Math.max(0, (x - X1[0]) / (X1[1] - X1[0])));
      z += a.s1 * D * (f1 * f1 * 0.5 * (X1[1] - X1[0]) + Math.max(0, x - X1[1])) / (XS - X1[0]);
      if (seq && a.s2 !== undefined) {
        const f2 = Math.min(1, Math.max(0, (x - X2[0]) / (X2[1] - X2[0]))), d2 = a.s2 * D * (f2 * f2 * 0.5 * (X2[1] - X2[0]) + Math.max(0, x - X2[1])) / (XS - X1[0]);
        z += d2 * Math.cos(th); y += d2 * Math.sin(th);
      }
      return [y, z];
    };
    const { ctx, w, h } = fit(), sideW = w * 0.72, cy = h / 2, zs = h * 0.9;
    ctx.clearRect(0, 0, w, h);
    const box = (x0, x1, label) => { ctx.fillStyle = css('--panel2'); ctx.fillRect(x0 * w, cy - h * 0.2, (x1 - x0) * w, h * 0.4); ctx.strokeStyle = css('--line2'); ctx.strokeRect(x0 * w, cy - h * 0.2, (x1 - x0) * w, h * 0.4); text(ctx, label, (x0 + x1) / 2 * w, cy - h * 0.22, css('--ink2'), 'center'); };
    box(X1[0], X1[1], 'SG-z  N/S');
    if (seq) { box(X2[0], X2[1], `SG-${v.ang}°`); ctx.fillStyle = css('--bad'); ctx.fillRect(0.44 * w, cy + 2, 4, h * 0.4); text(ctx, 'block ↓', 0.44 * w + 6, cy + h * 0.35, css('--bad')); }
    ctx.fillStyle = css('--ink2'); ctx.fillRect(4, cy - 6, 14, 12); text(ctx, 'oven', 2, cy - 10, css('--ink3'));
    ctx.strokeStyle = css('--line'); ctx.beginPath(); ctx.moveTo(sideW, 6); ctx.lineTo(sideW, h - 6); ctx.stroke();
    ctx.fillStyle = css('--acc');
    atoms = atoms.filter(a => {
      a.x += dt * 0.5;
      if (seq && a.x > 0.44 && (q ? a.s1 < 0 : a.s1 < 0)) return false;
      if (a.x >= XS) { hits.push(posAt(a, XS)); if (hits.length > 4000) hits.shift(); return false; }
      const [, z] = posAt(a, a.x); ctx.fillRect(a.x / XS * sideW - 1, cy - z * zs - 1, 3, 3); return true;
    });
    // Screen face (y,z) view
    const fx = sideW + (w - sideW) / 2, fs = (w - sideW) * 0.45 / 0.35;
    ctx.strokeStyle = css('--line2'); ctx.strokeRect(sideW + 8, 8, w - sideW - 16, h - 16);
    text(ctx, 'screen (face-on)', fx, 22, css('--ink3'), 'center');
    ctx.fillStyle = css('--c3'); hits.forEach(([y, z]) => ctx.fillRect(fx + y * fs - 1, cy - z * zs - 1, 2.5, 2.5));
    const z1 = D * (0.5 * (X1[1] - X1[0]) + (XS - X1[1])) / (XS - X1[0]); // ↑-beam offset at the screen after magnet 1
    const n = hits.length, up = hits.filter(p => (seq ? (p[0] * Math.sin(th) + (p[1] - z1) * Math.cos(th)) : p[1]) > 0).length;
    const theory = q ? (seq ? `P(+θ) = cos²(θ/2) = ${fmt(Math.cos(th / 2) ** 2, 3)}` : 'P(↑) = P(↓) = ½') : 'continuous distribution (uniform in cos θ)';
    ro.innerHTML = `<div class="kv"><span>Atoms detected: ${n}</span>${q && n ? `<span>Measured fraction ${seq ? '+θ' : '↑'}: ${fmt(up / n, 3)}</span>` : ''}<span>Theory: ${theory}</span></div><p class="small muted">${seq ? 'The second magnet re-measures the ↑ atoms along θ. At θ = 90° the outcome is 50/50 — measuring S_x erases S_z knowledge. At θ = 180° every atom goes “down”.' : 'Spin is quantised: S_z = ±ħ/2 only.'} <a href="#/calc/zeeman">Zeeman / spin calculator →</a></p>`;
  });
}

// ── Gravitational lensing ───────────────────────────────────────
function lensing(main) {
  const { cv, fit, ro } = shell(main, 'lensing', `${slider('lm', 'Lens mass log₁₀(M/M☉)', 0, 13, 0.1, 12)}${slider('rs', 'Source radius (θ_E units)', 0.03, 0.6, 0.01, 0.15)}${slider('u0', 'Light-curve impact parameter u₀', 0.05, 1.5, 0.05, 0.3)}<div class="field"><label>Source</label><select class="plain" id="src"><option value="gal">Galaxy (disk + arms)</option><option value="grid">Background grid</option><option value="spot">Uniform disk</option></select></div><p class="small muted">Drag in the image to move the source. Point-mass lens; D_L = 1 Gpc, D_S = 2 Gpc (flat, D_LS = D_S − D_L).</p>`, 0.6, '<div id="lc" class="mt"></div>');
  const v = bindSliders(main, ['lm', 'rs', 'u0']);
  let bx = 0.25, by = 0.1, drag = false, dirty = true, key = '';
  const view = 2.4; // half-width in θ_E units
  const toTheta = (e) => { const r = cv.getBoundingClientRect(), W = r.width, H = r.height; return [((e.clientX - r.left) / W - 0.5) * 2 * view, -((e.clientY - r.top) / H - 0.5) * 2 * view * H / W]; };
  cv.addEventListener('pointerdown', e => { drag = true; cv.setPointerCapture(e.pointerId); [bx, by] = toTheta(e); dirty = true; });
  cv.addEventListener('pointermove', e => { if (drag) { [bx, by] = toTheta(e); dirty = true; } });
  cv.addEventListener('pointerup', () => { drag = false; });
  main.querySelectorAll('input,select').forEach(i => i.addEventListener('input', () => { dirty = true; }));
  const off = document.createElement('canvas');
  const src = (x, y, kind, rs) => {
    const dx = x - bx, dy = y - by, r = Math.hypot(dx, dy) / rs;
    if (kind === 'spot') return r < 1 ? [255, 230, 120] : null;
    if (kind === 'grid') { const g = 0.25, gx = Math.abs(((x / g) % 1 + 1) % 1 - 0.5), gy = Math.abs(((y / g) % 1 + 1) % 1 - 0.5); return gx > 0.45 || gy > 0.45 ? [120, 200, 255] : null; }
    if (r > 1.6) return null;
    const ang = Math.atan2(dy, dx), arm = 0.5 + 0.5 * Math.cos(2 * ang - 5 * Math.log(r + 0.05)), I = Math.exp(-r * r * 2.2) * (0.55 + 0.45 * arm) + Math.exp(-r * r * 30) * 0.8;
    return I > 0.04 ? [255 * Math.min(1, I * 1.3), 200 * Math.min(1, I * 1.2), 255 * Math.min(1, I * 0.9 + 0.2 * arm * I)] : null;
  };
  return loop(() => {
    if (!dirty) return; dirty = false;
    const { ctx, w, h } = fit(), kind = main.querySelector('#src').value;
    const N = 260, Nh = Math.round(N * h / w); off.width = N; off.height = Nh;
    const o = off.getContext('2d'), img = o.createImageData(N, Nh), d = img.data;
    for (let j = 0; j < Nh; j++) for (let i = 0; i < N; i++) {
      const tx = (i / N - 0.5) * 2 * view, ty = -(j / Nh - 0.5) * 2 * view * Nh / N, t2 = tx * tx + ty * ty || 1e-9;
      const c = src(tx - tx / t2, ty - ty / t2, kind, v.rs), k = 4 * (j * N + i);
      if (c) { d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255; } else { d[k + 3] = 0; }
    }
    o.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, w, h); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, w, h);
    const sx = t => (t / (2 * view) + 0.5) * w, sy = t => (0.5 - t / (2 * view) * w / h) * h;
    ctx.strokeStyle = css('--ink3'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(sx(0), sy(0), w / (2 * view), 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = css('--warn'); ctx.beginPath(); ctx.arc(sx(0), sy(0), 4, 0, 7); ctx.fill();
    ctx.strokeStyle = css('--c3'); ctx.beginPath(); ctx.arc(sx(bx), sy(by), 5, 0, 7); ctx.stroke(); text(ctx, 'true source', sx(bx) + 8, sy(by) - 6, css('--c3'));
    text(ctx, 'Einstein ring θ_E', sx(0) + w / (2 * view) * 0.72, sy(0) - w / (2 * view) * 0.72, css('--ink3'));
    // Physics readouts
    const G = 6.674e-11, c = 2.998e8, Ms = 1.989e30, Gpc = 3.0857e25, M = 10 ** v.lm * Ms, DL = Gpc, DS = 2 * Gpc, DLS = Gpc;
    const thE = Math.sqrt(4 * G * M / c ** 2 * DLS / (DL * DS)), arcsec = thE * 206264.806;
    const u = Math.hypot(bx, by), tp = (u + Math.sqrt(u * u + 4)) / 2, tm = (u - Math.sqrt(u * u + 4)) / 2, mu = (u * u + 2) / (u * Math.sqrt(u * u + 4));
    const k2 = `${v.u0}`;
    if (k2 !== key) {
      key = k2; const ts = [], ms = [];
      for (let i = 0; i <= 200; i++) { const t = -3 + 6 * i / 200, uu = Math.hypot(t, v.u0); ts.push(t); ms.push((uu * uu + 2) / (uu * Math.sqrt(uu * uu + 4))); }
      main.querySelector('#lc').innerHTML = plotSVG([{ x: ts, y: ms, label: 'A(t)' }], { xlabel: 't / t_E', ylabel: 'magnification A', h: 200, title: `Microlensing light curve (Paczyński), u₀ = ${v.u0}` });
    }
    ro.innerHTML = `<div class="kv"><span>θ_E = ${arcsec > 0.1 ? fmt(arcsec, 4) + '″' : fmt(arcsec * 1e6, 4) + ' µas'}</span><span>Source offset β = ${fmt(u, 3)} θ_E</span><span>Images at θ₊ = ${fmt(tp, 3)}, θ₋ = ${fmt(tm, 3)} θ_E</span><span>Total magnification μ = ${fmt(mu, 4)}</span></div><p class="small muted">Lens equation β = θ − θ_E²/θ, solved by inverse ray shooting per pixel. Surface brightness is conserved, so larger images are brighter in total. Galaxy-scale lenses (10¹²M☉) give arcsecond rings; stars give micro-arcsecond ones that are only seen as brightening.</p>`;
  });
}

// ── Accretion disk around a black hole ──────────────────────────
function accretion(main) {
  const { fit, ro } = shell(main, 'accretion', `${slider('a', 'Spin a = Jc/GM² (prograde)', 0, 0.998, 0.002, 0.5)}${slider('inc', 'Inclination i (°)', 0, 85, 1, 70)}${slider('lm', 'Mass log₁₀(M/M☉)', 1, 10, 0.1, 1)}${slider('mdot', 'Accretion rate (Eddington fraction)', 0.01, 1, 0.01, 0.1)}<p class="small muted">Thin disk (Shakura–Sunyaev / Page–Thorne-type temperature law), coloured by observed blackbody temperature with Doppler beaming and gravitational redshift. Light bending is not traced.</p>`, 0.55, '<div id="tprof" class="mt"></div>');
  const v = bindSliders(main, ['a', 'inc', 'lm', 'mdot']);
  let key = '';
  const off = document.createElement('canvas');
  const risco = a => { const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a)), z2 = Math.sqrt(3 * a * a + z1 * z1); return 3 + z2 - Math.sqrt((3 - z1) * (3 + z1 + 2 * z2)); };
  const rgb = K => { // Tanner Helland blackbody approximation
    const t = K / 100; let r, g, b;
    r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
    g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -0.0755148492;
    b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    return [r, g, b].map(x => Math.max(0, Math.min(255, x)));
  };
  return loop(() => {
    const k = [v.a, v.inc, v.lm, v.mdot].join(); if (k === key) return; key = k;
    const { ctx, w, h } = fit(), ri = risco(v.a), rout = 30, inc = v.inc * PI / 180, eta = 1 - Math.sqrt(1 - 2 / (3 * ri));
    // Physical temperature scale: T(r) = T* f(r); σT*⁴ = 3GMṀ/(8π r_g³)
    const G = 6.674e-11, c = 2.998e8, sig = 5.670374e-8, Ms = 1.989e30, M = 10 ** v.lm * Ms, rg = G * M / c ** 2;
    const LEdd = 1.2572e31 * 10 ** v.lm, Mdot = v.mdot * LEdd / (eta * c * c);
    const Tstar = (3 * G * M * Mdot / (8 * PI * sig * rg ** 3)) ** 0.25;
    const f = r => r <= ri ? 0 : (r ** -3 * (1 - Math.sqrt(ri / r))) ** 0.25;
    let fmax = 0, rpk = ri; for (let r = ri; r < rout; r += 0.01) { const q = f(r); if (q > fmax) { fmax = q; rpk = r; } }
    const N = 300, Nh = Math.round(N * h / w); off.width = N; off.height = Nh;
    const o = off.getContext('2d'), img = o.createImageData(N, Nh), d = img.data, S = 34; // half-width in r_g
    for (let j = 0; j < Nh; j++) for (let i = 0; i < N; i++) {
      const X = (i / N - 0.5) * 2 * S, Y = -(j / Nh - 0.5) * 2 * S * Nh / N, x = X, y = Y / Math.max(0.05, Math.cos(inc)), r = Math.hypot(x, y), kk = 4 * (j * N + i);
      const shadow = Math.hypot(X, Y) < 3 * Math.sqrt(3) * (1 - 0.1 * v.a);
      // near half of the disk (y<0 in disk coords) is in front of the hole
      if (r > ri && r < rout && (!shadow || y < 0)) {
        // Circular-orbit redshift factor (Schwarzschild): g = √(1 − 3/r) / (1 − β sin i cos φ); the +x side approaches.
        const phi = Math.atan2(y, x), beta = 1 / Math.sqrt(r);
        const g = Math.sqrt(Math.max(0.01, 1 - 3 / r)) / (1 - beta * Math.sin(inc) * Math.cos(phi));
        const Tobs = Tstar * f(r) * g, bright = Math.min(1, (g ** 4) * (f(r) / fmax) ** 4 * 1.6 + 0.08);
        const [R, Gc, B] = rgb(Math.max(1000, Math.min(40000, 6500 * Tobs / (Tstar * fmax))));
        d[kk] = R * bright; d[kk + 1] = Gc * bright; d[kk + 2] = B * bright; d[kk + 3] = 255;
      } else d[kk + 3] = shadow ? 255 : 0;
    }
    o.putImageData(img, 0, 0); ctx.clearRect(0, 0, w, h); ctx.drawImage(off, 0, 0, w, h);
    text(ctx, 'approaching side (beamed) →', w * 0.97, h - 10, css('--ink3'), 'right');
    const rs = [], Ts = [];
    for (let r = ri * 1.001; r < rout; r *= 1.02) { rs.push(r); Ts.push(Tstar * f(r)); }
    main.querySelector('#tprof').innerHTML = plotSVG([{ x: rs, y: Ts, label: 'T(r)' }], { xlabel: 'r (GM/c²)', ylabel: 'T (K)', logx: true, h: 200, marks: [{ x: ri, label: 'ISCO' }] });
    const Tpk = Tstar * fmax, lam = 2.898e-3 / Tpk;
    ro.innerHTML = `<div class="kv"><span>r_ISCO = ${fmt(ri, 4)} GM/c² (${fmt(ri * rg / 1e3, 4)} km)</span><span>Radiative efficiency η = ${fmt(eta * 100, 3)} %</span><span>L = ${fmt(v.mdot, 3)} L_Edd = ${fmt(v.mdot * LEdd, 3)} W</span><span>Peak T ≈ ${fmt(Tpk, 3)} K at r ≈ ${fmt(rpk, 3)} → λ_peak ≈ ${lam < 1e-8 ? fmt(lam * 1e9, 3) + ' nm (X-ray)' : fmt(lam * 1e9, 3) + ' nm'}</span></div><p class="small muted">Spin moves the innermost stable orbit inward (6 → 1.24 GM/c²) and raises η from 5.7 % to 32 %. Stellar-mass holes have X-ray-hot disks; supermassive ones peak in the UV. <a href="#/calc/black-hole">Black-hole calculator →</a></p>`;
  });
}

// ── Doppler effect & Mach cone ──────────────────────────────────
function doppler(main) {
  const { fit, ro } = shell(main, 'doppler', `${slider('M', 'Source speed (Mach number)', 0, 2.5, 0.05, 0.6)}${slider('f', 'Emitted frequency (Hz)', 100, 2000, 10, 440)}${slider('c', 'Wave speed (m/s)', 100, 1500, 10, 343)}<p class="small muted">Wavefronts are emitted at regular intervals and expand at the wave speed from where the source was. Above Mach 1 they pile into a shock cone.</p>`, 0.5);
  const v = bindSliders(main, ['M', 'f', 'c']);
  let t = 0, fronts = [], lastE = 0, sx = null, lastM = null;
  return loop(dt => {
    t += dt;
    const { ctx, w, h } = fit(), cpx = 70, vx = v.M * cpx; // px/s
    if (sx === null || v.M !== lastM) { sx = v.M < 0.05 ? w / 2 : w * 0.12; fronts = []; lastM = v.M; }
    sx += vx * dt;
    if (sx > w * 0.92) { sx = w * 0.12; fronts = []; }
    const xs = sx;
    if (t - lastE > 0.25) { fronts.push({ x: xs, t0: t }); lastE = t; }
    fronts = fronts.filter(f => (t - f.t0) * cpx < w * 1.5);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1.2;
    fronts.forEach(f => { const r = (t - f.t0) * cpx; ctx.strokeStyle = css('--c2'); ctx.globalAlpha = Math.max(0.15, 1 - r / w); ctx.beginPath(); ctx.arc(f.x, h / 2, r, 0, 7); ctx.stroke(); });
    ctx.globalAlpha = 1;
    if (v.M > 1) { const mu = Math.asin(1 / v.M), Ln = w; ctx.strokeStyle = css('--bad'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xs - Ln * Math.cos(mu), h / 2 - Ln * Math.sin(mu)); ctx.lineTo(xs, h / 2); ctx.lineTo(xs - Ln * Math.cos(mu), h / 2 + Ln * Math.sin(mu)); ctx.stroke(); }
    ctx.fillStyle = css('--acc'); ctx.beginPath(); ctx.arc(xs, h / 2, 6, 0, 7); ctx.fill();
    const fa = v.M < 1 ? v.f / (1 - v.M) : NaN, fb = v.f / (1 + v.M);
    ro.innerHTML = `<div class="kv"><span>Source speed ${fmt(v.M * v.c, 4)} m/s</span><span>Ahead: f′ = f/(1 − M) = ${v.M < 1 ? fmt(fa, 4) + ' Hz' : '— (sound cannot outrun the source)'}</span><span>Behind: f′ = f/(1 + M) = ${fmt(fb, 4)} Hz</span>${v.M > 1 ? `<span>Mach cone half-angle μ = asin(1/M) = ${fmt(Math.asin(1 / v.M) * 180 / PI, 3)}°</span>` : ''}<span>Wavelength ahead ${v.M < 1 ? fmt(v.c * (1 - v.M) / v.f, 4) + ' m' : '→ 0'}, behind ${fmt(v.c * (1 + v.M) / v.f, 4)} m</span></div><p class="small muted"><a href="#/calc/doppler-sound">Doppler calculator →</a> · <a href="#/calc/rel-doppler">relativistic Doppler →</a></p>`;
  });
}

export const SIMS3 = { rlc, bfield, flow, gears, 'stern-gerlach': sternGerlach, lensing, accretion, doppler };
