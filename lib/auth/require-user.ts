import "server-only";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireUser(role?: "employer" | "seeker") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !profile)
    throw new Error(
      "Your account profile is unavailable. Please contact the alpha organizer.",
    );
  if (role && profile.role !== role)
    redirect(profile.role === "employer" ? "/employer/dashboard" : "/jobs");
  return { supabase, user, profile };
}
