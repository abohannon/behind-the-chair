"use client";

import { useState } from "react";
import { ApplyButton } from "@/components/shared/apply-button";
import { ApplicationSheet } from "@/components/shared/application-sheet";

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
  hasResume,
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
      <ApplicationSheet
        jobId={jobId}
        hasResume={hasResume}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={() => setHasApplied(true)}
      />
    </>
  );
}
