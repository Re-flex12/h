// Sign in, sign up, password reset and account pages (Supabase Auth).
import * as auth from '../core/auth.js';
import { TERMS_VERSION } from '../config.js';
import { esc, toast } from '../core/format.js';
import { crumbs, pageHead } from './common.js';
import { onSync, syncNow } from '../core/sync.js';
import { getProjects } from '../core/store.js';

const q = (main) => new URLSearchParams(location.hash.split('?')[1] || '');
const field = (id, label, type = 'text', extra = '') => `<div class="field"><label for="${id}"><span>${label}</span></label><div class="in"><input id="${id}" type="${type}" ${extra}></div></div>`;
const card = (inner) => `<div class="auth-card panel tick">${inner}</div>`;
const msg = (root, kind, html) => { const m = root.querySelector('#amsg'); m.className = `msg ${kind} mt`; m.innerHTML = html; m.hidden = false; };
const busy = (btn, on, label) => { btn.disabled = on; btn.textContent = on ? 'Please wait…' : label; };

function notReady(main, title) {
  const st = auth.getState();
  if (!auth.configured()) {
    main.innerHTML = `${crumbs([[title]])}${pageHead('ACCOUNT', title, 'Accounts are optional — everything on the site works without one.')}${card(`<div class="msg info">Accounts are not switched on for this copy of the site yet. The site owner needs to add a Supabase project URL and anon key to <code>assets/js/config.js</code> (see <code>SUPABASE.md</code>).</div><p class="muted">Your work is saved in this browser in the meantime — see <a href="#/workspace">Workspace</a>.</p>`)}`;
    return true;
  }
  if (st.blocked === 'file') {
    main.innerHTML = `${crumbs([[title]])}${pageHead('ACCOUNT', title, '')}${card('<div class="msg warn">Sign-in needs the site to be opened from a web address (http or https), not as a local file.</div>')}`;
    return true;
  }
  if (!auth.available()) {
    main.innerHTML = `${crumbs([[title]])}${pageHead('ACCOUNT', title, '')}${card('<div class="msg warn">The sign-in service could not load. Check your connection and reload the page.</div>')}`;
    return true;
  }
  return false;
}

// ── Reusable forms (used by the pages and by the entry screen) ───────────────
export const signinFormHtml = () => `<form data-auth="signin" novalidate>${field('email', 'Email', 'email', 'autocomplete="email" required')}${field('pw', 'Password', 'password', 'autocomplete="current-password" required')}
  <div class="row gap mt" style="align-items:center;justify-content:space-between"><button class="btn" id="go" type="submit">Log in</button><a href="#/forgot-password" class="small" data-close>Forgot password?</a></div>
  <div id="amsg" hidden></div></form>`;
export const signupFormHtml = () => `<form data-auth="signup" novalidate>${field('name', 'Name (optional)', 'text', 'autocomplete="name" maxlength="80"')}
  <div class="field"><label for="role"><span>I am a… (optional)</span></label><div class="in"><select id="role"><option value="">Prefer not to say</option><option value="student">Student</option><option value="teacher">Teacher / lecturer</option><option value="engineer">Engineer</option><option value="other">Other</option></select></div></div>
  ${field('email', 'Email', 'email', 'autocomplete="email" required')}${field('pw', 'Password', 'password', 'autocomplete="new-password" required minlength="8"')}
  <p class="small muted">At least 8 characters, with letters and numbers.</p>
  <label class="check mt"><input type="checkbox" id="terms"> <span>I have read and agree to the <a href="#/terms" target="_blank">Terms of Service</a> and <a href="#/privacy" target="_blank">Privacy Policy</a>.</span></label>
  <label class="check mt"><input type="checkbox" id="age"> <span>I am 13 or older, or I have my parent or guardian's permission.</span></label>
  <div class="row gap mt"><button class="btn" id="go" type="submit" disabled>Create account</button></div>
  <div id="amsg" hidden></div></form>`;

