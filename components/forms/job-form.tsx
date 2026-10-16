"use client";
import { startTransition, useActionState, useState } from "react";
import { createJobPost, updateJobPost } from "@/actions/job-posts";
import {
  CATEGORIES,
  SPECIALTIES,
  type Category,
} from "@/lib/constants/categories";
import type { Tables } from "@/lib/types/database";
export function JobForm({ initial }: { initial?: Tables<"job_posts"> }) {
  const [result, action, pending] = useActionState(
    initial ? updateJobPost.bind(null, initial.id) : createJobPost,
    {},
  );
  const [category, setCategory] = useState<Category>(
    (initial?.category as Category) || "Hair",
  );
  const [arrangement, setArrangement] = useState(
    initial?.arrangement ?? "employment",
  );
  const input = "mt-2 w-full rounded-md border bg-background p-3";
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-5 rounded-xl border bg-card p-6"
    >
      <label className="block text-sm font-medium">
        Job title *
        <input
          className={input}
          name="title"
          required
          maxLength={200}
          defaultValue={initial?.title ?? ""}
          placeholder="e.g. Hair stylist"
        />
      </label>
      <label className="block text-sm font-medium">
        Description *
        <textarea
          className={input}
          name="description"
          rows={7}
          required
          maxLength={20000}
          defaultValue={initial?.description ?? ""}
          placeholder="Tell applicants about the role, your team, and what you're looking for."
        />
      </label>
      <p className="text-sm text-muted-foreground">
        Portland, Oregon · Free posting during our private alpha
      </p>
      <label className="block text-sm font-medium">
        Industry
        <select
          className={input}
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <fieldset key={category}>
        <legend className="text-sm font-medium">Specialties (optional)</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {SPECIALTIES[category]?.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="specialties"
                value={s}
                defaultChecked={
                  initial?.category === category &&
                  Array.isArray(initial.specialties) &&
                  initial.specialties.includes(s)
                }
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium">
        Experience level
        <select
          className={input}
          name="experienceLevel"
          defaultValue={initial?.experience_level ?? "entry"}
        >
          <option value="entry">Entry level / all experience welcome</option>
          <option value="mid">Mid level</option>
          <option value="senior">Senior</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Arrangement
        <select
          className={input}
          name="arrangement"
          value={arrangement}
          onChange={(e) => setArrangement(e.target.value)}
        >
          <option value="employment">Employment</option>
          <option value="booth_rental">Booth rental</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Schedule
        <select
          className={input}
          name="schedule"
          defaultValue={initial?.schedule ?? "flexible"}
        >
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="flexible">Flexible / discuss with business</option>
        </select>
      </label>
      <fieldset key={arrangement} className="space-y-4">
        <legend className="text-sm font-medium">
          {arrangement === "booth_rental" ? "Booth rent" : "Compensation"}{" "}
          (optional)
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Minimum ($)
            <input
              className={input}
              name="payRangeLow"
              type="number"
              min={0}
              step="0.01"
              defaultValue={
                initial?.pay_range_low != null
                  ? initial.pay_range_low / 100
                  : ""
              }
            />
          </label>
          <label className="text-sm">
            Maximum ($)
            <input
              className={input}
              name="payRangeHigh"
              type="number"
              min={0}
              step="0.01"
              defaultValue={
                initial?.pay_range_high != null
                  ? initial.pay_range_high / 100
                  : ""
              }
            />
          </label>
        </div>
        <label className="block text-sm">
          Rate unit
          <select
            className={input}
            name="payUnit"
            defaultValue={
              initial?.arrangement === arrangement
                ? (initial.pay_unit ?? "")
                : ""
            }
          >
            <option value="">Discuss with business</option>
            {arrangement === "employment" ? (
              <>
                <option value="hour">Per hour</option>
                <option value="year">Per year</option>
              </>
            ) : (
              <>
                <option value="week">Per week</option>
                <option value="month">Per month</option>
              </>
            )}
          </select>
        </label>
        {arrangement === "employment" ? (
          <label className="block text-sm">
            Commission (%)
            <input
              className={input}
              name="commissionPercent"
              type="number"
              min={0}
              max={100}
              step="0.01"
              defaultValue={initial?.commission_percent ?? ""}
            />
          </label>
        ) : (
          <input type="hidden" name="commissionPercent" value="" />
        )}
      </fieldset>
      {result.error && (
        <p role="alert" className="text-destructive">
          {result.error}
        </p>
      )}
      <button
        disabled={pending}
        className="rounded-md bg-primary px-5 py-3 text-primary-foreground"
      >
        {pending ? "Saving…" : initial ? "Save changes" : "Create draft"}
      </button>
    </form>
  );
}
