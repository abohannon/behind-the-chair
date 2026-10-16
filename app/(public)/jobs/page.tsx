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
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 120);
  const category = CATEGORIES.find((c) => c === params.category) ?? "";
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
    .rpc("search_jobs", { keyword: q, industry: category }, { count: "exact" })
    .select("*,employer_profiles(salon_name,logo_url)")
    .order("posted_at", { ascending: false })
    .order("id")
    .range((page - 1) * size, page * size - 1);
  function href(next: number) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
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
        <form className="mt-8 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
          <label className="text-sm font-medium">
            Keyword
            <input
              name="q"
              defaultValue={q}
              maxLength={120}
              placeholder="Role, skill, or business"
              className="mt-2 w-full rounded-md border bg-background p-3"
            />
          </label>
          <label className="text-sm font-medium">
            Industry
            <select
              name="category"
              defaultValue={category}
              className="mt-2 w-full rounded-md border bg-background p-3"
            >
              <option value="">All industries</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button className="self-end rounded-md bg-primary px-6 py-3 text-primary-foreground">
            Find jobs
          </button>
        </form>
      </section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {q || category ? "Matching opportunities" : "Latest opportunities"}
        </h2>
        {(q || category) && (
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
            {q || category
              ? "No matching jobs yet"
              : "The next opportunity is on its way."}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {q || category
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