export function bindSignin(root, { onDone = () => { location.hash = '#/account'; } } = {}) {
  const f = root.querySelector('form[data-auth="signin"]');
  f.onsubmit = async (e) => {
    e.preventDefault();
    const btn = f.querySelector('#go'), email = f.querySelector('#email').value.trim(), password = f.querySelector('#pw').value;
    if (!email || !password) { msg(root, 'warn', 'Enter your email and password.'); return; }
    busy(btn, true, 'Log in');
    try { await auth.signIn({ email, password }); toast('Logged in'); onDone(); }
    catch (x) {
      msg(root, 'warn', esc(x.message) + (/confirm your email/.test(x.message) ? ' <button class="btn ghost sm" id="resend" type="button">Resend link</button>' : ''));
      root.querySelector('#resend')?.addEventListener('click', async () => { try { await auth.resendConfirmation(email); msg(root, 'good', 'Confirmation email sent.'); } catch (y) { msg(root, 'warn', esc(y.message)); } });
    }
    finally { busy(btn, false, 'Log in'); }
  };
}

export function bindSignup(root, { onDone = () => { location.hash = '#/account?welcome=1'; } } = {}) {
  const f = root.querySelector('form[data-auth="signup"]');
  const t = f.querySelector('#terms'), a = f.querySelector('#age'), btn = f.querySelector('#go');
  const gate = () => { btn.disabled = !(t.checked && a.checked); };
  t.onchange = gate; a.onchange = gate;
  f.onsubmit = async (e) => {
    e.preventDefault();
    const email = f.querySelector('#email').value.trim(), password = f.querySelector('#pw').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg(root, 'warn', 'Enter a valid email address.'); return; }
    busy(btn, true, 'Create account');
    try {
      const r = await auth.signUp({ email, password, name: f.querySelector('#name').value.trim(), role: f.querySelector('#role').value, acceptedTerms: t.checked, ageOk: a.checked });
      if (r.needsConfirmation) f.innerHTML = `<div class="msg good">Almost done — we have sent a confirmation link to <b>${esc(email)}</b>. Open it on this device to finish creating your account.</div><p class="small muted mt">No email after a few minutes? Check spam, or log in to resend it.</p>`;
      else { toast('Account created'); onDone(); }
    } catch (x) { msg(root, 'warn', esc(x.message)); busy(btn, false, 'Create account'); gate(); }
  };
}

export function signin(main) {
  if (notReady(main, 'Log in')) return;
  if (auth.getState().user) { location.hash = '#/account'; return; }
  const err = q().get('error');
  main.innerHTML = `${crumbs([['Log in']])}${pageHead('ACCOUNT / LOG IN', 'Log in', 'Keep your projects, history and progress with your account.')}
    ${card(`${signinFormHtml()}<p class="muted mt2">New here? <a href="#/signup">Create an account</a>.</p>`)}`;
  if (err) msg(main, 'warn', esc(err));
  bindSignin(main);
}

export function signup(main) {
  if (notReady(main, 'Create account')) return;
  if (auth.getState().user) { location.hash = '#/account'; return; }
  main.innerHTML = `${crumbs([['Create account']])}${pageHead('ACCOUNT / SIGN UP', 'Create an account', 'Free. Keeps your projects in sync across devices.')}
    ${card(`${signupFormHtml()}<p class="muted mt2">Already have an account? <a href="#/signin">Log in</a>.</p>`)}`;
  bindSignup(main);
}

