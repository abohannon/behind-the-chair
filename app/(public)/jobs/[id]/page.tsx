import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Globe, AtSign } from "lucide-react";
import { formatCompensation, formatRelativeDate } from "@/lib/utils";
import { JOB_TYPES, EXPERIENCE_LEVELS } from "@/lib/constants/categories";
import { JobDetailClient } from "./job-detail-client";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("job_posts")
    .select("title, city, state, category, employer_profiles(salon_name)")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!job) {
    return { title: "Job Not Found | Behind the Chair" };
  }

  const salonName = job.employer_profiles?.salon_name ?? "a salon";
  const title = `${job.title} at ${salonName} | Behind the Chair`;
  const description = `${job.title} - ${job.category} position at ${salonName} in ${job.city}, ${job.state}. Apply now on Behind the Chair.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("job_posts")
    .select(
      "*, employer_profiles(id, salon_name, logo_url, description, location_city, location_state, website_url, instagram_handle, photos)",
    )
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!job) {
    notFound();
  }

  const jobTypeLabel =
    JOB_TYPES.find((t) => t.value === job.job_type)?.label ?? job.job_type;
  const expLabel =
    EXPERIENCE_LEVELS.find((l) => l.value === job.experience_level)?.label ??
    job.experience_level;

  // Determine apply button state
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: string | null = null;
  let profileComplete = false;
  let hasApplied = false;
  let isOwnJob = false;
  let contact = { name: "", email: user?.email ?? "", phone: "" };

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, profile_complete, full_name")
      .eq("id", user.id)
      .single();
    userRole = profile?.role ?? null;
    contact.name = profile?.full_name ?? "";
    profileComplete = profile?.profile_complete ?? false;

    if (userRole === "seeker") {
      const { data: seekerProfile } = await supabase
        .from("seeker_profiles")
        .select("id, contact_email, phone")
        .eq("user_id", user.id)
        .single();
      if (seekerProfile) {
        contact = {
          ...contact,
          email: seekerProfile.contact_email ?? contact.email,
          phone: seekerProfile.phone ?? "",
        };
        const { data: application } = await supabase
          .from("applications")
          .select("id")
          .eq("job_post_id", id)
          .eq("seeker_id", seekerProfile.id)
          .single();
        hasApplied = !!application;
      }
    }

    if (userRole === "employer") {
      const { data: empProfile } = await supabase
        .from("employer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      isOwnJob = empProfile?.id === job.employer_id;
    }
  }

  const specialties = Array.isArray(job.specialties)
    ? (job.specialties as string[])
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="space-y-6 lg:col-span-2">
        {/* Job header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage
                  src={job.employer_profiles?.logo_url ?? undefined}
                />
                <AvatarFallback className="text-lg">
                  {job.employer_profiles?.salon_name?.[0] ?? "S"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <CardTitle role="heading" aria-level={1} className="text-xl">
                  {job.title}
                </CardTitle>
                <p className="text-muted-foreground">
                  {job.employer_profiles?.salon_name}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{job.category}</Badge>
              <Badge variant="outline">{jobTypeLabel}</Badge>
              <Badge variant="outline">{expLabel}</Badge>
              {specialties.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.city}, {job.state}
              </span>
              {(job.pay_range_low || job.pay_range_high) && (
                <span>{formatCompensation(job)}</span>
              )}
              {job.posted_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelativeDate(job.posted_at)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job description */}
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-muted-foreground">
              {job.description}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Apply button */}
        <Card>
          <CardContent className="pt-6">
            <JobDetailClient
              jobId={id}
              userId={user?.id ?? null}
              userRole={userRole}
              profileComplete={profileComplete}
              hasApplied={hasApplied}
              isOwnJob={isOwnJob}
              contact={contact}
            />
          </CardContent>
        </Card>

        {/* Salon info */}
        {job.employer_profiles && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                About {job.employer_profiles.salon_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.isArray(job.employer_profiles.photos) &&
                job.employer_profiles.photos
                  .filter((url): url is string => typeof url === "string")
                  .map((url, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt={`${job.employer_profiles?.salon_name} photo ${index + 1}`}
                      className="aspect-video w-full rounded-lg object-cover"
                    />
                  ))}
              {job.employer_profiles.description && (
                <p className="text-sm text-muted-foreground">
                  {job.employer_profiles.description}
                </p>
              )}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.employer_profiles.location_city},{" "}
                  {job.employer_profiles.location_state}
                </p>
                {job.employer_profiles.website_url && (
                  <a
                    href={job.employer_profiles.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
                {job.employer_profiles.instagram_handle && (
                  <a
                    href={`https://instagram.com/${job.employer_profiles.instagram_handle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline"
                  >
                    <AtSign className="h-3.5 w-3.5" />
                    {job.employer_profiles.instagram_handle}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
