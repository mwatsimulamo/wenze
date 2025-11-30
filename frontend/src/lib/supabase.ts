import { createClient } from '@supabase/supabase-js';

// Access environment variables using Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔧 Supabase Config Check:");
console.log("URL:", supabaseUrl ? supabaseUrl : "❌ MANQUANTE (Utilisation du placeholder)");
console.log("KEY:", supabaseKey ? "✅ Présente" : "❌ MANQUANTE");

if (!supabaseUrl || !supabaseKey) {
    console.error("🚨 ERREUR : Les variables d'environnement sont vides. Avez-vous redémarré le serveur après avoir créé .env ?");
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder_url_that_will_fail.supabase.co', 
    supabaseKey || 'placeholder_key'
);