// ── Entry screen: sign up / log in when a signed-out visitor arrives ─────────
const ENTRY_KEY = 'physeng.entry.guestUntil';
const guestUntil = () => { try { return Number(localStorage.getItem(ENTRY_KEY)) || 0; } catch (e) { return 0; } };
export function showEntry({ force = false, tab = 'signup' } = {}) {
  const st = auth.getState();
  if (!auth.available() || st.blocked || st.user || document.getElementById('entry')) return;
  if (!force && (guestUntil() > Date.now() || /^#\/(signin|signup|forgot-password|reset-password|terms|privacy|account)/.test(location.hash))) return;
  const el = document.createElement('div');
  el.id = 'entry'; el.className = 'entry';
  el.innerHTML = `<div class="entry-box" role="dialog" aria-modal="true" aria-labelledby="entryTitle">
    <div class="entry-side">
      <div class="entry-brand"><svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(45 12 12)"><path d="M12 2C15.6 5 16.6 9.2 16 15.2H8C7.4 9.2 8.4 5 12 2Z"/><circle cx="12" cy="9" r="1.9"/><path d="M8.2 11.6 4.8 16.6l3.4-.6M15.8 11.6l3.4 5-3.4-.6"/><path class="fill" d="M9.9 16.4 12 22.4l2.1-6Z"/></g></svg><div><b>PHYS</b><span>ENG</span></div></div>
      <h2 id="entryTitle">Learn it. Calculate it.<br>Simulate it. Apply it.</h2>
      <ul><li>170+ calculators with stated equations, units and sources</li><li>Solvers, 26 simulations, steam and refrigerant tables</li><li>Lessons, lab guides and exam-style papers</li><li><b>Account:</b> projects synced across your devices</li></ul>
    </div>
    <div class="entry-main">
      <div class="tabs entry-tabs"><button data-tab="signup">Sign up</button><button data-tab="signin">Log in</button></div>
      <div id="entryForm"></div>
      <button class="btn ghost entry-guest" id="guest" type="button">Continue without an account →</button>
      <p class="small muted">Everything works without an account; your work is then kept in this browser only.</p>
    </div></div>`;
  document.body.appendChild(el);
  document.body.classList.add('entry-open');
  const close = () => { el.remove(); document.body.classList.remove('entry-open'); };
  const show = (which) => {
    el.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === which));
    const box = el.querySelector('#entryForm');
    box.innerHTML = which === 'signin' ? signinFormHtml() : signupFormHtml();
    (which === 'signin' ? bindSignin : bindSignup)(box, { onDone: close });
    box.querySelectorAll('[data-close], a[href^="#/"]:not([target])').forEach(a => a.addEventListener('click', close));
    box.querySelector('input')?.focus();
  };
  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => show(b.dataset.tab));
  el.querySelector('#guest').onclick = () => { try { localStorage.setItem(ENTRY_KEY, String(Date.now() + 30 * 864e5)); } catch (e) { /* ignore */ } close(); };
  el.addEventListener('keydown', e => { if (e.key === 'Escape') el.querySelector('#guest').click(); });
  auth.onAuth(s => { if (s.user && el.isConnected) close(); });
  show(tab);
}

export function forgot(main) {
  if (notReady(main, 'Reset password')) return;
  main.innerHTML = `${crumbs([['Sign in', '#/signin'], ['Reset password']])}${pageHead('ACCOUNT / RESET', 'Reset your password', 'We will email you a link to choose a new password.')}
    ${card(`<form id="f" novalidate>${field('email', 'Email', 'email', 'autocomplete="email" required')}<div class="row gap mt"><button class="btn" id="go" type="submit">Send reset link</button></div><div id="amsg" hidden></div></form>`)}`;
  main.querySelector('#f').onsubmit = async (e) => {
    e.preventDefault();
    const btn = main.querySelector('#go'), email = main.querySelector('#email').value.trim();
    if (!email) { msg(main, 'warn', 'Enter your email.'); return; }
    busy(btn, true, 'Send reset link');
    // Same message whether or not the address has an account, so accounts cannot be discovered here.
    try { await auth.sendReset(email); msg(main, 'good', `If an account exists for ${esc(email)}, a reset link is on its way.`); }
    catch (x) { msg(main, 'warn', esc(x.message)); }
    finally { busy(btn, false, 'Send reset link'); }
  };
}

