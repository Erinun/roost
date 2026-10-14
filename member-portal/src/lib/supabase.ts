import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Supabase-konfiguration saknas: sätt VITE_SUPABASE_URL och VITE_SUPABASE_PUBLISHABLE_KEY i .env.local (se .env.example).'
    );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
