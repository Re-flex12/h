# Accounts setup (Supabase)

> **Status:** connected to the Supabase project **PHYSENG** (`qrkvuplxknpwimzbgiru`, region ap-southeast-2 / Sydney).
> `supabase/schema.sql` is applied (migrations `project_sync` and `harden_trigger_functions` on top of the original schema), and
> `assets/js/config.js` holds the project URL and publishable key. The only step left is **Site URL / Redirect URLs** (step 2),
> which needs the address where you host the site.

Sign-up, sign-in, password reset, Terms acceptance and account deletion use [Supabase Auth](https://supabase.com/docs/guides/auth).
Until `assets/js/config.js` is filled in, the site works as before, and the account button stays hidden.

## 1. Create the project
1. Create a project at <https://supabase.com/dashboard>. Choose a region near your users (for UK/EU users, pick an EU region), and record it for the Privacy Policy.
2. **SQL Editor → New query**: paste `supabase/schema.sql` and **Run**. This creates:
   - `public.profiles` (display name, role, accepted Terms version and time), with Row Level Security so each user sees only their own row;
   - a trigger that **refuses any sign-up without Terms acceptance** and creates the profile;
   - a trigger that keeps the profile in step when the user renames themselves or re-accepts updated Terms;
   - `public.delete_user()`, so users can delete their own account;
   - `public.projects` for **project sync**: one row per project, RLS-isolated per user, 1 MB/project and 1000 projects/account limits, and a trigger that ignores stale writes (a device with an older copy can't overwrite a newer edit).

## 2. Configure authentication
**Authentication → URL Configuration**
- **Site URL**: where the site is hosted, e.g. `https://physeng.example.com/` (the page that serves `index.html`).
- **Redirect URLs**: add the same URL plus `…/?reset=1` (password reset), e.g. `https://physeng.example.com/**`.
  For local testing, also add `http://localhost:8080/**`.

**Authentication → Sign In / Providers → Email**: enabled. **Confirm email is OFF** for this site (owner's choice): sign-up logs the user in straight away. (Turning it back on works too — the site then shows "check your email" after sign-up.)
Optionally raise the minimum password length to 8 (the site enforces 8 characters with letters and numbers).

**Authentication → Emails**: the default templates work. Before launch, set up custom SMTP (Project Settings → Auth → SMTP), because Supabase's built-in email is rate-limited and meant for testing.

## 3. Connect the site
Edit `assets/js/config.js`:
```js
export const SUPABASE_URL = 'https://<project-ref>.supabase.co';
export const SUPABASE_ANON_KEY = '<publishable key (sb_publishable_…) or legacy anon key>';   // Project Settings → API Keys
export const LEGAL = { operator: '…', contactEmail: '…', jurisdiction: '…', hostingRegion: '…' };
```
The anon key is designed to be public. Security comes from the RLS policies in `schema.sql`. **Never** put the `service_role` key in the site.

Then run `npm run build` if you ship the single-file `dist/physeng.html`. Sign-in needs the site served over **http(s)**; it doesn't work when the file is opened from disk.

## 4. Terms of Service & Privacy Policy
- Pages: `#/terms` and `#/privacy` (`assets/js/pages/legal.js`). Anything shown as a highlighted `[placeholder]` comes from `LEGAL` in `config.js`.
- **Have the text reviewed by a lawyer for your jurisdiction before launch.** It's a sensible starting template, not legal advice.
- Sign-up can't be submitted until the user ticks both *"I agree to the Terms of Service and Privacy Policy"* and *"I am 13 or older, or have a parent/guardian's permission"*. The accepted version and timestamp are stored in the user's metadata and in `public.profiles`, and the database rejects sign-ups without them.
- **Changing the Terms**: edit the text, then bump `TERMS_VERSION` in `config.js`. Signed-in users on an older version see a prompt to accept the new version (or sign out), and the new acceptance is recorded.

## Entry screen
A signed-out visitor is shown a **Sign up / Log in** screen on arrival (`showEntry` in `assets/js/pages/account.js`). It has the same forms as `#/signup` and `#/signin`, including the Terms and age checkboxes, plus **Continue without an account**, which is remembered for 30 days. It doesn't appear over the Terms, Privacy or account pages, and the header **Log in** button reopens it.

## How it works
| Flow | What happens |
|---|---|
| Sign up | `auth.signUp` with Terms metadata → signed in immediately (Confirm email off). If confirmation is switched on: email → link returns to the site (`?code=…`, PKCE) → signed in |
| Sign in / out | `signInWithPassword` / `signOut`; the session is kept in localStorage and refreshed automatically |
| Forgot password | `resetPasswordForEmail` → link returns with `?reset=1&code=…` → `#/reset-password` → `updateUser({ password })` |
| Project sync | On sign-in, after each change (1.5 s debounce), on window focus or reconnect, and every minute: fetch row metadata → download newer server copies → upload newer local copies and deletion markers. Signing out flushes first, then removes that account's copies from the browser; if the flush failed, they're kept as local-only projects so nothing is lost. |
| Account page | edit name and role, change password, view the accepted Terms version, sign out, delete account (`rpc('delete_user')`) |

PKCE is used so that auth parameters arrive in the query string and never clash with the site's `#/` hash router.
