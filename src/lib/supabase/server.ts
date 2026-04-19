import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createClient() {
  return createSupabaseClient();
}