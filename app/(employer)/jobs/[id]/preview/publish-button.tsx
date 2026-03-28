"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PublishButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    setLoading(true);
    const result = await createCheckoutSession(jobId);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    if (result.url) {
      window.location.href = result.url;
    }
  }

  return (
    <Button className="w-full" onClick={handlePublish} disabled={loading}>
      {loading ? "Redirecting to checkout..." : "Publish for $39"}
    </Button>
  );
}
