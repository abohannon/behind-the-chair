"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ALL_SPECIALTIES } from "@/lib/constants/categories";

const seekerProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  specialties: z
    .array(z.string())
    .min(1, "Select at least one specialty")
    .refine((vals) => vals.every((v) => ALL_SPECIALTIES.includes(v)), {
      message: "Invalid specialty selected",
    }),
  headline: z.string().optional(),
  bio: z.string().optional(),
  portfolioUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  instagramHandle: z.string().optional(),
  yearsExperience: z.coerce.number().int().min(0).optional(),
  openToWork: z.boolean(),
});

export type SeekerProfileState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function upsertSeekerProfile(
  returnTo: string | null,
  _prevState: SeekerProfileState,
  formData: FormData
): Promise<SeekerProfileState> {
  const specialties = formData.getAll("specialties").map(String);
  const yearsRaw = formData.get("yearsExperience");

  const parsed = seekerProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    city: formData.get("city"),
    state: formData.get("state"),
    specialties,
    headline: formData.get("headline") || undefined,
    bio: formData.get("bio") || undefined,
    portfolioUrl: formData.get("portfolioUrl"),
    instagramHandle: formData.get("instagramHandle") || undefined,
    yearsExperience: yearsRaw ? Number(yearsRaw) : undefined,
    openToWork: formData.get("openToWork") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field) fieldErrors[String(field)] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  const {
    fullName,
    city,
    state,
    specialties: selectedSpecialties,
    headline,
    bio,
    portfolioUrl,
    instagramHandle,
    yearsExperience,
    openToWork,
  } = parsed.data;

  const { error } = await supabase.from("seeker_profiles").upsert(
    {
      user_id: user.id,
      city,
      state,
      specialties: selectedSpecialties,
      headline: headline || null,
      bio: bio || null,
      portfolio_url: portfolioUrl || null,
      instagram_handle: instagramHandle || null,
      years_experience: yearsExperience ?? null,
      open_to_work: openToWork,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("profiles")
    .update({ profile_complete: true, full_name: fullName })
    .eq("id", user.id);

  redirect(returnTo || "/jobs");
}

export type UploadResumeResult = {
  url: string | null;
  error: string | null;
};

export async function uploadResume(formData: FormData): Promise<UploadResumeResult> {
  const file = formData.get("resume") as File | null;

  if (!file || file.size === 0) {
    return { url: null, error: "No file selected" };
  }

  if (file.type !== "application/pdf") {
    return { url: null, error: "Only PDF files are allowed" };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { url: null, error: "File must be under 10MB" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { url: null, error: "You must be logged in" };
  }

  const path = `${user.id}/resume.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { error: updateError } = await supabase
    .from("seeker_profiles")
    .update({ resume_url: path })
    .eq("user_id", user.id);

  if (updateError) {
    return { url: null, error: updateError.message };
  }

  return { url: path, error: null };
}
