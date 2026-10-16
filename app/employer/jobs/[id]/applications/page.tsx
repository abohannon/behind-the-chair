import { requireUser } from "@/lib/auth/require-user";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { APPLICATION_STATUSES } from "@/lib/constants/categories";
import { PublishButton } from "../preview/publish-button";
export default async function Applicants({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; rating?: string; sort?: string }>;
}) {
  const { supabase } = await requireUser("employer");
  const { id } = await params;
  const filters = await searchParams;
  const { data: owns } = await supabase.rpc("owns_job", { job_id: id });
  if (!owns) notFound();
  const { data: job } = await supabase
    .from("job_posts")
    .select("id,title,status")
    .eq("id", id)
    .single();
  if (!job) notFound();
  const { data: applications, error } = await supabase
    .from("applications")
    .select(
      "id,status,applied_at,submitted_name,seeker_profiles(headline,profiles(full_name)),application_ratings(rating)",
    )
    .eq("job_post_id", id)
    .order("applied_at", { ascending: false });
  const list = (applications ?? []).filter(
    (a) =>
      (!filters.status || a.status === filters.status) &&
      (!filters.rating ||
        (filters.rating === "unrated"
          ? a.application_ratings === null
          : a.application_ratings?.rating === Number(filters.rating))),
  );
  if (filters.sort === "rating")
    list.sort(
      (a, b) =>
        (b.application_ratings?.rating ?? 0) -
        (a.application_ratings?.rating ?? 0),
    );
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link className="text-sm underline" href="/employer/dashboard">
        ← Dashboard
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{job.title}</h1>
          <p className="mt-2 text-muted-foreground">
            Candidates · <StatusBadge status={job.status} />
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            className="text-sm underline"
            href={`/employer/jobs/${id}/edit`}
          >
            Edit listing
          </Link>
          <PublishButton jobId={id} status={job.status} />
        </div>
      </div>
      <form className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <label className="text-sm">
          Stage
          <select
            className="mt-1 block rounded border p-2"
            name="status"
            aria-label="Stage"
            defaultValue={filters.status ?? ""}
          >
            <option value="">All stages</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Rating
          <select
            className="mt-1 block rounded border p-2"
            name="rating"
            aria-label="Rating"
            defaultValue={filters.rating ?? ""}
          >
            <option value="">All ratings</option>
            <option value="unrated">Unrated</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Sort
          <select
            className="mt-1 block rounded border p-2"
            name="sort"
            aria-label="Sort"
            defaultValue={filters.sort ?? ""}
          >
            <option value="">Newest first</option>
            <option value="rating">Highest rated first</option>
          </select>
        </label>
        <button className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
          Apply filters
        </button>
        <Link
          className="text-sm underline"
          href={`/employer/jobs/${id}/applications`}
        >
          Reset
        </Link>
      </form>
      {error ? (
        <p role="alert">Unable to load candidates. Please try again.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {list.length} candidate{list.length === 1 ? "" : "s"}
          </p>
          {list.length === 0 && (
            <p className="rounded-xl border p-8">
              {applications?.length
                ? "No candidates match these filters."
                : "No applications yet."}
            </p>
          )}
          <div className="space-y-3">
            {list.map((a) => (
              <Link
                key={a.id}
                href={`/employer/jobs/${id}/applications/${a.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-5 transition-colors hover:bg-muted"
              >
                <div>
                  <h2 className="font-semibold">
                    {a.submitted_name ??
                      a.seeker_profiles?.profiles?.full_name ??
                      "Applicant"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {a.seeker_profiles?.headline}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">
                    {a.application_ratings
                      ? `${a.application_ratings.rating} / 5`
                      : "Unrated"}
                  </span>
                  <StatusBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
