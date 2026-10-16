import { requireUser } from "@/lib/auth/require-user";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusSelect } from "./status-select";
import { RatingSelect } from "./rating-select";
import { formatRelativeDate } from "@/lib/utils";
export default async function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string; appId: string }>;
}) {
  const { supabase } = await requireUser("employer");
  const { id, appId } = await params;
  const { data: owns } = await supabase.rpc("owns_job", { job_id: id });
  if (!owns) notFound();
  const { data: app, error } = await supabase
    .from("applications")
    .select(
      "*,seeker_profiles(*,profiles(full_name)),job_posts(title),application_ratings(rating)",
    )
    .eq("id", appId)
    .eq("job_post_id", id)
    .single();
  if (error || !app) notFound();
  const seeker = app.seeker_profiles;
  const name = app.submitted_name ?? seeker?.profiles?.full_name ?? "Applicant";
  let resume: string | null = null;
  if (app.resume_path) {
    const { data } = await supabase.storage
      .from("resumes")
      .createSignedUrl(app.resume_path, 300);
    resume = data?.signedUrl ?? null;
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        className="text-sm underline"
        href={`/employer/jobs/${id}/applications`}
      >
        ← All candidates
      </Link>
      <section className="space-y-5 rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{app.job_posts?.title}</p>
            <h1 className="mt-2 text-3xl font-semibold">{name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Applied {formatRelativeDate(app.applied_at)}
            </p>
          </div>
          <StatusSelect applicationId={app.id} currentStatus={app.status} />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {app.contact_email && (
            <a className="underline" href={`mailto:${app.contact_email}`}>
              {app.contact_email}
            </a>
          )}
          {app.phone && (
            <a
              className="underline"
              href={`tel:${app.phone.replace(/[^+\d]/g, "")}`}
            >
              {app.phone}
            </a>
          )}
        </div>
        {!app.contact_email && (
          <p className="text-sm text-muted-foreground">
            This earlier application has no submitted contact details.
          </p>
        )}
        <RatingSelect
          applicationId={app.id}
          initial={app.application_ratings?.rating ?? null}
        />
      </section>
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Application</h2>
        {resume ? (
          <a
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            href={resume}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open resume · {app.resume_name ?? "PDF"}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            {app.resume_path
              ? "Resume could not be loaded. Refresh to try again."
              : "No application-specific resume on this earlier submission."}
          </p>
        )}
        <h3 className="font-medium">Cover letter</h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {app.cover_letter || "No cover letter provided."}
        </p>
      </section>
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Current profile</h2>
        <p className="font-medium">{seeker?.headline}</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {seeker?.bio || "No bio provided."}
        </p>
        <p className="text-sm text-muted-foreground">
          {[seeker?.city, seeker?.state].filter(Boolean).join(", ")}
          {seeker?.years_experience != null
            ? ` · ${seeker.years_experience} years of experience`
            : ""}
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          {seeker?.instagram_handle && (
            <a
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://instagram.com/${seeker.instagram_handle.replace(/^@/, "")}`}
            >
              Instagram
            </a>
          )}
          {seeker?.portfolio_url &&
            /^https?:\/\//i.test(seeker.portfolio_url) && (
              <a
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
                href={seeker.portfolio_url}
              >
                Portfolio
              </a>
            )}
        </div>
      </section>
    </div>
  );
}
