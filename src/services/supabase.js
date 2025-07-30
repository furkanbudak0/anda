import { createClient } from "@supabase/supabase-js";

// Environment variables'dan key'leri alıyoruz
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});

// Named export için
export { supabase };

// Default export
export default supabase;