export function resetPassword(main) {
  if (notReady(main, 'Choose a new password')) return;
  const st = auth.getState();
  if (!st.user) { main.innerHTML = `${crumbs([['Reset password']])}${pageHead('ACCOUNT / RESET', 'Choose a new password', '')}${card('<div class="msg warn">This reset link has expired or was already used. <a href="#/forgot-password">Request a new one</a>.</div>')}`; return; }
  main.innerHTML = `${crumbs([['Reset password']])}${pageHead('ACCOUNT / RESET', 'Choose a new password', esc(st.user.email || ''))}
    ${card(`<form id="f" novalidate>${field('pw', 'New password', 'password', 'autocomplete="new-password" required')}${field('pw2', 'Repeat new password', 'password', 'autocomplete="new-password" required')}<div class="row gap mt"><button class="btn" id="go" type="submit">Save password</button></div><div id="amsg" hidden></div></form>`)}`;
  main.querySelector('#f').onsubmit = async (e) => {
    e.preventDefault();
    const btn = main.querySelector('#go'), p1 = main.querySelector('#pw').value, p2 = main.querySelector('#pw2').value;
    if (p1 !== p2) { msg(main, 'warn', 'The passwords do not match.'); return; }
    busy(btn, true, 'Save password');
    try { await auth.updatePassword(p1); toast('Password updated'); location.hash = '#/account'; }
    catch (x) { msg(main, 'warn', esc(x.message)); busy(btn, false, 'Save password'); }
  };
}

