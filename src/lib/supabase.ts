import { createClient } from "@supabase/supabase-js";

function cleanUrl(rawUrl: string | undefined): string {
  const fallback = "https://ybnaylyisexlcmlnkpyp.supabase.co";
  if (!rawUrl) return fallback;
  let str = rawUrl.trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.substring(1, str.length - 1).trim();
  }
  str = str.replace(/`/g, "").trim();
  const markdownMatch = str.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/);
  if (markdownMatch && markdownMatch[1]) {
    str = markdownMatch[1];
  }
  if (str.startsWith("http://") || str.startsWith("https://")) {
    return str;
  }
  return fallback;
}

function cleanKey(rawKey: string | undefined): string {
  const fallback = "sb_publishable_ML6RcCN5vspNrWcrEESBVg_M9oGxShl";
  if (!rawKey) return fallback;
  let str = rawKey.trim().replace(/`/g, "");
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.substring(1, str.length - 1).trim();
  }
  return str || fallback;
}

const supabaseUrl = cleanUrl(import.meta.env.VITE_SUPABASE_URL || 'https://ybnaylyisexlcmlnkpyp.supabase.co');
const supabaseAnonKey = cleanKey(import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ML6RcCN5vspNrWcrEESBVg_M9oGxShl');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!");
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
