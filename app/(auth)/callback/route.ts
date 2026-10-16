import { createClient } from "@/lib/supabase/server";
import { safeReturnTo } from "@/lib/auth/return-to";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const supabase = await createClient();
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  let error: unknown = "Invalid link";
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (token_hash && (type === "invite" || type === "recovery")) {
    ({ error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    }));
  }
  if (error)
    return NextResponse.redirect(
      new URL("/forgot-password?error=expired", origin),
    );
  const destination =
    type === "invite" ||
    type === "recovery" ||
    searchParams.get("next") === "/set-password"
      ? "/set-password"
      : safeReturnTo(searchParams.get("next"));
  return NextResponse.redirect(new URL(destination, origin));
}
