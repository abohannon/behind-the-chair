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
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Globe } from "lucide-react";

export default async function SeekerProfilePage({
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

  // Verify the caller is an employer
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "employer") notFound();

  // Fetch seeker profile with base profile
  const { data: seeker } = await supabase
    .from("seeker_profiles")
    .select(
      "id, user_id, headline, city, state, specialties, years_experience, bio, resume_url, portfolio_url, instagram_handle, profiles(full_name, avatar_url)"
    )
    .eq("id", id)
    .single();
  if (!seeker) notFound();

  const baseProfile = seeker.profiles as any;
  const name = baseProfile?.full_name ?? "Unknown";
  const avatarUrl = baseProfile?.avatar_url;
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const specialties = (seeker.specialties as string[]) ?? [];

  // Generate signed URL for resume
  let resumeUrl: string | null = null;
  if (seeker.resume_url) {
    const { data: signedUrl } = await supabase.storage
      .from("resumes")
      .createSignedUrl(seeker.resume_url, 3600);
    resumeUrl = signedUrl?.signedUrl ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/employer/dashboard"
        className="text-sm text-muted-foreground hover:underline"
      >
        &larr; Back to Dashboard
      </Link>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl ?? undefined} alt={name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>
              {seeker.headline && <>{seeker.headline}</>}
              {seeker.city && seeker.state && (
                <>
                  {seeker.headline ? " · " : ""}
                  {seeker.city}, {seeker.state}
                </>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Specialties */}
          {specialties.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Specialties</p>
              <div className="flex flex-wrap gap-1">
                {specialties.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Years Experience */}
          {seeker.years_experience != null && (
            <div>
              <p className="text-sm font-medium">Experience</p>
              <p className="text-sm text-muted-foreground">
                {seeker.years_experience} year
                {seeker.years_experience !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Bio */}
          {seeker.bio && (
            <div>
              <p className="text-sm font-medium">About</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {seeker.bio}
              </p>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            {resumeUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download Resume
                </a>
              </Button>
            )}

            {seeker.portfolio_url && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={seeker.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Portfolio
                </a>
              </Button>
            )}

            {seeker.instagram_handle && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://instagram.com/${seeker.instagram_handle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  {seeker.instagram_handle}
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
