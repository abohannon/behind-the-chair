"use server";
import { requireUser } from "@/lib/auth/require-user";
import { websiteSchema, instagramHandle } from "@/lib/validation/alpha";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hoursFromForm } from "@/lib/validation/business";
export async function upsertEmployerProfile(
  _state: { error?: string },
  data: FormData,
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser("employer");
  const parsed = z
    .object({
      salonName: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1).max(10000),
      websiteUrl: websiteSchema,
      streetAddress: z.string().trim().max(250).default(""),
    })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let instagram: string | null;
  try {
    instagram = instagramHandle(String(data.get("instagramHandle") ?? ""));
  } catch {
    return { error: "Enter a valid Instagram handle or profile URL" };
  }
  let hours;
  try {
    hours = hoursFromForm(data);
  } catch {
    return {
      error:
        "Check your business hours. Use a closing time after opening on the same day.",
    };
  }
  const { data: saved, error } = await supabase
    .from("employer_profiles")
    .upsert(
      {
        user_id: user.id,
        salon_name: parsed.data.salonName,
        description: parsed.data.description,
        website_url: parsed.data.websiteUrl || null,
        instagram_handle: instagram,
        street_address: parsed.data.streetAddress || null,
        operating_hours: Object.keys(hours).length ? hours : null,
        location_city: "Portland",
        location_state: "OR",
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();
  if (error || !saved)
    return { error: "Unable to save your business. Please try again." };
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ profile_complete: true })
    .eq("id", user.id);
  if (profileError)
    return { error: "Unable to finish your profile. Please try again." };
  revalidatePath(`/businesses/${saved.id}`);
  revalidatePath("/jobs", "layout");
  redirect("/employer/profile?saved=1");
}
export async function uploadBusinessImage(
  _state: { error?: string },
  data: FormData,
) {
  const { supabase, user } = await requireUser("employer");
  const { data: business } = await supabase
    .from("employer_profiles")
    .select("id,photos,logo_url")
    .eq("user_id", user.id)
    .single();
  if (!business)
    return { error: "Save your business details before uploading images." };
  const path = String(data.get("path") ?? "");
  if (!path.startsWith(`${user.id}/`) || path.includes(".."))
    return { error: "Upload your image again." };
  const { data: file, error: fileError } = await supabase.storage
    .from("logos")
    .download(path);
  if (
    fileError ||
    !file ||
    file.size > 5 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    return { error: "Choose a JPEG, PNG or WebP image, 5 MB or smaller." };
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const validImage =
    (file.type === "image/png" &&
      bytes[0] === 137 &&
      bytes[1] === 80 &&
      bytes[2] === 78 &&
      bytes[3] === 71) ||
    (file.type === "image/jpeg" &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255) ||
    (file.type === "image/webp" &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP");
  if (!validImage)
    return { error: "This file does not contain a supported image." };
  const photos = Array.isArray(business.photos)
    ? business.photos.filter((v): v is string => typeof v === "string")
    : [];
  const isLogo = data.get("kind") === "logo";
  if (!isLogo && photos.length >= 5)
    return { error: "Your gallery can contain up to five photos." };
  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(path);
  const { data: updated, error: saveError } = await supabase
    .from("employer_profiles")
    .update(
      isLogo ? { logo_url: publicUrl } : { photos: [...photos, publicUrl] },
    )
    .eq("id", business.id)
    .select("id")
    .single();
  if (saveError || !updated) {
    await supabase.storage.from("logos").remove([path]);
    return { error: "Unable to attach image. Please try again." };
  }
  revalidatePath("/employer/profile");
  revalidatePath("/businesses/[id]", "page");
  revalidatePath("/jobs", "layout");
  return {};
}
export async function removeBusinessPhoto(data: FormData) {
  const { supabase, user } = await requireUser("employer");
  const url = String(data.get("url") ?? "");
  const { data: business } = await supabase
    .from("employer_profiles")
    .select("id,photos")
    .eq("user_id", user.id)
    .single();
  if (
    !business ||
    !Array.isArray(business.photos) ||
    !business.photos.includes(url)
  )
    throw new Error("Photo not found");
  const { error } = await supabase
    .from("employer_profiles")
    .update({ photos: business.photos.filter((p) => p !== url) })
    .eq("id", business.id);
  if (error) throw new Error("Unable to remove photo");
  const prefix = supabase.storage.from("logos").getPublicUrl(`${user.id}/`)
    .data.publicUrl;
  if (url.startsWith(prefix))
    await supabase.storage
      .from("logos")
      .remove([`${user.id}/${url.slice(prefix.length)}`]);
  revalidatePath("/employer/profile");
  revalidatePath("/businesses/[id]", "page");
  revalidatePath("/jobs", "layout");
}
export async function moveBusinessPhoto(data: FormData) {
  const { supabase, user } = await requireUser("employer");
  const { data: b } = await supabase
    .from("employer_profiles")
    .select("id,photos")
    .eq("user_id", user.id)
    .single();
  if (!b || !Array.isArray(b.photos)) throw new Error("Business not found");
  const photos = [...b.photos];
  const index = photos.indexOf(String(data.get("url")));
  if (index <= 0) return;
  [photos[index - 1], photos[index]] = [photos[index], photos[index - 1]];
  const { error } = await supabase
    .from("employer_profiles")
    .update({ photos })
    .eq("id", b.id);
  if (error) throw new Error("Unable to reorder photos");
  revalidatePath("/employer/profile");
  revalidatePath("/businesses/[id]", "page");
  revalidatePath("/jobs", "layout");
}
