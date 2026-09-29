import { LESSONS, LESSON } from '../data/lessons.js';
import { CALC } from '../calcs/index.js';
import { EQ } from '../data/equations.js';
import { esc, T, renderTex } from '../core/format.js';
import { settings } from '../core/store.js';
import { crumbs, pageHead, calcTile, linkTile, richText, SIMS, SOLVERS, LEVEL_NAME, levelBadge, toolHref } from './common.js';

const PKEY = 'physeng.progress';
const getProg = () => { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; } };
const setProg = p => { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) { /* ignore */ } };

const FIGS = {
  vt: `<svg viewBox="0 0 420 220" class="plot" style="max-width:520px"><line class="ax" x1="50" y1="190" x2="400" y2="190"/><line class="ax" x1="50" y1="190" x2="50" y2="15"/><path d="M50 150L350 50L350 190L50 190Z" fill="var(--acc)" fill-opacity=".15"/><path d="M50 150L350 50" stroke="var(--acc)" stroke-width="3" fill="none"/><line x1="50" y1="150" x2="350" y2="150" stroke="var(--line2)" stroke-dasharray="4 4"/><text x="20" y="154">u</text><text x="20" y="54">v</text><text x="345" y="208">t</text><text x="380" y="208">time</text><text x="8" y="22">velocity</text><text x="170" y="130" style="fill:var(--ink)">area = s</text><text x="250" y="95" style="fill:var(--acc)">gradient = a</text></svg>`,
  beam: `<svg viewBox="0 0 440 170" class="plot" style="max-width:540px"><line x1="40" y1="80" x2="400" y2="80" stroke="var(--ink)" stroke-width="6"/><path d="M40 83l-12 20h24z" fill="none" stroke="var(--acc)" stroke-width="2.5"/><path d="M400 83l-12 20h24z" fill="none" stroke="var(--acc)" stroke-width="2.5"/><circle cx="394" cy="108" r="3.5" fill="none" stroke="var(--acc)" stroke-width="2"/><circle cx="406" cy="108" r="3.5" fill="none" stroke="var(--acc)" stroke-width="2"/><path d="M130 20v52m-6-9 6 9 6-9" stroke="var(--c3)" stroke-width="3" fill="none"/><text x="138" y="30" style="fill:var(--c3)">F = 10 kN</text><path d="M40 150v-30m-5 8 5-8 5 8" stroke="var(--acc)" stroke-width="2" fill="none"/><path d="M400 150v-30m-5 8 5-8 5 8" stroke="var(--acc)" stroke-width="2" fill="none"/><text x="18" y="165" style="fill:var(--acc)">R_A</text><text x="380" y="165" style="fill:var(--acc)">R_B</text><text x="36" y="72">A</text><text x="398" y="72">B</text><line x1="40" y1="125" x2="130" y2="125" stroke="var(--line2)"/><text x="72" y="140">1 m</text><line x1="40" y1="45" x2="400" y2="45" stroke="var(--line2)" stroke-dasharray="3 4"/><text x="250" y="40">L = 4 m</text></svg>`,
  ss: `<svg viewBox="0 0 440 230" class="plot" style="max-width:540px"><line class="ax" x1="50" y1="200" x2="420" y2="200"/><line class="ax" x1="50" y1="200" x2="50" y2="15"/><path d="M50 200L110 80Q125 70 150 68Q260 40 330 45Q370 50 395 95" stroke="var(--acc)" stroke-width="3" fill="none"/><line x1="62" y1="200" x2="122" y2="80" stroke="var(--c2)" stroke-dasharray="4 4"/><circle cx="118" cy="76" r="4" fill="var(--c2)"/><text x="126" y="98" style="fill:var(--c2)">yield (0.2 % offset)</text><circle cx="300" cy="42" r="4" fill="var(--c4)"/><text x="252" y="30" style="fill:var(--c4)">UTS</text><circle cx="395" cy="95" r="4" fill="var(--c3)"/><text x="360" y="118" style="fill:var(--c3)">fracture</text><text x="62" y="140" style="fill:var(--ink)">E = slope</text><text x="370" y="218">strain ε</text><text x="6" y="22">stress σ</text></svg>`,
};

