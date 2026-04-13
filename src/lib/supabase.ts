import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase'; // We'll assume generated types eventually, but we can fallback

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan configurar las variables de entorno de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_KEY)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
