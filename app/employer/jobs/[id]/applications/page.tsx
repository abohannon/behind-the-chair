import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelativeDate } from "@/lib/utils";

export default async function ApplicationsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify employer owns this job
  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!employer) redirect("/employer/profile");

  const { data: job } = await supabase
    .from("job_posts")
    .select("id, title")
    .eq("id", id)
    .eq("employer_id", employer.id)
    .single();
  if (!job) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, status, applied_at, cover_letter, seeker_profiles(id, user_id, headline, city, state, specialties, profiles(full_name, avatar_url))"
    )
    .eq("job_post_id", id)
    .order("applied_at", { ascending: false });

  const appList = applications ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/employer/dashboard"
        className="text-sm text-muted-foreground hover:underline"
      >
        &larr; Back to Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Applications for {job.title}</h1>
      <p className="mb-6 text-muted-foreground">
        {appList.length} application{appList.length !== 1 ? "s" : ""}
      </p>

      {appList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">No applications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appList.map((app) => {
            const seeker = app.seeker_profiles as any;
            const profile = seeker?.profiles as any;
            const name = profile?.full_name ?? "Unknown";
            const avatarUrl = profile?.avatar_url;
            const initials = name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const specialties = (seeker?.specialties as string[]) ?? [];

            return (
              <Link
                key={app.id}
                href={`/employer/jobs/${id}/applications/${app.id}`}
                className="block"
              >
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader className="flex-row items-center gap-4 space-y-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={avatarUrl ?? undefined} alt={name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-base">{name}</CardTitle>
                      <CardDescription>
                        {seeker?.headline && <>{seeker.headline} &middot; </>}
                        {seeker?.city && seeker?.state && (
                          <>
                            {seeker.city}, {seeker.state} &middot;{" "}
                          </>
                        )}
                        Applied {formatRelativeDate(app.applied_at)}
                      </CardDescription>
                    </div>
                    <StatusBadge status={app.status} />
                  </CardHeader>
                  {specialties.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {specialties.slice(0, 4).map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                        {specialties.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{specialties.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
