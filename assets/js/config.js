// Site configuration. Fill in your Supabase project's URL and anon (public) key to enable accounts.
// Both values are public by design — access control is enforced by Row Level Security in the database
// (see supabase/schema.sql). Never put the service_role key here.
export const SUPABASE_URL = 'https://qrkvuplxknpwimzbgiru.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Cv4geeFcD-LLdb1F1hvT_g_TJsarAFR';   // publishable (public) key

// Bump this when the Terms of Service or Privacy Policy change materially; signed-in users are asked to accept again.
export const TERMS_VERSION = '2026-09-30';

// Shown in the Terms of Service and Privacy Policy. Fill these in before launch.
export const LEGAL = {
  operator: 'Hamza Abdelwahab',
  contactEmail: 'mabduallah74@gmail.com',
  jurisdiction: 'the United Arab Emirates',
  hostingRegion: 'Asia-Pacific (Sydney)',   // Supabase project region
};
