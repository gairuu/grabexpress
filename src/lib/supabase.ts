import { createClient } from '@supabase/supabase-js';

// Clean the variables by removing any accidental spaces
const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// If the URL is empty or doesn't start with http, use the placeholder
const finalUrl = (rawUrl && rawUrl.startsWith('http')) ? rawUrl : 'https://placeholder.supabase.co';
const finalKey = rawKey || 'placeholder';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
