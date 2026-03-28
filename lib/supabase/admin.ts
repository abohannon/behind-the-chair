import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// WARNING: This client bypasses RLS. Only use in:
// - This file (lib/supabase/admin.ts)
// - Stripe webhook handler (app/api/webhooks/stripe/route.ts)
// Never import this elsewhere.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
