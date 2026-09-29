// Practice: question bank, auto-generated formula drills, timed quiz and equation flashcards.
import { LESSONS } from '../data/lessons.js';
import { EQUATIONS, EQ } from '../data/equations.js';
import { compile, solveRoot } from '../core/expr.js';
import { DIMS, fromSI, defaultUnit, toSI } from '../core/units.js';
import { fmt, esc, T, renderTex } from '../core/format.js';
import { settings } from '../core/store.js';
import { crumbs, pageHead, richText, LEVEL_NAME } from './common.js';

const PKEY = 'physeng.progress', FKEY = 'physeng.flash';
const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };

export const BANK = LESSONS.flatMap(l => l.questions.map((q, i) => ({ ...q, id: `${l.id}:${i}`, lesson: l, section: l.section, level: l.levels[0], topic: l.topic })));

// Random numeric drill from a library equation: all variables but one given, answer by the solver.
export function drill(rng = Math.random, topic = null) {
  const pool = EQUATIONS.filter(e => e.f && e.v.length >= 2 && (!topic || e.topic === topic) && !['quadratic', 'log', 'interval', 'energy-momentum'].includes(e.id));
  for (let tries = 0; tries < 40; tries++) {
    const e = pool[Math.floor(rng() * pool.length)], c = compile(e.f);
    const unk = e.v[Math.floor(rng() * e.v.length)];
    const vals = {};
    e.v.forEach(([k, , dim, , def]) => { if (k === unk[0]) return; const nice = x => Number(x.toPrecision(2)); const f = 0.5 + rng(); vals[k] = dim === 'angle' || /^n\d?$|^N/.test(k) ? def : nice(def * f); });
    const ans = solveRoot(x => c.f({ ...vals, [unk[0]]: x }), unk[4]);
    if (!Number.isFinite(ans) || ans === 0 || Math.abs(c.f({ ...vals, [unk[0]]: ans })) > 1e-6 * Math.max(1, Math.abs(ans))) continue;
    if (unk[4] > 0 && ans < 0) continue;
    const disp = (k, v) => { const [, label, dim] = e.v.find(x => x[0] === k); const u = dim === 'none' ? '' : defaultUnit(dim, settings.units === 'imperial' ? 'si' : settings.units); return { label, u, val: dim === 'none' ? v : fromSI(v, dim, u) }; };
    const au = disp(unk[0], ans);
    return {
      id: `drill:${e.id}:${unk[0]}`, eq: e, q: `Using ${'$'}${e.tex}${'$'}, find the ${au.label.toLowerCase()} when ${Object.entries(vals).map(([k, v]) => { const d = disp(k, v); return `${d.label.toLowerCase()} = ${fmt(d.val, 3)} ${d.u}`; }).join(', ')}.`,
      ans: au.val, unit: au.u, tol: 0.02, sol: `Rearrange ${'$'}${e.tex}${'$'} for the unknown (or use the <a href="#/reference/equations/${e.id}">equation solver</a>): answer = ${fmt(au.val, 4)} ${au.u}.`, topic: e.topic, drill: true,
    };
  }
  return null;
}

