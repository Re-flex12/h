// Expression parser / evaluator, dimensional analysis and numerical root finding.
// Grammar: expr := term (('+'|'-') term)* ; term := unary (('*'|'/'|implicit) unary)* ;
//          unary := '-' unary | power ; power := atom ('^' unary)? ; atom := num | ident | ident '(' args ')' | '(' expr ')'

const FUNCS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2,
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round,
  min: Math.min, max: Math.max, pow: Math.pow, atan2: Math.atan2, sign: Math.sign,
};
const CONSTS = { pi: Math.PI, 'π': Math.PI, e: Math.E, tau: 2 * Math.PI };

const SUPERS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };

export function normalizeInput(s) {
  // Convert unicode niceties into parseable ASCII-ish text.
  let out = '';
  let inSup = false;
  for (const ch of String(s)) {
    if (SUPERS[ch] !== undefined) { out += (inSup ? '' : '^(') + SUPERS[ch]; inSup = true; continue; }
    if (inSup) { out += ')'; inSup = false; }
    out += ch;
  }
  if (inSup) out += ')';
  return out.replace(/[×·⋅∙]/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/√/g, 'sqrt').replace(/\*\*/g, '^');
}

function tokenize(src) {
  const s = normalizeInput(src);
  const toks = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const numM = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(s.slice(i));
    if (numM) { toks.push({ t: 'num', v: parseFloat(numM[0]) }); i += numM[0].length; continue; }
    const idM = /^[A-Za-z_Ͱ-Ͽᴀ-ᶿ][A-Za-z0-9_Ͱ-Ͽ']*/u.exec(s.slice(i));
    if (idM) { toks.push({ t: 'id', v: idM[0] }); i += idM[0].length; continue; }
    if ('+-*/^(),='.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
    throw new Error(`Unexpected character “${c}”`);
  }
  return toks;
}

export function parse(src) {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v) => toks[p] && toks[p].t === 'op' && toks[p].v === v;
  const eat = (v) => { if (!isOp(v)) throw new Error(`Expected “${v}”`); p++; };

  function expr() {
    let a = term();
    while (isOp('+') || isOp('-')) { const op = toks[p++].v; a = { t: 'bin', op, a, b: term() }; }
    return a;
  }
  function startsAtom() {
    const k = peek();
    return k && (k.t === 'num' || k.t === 'id' || (k.t === 'op' && k.v === '('));
  }
  function term() {
    let a = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) { const op = toks[p++].v; a = { t: 'bin', op, a, b: unary() }; }
      else if (startsAtom()) { a = { t: 'bin', op: '*', a, b: power() }; } // implicit multiplication
      else break;
    }
    return a;
  }
  function unary() {
    if (isOp('-')) { p++; return { t: 'neg', a: unary() }; }
    if (isOp('+')) { p++; return unary(); }
    return power();
  }
  function power() {
    const a = atom();
    if (isOp('^')) { p++; return { t: 'bin', op: '^', a, b: unary() }; }
    return a;
  }
  function atom() {
    const k = toks[p++];
    if (!k) throw new Error('Unexpected end of expression');
    if (k.t === 'num') return { t: 'num', v: k.v };
    if (k.t === 'id') {
      if (isOp('(') && FUNCS[k.v]) {
        p++;
        const args = [];
        if (!isOp(')')) { args.push(expr()); while (isOp(',')) { p++; args.push(expr()); } }
        eat(')');
        return { t: 'call', f: k.v, args };
      }
      return { t: 'var', n: k.v };
    }
    if (k.t === 'op' && k.v === '(') { const e = expr(); eat(')'); return e; }
    throw new Error(`Unexpected “${k.v}”`);
  }

  const root = expr();
  if (isOp('=')) {
    p++;
    const rhs = expr();
    if (p < toks.length) throw new Error('Unexpected trailing input');
    return { t: 'eq', a: root, b: rhs };
  }
  if (p < toks.length) throw new Error(`Unexpected “${toks[p].v}”`);
  return root;
}

export function evaluate(node, vars = {}) {
  switch (node.t) {
    case 'num': return node.v;
    case 'var':
      if (node.n in vars) return vars[node.n];
      if (node.n in CONSTS) return CONSTS[node.n];
      throw new Error(`Unknown variable “${node.n}”`);
    case 'neg': return -evaluate(node.a, vars);
    case 'call': return FUNCS[node.f](...node.args.map(a => evaluate(a, vars)));
    case 'eq': return evaluate(node.a, vars) - evaluate(node.b, vars);
    case 'bin': {
      const a = evaluate(node.a, vars), b = evaluate(node.b, vars);
      switch (node.op) { case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return a / b; case '^': return Math.pow(a, b); }
    }
  }
  throw new Error('Bad expression');
}

