import { createClient } from "@supabase/supabase-js";

// .env kullanmadan doğrudan key'leri yazıyoruz
export const supabaseUrl = "https://cnoscrzbxisnprxkdpgt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNub3NjcnpieGlzbnByeGtkcGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NTgxOTAsImV4cCI6MjA2NzIzNDE5MH0.34XabyMqbJIrFnhAoDgHCw9t9vneG0Y_xPFGZoefYd8"; // kendi public anon key'in

const supabase = createClient(supabaseUrl, supabaseKey);

// Named export için
export { supabase };

// Default export
export default supabase;