function qCard(q, idx, onCorrect) {
  return `<div class="q" data-qid="${esc(q.id)}"><div class="qn">${q.drill ? 'Formula drill' : `${esc(q.topic)} · ${LEVEL_NAME[q.level] || ''}`} · Q${idx + 1}</div><p>${richText(q.q)}</p><div class="in" style="max-width:360px"><input inputmode="decimal" placeholder="Your answer"><span class="unit-fixed">${esc(q.unit || '—')}</span></div><div class="btns mt"><button class="btn sm" data-a="check">Check</button>${q.hint ? '<button class="btn ghost sm" data-a="hint">Hint</button>' : ''}</div><div class="res"></div><details><summary>Full solution</summary><p>${richText(q.sol)}</p></details></div>`;
}
function bindCards(root, list, onResult = () => {}) {
  root.querySelectorAll('.q').forEach((el, i) => {
    const q = list[i], res = el.querySelector('.res');
    el.querySelector('[data-a="check"]').onclick = () => {
      const v = Number(el.querySelector('input').value.replace(',', '.'));
      if (!Number.isFinite(v)) { res.innerHTML = '<span class="no">Enter a number.</span>'; return; }
      const ok = Math.abs(v - q.ans) <= (q.tol ?? 0.02) * Math.abs(q.ans || 1);
      res.innerHTML = ok ? '<span class="ok">✓ Correct</span>' : `<span class="no">✗ Not quite</span> (±${((q.tol ?? 0.02) * 100).toFixed(0)} % accepted)`;
      if (ok && !q.drill) { const p = rd(PKEY, {}); p[q.id] = Date.now(); wr(PKEY, p); }
      onResult(q, ok);
    };
    el.querySelector('[data-a="hint"]')?.addEventListener('click', () => { res.innerHTML = `<span class="muted">Hint: ${esc(q.hint)}</span>`; });
  });
  renderTex(root);
}

