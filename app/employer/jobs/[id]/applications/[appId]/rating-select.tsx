"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationRating } from "@/actions/applications";
export function RatingSelect({
  applicationId,
  initial,
}: {
  applicationId: string;
  initial: number | null;
}) {
  const [value, setValue] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Private rating
        <select
          aria-label="Private rating"
          disabled={pending}
          value={value ?? ""}
          className="ml-3 rounded-md border bg-background p-2"
          onChange={async (e) => {
            const rating =
              e.target.value === "" ? null : Number(e.target.value);
            setPending(true);
            setError("");
            try {
              const result = await updateApplicationRating(
                applicationId,
                rating,
              );
              if (result.error) setError(result.error);
              else {
                setValue(rating);
                router.refresh();
              }
            } catch {
              setError("Unable to save rating. Please retry.");
            } finally {
              setPending(false);
            }
          }}
        >
          <option value="">Unrated</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} / 5
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-muted-foreground">
        Only your business can see this. Independent of interview status.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
