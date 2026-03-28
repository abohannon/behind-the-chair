"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe, PRICE_SINGLE_POST_CENTS } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  jobPostId: z.string().uuid("Invalid job post ID"),
});

export async function createCheckoutSession(
  jobPostId: string
): Promise<{ url: string | null; error: string | null }> {
  const parsed = checkoutSchema.safeParse({ jobPostId });
  if (!parsed.success) {
    return { url: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Not authenticated" };

  // Get employer profile
  const { data: employerProfile } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!employerProfile) return { url: null, error: "Employer profile not found" };

  // Verify job belongs to this employer and is draft
  const { data: job } = await supabase
    .from("job_posts")
    .select("id, title, status")
    .eq("id", jobPostId)
    .eq("employer_id", employerProfile.id)
    .single();
  if (!job) return { url: null, error: "Job not found" };
  if (job.status !== "draft") return { url: null, error: "Job is already published" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Job Post: ${job.title}` },
          unit_amount: PRICE_SINGLE_POST_CENTS,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${appUrl}/employer/jobs/${jobPostId}/success`,
    cancel_url: `${appUrl}/employer/dashboard`,
    metadata: {
      job_post_id: jobPostId,
      employer_id: employerProfile.id,
    },
  });

  return { url: session.url, error: null };
}
