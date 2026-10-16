"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

interface ApplyButtonProps {
  jobId: string;
  userId: string | null;
  userRole: string | null;
  profileComplete: boolean;
  hasApplied: boolean;
  isOwnJob: boolean;
  onApply: () => void;
}

export function ApplyButton({
  jobId,
  userId,
  userRole,
  profileComplete,
  hasApplied,
  isOwnJob,
  onApply,
}: ApplyButtonProps) {
  const router = useRouter();

  // Employer viewing their own job
  if (userRole === "employer" && isOwnJob) {
    return (
      <Button variant="outline" disabled className="w-full">
        This is your listing
      </Button>
    );
  }

  // Employer viewing someone else's job
  if (userRole === "employer") return null;

  // Already applied
  if (hasApplied) {
    return (
      <Button variant="outline" disabled className="w-full">
        <CheckCircle className="mr-2 h-4 w-4" />
        Already Applied
      </Button>
    );
  }

  // Not logged in
  if (!userId) {
    return (
      <Button
        className="w-full"
        onClick={() => router.push(`/login?returnTo=/jobs/${jobId}`)}
      >
        Apply Now
      </Button>
    );
  }

  // Profile incomplete
  if (userRole === "seeker" && !profileComplete) {
    return (
      <Button
        className="w-full"
        onClick={() => router.push(`/seeker/profile?returnTo=/jobs/${jobId}`)}
      >
        Apply Now
      </Button>
    );
  }

  // Ready to apply
  return (
    <Button className="w-full" onClick={onApply}>
      Apply Now
    </Button>
  );
}
