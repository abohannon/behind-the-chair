"use server";
import { createClient } from "@/lib/supabase/server";
import { safeReturnTo } from "@/lib/auth/return-to";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function signUp(
  _state: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = z
    .object({
      email: z.email(),
      password: z.string().min(8).max(128),
      role: z.enum(["employer", "seeker"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: "Enter a valid email and a password of 8–128 characters." };
  const supabase = await createClient();
  // Only the two public account types are accepted; existing roles cannot change.
  const { email, password, role } = parsed.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });
  if (error)
    return {
      error:
        error.code === "user_already_exists" || error.code === "email_exists"
          ? "This email already has an account. Sign in or use your invitation link."
          : "Unable to create your account. Please try again shortly.",
    };
  if (!data.session)
    return {
      error: "Check your email to confirm your account before signing in.",
    };
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user!.id)
    .single();
  if (profileError || !profile)
    return {
      error:
        "Your account was created, but we could not load your profile. Please sign in again.",
    };
  redirect(profile.role === "seeker" ? "/seeker/profile" : "/employer/profile");
}

export async function signIn(formData: FormData) {
  const parsed = z
    .object({ email: z.email(), password: z.string().min(1) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter your email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error)
    return { error: "Unable to sign in. Check your email and password." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  redirect(
    safeReturnTo(
      formData.get("returnTo"),
      profile?.role === "employer" ? "/employer/dashboard" : "/jobs",
    ),
  );
}
export async function requestPasswordReset(
  _state: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback?next=/set-password`,
  });
  if (error)
    return {
      error: "Unable to send a recovery email. Please try again shortly.",
    };
  return { success: true };
}
export async function setPassword(
  _state: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const password = z
    .string()
    .min(8, "Use at least 8 characters")
    .max(128)
    .safeParse(formData.get("password"));
  if (!password.success) return { error: password.error.issues[0].message };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: "This link has expired. Request a new password recovery email.",
    };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: error.message };
  redirect("/");
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
