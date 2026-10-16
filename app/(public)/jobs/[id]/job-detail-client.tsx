"use client";
import { useState } from "react";
import { ApplyButton } from "@/components/shared/apply-button";
import { ApplicationSheet } from "@/components/shared/application-sheet";
export function JobDetailClient({
  jobId,
  userId,
  userRole,
  profileComplete,
  hasApplied: initialApplied,
  isOwnJob,
  contact,
}: {
  jobId: string;
  userId: string | null;
  userRole: string | null;
  profileComplete: boolean;
  hasApplied: boolean;
  isOwnJob: boolean;
  contact: { name: string; email: string; phone: string };
}) {
  const [open, setOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(initialApplied);
  return (
    <>
      <ApplyButton
        jobId={jobId}
        userId={userId}
        userRole={userRole}
        profileComplete={profileComplete}
        hasApplied={hasApplied}
        isOwnJob={isOwnJob}
        onApply={() => setOpen(true)}
      />
      {hasApplied && (
        <p role="status" className="mt-3 text-sm">
          Application submitted. Track it in My Applications.
        </p>
      )}
      <ApplicationSheet
        jobId={jobId}
        contact={contact}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => setHasApplied(true)}
      />
    </>
  );
}
