import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const isPlaceholder = !url || !anonKey
  || url.includes('your-project')
  || anonKey.includes('your-anon');

export const isSupabaseConfigured = !isPlaceholder;

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, { realtime: { params: { eventsPerSecond: 10 } } })
  : null;