export function page(main, _, query) {
  const tab = query.get('t') || 'bank';
  const prog = rd(PKEY, {});
  main.innerHTML = `${crumbs([['Learn', '#/learn'], ['Practice']])}${pageHead('01 / LEARN / PRACTICE', 'Practice', `Question bank (${BANK.length} worked questions, ${Object.keys(prog).length} answered correctly), unlimited formula drills generated from the equation library, timed quizzes and equation flashcards.`)}
    <div class="tabs" style="margin-top:0">${[['bank', 'Question bank'], ['drill', 'Formula drills'], ['quiz', 'Timed quiz'], ['flash', 'Flashcards'], ['progress', 'Progress']].map(([k, n]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div><div id="pp" class="mt"></div>`;
  const pane = main.querySelector('#pp');
  let quizTimer = null;
  const V = {
    bank() {
      const secs = [['all', 'All'], ['physics', 'Physics'], ['engineering', 'Engineering'], ['quantum', 'Quantum & Relativity']];
      pane.innerHTML = `<div class="toolbar"><div class="chips" id="sec">${secs.map(([k, n], i) => `<button class="chip${i ? '' : ' on'}" data-s="${k}">${n}</button>`).join('')}</div><div class="chips" id="lv">${['all', 'school', 'uni', 'pro'].map((k, i) => `<button class="chip${i ? '' : ' on'}" data-l="${k}">${k === 'all' ? 'All levels' : LEVEL_NAME[k]}</button>`).join('')}</div><label class="chip"><input type="checkbox" id="un"> unanswered only</label></div><div id="ql"></div>`;
      const st = { s: 'all', l: 'all' };
      const draw = () => {
        const p = rd(PKEY, {}), un = pane.querySelector('#un').checked;
        const list = BANK.filter(q => (st.s === 'all' || q.section === st.s) && (st.l === 'all' || q.lesson.levels.includes(st.l)) && (!un || !p[q.id]));
        pane.querySelector('#ql').innerHTML = list.map((q, i) => qCard(q, i)).join('') || '<div class="empty">No questions match.</div>';
        bindCards(pane.querySelector('#ql'), list);
      };
      pane.querySelectorAll('#sec .chip').forEach(b => b.onclick = () => { st.s = b.dataset.s; pane.querySelectorAll('#sec .chip').forEach(x => x.classList.toggle('on', x === b)); draw(); });
      pane.querySelectorAll('#lv .chip').forEach(b => b.onclick = () => { st.l = b.dataset.l; pane.querySelectorAll('#lv .chip').forEach(x => x.classList.toggle('on', x === b)); draw(); });
      pane.querySelector('#un').onchange = draw;
      draw();
    },
    drill() {
      const topics = [...new Set(EQUATIONS.filter(e => e.f).map(e => e.topic))];
      pane.innerHTML = `<div class="toolbar"><select class="plain" id="tp" style="max-width:260px"><option value="">All topics</option>${topics.map(t => `<option>${t}</option>`).join('')}</select><button class="btn sm" id="nx">New question</button><span class="mono small muted" id="sc"></span></div><div id="dq"></div>`;
      let right = 0, total = 0;
      const next = () => { const q = drill(Math.random, pane.querySelector('#tp').value || null); if (!q) return; pane.querySelector('#dq').innerHTML = qCard(q, total); bindCards(pane.querySelector('#dq'), [q], (_, ok) => { total++; if (ok) right++; pane.querySelector('#sc').textContent = `${right}/${total} correct this session`; }); };
      pane.querySelector('#nx').onclick = next; pane.querySelector('#tp').onchange = next;
      next();
    },
    quiz() {
      pane.innerHTML = `<div class="panel tick"><div class="toolbar" style="margin:0"><label class="ctl" style="flex-direction:row;gap:8px;align-items:center">Questions <select class="plain" id="nq" style="width:70px"><option>5</option><option selected>10</option><option>15</option></select></label><label class="ctl" style="flex-direction:row;gap:8px;align-items:center">Minutes <select class="plain" id="mins" style="width:70px"><option>5</option><option selected>10</option><option>20</option></select></label><label class="chip"><input type="checkbox" id="mix" checked> include formula drills</label><button class="btn" id="start">Start quiz</button><span class="grow"></span><span class="mono" id="clock" style="font-size:22px"></span></div></div><div id="qz" class="mt"></div>`;
      pane.querySelector('#start').onclick = () => {
        const n = +pane.querySelector('#nq').value, mix = pane.querySelector('#mix').checked;
        const pool = [...BANK].sort(() => Math.random() - 0.5);
        const qs = [];
        for (let i = 0; i < n; i++) { const d = mix && (i % 2 === 1 || i >= pool.length) ? drill() : null; qs.push(d || pool[i % pool.length]); }
        const ans = new Array(n).fill(null);
        pane.querySelector('#qz').innerHTML = `${qs.map((q, i) => qCard(q, i)).join('')}<button class="btn" id="finish">Finish & mark</button><div id="score" class="mt"></div>`;
        pane.querySelectorAll('#qz details, #qz [data-a]').forEach(el => { el.hidden = true; });
        renderTex(pane);
        let left = +pane.querySelector('#mins').value * 60;
        const finish = () => {
          clearInterval(quizTimer); quizTimer = null;
          let score = 0;
          pane.querySelectorAll('#qz .q').forEach((el, i) => {
            const q = qs[i], v = Number(el.querySelector('input').value.replace(',', '.')), ok = Number.isFinite(v) && Math.abs(v - q.ans) <= (q.tol ?? 0.02) * Math.abs(q.ans || 1);
            if (ok) { score++; if (!q.drill) { const p = rd(PKEY, {}); p[q.id] = Date.now(); wr(PKEY, p); } }
            el.querySelector('.res').innerHTML = ok ? '<span class="ok">✓ Correct</span>' : `<span class="no">✗</span> Answer: ${fmt(q.ans, 4)} ${esc(q.unit || '')}`;
            el.querySelector('details').hidden = false; el.querySelector('input').readOnly = true;
          });
          pane.querySelector('#finish').hidden = true;
          pane.querySelector('#score').innerHTML = `<div class="readout primary"><div class="rl">Score</div><div class="rv">${score} / ${n}<span class="u">${Math.round(score / n * 100)} %</span></div></div>`;
          const hist = rd('physeng.quizzes', []); hist.unshift({ at: new Date().toISOString(), score, n }); wr('physeng.quizzes', hist.slice(0, 50));
        };
        pane.querySelector('#finish').onclick = finish;
        clearInterval(quizTimer);
        const tick = () => { left--; const c = pane.querySelector('#clock'); if (!c) { clearInterval(quizTimer); return; } c.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; c.style.color = left < 60 ? 'var(--bad)' : ''; if (left <= 0) finish(); };
        tick(); quizTimer = setInterval(tick, 1000);
      };
    },
    flash() {
      const cards = EQUATIONS;
      const box = rd(FKEY, {});
      pane.innerHTML = `<div class="toolbar"><select class="plain" id="tp" style="max-width:260px"><option value="">All topics</option>${[...new Set(cards.map(c => c.topic))].map(t => `<option>${t}</option>`).join('')}</select><span class="mono small muted" id="stat"></span></div><div class="panel tick" id="card" style="min-height:260px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;cursor:pointer"></div><div class="btns mt" style="justify-content:center"><button class="btn ghost" id="again">Again</button><button class="btn" id="good">Got it</button></div><p class="small muted mt" style="text-align:center">Leitner boxes: “Got it” moves a card up a box (seen less often), “Again” sends it back to box 1. Click the card to flip.</p>`;
      let cur = null, flipped = false;
      const pick = () => {
        const t = pane.querySelector('#tp').value, pool = cards.filter(c => !t || c.topic === t);
        const w = pool.map(c => 1 / Math.pow(2, (box[c.id] || 0)));
        let r = Math.random() * w.reduce((a, b) => a + b, 0);
        cur = pool.find((c, i) => (r -= w[i]) <= 0) || pool[0]; flipped = false; show();
        const mastered = pool.filter(c => (box[c.id] || 0) >= 3).length;
        pane.querySelector('#stat').textContent = `${mastered}/${pool.length} mastered (box ≥ 3)`;
      };
      const show = () => { pane.querySelector('#card').innerHTML = flipped ? `<div style="font-size:1.5em">${T(cur.tex, true)}</div>${cur.v.length ? `<p class="small muted mt">${cur.v.map(v => `${T(v[3])} ${esc(v[1])}`).join(' · ')}</p>` : ''}<a class="small mt" href="#/reference/equations/${cur.id}">open in library →</a>` : `<span class="mono small muted">${esc(cur.topic.toUpperCase())} · BOX ${(box[cur.id] || 0) + 1}</span><h2 style="margin-top:10px">${esc(cur.name)}</h2><p class="muted">Recall the equation, then click to flip.</p>`; };
      pane.querySelector('#card').onclick = e => { if (e.target.closest('a')) return; flipped = !flipped; show(); };
      pane.querySelector('#good').onclick = () => { box[cur.id] = Math.min(5, (box[cur.id] || 0) + 1); wr(FKEY, box); pick(); };
      pane.querySelector('#again').onclick = () => { box[cur.id] = 0; wr(FKEY, box); pick(); };
      pane.querySelector('#tp').onchange = pick;
      pick();
    },
    progress() {
      const p = rd(PKEY, {}), quizzes = rd('physeng.quizzes', []), fl = rd(FKEY, {});
      pane.innerHTML = `<div class="grid g3"><div class="readout primary"><div class="rl">Questions answered correctly</div><div class="rv">${Object.keys(p).length} / ${BANK.length}</div></div><div class="readout"><div class="rl">Quizzes taken</div><div class="rv">${quizzes.length}</div></div><div class="readout"><div class="rl">Equations mastered</div><div class="rv">${Object.values(fl).filter(v => v >= 3).length}</div></div></div>
        <div class="sec-head"><h2>By lesson</h2></div>${LESSONS.map(l => { const d = l.questions.filter((_, i) => p[`${l.id}:${i}`]).length; return `<div class="bar-row"><a class="bl" href="#/learn/${l.id}">${esc(l.title)}</a><div class="bar-track"><div class="bar" style="width:${d / l.questions.length * 100}%"></div></div><span class="bv">${d}/${l.questions.length}</span></div>`; }).join('')}
        ${quizzes.length ? `<div class="sec-head"><h2>Recent quizzes</h2></div><table class="tbl">${quizzes.slice(0, 10).map(q => `<tr><td>${new Date(q.at).toLocaleString()}</td><td class="num">${q.score}/${q.n}</td></tr>`).join('')}</table>` : ''}`;
    },
  };
  main.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { clearInterval(quizTimer); main.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); V[b.dataset.t](); });
  V[tab]();
  return () => clearInterval(quizTimer);
}
