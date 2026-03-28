"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATEGORIES, SPECIALTIES, type Category } from "@/lib/constants/categories";

const jobPostSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    jobType: z.enum(["booth_rental", "commission", "salary", "hourly"], {
      error: "Please select a job type",
    }),
    experienceLevel: z.enum(["entry", "mid", "senior"], {
      error: "Please select an experience level",
    }),
    category: z.enum(CATEGORIES as unknown as [string, ...string[]], {
      error: "Please select a category",
    }),
    specialties: z.array(z.string()).default([]),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    payRangeLow: z.string().optional(),
    payRangeHigh: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.specialties.length === 0) return true;
      const categorySpecialties = SPECIALTIES[data.category as Category] ?? [];
      return data.specialties.every((s) => categorySpecialties.includes(s));
    },
    { message: "Selected specialties must belong to the chosen category", path: ["specialties"] }
  );

export type JobPostState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function createJobPost(
  _prevState: JobPostState,
  formData: FormData
): Promise<JobPostState> {
  const specialtiesRaw = formData.getAll("specialties");

  const parsed = jobPostSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    jobType: formData.get("jobType"),
    experienceLevel: formData.get("experienceLevel"),
    category: formData.get("category"),
    specialties: specialtiesRaw.map(String),
    city: formData.get("city"),
    state: formData.get("state"),
    payRangeLow: formData.get("payRangeLow"),
    payRangeHigh: formData.get("payRangeHigh"),
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

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!employer) {
    return { error: "Please complete your employer profile first" };
  }

  const {
    title,
    description,
    jobType,
    experienceLevel,
    category,
    specialties,
    city,
    state,
    payRangeLow,
    payRangeHigh,
  } = parsed.data;

  const payLowCents = payRangeLow ? Math.round(parseFloat(payRangeLow) * 100) : null;
  const payHighCents = payRangeHigh ? Math.round(parseFloat(payRangeHigh) * 100) : null;

  const { data: jobPost, error } = await supabase
    .from("job_posts")
    .insert({
      employer_id: employer.id,
      title,
      description,
      job_type: jobType,
      experience_level: experienceLevel,
      category,
      specialties,
      city,
      state,
      pay_range_low: payLowCents,
      pay_range_high: payHighCents,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/employer/jobs/${jobPost.id}/preview`);
}

export async function updateJobPost(
  jobId: string,
  _prevState: JobPostState,
  formData: FormData
): Promise<JobPostState> {
  const specialtiesRaw = formData.getAll("specialties");

  const parsed = jobPostSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    jobType: formData.get("jobType"),
    experienceLevel: formData.get("experienceLevel"),
    category: formData.get("category"),
    specialties: specialtiesRaw.map(String),
    city: formData.get("city"),
    state: formData.get("state"),
    payRangeLow: formData.get("payRangeLow"),
    payRangeHigh: formData.get("payRangeHigh"),
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

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!employer) {
    return { error: "Please complete your employer profile first" };
  }

  const {
    title,
    description,
    jobType,
    experienceLevel,
    category,
    specialties,
    city,
    state,
    payRangeLow,
    payRangeHigh,
  } = parsed.data;

  const payLowCents = payRangeLow ? Math.round(parseFloat(payRangeLow) * 100) : null;
  const payHighCents = payRangeHigh ? Math.round(parseFloat(payRangeHigh) * 100) : null;

  const { error } = await supabase
    .from("job_posts")
    .update({
      title,
      description,
      job_type: jobType,
      experience_level: experienceLevel,
      category,
      specialties,
      city,
      state,
      pay_range_low: payLowCents,
      pay_range_high: payHighCents,
    })
    .eq("id", jobId)
    .eq("employer_id", employer.id);

  if (error) {
    return { error: error.message };
  }

  redirect(`/employer/jobs/${jobId}/preview`);
}
