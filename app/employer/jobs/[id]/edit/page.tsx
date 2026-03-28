"use client";

import { useActionState, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { updateJobPost } from "@/actions/job-posts";
import type { JobPostState } from "@/actions/job-posts";
import { createClient } from "@/lib/supabase/client";
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
import Link from "next/link";

export default function EditJobPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const boundAction = updateJobPost.bind(null, id);
  const [state, formAction, pending] = useActionState<JobPostState, FormData>(
    boundAction,
    null
  );

  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | "">("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [formDefaults, setFormDefaults] = useState<{
    title: string;
    description: string;
    jobType: string;
    experienceLevel: string;
    city: string;
    state: string;
    payRangeLow: string;
    payRangeHigh: string;
  } | null>(null);

  useEffect(() => {
    async function fetchJob() {
      const supabase = createClient();
      const { data: job } = await supabase
        .from("job_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (!job) {
        router.push("/employer/dashboard");
        return;
      }

      setFormDefaults({
        title: job.title,
        description: job.description,
        jobType: job.job_type,
        experienceLevel: job.experience_level,
        city: job.city,
        state: job.state,
        payRangeLow: job.pay_range_low ? (job.pay_range_low / 100).toString() : "",
        payRangeHigh: job.pay_range_high ? (job.pay_range_high / 100).toString() : "",
      });
      setSelectedCategory((job.category as Category) || "");
      setSelectedSpecialties((job.specialties as string[]) ?? []);
      setLoading(false);
    }
    fetchJob();
  }, [id, router]);

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

  if (loading || !formDefaults) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/employer/dashboard"
        className="text-sm text-muted-foreground hover:underline"
      >
        &larr; Back to Dashboard
      </Link>

      <h1 className="mt-4 mb-6 text-2xl font-bold">Edit Job Post</h1>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Update your job posting details</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={formDefaults.title}
              />
              {state?.fieldErrors?.title && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                required
                defaultValue={formDefaults.description}
              />
              {state?.fieldErrors?.description && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Type *</Label>
                <Select name="jobType" required defaultValue={formDefaults.jobType}>
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
                <Select
                  name="experienceLevel"
                  required
                  defaultValue={formDefaults.experienceLevel}
                >
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
                <Input
                  id="city"
                  name="city"
                  required
                  defaultValue={formDefaults.city}
                />
                {state?.fieldErrors?.city && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.city}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  required
                  defaultValue={formDefaults.state}
                />
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
                  defaultValue={formDefaults.payRangeLow}
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
                  defaultValue={formDefaults.payRangeHigh}
                />
              </div>
            </div>

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
