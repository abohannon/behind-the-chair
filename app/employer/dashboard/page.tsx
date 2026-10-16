import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelativeDate } from "@/lib/utils";

export default async function EmployerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id, salon_name")
    .eq("user_id", user.id)
    .single();

  if (!employer) {
    redirect("/employer/profile");
  }

  const { data: jobs, error: jobsError } = await supabase
    .from("job_posts")
    .select(
      "id, title, status, city, state, created_at, posted_at, applications(count)",
    )
    .eq("employer_id", employer.id)
    .order("created_at", { ascending: false });

  if (jobsError)
    throw new Error("Unable to load your listings. Please try again.");
  const jobList = jobs ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">{employer.salon_name}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={`/businesses/${employer.id}`}>View public page</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/employer/profile">Business profile</Link>
          </Button>
          <Button asChild>
            <Link href="/employer/jobs/new">Post a Job</Link>
          </Button>
        </div>
      </div>

      {jobList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">
              You haven&apos;t posted any jobs yet.
            </p>
            <Button asChild>
              <Link href="/employer/jobs/new">Post a Job</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobList.map((job) => {
            const appCount = job.applications?.[0]?.count ?? 0;
            const jobHref =
              job.status !== "draft"
                ? `/employer/jobs/${job.id}/applications`
                : `/employer/jobs/${job.id}/preview`;

            return (
              <Card key={job.id}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle>
                      <Link href={jobHref} className="hover:underline">
                        {job.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {job.city}, {job.state} &middot;{" "}
                      {formatRelativeDate(job.created_at)}
                      {job.status === "active" && (
                        <>
                          {" "}
                          &middot; {appCount} application
                          {appCount !== 1 ? "s" : ""}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <StatusBadge status={job.status} />
                </CardHeader>
                {job.status === "draft" && (
                  <CardContent>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/employer/jobs/${job.id}/preview`}>
                        Preview & publish
                      </Link>
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
