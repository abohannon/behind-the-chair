import { createClient } from "@supabase/supabase-js";
import { safeParse } from "zod";
import { z } from "zod";
const [email, role, mode] = process.argv.slice(2);
if (
  !safeParse(z.email(), email).success ||
  !["employer", "seeker"].includes(role) ||
  (mode !== undefined && mode !== "--link")
)
  throw new Error(
    "Usage: node scripts/invite.mjs email@example.com employer|seeker [--link]",
  );
const {
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: key,
  NEXT_PUBLIC_APP_URL: appUrl,
} = process.env;
if (!url || !key || !appUrl)
  throw new Error(
    "Provide the target environment and app URL before inviting a tester.",
  );
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error: registryError } = await admin
  .from("alpha_invites")
  .upsert({ email: email.toLowerCase(), role });
if (registryError) throw registryError;
if (mode === "--link") {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: `${appUrl}/callback?next=/set-password` },
  });
  if (error) throw error;
  const link = new URL("/callback", appUrl);
  link.searchParams.set("token_hash", data.properties.hashed_token);
  link.searchParams.set("type", "invite");
  console.log("One-time invitation link (no email was sent):");
  console.log(link.toString());
} else {
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/callback?next=/set-password`,
  });
  if (error) throw error;
  console.log(
    "Invitation sent. The tester can follow the email to set their password.",
  );
}
