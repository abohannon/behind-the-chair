"use client";

import { Suspense, useActionState, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { upsertSeekerProfile, uploadResume } from "@/actions/seeker-profile";
import type { SeekerProfileState } from "@/actions/seeker-profile";
import { CATEGORIES, SPECIALTIES } from "@/lib/constants/categories";
import type { Category } from "@/lib/constants/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function SeekerProfileForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [profileState, profileAction, profilePending] = useActionState<
    SeekerProfileState,
    FormData
  >(upsertSeekerProfile.bind(null, returnTo), null);

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [resumeUploading, startResumeTransition] = useTransition();
  const [resumeStatus, setResumeStatus] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleSpecialty(specialty: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  }

  function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    startResumeTransition(async () => {
      const result = await uploadResume(formData);
      if (result.error) {
        setResumeError(result.error);
        setResumeStatus(null);
      } else {
        setResumeError(null);
        setResumeStatus("Resume uploaded successfully");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Seeker Profile</h1>

      {/* Resume Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <CardDescription>Upload your resume (PDF only, max 10MB)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={resumeUploading}
          >
            {resumeUploading ? "Uploading..." : "Upload Resume"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleResumeChange}
          />
          {resumeError && (
            <p className="text-sm text-destructive">{resumeError}</p>
          )}
          {resumeStatus && (
            <p className="text-sm text-green-600">{resumeStatus}</p>
          )}
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Tell employers about yourself</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
            {profileState?.error && (
              <p className="text-sm text-destructive">{profileState.error}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" name="fullName" required />
              {profileState?.fieldErrors?.fullName && (
                <p className="text-sm text-destructive">
                  {profileState.fieldErrors.fullName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" name="city" required />
                {profileState?.fieldErrors?.city && (
                  <p className="text-sm text-destructive">
                    {profileState.fieldErrors.city}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input id="state" name="state" required />
                {profileState?.fieldErrors?.state && (
                  <p className="text-sm text-destructive">
                    {profileState.fieldErrors.state}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specialties *</Label>
              <p className="text-sm text-muted-foreground">
                Select at least one specialty
              </p>
              {CATEGORIES.map((category) => (
                <div key={category} className="space-y-1.5">
                  <h4 className="text-sm font-medium">{category}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {SPECIALTIES[category as Category].map((specialty) => (
                      <Badge
                        key={specialty}
                        variant={
                          selectedSpecialties.includes(specialty)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleSpecialty(specialty)}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {selectedSpecialties.map((s) => (
                <input key={s} type="hidden" name="specialties" value={s} />
              ))}
              {profileState?.fieldErrors?.specialties && (
                <p className="text-sm text-destructive">
                  {profileState.fieldErrors.specialties}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                name="headline"
                placeholder="e.g. Experienced Colorist & Balayage Specialist"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                name="yearsExperience"
                type="number"
                min={0}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolioUrl">Portfolio URL</Label>
              <Input
                id="portfolioUrl"
                name="portfolioUrl"
                type="url"
                placeholder="https://example.com"
              />
              {profileState?.fieldErrors?.portfolioUrl && (
                <p className="text-sm text-destructive">
                  {profileState.fieldErrors.portfolioUrl}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramHandle">Instagram Handle</Label>
              <Input
                id="instagramHandle"
                name="instagramHandle"
                placeholder="@yourhandle"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="openToWork"
                name="openToWork"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="openToWork" className="cursor-pointer">
                Open to work
              </Label>
            </div>

            <Button type="submit" disabled={profilePending} className="w-full">
              {profilePending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SeekerProfilePage() {
  return (
    <Suspense>
      <SeekerProfileForm />
    </Suspense>
  );
}
