import { JobExtraDetails } from "@/components/shared/job-extra-details";
import { requireUser } from "@/lib/auth/require-user";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCompensation } from "@/lib/utils";
import { JOB_TYPES, EXPERIENCE_LEVELS } from "@/lib/constants/categories";
import { PublishButton } from "./publish-button";

export default async function JobPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser("employer");
  const { data: owns } = await supabase.rpc("owns_job", { job_id: id });
  if (!owns) notFound();

  const { data: job } = await supabase
    .from("job_posts")
    .select("*, employer_profiles(*)")
    .eq("id", id)
    .single();

  if (!job) {
    redirect("/employer/dashboard");
  }

  const jobTypeLabel =
    JOB_TYPES.find((t) => t.value === job.job_type)?.label ?? job.job_type;
  const expLabel =
    EXPERIENCE_LEVELS.find((l) => l.value === job.experience_level)?.label ??
    job.experience_level;
  const specialties = Array.isArray(job.specialties)
    ? (job.specialties as string[])
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Preview</h1>
        <StatusBadge status={job.status} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{job.title}</CardTitle>
          <CardDescription>
            {job.employer_profiles?.salon_name} &middot; {job.city}, {job.state}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-medium text-muted-foreground">
              Description
            </h3>
            <p className="whitespace-pre-wrap">{job.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{jobTypeLabel}</Badge>
            <Badge variant="secondary">{expLabel}</Badge>
            <Badge variant="secondary">{job.category}</Badge>
          </div>

          {specialties.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                Specialties
              </h3>
              <div className="flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <JobExtraDetails job={job} />
          <div>
            <h3 className="mb-1 text-sm font-medium text-muted-foreground">
              Pay Range
            </h3>
            <p>{formatCompensation(job)}</p>
          </div>
        </CardContent>
      </Card>

      {
        <div className="flex gap-4">
          <div className="flex-1">
            <PublishButton jobId={job.id} status={job.status} />
          </div>
          <Button variant="outline" asChild className="flex-1">
            <Link href={`/employer/jobs/${job.id}/edit`}>Edit Post</Link>
          </Button>
        </div>
      }
    </div>
  );
}
