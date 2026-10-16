"use server";
import { requireUser } from "@/lib/auth/require-user";
import { safeReturnTo } from "@/lib/auth/return-to";
import {
  contactSchema,
  websiteSchema,
  instagramHandle,
} from "@/lib/validation/alpha";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ALL_SPECIALTIES } from "@/lib/constants/categories";
export type SeekerProfileState = { error?: string };
export async function upsertSeekerProfile(
  returnTo: string | null,
  _state: SeekerProfileState,
  data: FormData,
): Promise<SeekerProfileState> {
  const { supabase, user } = await requireUser("seeker");
  const parsed = contactSchema
    .extend({
      portfolioUrl: websiteSchema,
      bio: z.string().max(5000),
      headline: z.string().max(200),
      city: z.string().max(100),
      state: z.string().max(100),
      yearsExperience: z.union([
        z.literal(""),
        z.coerce.number().int().min(0).max(100),
      ]),
    })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let instagram: string | null;
  try {
    instagram = instagramHandle(String(data.get("instagramHandle") ?? ""));
  } catch {
    return { error: "Enter a valid Instagram handle or profile URL" };
  }
  const specialties = data.getAll("specialties").map(String);
  if (!specialties.every((s) => ALL_SPECIALTIES.includes(s)))
    return { error: "Choose valid specialties" };
  const v = parsed.data;
  const { error } = await supabase.from("seeker_profiles").upsert(
    {
      user_id: user.id,
      contact_email: v.email,
      phone: v.phone,
      city: v.city || null,
      state: v.state || null,
      specialties,
      headline: v.headline || null,
      bio: v.bio || null,
      portfolio_url: v.portfolioUrl || null,
      instagram_handle: instagram,
      years_experience: v.yearsExperience === "" ? null : v.yearsExperience,
      open_to_work: data.get("openToWork") === "on",
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: "Unable to save your profile. Please try again." };
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: v.fullName, profile_complete: true })
    .eq("id", user.id);
  if (profileError)
    return { error: "Unable to save your name. Please try again." };
  redirect(safeReturnTo(returnTo, "/seeker/profile?saved=1"));
}
