"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const applySchema = z.object({
  jobPostId: z.string().uuid("Invalid job post ID"),
  coverLetter: z.string().max(5000, "Cover letter too long").optional(),
});

export type ApplyState = {
  success?: boolean;
  error?: string;
};

export async function submitApplication(
  _prevState: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = applySchema.safeParse({
    jobPostId: formData.get("jobPostId"),
    coverLetter: formData.get("coverLetter"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { jobPostId, coverLetter } = parsed.data;

  // Get seeker profile
  const { data: seekerProfile } = await supabase
    .from("seeker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!seekerProfile) return { error: "Please complete your profile first" };

  // Check duplicate
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("job_post_id", jobPostId)
    .eq("seeker_id", seekerProfile.id)
    .single();
  if (existing) return { error: "You've already applied to this job" };

  // Insert
  const { error: insertError } = await supabase.from("applications").insert({
    job_post_id: jobPostId,
    seeker_id: seekerProfile.id,
    cover_letter: coverLetter || null,
  });
  if (insertError) return { error: insertError.message };

  // Fire-and-forget email
  sendApplicationEmail(supabase, jobPostId, user.id).catch(console.error);

  return { success: true };
}

async function sendApplicationEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobPostId: string,
  seekerUserId: string
) {
  // Get job + employer info
  const { data: job } = await supabase
    .from("job_posts")
    .select("title, employer_id, employer_profiles(user_id)")
    .eq("id", jobPostId)
    .single();
  if (!job?.employer_profiles) return;

  const employerUserId = (job.employer_profiles as { user_id: string })
    .user_id;

  // Get employer email via admin client (need to read from auth.users)
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminSupabase = createAdminClient();
  const { data: authData } =
    await adminSupabase.auth.admin.getUserById(employerUserId);
  if (!authData?.user?.email) return;

  // Get seeker name
  const { data: seekerProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", seekerUserId)
    .single();
  const seekerName = seekerProfile?.full_name || "A job seeker";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  try {
    await resend.emails.send({
      from: "SalonJobs <notifications@salonjobs.com>",
      to: authData.user.email,
      subject: `New application for ${job.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>New Application</h2>
          <p>${seekerName} applied to your <strong>${job.title}</strong> position.</p>
          <a href="${appUrl}/employer/jobs/${jobPostId}/applications"
             style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 12px;">
            View Application
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send application email:", err);
  }
}

const updateStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["submitted", "reviewed", "interview", "rejected", "hired"]),
});

export async function updateApplicationStatus(
  applicationId: string,
  status: string
): Promise<{ error?: string }> {
  const parsed = updateStatusSchema.safeParse({ applicationId, status });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("applications")
    .update({ status: parsed.data.status as any })
    .eq("id", applicationId);

  if (error) return { error: error.message };
  return {};
}
