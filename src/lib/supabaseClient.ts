import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://ybnaylyisexlcmInkpyp.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibmF5bHlpc2V4bGNtbG5rcHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTY5NDQsImV4cCI6MjEwMDAzMjk0NH0.oV5kPGS4XA4U8oRyxS_5687I11dkEo5gCwW2msxuO5I";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
