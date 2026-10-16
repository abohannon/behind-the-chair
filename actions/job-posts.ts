"use server";
import { requireUser } from "@/lib/auth/require-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  CATEGORIES,
  SPECIALTIES,
  type Category,
} from "@/lib/constants/categories";
const amount = z.union([
  z.literal(""),
  z.coerce.number().finite().min(0).max(10000000),
]);
const jobSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().min(1, "Description is required").max(20000),
    category: z.enum(CATEGORIES),
    experienceLevel: z.enum(["entry", "mid", "senior"]),
    arrangement: z.enum(["employment", "booth_rental"]),
    schedule: z.enum(["full_time", "part_time", "flexible"]),
    payUnit: z.enum(["", "hour", "year", "week", "month"]),
    payRangeLow: amount,
    payRangeHigh: amount,
    commissionPercent: z.union([
      z.literal(""),
      z.coerce.number().finite().min(0).max(100),
    ]),
  })
  .superRefine((v, c) => {
    if (
      v.payRangeLow !== "" &&
      v.payRangeHigh !== "" &&
      v.payRangeLow > v.payRangeHigh
    )
      c.addIssue({
        code: "custom",
        message: "Minimum pay must not exceed maximum pay",
      });
    if ((v.payRangeLow !== "" || v.payRangeHigh !== "") && !v.payUnit)
      c.addIssue({
        code: "custom",
        message: "Choose a pay unit for the amount",
      });
    if (
      v.payUnit &&
      ((v.arrangement === "employment" &&
        !["hour", "year"].includes(v.payUnit)) ||
        (v.arrangement === "booth_rental" &&
          !["week", "month"].includes(v.payUnit)))
    )
      c.addIssue({
        code: "custom",
        message:
          "Employment uses hourly or annual pay; booth rent uses weekly or monthly rates",
      });
    if (v.arrangement === "booth_rental" && v.commissionPercent !== "")
      c.addIssue({
        code: "custom",
        message: "Commission is only available for employment",
      });
  });
export type JobPostState = { error?: string };
async function save(
  jobId: string | null,
  data: FormData,
): Promise<JobPostState> {
  const { supabase, user } = await requireUser("employer");
  const parsed = jobSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const specialties = data.getAll("specialties").map(String);
  const v = parsed.data;
  if (
    !specialties.every((s) => SPECIALTIES[v.category as Category].includes(s))
  )
    return { error: "Choose specialties within the selected industry" };
  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!employer) return { error: "Save your business profile first" };
  const fields = {
    title: v.title,
    description: v.description,
    category: v.category,
    experience_level: v.experienceLevel,
    arrangement: v.arrangement,
    schedule: v.schedule,
    pay_unit: v.payUnit || null,
    commission_percent: v.commissionPercent === "" ? null : v.commissionPercent,
    pay_range_low:
      v.payRangeLow === "" ? null : Math.round(v.payRangeLow * 100),
    pay_range_high:
      v.payRangeHigh === "" ? null : Math.round(v.payRangeHigh * 100),
    job_type:
      v.arrangement === "booth_rental"
        ? ("booth_rental" as const)
        : v.payUnit === "year"
          ? ("salary" as const)
          : v.payUnit === "hour"
            ? ("hourly" as const)
            : ("commission" as const),
    specialties,
    city: "Portland",
    state: "OR",
  };
  const result = jobId
    ? await supabase
        .from("job_posts")
        .update(fields)
        .eq("id", jobId)
        .eq("employer_id", employer.id)
        .select("id")
        .single()
    : await supabase
        .from("job_posts")
        .insert({ ...fields, employer_id: employer.id, status: "draft" })
        .select("id")
        .single();
  if (result.error || !result.data)
    return { error: "Unable to save this job. Please try again." };
  revalidatePath("/jobs");
  redirect(`/employer/jobs/${result.data.id}/preview`);
}
export async function createJobPost(_state: JobPostState, data: FormData) {
  return save(null, data);
}
export async function updateJobPost(
  id: string,
  _state: JobPostState,
  data: FormData,
) {
  return save(id, data);
}
export async function setJobStatus(id: string, status: "active" | "closed") {
  if (!z.uuid().safeParse(id).success || !["active", "closed"].includes(status))
    return { error: "Invalid job" };
  const { supabase } = await requireUser("employer");
  const { error } = await supabase.rpc("set_job_status", {
    job_id: id,
    new_status: status,
  });
  if (error)
    return {
      error: "Unable to update the listing. Check its details and try again.",
    };
  revalidatePath("/jobs");
  revalidatePath("/employer/dashboard");
  revalidatePath(`/employer/jobs/${id}/preview`);
  return {};
}
