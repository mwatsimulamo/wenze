import { createClient } from '@supabase/supabase-js';

// Access environment variables using Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  if (import.meta.env.DEV) {
    console.error("🚨 ERREUR : Les variables d'environnement Supabase sont manquantes. Vérifiez votre fichier .env");
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder_url_that_will_fail.supabase.co', 
  supabaseKey || 'placeholder_key'
);
