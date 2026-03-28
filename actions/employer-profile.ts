"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const employerProfileSchema = z.object({
  salonName: z.string().min(1, "Salon name is required"),
  locationCity: z.string().min(1, "City is required"),
  locationState: z.string().min(1, "State is required"),
  description: z.string().min(1, "Description is required"),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  instagramHandle: z.string().optional(),
});

export type EmployerProfileState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function upsertEmployerProfile(
  _prevState: EmployerProfileState,
  formData: FormData
): Promise<EmployerProfileState> {
  const parsed = employerProfileSchema.safeParse({
    salonName: formData.get("salonName"),
    locationCity: formData.get("locationCity"),
    locationState: formData.get("locationState"),
    description: formData.get("description"),
    websiteUrl: formData.get("websiteUrl"),
    instagramHandle: formData.get("instagramHandle"),
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

  const { salonName, locationCity, locationState, description, websiteUrl, instagramHandle } =
    parsed.data;

  const { error } = await supabase.from("employer_profiles").upsert(
    {
      user_id: user.id,
      salon_name: salonName,
      location_city: locationCity,
      location_state: locationState,
      description,
      website_url: websiteUrl || null,
      instagram_handle: instagramHandle || null,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("profiles")
    .update({ profile_complete: true })
    .eq("id", user.id);

  redirect("/employer/dashboard");
}

export type UploadLogoState = {
  error?: string;
  logoUrl?: string;
} | null;

export async function uploadLogo(
  _prevState: UploadLogoState,
  formData: FormData
): Promise<UploadLogoState> {
  const file = formData.get("logo") as File | null;

  if (!file || file.size === 0) {
    return { error: "No file selected" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only JPEG, PNG, and WebP images are allowed" };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { error: "File must be under 5MB" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${user.id}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("employer_profiles")
    .update({ logo_url: publicUrl })
    .eq("user_id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  return { logoUrl: publicUrl };
}
