import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
const variables = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  RESEND_API_KEY: "",
  STRIPE_SECRET_KEY: "",
  STRIPE_PUBLISHABLE_KEY: "",
  STRIPE_WEBHOOK_SECRET: "",
};
if (!variables.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:"))
  throw new Error("Expected local Supabase");
writeFileSync(
  ".env.alpha",
  Object.entries(variables)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n",
  { mode: 0o600 },
);
console.log(
  "Local-only environment saved to ignored .env.alpha. Existing .env.local was preserved.",
);