export function index(main) {
  const prog = getProg();
  const groups = [['physics', 'Physics'], ['engineering', 'Engineering'], ['quantum', 'Quantum & Relativity'], ['maths', 'Mathematics']];
  const nQ = LESSONS.reduce((s, l) => s + l.questions.length, 0);
  main.innerHTML = `${crumbs([['Learn']])}${pageHead('01 / LEARN', 'Learn', `Every lesson runs <b>Theory → Diagram → Equations → Worked example → Simulation → Questions → Apply</b>. Content adapts to your level (<b>${LEVEL_NAME[settings.level]}</b>); deeper material is one click away. ${LESSONS.length} lessons · ${nQ} marked questions.`)}
    ${groups.map(([k, n]) => `<div class="sec-head"><h2${k === 'quantum' ? ' style="color:var(--qr)"' : ''}>${n}</h2></div><div class="grid auto">${LESSONS.filter(l => l.section === k).map(l => {
      const done = l.questions.filter((_, i) => prog[`${l.id}:${i}`]).length;
      return `<a class="tile${k === 'quantum' ? ' qr' : ''}" href="#/learn/${l.id}"><span class="k"><span>${esc(l.topic)}</span><span>${l.levels.map(levelBadge).join(' ')}</span></span><span class="t">${esc(l.title)}</span><span class="d">${esc(l.intro)}</span><span class="go">${done}/${l.questions.length} questions · Learn →</span></a>`;
    }).join('')}</div>`).join('')}
    <div class="sec-head"><h2>Practice</h2></div><div class="grid g4">${[['bank', 'Question bank', 'Every lesson question with hints and worked solutions.'], ['drill', 'Formula drills', 'Unlimited numeric questions generated from the equation library.'], ['quiz', 'Timed quiz', 'Mixed questions against the clock, marked instantly.'], ['flash', 'Flashcards', 'Spaced-repetition equation cards.']].map(([t, n, d]) => linkTile(`#/learn/practice?t=${t}`, 'Practice', n, d, 'Start →')).join('')}</div>
    <div class="msg info mt2">Levels map to curricula: <b>School</b> (GCSE/IGCSE, A-Level/IAL, IB), <b>University</b> (Year 1–2+), <b>Professional</b> (design practice). Exam-board-specific question sets are on the roadmap.</div>`;
}

export function lesson(main, [id]) {
  const l = LESSON[id];
  if (!l) { main.innerHTML = 'Unknown lesson'; return; }
  const lv = settings.level;
  const prog = getProg();
  const block = b => {
    if (b.h) return `<h3>${esc(b.h)}</h3>`;
    if (b.eq) return `<div class="eqblock">${T(b.eq, true)}</div>`;
    if (b.fig) return `<figure style="margin:12px 0">${FIGS[b.fig] || ''}</figure>`;
    if (b.d) {
      const body = `<span class="dl">${LEVEL_NAME[b.d]}</span>${richText(b.p)}`;
      return b.d === lv ? `<div class="depth ${b.d}">${body}</div>` : `<details class="depth ${b.d}"><summary class="dl" style="cursor:pointer">${b.d === 'school' ? 'Recap' : 'Go deeper'}: ${LEVEL_NAME[b.d]}</summary><div style="margin-top:6px">${richText(b.p)}</div></details>`;
    }
    return `<p>${richText(b.p)}</p>`;
  };
  main.innerHTML = `${crumbs([['Learn', '#/learn'], [l.topic], [l.title]])}
    <header class="page-head${l.section === 'quantum' ? ' qr' : ''}"><span class="code">LEARN / ${esc(l.topic.toUpperCase())}</span><h1>${esc(l.title)}</h1><p class="lede">${esc(l.intro)}</p><div class="chips mt">${l.levels.map(levelBadge).join('')}</div></header>
    <div class="lesson">
      <article class="prose">
        <span class="stage">01 · Learn it</span>${l.body.map(block).join('')}
        <span class="stage">Worked example</span><div class="panel tick"><p><b>${richText(l.example.q)}</b></p><ol>${l.example.steps.map(s => `<li>${richText(s)}</li>`).join('')}</ol><p><b>Answer:</b> ${richText(l.example.a)}</p></div>
        <span class="stage">02 · Calculate it</span><div class="grid auto">${(l.calcs || []).map(c => calcTile(CALC[c])).join('')}</div>
        ${(l.sims?.length || l.solvers?.length) ? `<span class="stage">03 · Simulate it</span><div class="grid auto">${(l.sims || []).map(s => linkTile(`#/sims/${s}`, 'Simulation', SIMS[s].title, SIMS[s].d, 'Run →')).join('')}${(l.solvers || []).map(s => linkTile(`#/solvers/${s}`, 'Solver', SOLVERS[s].title, SOLVERS[s].d, 'Solve →')).join('')}</div>` : ''}
        <span class="stage">04 · Questions</span><div id="qs">${l.questions.map((q, i) => `<div class="q" data-i="${i}"><div class="qn">Q${i + 1}${prog[`${id}:${i}`] ? ' · <span class="ok">✓ answered</span>' : ''}</div><p>${richText(q.q)}</p><div class="in" style="max-width:360px"><input inputmode="decimal" placeholder="Your answer"><span class="unit-fixed">${esc(q.unit || '—')}</span></div><div class="btns mt"><button class="btn sm" data-a="check">Check</button>${q.hint ? '<button class="btn ghost sm" data-a="hint">Hint</button>' : ''}</div><div class="res"></div><details><summary>Full solution</summary><p>${richText(q.sol)}</p></details></div>`).join('')}</div>
        <span class="stage">05 · Apply it</span><p>Take it to professional depth: every calculator above exports a calculation sheet with assumptions and sources, and can be saved to a project in your <a href="#/workspace">workspace</a>.${l.tools ? ` Reference: ${l.tools.map(t => `<a href="${toolHref(t)}">${esc(t)}</a>`).join(' · ')}.` : ''}</p>
      </article>
      <aside class="side-sticky">
        <div class="panel"><h4>Key equations</h4>${(l.eqs || []).map(e => `<a href="#/reference/equations/${e}" style="display:block;text-decoration:none;padding:6px 0;border-bottom:1px solid var(--line)">${T(EQ[e].tex)}<div class="small muted">${esc(EQ[e].name)}</div></a>`).join('')}</div>
        <div class="panel"><h4>Your level</h4><p class="small muted mt">Showing <b>${LEVEL_NAME[lv]}</b> depth. Change level in the header to reorganise this page.</p></div>
      </aside>
    </div>`;
  main.querySelectorAll('.q').forEach(el => {
    const i = +el.dataset.i, q = l.questions[i], res = el.querySelector('.res');
    el.querySelector('[data-a="check"]').onclick = () => {
      const v = Number(el.querySelector('input').value.replace(',', '.'));
      if (!Number.isFinite(v)) { res.innerHTML = '<span class="no">Enter a number.</span>'; return; }
      const tol = q.tol ?? 0.02, ok = Math.abs(v - q.ans) <= tol * Math.abs(q.ans || 1);
      res.innerHTML = ok ? `<span class="ok">✓ Correct</span> — ${esc(String(q.ans))} ${esc(q.unit || '')}` : `<span class="no">✗ Not quite.</span> Check units and significant figures (±${(tol * 100).toFixed(0)} % accepted).`;
      if (ok) { const p = getProg(); p[`${id}:${i}`] = Date.now(); setProg(p); }
    };
    el.querySelector('[data-a="hint"]')?.addEventListener('click', () => { res.innerHTML = `<span class="muted">Hint: ${esc(q.hint)}</span>`; });
  });
  renderTex(main);
}
