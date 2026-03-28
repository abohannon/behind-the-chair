"use client";

import { useActionState, useState } from "react";
import { createJobPost } from "@/actions/job-posts";
import type { JobPostState } from "@/actions/job-posts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORIES,
  SPECIALTIES,
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  type Category,
} from "@/lib/constants/categories";

export default function NewJobPostPage() {
  const [state, formAction, pending] = useActionState<JobPostState, FormData>(
    createJobPost,
    null
  );

  const [selectedCategory, setSelectedCategory] = useState<Category | "">("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const availableSpecialties = selectedCategory
    ? SPECIALTIES[selectedCategory] ?? []
    : [];

  function handleCategoryChange(value: string) {
    setSelectedCategory(value as Category);
    setSelectedSpecialties([]);
  }

  function toggleSpecialty(specialty: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Post a Job</h1>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Fill in the details for your job posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input id="title" name="title" required />
              {state?.fieldErrors?.title && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" name="description" rows={5} required />
              {state?.fieldErrors?.description && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Type *</Label>
                <Select name="jobType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state?.fieldErrors?.jobType && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.jobType}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select name="experienceLevel" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state?.fieldErrors?.experienceLevel && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.experienceLevel}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                name="category"
                required
                onValueChange={handleCategoryChange}
                value={selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.fieldErrors?.category && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.category}
                </p>
              )}
            </div>

            {availableSpecialties.length > 0 && (
              <div className="space-y-2">
                <Label>Specialties</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSpecialties.map((specialty) => {
                    const isSelected = selectedSpecialties.includes(specialty);
                    return (
                      <Badge
                        key={specialty}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSpecialty(specialty)}
                      >
                        {specialty}
                      </Badge>
                    );
                  })}
                </div>
                {state?.fieldErrors?.specialties && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.specialties}
                  </p>
                )}
              </div>
            )}

            {/* Hidden inputs for specialties */}
            {selectedSpecialties.map((s) => (
              <input key={s} type="hidden" name="specialties" value={s} />
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" name="city" required />
                {state?.fieldErrors?.city && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.city}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input id="state" name="state" required />
                {state?.fieldErrors?.state && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.state}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payRangeLow">Pay Range Low ($)</Label>
                <Input
                  id="payRangeLow"
                  name="payRangeLow"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 35"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payRangeHigh">Pay Range High ($)</Label>
                <Input
                  id="payRangeHigh"
                  name="payRangeHigh"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50"
                />
              </div>
            </div>

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Creating..." : "Create Job Post"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
