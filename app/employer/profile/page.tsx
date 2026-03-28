"use client";

import { useActionState, useRef, useState } from "react";
import { upsertEmployerProfile, uploadLogo } from "@/actions/employer-profile";
import type { EmployerProfileState, UploadLogoState } from "@/actions/employer-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EmployerProfilePage() {
  const [profileState, profileAction, profilePending] = useActionState<
    EmployerProfileState,
    FormData
  >(upsertEmployerProfile, null);

  const [logoState, logoAction, logoPending] = useActionState<
    UploadLogoState,
    FormData
  >(uploadLogo, null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("logo", file);
      logoAction(formData);
    }
  }

  const displayLogo = logoState?.logoUrl ?? logoPreview;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Employer Profile</h1>

      {/* Logo Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Salon Logo</CardTitle>
          <CardDescription>Upload your salon logo (JPEG, PNG, or WebP, max 5MB)</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar size="lg" className="size-20">
            {displayLogo ? (
              <AvatarImage src={displayLogo} alt="Salon logo" />
            ) : null}
            <AvatarFallback className="text-lg">S</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={logoPending}
            >
              {logoPending ? "Uploading..." : "Upload Logo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
            {logoState?.error && (
              <p className="text-sm text-destructive">{logoState.error}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Salon Details</CardTitle>
          <CardDescription>Tell job seekers about your salon</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
            {profileState?.error && (
              <p className="text-sm text-destructive">{profileState.error}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="salonName">Salon Name *</Label>
              <Input id="salonName" name="salonName" required />
              {profileState?.fieldErrors?.salonName && (
                <p className="text-sm text-destructive">
                  {profileState.fieldErrors.salonName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationCity">City *</Label>
                <Input id="locationCity" name="locationCity" required />
                {profileState?.fieldErrors?.locationCity && (
                  <p className="text-sm text-destructive">
                    {profileState.fieldErrors.locationCity}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationState">State *</Label>
                <Input id="locationState" name="locationState" required />
                {profileState?.fieldErrors?.locationState && (
                  <p className="text-sm text-destructive">
                    {profileState.fieldErrors.locationState}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                required
              />
              {profileState?.fieldErrors?.description && (
                <p className="text-sm text-destructive">
                  {profileState.fieldErrors.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                placeholder="https://example.com"
              />
              {profileState?.fieldErrors?.websiteUrl && (
                <p className="text-sm text-destructive">
                  {profileState.fieldErrors.websiteUrl}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramHandle">Instagram Handle</Label>
              <Input
                id="instagramHandle"
                name="instagramHandle"
                placeholder="@yoursalon"
              />
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
