import { requireUser } from "@/lib/auth/require-user";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelativeDate } from "@/lib/utils";
export default async function Applications() {
  const { supabase, user } = await requireUser("seeker");
  const { data: seeker } = await supabase
    .from("seeker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: apps, error } = seeker
    ? await supabase
        .from("applications")
        .select(
          "id,status,applied_at,cover_letter,contact_email,phone,resume_path,resume_name,job_posts(id,title,city,state,status,employer_profiles(salon_name))",
        )
        .eq("seeker_id", seeker.id)
        .order("applied_at", { ascending: false })
    : { data: [], error: null };
  const entries = await Promise.all(
    (apps ?? []).map(async (app) => {
      const { data } = app.resume_path
        ? await supabase.storage
            .from("resumes")
            .createSignedUrl(app.resume_path, 300)
        : { data: null };
      return { ...app, resumeUrl: data?.signedUrl };
    }),
  );
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold">My applications</h1>
      {error ? (
        <p role="alert">Unable to load your applications. Please try again.</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border bg-card p-8">
          No applications yet.{" "}
          <Link className="underline" href="/jobs">
            Find your next role
          </Link>
        </p>
      ) : (
        entries.map((app) => (
          <article
            key={app.id}
            className="space-y-4 rounded-xl border bg-card p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {app.job_posts?.status === "active" ? (
                    <Link
                      className="hover:underline"
                      href={`/jobs/${app.job_posts.id}`}
                    >
                      {app.job_posts.title}
                    </Link>
                  ) : (
                    (app.job_posts?.title ?? "Listing unavailable")
                  )}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {app.job_posts?.employer_profiles?.salon_name} · Applied{" "}
                  {formatRelativeDate(app.applied_at)}
                  {app.job_posts?.status === "closed"
                    ? " · Listing closed"
                    : ""}
                </p>
              </div>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-sm">
              Submitted contact: {app.contact_email ?? "Not recorded"}
              {app.phone ? ` · ${app.phone}` : ""}
            </p>
            {app.resumeUrl && (
              <a
                className="inline-block text-sm underline"
                href={app.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Submitted resume · {app.resume_name ?? "PDF"}
              </a>
            )}
            {app.cover_letter && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">
                  Your cover letter
                </summary>
                <p className="mt-3 whitespace-pre-wrap">{app.cover_letter}</p>
              </details>
            )}
          </article>
        ))
      )}
    </div>
  );
}
