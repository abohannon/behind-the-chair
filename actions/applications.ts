"use server";
import { requireUser } from "@/lib/auth/require-user";
import { contactSchema, ratingSchema } from "@/lib/validation/alpha";
import { z } from "zod";
import { revalidatePath } from "next/cache";
export type ApplyState = { success?: boolean; error?: string };
export async function submitApplication(
  _state: ApplyState,
  data: FormData,
): Promise<ApplyState> {
  const { supabase, user } = await requireUser("seeker");
  const parsed = contactSchema
    .extend({
      jobPostId: z.uuid(),
      resumePath: z.string().min(1),
      resumeName: z.string().min(1).max(255),
      coverLetter: z.string().max(5000),
    })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (!v.resumePath.startsWith(`${user.id}/`) || v.resumePath.includes(".."))
    return { error: "Upload your PDF resume again" };
  // Read via the user's scoped client. Check actual file signature, not only MIME.
  const { data: file, error: fileError } = await supabase.storage
    .from("resumes")
    .download(v.resumePath);
  if (
    fileError ||
    !file ||
    file.size > 10 * 1024 * 1024 ||
    (await file.slice(0, 5).text()) !== "%PDF-"
  )
    return { error: "Upload a valid PDF resume, 10 MB or smaller" };
  const { error } = await supabase.rpc("submit_application", {
    job_id: v.jobPostId,
    applicant_name: v.fullName,
    email: v.email,
    telephone: v.phone,
    letter: v.coverLetter,
    file_path: v.resumePath,
    file_name: v.resumeName,
  });
  if (error) {
    // Never delete on an ambiguous response: a committed application may already
    // reference the file. Storage policy also forbids deleting submitted resumes.
    if (error.code === "23505")
      return { error: "You have already applied to this job" };
    return {
      error: error.message.includes("no longer")
        ? "This job is no longer accepting applications"
        : "Unable to submit. Your resume is uploaded; please retry.",
    };
  }
  revalidatePath("/seeker/applications");
  revalidatePath(`/jobs/${v.jobPostId}`);
  return { success: true };
}
export async function updateApplicationStatus(
  applicationId: string,
  status: string,
): Promise<{ error?: string }> {
  const parsed = z
    .object({
      applicationId: z.uuid(),
      status: z.enum([
        "submitted",
        "reviewed",
        "interview",
        "rejected",
        "hired",
      ]),
    })
    .safeParse({ applicationId, status });
  if (!parsed.success) return { error: "Invalid status" };
  const { supabase } = await requireUser("employer");
  const { data, error } = await supabase
    .from("applications")
    .update({ status: parsed.data.status })
    .eq("id", applicationId)
    .select("id")
    .single();
  if (error || !data) return { error: "Unable to update this application" };
  revalidatePath("/employer");
  revalidatePath("/seeker/applications");
  return {};
}
export async function updateApplicationRating(
  applicationId: string,
  rating: number | null,
): Promise<{ error?: string }> {
  if (
    !z.uuid().safeParse(applicationId).success ||
    !ratingSchema.safeParse(rating).success
  )
    return { error: "Choose an integer rating from 1 to 5" };
  const { supabase } = await requireUser("employer");
  const { data: owned } = await supabase.rpc("owns_application", {
    application: applicationId,
  });
  if (!owned) return { error: "Application not found" };
  const { error } =
    rating === null
      ? await supabase
          .from("application_ratings")
          .delete()
          .eq("application_id", applicationId)
      : await supabase
          .from("application_ratings")
          .upsert(
            { application_id: applicationId, rating },
            { onConflict: "application_id" },
          );
  if (error) return { error: "Unable to save rating. Please try again." };
  revalidatePath("/employer");
  return {};
}
