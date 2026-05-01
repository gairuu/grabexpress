import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== 'undefined') {
  console.log('DEBUG - URL exists:', !!supabaseUrl);
  console.log('DEBUG - URL starts with:', supabaseUrl?.slice(0, 8));
}

// If it's missing, we use a fallback only during BUILD
const isBuild = !supabaseUrl && typeof window === 'undefined';
const finalUrl = supabaseUrl || (isBuild ? 'https://placeholder.supabase.co' : '');
const finalKey = supabaseAnonKey || (isBuild ? 'placeholder' : '');

export const supabase = createClient(finalUrl || 'https://placeholder.supabase.co', finalKey || 'placeholder');
