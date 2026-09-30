// Topic explainer pages: summary, key points, equations, worked example, self-check, mistakes, related tools.
import { TOPICS, TOPIC } from '../data/topics.js';
import { esc, T, fmt, renderTex } from '../core/format.js';
import { crumbs, pageHead, richText, href, titleOf, linkTile } from './common.js';

const SEC = { physics: ['Physics', '#/physics'], maths: ['Mathematics', '#/maths'] };
const KIND = { calc: 'Calculator', sim: 'Simulation', eq: 'Equation', learn: 'Lesson', tool: 'Tool', topic: 'Topic', lab: 'Lab guide', solver: 'Solver' };

export function index(main) {
  const groups = (sec) => [...new Set(TOPICS.filter(t => t.sec === sec).map(t => t.group))];
  main.innerHTML = `${crumbs([['Topics']])}${pageHead('TOPICS', 'Topic Guides', 'Short, exam-ready explainers for core physics and mathematics: what it is, the key equations, a worked example, a self-check question, common mistakes and the tools that go with it.')}
    ${['physics', 'maths'].map(sec => `<div class="sec-head"><h2>${SEC[sec][0]}</h2></div>${groups(sec).map(g => `<h4 style="margin:14px 0 8px">${esc(g)}</h4><div class="grid auto">${TOPICS.filter(t => t.sec === sec && t.group === g).map(t => linkTile(`#/topic/${t.id}`, g, t.title, t.summary.split('. ')[0] + '.', 'Read →')).join('')}</div>`).join('')}`).join('')}`;
}

export function topic(main, [id]) {
  const t = TOPIC[id];
  if (!t) { main.innerHTML = `${crumbs([['Topics', '#/topics'], ['Not found']])}<div class="msg warn">Unknown topic.</div>`; return; }
  const [secName, secHref] = SEC[t.sec];
  const sibs = TOPICS.filter(x => x.sec === t.sec && x.group === t.group), i = sibs.indexOf(t);
  const links = (t.links || []).map(l => { const [k, lid] = l.split(':'); return { k, lid, title: titleOf(k, lid) }; }).filter(l => l.title);
  main.innerHTML = `${crumbs([[secName, secHref], ['Topics', '#/topics'], [t.title]])}${pageHead(`${t.sec === 'maths' ? 'MTH' : 'PHY'} / ${t.group.toUpperCase()}`, t.title, richText(t.summary))}
    <div class="split">
      <div>
        <div class="sec-head" style="margin-top:0"><h2>Key points</h2></div>
        <ul>${t.points.map(p => `<li>${richText(p)}</li>`).join('')}</ul>
        <div class="sec-head"><h2>Key equations</h2></div>${t.eqs.map(e => `<div class="eqblock">${T(e, true)}</div>`).join('')}
        ${t.mistakes?.length ? `<div class="msg warn mt2"><b>Common mistakes.</b><ul style="margin:6px 0 0">${t.mistakes.map(m => `<li>${richText(m)}</li>`).join('')}</ul></div>` : ''}
      </div>
      <div>
        <div class="sec-head" style="margin-top:0"><h2>Worked example</h2></div>
        <div class="q"><p>${richText(t.example.q)}</p><ol>${t.example.steps.map(s => `<li>${richText(s)}</li>`).join('')}</ol><p><b>Answer:</b> ${richText(t.example.ans)}</p></div>
        <div class="sec-head"><h2>Check yourself</h2></div>
        <div class="q" id="chk"><p>${richText(t.check.q)}</p><div class="in" style="max-width:320px"><input inputmode="decimal" placeholder="Your answer"><span class="unit-fixed">${esc(t.check.unit || '—')}</span></div><div class="btns mt"><button class="btn sm" id="go">Check</button><button class="btn ghost sm" id="show">Show answer</button></div><div class="res"></div></div>
        ${links.length ? `<div class="sec-head"><h2>Use it</h2></div><div class="rows">${links.map(l => `<a class="row" href="${href(l.k, l.lid)}" style="text-decoration:none"><span class="ri">${esc(KIND[l.k] || l.k)}</span><span class="rt">${esc(l.title)}</span><span class="rd">→</span></a>`).join('')}</div>` : ''}
      </div>
    </div>
    <div class="row gap mt2" style="justify-content:space-between">${i > 0 ? `<a class="btn ghost sm" href="#/topic/${sibs[i - 1].id}">← ${esc(sibs[i - 1].title)}</a>` : '<span></span>'}${i < sibs.length - 1 ? `<a class="btn ghost sm" href="#/topic/${sibs[i + 1].id}">${esc(sibs[i + 1].title)} →</a>` : ''}</div>`;
  const box = main.querySelector('#chk'), res = box.querySelector('.res');
  box.querySelector('#go').onclick = () => {
    const v = Number(box.querySelector('input').value.replace(',', '.'));
    if (!Number.isFinite(v) || box.querySelector('input').value.trim() === '') { res.innerHTML = '<span class="no">Enter a number.</span>'; return; }
    const ok = Math.abs(v - t.check.ans) <= 0.02 * Math.max(Math.abs(t.check.ans), 1e-9) || (t.check.ans === 0 && Math.abs(v) < 1e-9);
    res.innerHTML = ok ? '<span class="ok">✓ Correct</span>' : '<span class="no">✗ Not quite</span> (±2 % accepted)';
  };
  box.querySelector('#show').onclick = () => { res.innerHTML = `<span class="muted">Answer: ${fmt(t.check.ans, 4)} ${esc(t.check.unit || '')}</span>`; };
  renderTex(main);
}
