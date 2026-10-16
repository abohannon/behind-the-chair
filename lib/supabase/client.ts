import { supabaseConfig } from "./env";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    supabaseConfig().url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