export function variables(node, out = new Set()) {
  if (!node) return out;
  if (node.t === 'var' && !(node.n in CONSTS)) out.add(node.n);
  ['a', 'b'].forEach(k => node[k] && variables(node[k], out));
  (node.args || []).forEach(a => variables(a, out));
  return out;
}

export function compile(src) {
  const ast = parse(src);
  return { ast, vars: [...variables(ast)], f: (v) => evaluate(ast, v) };
}

// ── Dimensional analysis ──────────────────────────────────
// Base: [M, L, T, I, Θ, N, J]
export const BASE = ['M', 'L', 'T', 'I', 'Θ', 'N', 'J'];
export const DIMVEC = {
  none: [0, 0, 0, 0, 0, 0, 0], length: [0, 1, 0, 0, 0, 0, 0], mass: [1, 0, 0, 0, 0, 0, 0], time: [0, 0, 1, 0, 0, 0, 0],
  current: [0, 0, 0, 1, 0, 0, 0], temperature: [0, 0, 0, 0, 1, 0, 0], amount: [0, 0, 0, 0, 0, 1, 0],
  area: [0, 2, 0, 0, 0, 0, 0], volume: [0, 3, 0, 0, 0, 0, 0], velocity: [0, 1, -1, 0, 0, 0, 0], accel: [0, 1, -2, 0, 0, 0, 0],
  force: [1, 1, -2, 0, 0, 0, 0], pressure: [1, -1, -2, 0, 0, 0, 0], energy: [1, 2, -2, 0, 0, 0, 0], power: [1, 2, -3, 0, 0, 0, 0],
  torque: [1, 2, -2, 0, 0, 0, 0], density: [1, -3, 0, 0, 0, 0, 0], frequency: [0, 0, -1, 0, 0, 0, 0], angvel: [0, 0, -1, 0, 0, 0, 0],
  momentum: [1, 1, -1, 0, 0, 0, 0], charge: [0, 0, 1, 1, 0, 0, 0], voltage: [1, 2, -3, -1, 0, 0, 0], resistance: [1, 2, -3, -2, 0, 0, 0],
  capacitance: [-1, -2, 4, 2, 0, 0, 0], inductance: [1, 2, -2, -2, 0, 0, 0], bfield: [1, 0, -2, -1, 0, 0, 0], dynvisc: [1, -1, -1, 0, 0, 0, 0],
  kinvisc: [0, 2, -1, 0, 0, 0, 0], flow: [0, 3, -1, 0, 0, 0, 0], massflow: [1, 0, -1, 0, 0, 0, 0], specheat: [0, 2, -2, 0, -1, 0, 0],
  thermcond: [1, 1, -3, 0, -1, 0, 0], htc: [1, 0, -3, 0, -1, 0, 0], areamoment: [0, 4, 0, 0, 0, 0, 0], inertia: [1, 2, 0, 0, 0, 0, 0],
  stiffness: [1, 0, -2, 0, 0, 0, 0], efield: [1, 1, -3, -1, 0, 0, 0], entropy: [1, 2, -2, 0, -1, 0, 0], molarmass: [1, 0, 0, 0, 0, -1, 0],
  specenergy: [0, 2, -2, 0, 0, 0, 0], heatflux: [1, 0, -3, 0, 0, 0, 0], angle: [0, 0, 0, 0, 0, 0, 0],
};

export function dimString(v) {
  if (!v) return '?';
  const parts = v.map((e, i) => e ? (e === 1 ? BASE[i] : `${BASE[i]}^${Number(e.toFixed(3))}`) : '').filter(Boolean);
  return parts.length ? parts.join('·') : '1 (dimensionless)';
}
export function dimName(v) {
  for (const [k, d] of Object.entries(DIMVEC)) if (d.every((x, i) => Math.abs(x - v[i]) < 1e-9) && k !== 'angle' && k !== 'torque' && k !== 'angvel') return k;
  return null;
}
const eqv = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-9);

