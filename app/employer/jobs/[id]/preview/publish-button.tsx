"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setJobStatus } from "@/actions/job-posts";
import { Button } from "@/components/ui/button";
export function PublishButton({
  jobId,
  status = "draft",
}: {
  jobId: string;
  status?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <div>
      <Button
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const result = await setJobStatus(
            jobId,
            status === "active" ? "closed" : "active",
          );
          setLoading(false);
          if (result.error) setError(result.error);
          else router.refresh();
        }}
      >
        {loading
          ? "Saving…"
          : status === "active"
            ? "Close listing"
            : status === "closed"
              ? "Reopen listing"
              : "Publish job · Free"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
