"use client";
import { useState } from "react";
import { CATEGORIES } from "@/lib/constants/categories";
import { JOB_ROLES, roleMatchesIndustry } from "@/lib/constants/job-roles";
export function JobSearchForm({
  keyword,
  industry,
  jobRole,
}: {
  keyword: string;
  industry: string;
  jobRole: string;
}) {
  const [category, setCategory] = useState(industry);
  const [role, setRole] = useState(jobRole);
  const [notice, setNotice] = useState("");
  const input = "mt-2 w-full rounded-md border bg-background p-3";
  return (
    <form action="/jobs" className="mt-8 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.2fr_auto]">
        <label className="text-sm font-medium">
          Keyword
          <input
            name="q"
            defaultValue={keyword}
            maxLength={120}
            placeholder="Role, skill, or business"
            className={input}
          />
        </label>
        <label className="text-sm font-medium">
          Industry
          <select
            name="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (role && !roleMatchesIndustry(role, e.target.value)) {
                setRole("");
                setNotice("Role filter reset for the selected industry.");
              } else setNotice("");
            }}
            className={input}
          >
            <option value="">All industries</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Role
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={input}
          >
            <option value="">All roles</option>
            {JOB_ROLES.filter((r) =>
              roleMatchesIndustry(r.value, category),
            ).map((r) => (
              <option value={r.value} key={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <button className="self-end rounded-md bg-primary px-6 py-3 text-primary-foreground">
          Find jobs
        </button>
      </div>
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
    </form>
  );
}
