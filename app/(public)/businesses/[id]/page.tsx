/* eslint-disable @next/next/no-img-element -- Public business-managed Supabase images. */
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { websiteSchema } from "@/lib/validation/alpha";
import { JobCard } from "@/components/shared/job-card";
import {
  WEEKDAYS,
  hoursSchema,
  formatBusinessTime,
} from "@/lib/validation/business";
import { MapPin, ArrowUpRight, Scissors } from "lucide-react";
const getBusiness = cache(async (id: string) => {
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employer_profiles")
    .select(
      "id,salon_name,description,logo_url,photos,website_url,instagram_handle,location_city,location_state,street_address,operating_hours",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Unable to load this business. Please try again.");
  if (!data) notFound();
  return data;
});
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await getBusiness((await params).id);
  const url = new URL(`/businesses/${b.id}`, process.env.NEXT_PUBLIC_APP_URL!);
  const photos = Array.isArray(b.photos)
    ? b.photos.filter((p): p is string => typeof p === "string")
    : [];
  const image = photos[0] ?? b.logo_url;
  const title = `${b.salon_name} · Portland | Behind the Chair`;
  const description = b.description.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(image ? { images: [{ url: image, alt: b.salon_name }] } : {}),
    },
  };
}
export default async function BusinessPage({ params }: Props) {
  const business = await getBusiness((await params).id);
  const supabase = await createClient();
  const { data: jobs, error } = await supabase
    .from("job_posts")
    .select("*,employer_profiles(salon_name,logo_url)")
    .eq("employer_id", business.id)
    .eq("status", "active")
    .order("posted_at", { ascending: false })
    .order("id");
  const website = websiteSchema.safeParse(business.website_url ?? "");
  const instagram =
    business.instagram_handle &&
    /^[a-zA-Z0-9._]{1,30}$/.test(business.instagram_handle.replace(/^@/, ""))
      ? business.instagram_handle.replace(/^@/, "")
      : null;
  const photos = Array.isArray(business.photos)
    ? business.photos.filter((p): p is string => typeof p === "string")
    : [];
  const parsed = hoursSchema.safeParse(business.operating_hours ?? {});
  const hours = parsed.success ? parsed.data : {};
  return (
    <div className="space-y-8">
      <Link href="/jobs" className="text-sm text-muted-foreground underline">
        Explore Portland jobs
      </Link>
      <section className="overflow-hidden rounded-2xl border bg-card">
        {photos[0] ? (
          <img
            src={photos[0]}
            alt={`${business.salon_name} cover photo`}
            className="h-56 w-full object-cover sm:h-80"
            fetchPriority="high"
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-secondary sm:h-56">
            <Scissors
              className="h-12 w-12 text-primary/40"
              aria-hidden="true"
            />
          </div>
        )}
        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            {business.logo_url ? (
              <img
                className="h-16 w-16 shrink-0 rounded-xl border bg-background object-cover sm:h-20 sm:w-20"
                src={business.logo_url}
                alt={`${business.salon_name} logo`}
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl font-semibold"
              >
                {business.salon_name[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="eyebrow">MEET YOUR NEXT WORKPLACE</p>
              <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
                {business.salon_name}
              </h1>
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {business.location_city}, {business.location_state}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a
              href="#open-positions"
              className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
            >
              View open positions
            </a>
            {website.success && website.data && (
              <a
                href={website.success ? website.data : ""}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm underline"
              >
                Website
                <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
            {instagram && (
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm underline"
              >
                Instagram
                <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 rounded-xl border bg-card p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold">About the business</h2>
          <p className="whitespace-pre-wrap break-words text-muted-foreground">
            {business.description}
          </p>
        </section>
        <aside className="space-y-6 rounded-xl border bg-card p-6">
          <div>
            <h2 className="font-semibold">Location</h2>
            {business.street_address && (
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                {business.street_address}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {business.location_city}, {business.location_state}
            </p>
          </div>
          <div>
            <h2 className="font-semibold">Business hours</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Portland local time
            </p>
            {Object.keys(hours).length ? (
              <dl className="mt-3 space-y-2 text-sm">
                {WEEKDAYS.map((day) => {
                  const entry = hours[day];
                  return (
                    <div
                      className="flex flex-wrap justify-between gap-x-2"
                      key={day}
                    >
                      <dt>{day}</dt>
                      <dd className="text-muted-foreground">
                        {!entry
                          ? "Not specified"
                          : entry.state === "closed"
                            ? "Closed"
                            : `${formatBusinessTime(entry.opens)}–${formatBusinessTime(entry.closes)}`}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Hours not specified. Contact the business for details.
              </p>
            )}
          </div>
        </aside>
      </div>
      {photos.length > 1 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Inside {business.salon_name}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {photos.slice(1).map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`${business.salon_name} gallery photo ${i + 2}`}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </section>
      )}
      <section id="open-positions" className="scroll-mt-6 space-y-4">
        <h2 className="text-2xl font-semibold">Open positions</h2>
        {error ? (
          <p role="alert" className="rounded-xl border p-6">
            We couldn’t load open positions. Please refresh and try again.
          </p>
        ) : jobs?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-8">
            <p className="font-medium">No open positions right now</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back for future opportunities with {business.salon_name}.
            </p>
            <Link className="mt-4 inline-block text-sm underline" href="/jobs">
              Browse other Portland jobs
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
