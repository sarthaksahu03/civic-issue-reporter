import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Provide a clearer error if env vars are missing so the app fails fast with guidance
if (!url || !anon) {
  const msg =
    'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env (or .env.local) and restart the dev server.';
  // Avoid printing secrets; only indicate presence
  console.error(msg, {
    VITE_SUPABASE_URL: url || '(not set)',
    VITE_SUPABASE_ANON_KEY: anon ? '(set)' : '(not set)',
  });
  throw new Error(msg);
}

export const supabase = createClient(url, anon);
export default supabase;
