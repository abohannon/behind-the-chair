"use client";
import { useState } from "react";
import { WEEKDAYS, hoursSchema } from "@/lib/validation/business";
import type { Json } from "@/lib/types/database";
export function BusinessHoursEditor({ initial }: { initial: Json | null }) {
  const parsed = hoursSchema.safeParse(initial ?? {});
  const hours = parsed.success ? parsed.data : {};
  const [states, setStates] = useState<Record<string, string>>(
    Object.fromEntries(
      WEEKDAYS.map((day) => [day, hours[day]?.state ?? "unspecified"]),
    ),
  );
  return (
    <fieldset className="space-y-4">
      <legend className="font-medium">
        Business operating hours (optional)
      </legend>
      <p className="text-sm text-muted-foreground">
        Public hours in Portland time. One interval per day; split shifts and
        overnight hours are not supported yet. These are separate from a job’s
        work schedule.
      </p>
      {WEEKDAYS.map((day) => {
        const entry = hours[day];
        return (
          <div
            key={day}
            className="grid gap-2 rounded-lg border p-3 sm:grid-cols-3"
          >
            <label className="text-sm">
              {day}
              <select
                aria-label={`${day} hours`}
                className="mt-1 w-full rounded border bg-background p-2"
                name={`${day}-state`}
                value={states[day]}
                onChange={(e) =>
                  setStates({ ...states, [day]: e.target.value })
                }
              >
                <option value="unspecified">Not specified</option>
                <option value="closed">Closed</option>
                <option value="open">Open</option>
              </select>
            </label>
            {states[day] === "open" && (
              <>
                <label className="text-sm">
                  Opens
                  <input
                    aria-label={`${day} opens`}
                    className="mt-1 w-full min-w-0 rounded border p-2"
                    type="time"
                    name={`${day}-opens`}
                    required
                    defaultValue={
                      entry?.state === "open" ? entry.opens : "09:00"
                    }
                  />
                </label>
                <label className="text-sm">
                  Closes
                  <input
                    aria-label={`${day} closes`}
                    className="mt-1 w-full min-w-0 rounded border p-2"
                    type="time"
                    name={`${day}-closes`}
                    required
                    defaultValue={
                      entry?.state === "open" ? entry.closes : "17:00"
                    }
                  />
                </label>
              </>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
