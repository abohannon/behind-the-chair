import { requireUser } from "@/lib/auth/require-user";
import { JobForm } from "@/components/forms/job-form";
import { notFound } from "next/navigation";
export default async function EditJob({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireUser("employer");
  const { id } = await params;
  const { data: owns } = await supabase.rpc("owns_job", { job_id: id });
  if (!owns) notFound();
  const { data: job } = await supabase
    .from("job_posts")
    .select("*")
    .eq("id", id)
    .single();
  if (!job) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold">Edit listing</h1>
      <JobForm initial={job} />
    </div>
  );
}