export function dimOf(node, symbols) {
  switch (node.t) {
    case 'num': return DIMVEC.none;
    case 'var':
      if (node.n in symbols) return symbols[node.n];
      if (node.n in CONSTS) return DIMVEC.none;
      throw new Error(`Unknown symbol “${node.n}”. Add it to the symbol table (e.g. ${node.n} = length) or separate symbols with *.`);
    case 'neg': return dimOf(node.a, symbols);
    case 'call': {
      const ds = node.args.map(a => dimOf(a, symbols));
      if (node.f === 'sqrt') return ds[0].map(x => x / 2);
      if (node.f === 'cbrt') return ds[0].map(x => x / 3);
      if (node.f === 'abs' || node.f === 'min' || node.f === 'max') {
        if (ds.some(d => !eqv(d, ds[0]))) throw new Error(`${node.f}() arguments have different dimensions`);
        return ds[0];
      }
      if (ds.some(d => !eqv(d, DIMVEC.none))) throw new Error(`${node.f}() needs a dimensionless argument, got ${dimString(ds[0])}`);
      return DIMVEC.none;
    }
    case 'bin': {
      const a = dimOf(node.a, symbols);
      if (node.op === '^') {
        const b = dimOf(node.b, symbols);
        if (!eqv(b, DIMVEC.none)) throw new Error('Exponent must be dimensionless');
        let n;
        try { n = evaluate(node.b, {}); } catch (e) { if (eqv(a, DIMVEC.none)) return DIMVEC.none; throw new Error('Exponent of a dimensional quantity must be a number'); }
        return a.map(x => x * n);
      }
      const b = dimOf(node.b, symbols);
      if (node.op === '*') return a.map((x, i) => x + b[i]);
      if (node.op === '/') return a.map((x, i) => x - b[i]);
      if (!eqv(a, b)) throw new Error(`Cannot add/subtract ${dimString(a)} and ${dimString(b)}`);
      return a;
    }
    case 'eq': {
      const a = dimOf(node.a, symbols), b = dimOf(node.b, symbols);
      return { lhs: a, rhs: b, ok: eqv(a, b) };
    }
  }
  throw new Error('Bad expression');
}

// ── Root finding ─────────────────────────────────────────
// Solve g(x) = 0 near x0. Newton with numerical derivative, then bracketing + bisection fallback.
export function solveRoot(g, x0 = 1, opts = {}) {
  const tol = opts.tol ?? 1e-12;
  const ok = (x) => Number.isFinite(x) && Number.isFinite(g(x));
  let x = Number.isFinite(x0) && x0 !== 0 ? x0 : 1;
  for (let i = 0; i < 60; i++) {
    const fx = g(x);
    if (!Number.isFinite(fx)) break;
    if (Math.abs(fx) < 1e-300) return x;
    const dx = Math.abs(x) * 1e-7 || 1e-7;
    const d = (g(x + dx) - g(x - dx)) / (2 * dx);
    if (!Number.isFinite(d) || d === 0) break;
    let step = fx / d;
    let xn = x - step;
    let tries = 0;
    while (!ok(xn) && tries++ < 20) { step /= 2; xn = x - step; }
    if (!ok(xn)) break;
    if (Math.abs(xn - x) <= tol * Math.max(1, Math.abs(xn))) {
      if (Math.abs(g(xn)) <= 1e-9 * Math.max(1, Math.abs(g(x0) || 1))) return xn;
      return xn;
    }
    x = xn;
  }
  // Bracket scan over log-spaced magnitudes, both signs.
  // Also scan linear multiples of the start value, which finds roots near a domain edge (e.g. v → c).
  const pts = [];
  for (let e = -30; e <= 30; e += 0.25) { const m = Math.pow(10, e); pts.push(m, -m); }
  if (Number.isFinite(x0) && x0 !== 0) for (let k = -300; k <= 300; k++) pts.push(x0 * k / 100);
  const cands = [...new Set(pts)].sort((a, b) => a - b);
  let best = null;
  for (let i = 0; i < cands.length - 1; i++) {
    const a = cands[i], b = cands[i + 1];
    const fa = g(a), fb = g(b);
    if (!Number.isFinite(fa) || !Number.isFinite(fb)) continue;
    if (fa === 0) return a;
    if (fa * fb < 0) {
      let lo = a, hi = b, flo = fa;
      for (let k = 0; k < 200; k++) {
        const mid = (lo + hi) / 2, fm = g(mid);
        if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; }
        if (Math.abs(hi - lo) <= 1e-14 * Math.abs(mid)) break;
      }
      const r = (lo + hi) / 2;
      // Prefer roots with the same sign as the starting value, then the closest in magnitude.
      const score = z => Math.abs(Math.log(Math.abs(z) + 1e-300) - Math.log(Math.abs(x0) + 1e-300)) + (Math.sign(z) !== Math.sign(x0) ? 1e3 : 0);
      if (best === null || score(r) < score(best)) best = r;
    }
  }
  if (best !== null) return best;
  return NaN;
}

// Numerical partial derivative of f(vars) w.r.t. k.
export function partial(f, vars, k) {
  const x = vars[k];
  const hh = Math.abs(x) * 1e-6 || 1e-9;
  const up = { ...vars, [k]: x + hh }, dn = { ...vars, [k]: x - hh };
  return (f(up) - f(dn)) / (2 * hh);
}
