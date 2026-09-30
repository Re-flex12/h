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
const msg = (main, kind, html) => { const m = main.querySelector('#amsg'); m.className = `msg ${kind} mt`; m.innerHTML = html; m.hidden = false; };
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

export function signin(main) {
  if (notReady(main, 'Sign in')) return;
  if (auth.getState().user) { location.hash = '#/account'; return; }
  const err = q().get('error');
  main.innerHTML = `${crumbs([['Sign in']])}${pageHead('ACCOUNT / SIGN IN', 'Sign in', 'Keep your projects, history and progress with your account.')}
    ${card(`<form id="f" novalidate>${field('email', 'Email', 'email', 'autocomplete="email" required')}${field('pw', 'Password', 'password', 'autocomplete="current-password" required')}
      <div class="row gap mt" style="align-items:center;justify-content:space-between"><button class="btn" id="go" type="submit">Sign in</button><a href="#/forgot-password" class="small">Forgot password?</a></div>
      <div id="amsg" hidden></div></form>
      <p class="muted mt2">New here? <a href="#/signup">Create an account</a>.</p>`)}`;
  if (err) msg(main, 'warn', esc(err));
  main.querySelector('#f').onsubmit = async (e) => {
    e.preventDefault();
    const btn = main.querySelector('#go'), email = main.querySelector('#email').value.trim(), password = main.querySelector('#pw').value;
    if (!email || !password) { msg(main, 'warn', 'Enter your email and password.'); return; }
    busy(btn, true, 'Sign in');
    try { await auth.signIn({ email, password }); toast('Signed in'); location.hash = '#/account'; }
    catch (x) {
      msg(main, 'warn', esc(x.message) + (/confirm your email/.test(x.message) ? ' <button class="btn ghost sm" id="resend" type="button">Resend link</button>' : ''));
      main.querySelector('#resend')?.addEventListener('click', async () => { try { await auth.resendConfirmation(email); msg(main, 'good', 'Confirmation email sent.'); } catch (y) { msg(main, 'warn', esc(y.message)); } });
    }
    finally { busy(btn, false, 'Sign in'); }
  };
}

export function signup(main) {
  if (notReady(main, 'Create account')) return;
  if (auth.getState().user) { location.hash = '#/account'; return; }
  main.innerHTML = `${crumbs([['Create account']])}${pageHead('ACCOUNT / SIGN UP', 'Create an account', 'Free. Accounts are optional — every tool works without one.')}
    ${card(`<form id="f" novalidate>${field('name', 'Name (optional)', 'text', 'autocomplete="name" maxlength="80"')}
      <div class="field"><label for="role"><span>I am a… (optional)</span></label><div class="in"><select id="role"><option value="">Prefer not to say</option><option value="student">Student</option><option value="teacher">Teacher / lecturer</option><option value="engineer">Engineer</option><option value="other">Other</option></select></div></div>
      ${field('email', 'Email', 'email', 'autocomplete="email" required')}${field('pw', 'Password', 'password', 'autocomplete="new-password" required minlength="8"')}
      <p class="small muted">At least 8 characters, with letters and numbers.</p>
      <label class="check mt"><input type="checkbox" id="terms"> <span>I have read and agree to the <a href="#/terms" target="_blank">Terms of Service</a> and <a href="#/privacy" target="_blank">Privacy Policy</a>.</span></label>
      <label class="check mt"><input type="checkbox" id="age"> <span>I am 13 or older, or I have my parent or guardian's permission.</span></label>
      <div class="row gap mt"><button class="btn" id="go" type="submit" disabled>Create account</button></div>
      <div id="amsg" hidden></div></form>
      <p class="muted mt2">Already have an account? <a href="#/signin">Sign in</a>.</p>`)}`;
  const t = main.querySelector('#terms'), a = main.querySelector('#age'), btn = main.querySelector('#go');
  const gate = () => { btn.disabled = !(t.checked && a.checked); };
  t.onchange = gate; a.onchange = gate;
  main.querySelector('#f').onsubmit = async (e) => {
    e.preventDefault();
    const email = main.querySelector('#email').value.trim(), password = main.querySelector('#pw').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg(main, 'warn', 'Enter a valid email address.'); return; }
    busy(btn, true, 'Create account');
    try {
      const r = await auth.signUp({ email, password, name: main.querySelector('#name').value.trim(), role: main.querySelector('#role').value, acceptedTerms: t.checked, ageOk: a.checked });
      if (r.needsConfirmation) main.querySelector('#f').innerHTML = `<div class="msg good">Almost done — we have sent a confirmation link to <b>${esc(email)}</b>. Open it on this device to finish creating your account.</div><p class="small muted mt">No email after a few minutes? Check spam, or <a href="#/signin">sign in</a> to resend it.</p>`;
      else { toast('Account created'); location.hash = '#/account?welcome=1'; }
    } catch (x) { msg(main, 'warn', esc(x.message)); busy(btn, false, 'Create account'); gate(); }
  };
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
