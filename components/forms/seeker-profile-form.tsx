"use client";
import { startTransition, useActionState } from "react";
import { upsertSeekerProfile } from "@/actions/seeker-profile";
import type { Tables } from "@/lib/types/database";
import { ALL_SPECIALTIES } from "@/lib/constants/categories";
export function SeekerProfileForm({
  initial,
  fullName,
  email,
  returnTo,
}: {
  initial: Tables<"seeker_profiles"> | null;
  fullName: string;
  email: string;
  returnTo: string | null;
}) {
  const [state, action, pending] = useActionState(
    upsertSeekerProfile.bind(null, returnTo),
    {},
  );
  const fields = [
    ["fullName", "Full name", fullName, "text", true],
    ["email", "Contact email", initial?.contact_email ?? email, "email", true],
    ["phone", "Phone number", initial?.phone ?? "", "tel", true],
    ["headline", "Headline", initial?.headline ?? "", "text", false],
    ["city", "City", initial?.city ?? "", "text", false],
    ["state", "State", initial?.state ?? "", "text", false],
    [
      "instagramHandle",
      "Instagram (optional)",
      initial?.instagram_handle ?? "",
      "text",
      false,
    ],
    [
      "portfolioUrl",
      "Portfolio URL",
      initial?.portfolio_url ?? "",
      "url",
      false,
    ],
    [
      "yearsExperience",
      "Years of experience",
      initial?.years_experience ?? "",
      "number",
      false,
    ],
  ] as const;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-5 rounded-xl border bg-card p-6"
    >
      {fields.map(([name, label, value, type, required]) => (
        <label className="block text-sm font-medium" key={name}>
          {label}
          {required ? " *" : ""}
          <input
            className="mt-2 w-full rounded-md border bg-background p-3"
            name={name}
            type={type}
            required={required}
            defaultValue={value}
            min={type === "number" ? 0 : undefined}
            max={type === "number" ? 100 : undefined}
          />
        </label>
      ))}
      <label className="block text-sm font-medium">
        About you
        <textarea
          className="mt-2 w-full rounded-md border p-3"
          name="bio"
          rows={4}
          maxLength={5000}
          defaultValue={initial?.bio ?? ""}
        />
      </label>
      <fieldset>
        <legend className="mb-3 text-sm font-medium">
          Specialties (optional)
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ALL_SPECIALTIES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="specialties"
                value={s}
                defaultChecked={
                  Array.isArray(initial?.specialties) &&
                  initial.specialties.includes(s)
                }
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="openToWork"
          defaultChecked={initial?.open_to_work ?? true}
        />
        Open to work
      </label>
      <p className="text-sm text-muted-foreground">
        Your contact details are shared with businesses you apply to. You’ll
        attach a tailored resume when applying to each job.
      </p>
      {state.error && (
        <p role="alert" className="text-destructive">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
