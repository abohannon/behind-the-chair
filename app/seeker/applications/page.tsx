import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelativeDate } from "@/lib/utils";

export default async function SeekerApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: seekerProfile } = await supabase
    .from("seeker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!seekerProfile) {
    return (
      <div>
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="mt-2 text-muted-foreground">
          Complete your profile to start applying to jobs.
        </p>
      </div>
    );
  }

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, status, applied_at, job_posts(id, title, city, state, employer_profiles(salon_name))"
    )
    .eq("seeker_id", seekerProfile.id)
    .order("applied_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Applications</h1>
      {!applications || applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No applications yet.{" "}
              <Link href="/jobs" className="text-primary hover:underline">
                Browse jobs
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const job = app.job_posts as any;
            return (
              <Card key={app.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        <Link
                          href={`/jobs/${job?.id}`}
                          className="hover:underline"
                        >
                          {job?.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {job?.employer_profiles?.salon_name} &middot;{" "}
                        {job?.city}, {job?.state}
                      </CardDescription>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Applied {formatRelativeDate(app.applied_at)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
