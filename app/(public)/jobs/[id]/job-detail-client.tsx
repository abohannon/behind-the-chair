"use client";

import { useState } from "react";
import { ApplyButton } from "@/components/shared/apply-button";

interface JobDetailClientProps {
  jobId: string;
  userId: string | null;
  userRole: string | null;
  profileComplete: boolean;
  hasApplied: boolean;
  isOwnJob: boolean;
  hasResume: boolean;
}

export function JobDetailClient({
  jobId,
  userId,
  userRole,
  profileComplete,
  hasApplied: initialHasApplied,
  isOwnJob,
}: JobDetailClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(initialHasApplied);

  return (
    <>
      <ApplyButton
        jobId={jobId}
        userId={userId}
        userRole={userRole}
        profileComplete={profileComplete}
        hasApplied={hasApplied}
        isOwnJob={isOwnJob}
        onApply={() => setSheetOpen(true)}
      />
      {/* ApplicationSheet will be added in Phase 6 */}
      {sheetOpen && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Application form coming in Phase 6
        </p>
      )}
    </>
  );
}
