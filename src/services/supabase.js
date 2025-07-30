import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cnoscrzbxisnprxkdpgt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNub3NjcnpieGlzbnByeGtkcGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NTgxOTAsImV4cCI6MjA2NzIzNDE5MH0.34XabyMqbJIrFnhAoDgHCw9t9vneG0Y_xPFGZoefYd8";

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

export { supabaseUrl };
export { supabase };
export default supabase;
