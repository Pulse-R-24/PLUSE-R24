import { createClient } from '@supabase/supabase-js';

// Use a proxy in development to bypass browser restrictions on secret keys
const SUPABASE_URL = 'http://localhost:4001';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL && !import.meta.env.DEV) {
  console.error('CRITICAL: VITE_SUPABASE_URL is missing!');
}
if (!SUPABASE_ANON_KEY) {
  console.error('CRITICAL: VITE_SUPABASE_ANON_KEY is missing!');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');