export function account(main) {
  if (notReady(main, 'Account')) return;
  const st = auth.getState();
  if (!st.ready) { main.innerHTML = `${crumbs([['Account']])}<p class="muted">Loading…</p>`; const off = auth.onAuth(s => { if (s.ready) { off(); account(main); } }); return; }
  if (!st.user) { location.hash = '#/signin'; return; }
  const u = st.user, md = u.user_metadata || {};
  const accepted = md.terms_accepted_at ? new Date(md.terms_accepted_at).toLocaleString() : '—';
  main.innerHTML = `${crumbs([['Account']])}${pageHead('ACCOUNT', md.display_name ? `Hello, ${md.display_name}` : 'Your account', esc(u.email || ''))}
    ${q().get('welcome') ? '<div class="msg good">Your account is ready. Your work on this device stays in <a href="#/workspace">Workspace</a>.</div>' : ''}
    <div class="split mt2">
      <div class="panel"><h4>Profile</h4>
        <form id="pf">${field('name', 'Name', 'text', `value="${esc(md.display_name || '')}" maxlength="80"`)}
        <div class="field"><label for="role"><span>Role</span></label><div class="in"><select id="role">${[['', 'Prefer not to say'], ['student', 'Student'], ['teacher', 'Teacher / lecturer'], ['engineer', 'Engineer'], ['other', 'Other']].map(([v, l]) => `<option value="${v}"${md.role === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div></div>
        <button class="btn sm mt" type="submit">Save profile</button></form>
        <h4 class="mt2">Password</h4>
        <form id="pwf">${field('pw', 'New password', 'password', 'autocomplete="new-password"')}<button class="btn ghost sm mt" type="submit">Change password</button></form>
        <div id="amsg" hidden></div>
      </div>
      <div class="panel"><h4>Agreements</h4>
        <p class="small">Terms of Service and Privacy Policy version <b>${esc(md.terms_version || '—')}</b>, accepted ${esc(accepted)}. ${auth.termsCurrent(u) ? '<span class="ok">✓ current</span>' : `<span class="no">An updated version (${esc(TERMS_VERSION)}) needs your acceptance.</span> <button class="btn sm" id="accept">Review & accept</button>`}</p>
        <p class="small"><a href="#/terms">Terms of Service</a> · <a href="#/privacy">Privacy Policy</a></p>
        <h4 class="mt2">Project sync</h4><p class="small"><span id="accSync" class="mono"></span></p><p class="small muted">${getProjects().filter(p => p.owner === u.id).length} project(s) synced to this account${getProjects().some(p => !p.owner) ? ` · ${getProjects().filter(p => !p.owner).length} only in this browser — upload them from <a href="#/workspace">Workspace</a>` : ''}.</p><button class="btn ghost sm" id="syncGo">Sync now</button>
        <h4 class="mt2">Session</h4><p class="small muted">Signed in since ${esc(new Date(u.last_sign_in_at || Date.now()).toLocaleString())}.</p>
        <button class="btn ghost sm" id="out">Sign out</button>
        <h4 class="mt2">Delete account</h4><p class="small muted">Permanently deletes your account and profile. Work saved in this browser is not affected.</p>
        <button class="btn danger sm" id="del">Delete my account</button>
      </div>
    </div>`;
  const accSync = main.querySelector('#accSync');
  const offSync = onSync(s => { if (!accSync.isConnected) { offSync(); return; } accSync.textContent = { off: '—', pending: 'Changes waiting…', syncing: 'Syncing…', synced: `✓ Synced ${s.at ? new Date(s.at).toLocaleTimeString() : ''}`, error: `⚠ ${s.error || 'Sync failed'}`, offline: '⚠ Offline' }[s.state] || s.state; });
  main.querySelector('#syncGo').onclick = () => syncNow();
  main.querySelector('#pf').onsubmit = async (e) => { e.preventDefault(); try { await auth.updateProfile({ display_name: main.querySelector('#name').value.trim(), role: main.querySelector('#role').value }); toast('Profile saved'); } catch (x) { msg(main, 'warn', esc(x.message)); } };
  main.querySelector('#pwf').onsubmit = async (e) => { e.preventDefault(); try { await auth.updatePassword(main.querySelector('#pw').value); main.querySelector('#pw').value = ''; toast('Password changed'); } catch (x) { msg(main, 'warn', esc(x.message)); } };
  main.querySelector('#out').onclick = async () => { await auth.signOut().catch(() => {}); toast('Signed out'); location.hash = '#/'; };
  main.querySelector('#accept')?.addEventListener('click', () => { location.hash = '#/terms'; setTimeout(() => showTermsPrompt(true), 50); });
  main.querySelector('#del').onclick = async () => {
    const typed = prompt(`This permanently deletes the account for ${u.email}. Type DELETE to confirm.`);
    if (typed !== 'DELETE') return;
    try { await auth.deleteAccount(); toast('Account deleted'); location.hash = '#/'; } catch (x) { msg(main, 'warn', esc(x.message)); }
  };
}

// Modal asking a signed-in user to accept an updated Terms/Privacy version.
export function showTermsPrompt(force = false) {
  const st = auth.getState();
  if (!st.user || (auth.termsCurrent(st.user) && !force) || document.querySelector('#termsModal')) return;
  const el = document.createElement('div');
  el.id = 'termsModal'; el.className = 'palette';
  el.innerHTML = `<div class="pal-box" role="dialog" aria-modal="true" aria-labelledby="tmh" style="padding:22px;max-width:520px">
    <h3 id="tmh" style="margin-top:0">We've updated our Terms</h3>
    <p>Please review the <a href="#/terms">Terms of Service</a> and <a href="#/privacy">Privacy Policy</a> (version ${esc(TERMS_VERSION)}). You need to accept them to keep using your account.</p>
    <label class="check"><input type="checkbox" id="tmc"> <span>I agree to the updated Terms of Service and Privacy Policy.</span></label>
    <div class="row gap mt2"><button class="btn" id="tma" disabled>Accept</button><button class="btn ghost" id="tmo">Sign out</button></div></div>`;
  document.body.appendChild(el);
  const c = el.querySelector('#tmc'), a = el.querySelector('#tma');
  c.onchange = () => { a.disabled = !c.checked; };
  a.onclick = async () => { a.disabled = true; try { await auth.acceptTerms(); el.remove(); toast('Thanks — Terms accepted'); } catch (x) { toast(x.message); a.disabled = false; } };
  el.querySelector('#tmo').onclick = async () => { await auth.signOut().catch(() => {}); el.remove(); location.hash = '#/'; };
}
