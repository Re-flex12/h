// Accounts via Supabase Auth: sign-up (with Terms acceptance), sign-in, sign-out, password reset,
// Terms re-acceptance and account deletion. Works only when config.js holds a project URL and anon key.
import { SUPABASE_URL, SUPABASE_ANON_KEY, TERMS_VERSION } from '../config.js';

let client = null, state = { ready: false, user: null, session: null, recovery: false };
const listeners = new Set();
const emit = () => listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });

export const configured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const available = () => configured() && typeof window !== 'undefined' && Boolean(window.supabase?.createClient);
export const getState = () => state;
export function onAuth(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn); }
export const supabase = () => client;

// Where Supabase email links (confirm, reset) send the user back to: this page, without the hash route.
const returnUrl = (extra = '') => `${location.origin}${location.pathname}${extra}`;

export async function initAuth() {
  if (!available() || client) { state = { ...state, ready: true }; emit(); return; }
  if (!/^https?:$/.test(location.protocol)) { state = { ...state, ready: true, blocked: 'file' }; emit(); return; }
  // PKCE puts ?code=… in the query string, so it never collides with the hash router.
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const params = new URLSearchParams(location.search);
  const cameFromEmail = params.has('code') || params.has('error_description');
  client.auth.onAuthStateChange((event, session) => {
    state = { ...state, ready: true, session, user: session?.user || null, recovery: state.recovery || event === 'PASSWORD_RECOVERY' };
    emit();
  });
  const { data } = await client.auth.getSession();
  state = { ...state, ready: true, session: data.session, user: data.session?.user || null, recovery: state.recovery || params.get('reset') === '1' };
  if (cameFromEmail) {
    const err = params.get('error_description');
    // Strip auth parameters from the address bar, then go to the right page.
    history.replaceState(null, '', `${location.pathname}${state.recovery ? '#/reset-password' : err ? `#/signin?error=${encodeURIComponent(err)}` : '#/account?welcome=1'}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  emit();
}

const need = () => { if (!client) throw new Error(configured() ? 'Accounts could not start. Open the site over http(s), not from a file.' : 'Accounts are not configured for this site yet.'); return client; };
const friendly = (error) => {
  const m = error?.message || String(error);
  if (/Invalid login credentials/i.test(m)) return 'Email or password is incorrect.';
  if (/Email not confirmed/i.test(m)) return 'Please confirm your email first — check your inbox for the link.';
  if (/already registered|already exists/i.test(m)) return 'An account with this email already exists. Try signing in or resetting your password.';
  if (/Password should be/i.test(m)) return m;
  if (/rate limit/i.test(m)) return 'Too many attempts — please wait a minute and try again.';
  return m;
};
const run = async (p) => { const { data, error } = await p; if (error) throw new Error(friendly(error)); return data; };

export function validatePassword(pw) {
  const issues = [];
  if (pw.length < 8) issues.push('at least 8 characters');
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) issues.push('letters and numbers');
  return issues;
}

export async function signUp({ email, password, name, role, acceptedTerms, ageOk }) {
  if (!acceptedTerms) throw new Error('You must accept the Terms of Service and Privacy Policy to create an account.');
  if (!ageOk) throw new Error('You must be at least 13 (or have a parent or guardian\'s permission) to create an account.');
  const bad = validatePassword(password);
  if (bad.length) throw new Error(`Password needs ${bad.join(' and ')}.`);
  const now = new Date().toISOString();
  const data = await run(need().auth.signUp({ email, password, options: { emailRedirectTo: returnUrl(), data: { display_name: name || '', role: role || '', terms_version: TERMS_VERSION, terms_accepted_at: now, privacy_version: TERMS_VERSION } } }));
  // With email confirmation on (the Supabase default) there is no session until the link is clicked.
  return { needsConfirmation: !data.session, user: data.user };
}
export const signIn = ({ email, password }) => run(need().auth.signInWithPassword({ email, password }));
export const signOut = () => run(need().auth.signOut());
export const sendReset = (email) => run(need().auth.resetPasswordForEmail(email, { redirectTo: returnUrl('?reset=1') }));
export async function updatePassword(password) {
  const bad = validatePassword(password);
  if (bad.length) throw new Error(`Password needs ${bad.join(' and ')}.`);
  const d = await run(need().auth.updateUser({ password }));
  state = { ...state, recovery: false }; emit();
  return d;
}
export const updateProfile = (fields) => run(need().auth.updateUser({ data: fields }));
export const resendConfirmation = (email) => run(need().auth.resend({ type: 'signup', email, options: { emailRedirectTo: returnUrl() } }));

// Terms: accepted version is stored in user metadata (and mirrored to public.profiles by a trigger).
export const termsCurrent = (user = state.user) => !user || user.user_metadata?.terms_version === TERMS_VERSION;
export async function acceptTerms() {
  const now = new Date().toISOString();
  await run(need().auth.updateUser({ data: { terms_version: TERMS_VERSION, terms_accepted_at: now, privacy_version: TERMS_VERSION } }));
  await client.from('profiles').update({ terms_version: TERMS_VERSION, terms_accepted_at: now }).eq('id', state.user.id); // best effort
}
// Deletes the signed-in user's account via the delete_user() database function (see supabase/schema.sql).
export async function deleteAccount() {
  await run(need().rpc('delete_user'));
  await client.auth.signOut().catch(() => {});
}
