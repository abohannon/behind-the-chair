import { JobSearchForm } from "@/components/shared/job-search-form";
import { roleMatchesIndustry } from "@/lib/constants/job-roles";
import { createClient } from "@/lib/supabase/server";
import { JobCard } from "@/components/shared/job-card";
import { CATEGORIES } from "@/lib/constants/categories";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Portland beauty jobs | Behind the Chair",
  description:
    "Find your next role in hair, nails, skin, and beauty in Portland, Oregon.",
};
export default async function Jobs({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    role?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim().slice(0, 120);
  const category = CATEGORIES.find((c) => c === params.category) ?? "";
  const role =
    params.role && roleMatchesIndustry(params.role, category)
      ? params.role
      : "";
  const rawPage = Number(params.page);
  const page =
    Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10000) : 1;
  const size = 12;
  const supabase = await createClient();
  const {
    data: jobs,
    error,
    count,
  } = await supabase
    .rpc(
      "search_jobs_v2",
      { keyword: q, industry: category, job_role: role },
      { count: "exact" },
    )
    .select("*,employer_profiles(salon_name,logo_url)")
    .order("posted_at", { ascending: false })
    .order("id")
    .range((page - 1) * size, page * size - 1);
  function href(next: number) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (role) p.set("role", role);
    p.set("page", String(next));
    return `/jobs?${p}`;
  }
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-card px-6 py-10 sm:px-10">
        <p className="eyebrow">BEHIND THE CHAIR · PORTLAND, OREGON</p>
        <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Good work. Great people.
          <br />
          Your next chapter.
        </h1>
        <p className="mt-4 max-w-lg text-muted-foreground">
          Find your place in Portland’s beauty community. Explore opportunities
          in hair, nails, skin, and more.
        </p>
        <JobSearchForm
          key={`${q}:${category}:${role}`}
          keyword={q}
          industry={category}
          jobRole={role}
        />
        {params.role && !role && (
          <p role="status" className="mt-3 text-sm">
            The role filter was reset. Choose a role for this industry.
          </p>
        )}
      </section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {q || category || role
            ? "Matching opportunities"
            : "Latest opportunities"}
        </h2>
        {(q || category || role) && (
          <Link href="/jobs" className="text-sm underline">
            Clear filters
          </Link>
        )}
      </div>
      {error ? (
        <div role="alert" className="rounded-xl border p-6">
          We couldn’t load jobs. Please try again shortly.
        </div>
      ) : !jobs?.length ? (
        <div className="rounded-xl border bg-card p-8">
          <h3 className="font-medium">
            {q || category || role
              ? "No matching jobs yet"
              : "The next opportunity is on its way."}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {q || category || role
              ? "Try another keyword or clear the filters."
              : "We’re inviting our first Portland businesses. Check back soon."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
      <nav
        aria-label="Job pages"
        className="flex items-center justify-between text-sm"
      >
        {page > 1 ? (
          <Link className="underline" href={href(page - 1)}>
            Previous
          </Link>
        ) : (
          <span />
        )}
        <span>Page {page}</span>
        {count != null && page * size < count ? (
          <Link className="underline" href={href(page + 1)}>
            Next
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
