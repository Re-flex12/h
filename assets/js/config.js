// Site configuration. Fill in your Supabase project's URL and anon (public) key to enable accounts.
// Both values are public by design — access control is enforced by Row Level Security in the database
// (see supabase/schema.sql). Never put the service_role key here.
export const SUPABASE_URL = '';        // e.g. 'https://abcdefghijklm.supabase.co'
export const SUPABASE_ANON_KEY = '';   // Project Settings → API → Project API keys → anon / public

// Bump this when the Terms of Service or Privacy Policy change materially; signed-in users are asked to accept again.
export const TERMS_VERSION = '2026-09-30';

// Shown in the Terms of Service and Privacy Policy. Fill these in before launch.
export const LEGAL = {
  operator: '',          // Who runs the site, e.g. 'Jane Smith' or 'Example Ltd (company no. 12345678)'
  contactEmail: '',      // Where users send privacy and account requests
  jurisdiction: '',      // Governing law, e.g. 'England and Wales'
  hostingRegion: '',     // Supabase project region, e.g. 'EU (Frankfurt)'
};
