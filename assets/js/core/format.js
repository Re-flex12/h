// Number formatting and small DOM helpers shared across pages.

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

export function fmt(x, sig = 4) {
  if (typeof x !== 'number') return String(x ?? '—');
  if (!Number.isFinite(x)) return Number.isNaN(x) ? '—' : (x > 0 ? '∞' : '−∞');
  if (x === 0) return '0';
  const ax = Math.abs(x);
  if (ax >= 1e-3 && ax < 1e7) {
    let s = x.toPrecision(sig);
    if (s.includes('e')) s = Number(s).toString();
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
  }
  const [m, e] = x.toExponential(sig - 1).split('e');
  const mm = m.includes('.') ? m.replace(/0+$/, '').replace(/\.$/, '') : m;
  const ee = String(parseInt(e, 10)).split('').map(c => SUP[c] ?? c).join('');
  return `${mm.replace('-', '−')}×10${ee}`;
}

// Plain-ASCII number for inputs (round-trippable).
export function num(x, sig = 6) {
  if (!Number.isFinite(x)) return '';
  if (x === 0) return '0';
  const ax = Math.abs(x);
  if (ax >= 1e-4 && ax < 1e9) return String(Number(x.toPrecision(sig)));
  return x.toExponential(sig - 1).replace(/\.?0+e/, 'e');
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// KaTeX rendering with a readable fallback if the CDN is unavailable.
export function tex(src, display = false) {
  if (window.katex) {
    try { return window.katex.renderToString(src, { displayMode: display, throwOnError: false, strict: 'ignore' }); } catch (e) { /* fall through */ }
  }
  return `<span class="tex-fallback">${esc(src)}</span>`;
}

// Render all [data-tex] placeholders inside an element (used after KaTeX finishes loading).
export function renderTex(root) {
  root.querySelectorAll('[data-tex]').forEach(el => {
    el.innerHTML = tex(el.dataset.tex, el.dataset.display === '1');
  });
}

export function T(src, display = false) {
  return `<span data-tex="${esc(src)}"${display ? ' data-display="1"' : ''}>${tex(src, display)}</span>`;
}

export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

export function debounce(fn, ms = 120) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
