import { createClient } from "@/lib/supabase/server";
import { JobCard } from "@/components/shared/job-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Salon Jobs | SalonJobs",
  description:
    "Find booth rental, commission, salary, and hourly positions at salons near you.",
};

export default async function JobListingPage() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("job_posts")
    .select(
      "id, title, city, state, job_type, experience_level, category, pay_range_low, pay_range_high, posted_at, employer_profiles(salon_name, logo_url)"
    )
    .eq("status", "active")
    .order("posted_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Salon Jobs</h1>
        <p className="text-muted-foreground">
          Find your next position in the beauty industry
        </p>
      </div>
      {!jobs || jobs.length === 0 ? (
        <p className="text-muted-foreground">
          No jobs posted yet. Check back soon!
        </p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
